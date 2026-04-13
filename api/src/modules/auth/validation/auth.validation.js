import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/\d/, 'Password must include at least 1 number');

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: passwordSchema
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required')
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'refreshToken is required')
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export {
  registerSchema,
  loginSchema,
  refreshSchema
};
