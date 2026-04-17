import { sendSuccess } from '../../../common/utils/response.util.js';
import {
  listForDocument,
  createBlock,
  updateBlock,
  deleteBlock,
  reorderBlock,
  splitBlock,
  rewriteBlock,
  getSharedDocument
} from '../service/block.service.js';

async function list(req, res, next) {
  try {
    const { id } = req.validated.params;
    const blocks = await listForDocument(req.user.id, id);
    return sendSuccess(res, 200, blocks);
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const block = await createBlock(req.user.id, req.validated.body);
    return sendSuccess(res, 201, block);
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.validated.params;
    const block = await updateBlock(req.user.id, id, req.validated.body);
    return sendSuccess(res, 200, block);
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.validated.params;
    await deleteBlock(req.user.id, id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function reorder(req, res, next) {
  try {
    const block = await reorderBlock(req.user.id, req.validated.body);
    return sendSuccess(res, 200, block);
  } catch (error) {
    return next(error);
  }
}

async function split(req, res, next) {
  try {
    const result = await splitBlock(req.user.id, req.validated.body);
    return sendSuccess(res, 200, result);
  } catch (error) {
    return next(error);
  }
}

async function rewrite(req, res, next) {
  try {
    const result = await rewriteBlock(req.user.id, req.validated.body);
    return sendSuccess(res, 200, result);
  } catch (error) {
    return next(error);
  }
}

async function shared(req, res, next) {
  try {
    const { token } = req.validated.params;
    const payload = await getSharedDocument(token);
    return sendSuccess(res, 200, payload);
  } catch (error) {
    return next(error);
  }
}

export {
  list,
  create,
  update,
  remove,
  reorder,
  split,
  rewrite,
  shared
};
