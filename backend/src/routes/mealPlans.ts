import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const mealPlansRouter = Router();

// GET / - List meal plans (with ?date= filter)
mealPlansRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;

    const where: Record<string, unknown> = {
      createdBy: req.userId,
    };

    if (date) {
      where.date = date as string;
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { mealType: 'asc' },
      ],
    });

    res.json(mealPlans);
  } catch (error) {
    console.error('Error listing meal plans:', error);
    res.status(500).json({ error: 'Kunne ikke hente madplaner' });
  }
});

// POST / - Create meal plan
mealPlansRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { date, mealType, title, notes, recipe } = req.body;

    if (!date || !mealType || !title) {
      res.status(400).json({ error: 'Dato, måltidstype og titel er påkrævet' });
      return;
    }

    const mealPlan = await prisma.mealPlan.create({
      data: {
        date,
        mealType,
        title,
        notes,
        createdBy: req.userId!,
        recipe: recipe || undefined,
      },
    });

    res.status(201).json(mealPlan);
  } catch (error) {
    console.error('Error creating meal plan:', error);
    res.status(500).json({ error: 'Kunne ikke oprette madplan' });
  }
});

// PATCH /:id - Update meal plan
mealPlansRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.mealPlan.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) {
      res.status(404).json({ error: 'Madplan ikke fundet' });
      return;
    }

    const { date, mealType, title, notes, recipe } = req.body;

    const mealPlan = await prisma.mealPlan.update({
      where: { id: req.params.id as string },
      data: {
        ...(date !== undefined && { date }),
        ...(mealType !== undefined && { mealType }),
        ...(title !== undefined && { title }),
        ...(notes !== undefined && { notes }),
        ...(recipe !== undefined && { recipe }),
      },
    });

    res.json(mealPlan);
  } catch (error) {
    console.error('Error updating meal plan:', error);
    res.status(500).json({ error: 'Kunne ikke opdatere madplan' });
  }
});

// DELETE /:id - Delete meal plan
mealPlansRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.mealPlan.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) {
      res.status(404).json({ error: 'Madplan ikke fundet' });
      return;
    }

    await prisma.mealPlan.delete({
      where: { id: req.params.id as string },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    res.status(500).json({ error: 'Kunne ikke slette madplan' });
  }
});
