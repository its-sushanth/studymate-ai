import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Award,
  Flame,
  CheckCircle2,
  Calendar,
  Clock,
  BookOpen,
  HelpCircle,
  BarChart2,
  PieChart,
  Target
} from 'lucide-react';

export default function Progress() {
  const { stats, tasks, documents } = useApp();

  const [timeRange, setTimeRange] = useState('week'); // 'week' | 'month' | 'semester'

  const subjectMastery = [
    { subject: 'Operating Systems', progress: 92, topicsMastered: '8/9 Topics', color: 'var(--primary-600)' },
    { subject: 'Machine Learning', progress: 85, topicsMastered: '7/8 Topics', color: 'var(--purple)' },
    { subject: 'Database Systems', progress: 88, topicsMastered: '6/7 Topics', color: 'var(--success)' },
    { subject: 'Computer Networks', progress: 64, topicsMastered: '4/7 Topics', color: 'var(--warning)' }
  ];

  const badges = [
    {
      title: 'Study Streak Champion',
      desc: `${stats.studyStreakDays} consecutive study days logged`,
      icon: Flame,
      color: '#d97706',
      bg: '#fffbeb',
      unlocked: true
    },
    {
      title: 'Knowledge Vault',
      desc: `${documents.length} course documents indexed`,
      icon: BookOpen,
      color: 'var(--primary-600)',
      bg: 'var(--primary-50)',
      unlocked: true
    },
    {
      title: 'Quiz Master',
      desc: `${stats.quizzesCompleted} practice quizzes completed with >85% average`,
      icon: Award,
      color: 'var(--purple)',
      bg: '#f5f3ff',
      unlocked: true
    },
    {
      title: 'Midterm Ready',
      desc: 'Complete all high priority revision checklist tasks',
      icon: Target,
      color: 'var(--success)',
      bg: 'var(--success-bg)',
      unlocked: tasks.some((t) => t.completed)
    }
  ];

  return (
    <div className="page-wrapper">
      {/* Page Header with Time Range Filter */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Progress & Analytics</h1>
          <p className="page-header-desc">
            Detailed breakdown of your syllabus mastery, quiz test scores, revision streak, and exam readiness.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'semester', label: 'Full Semester' }
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`btn btn-sm ${timeRange === range.id ? 'btn-primary' : 'btn-outline'}`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Performance Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          marginBottom: '28px'
        }}
      >
        <div className="card card-p">
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Average Quiz Score
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)', margin: '8px 0 4px' }}>
            {stats.avgQuizScore}%
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Across {stats.quizzesCompleted} completed quizzes
          </span>
        </div>

        <div className="card card-p">
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Questions Solved
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-700)', margin: '8px 0 4px' }}>
            {stats.totalQuestionsAnswered}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Concept questions verified
          </span>
        </div>

        <div className="card card-p">
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Hours Logged
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: '8px 0 4px' }}>
            {stats.weeklyHours}h
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Total study session duration
          </span>
        </div>

        <div className="card card-p">
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Retention Rate
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--purple)', margin: '8px 0 4px' }}>
            {stats.retentionRate}%
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Spaced repetition mastery
          </span>
        </div>
      </div>

      {/* Grid: Subject Mastery & Quiz Score Distribution */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}
      >
        {/* Subject Mastery Progress Bars */}
        <div className="card card-p">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3>Curriculum Subject Mastery</h3>
              <p className="text-sm">Derived from practice quiz results and notes reviewed</p>
            </div>
            <span className="badge badge-green">Overall: 82%</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {subjectMastery.map((item, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.subject}</span>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.825rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{item.topicsMastered}</span>
                    <span style={{ fontWeight: 700, color: item.color }}>{item.progress}%</span>
                  </div>
                </div>

                <div style={{ width: '100%', height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${item.progress}%`,
                      height: '100%',
                      background: item.color,
                      borderRadius: '4px',
                      transition: 'width 400ms ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score Tier Distribution */}
        <div className="card card-p">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3>Quiz Score Performance Tier</h3>
              <p className="text-sm">Distribution across all taken tests</p>
            </div>
            <span className="badge badge-blue">14 Tests</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            {[
              { tier: '90% - 100% (High Distinction)', count: 8, percent: 57, color: 'var(--success)' },
              { tier: '80% - 89% (Distinction)', count: 4, percent: 29, color: 'var(--primary-600)' },
              { tier: '70% - 79% (Credit)', count: 2, percent: 14, color: 'var(--warning)' },
              { tier: 'Below 70% (Needs Review)', count: 0, percent: 0, color: 'var(--danger)' }
            ].map((t, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{t.tier}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {t.count} quizzes ({t.percent}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${t.percent}%`,
                      height: '100%',
                      background: t.color,
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '22px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-50)',
              border: '1px solid var(--primary-100)',
              fontSize: '0.825rem',
              color: 'var(--primary-800)',
              lineHeight: 1.5
            }}
          >
            💡 <strong>AI Study Recommendation:</strong> Your scores on Virtual Memory & ML Optimization are consistently high (&gt;90%). Consider spending 30 mins this evening reviewing Computer Networks protocols.
          </div>
        </div>
      </div>

      {/* Gamified Achievements / Milestones */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>Study Achievements</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {badges.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="card card-p"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  background: b.unlocked ? '#ffffff' : '#f8fafc',
                  opacity: b.unlocked ? 1 : 0.6
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: 'var(--radius-md)',
                    background: b.bg,
                    color: b.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={24} />
                </div>

                <div>
                  <h4 style={{ fontSize: '0.92rem', marginBottom: '2px' }}>{b.title}</h4>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {b.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
