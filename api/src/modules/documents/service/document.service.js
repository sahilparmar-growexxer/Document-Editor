import AppError from '../../../common/errors/AppError.js';
import errorCodes from '../../../common/errors/errorCodes.js';
import {
  listByUserId,
  create as createDocument,
  findById,
  rename as renameDocument,
  remove as removeDocument
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

export {
  list,
  create,
  rename,
  remove
};
