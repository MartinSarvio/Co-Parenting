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

    // Create user
    const user = await prisma.user.create({
      data: {
        email: emailLower,
        passwordHash,
        name: data.name,
        role: data.role,
        color: data.color,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        color: true,
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
