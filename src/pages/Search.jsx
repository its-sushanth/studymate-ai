import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { searchContentBackend } from '../services/api';
import {
  Search as SearchIcon,
  BookOpen,
  MessageSquare,
  FileText
} from 'lucide-react';

export default function Search() {
  const { navigateTo } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const exampleQueries = [
    'Explain Program 2 on Page Fault Handler',
    'Virtual Memory & Address Translation',
    'Stochastic Gradient Descent with Momentum',
    'LRU Page Replacement Algorithm'
  ];

  // Perform search
  const performSearch = async (q) => {
    const query = q !== undefined ? q : searchQuery;
    if (!query || !query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await searchContentBackend(query.trim());
      if (data && data.results) {
        setResults(data.results);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      }
    }, 280);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleExampleClick = (query) => {
    setSearchQuery(query);
    performSearch(query);
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Smart Semantic Search</h1>
          <p className="page-header-desc">
            Instantly query all lecture notes, textbook chapters, and indexed PDFs. Retrieve exact page passages, formulas, and program definitions.
          </p>
        </div>
      </div>

      {/* Search Input Card */}
      <div className="card card-p" style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <SearchIcon
            size={20}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--primary-600)'
            }}
          />
          <input
            type="text"
            className="input-text"
            placeholder="Search programs, algorithms, or concepts... (e.g. 'Program 2', 'LRU replacement', 'SGD momentum')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '48px',
              paddingRight: '16px',
              height: '52px',
              fontSize: '1rem',
              boxShadow: 'var(--shadow-xs)'
            }}
            id="smart-search-input"
            autoFocus
          />
        </div>

        {/* Example Query Suggestions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            TRY SEARCHING:
          </span>
          {exampleQueries.map((ex, i) => (
            <button
              key={i}
              onClick={() => handleExampleClick(ex)}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.78rem', padding: '4px 10px', background: 'var(--bg-subtle)' }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          padding: '0 4px'
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {searchQuery ? `Showing ${results.length} verified passages across course materials` : 'Type a query to search document knowledge base'}
        </span>
      </div>

      {/* Results List */}
      {isSearching ? (
        <div className="card card-p" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="animate-spin" style={{ color: 'var(--primary-600)', margin: '0 auto 12px' }}>
            <SearchIcon size={28} />
          </div>
          <p className="text-sm">Querying document chunks and vector index...</p>
        </div>
      ) : results.length === 0 && searchQuery ? (
        <div className="card card-p" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <SearchIcon size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h3>No matching passages found</h3>
          <p className="text-sm" style={{ marginTop: '4px' }}>
            Try searching for related keywords like <strong>"Program 2"</strong>, <strong>"Paging"</strong>, or <strong>"Gradient"</strong>.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {results.map((item, idx) => (
            <div
              key={item.chunk_id || idx}
              className="card card-interactive card-p"
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-blue">
                    <BookOpen size={11} />
                    <span>{item.doc_name}</span>
                  </span>
                  <span className="badge badge-gray">Page {item.page_number}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>
                    {item.match_score}% Semantic Match
                  </span>
                </div>
              </div>

              {item.section_title && (
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{item.section_title}</h3>
              )}

              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {item.text}
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigateTo('chat', item.doc_id)}
                    title="Ask AI questions on this specific excerpt"
                  >
                    <MessageSquare size={13} />
                    <span>Ask AI in Chat</span>
                  </button>

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigateTo('summarizer', item.doc_id)}
                    title="Summarize document"
                  >
                    <FileText size={13} />
                    <span>Summarize Doc</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
