import { sendSuccess } from '../../../common/utils/response.util.js';
import {
  listForDocument,
  createForDocument,
  remove,
  updateResolved
} from '../service/comment.service.js';

async function list(req, res, next) {
  try {
    const { id } = req.validated.params;
    const comments = await listForDocument(req.user.id, id);
    return sendSuccess(res, 200, comments);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const { id } = req.validated.params;
    const comment = await createForDocument(req.user.id, id, req.validated.body.body);
    return sendSuccess(res, 201, comment);
  } catch (error) {
    return next(error);
  }
}

async function removeComment(req, res, next) {
  try {
    const { id } = req.validated.params;
    await remove(req.user.id, id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function patchResolved(req, res, next) {
  try {
    const { id } = req.validated.params;
    const comment = await updateResolved(req.user.id, id, req.validated.body.resolved);
    return sendSuccess(res, 200, comment);
  } catch (error) {
    return next(error);
  }
}

export { list, create, removeComment, patchResolved };
