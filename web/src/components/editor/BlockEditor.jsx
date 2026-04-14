import { useEffect, useRef, useState } from 'react';
import {
  createBlock,
  deleteBlock,
  disableDocumentShare,
  enableDocumentShare,
  listBlocks,
  reorderBlock,
  splitBlock,
  updateBlock
} from '../../lib/apiClient';
import BlockItem from './BlockItem';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState('saved');
  const [focusRequest, setFocusRequest] = useState(null);
  const [draggingId, setDraggingId] = useState('');
  const [activeBlockId, setActiveBlockId] = useState('');

  const pendingRef = useRef(new Map());
  const revisionRef = useRef(new Map());
  const flushTimerRef = useRef(null);
  const savedPulseRef = useRef(null);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      if (savedPulseRef.current) clearTimeout(savedPulseRef.current);
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
    if (!commandRequest || !blocks.length) return;

    const targetId = activeBlockId || blocks[blocks.length - 1]?.id;
    if (!targetId) return;

    if (commandRequest.action === 'insert') {
      insertBlockAtEnd();
      return;
    }

    if (commandRequest.action === 'set-type' && commandRequest.value) {
      handleTypeChange(targetId, commandRequest.value);
    }
  }, [commandRequest?.stamp]);

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
      await Promise.all(
        entries.map(async ([blockId, entry]) => {
          await updateBlock(blockId, entry.payload);
          const latest = revisionRef.current.get(blockId) || 0;
          if (entry.revision < latest) {
            return;
          }
        })
      );

      setSaveState('saved');
      if (savedPulseRef.current) clearTimeout(savedPulseRef.current);
      savedPulseRef.current = setTimeout(() => setSaveState('idle'), 1200);
    } catch (err) {
      setSaveState('error');
      setError(err.message || 'Autosave failed');
    }
  }

  function handleTextChange(blockId, nextText) {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              content: {
                ...(block.content || {}),
                text: nextText
              }
            }
          : block
      )
    );

    queueSave(blockId, { content: { text: nextText } });
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

      setBlocks((prev) => {
        const idx = prev.findIndex((item) => item.id === blockId);
        if (idx < 0) return prev;

        const next = [...prev];
        next[idx] = updatedBlock;
        next.splice(idx + 1, 0, newBlock);
        return normalizeBlocks(next);
      });

      setFocusRequest({ id: newBlock.id, mode: 'start', stamp: Date.now() });
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

    setBlocks((prev) => prev.filter((item) => item.id !== blockId));

    try {
      await deleteBlock(blockId);
      setFocusRequest({ id: previous.id, mode: 'end', stamp: Date.now() });
    } catch (err) {
      await loadDocumentBlocks();
      setError(err.message || 'Could not delete block');
    }
  }

  async function handleTypeChange(blockId, nextType) {
    const nextContent = nextType === 'divider' ? { text: '' } : { text: '' };

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

  async function copyShareLink() {
    if (!document.share_token) return;
    const link = `${window.location.origin}/share/${document.share_token}`;
    await navigator.clipboard.writeText(link);
  }

  if (loading) {
    return <p className="text-sm text-slate-300">Loading editor...</p>;
  }

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
                  Copy Share Link
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
            onFocus={setActiveBlockId}
            onChange={handleTextChange}
            onSplit={handleSplit}
            onDeleteEmpty={handleDeleteEmpty}
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
    </section>
  );
}
