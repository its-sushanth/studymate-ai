import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  UploadCloud,
  MessageSquare,
  FileText,
  HelpCircle,
  Search,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  Flame,
  ChevronRight,
  Info
} from 'lucide-react';

export default function Dashboard() {
  const {
    navigateTo,
    documents,
    tasks,
    stats,
    settings
  } = useApp();

  const [weeklyView, setWeeklyView] = useState('hours');

  // Weekly study data for the interactive chart
  const weeklyActivity = [
    { day: 'Mon', hours: 2.2, label: '2h 12m' },
    { day: 'Tue', hours: 1.8, label: '1h 48m' },
    { day: 'Wed', hours: 3.1, label: '3h 06m' },
    { day: 'Thu', hours: 2.5, label: '2h 30m' },
    { day: 'Fri', hours: 1.2, label: '1h 12m' },
    { day: 'Sat', hours: 2.9, label: '2h 54m' },
    { day: 'Sun', hours: 3.4, label: '3h 24m', isToday: true }
  ];

  const maxHours = Math.max(...weeklyActivity.map((d) => d.hours));

  return (
    <div className="page-wrapper">
      {/* Welcome Hero Banner */}
      <div
        className="card card-p"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)',
          borderColor: 'var(--primary-200)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '28px'
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: '-30px',
            top: '-40px',
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0) 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ maxWidth: '780px', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--primary-50)',
              border: '1px solid var(--primary-200)',
              color: 'var(--primary-700)',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '14px'
            }}
          >
            <Sparkles size={13} />
            <span>Welcome back, {settings.userName}</span>
          </div>

          <h1 style={{ fontSize: '2.1rem', marginBottom: '10px', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
            Your personal AI study space.
          </h1>

          <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
            Upload lecture notes, clarify complex syllabus concepts, test your mastery with auto-generated quizzes, and prepare for your upcoming exams with precision.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigateTo('documents')}
              id="dash-upload-primary-btn"
            >
              <UploadCloud size={18} />
              <span>Upload Study Material</span>
            </button>

            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigateTo('chat')}
              id="dash-ask-ai-btn"
            >
              <MessageSquare size={18} />
              <span>Ask AI Question</span>
            </button>

            <button
              className="btn btn-outline btn-lg"
              onClick={() => navigateTo('quiz')}
              id="dash-start-quiz-btn"
            >
              <HelpCircle size={18} />
              <span>Take Practice Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Project Data Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          fontSize: '0.825rem',
          color: 'var(--text-secondary)'
        }}
      >
        <span className="badge badge-green">Live Project Data</span>
        <span>
          Showing active study metrics for <strong>{settings.userMajor}</strong> ({documents.length} documents indexed).
        </span>
      </div>

      {/* 4 Key Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          marginBottom: '32px'
        }}
      >
        {/* Card 1: Documents */}
        <div
          className="card card-interactive card-p"
          onClick={() => navigateTo('documents')}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Documents Uploaded
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileText size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
            {documents.length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--success)' }}>
            <CheckCircle2 size={14} />
            <span>All indexed & ready for AI</span>
          </div>
        </div>

        {/* Card 2: Quizzes Completed */}
        <div
          className="card card-interactive card-p"
          onClick={() => navigateTo('quiz')}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Quizzes Completed
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: '#f5f3ff',
                color: 'var(--purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HelpCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
            {stats.quizzesCompleted}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {stats.totalQuestionsAnswered} total questions answered
          </div>
        </div>

        {/* Card 3: Avg Quiz Score */}
        <div
          className="card card-interactive card-p"
          onClick={() => navigateTo('progress')}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Average Quiz Score
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--success-bg)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Award size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            {stats.avgQuizScore}%
          </div>
          <div style={{ width: '100%', background: 'var(--bg-subtle)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${stats.avgQuizScore}%`,
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                height: '100%',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        {/* Card 4: Study Progress */}
        <div
          className="card card-interactive card-p"
          onClick={() => navigateTo('planner')}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Study Streak & Hours
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: '#fffbeb',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
            {stats.studyStreakDays} <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>days</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {stats.weeklyHours} hours recorded this week
          </div>
        </div>
      </div>

      {/* Main Grid: Continue Learning & Study Activity Chart */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}
      >
        {/* Continue Learning Section */}
        <div className="card card-p">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3>Continue Learning</h3>
              <p className="text-sm">Pick up where you left off</p>
            </div>
            <button
              onClick={() => navigateTo('documents')}
              className="btn btn-ghost btn-sm"
              style={{ gap: '4px' }}
            >
              <span>View all</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {documents.slice(0, 3).map((doc, idx) => {
              // Simulated progress for learning
              const progressValues = [78, 45, 90];
              const progress = progressValues[idx] || 60;

              return (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-surface-hover)',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-300)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0, marginRight: '16px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--primary-50)',
                        color: 'var(--primary-700)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        flexShrink: 0
                      }}
                    >
                      {doc.type}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {doc.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                          {doc.topic}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {doc.wordCount.toLocaleString()} words
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => navigateTo('chat', doc.id)}
                      className="btn btn-secondary btn-sm"
                      title="Chat with Document"
                    >
                      <span>Study</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Study Activity Chart */}
        <div className="card card-p">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3>Weekly Study Activity</h3>
              <p className="text-sm">{stats.weeklyHours} hours completed this week</p>
            </div>
            <span className="badge badge-blue">Target: 14h</span>
          </div>

          {/* Bar Chart Visualization */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '170px', padding: '16px 8px 8px', gap: '12px' }}>
            {weeklyActivity.map((day) => {
              const heightPercent = Math.round((day.hours / maxHours) * 100);
              return (
                <div
                  key={day.day}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    height: '100%',
                    justifyContent: 'flex-end'
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {day.label}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${heightPercent}%`,
                      background: day.isToday
                        ? 'linear-gradient(180deg, var(--primary-500) 0%, var(--primary-700) 100%)'
                        : 'var(--primary-200)',
                      borderRadius: '6px 6px 2px 2px',
                      transition: 'height 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: day.isToday ? 'var(--shadow-blue)' : 'none'
                    }}
                    title={`${day.day}: ${day.label}`}
                  />
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: day.isToday ? 700 : 500,
                      color: day.isToday ? 'var(--primary-700)' : 'var(--text-secondary)'
                    }}
                  >
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}
          >
            <span>Peak study day: <strong>Sunday (3h 24m)</strong></span>
            <button
              onClick={() => navigateTo('progress')}
              className="btn btn-ghost btn-sm"
              style={{ padding: '2px 8px', color: 'var(--primary-600)' }}
            >
              Detailed Analytics &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>Quick Study Tools</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}
        >
          {/* Action 1: AI Chat */}
          <div
            className="card card-interactive card-p"
            onClick={() => navigateTo('chat')}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}
              >
                <MessageSquare size={20} />
              </div>
              <h4 style={{ marginBottom: '6px' }}>AI Study Chat</h4>
              <p className="text-sm" style={{ marginBottom: '16px' }}>
                Ask detailed questions with accurate citations from your lecture notes and slides.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 600, color: 'var(--primary-600)' }}>
              <span>Start asking</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Action 2: Summarizer */}
          <div
            className="card card-interactive card-p"
            onClick={() => navigateTo('summarizer')}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}
              >
                <FileText size={20} />
              </div>
              <h4 style={{ marginBottom: '6px' }}>Smart Summarizer</h4>
              <p className="text-sm" style={{ marginBottom: '16px' }}>
                Extract executive overviews, key concepts, formulas, and high-yield exam takeaways.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 600, color: 'var(--success)' }}>
              <span>Summarize notes</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Action 3: Quiz Generator */}
          <div
            className="card card-interactive card-p"
            onClick={() => navigateTo('quiz')}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: '#f5f3ff',
                  color: 'var(--purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}
              >
                <HelpCircle size={20} />
              </div>
              <h4 style={{ marginBottom: '6px' }}>Quiz Generator</h4>
              <p className="text-sm" style={{ marginBottom: '16px' }}>
                Generate customized multiple-choice tests with varying difficulty and answer rationales.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 600, color: 'var(--purple)' }}>
              <span>Generate quiz</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Action 4: Smart Search */}
          <div
            className="card card-interactive card-p"
            onClick={() => navigateTo('search')}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: '#fffbeb',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}
              >
                <Search size={20} />
              </div>
              <h4 style={{ marginBottom: '6px' }}>Smart Search</h4>
              <p className="text-sm" style={{ marginBottom: '16px' }}>
                Instant semantic search across all uploaded PDFs, DOCX files, and course textbooks.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 600, color: '#d97706' }}>
              <span>Search knowledge</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
