import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  FolderOpen,
  MessageSquare,
  FileText,
  HelpCircle,
  Search,
  CalendarCheck,
  TrendingUp,
  BookmarkCheck,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Flame
} from 'lucide-react';

export default function Sidebar() {
  const {
    activePage,
    navigateTo,
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    documents,
    tasks,
    settings,
    stats
  } = useApp();

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'My Documents', icon: FolderOpen, count: documents.length },
    { id: 'chat', label: 'AI Study Chat', icon: MessageSquare, badge: 'AI' },
    { id: 'summarizer', label: 'Summarizer', icon: FileText },
    { id: 'quiz', label: 'Quiz Generator', icon: HelpCircle },
    { id: 'search', label: 'Smart Search', icon: Search },
    { id: 'planner', label: 'Revision Planner', icon: CalendarCheck, count: pendingTasksCount > 0 ? pendingTasksCount : null },
    { id: 'progress', label: 'Progress Tracker', icon: TrendingUp },
    { id: 'notes', label: 'Saved Notes', icon: BookmarkCheck },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`mobile-backdrop ${isSidebarOpen ? 'show' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isSidebarOpen ? 'open' : ''}`}>
        {/* Header / Brand */}
        <div className="sidebar-header">
          <button
            onClick={() => navigateTo('dashboard')}
            className="brand"
            title="StudyMate AI Home"
            style={{ textAlign: 'left' }}
          >
            <div className="brand-icon">
              <BookOpen size={20} strokeWidth={2.5} />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="brand-text">StudyMate</span>
                  <span className="brand-badge">AI 2.0</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Smart Study Companion
                </div>
              </div>
            )}
          </button>

          <button
            className="btn-icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ display: window.innerWidth > 900 ? 'flex' : 'none' }}
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Study Streak Pill */}
        {!isSidebarCollapsed && (
          <div style={{ padding: '12px 14px 4px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '1px solid #fde68a',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#92400e'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={16} color="#d97706" />
                <span>{stats.studyStreakDays} Day Study Streak</span>
              </div>
              <span style={{ fontSize: '0.72rem', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                Active
              </span>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="sidebar-nav" aria-label="Main Navigation">
          <div className="nav-section-label">
            {!isSidebarCollapsed && 'Study Workspace'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigateTo(item.id)}
                title={item.label}
              >
                <span className="nav-item-icon">
                  <Icon size={19} strokeWidth={isActive ? 2.3 : 1.9} />
                </span>
                {!isSidebarCollapsed && (
                  <>
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                    {item.badge && (
                      <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                        {item.badge}
                      </span>
                    )}
                    {item.count !== null && item.count !== undefined && (
                      <span className="nav-item-badge">{item.count}</span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="sidebar-footer">
          <div className="user-avatar" title={settings.userName}>
            {settings.userName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </div>
          {!isSidebarCollapsed && (
            <div className="user-info" style={{ flex: 1 }}>
              <span className="user-name">{settings.userName}</span>
              <span className="user-role">{settings.userMajor}</span>
            </div>
          )}
          {!isSidebarCollapsed && (
            <button
              onClick={() => navigateTo('settings')}
              className="btn-icon"
              title="Profile & Settings"
              style={{ padding: '6px' }}
            >
              <Sparkles size={16} color="var(--primary-600)" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
