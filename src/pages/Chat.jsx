import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { sendChatMessageToBackend } from '../services/api';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  BookmarkPlus,
  AlertCircle
} from 'lucide-react';

function renderChatContent(content, isUser) {
  const elements = [];
  let codeLines = [];
  let inCodeBlock = false;

  content.split('\n').forEach((line, idx) => {
    if (line.trimStart().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${idx}`}
            style={{
              overflowX: 'auto',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: isUser ? 'rgba(0,0,0,0.2)' : 'var(--bg-subtle)',
              fontSize: '0.82rem',
              lineHeight: 1.5
            }}
          >
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      elements.push(
        <h4 key={idx} style={{ margin: '12px 0 6px', fontSize: '0.98rem' }}>
          {heading[2]}
        </h4>
      );
    } else if (/^(?:-|\*)\s+/.test(line)) {
      elements.push(
        <div key={idx} style={{ display: 'flex', gap: '8px', marginLeft: '6px' }}>
          <span>•</span>
          <span>{line.replace(/^(?:-|\*)\s+/, '')}</span>
        </div>
      );
    } else if (/^\d+\.\s+/.test(line)) {
      elements.push(<p key={idx} style={{ margin: '4px 0' }}>{line}</p>);
    } else {
      elements.push(
        <p key={idx} style={{ margin: '4px 0', color: isUser ? '#ffffff' : 'var(--text-main)' }}>
          {line}
        </p>
      );
    }
  });

  if (inCodeBlock) {
    elements.push(
      <pre key="code-unclosed" style={{ overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
        <code>{codeLines.join('\n')}</code>
      </pre>
    );
  }
  return elements;
}

export default function Chat() {
  const {
    documents,
    selectedDocId,
    setSelectedDocId,
    settings,
    addNote,
    showToast
  } = useApp();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${settings.userName || 'there'}! I am your StudyMate AI Tutor. I have indexed your course documents and lecture slides.\n\nYou can ask me to explain specific programs (e.g. "Explain the second program in my uploaded programs list"), break down algorithms, or synthesize formulas. How can I assist your study session?`,
      timestamp: 'Just now',
      citations: [
        { doc_name: 'Operating Systems - Programs & Memory Management.txt', page: 'Page 1' },
        { doc_name: 'Machine Learning - Optimization Programs.txt', page: 'Page 1' }
      ]
    }
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [chatError, setChatError] = useState(null);
  const messagesEndRef = useRef(null);

  // Suggested starting questions
  const suggestedPrompts = [
    {
      label: 'Explain the 2nd Program',
      docId: 'doc-1',
      text: 'Explain the second program in my uploaded programs list.'
    },
    {
      label: 'Virtual Memory vs Paging',
      docId: 'doc-1',
      text: 'Explain the difference between Virtual Memory and Paging with real OS examples.'
    },
    {
      label: 'SGD with Momentum (Program 2)',
      docId: 'doc-2',
      text: 'Explain Program 2 on Stochastic Gradient Descent with Momentum.'
    },
    {
      label: 'Check for Unrelated Topic',
      docId: 'doc-1',
      text: 'What is the recipe for baking chocolate chip cookies?'
    }
  ];

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Copy message text to clipboard
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Save answer to Notes
  const handleSaveToNotes = (msg) => {
    const titleMatch = msg.content.slice(0, 45).replace(/[#*]/g, '').trim();
    addNote({
      id: 'note-' + Date.now(),
      title: titleMatch ? `${titleMatch}...` : 'AI Study Explanation',
      subject: 'AI Study Chat Notes',
      tags: ['AI Tutor', 'Grounded'],
      content: msg.content,
      updatedAt: 'Just now',
      docId: selectedDocId !== 'ALL' ? selectedDocId : undefined
    });
  };

  // AI Response Generator calling FastAPI backend RAG pipeline
  const handleSendMessage = async (customPrompt) => {
    const question = customPrompt || inputQuestion.trim();
    if (!question || isLoading) return;

    setChatError(null);
    const userMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      // Call FastAPI backend
      const res = await sendChatMessageToBackend(
        question,
        selectedDocId
      );

      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-' + Date.now(),
          role: 'assistant',
          content: res.answer || 'No response returned from model.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: res.citations || [],
          grounded: res.grounded !== undefined ? res.grounded : true
        }
      ]);
      setIsLoading(false);
    } catch (err) {
      console.error('Backend chat call failed:', err);
      // Informative error message with recovery option
      setChatError(`Backend communication error: ${err.message}`);
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-err-' + Date.now(),
          role: 'assistant',
          content: `⚠️ **Request Notice:** Could not complete RAG query against backend (${err.message}).\nPlease ensure the FastAPI backend is running and \`VITE_API_BASE_URL\` is configured.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: []
        }
      ]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Chat history cleared. Ask any question about your uploaded programs or course notes!`,
        timestamp: 'Just now',
        citations: []
      }
    ]);
    setChatError(null);
    showToast('Chat history reset', 'info');
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Header with Document Context Selector */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-light)',
          marginBottom: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800 }}>AI Study Chat</h1>
            <span className="badge badge-green">
              <Sparkles size={12} />
              <span>RAG Grounded</span>
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Ask questions with direct citations from your lecture notes and uploaded programs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Document Context Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Target Document:
            </span>
            <select
              className="select-input"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '0.825rem', width: 'auto', minWidth: '220px' }}
              id="chat-doc-context-select"
            >
              <option value="ALL">All Uploaded Documents ({documents.length})</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClearChat}
            className="btn btn-outline btn-sm"
            title="Start new conversation"
          >
            <RotateCcw size={14} />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Scrollable Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 4px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                flexDirection: isUser ? 'row-reverse' : 'row',
                maxWidth: isUser ? '85%' : '92%',
                alignSelf: isUser ? 'flex-end' : 'flex-start'
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  background: isUser ? 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%)' : 'var(--primary-50)',
                  color: isUser ? '#ffffff' : 'var(--primary-700)',
                  border: isUser ? 'none' : '1px solid var(--primary-200)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                {isUser ? <User size={18} /> : <Bot size={18} />}
              </div>

              {/* Message Content Bubble */}
              <div
                style={{
                  background: isUser ? 'var(--primary-600)' : 'var(--bg-surface)',
                  color: isUser ? '#ffffff' : 'var(--text-main)',
                  border: isUser ? 'none' : '1px solid var(--border-light)',
                  borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  padding: '16px 20px',
                  boxShadow: isUser ? 'var(--shadow-blue)' : 'var(--shadow-xs)',
                  lineHeight: 1.65,
                  fontSize: '0.92rem'
                }}
              >
                {/* Text Formatting */}
                <div style={{ wordBreak: 'break-word' }}>
                  {renderChatContent(msg.content, isUser)}
                </div>

                {/* Source Citations when available */}
                {msg.citations && msg.citations.length > 0 && (
                  <div
                    style={{
                      marginTop: '14px',
                      paddingTop: '10px',
                      borderTop: isUser ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border-light)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isUser ? '#e0e7ff' : 'var(--text-muted)' }}>
                      VERIFIED SOURCES:
                    </span>
                    {msg.citations.map((c, i) => (
                      <span
                        key={i}
                        className="badge"
                        style={{
                          background: isUser ? 'rgba(255,255,255,0.15)' : 'var(--primary-50)',
                          color: isUser ? '#ffffff' : 'var(--primary-700)',
                          border: isUser ? '1px solid rgba(255,255,255,0.25)' : '1px solid var(--primary-200)',
                          fontSize: '0.72rem'
                        }}
                      >
                        <BookOpen size={11} />
                        <span>{c.doc_name || c.doc} ({c.page})</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Message Footer: Actions & Timestamp */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '10px',
                    fontSize: '0.72rem',
                    color: isUser ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)'
                  }}
                >
                  <span>{msg.timestamp}</span>

                  {!isUser && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="btn-icon"
                        style={{ padding: '4px', color: 'var(--text-secondary)' }}
                        title="Copy response text"
                      >
                        {copiedId === msg.id ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                      </button>

                      <button
                        onClick={() => handleSaveToNotes(msg)}
                        className="btn-icon"
                        style={{ padding: '4px', color: 'var(--text-secondary)' }}
                        title="Save to My Notes"
                      >
                        <BookmarkPlus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble Indicator */}
        {isLoading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--primary-50)',
                color: 'var(--primary-700)',
                border: '1px solid var(--primary-200)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Bot size={18} />
            </div>
            <div
              className="card card-p-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#ffffff',
                border: '1px solid var(--primary-200)'
              }}
            >
              <div className="animate-spin" style={{ color: 'var(--primary-600)' }}>
                <Sparkles size={16} />
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Searching document chunks & formulating grounded explanation...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      {messages.length <= 2 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
            SUGGESTED GROUNDED QUESTIONS:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {suggestedPrompts.map((p, i) => (
              <button
                key={i}
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSelectedDocId(p.docId);
                  handleSendMessage(p.text);
                }}
                style={{
                  fontSize: '0.8rem',
                  background: '#ffffff',
                  borderColor: 'var(--border-light)',
                  textAlign: 'left'
                }}
              >
                <Sparkles size={13} color="var(--primary-600)" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Question Input Field Bar */}
      <div
        className="card"
        style={{
          padding: '8px 12px',
          background: '#ffffff',
          boxShadow: 'var(--shadow-md)',
          borderColor: 'var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <textarea
          rows={1}
          className="textarea-input"
          placeholder="Ask a question about your study material... (e.g. 'Explain the second program')"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            border: 'none',
            boxShadow: 'none',
            padding: '8px 4px',
            resize: 'none',
            fontSize: '0.925rem',
            lineHeight: 1.4
          }}
          id="chat-question-input"
        />

        <button
          className="btn btn-primary"
          onClick={() => handleSendMessage()}
          disabled={!inputQuestion.trim() || isLoading}
          style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)' }}
          id="chat-send-btn"
        >
          <Send size={16} />
          <span className="desktop-only">Ask AI</span>
        </button>
      </div>
    </div>
  );
}
