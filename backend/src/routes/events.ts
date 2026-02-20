import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const eventsRouter = Router();

// GET / - List events (with optional date range query params ?start=&end=)
eventsRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { start, end } = req.query;

    const where: Record<string, unknown> = {
      createdBy: req.userId,
    };

    // Apply date range filter if provided
    if (start || end) {
      where.startDate = {};
      if (start) {
        (where.startDate as Record<string, unknown>).gte = new Date(start as string);
      }
      if (end) {
        (where.startDate as Record<string, unknown>).lte = new Date(end as string);
      }
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        child: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    res.json(events);
  } catch (error) {
    console.error('Error listing events:', error);
    res.status(500).json({ error: 'Kunne ikke hente begivenheder' });
  }
});

// POST / - Create event
eventsRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      type,
      childId,
      location,
      assignedTo,
      isRecurring,
    } = req.body;

    if (!title || !startDate || !endDate || !type) {
      res.status(400).json({ error: 'Titel, start, slut og type er påkrævet' });
      return;
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type,
        childId: childId || null,
        createdBy: req.userId!,
        location,
        assignedTo: assignedTo || [],
        isRecurring: isRecurring || false,
      },
      include: {
        child: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Kunne ikke oprette begivenhed' });
  }
});

// PATCH /:id - Update event
eventsRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.calendarEvent.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) {
      res.status(404).json({ error: 'Begivenhed ikke fundet' });
      return;
    }

    const {
      title,
      description,
      startDate,
      endDate,
      type,
      childId,
      location,
      assignedTo,
      isRecurring,
    } = req.body;

    const event = await prisma.calendarEvent.update({
      where: { id: req.params.id as string },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(type !== undefined && { type }),
        ...(childId !== undefined && { childId }),
        ...(location !== undefined && { location }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(isRecurring !== undefined && { isRecurring }),
      },
      include: {
        child: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Kunne ikke opdatere begivenhed' });
  }
});

// DELETE /:id - Delete event
eventsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.calendarEvent.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) {
      res.status(404).json({ error: 'Begivenhed ikke fundet' });
      return;
    }

    await prisma.calendarEvent.delete({
      where: { id: req.params.id as string },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Kunne ikke slette begivenhed' });
  }
});
