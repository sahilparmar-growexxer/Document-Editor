import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel
} from 'docx';
import BlockEditor from '../components/editor/BlockEditor';
import {
  apiFetch,
  ensureSession,
  logoutSession,
  listBlocks,
  enableDocumentShare,
  disableDocumentShare
} from '../lib/apiClient';

export default function DocumentEditorPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collabUrl, setCollabUrl] = useState('');
  const [commandRequest, setCommandRequest] = useState(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState('');
  const [exportError, setExportError] = useState('');

  function runEditorCommand(action, value = '') {
    setCommandRequest({ action, value, stamp: Date.now() });
  }

  function getRelativeDayLabel(dateValue) {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((today - target) / 86400000);

    if (diffDays <= 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  }

  function getDocumentTimestamp(item) {
    return item.updated_at || item.updatedAt || item.created_at || item.createdAt || null;
  }

  async function createNewDocument() {
    setError('');
    try {
      const created = await apiFetch('/documents', {
        method: 'POST',
        body: JSON.stringify({ title: 'Untitled' })
      });
      setDocuments((prev) => [created, ...prev]);
      navigate(`/dashboard/${created.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create document');
    }
  }

  async function deleteDocumentById(id) {
    if (!id) return;

    const confirmed = window.confirm('do you want to delete?');
    if (!confirmed) return;

    setError('');
    try {
      await apiFetch(`/documents/${id}`, { method: 'DELETE' });

      const remaining = documents.filter((item) => item.id !== id);
      setDocuments(remaining);

      if (id === document?.id) {
        if (remaining.length > 0) {
          navigate(`/dashboard/${remaining[0].id}`);
        } else {
          const created = await apiFetch('/documents', {
            method: 'POST',
            body: JSON.stringify({ title: 'Untitled' })
          });
          setDocuments([created]);
          navigate(`/dashboard/${created.id}`);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to delete document');
    }
  }

  async function loadDocument() {
    setLoading(true);
    setError('');
    try {
      const rows = await apiFetch('/documents');
      setDocuments(rows);
      const found = rows.find((item) => item.id === documentId);
      if (!found) {
        setError('Document not found');
        setLoading(false);
        return;
      }

      setDocument(found);
      setTitle(found.title || 'Untitled');
      const sharePath = found.share_token ? `/share/${found.share_token}` : '';
      setCollabUrl(sharePath ? `${window.location.origin}${sharePath}` : 'Enable sharing to generate collaboration URL');
    } catch (err) {
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    (async () => {
      const ok = await ensureSession();
      if (!active) return;
      if (!ok) {
        navigate('/login');
        return;
      }

      loadDocument();
    })();

    return () => {
      active = false;
    };
  }, [documentId, navigate]);

  async function saveTitle() {
    if (!document) return;
    const next = title.trim();
    if (!next || next === document.title) return;

    try {
      const updated = await apiFetch(`/documents/${document.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: next })
      });
      setDocument(updated);
      setTitle(updated.title || 'Untitled');
      setDocuments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err.message || 'Failed to save title');
    }
  }

  async function handleEnableShare() {
    if (!document) return;
    try {
      const updated = await enableDocumentShare(document.id);
      setDocument(updated);
      setDocuments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setCollabUrl(`${window.location.origin}/share/${updated.share_token}`);
    } catch (err) {
      setError(err.message || 'Could not enable share');
    }
  }

  async function handleDisableShare() {
    if (!document) return;
    try {
      const updated = await disableDocumentShare(document.id);
      setDocument(updated);
      setDocuments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setCollabUrl('Enable sharing to generate collaboration URL');
    } catch (err) {
      setError(err.message || 'Could not disable share');
    }
  }

  async function copyCollabUrl() {
    if (!document?.is_public || !document?.share_token) return;
    await navigator.clipboard.writeText(`${window.location.origin}/share/${document.share_token}`);
  }

  async function logout() {
    await logoutSession();
    navigate('/login');
  }

  function sanitizeFileName(value) {
    const raw = (value || 'document').trim().toLowerCase();
    const safe = raw.replace(/[^a-z0-9-_ ]/g, '').replace(/\s+/g, '-').slice(0, 60);
    return safe || 'document';
  }

  function sortBlocks(blocks) {
    return [...blocks].sort((a, b) => {
      if (a.order_index === b.order_index) {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      return Number(a.order_index || 0) - Number(b.order_index || 0);
    });
  }

  function toExportLines(blocks) {
    return sortBlocks(blocks)
      .flatMap((block) => {
        const text = String(block?.content?.text || '').trim();
        const url = String(block?.content?.url || '').trim();
        const checked = Boolean(block?.content?.checked);

        if (block.type === 'divider') {
          return ['------------------------------'];
        }

        if (block.type === 'image') {
          return [];
        }

        if (block.type === 'todo') {
          return [`${checked ? '[x]' : '[ ]'} ${text || 'Todo item'}`];
        }

        if (block.type === 'heading' || block.type === 'heading1') {
          return [`# ${text || 'Untitled section'}`];
        }

        if (block.type === 'heading2') {
          return [`## ${text || 'Untitled section'}`];
        }

        if (block.type === 'heading3') {
          return [`### ${text || 'Untitled section'}`];
        }

        if (block.type === 'code') {
          return ['```', text || '', '```'];
        }

        return [text || ''];
      });
  }

  async function fetchImageDataUrl(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Could not load image');
    }

    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not convert image'));
      reader.readAsDataURL(blob);
    });
  }

  async function getImageSize(dataUrl) {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Could not measure image'));
      image.src = dataUrl;
    });
  }

  async function exportAsPdf(blocks, baseName, titleText) {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const left = 42;
    const right = 42;
    const maxWidth = pageWidth - left - right;
    const maxImageWidth = maxWidth;
    const maxImageHeight = 360;
    let y = 48;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);

    if (titleText) {
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(titleText, maxWidth);
      titleLines.forEach((line) => {
        if (y > pageHeight - 42) {
          pdf.addPage();
          y = 48;
        }
        pdf.text(line, left, y);
        y += 20;
      });
      y += 8;
      pdf.setFont('helvetica', 'normal');
    }

    const sortedBlocks = sortBlocks(blocks);

    for (const block of sortedBlocks) {
      const text = String(block?.content?.text || '').trim();
      const url = String(block?.content?.url || '').trim();
      const checked = Boolean(block?.content?.checked);

      if (block.type === 'divider') {
        if (y > pageHeight - 42) {
          pdf.addPage();
          y = 48;
        }
        pdf.setDrawColor(156, 163, 175);
        pdf.line(left, y, pageWidth - right, y);
        y += 16;
        continue;
      }

      if (block.type === 'image') {
        if (!url) continue;

        try {
          const dataUrl = await fetchImageDataUrl(url);
          const dimensions = await getImageSize(dataUrl);
          const ratio = Math.min(maxImageWidth / dimensions.width, maxImageHeight / dimensions.height, 1);
          const drawWidth = dimensions.width * ratio;
          const drawHeight = dimensions.height * ratio;
          const imageType = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';

          if (y + drawHeight > pageHeight - 42) {
            pdf.addPage();
            y = 48;
          }

          pdf.addImage(dataUrl, imageType, left, y, drawWidth, drawHeight, undefined, 'FAST');
          y += drawHeight + 12;
        } catch (_err) {
          if (y > pageHeight - 42) {
            pdf.addPage();
            y = 48;
          }
          pdf.setFontSize(10);
          pdf.setTextColor(107, 114, 128);
          pdf.text('Image could not be loaded', left, y);
          pdf.setFontSize(12);
          pdf.setTextColor(17, 24, 39);
          y += 18;
        }

        continue;
      }

      if (block.type === 'todo') {
        const todoText = `${checked ? '[x]' : '[ ]'} ${text || 'Todo item'}`;
        const wrapped = pdf.splitTextToSize(todoText, maxWidth);
        wrapped.forEach((segment) => {
          if (y > pageHeight - 42) {
            pdf.addPage();
            y = 48;
          }
          pdf.text(segment, left, y);
          y += 18;
        });
        y += 4;
        continue;
      }

      if (block.type === 'heading' || block.type === 'heading1') {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        const wrapped = pdf.splitTextToSize(text || 'Untitled section', maxWidth);
        wrapped.forEach((segment) => {
          if (y > pageHeight - 42) {
            pdf.addPage();
            y = 48;
          }
          pdf.text(segment, left, y);
          y += 20;
        });
        y += 4;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        continue;
      }

      if (block.type === 'heading2') {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        const wrapped = pdf.splitTextToSize(text || 'Untitled section', maxWidth);
        wrapped.forEach((segment) => {
          if (y > pageHeight - 42) {
            pdf.addPage();
            y = 48;
          }
          pdf.text(segment, left, y);
          y += 18;
        });
        y += 4;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        continue;
      }

      if (block.type === 'heading3') {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        const wrapped = pdf.splitTextToSize(text || 'Untitled section', maxWidth);
        wrapped.forEach((segment) => {
          if (y > pageHeight - 42) {
            pdf.addPage();
            y = 48;
          }
          pdf.text(segment, left, y);
          y += 17;
        });
        y += 2;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        continue;
      }

      if (block.type === 'code') {
        const codeLines = ['```', text || '', '```'];
        pdf.setFont('courier', 'normal');
        codeLines.forEach((line) => {
          const wrapped = pdf.splitTextToSize(line || ' ', maxWidth);
          wrapped.forEach((segment) => {
            if (y > pageHeight - 42) {
              pdf.addPage();
              y = 48;
            }
            pdf.text(segment, left, y);
            y += 16;
          });
        });
        y += 6;
        pdf.setFont('helvetica', 'normal');
        continue;
      }

      const wrapped = pdf.splitTextToSize(text || ' ', maxWidth);
      wrapped.forEach((segment) => {
        if (y > pageHeight - 42) {
          pdf.addPage();
          y = 48;
        }
        pdf.text(segment, left, y);
        y += 18;
      });
      y += 4;
    }

    pdf.save(`${baseName}.pdf`);
  }

  async function exportAsDocx(lines, titleText, baseName) {
    const paragraphs = [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun(titleText || 'Untitled')]
      }),
      ...lines.map((line) => new Paragraph({ children: [new TextRun(line || ' ')] }))
    ];

    const doc = new DocxDocument({
      sections: [
        {
          properties: {},
          children: paragraphs
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${baseName}.docx`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function exportAsPptx(lines, titleText, baseName) {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';

    const slide = pptx.addSlide();
    slide.addText(titleText || 'Untitled', {
      x: 0.5,
      y: 0.3,
      w: 12.2,
      h: 0.4,
      bold: true,
      fontSize: 24,
      color: '111827'
    });

    slide.addText(lines.join('\n'), {
      x: 0.5,
      y: 1,
      w: 12.2,
      h: 5.8,
      fontSize: 16,
      color: '374151',
      valign: 'top'
    });

    await pptx.writeFile({ fileName: `${baseName}.pptx` });
  }

  async function handleExport(format) {
    if (!document?.id) return;

    setExportError('');
    setExportingFormat(format);

    try {
      const blocks = await listBlocks(document.id);
      const exportBlocks = Array.isArray(blocks) ? blocks : [];
      const lines = toExportLines(exportBlocks);
      const baseName = sanitizeFileName(title || document.title || 'document');
      const titleText = (title || document.title || 'Untitled').trim();

      if (format === 'pdf') {
        await exportAsPdf(exportBlocks, baseName, titleText);
      } else if (format === 'docx') {
        await exportAsDocx(lines, titleText, baseName);
      } else if (format === 'pptx') {
        await exportAsPptx(lines, titleText, baseName);
      }

      setIsExportDialogOpen(false);
    } catch (err) {
      setExportError(err.message || 'Export failed');
    } finally {
      setExportingFormat('');
    }
  }

  if (loading) {
    return (
      <main className="bn-page">
        <div className="bn-stage" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '3px solid #e5e7eb',
                borderTopColor: '#8b5cf6',
                animation: 'bn-spin 1s linear infinite'
              }}
            />
            <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.95rem' }}>Loading document...</p>
            <style>{`@keyframes bn-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="bn-page">
        <div className="bn-stage" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '560px', textAlign: 'center' }}>
            <p
              style={{
                marginBottom: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid #fecdd3',
                backgroundColor: '#fff1f2',
                color: '#be123c',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem'
              }}
            >
              {error || 'Document not found'}
            </p>
            <Link
              to="/dashboard"
              style={{
                display: 'inline-block',
                borderRadius: '0.75rem',
                border: '1px solid #d4d4d8',
                backgroundColor: '#fff',
                color: '#4b5563',
                padding: '0.6rem 1rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#a78bfa';
                e.target.style.color = '#6d28d9';
                e.target.style.backgroundColor = '#faf5ff';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#d4d4d8';
                e.target.style.color = '#4b5563';
                e.target.style.backgroundColor = '#fff';
              }}
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const orderedDocuments = [...documents].sort((a, b) => {
    const aOrder = Number(a.order_index || 0);
    const bOrder = Number(b.order_index || 0);
    if (aOrder === bOrder) {
      const aTime = new Date(getDocumentTimestamp(a) || 0).getTime();
      const bTime = new Date(getDocumentTimestamp(b) || 0).getTime();
      return bTime - aTime;
    }
    return bOrder - aOrder;
  });

  return (
    <main className="bn-page">
      <header className="bn-top-nav">
        <Link to="/dashboard" className="bn-brand">BlockNote</Link>
        <nav>
          <Link to="/" className="bn-nav-link">Home</Link>
          <Link to="/dashboard" className="bn-nav-link">Dashboard</Link>
          <button type="button" onClick={logout} className="bn-nav-button">Logout</button>
        </nav>
      </header>

      <section className="bn-stage">
        <h1>
          Try <span>BlockNote</span>
        </h1>

        <div className="bn-collab-bar">
          <p>Share this URL:</p>
          <input readOnly value={collabUrl} />
          <button type="button" onClick={copyCollabUrl} disabled={!document.is_public}>
            Copy Link
          </button>
        </div>

        <div className="bn-window">
          <div className="bn-window-head">
            <div className="bn-dots">
              <span />
              <span />
              <span />
            </div>
            <div className="bn-window-actions">
              <button type="button" onClick={document.is_public ? handleDisableShare : handleEnableShare}>
                {document.is_public ? 'Disable Share' : 'Share'}
              </button>
              <span className="bn-separator" />
              <button type="button" onClick={() => setIsExportDialogOpen(true)}>Export</button>
            </div>
          </div>

          <div className="bn-window-body">
            <aside className="bn-docs-sidebar">
              <div className="bn-docs-sidebar-brand">BlockNote</div>
              <button type="button" className="bn-docs-new" onClick={createNewDocument}>
                +
                <span>New Document</span>
              </button>
              <div className="bn-docs-sidebar-divider" />
              <div className="bn-docs-list">
                {orderedDocuments.length ? (
                  orderedDocuments.map((item) => (
                    <div key={item.id} className={`bn-docs-item-row${item.id === document.id ? ' is-active' : ''}`}>
                      <button
                        type="button"
                        className={`bn-docs-item${item.id === document.id ? ' is-active' : ''}`}
                        onClick={() => {
                          if (item.id !== document.id) {
                            navigate(`/dashboard/${item.id}`);
                          }
                        }}
                      >
                        <span className="bn-docs-item-title">{item.title || 'Untitled'}</span>
                        <span className="bn-docs-item-meta">{getRelativeDayLabel(getDocumentTimestamp(item))}</span>
                      </button>
                      <button
                        type="button"
                        className="bn-docs-delete"
                        aria-label={`Delete ${item.title || 'Untitled document'}`}
                        title="Delete document"
                        onClick={() => deleteDocumentById(item.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="bn-docs-empty">No documents</p>
                )}
              </div>
            </aside>
            <section className="bn-editor-col">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                className="bn-title-input"
              />
              <BlockEditor
                document={document}
                showShareControls={false}
                commandRequest={commandRequest}
                onDocumentMetaChange={(updated) => {
                  setDocument(updated);
                  setDocuments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                }}
              />
            </section>
            <aside className="bn-command-panel">
              <header className="bn-command-head">
                <h3>Commands</h3>
                <p>Apply to focused block</p>
              </header>

              <div className="bn-command-list">
                <button type="button" onClick={() => runEditorCommand('set-type', 'paragraph')}>Paragraph</button>
                
                <div className="bn-command-heading-group">
                  <label htmlFor="heading-select">Heading</label>
                  <select
                    id="heading-select"
                    className="bn-command-heading-select"
                    onChange={(e) => {
                      if (e.target.value) {
                        runEditorCommand('set-type', e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Select level...</option>
                    <option value="heading1">Heading 1</option>
                    <option value="heading2">Heading 2</option>
                    <option value="heading3">Heading 3</option>
                  </select>
                </div>
                
                <button type="button" onClick={() => runEditorCommand('set-type', 'todo')}>Todo</button>
                <button type="button" onClick={() => runEditorCommand('set-type', 'code')}>Code Block</button>
                <button type="button" onClick={() => runEditorCommand('set-type', 'image')}>Image</button>
                <button type="button" onClick={() => runEditorCommand('set-type', 'divider')}>Divider</button>
                <button type="button" onClick={() => runEditorCommand('insert')}>+ Add New Block</button>
              </div>

              <p className="bn-command-note">
                Click inside a block first, then choose a command.
              </p>
            </aside>
          </div>
        </div>

        {error ? <p className="bn-banner-error">{error}</p> : null}

        {isExportDialogOpen ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 60,
              padding: '1rem'
            }}
            onClick={() => {
              if (!exportingFormat) {
                setIsExportDialogOpen(false);
                setExportError('');
              }
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '460px',
                borderRadius: '0.9rem',
                border: '1px solid #d4d4d8',
                backgroundColor: '#fff',
                boxShadow: '0 16px 40px rgba(15, 23, 42, 0.2)',
                padding: '1rem'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>Export Document</h3>
              <p style={{ margin: '0.45rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                Choose the format you want to download.
              </p>

              <div style={{ display: 'grid', gap: '0.55rem', marginTop: '0.9rem' }}>
                <button
                  type="button"
                  disabled={Boolean(exportingFormat)}
                  onClick={() => handleExport('pdf')}
                  style={{
                    textAlign: 'left',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.65rem',
                    padding: '0.65rem 0.75rem',
                    background: '#fff',
                    color: '#1f2937',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: exportingFormat ? 'not-allowed' : 'pointer'
                  }}
                >
                  PDF (.pdf)
                </button>
                <button
                  type="button"
                  disabled={Boolean(exportingFormat)}
                  onClick={() => handleExport('docx')}
                  style={{
                    textAlign: 'left',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.65rem',
                    padding: '0.65rem 0.75rem',
                    background: '#fff',
                    color: '#1f2937',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: exportingFormat ? 'not-allowed' : 'pointer'
                  }}
                >
                  DOCX (.docx)
                </button>
                <button
                  type="button"
                  disabled={Boolean(exportingFormat)}
                  onClick={() => handleExport('pptx')}
                  style={{
                    textAlign: 'left',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.65rem',
                    padding: '0.65rem 0.75rem',
                    background: '#fff',
                    color: '#1f2937',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: exportingFormat ? 'not-allowed' : 'pointer'
                  }}
                >
                  PPTX (.pptx)
                </button>
              </div>

              {exportingFormat ? (
                <p style={{ margin: '0.8rem 0 0', fontSize: '0.82rem', color: '#4b5563' }}>
                  Preparing {exportingFormat.toUpperCase()} download...
                </p>
              ) : null}

              {exportError ? (
                <p
                  style={{
                    margin: '0.75rem 0 0',
                    padding: '0.5rem 0.6rem',
                    borderRadius: '0.55rem',
                    border: '1px solid #fecdd3',
                    backgroundColor: '#fff1f2',
                    color: '#be123c',
                    fontSize: '0.8rem'
                  }}
                >
                  {exportError}
                </p>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.9rem' }}>
                <button
                  type="button"
                  disabled={Boolean(exportingFormat)}
                  onClick={() => {
                    setIsExportDialogOpen(false);
                    setExportError('');
                  }}
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '0.6rem',
                    background: '#fff',
                    color: '#4b5563',
                    padding: '0.45rem 0.8rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: exportingFormat ? 'not-allowed' : 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
