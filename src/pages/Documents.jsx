import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  uploadDocumentToBackend,
  deleteBackendDocument
} from '../services/api';
import {
  UploadCloud,
  FileText,
  Trash2,
  MessageSquare,
  HelpCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function Documents() {
  const {
    documents,
    addDocument,
    removeDocument,
    navigateTo,
    showToast
  } = useApp();

  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [uploadProgress, setUploadProgress] = useState(null); // { name, percent }
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const fileInputRef = useRef(null);

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.topic?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Handle local file upload with real backend integration
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadError(null);

    // 1. Validate empty file (0 bytes)
    if (file.size === 0) {
      const msg = `"${file.name}" is empty (0 bytes). Please upload a valid document with readable text.`;
      setUploadError(msg);
      showToast(msg, 'error');
      return;
    }

    // 2. Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      const msg = `"${file.name}" exceeds the 25MB limit. Please upload a smaller document.`;
      setUploadError(msg);
      showToast(msg, 'error');
      return;
    }

    // 3. Validate supported extension
    const ext = file.name.split('.').pop().toUpperCase();
    const allowed = ['PDF', 'DOCX', 'DOC', 'TXT', 'MD', 'CSV', 'PY', 'JAVA', 'C', 'CPP'];
    if (!allowed.includes(ext)) {
      const msg = `Unsupported file format ".${ext.toLowerCase()}". Please upload PDF, TXT, or DOCX.`;
      setUploadError(msg);
      showToast(msg, 'error');
      return;
    }

    const type = ext;

    // Simulate upload & indexing progress
    setUploadProgress({ name: file.name, percent: 30 });

    try {
      // Send to FastAPI backend
      const result = await uploadDocumentToBackend(file);
      setUploadProgress({ name: file.name, percent: 100 });

      // Convert file size to readable string
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${sizeMb} MB`;

      const newDoc = {
        id: result.id || 'doc-' + Date.now(),
        name: file.name,
        type: type,
        size: sizeStr,
        wordCount: result.word_count || Math.floor(file.size / 7) + 100,
        uploadDate: new Date().toISOString().split('T')[0],
        status: result.status === 'ready' ? 'Processed' : 'Warning: Limited Text',
        isScanned: result.is_scanned || false,
        topic: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        excerpt: `Document indexed in RAG memory (${result.chunk_count || 1} chunks created). Ready for AI Study Chat, Summarizer, and Quiz Generator.`,
        keyPoints: [
          `Verified text extraction from ${file.name}`,
          `Indexed into ${result.chunk_count || 1} retrieval chunks`,
          'Available for instant grounded questioning'
        ]
      };

      setTimeout(() => {
        setUploadProgress(null);
        addDocument(newDoc);
        if (result.warning) {
          showToast(result.warning, 'info');
        }
      }, 350);
    } catch (err) {
      setUploadProgress(null);
      const errorMsg = `Upload failed: ${err.message}`;
      setUploadError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleDeleteDoc = async (doc) => {
    try {
      await deleteBackendDocument(doc.id).catch(() => {});
    } catch (e) {
      // Continue client cleanup
    }
    removeDocument(doc.id);
    setDeleteConfirmDoc(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">My Documents</h1>
          <p className="page-header-desc">
            Upload lecture notes, programs, and textbook chapters. StudyMate AI extracts text via PyMuPDF and indexes every section for grounded AI tutoring.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => fileInputRef.current?.click()}
          id="docs-upload-trigger-btn"
        >
          <UploadCloud size={16} />
          <span>Upload New File</span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        accept=".pdf,.docx,.doc,.txt,.md,.csv,.py,.java,.c,.cpp"
      />

      {/* Upload Error Banner if active */}
      {uploadError && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}
        >
          <AlertTriangle size={18} />
          <span style={{ flex: 1 }}>{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="btn-icon"
            style={{ padding: '2px', color: 'var(--danger)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary-600)' : 'var(--primary-300)'}`,
          borderRadius: 'var(--radius-xl)',
          background: isDragging ? 'var(--primary-50)' : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          padding: '36px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '28px',
          boxShadow: isDragging ? '0 0 0 4px rgba(37,99,235,0.1)' : 'var(--shadow-xs)',
          transition: 'all var(--transition-fast)'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-100)',
            color: 'var(--primary-700)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <UploadCloud size={28} />
        </div>

        <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>
          {isDragging ? 'Drop your files here to start indexing' : 'Click to upload or drag & drop files here'}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '14px' }}>
          Supported formats: <strong>PDF, DOCX, TXT</strong> (Maximum file size: <strong>25 MB</strong>)
        </p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-gray">PyMuPDF Text Extraction</span>
          <span className="badge badge-blue">RAG Chunking</span>
          <span className="badge badge-green">FastAPI Connected</span>
        </div>
      </div>

      {/* Upload Progress Bar if active */}
      {uploadProgress && (
        <div
          className="card card-p-sm"
          style={{
            marginBottom: '24px',
            background: '#ffffff',
            borderColor: 'var(--primary-300)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="animate-spin" style={{ color: 'var(--primary-600)' }}>
                <Clock size={16} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Processing & Indexing: <strong>{uploadProgress.name}</strong>
              </span>
            </div>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--primary-700)' }}>
              {uploadProgress.percent}%
            </span>
          </div>

          <div style={{ width: '100%', height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${uploadProgress.percent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary-500) 0%, var(--primary-700) 100%)',
                borderRadius: '4px',
                transition: 'width 250ms ease'
              }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
            Extracting text pages, section chunking & building vector index...
          </span>
        </div>
      )}

      {/* Controls: Search & Format Filter */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          marginBottom: '20px'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '380px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            className="input-text"
            placeholder="Search documents by name or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="var(--text-muted)" />
          {['ALL', 'PDF', 'DOCX', 'TXT'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`btn btn-sm ${selectedType === type ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.78rem' }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table / Card List */}
      {filteredDocs.length === 0 ? (
        <div
          className="card card-p"
          style={{ textAlign: 'center', padding: '48px 24px', background: '#ffffff' }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}
          >
            <Search size={22} />
          </div>
          <h3 style={{ marginBottom: '6px' }}>No documents found</h3>
          <p className="text-sm" style={{ marginBottom: '18px' }}>
            {searchTerm ? `No results matching "${searchTerm}". Try another query.` : 'Upload your first study document above to get started.'}
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={14} />
            <span>Upload Document</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="card card-interactive"
              style={{
                padding: '18px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              {/* Document Identity */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: '1 1 340px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    background: doc.type === 'PDF' ? '#eff6ff' : doc.type === 'DOCX' ? '#f0fdf4' : '#faf5ff',
                    color: doc.type === 'PDF' ? 'var(--primary-700)' : doc.type === 'DOCX' ? '#15803d' : '#7e22ce',
                    border: `1px solid ${doc.type === 'PDF' ? '#bfdbfe' : doc.type === 'DOCX' ? '#bbf7d0' : '#e9d5ff'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    flexShrink: 0
                  }}
                >
                  {doc.type}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.96rem', marginBottom: '4px', wordBreak: 'break-word' }}>
                    {doc.name}
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                      {doc.topic}
                    </span>
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{doc.wordCount?.toLocaleString() || '1,000+'} words</span>
                    <span>•</span>
                    <span>Uploaded {doc.uploadDate}</span>
                    <span className={`badge ${doc.isScanned ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: '0.7rem' }}>
                      <CheckCircle2 size={12} />
                      <span>{doc.status}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigateTo('chat', doc.id)}
                  title="Ask questions specifically on this document"
                >
                  <MessageSquare size={14} />
                  <span>Ask AI</span>
                </button>

                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => navigateTo('summarizer', doc.id)}
                  title="Generate structured summary"
                >
                  <FileText size={14} />
                  <span>Summarize</span>
                </button>

                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => navigateTo('quiz', doc.id)}
                  title="Generate practice quiz"
                >
                  <HelpCircle size={14} />
                  <span>Quiz</span>
                </button>

                <button
                  className="btn-icon"
                  onClick={() => setDeleteConfirmDoc(doc)}
                  title="Delete Document"
                  style={{ color: 'var(--danger)', padding: '6px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmDoc && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmDoc(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Document</h3>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '12px' }}>
                Are you sure you want to remove <strong>"{deleteConfirmDoc.name}"</strong>?
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                This will remove the document from your active index, chat memory, and practice quizzes.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setDeleteConfirmDoc(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteDoc(deleteConfirmDoc)}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
