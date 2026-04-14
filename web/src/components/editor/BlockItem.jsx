import { useEffect, useMemo, useRef, useState } from 'react';

const TYPE_OPTIONS = [
  { value: 'paragraph', label: 'Text' },
  { value: 'heading', label: 'Heading' },
  { value: 'code', label: 'Code' },
  { value: 'todo', label: 'Todo' },
  { value: 'divider', label: 'Divider' }
];

function getCaretOffset(element) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0).cloneRange();
  range.selectNodeContents(element);
  range.setEnd(selection.anchorNode, selection.anchorOffset);
  return range.toString().length;
}

function setCaretToEnd(element) {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function insertTextAtCursor(text) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  selection.deleteFromDocument();
  selection.getRangeAt(0).insertNode(document.createTextNode(text));
  selection.collapseToEnd();
}

function isTextType(type) {
  return type !== 'divider' && type !== 'image';
}

export default function BlockItem({
  block,
  isFirst,
  onFocus,
  onChange,
  onSplit,
  onDeleteEmpty,
  onChangeType,
  onDragStart,
  onDropReorder,
  requestFocus
}) {
  const text = block?.content?.text || '';
  const editableRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');

  const menuOptions = useMemo(
    () => TYPE_OPTIONS.filter((item) => item.label.toLowerCase().includes(slashQuery.toLowerCase())),
    [slashQuery]
  );

  useEffect(() => {
    if (!editableRef.current) return;
    if (editableRef.current.textContent !== text) {
      editableRef.current.textContent = text;
    }
  }, [block.id, text]);

  useEffect(() => {
    if (!requestFocus || !editableRef.current || !isTextType(block.type)) return;
    editableRef.current.focus();
    if (requestFocus === 'end') {
      setCaretToEnd(editableRef.current);
    }
  }, [requestFocus, block.type]);

  function handleInput(e) {
    const nextText = e.currentTarget.textContent || '';
    onChange(block.id, nextText);
  }

  function handleTypeSelect(nextType) {
    setMenuOpen(false);
    setSlashQuery('');
    onChangeType(block.id, nextType);
    if (editableRef.current) {
      editableRef.current.textContent = '';
    }
  }

  function handleKeyDown(e) {
    if (!isTextType(block.type)) {
      return;
    }

    const element = e.currentTarget;
    const cursor = getCaretOffset(element);
    const currentText = element.textContent || '';

    if (menuOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMenuOpen(false);
        setSlashQuery('');
        element.textContent = '';
        onChange(block.id, '');
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        setSlashQuery((prev) => prev.slice(0, -1));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (menuOptions[0]) {
          handleTypeSelect(menuOptions[0].value);
        }
        return;
      }

      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setSlashQuery((prev) => prev + e.key);
        return;
      }

      return;
    }

    if (block.type === 'code' && e.key === 'Tab') {
      e.preventDefault();
      insertTextAtCursor('  ');
      onChange(block.id, element.textContent || '');
      return;
    }

    if (e.key === '/' && cursor === 0 && currentText.length === 0) {
      e.preventDefault();
      setMenuOpen(true);
      setSlashQuery('');
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSplit(block.id, cursor);
      return;
    }

    if (e.key === 'Backspace' && cursor === 0) {
      if (currentText.length === 0 && !isFirst) {
        e.preventDefault();
        onDeleteEmpty(block.id);
      }
    }
  }

  if (block.type === 'divider') {
    return (
      <div
        className="editor-block group"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onDropReorder(block.id, 'before');
        }}
      >
        <button
          type="button"
          draggable
          className="editor-drag-handle"
          onDragStart={() => onDragStart(block.id)}
          aria-label="Drag block"
        >
          ::
        </button>
        <hr className="editor-divider" />
      </div>
    );
  }

  return (
    <div
      className="editor-block group"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const placement = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
        onDropReorder(block.id, placement);
      }}
    >
      <button
        type="button"
        draggable
        className="editor-drag-handle"
        onDragStart={() => onDragStart(block.id)}
        aria-label="Drag block"
      >
        ::
      </button>

      <div className="editor-content-wrap">
        <div
          ref={editableRef}
          className={`editor-content editor-${block.type || 'paragraph'}`}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => onFocus(block.id)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          data-placeholder={block.type === 'heading' ? 'Heading' : 'Type / for commands'}
        />

        {menuOpen ? (
          <div className="editor-slash-menu">
            {menuOptions.length ? (
              menuOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="editor-slash-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleTypeSelect(option.value);
                  }}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="editor-slash-empty">No matching block type</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
