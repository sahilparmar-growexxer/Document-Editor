import test from 'node:test';
import assert from 'node:assert/strict';
import { registerSchema } from '../../src/modules/auth/validation/auth.validation.js';

test('registerSchema rejects weak password', () => {
  const result = registerSchema.safeParse({
    body: { email: 'a@b.com', password: 'weakpass' },
    params: {},
    query: {}
  });
  assert.equal(result.success, false);
});

test('registerSchema accepts valid payload', () => {
  const result = registerSchema.safeParse({
    body: { email: 'a@b.com', password: 'strongpass1' },
    params: {},
    query: {}
  });
  assert.equal(result.success, true);
});
