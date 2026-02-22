import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

export const adminRouter = Router();

// Middleware: check ADMIN_SECRET header
function requireAdminSecret(req: Request, res: Response, next: () => void) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    res.status(503).json({ error: 'Admin-funktion er ikke konfigureret (ADMIN_SECRET mangler)' });
    return;
  }
  const provided = req.headers['x-admin-secret'];
  if (provided !== secret) {
    res.status(403).json({ error: 'Ugyldig admin-nøgle' });
    return;
  }
  next();
}

// Middleware: check user is admin (via JWT + isAdmin flag)
async function requireAdmin(req: Request & { user?: { userId: string; role: string } }, res: Response, next: () => void) {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Ikke logget ind' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  if (!user?.isAdmin) {
    res.status(403).json({ error: 'Kun admins har adgang' });
    return;
  }
  next();
}

// POST /api/admin/promote
// Protected by ADMIN_SECRET header — promotes a user to admin by email
// Call this once to make yourself admin, then use JWT-based admin endpoints
adminRouter.post('/promote', requireAdminSecret, async (req: Request, res: Response) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ugyldig email' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    res.status(404).json({ error: `Ingen bruger fundet med email: ${parsed.data.email}` });
    return;
  }

  const updated = await prisma.user.update({
    where: { email: parsed.data.email },
    data: { isAdmin: true },
    select: { id: true, email: true, name: true, isAdmin: true, role: true },
  });

  res.json({ message: `${updated.name} er nu admin`, user: updated });
});

// GET /api/admin/users
// Requires: JWT auth + isAdmin = true
// Lists all users
adminRouter.get('/users', authenticate, async (req: Request & { user?: { userId: string; role: string } }, res: Response) => {
  await requireAdmin(req as Request & { user?: { userId: string; role: string } }, res, async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ users });
  });
});

const createUserSchema = z.object({
  email: z.string().email('Ugyldig email'),
  password: z.string().min(6, 'Adgangskode skal være mindst 6 tegn'),
  name: z.string().min(1, 'Navn er påkrævet'),
  role: z.enum(['parent', 'guardian', 'professional']).default('parent'),
  isAdmin: z.boolean().default(false),
});

// POST /api/admin/users
// Requires: JWT auth + isAdmin = true
// Creates a new user (admin can specify role and isAdmin)
adminRouter.post('/users', authenticate, async (req: Request & { user?: { userId: string; role: string } }, res: Response) => {
  await requireAdmin(req as Request & { user?: { userId: string; role: string } }, res, async () => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { email, password, name, role, isAdmin } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email er allerede registreret' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        isAdmin,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    res.status(201).json({ message: `Bruger ${user.name} oprettet`, user });
  });
});

// POST /api/admin/make-admin
// Requires: JWT auth + isAdmin = true
// Promotes another user to admin by email
adminRouter.post('/make-admin', authenticate, async (req: Request & { user?: { userId: string; role: string } }, res: Response) => {
  await requireAdmin(req as Request & { user?: { userId: string; role: string } }, res, async () => {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Ugyldig email' });
      return;
    }

    const target = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!target) {
      res.status(404).json({ error: `Ingen bruger fundet med email: ${parsed.data.email}` });
      return;
    }

    const updated = await prisma.user.update({
      where: { email: parsed.data.email },
      data: { isAdmin: true },
      select: { id: true, email: true, name: true, isAdmin: true },
    });

    res.json({ message: `${updated.name} er nu admin`, user: updated });
  });
});

// DELETE /api/admin/users/:id
// Requires: JWT auth + isAdmin = true
// Anonymizes personal data
adminRouter.delete('/users/:id', authenticate, async (req: Request & { user?: { userId: string; role: string } }, res: Response) => {
  await requireAdmin(req as Request & { user?: { userId: string; role: string } }, res, async () => {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user?.userId) {
      res.status(400).json({ error: 'Du kan ikke slette dig selv' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: id as string } });
    if (!user) {
      res.status(404).json({ error: 'Bruger ikke fundet' });
      return;
    }

    const anonymizedEmail = `deleted-${id}@anonymized.local`;

    // Anonymize personal data
    await prisma.user.update({
      where: { id: id as string },
      data: {
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
    await prisma.deviceToken.deleteMany({ where: { userId: id as string } });

    res.json({ message: `Bruger ${user.name} er slettet og anonymiseret` });
  });
});

