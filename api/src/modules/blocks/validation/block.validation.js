import { z } from 'zod';

const blockContentSchema = z.object({
  text: z.string().optional()
}).passthrough();

const listBlocksSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid document id')
  }),
  query: z.object({}).optional()
});

const createBlockSchema = z.object({
  body: z.object({
    documentId: z.string().uuid('Invalid document id'),
    type: z.string().min(1).max(50).optional(),
    content: blockContentSchema.optional(),
    parentId: z.string().uuid('Invalid parent id').nullable().optional(),
    previousBlockId: z.string().uuid('Invalid previous block id').nullable().optional(),
    nextBlockId: z.string().uuid('Invalid next block id').nullable().optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const updateBlockSchema = z.object({
  body: z.object({
    type: z.string().min(1).max(50).optional(),
    content: blockContentSchema.optional()
  }).refine((value) => value.type !== undefined || value.content !== undefined, {
    message: 'type or content is required'
  }),
  params: z.object({
    id: z.string().uuid('Invalid block id')
  }),
  query: z.object({}).optional()
});

const deleteBlockSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid block id')
  }),
  query: z.object({}).optional()
});

const reorderBlockSchema = z.object({
  body: z.object({
    documentId: z.string().uuid('Invalid document id'),
    blockId: z.string().uuid('Invalid block id'),
    parentId: z.string().uuid('Invalid parent id').nullable().optional(),
    previousBlockId: z.string().uuid('Invalid previous block id').nullable().optional(),
    nextBlockId: z.string().uuid('Invalid next block id').nullable().optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const splitBlockSchema = z.object({
  body: z.object({
    documentId: z.string().uuid('Invalid document id'),
    blockId: z.string().uuid('Invalid block id'),
    cursorIndex: z.number().int().nonnegative()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const shareTokenParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    token: z.string().min(1, 'Invalid share token')
  }),
  query: z.object({}).optional()
});

export {
  listBlocksSchema,
  createBlockSchema,
  updateBlockSchema,
  deleteBlockSchema,
  reorderBlockSchema,
  splitBlockSchema,
  shareTokenParamSchema
};
