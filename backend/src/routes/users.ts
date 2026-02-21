import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const usersRouter = Router();

// GET / - List users in the same household as the current user
usersRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    // Find all households the current user belongs to
    const memberships = await prisma.householdMember.findMany({
      where: { userId: req.userId },
      select: { householdId: true },
    });

    const householdIds = memberships.map((m) => m.householdId);

    if (householdIds.length === 0) {
      res.json([]);
      return;
    }

    // Find all users who share a household with the current user
    const coMembers = await prisma.householdMember.findMany({
      where: { householdId: { in: householdIds } },
      select: { userId: true },
    });

    const userIds = [...new Set(coMembers.map((m) => m.userId))];

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        color: true,
        phone: true,
        createdAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Kunne ikke hente brugere' });
  }
});

// GET /:id - Get user by ID
usersRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
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
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Bruger ikke fundet' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Kunne ikke hente bruger' });
  }
});

// PATCH /:id - Update user profile (name, avatar, phone, color)
usersRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Users can only update their own profile
    if (req.params.id !== req.userId) {
      res.status(403).json({ error: 'Du kan kun opdatere din egen profil' });
      return;
    }

    const { name, avatar, phone, color } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: {
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar }),
        ...(phone !== undefined && { phone }),
        ...(color !== undefined && { color }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        color: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Kunne ikke opdatere bruger' });
  }
});

// POST /device-token - Register push notification device token
usersRouter.post('/device-token', async (req: AuthRequest, res: Response) => {
  try {
    const { token, platform } = req.body;

    if (!token || !platform) {
      res.status(400).json({ error: 'Token and platform required' });
      return;
    }

    await prisma.deviceToken.upsert({
      where: { token },
      create: {
        userId: req.userId!,
        token,
        platform,
      },
      update: {
        userId: req.userId!,
        platform,
        updatedAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error registering device token:', error);
    res.status(500).json({ error: 'Kunne ikke registrere device token' });
  }
});
