import AppError from '../../../common/errors/AppError.js';
import errorCodes from '../../../common/errors/errorCodes.js';
import env from '../../../config/env.js';
import { midpointOrder } from '../../../common/utils/order.util.js';
import { findById as findDocumentById } from '../../documents/repository/document.repository.js';
import {
  listByDocumentId,
  findById,
  findByIdForUser,
  findByIdForDocument,
  findByIdOrNull,
  create,
  updateById,
  removeById,
  findNextBlock,
  listPublicByShareToken
} from '../repository/block.repository.js';

function normalizeTextContent(content) {
  if (!content || typeof content !== 'object') {
    return { text: '' };
  }

  if (typeof content.text !== 'string') {
    return { ...content, text: '' };
  }

  return content;
}

async function ensureDocumentOwnership(userId, documentId) {
  const document = await findDocumentById(documentId);
  if (!document) {
    throw new AppError('Document not found', 404, errorCodes.DOCUMENT_NOT_FOUND);
  }

  if (document.user_id !== userId) {
    throw new AppError('Forbidden', 403, errorCodes.FORBIDDEN);
  }

  return document;
}

async function ensureBlockOwnership(userId, blockId) {
  const block = await findByIdForUser(userId, blockId);
  if (!block) {
    throw new AppError('Block not found', 404, errorCodes.BLOCK_NOT_FOUND);
  }
  return block;
}

async function listForDocument(userId, documentId) {
  await ensureDocumentOwnership(userId, documentId);
  return listByDocumentId(documentId);
}

async function createBlock(userId, payload) {
  const {
    documentId,
    type = 'paragraph',
    content = { text: '' },
    parentId = null,
    previousBlockId = null,
    nextBlockId = null
  } = payload;

  await ensureDocumentOwnership(userId, documentId);

  const prev = await findByIdOrNull(previousBlockId);
  const next = await findByIdOrNull(nextBlockId);

  if (prev && prev.document_id !== documentId) {
    throw new AppError('Invalid reorder bounds', 400, errorCodes.INVALID_REORDER);
  }

  if (next && next.document_id !== documentId) {
    throw new AppError('Invalid reorder bounds', 400, errorCodes.INVALID_REORDER);
  }

  const orderIndex = midpointOrder(prev?.order_index ?? null, next?.order_index ?? null);

  return create({
    documentId,
    type,
    content: normalizeTextContent(content),
    orderIndex,
    parentId
  });
}

async function updateBlock(userId, blockId, payload) {
  const block = await ensureBlockOwnership(userId, blockId);

  const updates = {};
  if (Object.prototype.hasOwnProperty.call(payload, 'content')) {
    updates.content = normalizeTextContent(payload.content);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'type')) {
    updates.type = payload.type;
  }

  if (!Object.keys(updates).length) {
    return block;
  }

  return updateById(blockId, updates);
}

async function deleteBlock(userId, blockId) {
  const block = await ensureBlockOwnership(userId, blockId);
  await removeById(blockId);
  return block;
}

async function reorderBlock(userId, payload) {
  const { documentId, blockId, previousBlockId = null, nextBlockId = null, parentId = null } = payload;

  const block = await findByIdForUser(userId, blockId);
  if (!block) {
    throw new AppError('Block not found', 404, errorCodes.BLOCK_NOT_FOUND);
  }

  if (block.document_id !== documentId) {
    throw new AppError('Block not found', 404, errorCodes.BLOCK_NOT_FOUND);
  }

  const prev = await findByIdOrNull(previousBlockId);
  const next = await findByIdOrNull(nextBlockId);

  if (prev && prev.document_id !== documentId) {
    throw new AppError('Invalid reorder bounds', 400, errorCodes.INVALID_REORDER);
  }

  if (next && next.document_id !== documentId) {
    throw new AppError('Invalid reorder bounds', 400, errorCodes.INVALID_REORDER);
  }

  const orderIndex = midpointOrder(prev?.order_index ?? null, next?.order_index ?? null);

  return updateById(blockId, { orderIndex, parentId });
}

