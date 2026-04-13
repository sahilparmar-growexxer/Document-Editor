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

export {
  createDocumentSchema,
  updateDocumentSchema,
  idParamSchema
};
