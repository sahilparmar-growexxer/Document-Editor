import { sendSuccess } from '../../../common/utils/response.util.js';
import {
  list as listDocuments,
  create as createDocument,
  rename as renameDocument,
  remove as removeDocument
} from '../service/document.service.js';

async function list(req, res, next) {
  try {
    const documents = await listDocuments(req.user.id);
    return sendSuccess(res, 200, documents);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const { title } = req.validated.body;
    const document = await createDocument(req.user.id, title);
    return sendSuccess(res, 201, document);
  } catch (error) {
    return next(error);
  }
}

async function rename(req, res, next) {
  try {
    const { id } = req.validated.params;
    const { title } = req.validated.body;
    const document = await renameDocument(req.user.id, id, title);
    return sendSuccess(res, 200, document);
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.validated.params;
    await removeDocument(req.user.id, id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export { list, create, rename, remove };
