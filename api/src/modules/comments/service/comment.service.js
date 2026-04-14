import AppError from '../../../common/errors/AppError.js';
import errorCodes from '../../../common/errors/errorCodes.js';
import { findById as findDocumentById } from '../../documents/repository/document.repository.js';
import {
  listByDocumentId,
  create as createCommentRow,
  findById,
  removeById,
  setResolved
} from '../repository/comment.repository.js';

async function assertDocumentOwner(userId, documentId) {
  const document = await findDocumentById(documentId);
  if (!document) {
    throw new AppError('Document not found', 404, errorCodes.DOCUMENT_NOT_FOUND);
  }

  if (document.user_id !== userId) {
    throw new AppError('Forbidden', 403, errorCodes.FORBIDDEN);
  }

  return document;
}

async function listForDocument(userId, documentId) {
  await assertDocumentOwner(userId, documentId);
  return listByDocumentId(documentId);
}

async function createForDocument(userId, documentId, body) {
  await assertDocumentOwner(userId, documentId);
  return createCommentRow({ documentId, userId, body });
}

async function remove(userId, commentId) {
  const comment = await findById(commentId);
  if (!comment) {
    throw new AppError('Comment not found', 404, errorCodes.COMMENT_NOT_FOUND);
  }

  const document = await assertDocumentOwner(userId, comment.document_id);
  if (comment.user_id !== userId && document.user_id !== userId) {
    throw new AppError('Forbidden', 403, errorCodes.FORBIDDEN);
  }

  await removeById(commentId);
}

async function updateResolved(userId, commentId, resolved) {
  const comment = await findById(commentId);
  if (!comment) {
    throw new AppError('Comment not found', 404, errorCodes.COMMENT_NOT_FOUND);
  }

  await assertDocumentOwner(userId, comment.document_id);
  return setResolved(commentId, resolved);
}

export { listForDocument, createForDocument, remove, updateResolved };
