import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const expensesRouter = Router();

// GET / - List expenses
expensesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: {
        OR: [
          { paidBy: req.userId },
          { splitWith: { has: req.userId } },
        ],
      },
      include: {
        payer: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { date: 'desc' },
    });

    res.json(expenses);
  } catch (error) {
    console.error('Error listing expenses:', error);
    res.status(500).json({ error: 'Kunne ikke hente udgifter' });
  }
});

// POST / - Create expense
expensesRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      amount,
      currency,
      category,
      splitWith,
      splitAmounts,
      splitType,
      date,
      receiptUrl,
      isRecurring,
    } = req.body;

    if (!title || amount === undefined || !category || !date) {
      res.status(400).json({ error: 'Titel, beløb, kategori og dato er påkrævet' });
      return;
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        description,
        amount,
        currency: currency || 'DKK',
        category,
        paidBy: req.userId!,
        splitWith: splitWith || [],
        splitAmounts: splitAmounts || {},
        splitType: splitType || 'equal',
        date: new Date(date),
        receiptUrl,
        isRecurring: isRecurring || false,
      },
      include: {
        payer: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Kunne ikke oprette udgift' });
  }
});

// PATCH /:id - Update expense
expensesRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.expense.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) {
      res.status(404).json({ error: 'Udgift ikke fundet' });
      return;
    }

    const {
      title,
      description,
      amount,
      currency,
      category,
      splitWith,
      splitAmounts,
      splitType,
      date,
      receiptUrl,
      status,
      isRecurring,
    } = req.body;

    const expense = await prisma.expense.update({
      where: { id: req.params.id as string },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount }),
        ...(currency !== undefined && { currency }),
        ...(category !== undefined && { category }),
        ...(splitWith !== undefined && { splitWith }),
        ...(splitAmounts !== undefined && { splitAmounts }),
        ...(splitType !== undefined && { splitType }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(receiptUrl !== undefined && { receiptUrl }),
        ...(status !== undefined && { status }),
        ...(isRecurring !== undefined && { isRecurring }),
      },
      include: {
        payer: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Kunne ikke opdatere udgift' });
  }
});

// POST /:id/approve - Approve expense
expensesRouter.post('/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.expense.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) {
      res.status(404).json({ error: 'Udgift ikke fundet' });
      return;
    }

    // Don't allow approving your own expense
    if (existing.paidBy === req.userId) {
      res.status(400).json({ error: 'Du kan ikke godkende din egen udgift' });
      return;
    }

    // Check if already approved by this user
    if (existing.approvedBy.includes(req.userId!)) {
      res.status(409).json({ error: 'Du har allerede godkendt denne udgift' });
      return;
    }

    const updatedApprovedBy = [...existing.approvedBy, req.userId!];

    // If all splitWith users have approved, mark as approved
    const allApproved = existing.splitWith.every((userId) =>
      updatedApprovedBy.includes(userId)
    );

    const expense = await prisma.expense.update({
      where: { id: req.params.id as string },
      data: {
        approvedBy: updatedApprovedBy,
        status: allApproved ? 'approved' : existing.status,
      },
      include: {
        payer: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.json(expense);
  } catch (error) {
    console.error('Error approving expense:', error);
    res.status(500).json({ error: 'Kunne ikke godkende udgift' });
  }
});

// DELETE /:id - Delete expense
expensesRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.expense.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) {
      res.status(404).json({ error: 'Udgift ikke fundet' });
      return;
    }

    await prisma.expense.delete({
      where: { id: req.params.id as string },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Kunne ikke slette udgift' });
  }
});
