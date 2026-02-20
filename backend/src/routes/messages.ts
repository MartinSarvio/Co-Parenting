import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const messagesRouter = Router();

// GET /threads - List message threads for the current user
messagesRouter.get('/threads', async (req: AuthRequest, res: Response) => {
  try {
    const threads = await prisma.messageThread.findMany({
      where: {
        participants: { has: req.userId },
        NOT: { deletedBy: { has: req.userId } },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Last message preview
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(threads);
  } catch (error) {
    console.error('Error listing threads:', error);
    res.status(500).json({ error: 'Kunne ikke hente samtaletråde' });
  }
});

// POST /threads - Create a new thread
messagesRouter.post('/threads', async (req: AuthRequest, res: Response) => {
  try {
    const { title, participants, childId } = req.body;

    if (!title || !participants || !Array.isArray(participants)) {
      res.status(400).json({ error: 'Titel og deltagere er påkrævet' });
      return;
    }

    // Ensure the current user is included in participants
    const allParticipants = participants.includes(req.userId)
      ? participants
      : [req.userId, ...participants];

    const thread = await prisma.messageThread.create({
      data: {
        title,
        participants: allParticipants,
        childId: childId || null,
      },
    });

    res.status(201).json(thread);
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ error: 'Kunne ikke oprette samtaletråd' });
  }
});

// GET /threads/:threadId/messages - Get messages in a thread
messagesRouter.get('/threads/:threadId/messages', async (req: AuthRequest, res: Response) => {
  try {
    const thread = await prisma.messageThread.findUnique({
      where: { id: req.params.threadId as string },
    });

    if (!thread) {
      res.status(404).json({ error: 'Samtaletråd ikke fundet' });
      return;
    }

    // Check the user is a participant
    if (!thread.participants.includes(req.userId!)) {
      res.status(403).json({ error: 'Du er ikke deltager i denne samtale' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: {
        threadId: req.params.threadId as string,
        NOT: { deletedBy: { has: req.userId } },
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Kunne ikke hente beskeder' });
  }
});

// POST /threads/:threadId/messages - Send a message in a thread
messagesRouter.post('/threads/:threadId/messages', async (req: AuthRequest, res: Response) => {
  try {
    const thread = await prisma.messageThread.findUnique({
      where: { id: req.params.threadId as string },
    });

    if (!thread) {
      res.status(404).json({ error: 'Samtaletråd ikke fundet' });
      return;
    }

    if (!thread.participants.includes(req.userId!)) {
      res.status(403).json({ error: 'Du er ikke deltager i denne samtale' });
      return;
    }

    const { content, attachments } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Beskedindhold er påkrævet' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: req.userId!,
        threadId: req.params.threadId as string,
        readBy: [req.userId!],
        attachments: attachments || undefined,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Update thread's updatedAt timestamp
    await prisma.messageThread.update({
      where: { id: req.params.threadId as string },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Kunne ikke sende besked' });
  }
});

// DELETE /threads/:threadId - Soft-delete thread (add userId to deletedBy)
messagesRouter.delete('/threads/:threadId', async (req: AuthRequest, res: Response) => {
  try {
    const thread = await prisma.messageThread.findUnique({
      where: { id: req.params.threadId as string },
    });

    if (!thread) {
      res.status(404).json({ error: 'Samtaletråd ikke fundet' });
      return;
    }

    if (!thread.participants.includes(req.userId!)) {
      res.status(403).json({ error: 'Du er ikke deltager i denne samtale' });
      return;
    }

    // Soft-delete by adding user to deletedBy array
    const updatedDeletedBy = [...thread.deletedBy, req.userId!];

    await prisma.messageThread.update({
      where: { id: req.params.threadId as string },
      data: { deletedBy: updatedDeletedBy },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting thread:', error);
    res.status(500).json({ error: 'Kunne ikke slette samtaletråd' });
  }
});
