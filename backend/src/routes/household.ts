import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const householdRouter = Router();

// GET / - Get current user's household(s)
householdRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const memberships = await prisma.householdMember.findMany({
      where: { userId: req.userId },
      include: {
        household: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true, email: true, role: true, color: true },
                },
              },
            },
            children: {
              select: { id: true, name: true, birthDate: true, avatar: true },
            },
          },
        },
      },
    });

    const households = memberships.map((m) => m.household);

    res.json(households);
  } catch (error) {
    console.error('Error fetching households:', error);
    res.status(500).json({ error: 'Kunne ikke hente husstand' });
  }
});

// POST / - Create household
householdRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, familyMode } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Navn er påkrævet' });
      return;
    }

    const household = await prisma.household.create({
      data: {
        name,
        familyMode: familyMode || 'co_parenting',
        members: {
          create: {
            userId: req.userId!,
            role: 'parent',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true, role: true, color: true },
            },
          },
        },
      },
    });

    res.status(201).json(household);
  } catch (error) {
    console.error('Error creating household:', error);
    res.status(500).json({ error: 'Kunne ikke oprette husstand' });
  }
});

// PATCH /:id - Update household
householdRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Verify user is a member
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: { userId: req.userId!, householdId: req.params.id as string },
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'Du er ikke medlem af denne husstand' });
      return;
    }

    const { name, familyMode, caseNumber } = req.body;

    const household = await prisma.household.update({
      where: { id: req.params.id as string },
      data: {
        ...(name !== undefined && { name }),
        ...(familyMode !== undefined && { familyMode }),
        ...(caseNumber !== undefined && { caseNumber }),
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true, role: true, color: true },
            },
          },
        },
      },
    });

    res.json(household);
  } catch (error) {
    console.error('Error updating household:', error);
    res.status(500).json({ error: 'Kunne ikke opdatere husstand' });
  }
});

// POST /:id/invite - Invite member to household
householdRouter.post('/:id/invite', async (req: AuthRequest, res: Response) => {
  try {
    // Verify the current user is a member of this household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: { userId: req.userId!, householdId: req.params.id as string },
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'Du er ikke medlem af denne husstand' });
      return;
    }

    const { email, role } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email er påkrævet' });
      return;
    }

    // Find the user to invite
    const invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      res.status(404).json({ error: 'Bruger med denne email blev ikke fundet' });
      return;
    }

    // Check if already a member
    const existingMembership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: { userId: invitedUser.id, householdId: req.params.id as string },
      },
    });

    if (existingMembership) {
      res.status(409).json({ error: 'Brugeren er allerede medlem af denne husstand' });
      return;
    }

    // Add the user to the household
    const newMember = await prisma.householdMember.create({
      data: {
        userId: invitedUser.id,
        householdId: req.params.id as string,
        role: role || 'parent',
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, email: true, role: true, color: true },
        },
      },
    });

    res.status(201).json(newMember);
  } catch (error) {
    console.error('Error inviting member:', error);
    res.status(500).json({ error: 'Kunne ikke invitere medlem' });
  }
});
