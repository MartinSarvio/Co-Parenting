import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const documentsRouter = Router();

// GET / - List documents
documentsRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { uploadedBy: req.userId },
          { sharedWith: { has: req.userId } },
        ],
      },
      include: {
        uploader: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(documents);
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ error: 'Kunne ikke hente dokumenter' });
  }
});

// POST / - Create document
documentsRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      type,
      url,
      sharedWith,
      isOfficial,
      validFrom,
      validUntil,
    } = req.body;

    if (!title || !type || !url) {
      res.status(400).json({ error: 'Titel, type og URL er påkrævet' });
      return;
    }

    const document = await prisma.document.create({
      data: {
        title,
        type,
        url,
        uploadedBy: req.userId!,
        sharedWith: sharedWith || [],
        isOfficial: isOfficial || false,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
      include: {
        uploader: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Kunne ikke oprette dokument' });
  }
});

// DELETE /:id - Delete document
documentsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.document.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) {
      res.status(404).json({ error: 'Dokument ikke fundet' });
      return;
    }

    // Only the uploader can delete the document
    if (existing.uploadedBy !== req.userId) {
      res.status(403).json({ error: 'Kun den der uploadede dokumentet kan slette det' });
      return;
    }

    await prisma.document.delete({
      where: { id: req.params.id as string },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Kunne ikke slette dokument' });
  }
});
