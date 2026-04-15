import { z } from 'zod';

const createDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const updateDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255)
  }),
  params: z.object({
    id: z.string().uuid('Invalid document id')
  }),
  query: z.object({}).optional()
});

const idParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid document id')
  }),
  query: z.object({}).optional()
});

const reorderDocumentSchema = z.object({
  body: z.object({
    documentId: z.string().uuid('Invalid document id'),
    previousDocumentId: z.string().uuid('Invalid previous document id').nullable().optional(),
    nextDocumentId: z.string().uuid('Invalid next document id').nullable().optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export {
  createDocumentSchema,
  updateDocumentSchema,
  idParamSchema,
  reorderDocumentSchema
};