async function splitBlock(userId, payload) {
  const { documentId, blockId, cursorIndex } = payload;

  const block = await findByIdForUser(userId, blockId);
  if (!block) {
    throw new AppError('Block not found', 404, errorCodes.BLOCK_NOT_FOUND);
  }

  if (block.document_id !== documentId) {
    throw new AppError('Block not found', 404, errorCodes.BLOCK_NOT_FOUND);
  }

  const normalizedContent = normalizeTextContent(block.content);
  const text = normalizedContent.text;

  if (typeof cursorIndex !== 'number' || cursorIndex < 0 || cursorIndex > text.length) {
    throw new AppError('Invalid split position', 400, errorCodes.INVALID_BLOCK_SPLIT);
  }

  const before = text.slice(0, cursorIndex);
  const after = text.slice(cursorIndex);

  const next = await findNextBlock(documentId, block.order_index);
  const orderIndex = midpointOrder(block.order_index, next?.order_index ?? null);

  const updatedBlock = await updateById(block.id, {
    content: { ...normalizedContent, text: before }
  });

  const newBlock = await create({
    documentId,
    type: 'paragraph',
    content: { text: after },
    orderIndex,
    parentId: block.parent_id
  });

  return { updatedBlock, newBlock };
}

function buildRewritePrompt(text, mode) {
  const instructionMap = {
    shorter: 'Rewrite the text to be shorter while preserving meaning.',
    clearer: 'Rewrite the text to be clearer and easier to understand.',
    formal: 'Rewrite the text in a formal tone.',
    'bullet-list': 'Rewrite the text as concise bullet points.',
    checklist: 'Rewrite the text as checklist items using - [ ] markers.'
  };

  const instruction = instructionMap[mode] || 'Rewrite the text while preserving its meaning.';

  return [
    'You are a document editor assistant.',
    instruction,
    'Return only the rewritten text with no markdown fences, no preamble, and no explanation.',
    `Input text:\n${text}`
  ].join('\n\n');
}

async function generateGeminiRewrite(text, mode) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: buildRewritePrompt(text, mode) }]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topP: 0.95,
          maxOutputTokens: 512
        }
      })
    }
  );

  const responseText = await response.text();
  let responseJson = null;

  try {
    responseJson = responseText ? JSON.parse(responseText) : null;
  } catch (_error) {
    responseJson = null;
  }

  if (!response.ok) {
    const message = responseJson?.error?.message || responseJson?.message || `Gemini request failed with status ${response.status}`;
    throw new AppError(message, 502, errorCodes.VALIDATION_ERROR);
  }

  return String(responseJson?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('') || '').trim();
}

async function rewriteBlock(userId, payload) {
  const { documentId, blockId, mode } = payload;

  const block = await findByIdForUser(userId, blockId);
  if (!block || block.document_id !== documentId) {
    throw new AppError('Block not found', 404, errorCodes.BLOCK_NOT_FOUND);
  }

  const currentContent = normalizeTextContent(block.content);
  const sourceText = String(currentContent.text || '').trim();

  if (!sourceText) {
    throw new AppError('Selected block does not contain text to rewrite', 400, errorCodes.VALIDATION_ERROR);
  }

  if (block.type === 'divider' || block.type === 'image') {
    throw new AppError('Rewrite is not supported for this block type', 400, errorCodes.VALIDATION_ERROR);
  }

  if (!env.geminiApiKey) {
    throw new AppError('GEMINI_API_KEY is not configured', 503, errorCodes.VALIDATION_ERROR);
  }

  const rewrittenText = await generateGeminiRewrite(sourceText, mode);

  if (!rewrittenText) {
    throw new AppError('Could not generate rewrite', 502, errorCodes.VALIDATION_ERROR);
  }

  return {
    blockId: block.id,
    mode,
    originalText: sourceText,
    rewrittenText
  };
}

async function getSharedDocument(token) {
  const rows = await listPublicByShareToken(token);
  if (!rows.length) {
    throw new AppError('Shared document not found', 404, errorCodes.SHARE_NOT_FOUND);
  }

  const first = rows[0];

  // Check if token has expired
  if (first.share_token_expires_at) {
    const expiryTime = new Date(first.share_token_expires_at).getTime();
    if (expiryTime < Date.now()) {
      throw new AppError('Share token has expired', 410, errorCodes.SHARE_NOT_FOUND);
    }
  }
  const blocks = rows
    .filter((row) => row.block_id)
    .map((row) => ({
      id: row.block_id,
      document_id: first.id,
      type: row.block_type,
      content: row.block_content,
      order_index: row.block_order_index,
      parent_id: row.block_parent_id,
      created_at: row.block_created_at
    }));

  return {
    document: {
      id: first.id,
      title: first.title,
      share_token: first.share_token,
      is_public: first.is_public
    },
    blocks
  };
}

export {
  listForDocument,
  createBlock,
  updateBlock,
  deleteBlock,
  reorderBlock,
  splitBlock,
  rewriteBlock,
  getSharedDocument
};
