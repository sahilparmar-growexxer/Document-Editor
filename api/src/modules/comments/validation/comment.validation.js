import { z } from 'zod';

const listCommentsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid document id')
  }),
  query: z.object({}).optional()
});

const createCommentSchema = z.object({
  body: z.object({
    body: z.string().trim().min(1, 'Comment is required').max(2000, 'Comment is too long')
  }),
  params: z.object({
    id: z.string().uuid('Invalid document id')
  }),
  query: z.object({}).optional()
});

const idParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid comment id')
  }),
  query: z.object({}).optional()
});

const updateResolvedSchema = z.object({
  body: z.object({
    resolved: z.boolean()
  }),
  params: z.object({
    id: z.string().uuid('Invalid comment id')
  }),
  query: z.object({}).optional()
});

export { listCommentsSchema, createCommentSchema, idParamSchema, updateResolvedSchema };
