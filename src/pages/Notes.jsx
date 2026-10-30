import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookmarkCheck,
  Plus,
  Search,
  Trash2,
  Edit3,
  Copy,
  Check,
  BookOpen,
  Calendar,
  Tag
} from 'lucide-react';

export default function Notes() {
  const { notes, addNote, updateNote, removeNote, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [editingNote, setEditingNote] = useState(null); // note object or null
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Form fields for new note
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubject, setNoteSubject] = useState('Operating Systems');
  const [noteTags, setNoteTags] = useState('Exam Prep, Memory');
  const [noteContent, setNoteContent] = useState('');

  // Extract all unique tags
  const allTags = ['ALL', ...new Set(notes.flatMap((n) => n.tags || []))];

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'ALL' || (n.tags && n.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const handleCreateNote = (e) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    addNote({
      id: 'note-' + Date.now(),
      title: noteTitle.trim(),
      subject: noteSubject,
      tags: noteTags.split(',').map((t) => t.trim()).filter(Boolean),
      content: noteContent.trim(),
      updatedAt: 'Just now'
    });

    setNoteTitle('');
    setNoteContent('');
    setShowAddModal(false);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingNote) return;

    updateNote(editingNote.id, {
      title: editingNote.title,
      subject: editingNote.subject,
      content: editingNote.content
    });
    setEditingNote(null);
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Note copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Saved Notes & Flashcards</h1>
          <p className="page-header-desc">
            Personal repository of synthesized key points, formula cheat sheets, and excerpts saved from AI Chat and Smart Summarizer.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          id="notes-create-btn"
        >
          <Plus size={16} />
          <span>Create Note</span>
        </button>
      </div>

      {/* Search and Tag Filtering Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          marginBottom: '22px'
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
            placeholder="Search saved notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`btn btn-sm ${selectedTag === tag ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.78rem' }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="card card-p" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <BookmarkCheck size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h3>No notes found</h3>
          <p className="text-sm">Create your first study note or save answers from AI Study Chat.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '18px'
          }}
        >
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="card card-interactive card-p"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                    {note.subject}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {note.updatedAt}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', marginBottom: '10px', color: 'var(--text-main)' }}>
                  {note.title}
                </h3>

                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    display: '-webkit-box',
                    WebkitLineClamp: 6,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginBottom: '14px'
                  }}
                >
                  {note.content}
                </p>
              </div>

              <div>
                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {note.tags?.map((t, idx) => (
                    <span key={idx} className="badge badge-gray" style={{ fontSize: '0.68rem' }}>
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-light)'
                  }}
                >
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleCopy(note.id, `${note.title}\n\n${note.content}`)}
                    style={{ padding: '4px 8px' }}
                  >
                    {copiedId === note.id ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                    <span>{copiedId === note.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn-icon"
                      onClick={() => setEditingNote(note)}
                      title="Edit Note"
                      style={{ padding: '6px' }}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => removeNote(note.id)}
                      title="Delete Note"
                      style={{ color: 'var(--danger)', padding: '6px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Note Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Study Note</h3>
            </div>
            <form onSubmit={handleCreateNote}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Note Title:</label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="e.g. Page Replacement Algorithm Comparison"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="input-group">
                    <label className="input-label">Subject:</label>
                    <input
                      type="text"
                      className="input-text"
                      placeholder="e.g. Operating Systems"
                      value={noteSubject}
                      onChange={(e) => setNoteSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Tags (comma-separated):</label>
                    <input
                      type="text"
                      className="input-text"
                      placeholder="Exam, Memory, Cheat Sheet"
                      value={noteTags}
                      onChange={(e) => setNoteTags(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Content & Key Takeaways:</label>
                  <textarea
                    rows={6}
                    className="textarea-input"
                    placeholder="Type or paste formulas, summaries, and lecture notes here..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="modal-overlay" onClick={() => setEditingNote(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Note</h3>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Title:</label>
                  <input
                    type="text"
                    className="input-text"
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Subject:</label>
                  <input
                    type="text"
                    className="input-text"
                    value={editingNote.subject}
                    onChange={(e) => setEditingNote({ ...editingNote, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Content:</label>
                  <textarea
                    rows={8}
                    className="textarea-input"
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setEditingNote(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
