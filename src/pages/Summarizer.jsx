import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { summarizeDocumentBackend } from '../services/api';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  BookmarkPlus,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

export default function Summarizer() {
  const {
    documents,
    selectedDocId,
    setSelectedDocId,
    addNote,
    showToast
  } = useApp();

  const [summaryLength, setSummaryLength] = useState('medium'); // 'short' | 'medium' | 'detailed'
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Active document
  const activeDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  // Fetch or regenerate summary from backend
  const fetchSummary = async (docId, length) => {
    if (!docId) return;
    setIsGenerating(true);
    setErrorMsg(null);
    setSummaryData(null);

    try {
      const res = await summarizeDocumentBackend(docId, length);
      setSummaryData({
        title: res.doc_name || activeDoc?.name || 'Document Summary',
        meta: `Generated from ${res.word_count || 500} words • ${length === 'detailed' ? 'Comprehensive AI Summary' : 'Grounded Summary'}`,
        detailedText: length === 'detailed' ? res.summary_text : null,
        execSummary: res.exec_summary || (length === 'detailed' ? '' : res.summary_text) || 'Summary generated.',
        keyConcepts: res.key_concepts || [],
        takeaways: res.takeaways || [],
        examChecklist: [
          'Explain the primary algorithms and their asymptotic time complexity.',
          'Trace through sample inputs and boundary conditions.',
          'Detail the system requirements and hardware interfaces.'
        ]
      });
      setIsGenerating(false);
    } catch (err) {
      console.error('Summarize error:', err);
      setIsGenerating(false);
      setErrorMsg(`Failed to generate summary: ${err.message}`);
      showToast(`Summarizer: ${err.message}`, 'error');
    }
  };

  useEffect(() => {
    if (selectedDocId) {
      fetchSummary(selectedDocId, summaryLength);
    }
  }, [selectedDocId, summaryLength]);

  // Copy summary to clipboard
  const handleCopySummary = () => {
    if (!summaryData) return;
    const formatted = summaryData.detailedText
      ? `${summaryData.title}\n\n${summaryData.detailedText}`
      : `${summaryData.title}\n\n${summaryData.execSummary}\n\nKey Concepts:\n${summaryData.keyConcepts
        .map((c) => `- ${c.term}: ${c.def}`)
        .join('\n')}\n\nKey Takeaways:\n${summaryData.takeaways.map((t) => `- ${t}`).join('\n')}`;

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    showToast('Summary copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  // Save to Notes
  const handleSaveToNotes = () => {
    if (!summaryData) return;
    addNote({
      id: 'note-' + Date.now(),
      title: `Summary: ${summaryData.title}`,
      subject: activeDoc?.topic || 'Course Notes',
      tags: ['Summary', 'AI Generated'],
      content: summaryData.detailedText || `${summaryData.execSummary}\n\nKey Concepts:\n${summaryData.keyConcepts
        .map((c) => `* ${c.term}: ${c.def}`)
        .join('\n')}\n\nTakeaways:\n${summaryData.takeaways.map((t) => `* ${t}`).join('\n')}`,
      updatedAt: 'Just now',
      docId: activeDoc?.id
    });
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Smart Summarizer</h1>
          <p className="page-header-desc">
            Condense lengthy academic papers, textbook chapters, and lecture PDFs into executive overviews, formula sheets, and high-yield exam takeaways.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleCopySummary}
            disabled={!summaryData || isGenerating}
            id="copy-summary-btn"
          >
            {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSaveToNotes}
            disabled={!summaryData || isGenerating}
            id="save-summary-note-btn"
          >
            <BookmarkPlus size={14} />
            <span>Save to Notes</span>
          </button>
        </div>
      </div>

      {/* Control Panel Card */}
      <div className="card card-p" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          {/* Document selection */}
          <div style={{ flex: '1 1 320px' }}>
            <label className="input-label" style={{ marginBottom: '6px' }}>
              Select Source Document:
            </label>
            <select
              className="select-input"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              id="summarizer-doc-select"
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.size})
                </option>
              ))}
            </select>
          </div>

          {/* Length Selector */}
          <div>
            <label className="input-label" style={{ marginBottom: '6px' }}>
              Summary Depth:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'short', label: 'Short', hint: 'Quick Bullets' },
                { id: 'medium', label: 'Medium', hint: 'Balanced' },
                { id: 'detailed', label: 'Detailed', hint: 'In-Depth' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSummaryLength(opt.id)}
                  className={`btn btn-sm ${summaryLength === opt.id ? 'btn-primary' : 'btn-outline'}`}
                  style={{ display: 'flex', flexDirection: 'column', padding: '6px 14px' }}
                >
                  <span style={{ fontWeight: 700 }}>{opt.label}</span>
                  <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
            fontSize: '0.9rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary Output Display */}
      {isGenerating ? (
        <div className="card card-p" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div className="animate-spin" style={{ color: 'var(--primary-600)', margin: '0 auto 16px' }}>
            <Sparkles size={32} />
          </div>
          <h3 style={{ marginBottom: '8px' }}>Extracting Document Text & Synthesizing Summary...</h3>
          <p className="text-sm">Processing through backend RAG summarization pipeline...</p>
        </div>
      ) : summaryData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Executive Overview Card */}
          <div className="card card-p">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '14px' }}>
              <span className="badge badge-blue">
                <Lightbulb size={12} />
                <span>{summaryData.detailedText ? 'Detailed Summary' : 'Executive Summary'}</span>
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {summaryData.meta}
              </span>
            </div>

            <h2 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{summaryData.title}</h2>
            <p style={{ fontSize: '0.96rem', lineHeight: 1.7, color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
              {summaryData.detailedText || summaryData.execSummary}
            </p>
          </div>

          {/* Key Concepts & Definitions */}
          {!summaryData.detailedText && summaryData.keyConcepts && summaryData.keyConcepts.length > 0 && (
            <div className="card card-p">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span className="badge badge-purple">
                  <BookOpen size={12} />
                  <span>Core Concepts & Definitions</span>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {summaryData.keyConcepts.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <h4 style={{ color: 'var(--primary-700)', marginBottom: '6px', fontSize: '0.9rem' }}>
                      {item.term}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      {item.def}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Takeaways */}
          {!summaryData.detailedText && summaryData.takeaways && summaryData.takeaways.length > 0 && (
            <div className="card card-p">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span className="badge badge-amber">
                  <AlertTriangle size={12} />
                  <span>Critical Takeaways</span>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {summaryData.takeaways.map((takeaway, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: 'var(--radius-full)',
                        background: '#fef3c7',
                        color: '#b45309',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      {idx + 1}
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                      {takeaway}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
