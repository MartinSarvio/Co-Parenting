import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const keyDatesRouter = Router();

// GET all key dates added by current user
keyDatesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const keyDates = await prisma.keyDate.findMany({
      where: { addedBy: req.userId },
      orderBy: { date: 'asc' },
    });
    res.json(keyDates);
  } catch (error) {
    console.error('Fejl ved hentning af nøgledatoer:', error);
    res.status(500).json({ error: 'Kunne ikke hente nøgledatoer' });
  }
});

// POST create a new key date
keyDatesRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { childId, title, date, type, recurrence, reminderDaysBefore, notes } = req.body;

    if (!title || !date || !type) {
      return res.status(400).json({
        error: 'Titel, dato og type er påkrævet',
      });
    }

    const keyDate = await prisma.keyDate.create({
      data: {
        childId: childId || null,
        title,
        date: new Date(date),
        type,
        recurrence: recurrence || 'once',
        reminderDaysBefore: reminderDaysBefore !== undefined ? reminderDaysBefore : 7,
        notes: notes || null,
        addedBy: req.userId!,
      },
    });

    res.status(201).json(keyDate);
  } catch (error) {
    console.error('Fejl ved oprettelse af nøgledato:', error);
    res.status(500).json({ error: 'Kunne ikke oprette nøgledato' });
  }
});

// PATCH update a key date
keyDatesRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { childId, title, date, type, recurrence, reminderDaysBefore, notes } = req.body;

    const existing = await prisma.keyDate.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Nøgledato ikke fundet' });
    }

    const keyDate = await prisma.keyDate.update({
      where: { id },
      data: {
        ...(childId !== undefined && { childId }),
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(type !== undefined && { type }),
        ...(recurrence !== undefined && { recurrence }),
        ...(reminderDaysBefore !== undefined && { reminderDaysBefore }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json(keyDate);
  } catch (error) {
    console.error('Fejl ved opdatering af nøgledato:', error);
    res.status(500).json({ error: 'Kunne ikke opdatere nøgledato' });
  }
});

// DELETE a key date
keyDatesRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.keyDate.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Nøgledato ikke fundet' });
    }

    await prisma.keyDate.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Fejl ved sletning af nøgledato:', error);
    res.status(500).json({ error: 'Kunne ikke slette nøgledato' });
  }
});
