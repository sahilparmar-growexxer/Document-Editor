import { useEffect, useMemo, useRef, useState } from 'react';

const TYPE_OPTIONS = [
  { value: 'paragraph', label: 'Text' },
  { value: 'heading1', label: 'Heading 1' },
  { value: 'heading2', label: 'Heading 2' },
  { value: 'heading3', label: 'Heading 3' },
  { value: 'code', label: 'Code' },
  { value: 'todo', label: 'Todo' },
  { value: 'image', label: 'Image' },
  { value: 'divider', label: 'Divider' }
];

function getCaretOffset(element) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const anchorNode = selection.anchorNode;
  if (!anchorNode || !element.contains(anchorNode)) {
    return (element.textContent || '').length;
  }

  try {
    const range = selection.getRangeAt(0).cloneRange();
    range.selectNodeContents(element);
    range.setEnd(anchorNode, selection.anchorOffset);
    return range.toString().length;
  } catch {
    return (element.textContent || '').length;
  }
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

function insertTextAtCursor(element, text) {
  if (!element) return false;

  element.focus();
  const selection = window.getSelection();
  if (!selection) {
    element.textContent = `${element.textContent || ''}${text}`;
    setCaretToEnd(element);
    return true;
  }

  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;
  const inElement =
    (anchorNode && element.contains(anchorNode)) || (focusNode && element.contains(focusNode));

  if (inElement && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }

  if (typeof document.execCommand === 'function') {
    const inserted = document.execCommand('insertText', false, text);
    if (inserted) return true;
  }

  element.textContent = `${element.textContent || ''}${text}`;
  setCaretToEnd(element);
  return true;
}

function isTextType(type) {
  return type !== 'divider' && type !== 'image';
}

function isHeadingType(type) {
  return type === 'heading' || type === 'heading1' || type === 'heading2' || type === 'heading3';
}

