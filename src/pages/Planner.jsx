import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CalendarCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Filter,
  Flame,
  Check
} from 'lucide-react';

export default function Planner() {
  const {
    tasks,
    toggleTask,
    addTask,
    removeTask,
    stats,
    showToast
  } = useApp();

  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED'
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Operating Systems');
  const [newPriority, setNewPriority] = useState('High');
  const [newDueDate, setNewDueDate] = useState('2026-10-30');
  const [newMinutes, setNewMinutes] = useState(45);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'PENDING') return !t.completed;
    if (filter === 'COMPLETED') return t.completed;
    return true;
  });

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addTask({
      id: 'task-' + Date.now(),
      title: newTitle.trim(),
      subject: newSubject,
      priority: newPriority,
      dueDate: newDueDate,
      completed: false,
      estimatedMinutes: Number(newMinutes) || 30
    });

    setNewTitle('');
    setShowAddModal(false);
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Revision Planner</h1>
          <p className="page-header-desc">
            Organize high-yield exam topics, set revision deadlines, and track your daily preparation velocity.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          id="planner-add-task-btn"
        >
          <Plus size={16} />
          <span>Add Study Task</span>
        </button>
      </div>

      {/* Progress & Milestone Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '18px',
          marginBottom: '28px'
        }}
      >
        {/* Progress % */}
        <div className="card card-p">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Revision Completion
            </span>
            <span className="badge badge-green">{progressPercent}%</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>
            {completedCount} of {tasks.length} tasks
          </div>
          <div style={{ width: '100%', background: 'var(--bg-subtle)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                height: '100%',
                borderRadius: '4px',
                transition: 'width 300ms ease'
              }}
            />
          </div>
        </div>

        {/* Study Streak */}
        <div className="card card-p">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Revision Streak
            </span>
            <span className="badge badge-amber">Active 🔥</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px', color: '#b45309' }}>
            {stats.studyStreakDays} Days Consistent
          </div>
          <p className="text-sm">Keep up the daily momentum before finals!</p>
        </div>

        {/* Study Hours Target */}
        <div className="card card-p">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Time Logged
            </span>
            <span className="badge badge-blue">Target: 14 hrs</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px', color: 'var(--primary-700)' }}>
            {stats.weeklyHours} hrs
          </div>
          <p className="text-sm">Logged across quizzes & AI study sessions</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'ALL', label: `All (${tasks.length})` },
            { id: 'PENDING', label: `Pending (${tasks.length - completedCount})` },
            { id: 'COMPLETED', label: `Completed (${completedCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`btn btn-sm ${filter === tab.id ? 'btn-primary' : 'btn-outline'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredTasks.length === 0 ? (
          <div className="card card-p" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CheckCircle2 size={32} style={{ color: 'var(--success)', margin: '0 auto 10px' }} />
            <h3>No tasks in this view</h3>
            <p className="text-sm">You are all caught up! Add a new task above.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isHigh = task.priority === 'High';
            const isMed = task.priority === 'Medium';

            return (
              <div
                key={task.id}
                className="card card-interactive card-p-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  background: task.completed ? '#f8fafc' : '#ffffff',
                  opacity: task.completed ? 0.8 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                  <button
                    onClick={() => toggleTask(task.id)}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: 'var(--radius-sm)',
                      border: `2px solid ${task.completed ? 'var(--success)' : 'var(--border-hover)'}`,
                      background: task.completed ? 'var(--success)' : '#ffffff',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    {task.completed && <Check size={14} strokeWidth={3} />}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.92rem',
                        color: task.completed ? 'var(--text-muted)' : 'var(--text-main)',
                        textDecoration: task.completed ? 'line-through' : 'none'
                      }}
                    >
                      {task.title}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                        {task.subject}
                      </span>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.68rem',
                          background: isHigh ? '#fef2f2' : isMed ? '#fffbeb' : '#f0fdf4',
                          color: isHigh ? '#b91c1c' : isMed ? '#b45309' : '#15803d',
                          border: `1px solid ${isHigh ? '#fecaca' : isMed ? '#fde68a' : '#bbf7d0'}`
                        }}
                      >
                        {task.priority} Priority
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        <span>{task.estimatedMinutes} mins</span>
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        <span>Due {task.dueDate}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn-icon"
                  onClick={() => removeTask(task.id)}
                  style={{ color: 'var(--danger)', padding: '6px' }}
                  title="Delete Task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Revision Task</h3>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Task Title / Concept to Revise:</label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="e.g. Solve 5 dynamic programming recursion problems"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Subject:</label>
                  <select
                    className="select-input"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                  >
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="Database Systems">Database Systems</option>
                    <option value="Computer Networks">Computer Networks</option>
                    <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="input-group">
                    <label className="input-label">Priority:</label>
                    <select
                      className="select-input"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Estimated Time (mins):</label>
                    <input
                      type="number"
                      className="input-text"
                      value={newMinutes}
                      onChange={(e) => setNewMinutes(e.target.value)}
                      min={10}
                      max={240}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Target Completion Date:</label>
                  <input
                    type="date"
                    className="input-text"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
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
                  Add to Revision Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
