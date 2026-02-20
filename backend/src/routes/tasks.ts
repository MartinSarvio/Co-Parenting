import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const tasksRouter = Router();

// GET / - List tasks (with ?completed=true/false filter)
tasksRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { completed } = req.query;

    const where: Record<string, unknown> = {
      OR: [
        { assignedTo: req.userId },
        { createdBy: req.userId },
      ],
    };

    if (completed !== undefined) {
      where.completed = completed === 'true';
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: [
        { completed: 'asc' },
        { deadline: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error listing tasks:', error);
    res.status(500).json({ error: 'Kunne ikke hente opgaver' });
  }
});

// POST / - Create task
tasksRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      assignedTo,
      deadline,
      category,
      isRecurring,
      plannedWeekday,
      area,
    } = req.body;

    if (!title || !assignedTo) {
      res.status(400).json({ error: 'Titel og ansvarlig er påkrævet' });
      return;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        assignedTo,
        createdBy: req.userId!,
        deadline: deadline ? new Date(deadline) : null,
        category: category || 'general',
        isRecurring: isRecurring || false,
        plannedWeekday,
        area,
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Kunne ikke oprette opgave' });
  }
});

// PATCH /:id - Update task (including marking completed)
tasksRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.task.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) {
      res.status(404).json({ error: 'Opgave ikke fundet' });
      return;
    }

    const {
      title,
      description,
      assignedTo,
      deadline,
      completed,
      category,
      isRecurring,
      plannedWeekday,
      area,
    } = req.body;

    // If marking as completed, set completedAt timestamp
    const completedAt =
      completed === true && !existing.completed
        ? new Date()
        : completed === false
          ? null
          : undefined;

    const task = await prisma.task.update({
      where: { id: req.params.id as string },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(completed !== undefined && { completed }),
        ...(completedAt !== undefined && { completedAt }),
        ...(category !== undefined && { category }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(plannedWeekday !== undefined && { plannedWeekday }),
        ...(area !== undefined && { area }),
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Kunne ikke opdatere opgave' });
  }
});

// DELETE /:id - Delete task
tasksRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.task.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) {
      res.status(404).json({ error: 'Opgave ikke fundet' });
      return;
    }

    await prisma.task.delete({
      where: { id: req.params.id as string },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Kunne ikke slette opgave' });
  }
});