export default function BlockItem({
  block,
  isFirst,
  isSelected,
  onToggleSelect,
  onFocus,
  onChange,
  onChangeTodoChecked,
  onChangeImageUrl,
  onChangeImageWidth,
  onInsertAfter,
  onSplit,
  onDeleteEmpty,
  onDeleteBlock,
  onChangeType,
  onDragStart,
  onDropReorder,
  requestFocus
}) {
  const text = block?.content?.text || '';
  const editableRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [menuSelectedIndex, setMenuSelectedIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(true);
  const imageUrl = block?.content?.url || '';
  const imageWidthPercent = Math.max(20, Math.min(100, Number(block?.content?.widthPercent || 100)));
  const imageResizeTrackRef = useRef(null);
  const imageResizeStateRef = useRef(null);
  const imageUrlInputRef = useRef(null);
  const suppressImageUrlBlurRef = useRef(false);
  const menuContainerRef = useRef(null);

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

  useEffect(() => {
    setImageLoadError(false);
  }, [imageUrl, block.type]);

  useEffect(() => {
    if (block.type !== 'image') return;
    if (!imageUrl.trim()) {
      setShowImageUrlInput(true);
      return;
    }

    if (imageLoadError) {
      setShowImageUrlInput(true);
    }
  }, [block.type, imageUrl, imageLoadError]);

  useEffect(() => {
    setMenuSelectedIndex(0);
  }, [slashQuery]);

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleImageResizeMove);
      window.removeEventListener('mouseup', stopImageResize);
    };
  }, []);

  // Handle outside clicks to close menu
  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target)) {
        setMenuOpen(false);
        setSlashQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  function handleImageResizeMove(event) {
    const state = imageResizeStateRef.current;
    if (!state) return;

    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;
    const mixedDelta = state.mode === 'corner' ? (deltaX + deltaY) / 2 : deltaX;
    const deltaPercent = (mixedDelta / state.containerWidth) * 100;
    const nextWidth = Math.max(20, Math.min(100, state.startWidthPercent + deltaPercent));

    onChangeImageWidth(block.id, nextWidth);
  }

  function stopImageResize() {
    imageResizeStateRef.current = null;
    window.removeEventListener('mousemove', handleImageResizeMove);
    window.removeEventListener('mouseup', stopImageResize);
  }

  function startImageResize(mode, event) {
    event.preventDefault();
    event.stopPropagation();
    onFocus(block.id);

    const containerWidth = imageResizeTrackRef.current?.clientWidth || 0;
    if (!containerWidth) return;

    imageResizeStateRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startWidthPercent: imageWidthPercent,
      containerWidth
    };

    window.addEventListener('mousemove', handleImageResizeMove);
    window.addEventListener('mouseup', stopImageResize);
  }

  function handleInput(e) {
    const nextText = e.currentTarget.textContent || '';
    const withoutGhostChars = nextText.replace(/[\u200B\n\r]/g, '');

    // Some browsers keep a hidden newline/zero-width node in empty contentEditable fields.
    // Clearing it restores :empty so the placeholder is visible again.
    if (!withoutGhostChars.length && nextText.length > 0) {
      e.currentTarget.textContent = '';
      onChange(block.id, '');
      return;
    }

    onChange(block.id, nextText);
  }

  function openImageUrlEditor() {
    setShowImageUrlInput(true);
    requestAnimationFrame(() => {
      if (!imageUrlInputRef.current) return;
      imageUrlInputRef.current.focus();
      imageUrlInputRef.current.select();
    });
  }

  function handleImageUrlInputBlur() {
    if (suppressImageUrlBlurRef.current) {
      suppressImageUrlBlurRef.current = false;
      return;
    }

    // Keep editor visible if URL is empty/invalid; hide when image is already valid.
    if (!imageUrl.trim()) return;
    if (imageLoadError) return;
    setShowImageUrlInput(false);
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

    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent?.stopImmediatePropagation) {
        e.nativeEvent.stopImmediatePropagation();
      }
      setMenuOpen(false);
      setSlashQuery('');

      const currentText = element.textContent || '';
      const inserted = insertTextAtCursor(element, '  ');
      if (!inserted) {
        element.textContent = `${currentText}  `;
        setCaretToEnd(element);
      }

      onChange(block.id, element.textContent || '');
      return;
    }

    const cursor = getCaretOffset(element);
    const currentText = element.textContent || '';
    const normalizedText = currentText.replace(/\u200B/g, '').trim();

    if (menuOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMenuOpen(false);
        setSlashQuery('');
        element.textContent = '';
        onChange(block.id, '');
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!menuOptions.length) return;
        setMenuSelectedIndex((prev) => (prev + 1) % menuOptions.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!menuOptions.length) return;
        setMenuSelectedIndex((prev) => (prev - 1 + menuOptions.length) % menuOptions.length);
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        setSlashQuery((prev) => prev.slice(0, -1));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (menuOptions[menuSelectedIndex]) {
          handleTypeSelect(menuOptions[menuSelectedIndex].value);
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

    if (e.key === '/' && cursor === 0 && normalizedText.length === 0) {
      e.preventDefault();
      setMenuOpen(true);
      setSlashQuery('');
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey && block.type !== 'code') {
      e.preventDefault();
      onSplit(block.id, cursor);
      return;
    }

    if (e.key === 'Backspace' && cursor === 0) {
      if (normalizedText.length === 0 && !isFirst) {
        e.preventDefault();
        onDeleteEmpty(block.id);
      }
    }
  }

  if (block.type === 'divider') {
    return (
      <div
        className={`editor-block group${isSelected ? ' is-selected-block' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onDropReorder(block.id, 'before');
        }}
      >
        <input
          type="checkbox"
          className="editor-select-checkbox"
          checked={Boolean(isSelected)}
          onChange={(e) => onToggleSelect(block.id, e.target.checked)}
          aria-label="Select block"
        />
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
        <div className="editor-image-controls">
          <button
            type="button"
            className="editor-image-delete"
            onClick={() => onDeleteBlock(block.id)}
            title="Remove divider block"
            aria-label="Remove divider block"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  if (block.type === 'image') {
    return (
      <div
        className={`editor-block group${isSelected ? ' is-selected-block' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const rect = e.currentTarget.getBoundingClientRect();
          const placement = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
          onDropReorder(block.id, placement);
        }}
      >
        <input
          type="checkbox"
          className="editor-select-checkbox"
          checked={Boolean(isSelected)}
          onChange={(e) => onToggleSelect(block.id, e.target.checked)}
          aria-label="Select block"
        />
        <button
          type="button"
          draggable
          className="editor-drag-handle"
          onDragStart={() => onDragStart(block.id)}
          aria-label="Drag block"
        >
          ::
        </button>

        <div className="editor-image-controls">
          <button
            type="button"
            className="editor-image-delete"
            onClick={() => onDeleteBlock(block.id)}
            title="Remove image block"
            aria-label="Remove image block"
          >
            ✕
          </button>
        </div>

        <div className="editor-content-wrap" onClick={() => onFocus(block.id)}>
          {showImageUrlInput ? (
            <>
              <label className="editor-image-label" htmlFor={`image-url-${block.id}`}>
                Image URL
              </label>
              <input
                id={`image-url-${block.id}`}
                ref={imageUrlInputRef}
                type="url"
                className="editor-image-url"
                value={imageUrl}
                placeholder="https://example.com/photo.jpg"
                onFocus={() => onFocus(block.id)}
                onKeyDown={(e) => {
                  if (menuOpen) {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setMenuOpen(false);
                      setSlashQuery('');
                      return;
                    }

                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (!menuOptions.length) return;
                      setMenuSelectedIndex((prev) => (prev + 1) % menuOptions.length);
                      return;
                    }

                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (!menuOptions.length) return;
                      setMenuSelectedIndex((prev) => (prev - 1 + menuOptions.length) % menuOptions.length);
                      return;
                    }

                    if (e.key === 'Backspace') {
                      e.preventDefault();
                      setSlashQuery((prev) => prev.slice(0, -1));
                      return;
                    }

                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (menuOptions[menuSelectedIndex]) {
                        handleTypeSelect(menuOptions[menuSelectedIndex].value);
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

                  if (
                    e.key === '/' &&
                    !imageUrl.trim() &&
                    e.currentTarget.selectionStart === 0 &&
                    e.currentTarget.selectionEnd === 0
                  ) {
                    e.preventDefault();
                    setMenuOpen(true);
                    setSlashQuery('');
                    return;
                  }

                  if (
                    e.key === 'Enter' &&
                    e.currentTarget.selectionStart === imageUrl.length &&
                    e.currentTarget.selectionEnd === imageUrl.length
                  ) {
                    e.preventDefault();
                    onInsertAfter(block.id);
                    return;
                  }

                  if (
                    e.key === 'Backspace' &&
                    !isFirst &&
                    !imageUrl.trim() &&
                    e.currentTarget.selectionStart === 0 &&
                    e.currentTarget.selectionEnd === 0
                  ) {
                    e.preventDefault();
                    onDeleteEmpty(block.id);
                  }
                }}
                onBlur={handleImageUrlInputBlur}
                onChange={(e) => onChangeImageUrl(block.id, e.target.value)}
              />

              {menuOpen ? (
                <div ref={menuContainerRef} className="editor-slash-menu">
                  {menuOptions.length ? (
                    menuOptions.map((option, index) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`editor-slash-item ${index === menuSelectedIndex ? 'is-selected' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleTypeSelect(option.value);
                        }}
                        onMouseEnter={() => setMenuSelectedIndex(index)}
                      >
                        {option.label}
                      </button>
                    ))
                  ) : (
                    <div className="editor-slash-empty">No matching block type</div>
                  )}
                </div>
              ) : null}
            </>
          ) : null}

          {imageUrl ? (
            <div className="editor-image-preview-wrap" ref={imageResizeTrackRef}>
              {!imageLoadError ? (
                <div className="editor-image-resize-box" style={{ width: `${imageWidthPercent}%` }}>
                  <img
                    src={imageUrl}
                    alt={block?.content?.text || 'Image block'}
                    className="editor-image-preview"
                    loading="lazy"
                    onMouseDown={() => {
                      suppressImageUrlBlurRef.current = true;
                    }}
                    onLoad={() => {
                      setImageLoadError(false);
                      setShowImageUrlInput(false);
                    }}
                    onError={() => {
                      setImageLoadError(true);
                      setShowImageUrlInput(true);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openImageUrlEditor();
                    }}
                  />
                  <button
                    type="button"
                    className="editor-image-resize-handle editor-image-resize-handle-right"
                    aria-label="Resize image from right"
                    title="Drag to resize"
                    onMouseDown={(e) => startImageResize('right', e)}
                  />
                  <button
                    type="button"
                    className="editor-image-resize-handle editor-image-resize-handle-corner"
                    aria-label="Resize image from corner"
                    title="Drag corner to resize"
                    onMouseDown={(e) => startImageResize('corner', e)}
                  />
                  <span className="editor-image-size-badge">{imageWidthPercent}%</span>
                </div>
              ) : null}
              <p className="editor-image-hint">
                {imageLoadError
                  ? 'Could not load image. Verify the URL points to a public image.'
                  : 'If preview is blank, verify the URL points to a public image.'}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (block.type === 'todo') {
    const isChecked = Boolean(block?.content?.checked);

    return (
      <div
        className={`editor-block group${isSelected ? ' is-selected-block' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const rect = e.currentTarget.getBoundingClientRect();
          const placement = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
          onDropReorder(block.id, placement);
        }}
      >
        <input
          type="checkbox"
          className="editor-select-checkbox"
          checked={Boolean(isSelected)}
          onChange={(e) => onToggleSelect(block.id, e.target.checked)}
          aria-label="Select block"
        />
        <button
          type="button"
          draggable
          className="editor-drag-handle"
          onDragStart={() => onDragStart(block.id)}
          aria-label="Drag block"
        >
          ::
        </button>

        <div className="editor-content-wrap editor-todo-wrap">
          <input
            type="checkbox"
            className="editor-todo-checkbox"
            checked={isChecked}
            onFocus={() => onFocus(block.id)}
            onChange={(e) => {
              onFocus(block.id);
              onChangeTodoChecked(block.id, e.target.checked);
            }}
            aria-label="Toggle todo"
          />

          <div
            ref={editableRef}
            className={`editor-content editor-${block.type || 'paragraph'}${isChecked ? ' is-checked' : ''}`}
            contentEditable
            suppressContentEditableWarning
            onFocus={() => onFocus(block.id)}
            onInput={handleInput}
            onKeyDownCapture={handleKeyDown}
            data-placeholder="Type / for commands"
          />

          <button
            type="button"
            className="editor-image-delete editor-inline-delete"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onDeleteBlock(block.id)}
            title="Remove todo block"
            aria-label="Remove todo block"
          >
            ✕
          </button>

          {menuOpen ? (
            <div ref={menuContainerRef} className="editor-slash-menu">
              {menuOptions.length ? (
                menuOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`editor-slash-item ${index === menuSelectedIndex ? 'is-selected' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleTypeSelect(option.value);
                    }}
                    onMouseEnter={() => setMenuSelectedIndex(index)}
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

  return (
    <div
      className={`editor-block group${isSelected ? ' is-selected-block' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const placement = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
        onDropReorder(block.id, placement);
      }}
    >
      <input
        type="checkbox"
        className="editor-select-checkbox"
        checked={Boolean(isSelected)}
        onChange={(e) => onToggleSelect(block.id, e.target.checked)}
        aria-label="Select block"
      />
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
          onKeyDownCapture={handleKeyDown}
          data-placeholder={isHeadingType(block.type) ? 'Heading' : 'Type / for commands'}
        />

        <button
          type="button"
          className="editor-image-delete editor-inline-delete"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onDeleteBlock(block.id)}
          title="Remove block"
          aria-label="Remove block"
        >
          ✕
        </button>

        {menuOpen ? (
          <div ref={menuContainerRef} className="editor-slash-menu">
            {menuOptions.length ? (
              menuOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  className={`editor-slash-item ${index === menuSelectedIndex ? 'is-selected' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleTypeSelect(option.value);
                  }}
                  onMouseEnter={() => setMenuSelectedIndex(index)}
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
