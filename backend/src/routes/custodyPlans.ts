import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const custodyPlansRouter = Router();

// GET all custody plans for households the current user belongs to
custodyPlansRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    // Find all households the user is a member of
    const memberships = await prisma.householdMember.findMany({
      where: { userId: req.userId },
      select: { householdId: true },
    });

    const householdIds = memberships.map((m) => m.householdId);

    const plans = await prisma.custodyPlan.findMany({
      where: { householdId: { in: householdIds } },
      include: { child: true, household: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(plans);
  } catch (error) {
    console.error('Fejl ved hentning af samværsplaner:', error);
    res.status(500).json({ error: 'Kunne ikke hente samværsplaner' });
  }
});

// POST create a new custody plan
custodyPlansRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      pattern,
      startDate,
      childId,
      householdId,
      swapDay,
      swapTime,
      parent1Days,
      parent2Days,
      weeklySchedule,
      customWeekConfig,
      customSchedule,
      holidays,
      specialDays,
      agreementDate,
      agreementValidUntil,
      agreementText,
    } = req.body;

    if (!name || !pattern || !startDate || !childId || !householdId) {
      return res.status(400).json({
        error: 'Navn, mønster, startdato, barn og husstand er påkrævet',
      });
    }

    // Verify the user is a member of the household
    const membership = await prisma.householdMember.findFirst({
      where: {
        userId: req.userId,
        householdId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        error: 'Du er ikke medlem af denne husstand',
      });
    }

    const plan = await prisma.custodyPlan.create({
      data: {
        name,
        pattern,
        startDate: new Date(startDate),
        childId,
        householdId,
        swapDay: swapDay !== undefined ? swapDay : 4,
        swapTime: swapTime || '18:00',
        parent1Days: parent1Days || [],
        parent2Days: parent2Days || [],
        weeklySchedule: weeklySchedule || undefined,
        customWeekConfig: customWeekConfig || undefined,
        customSchedule: customSchedule || undefined,
        holidays: holidays || undefined,
        specialDays: specialDays || undefined,
        agreementDate: agreementDate ? new Date(agreementDate) : null,
        agreementValidUntil: agreementValidUntil ? new Date(agreementValidUntil) : null,
        agreementText: agreementText || null,
      },
      include: { child: true, household: true },
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error('Fejl ved oprettelse af samværsplan:', error);
    res.status(500).json({ error: 'Kunne ikke oprette samværsplan' });
  }
});

// PATCH update a custody plan
custodyPlansRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      name,
      pattern,
      startDate,
      childId,
      swapDay,
      swapTime,
      parent1Days,
      parent2Days,
      weeklySchedule,
      customWeekConfig,
      customSchedule,
      holidays,
      specialDays,
      agreementDate,
      agreementValidUntil,
      agreementText,
    } = req.body;

    const existing = await prisma.custodyPlan.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Samværsplan ikke fundet' });
    }

    // Verify the user is a member of the household
    const membership = await prisma.householdMember.findFirst({
      where: {
        userId: req.userId,
        householdId: existing.householdId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        error: 'Du er ikke medlem af denne husstand',
      });
    }

    const plan = await prisma.custodyPlan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(pattern !== undefined && { pattern }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(childId !== undefined && { childId }),
        ...(swapDay !== undefined && { swapDay }),
        ...(swapTime !== undefined && { swapTime }),
        ...(parent1Days !== undefined && { parent1Days }),
        ...(parent2Days !== undefined && { parent2Days }),
        ...(weeklySchedule !== undefined && { weeklySchedule }),
        ...(customWeekConfig !== undefined && { customWeekConfig }),
        ...(customSchedule !== undefined && { customSchedule }),
        ...(holidays !== undefined && { holidays }),
        ...(specialDays !== undefined && { specialDays }),
        ...(agreementDate !== undefined && {
          agreementDate: agreementDate ? new Date(agreementDate) : null,
        }),
        ...(agreementValidUntil !== undefined && {
          agreementValidUntil: agreementValidUntil ? new Date(agreementValidUntil) : null,
        }),
        ...(agreementText !== undefined && { agreementText }),
      },
      include: { child: true, household: true },
    });

    res.json(plan);
  } catch (error) {
    console.error('Fejl ved opdatering af samværsplan:', error);
    res.status(500).json({ error: 'Kunne ikke opdatere samværsplan' });
  }
});

// DELETE a custody plan
custodyPlansRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.custodyPlan.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Samværsplan ikke fundet' });
    }

    // Verify the user is a member of the household
    const membership = await prisma.householdMember.findFirst({
      where: {
        userId: req.userId,
        householdId: existing.householdId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        error: 'Du er ikke medlem af denne husstand',
      });
    }

    await prisma.custodyPlan.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    console.error('Fejl ved sletning af samværsplan:', error);
    res.status(500).json({ error: 'Kunne ikke slette samværsplan' });
  }
});
