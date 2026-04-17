import { useEffect, useRef, useState } from 'react';
import {
  createBlock,
  deleteBlock,
  disableDocumentShare,
  enableDocumentShare,
  listBlocks,
  reorderBlock,
  splitBlock,
  rewriteBlock,
  updateBlock
} from '../../lib/apiClient';
import BlockItem from './BlockItem';
import { BlockEditorSkeleton } from '../ui/LoadingSkeletons';

function normalizeBlocks(rows) {
  return [...rows].sort((a, b) => {
    if (a.order_index === b.order_index) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return Number(a.order_index) - Number(b.order_index);
  });
}

export default function BlockEditor({
  document,
  onDocumentMetaChange,
  showShareControls = true,
  commandRequest = null
}) {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlockIds, setSelectedBlockIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState('saved');
  const [focusRequest, setFocusRequest] = useState(null);
  const [draggingId, setDraggingId] = useState('');
  const [activeBlockId, setActiveBlockId] = useState('');
  const [rewriteDialogOpen, setRewriteDialogOpen] = useState(false);
  const [rewriteMode, setRewriteMode] = useState('shorter');
  const [rewritePreview, setRewritePreview] = useState('');
  const [rewriteOriginal, setRewriteOriginal] = useState('');
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteError, setRewriteError] = useState('');
  const [rewriteTargetBlockId, setRewriteTargetBlockId] = useState('');

  const pendingRef = useRef(new Map());
  const revisionRef = useRef(new Map());
  const flushTimerRef = useRef(null);
  const lastAppliedCommandStampRef = useRef(0);
  const [copyNotice, setCopyNotice] = useState('');
  const copyNoticeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      if (copyNoticeTimerRef.current) clearTimeout(copyNoticeTimerRef.current);
    };
  }, []);

  async function loadDocumentBlocks() {
    setLoading(true);
    setError('');
    try {
      const rows = await listBlocks(document.id);
      if (!rows.length) {
        const first = await createBlock({ documentId: document.id, type: 'paragraph', content: { text: '' } });
        setBlocks([first]);
        setFocusRequest({ id: first.id, mode: 'end', stamp: Date.now() });
      } else {
        setBlocks(normalizeBlocks(rows));
      }
    } catch (err) {
      setError(err.message || 'Failed to load blocks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!document?.id) return;
    loadDocumentBlocks();
  }, [document?.id]);

  useEffect(() => {
    const existingIds = new Set(blocks.map((block) => block.id));
    setSelectedBlockIds((prev) => prev.filter((id) => existingIds.has(id)));
  }, [blocks]);

  useEffect(() => {
    if (!commandRequest || !blocks.length) return;
    if (lastAppliedCommandStampRef.current === commandRequest.stamp) return;

    const targetId = activeBlockId || blocks[blocks.length - 1]?.id;
    if (!targetId) return;

    if (commandRequest.action === 'insert') {
      lastAppliedCommandStampRef.current = commandRequest.stamp;
      insertBlockAtEnd();
      return;
    }

    if (commandRequest.action === 'set-type' && commandRequest.value) {
      lastAppliedCommandStampRef.current = commandRequest.stamp;
      handleTypeChange(targetId, commandRequest.value);
    }
  }, [commandRequest?.stamp, blocks.length, activeBlockId]);

  function queueSave(blockId, payload) {
    const nextRevision = (revisionRef.current.get(blockId) || 0) + 1;
    revisionRef.current.set(blockId, nextRevision);
    pendingRef.current.set(blockId, { revision: nextRevision, payload });
    setSaveState('saving');

    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
    }

    flushTimerRef.current = setTimeout(() => {
      flushPending();
    }, 700);
  }

  async function flushPending() {
    const entries = Array.from(pendingRef.current.entries());
    if (!entries.length) return;

    pendingRef.current.clear();
    setSaveState('saving');

    try {
      const results = await Promise.allSettled(
        entries.map(async ([blockId, entry]) => {
          await updateBlock(blockId, entry.payload);
          const latest = revisionRef.current.get(blockId) || 0;
          if (entry.revision < latest) {
            return;
          }
        })
      );

      const criticalFailure = results.find((result) => {
        if (result.status !== 'rejected') return false;
        const status = result.reason?.status;
        const message = String(result.reason?.message || '').toLowerCase();
        const isBlockMissing = status === 404 && message.includes('block not found');
        return !isBlockMissing;
      });

      if (criticalFailure?.status === 'rejected') {
        throw criticalFailure.reason;
      }

      setSaveState('saved');
    } catch (err) {
      setSaveState('error');
      setError(err.message || 'Autosave failed');
    }
  }

  function handleTextChange(blockId, nextText) {
    const currentBlock = blocks.find((item) => item.id === blockId);
    const nextContent = {
      ...(currentBlock?.content || {}),
      text: nextText
    };

    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              content: nextContent
            }
          : block
      )
    );

    queueSave(blockId, { content: nextContent });
  }

  function handleTodoCheckedChange(blockId, checked) {
    const currentBlock = blocks.find((item) => item.id === blockId);
    const nextContent = {
      ...(currentBlock?.content || {}),
      text: currentBlock?.content?.text || '',
      checked: Boolean(checked)
    };

    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              content: nextContent
            }
          : block
      )
    );

    queueSave(blockId, { content: nextContent });
  }

  function handleImageUrlChange(blockId, nextUrl) {
    const currentBlock = blocks.find((item) => item.id === blockId);
    const nextContent = {
      ...(currentBlock?.content || {}),
      text: '',
      url: nextUrl,
      widthPercent: Number(currentBlock?.content?.widthPercent || 100)
    };

    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              content: nextContent
            }
          : block
      )
    );

    queueSave(blockId, { content: nextContent });
  }

  function handleImageWidthChange(blockId, nextWidthPercent) {
    const normalizedWidth = Math.max(20, Math.min(100, Number(nextWidthPercent) || 100));
    const currentBlock = blocks.find((item) => item.id === blockId);
    const nextContent = {
      ...(currentBlock?.content || {}),
      text: '',
      url: currentBlock?.content?.url || '',
      widthPercent: normalizedWidth
    };

    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              content: nextContent
            }
          : block
      )
    );

    queueSave(blockId, { content: nextContent });
  }

  async function handleSplit(blockId, cursorIndex) {
    setError('');
    try {
      await flushPending();
      const { updatedBlock, newBlock } = await splitBlock({
        documentId: document.id,
        blockId,
        cursorIndex
      });

      const normalizedNewBlock = {
        ...newBlock,
        type: 'paragraph',
        content: { text: String(newBlock?.content?.text || '') }
      };

      setBlocks((prev) => {
        const idx = prev.findIndex((item) => item.id === blockId);
        if (idx < 0) return prev;

        const next = [...prev];
        next[idx] = updatedBlock;
        next.splice(idx + 1, 0, normalizedNewBlock);
        return normalizeBlocks(next);
      });

      setFocusRequest({ id: normalizedNewBlock.id, mode: 'start', stamp: Date.now() });
    } catch (err) {
      setError(err.message || 'Could not split block');
    }
  }

  async function handleDeleteEmpty(blockId) {
    setError('');
    const current = blocks;
    const idx = current.findIndex((item) => item.id === blockId);
    if (idx <= 0) return;
    const previous = current[idx - 1];

    pendingRef.current.delete(blockId);
    revisionRef.current.delete(blockId);

    setBlocks((prev) => prev.filter((item) => item.id !== blockId));

    try {
      await deleteBlock(blockId);
      setFocusRequest({ id: previous.id, mode: 'end', stamp: Date.now() });
    } catch (err) {
      await loadDocumentBlocks();
      setError(err.message || 'Could not delete block');
    }
  }

  async function handleDeleteBlock(blockId) {
    setError('');
    const current = blocks;
    const idx = current.findIndex((item) => item.id === blockId);
    if (idx < 0) return;

    const previous = idx > 0 ? current[idx - 1] : null;
    pendingRef.current.delete(blockId);
    revisionRef.current.delete(blockId);
    setBlocks((prev) => prev.filter((item) => item.id !== blockId));
    setSelectedBlockIds((prev) => prev.filter((id) => id !== blockId));

    try {
      await deleteBlock(blockId);
      if (previous) {
        setFocusRequest({ id: previous.id, mode: 'end', stamp: Date.now() });
      }
    } catch (err) {
      await loadDocumentBlocks();
      setError(err.message || 'Could not delete block');
    }
  }

  function handleToggleBlockSelect(blockId, checked) {
    setSelectedBlockIds((prev) => {
      if (checked) {
        if (prev.includes(blockId)) return prev;
        return [...prev, blockId];
      }

      return prev.filter((id) => id !== blockId);
    });
  }

  function handleSelectAllToggle() {
    if (!blocks.length) return;

    setSelectedBlockIds((prev) => {
      if (prev.length === blocks.length) {
        return [];
      }

      return blocks.map((block) => block.id);
    });
  }

  async function handleDeleteSelected() {
    if (!selectedBlockIds.length) return;

    setError('');
    await flushPending();

    const idsToDelete = blocks
      .filter((block) => selectedBlockIds.includes(block.id))
      .map((block) => block.id);

    if (!idsToDelete.length) return;

    idsToDelete.forEach((id) => {
      pendingRef.current.delete(id);
      revisionRef.current.delete(id);
    });

    setBlocks((prev) => prev.filter((block) => !idsToDelete.includes(block.id)));
    setSelectedBlockIds([]);

    try {
      await Promise.all(idsToDelete.map((id) => deleteBlock(id)));

      const remaining = blocks.filter((block) => !idsToDelete.includes(block.id));
      if (!remaining.length) {
        const first = await createBlock({ documentId: document.id, type: 'paragraph', content: { text: '' } });
        setBlocks([first]);
        setFocusRequest({ id: first.id, mode: 'end', stamp: Date.now() });
      }
    } catch (err) {
      await loadDocumentBlocks();
      setError(err.message || 'Could not delete selected blocks');
    }
  }

  async function handleTypeChange(blockId, nextType) {
    const nextContent =
      nextType === 'image'
        ? { text: '', url: '', widthPercent: 100 }
        : nextType === 'todo'
          ? { text: '', checked: false }
          : { text: '' };

    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              type: nextType,
              content: nextContent
            }
          : block
      )
    );

    try {
      await updateBlock(blockId, { type: nextType, content: nextContent });
    } catch (err) {
      setError(err.message || 'Could not change block type');
      await loadDocumentBlocks();
    }
  }

  async function handleDropReorder(targetId, placement) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId('');
      return;
    }

    const current = [...blocks];
    const from = current.findIndex((item) => item.id === draggingId);
    const to = current.findIndex((item) => item.id === targetId);

    if (from < 0 || to < 0) {
      setDraggingId('');
      return;
    }

    const [moved] = current.splice(from, 1);
    const insertAt = placement === 'before' ? to : to + 1;
    current.splice(insertAt > from ? insertAt - 1 : insertAt, 0, moved);

    setBlocks(current);
    setDraggingId('');

    const newIndex = current.findIndex((item) => item.id === moved.id);
    const previous = newIndex > 0 ? current[newIndex - 1] : null;
    const next = newIndex < current.length - 1 ? current[newIndex + 1] : null;

    try {
      const updated = await reorderBlock({
        documentId: document.id,
        blockId: moved.id,
        previousBlockId: previous?.id || null,
        nextBlockId: next?.id || null,
        parentId: null
      });

      setBlocks((prev) =>
        prev.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                order_index: updated.order_index,
                parent_id: updated.parent_id
              }
            : item
        )
      );
    } catch (err) {
      setError(err.message || 'Could not reorder block');
      await loadDocumentBlocks();
    }
  }

  async function insertBlockAtEnd() {
    setError('');
    const last = blocks[blocks.length - 1];
    try {
      const created = await createBlock({
        documentId: document.id,
        type: 'paragraph',
        content: { text: '' },
        previousBlockId: last?.id || null,
        nextBlockId: null,
        parentId: null
      });

      setBlocks((prev) => [...prev, created]);
      setFocusRequest({ id: created.id, mode: 'end', stamp: Date.now() });
    } catch (err) {
      setError(err.message || 'Could not create block');
    }
  }

  async function insertBlockAfter(blockId) {
    setError('');
    const current = [...blocks];
    const idx = current.findIndex((item) => item.id === blockId);
    if (idx < 0) return;

    const previous = current[idx];
    const next = idx < current.length - 1 ? current[idx + 1] : null;

    try {
      const created = await createBlock({
        documentId: document.id,
        type: 'paragraph',
        content: { text: '' },
        previousBlockId: previous?.id || null,
        nextBlockId: next?.id || null,
        parentId: null
      });

      setBlocks((prev) => normalizeBlocks([...prev, created]));
      setFocusRequest({ id: created.id, mode: 'start', stamp: Date.now() });
    } catch (err) {
      setError(err.message || 'Could not create block');
    }
  }

  async function handleEnableShare() {
    setError('');
    try {
      const updated = await enableDocumentShare(document.id);
      onDocumentMetaChange(updated);
    } catch (err) {
      setError(err.message || 'Could not enable sharing');
    }
  }

  async function handleDisableShare() {
    setError('');
    try {
      const updated = await disableDocumentShare(document.id);
      onDocumentMetaChange(updated);
    } catch (err) {
      setError(err.message || 'Could not disable sharing');
    }
  }

  function getRewriteTargetBlock() {
    const selectedTargetId = selectedBlockIds.length === 1 ? selectedBlockIds[0] : '';
    const targetId = selectedTargetId || activeBlockId || blocks[0]?.id || '';
    if (!targetId) return null;
    return blocks.find((item) => item.id === targetId) || null;
  }

  function openRewriteAssistant() {
    const block = getRewriteTargetBlock();
    const sourceText = String(block?.content?.text || '').trim();

    if (!block || !sourceText || block.type === 'divider' || block.type === 'image') {
      setError('Select a text block to rewrite');
      return;
    }

    setRewriteTargetBlockId(block.id);
    setRewriteMode('shorter');
    setRewritePreview('');
    setRewriteOriginal(sourceText);
    setRewriteError('');
    setRewriteDialogOpen(true);
  }

  async function generateRewrite() {
    const targetBlock = blocks.find((item) => item.id === rewriteTargetBlockId);
    const sourceText = String(targetBlock?.content?.text || '').trim();

    if (!targetBlock || !sourceText) {
      setRewriteError('Select a text block to rewrite');
      return;
    }

    setRewriteLoading(true);
    setRewriteError('');

    try {
      await flushPending();
      const result = await rewriteBlock({
        documentId: document.id,
        blockId: targetBlock.id,
        mode: rewriteMode
      });

      setRewriteOriginal(result.originalText || sourceText);
      setRewritePreview(result.rewrittenText || '');
    } catch (err) {
      setRewriteError(err.message || 'Could not generate rewrite');
    } finally {
      setRewriteLoading(false);
    }
  }

  async function applyRewrite() {
    const targetBlock = blocks.find((item) => item.id === rewriteTargetBlockId);
    if (!targetBlock || !rewritePreview) return;

    const nextContent = {
      ...(targetBlock.content || {}),
      text: rewritePreview
    };

    setRewriteLoading(true);
    setRewriteError('');

    try {
      pendingRef.current.delete(rewriteTargetBlockId);
      revisionRef.current.delete(rewriteTargetBlockId);

      setBlocks((prev) =>
        prev.map((block) =>
          block.id === rewriteTargetBlockId
            ? {
                ...block,
                content: nextContent
              }
            : block
        )
      );

      await updateBlock(rewriteTargetBlockId, { content: nextContent });
      setRewriteDialogOpen(false);
      setRewritePreview('');
      setRewriteOriginal('');
      setRewriteTargetBlockId('');
    } catch (err) {
      setRewriteError(err.message || 'Could not apply rewrite');
    } finally {
      setRewriteLoading(false);
    }
  }

  async function copyShareLink() {
    if (!document.share_token) return;
    const link = `${window.location.origin}/share/${document.share_token}`;
    await navigator.clipboard.writeText(link);

    setCopyNotice('Copied');
    if (copyNoticeTimerRef.current) {
      clearTimeout(copyNoticeTimerRef.current);
    }

    copyNoticeTimerRef.current = setTimeout(() => {
      setCopyNotice('');
    }, 3000);
  }

  if (loading) {
    return <BlockEditorSkeleton />;
  }

  const isAllSelected = blocks.length > 0 && selectedBlockIds.length === blocks.length;
  const selectedCount = selectedBlockIds.length;

  return (
    <section className="editor-shell">
      <div className="editor-toolbar">
        <div className="editor-save-indicator">
          {saveState === 'saving' ? 'Saving...' : null}
          {saveState === 'saved' ? 'Saved' : null}
          {saveState === 'error' ? 'Save failed' : null}
        </div>

        {showShareControls ? (
          <div className="editor-share-actions">
            {document.is_public ? (
              <>
                <button type="button" className="editor-btn" onClick={copyShareLink}>
                  {copyNotice || 'Copy Share Link'}
                </button>
                <button type="button" className="editor-btn editor-btn-danger" onClick={handleDisableShare}>
                  Disable Share
                </button>
              </>
            ) : (
              <button type="button" className="editor-btn" onClick={handleEnableShare}>
                Enable Share
              </button>
            )}
          </div>
        ) : null}
      </div>

      {error ? <p className="editor-error">{error}</p> : null}

      <div className="editor-canvas">
        {blocks.map((block, index) => (
          <BlockItem
            key={block.id}
            block={block}
            isFirst={index === 0}
            isSelected={selectedBlockIds.includes(block.id)}
            onToggleSelect={handleToggleBlockSelect}
            onFocus={setActiveBlockId}
            onChange={handleTextChange}
            onChangeTodoChecked={handleTodoCheckedChange}
            onChangeImageUrl={handleImageUrlChange}
            onChangeImageWidth={handleImageWidthChange}
            onInsertAfter={insertBlockAfter}
            onSplit={handleSplit}
            onDeleteEmpty={handleDeleteEmpty}
            onDeleteBlock={handleDeleteBlock}
            onChangeType={handleTypeChange}
            onDragStart={setDraggingId}
            onDropReorder={handleDropReorder}
            requestFocus={focusRequest?.id === block.id ? focusRequest.mode : null}
          />
        ))}

        <button type="button" className="editor-add-block" onClick={insertBlockAtEnd}>
          + Add block
        </button>
      </div>

      <div className="editor-floating-actions" role="region" aria-label="Block selection actions">
        <span className="editor-floating-count">{selectedCount} selected</span>
        <button
          type="button"
          className="editor-floating-btn editor-floating-btn-ai"
          onClick={openRewriteAssistant}
          disabled={!blocks.length}
        >
          Rewrite
        </button>
        <button type="button" className="editor-floating-btn" onClick={handleSelectAllToggle}>
          {isAllSelected ? 'Clear All' : 'Select All'}
        </button>
        <button
          type="button"
          className="editor-floating-btn editor-floating-btn-danger"
          onClick={handleDeleteSelected}
          disabled={!selectedCount}
        >
          Delete
        </button>
      </div>

      {rewriteDialogOpen ? (
        <div className="bn-rewrite-overlay" onClick={() => !rewriteLoading && setRewriteDialogOpen(false)} role="dialog" aria-modal="true" aria-labelledby="rewrite-title">
          <div className="bn-rewrite-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="bn-rewrite-header">
              <div className="bn-rewrite-header-content">
                <span className="bn-rewrite-badge">✨ AI Assistant</span>
                <h2 id="rewrite-title">Rewrite Block</h2>
                <p className="bn-rewrite-description">Choose a style and generate alternative versions of your content</p>
              </div>
              <button
                type="button"
                className="bn-rewrite-close"
                onClick={() => {
                  if (rewriteLoading) return;
                  setRewriteDialogOpen(false);
                  setRewritePreview('');
                  setRewriteOriginal('');
                  setRewriteTargetBlockId('');
                  setRewriteError('');
                }}
                aria-label="Close rewrite dialog"
              >
                ✕
              </button>
            </div>

            <div className="bn-rewrite-content">
              <div className="bn-rewrite-mode-section">
                <label htmlFor="rewrite-mode" className="bn-rewrite-label">
                  Rewrite Style
                </label>
                <div className="bn-rewrite-select-wrapper">
                  <select
                    id="rewrite-mode"
                    className="bn-rewrite-select"
                    value={rewriteMode}
                    onChange={(e) => {
                      setRewriteMode(e.target.value);
                      setRewritePreview('');
                      setRewriteError('');
                    }}
                    disabled={rewriteLoading}
                  >
                    <option value="shorter">📏 Shorter – Make it concise</option>
                    <option value="clearer">💡 Clearer – Improve clarity</option>
                    <option value="formal">📋 Formal – Professional tone</option>
                    <option value="bullet-list">📌 Bullet List – Key points</option>
                    <option value="checklist">✓ Checklist – Actionable items</option>
                  </select>
                </div>
              </div>

              <div className="bn-rewrite-grid">
                <section className="bn-rewrite-section">
                  <div className="bn-rewrite-section-header">
                    <h3>Original</h3>
                  </div>
                  <div className="bn-rewrite-box bn-rewrite-box-original">
                    <div className="bn-rewrite-text">{rewriteOriginal || 'Your content appears here'}</div>
                  </div>
                </section>
                <section className="bn-rewrite-section">
                  <div className="bn-rewrite-section-header">
                    <h3>Preview</h3>
                    {rewriteLoading && <span className="bn-rewrite-loader">⟳</span>}
                  </div>
                  <div className={`bn-rewrite-box bn-rewrite-box-preview ${rewriteLoading ? 'loading' : ''}`}>
                    <div className="bn-rewrite-text">
                      {rewriteLoading ? 'Generating rewrite...' : rewritePreview || 'Generate a rewrite to see the preview'}
                    </div>
                  </div>
                </section>
              </div>

              {rewriteError && (
                <div className="bn-rewrite-banner bn-rewrite-banner-error">
                  <span>⚠️</span>
                  <span>{rewriteError}</span>
                </div>
              )}
            </div>

            <div className="bn-rewrite-actions">
              <button 
                type="button" 
                className="bn-rewrite-secondary" 
                onClick={generateRewrite} 
                disabled={rewriteLoading}
              >
                {rewriteLoading ? 'Generating...' : rewritePreview ? '↻ Regenerate' : '⚡ Generate'}
              </button>
              <button 
                type="button" 
                className="bn-rewrite-primary" 
                onClick={applyRewrite} 
                disabled={rewriteLoading || !rewritePreview}
              >
                ✓ Apply Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
