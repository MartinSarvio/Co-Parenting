import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const diaryRouter = Router();

// GET all diary entries written by current user
diaryRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const entries = await prisma.diaryEntry.findMany({
      where: { writtenBy: req.userId },
      include: { child: true },
      orderBy: { date: 'desc' },
    });
    res.json(entries);
  } catch (error) {
    console.error('Fejl ved hentning af dagbogsindlæg:', error);
    res.status(500).json({ error: 'Kunne ikke hente dagbogsindlæg' });
  }
});

// POST create a new diary entry
diaryRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { childId, date, mood, sleep, appetite, note } = req.body;

    if (!childId || !date || !mood || !sleep || !appetite) {
      return res.status(400).json({
        error: 'Barn, dato, humør, søvn og appetit er påkrævet',
      });
    }

    const entry = await prisma.diaryEntry.create({
      data: {
        childId,
        date: new Date(date),
        mood,
        sleep,
        appetite,
        note: note || null,
        writtenBy: req.userId!,
      },
      include: { child: true },
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Fejl ved oprettelse af dagbogsindlæg:', error);
    res.status(500).json({ error: 'Kunne ikke oprette dagbogsindlæg' });
  }
});

// PATCH update a diary entry
diaryRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { childId, date, mood, sleep, appetite, note } = req.body;

    const existing = await prisma.diaryEntry.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Dagbogsindlæg ikke fundet' });
    }

    const entry = await prisma.diaryEntry.update({
      where: { id },
      data: {
        ...(childId !== undefined && { childId }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(mood !== undefined && { mood }),
        ...(sleep !== undefined && { sleep }),
        ...(appetite !== undefined && { appetite }),
        ...(note !== undefined && { note }),
      },
      include: { child: true },
    });

    res.json(entry);
  } catch (error) {
    console.error('Fejl ved opdatering af dagbogsindlæg:', error);
    res.status(500).json({ error: 'Kunne ikke opdatere dagbogsindlæg' });
  }
});

// DELETE a diary entry
diaryRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.diaryEntry.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Dagbogsindlæg ikke fundet' });
    }

    await prisma.diaryEntry.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Fejl ved sletning af dagbogsindlæg:', error);
    res.status(500).json({ error: 'Kunne ikke slette dagbogsindlæg' });
  }
});
