import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email('Ugyldig email'),
  password: z.string().min(6, 'Adgangskode skal være mindst 6 tegn'),
  name: z.string().min(1, 'Navn er påkrævet'),
  role: z.enum(['parent', 'guardian', 'professional']).default('parent'),
  color: z.enum(['warm', 'cool', 'neutral']).default('warm'),
});

const loginSchema = z.object({
  email: z.string().email('Ugyldig email'),
  password: z.string().min(1, 'Adgangskode er påkrævet'),
});

function generateToken(userId: string, role: string): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.sign({ userId, role }, secret, { expiresIn: '7d' });
}

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const emailLower = data.email.toLowerCase().trim();

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      res.status(409).json({ error: 'Email er allerede registreret' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // First user in the system becomes admin automatically
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Create user
    const user = await prisma.user.create({
      data: {
        email: emailLower,
        passwordHash,
        name: data.name,
        role: data.role,
        color: data.color,
        isAdmin: isFirstUser,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        color: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({ user, token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    throw err;
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const emailLower = data.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: emailLower } });
    if (!user) {
      res.status(401).json({ error: 'Forkert email eller adgangskode' });
      return;
    }

    // Block login for soft-deleted accounts
    if (user.deletedAt) {
      res.status(403).json({ error: 'Denne konto er slettet. Kontakt support hvis du mener det er en fejl.' });
      return;
    }

    const validPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: 'Forkert email eller adgangskode' });
      return;
    }

    const token = generateToken(user.id, user.role);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        color: user.color,
        isAdmin: user.isAdmin,
      },
      token,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    throw err;
  }
});

// GET /api/auth/me
authRouter.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Ikke logget ind' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const payload = jwt.verify(authHeader.split(' ')[1], secret) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        color: true,
        phone: true,
        professionalType: true,
        organization: true,
        isAdmin: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Bruger ikke fundet' });
      return;
    }

    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Ugyldig token' });
  }
});

// DELETE /api/auth/account
// Self-service account deletion (GDPR Art. 17 — ret til sletning)
// User requests their own account to be soft-deleted and anonymized
authRouter.delete('/account', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Ikke logget ind' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const payload = jwt.verify(authHeader.split(' ')[1], secret) as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(404).json({ error: 'Bruger ikke fundet' });
      return;
    }

    if (user.deletedAt) {
      res.status(400).json({ error: 'Konto er allerede slettet' });
      return;
    }

    const now = new Date();
    const anonymizedEmail = `deleted-${user.id}@anonymized.local`;

    // Soft-delete + anonymize personal data
    await prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt: now,
        anonymizedAt: now,
        deletionReason: 'self_request',
        email: anonymizedEmail,
        name: 'Slettet bruger',
        passwordHash: 'DELETED',
        avatar: null,
        phone: null,
        professionalType: null,
        organization: null,
      },
    });

    // Remove device tokens
    await prisma.deviceToken.deleteMany({ where: { userId: user.id } });

    res.json({
      message: 'Din konto er slettet og dine persondata er anonymiseret.',
      gdpr: {
        deletedAt: now.toISOString(),
        anonymized: true,
        retention: 'Anonymiserede poster opbevares i op til 5 år jf. dansk bogføringslov (§10 i bogføringsloven). Herefter slettes de permanent.',
      },
    });
  } catch {
    res.status(401).json({ error: 'Ugyldig token' });
  }
});
