import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const milestonesRouter = Router();

// GET all milestones added by current user
milestonesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const milestones = await prisma.milestone.findMany({
      where: { addedBy: req.userId },
      include: { child: true },
      orderBy: { date: 'desc' },
    });
    res.json(milestones);
  } catch (error) {
    console.error('Fejl ved hentning af milepæle:', error);
    res.status(500).json({ error: 'Kunne ikke hente milepæle' });
  }
});

// POST create a new milestone
milestonesRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { childId, title, description, date, category, photos } = req.body;

    if (!childId || !title || !date || !category) {
      return res.status(400).json({
        error: 'Barn, titel, dato og kategori er påkrævet',
      });
    }

    const milestone = await prisma.milestone.create({
      data: {
        childId,
        title,
        description: description || null,
        date: new Date(date),
        category,
        addedBy: req.userId!,
        photos: photos || [],
      },
      include: { child: true },
    });

    res.status(201).json(milestone);
  } catch (error) {
    console.error('Fejl ved oprettelse af milepæl:', error);
    res.status(500).json({ error: 'Kunne ikke oprette milepæl' });
  }
});

// PATCH update a milestone
milestonesRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { childId, title, description, date, category, photos } = req.body;

    const existing = await prisma.milestone.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Milepæl ikke fundet' });
    }

    const milestone = await prisma.milestone.update({
      where: { id },
      data: {
        ...(childId !== undefined && { childId }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(category !== undefined && { category }),
        ...(photos !== undefined && { photos }),
      },
      include: { child: true },
    });

    res.json(milestone);
  } catch (error) {
    console.error('Fejl ved opdatering af milepæl:', error);
    res.status(500).json({ error: 'Kunne ikke opdatere milepæl' });
  }
});

// DELETE a milestone
milestonesRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.milestone.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Milepæl ikke fundet' });
    }

    await prisma.milestone.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Fejl ved sletning af milepæl:', error);
    res.status(500).json({ error: 'Kunne ikke slette milepæl' });
  }
});
