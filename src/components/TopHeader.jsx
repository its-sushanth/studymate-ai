import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Menu,
  Search,
  UploadCloud,
  MessageSquare,
  Sparkles,
  Calendar,
  Bell
} from 'lucide-react';

export default function TopHeader() {
  const {
    setIsSidebarOpen,
    navigateTo,
    settings,
    documents
  } = useApp();

  // Keyboard shortcut Ctrl+K to jump to search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigateTo('search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateTo]);

  // Calculate days until exam
  const examDate = new Date(settings.targetExamDate || '2026-11-15');
  const today = new Date();
  const diffTime = examDate - today;
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return (
    <header className="top-header">
      <div className="top-header-left">
        <button
          className="btn-icon"
          onClick={() => setIsSidebarOpen(true)}
          style={{ display: window.innerWidth <= 900 ? 'flex' : 'none' }}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Quick Search Bar */}
        <button
          onClick={() => navigateTo('search')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-full)',
            padding: '7px 16px',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            minWidth: '240px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary-300)';
            e.currentTarget.style.background = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-light)';
            e.currentTarget.style.background = 'var(--bg-subtle)';
          }}
        >
          <Search size={16} color="var(--text-muted)" />
          <span>Search documents & concepts...</span>
          <kbd
            style={{
              marginLeft: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: '4px',
              padding: '1px 6px',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="top-header-right">
        {/* Exam Countdown Badge */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-50)',
            border: '1px solid var(--primary-100)',
            color: 'var(--primary-700)',
            fontSize: '0.8rem',
            fontWeight: 600
          }}
          className="desktop-only"
        >
          <Calendar size={14} />
          <span>{daysLeft} days to Midterms</span>
        </div>

        {/* Ask AI Action */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigateTo('chat')}
          id="header-ask-ai-btn"
        >
          <Sparkles size={15} />
          <span>Ask AI</span>
        </button>

        {/* Upload Study Material Primary Action */}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigateTo('documents')}
          id="header-upload-btn"
        >
          <UploadCloud size={16} />
          <span>Upload Notes</span>
        </button>
      </div>
    </header>
  );
}
