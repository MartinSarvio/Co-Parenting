import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const childrenRouter = Router();

// GET / - List children for the current user's household(s)
childrenRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const memberships = await prisma.householdMember.findMany({
      where: { userId: req.userId },
      select: { householdId: true },
    });

    const householdIds = memberships.map((m) => m.householdId);

    const children = await prisma.child.findMany({
      where: { householdId: { in: householdIds } },
      include: {
        parent1: { select: { id: true, name: true, avatar: true } },
        parent2: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json(children);
  } catch (error) {
    console.error('Error listing children:', error);
    res.status(500).json({ error: 'Kunne ikke hente børn' });
  }
});

// POST / - Create child
childrenRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      birthDate,
      avatar,
      parent1Id,
      parent2Id,
      householdId,
      institutionName,
      institutionType,
      allergies,
      medications,
    } = req.body;

    if (!name || !birthDate || !parent1Id || !parent2Id || !householdId) {
      res.status(400).json({ error: 'Navn, fødselsdato, forældre og husstand er påkrævet' });
      return;
    }

    // Verify the user belongs to the household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: { userId: req.userId!, householdId },
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'Du er ikke medlem af denne husstand' });
      return;
    }

    const child = await prisma.child.create({
      data: {
        name,
        birthDate: new Date(birthDate),
        avatar,
        parent1Id,
        parent2Id,
        householdId,
        institutionName,
        institutionType,
        allergies: allergies || [],
        medications: medications || [],
      },
      include: {
        parent1: { select: { id: true, name: true, avatar: true } },
        parent2: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.status(201).json(child);
  } catch (error) {
    console.error('Error creating child:', error);
    res.status(500).json({ error: 'Kunne ikke oprette barn' });
  }
});

// PATCH /:id - Update child
childrenRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.child.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) {
      res.status(404).json({ error: 'Barn ikke fundet' });
      return;
    }

    const {
      name,
      birthDate,
      avatar,
      institutionName,
      institutionType,
      allergies,
      medications,
    } = req.body;

    const child = await prisma.child.update({
      where: { id: req.params.id as string },
      data: {
        ...(name !== undefined && { name }),
        ...(birthDate !== undefined && { birthDate: new Date(birthDate) }),
        ...(avatar !== undefined && { avatar }),
        ...(institutionName !== undefined && { institutionName }),
        ...(institutionType !== undefined && { institutionType }),
        ...(allergies !== undefined && { allergies }),
        ...(medications !== undefined && { medications }),
      },
      include: {
        parent1: { select: { id: true, name: true, avatar: true } },
        parent2: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.json(child);
  } catch (error) {
    console.error('Error updating child:', error);
    res.status(500).json({ error: 'Kunne ikke opdatere barn' });
  }
});

// DELETE /:id - Delete child
childrenRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.child.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) {
      res.status(404).json({ error: 'Barn ikke fundet' });
      return;
    }

    await prisma.child.delete({
      where: { id: req.params.id as string },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting child:', error);
    res.status(500).json({ error: 'Kunne ikke slette barn' });
  }
});
