import React, { useState, useRef } from 'react';
import { useApp, DocumentItem } from '../../context/AppContext';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  Database,
  Layers,
  FolderOpen,
  Download
} from 'lucide-react';
import { storage } from '../../lib/storage';

export const DocumentUploadStudio: React.FC = () => {
  const { documents, uploadDocument, deleteDocument, userRole, activeWorkspace, workspaces, setActiveScreen } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadDocument(e.target.files[0]);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (userRole === 'viewer') return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadDocument(e.dataTransfer.files[0]);
    }
  };

  const isViewer = userRole === 'viewer';

  // ── No workspace selected state ──────────────────────────────────
  if (!activeWorkspace) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 28px 80px' }}>
        <h1 className="font-serif" style={{ fontSize: 32, fontWeight: 400, color: '#16161a', margin: '0 0 6px 0' }}>
          Document Library
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: '#f4f4f3', border: '1px solid #eaeaea',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24
          }}>
            <FolderOpen size={28} color="#c1c1c4" />
          </div>
          <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 400, color: '#16161a', margin: '0 0 10px 0' }}>
            No workspace selected
          </h2>
          <p style={{ fontSize: 14, color: '#8e8e93', lineHeight: 1.6, textAlign: 'center', maxWidth: 380 }}>
            Create a workspace first, then come back to upload documents.
          </p>
          <button
            onClick={() => setActiveScreen('workspaces')}
            style={{
              marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#16161a', color: '#ffffff', border: 'none', borderRadius: 10,
              padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            Go to Workspaces
          </button>
        </div>
      </div>
    );
  }

  // Dynamic status breakdown calculation
  const readyCount = documents.filter(d => d.status === 'ready').length;
  const processingCount = documents.filter(d => d.status === 'processing').length;
  const uploadingCount = documents.filter(d => d.status === 'uploading').length;
  const failedCount = documents.filter(d => d.status === 'failed').length;

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 28px 80px', position: 'relative' }}>
      
      {/* Top Breadcrumb */}
      <div style={{ fontSize: 12.5, color: '#8e8e93', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace' }}>
        <span>Workspaces</span>
        <span>›</span>
        <span>{activeWorkspace.name}</span>
        <span>›</span>
        <span style={{ color: '#16161a', fontWeight: 600 }}>Documents</span>
      </div>

      {/* Header & Upload Button */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: 32, fontWeight: 400, color: '#16161a', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
            Document Library
          </h1>
          <p style={{ fontSize: 13, color: '#8e8e93', margin: 0, fontFamily: 'monospace' }}>
            {documents.length === 0
              ? `Upload your first document to ${activeWorkspace.name}.`
              : `Manage uploaded documents, chunking statuses, and vector embeddings for ${activeWorkspace.name}.`
            }
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isViewer && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, background: '#fef3c7', border: '1px solid #fde68a',
              padding: '6px 12px', borderRadius: 8, fontSize: 12, color: '#b45309', fontFamily: 'monospace'
            }}>
              <ShieldAlert size={14} />
              <span>Uploads disabled (Viewer mode)</span>
            </div>
          )}
          <button
            onClick={() => !isViewer && fileInputRef.current?.click()}
            disabled={isViewer}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: isViewer ? '#e5e5e3' : '#16161a',
              color: isViewer ? '#8e8e93' : '#ffffff',
              border: 'none', borderRadius: 8, padding: '11px 20px',
              fontSize: 13, fontWeight: 600, cursor: isViewer ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <UploadCloud size={16} />
            Upload files
          </button>
        </div>
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isViewer && fileInputRef.current?.click()}
        style={{
          borderRadius: 16, border: '2px dashed ' + (isDragging ? '#16161a' : '#e5e5e3'),
          padding: documents.length === 0 ? '64px 24px' : '48px 24px',
          textAlign: 'center', cursor: isViewer ? 'not-allowed' : 'pointer',
          background: isDragging ? '#f4f4f3' : '#ffffff',
          transition: 'all 0.2s ease', opacity: isViewer ? 0.6 : 1,
          boxShadow: '0 1px 4px rgba(0,0,0,0.02)', marginBottom: 28
        }}
      >
        <input
          type="file" ref={fileInputRef} onChange={handleFileChange}
          accept=".pdf,.docx,.doc,.txt,.csv" disabled={isViewer} style={{ display: 'none' }}
        />
        
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: '#f4f4f3',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#5e5e62'
        }}>
          <UploadCloud size={24} />
        </div>
        
        <h4 style={{ fontSize: 16, fontWeight: 700, color: '#16161a', margin: '0 0 6px 0' }}>
          {documents.length === 0 ? 'Upload your first document' : 'Drag & drop files here'}
        </h4>
        <p style={{ fontSize: 13, color: '#8e8e93', margin: '0 0 10px 0' }}>
          or <span style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}>browse files</span>
        </p>
        <p style={{ fontSize: 12, color: '#8e8e93', fontFamily: 'monospace', margin: 0 }}>
          PDF, Word, Excel · Max 50 MB per file
        </p>
      </div>

      {/* Status Counts Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20, fontSize: 12.5, fontFamily: 'monospace', flexWrap: 'wrap' }}>
        <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          ✓ {readyCount} ready
        </span>
        <span style={{ color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          ☼ {processingCount} processing
        </span>
        <span style={{ color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          ☁ {uploadingCount} uploading
        </span>
        <span style={{ color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          ! {failedCount} failed
        </span>
      </div>

      {/* Document Library Table */}
      <div style={{
        borderRadius: 16, background: '#ffffff', border: '1px solid #eaeaea',
        boxShadow: '0 1px 4px rgba(0,0,0,0.02)', overflow: 'hidden'
      }}>
        {documents.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <FileText size={32} color="#d1d1d1" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 15, color: '#16161a', fontWeight: 600, margin: '0 0 6px 0' }}>
              No documents yet
            </p>
            <p style={{ fontSize: 13, color: '#8e8e93', margin: 0, lineHeight: 1.5 }}>
              Upload your first PDF, DOCX, or TXT file to build your knowledge base.
              <br />
              Once indexed, you can query them with AI in the Chat section.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fcfcfb', borderBottom: '1px solid #eaeaea', color: '#8e8e93', fontSize: 11, textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}>
                  <th style={{ padding: '14px 24px' }}>DOCUMENT</th>
                  <th style={{ padding: '14px 20px' }}>PAGES</th>
                  <th style={{ padding: '14px 20px' }}>SIZE</th>
                  <th style={{ padding: '14px 20px' }}>STATUS</th>
                  <th style={{ padding: '14px 20px' }}>ADDED</th>
                  <th style={{ padding: '14px 24px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const wsOwner = workspaces.find(w => w.id === doc.workspaceId);
                  return (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #f4f4f3', color: '#16161a' }}>
                      
                      {/* Document Name */}
                      <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: doc.status === 'ready' ? '#d1fae5' : '#f4f4f3',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: doc.status === 'ready' ? '#059669' : '#8e8e93', flexShrink: 0
                          }}>
                            <FileText size={16} />
                          </div>
                          <div>
                            <div style={{ color: '#16161a', fontSize: 13.5 }}>{doc.filename}</div>
                            {wsOwner && (
                              <div style={{ fontSize: 11, color: '#8e8e93', fontFamily: 'monospace', marginTop: 2 }}>
                                workspace: {wsOwner.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Pages */}
                      <td style={{ padding: '16px 20px', color: '#5e5e62', fontFamily: 'monospace' }}>
                        {doc.pages ? `${doc.pages}p` : '—'}
                      </td>

                      {/* Size */}
                      <td style={{ padding: '16px 20px', color: '#8e8e93', fontFamily: 'monospace' }}>
                        {formatSize(doc.fileSize)}
                      </td>

                      {/* Status Pill / Progress Bar */}
                      <td style={{ padding: '16px 20px' }}>
                        {doc.status === 'ready' && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5, background: '#ecfdf5',
                            border: '1px solid #a7f3d0', borderRadius: 100, padding: '3px 10px',
                            fontSize: 11.5, color: '#065f46', fontWeight: 600, fontFamily: 'monospace'
                          }}>
                            <CheckCircle2 size={12} /> Ready
                          </span>
                        )}
                        {(doc.status === 'processing' || doc.status === 'uploading') && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 130 }}>
                            <div style={{ flex: 1, height: 6, background: '#f4f4f3', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{
                                width: doc.status === 'uploading' ? '40%' : '74%', height: '100%',
                                background: '#2563eb', borderRadius: 99
                              }} />
                            </div>
                            <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, fontFamily: 'monospace' }}>
                              {doc.status === 'uploading' ? '40%' : '74%'}
                            </span>
                          </div>
                        )}
                        {doc.status === 'failed' && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fef2f2',
                            border: '1px solid #fca5a5', borderRadius: 100, padding: '3px 10px',
                            fontSize: 11.5, color: '#991b1b', fontWeight: 600, fontFamily: 'monospace'
                          }}>
                            <AlertCircle size={12} /> Failed
                          </span>
                        )}
                      </td>

                      {/* Added Date */}
                      <td style={{ padding: '16px 20px', color: '#8e8e93', fontFamily: 'monospace', fontSize: 12 }}>
                        {doc.uploadedAt}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          {doc.status === 'ready' && (
                            <button
                              onClick={() => {
                                const storageKey = `workspaces/${doc.workspaceId}/documents/${doc.id}-${doc.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                                const publicUrl = storage.getPublicUrl(storageKey);
                                if (publicUrl) {
                                  window.open(publicUrl, '_blank');
                                } else {
                                  alert(`Downloading ${doc.filename}...`);
                                }
                              }}
                              title="Download document from Supabase Storage"
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#8e8e93', transition: 'color 0.15s', padding: 6,
                                borderRadius: 6
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = '#8e8e93'; }}
                            >
                              <Download size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            disabled={isViewer}
                            title={isViewer ? 'Restricted for Viewer' : 'Delete document'}
                            style={{
                              background: 'none', border: 'none', cursor: isViewer ? 'not-allowed' : 'pointer',
                              color: isViewer ? '#e5e5e3' : '#8e8e93', transition: 'color 0.15s', padding: 6,
                              borderRadius: 6
                            }}
                            onMouseEnter={(e) => { if(!isViewer) e.currentTarget.style.color = '#dc2626'; }}
                            onMouseLeave={(e) => { if(!isViewer) e.currentTarget.style.color = '#8e8e93'; }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>




    </div>
  );
};
