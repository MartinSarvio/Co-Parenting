import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const decisionsRouter = Router();

// GET all decisions proposed by current user
decisionsRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const decisions = await prisma.decisionLog.findMany({
      where: { proposedBy: req.userId },
      include: { child: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(decisions);
  } catch (error) {
    console.error('Fejl ved hentning af beslutninger:', error);
    res.status(500).json({ error: 'Kunne ikke hente beslutninger' });
  }
});

// POST create a new decision
decisionsRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { childId, title, description, category, decidedAt, notes } = req.body;

    if (!title || !description || !category || !decidedAt) {
      return res.status(400).json({
        error: 'Titel, beskrivelse, kategori og beslutningsdato er påkrævet',
      });
    }

    const decision = await prisma.decisionLog.create({
      data: {
        childId: childId || null,
        title,
        description,
        category,
        decidedAt: new Date(decidedAt),
        proposedBy: req.userId!,
        notes: notes || null,
      },
      include: { child: true },
    });

    res.status(201).json(decision);
  } catch (error) {
    console.error('Fejl ved oprettelse af beslutning:', error);
    res.status(500).json({ error: 'Kunne ikke oprette beslutning' });
  }
});

// POST approve a decision
decisionsRouter.post('/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.decisionLog.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Beslutning ikke fundet' });
    }

    const alreadyApproved = existing.approvedBy.includes(req.userId!);
    if (alreadyApproved) {
      return res.status(400).json({ error: 'Du har allerede godkendt denne beslutning' });
    }

    const decision = await prisma.decisionLog.update({
      where: { id },
      data: {
        approvedBy: {
          push: req.userId!,
        },
      },
      include: { child: true },
    });

    res.json(decision);
  } catch (error) {
    console.error('Fejl ved godkendelse af beslutning:', error);
    res.status(500).json({ error: 'Kunne ikke godkende beslutning' });
  }
});

// PATCH update a decision
decisionsRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { childId, title, description, category, decidedAt, status, notes } = req.body;

    const existing = await prisma.decisionLog.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Beslutning ikke fundet' });
    }

    const decision = await prisma.decisionLog.update({
      where: { id },
      data: {
        ...(childId !== undefined && { childId }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(decidedAt !== undefined && { decidedAt: new Date(decidedAt) }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: { child: true },
    });

    res.json(decision);
  } catch (error) {
    console.error('Fejl ved opdatering af beslutning:', error);
    res.status(500).json({ error: 'Kunne ikke opdatere beslutning' });
  }
});

// DELETE a decision
decisionsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.decisionLog.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Beslutning ikke fundet' });
    }

    await prisma.decisionLog.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Fejl ved sletning af beslutning:', error);
    res.status(500).json({ error: 'Kunne ikke slette beslutning' });
  }
});
