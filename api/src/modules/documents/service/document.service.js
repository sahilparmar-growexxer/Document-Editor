import AppError from '../../../common/errors/AppError.js';
import errorCodes from '../../../common/errors/errorCodes.js';
import crypto from 'node:crypto';
import { midpointOrder } from '../../../common/utils/order.util.js';
import {
  listByUserId,
  create as createDocument,
  findById,
  rename as renameDocument,
  remove as removeDocument,
  enableSharing as enableDocumentSharing,
  disableSharing as disableDocumentSharing,
  updateOrder as updateDocumentOrder
} from '../repository/document.repository.js';

async function list(userId) {
  return listByUserId(userId);
}

async function create(userId, title) {
  return createDocument(userId, title);
}

async function rename(userId, documentId, title) {
  const document = await findById(documentId);
  if (!document) {
    throw new AppError('Document not found', 404, errorCodes.DOCUMENT_NOT_FOUND);
  }

  if (document.user_id !== userId) {
    throw new AppError('Forbidden', 403, errorCodes.FORBIDDEN);
  }

  return renameDocument(documentId, title);
}

async function remove(userId, documentId) {
  const document = await findById(documentId);
  if (!document) {
    throw new AppError('Document not found', 404, errorCodes.DOCUMENT_NOT_FOUND);
  }

  if (document.user_id !== userId) {
    throw new AppError('Forbidden', 403, errorCodes.FORBIDDEN);
  }

  await removeDocument(documentId);
}

async function enableSharing(userId, documentId) {
  const document = await findById(documentId);
  if (!document) {
    throw new AppError('Document not found', 404, errorCodes.DOCUMENT_NOT_FOUND);
  }

  if (document.user_id !== userId) {
    throw new AppError('Forbidden', 403, errorCodes.FORBIDDEN);
  }

  const token = crypto.randomUUID();
  // Set token expiry to 24 hours from now
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return enableDocumentSharing(documentId, token, expiresAt);
}

async function disableSharing(userId, documentId) {
  const document = await findById(documentId);
  if (!document) {
    throw new AppError('Document not found', 404, errorCodes.DOCUMENT_NOT_FOUND);
  }

  if (document.user_id !== userId) {
    throw new AppError('Forbidden', 403, errorCodes.FORBIDDEN);
  }

  return disableDocumentSharing(documentId);
}

async function reorder(userId, payload) {
  const { documentId, previousDocumentId = null, nextDocumentId = null } = payload;

  const document = await findById(documentId);
  if (!document) {
    throw new AppError('Document not found', 404, errorCodes.DOCUMENT_NOT_FOUND);
  }

  if (document.user_id !== userId) {
    throw new AppError('Forbidden', 403, errorCodes.FORBIDDEN);
  }

  const prev = previousDocumentId ? await findById(previousDocumentId) : null;
  const next = nextDocumentId ? await findById(nextDocumentId) : null;

  if (prev && prev.user_id !== userId) {
    throw new AppError('Invalid reorder bounds', 400, errorCodes.INVALID_REORDER);
  }

  if (next && next.user_id !== userId) {
    throw new AppError('Invalid reorder bounds', 400, errorCodes.INVALID_REORDER);
  }

  const orderIndex = midpointOrder(prev?.order_index ?? null, next?.order_index ?? null);
  return updateDocumentOrder(documentId, orderIndex);
}

export {
  list,
  create,
  rename,
  remove,
  enableSharing,
  disableSharing,
  reorder
};
