import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL, checkBackendHealth } from '../services/api';
import {
  Settings as SettingsIcon,
  Sparkles,
  User,
  Save,
  CheckCircle2,
  AlertTriangle,
  Server,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

export default function Settings() {
  const { settings, setSettings, showToast } = useApp();

  const [formData, setFormData] = useState({ ...settings });
  const [isSaved, setIsSaved] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ checked: false, online: false });

  // Probe backend status on mount
  const checkStatus = async () => {
    const res = await checkBackendHealth();
    setBackendStatus({ checked: true, ...res });
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSettings(formData);
    setIsSaved(true);
    showToast('Settings & AI configuration saved successfully!', 'success');
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '820px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Settings & Configuration</h1>
          <p className="page-header-desc">
            Manage your student profile and monitor the configured AI provider and backend connectivity.
          </p>
        </div>
      </div>

      {/* Backend & Swagger API Status Card */}
      <div className="card card-p" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: backendStatus.online ? 'var(--success-bg)' : 'var(--danger-bg)',
                color: backendStatus.online ? 'var(--success)' : 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Server size={18} />
            </div>
            <div>
              <h3>FastAPI Backend & Swagger Service</h3>
              <p className="text-sm">Localhost API connecting PyMuPDF, document retrieval, and the configured AI provider</p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={checkStatus}
          >
            <RotateCcw size={14} />
            <span>Test Connection</span>
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: 'var(--radius-full)',
                background: backendStatus.online ? 'var(--success)' : 'var(--danger)'
              }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              {backendStatus.online
                ? `Backend Connected (${API_BASE_URL})`
                : API_BASE_URL ? 'Backend Offline' : 'Backend URL Not Configured'}
            </span>
            {backendStatus.online && (
              <span className="badge badge-green">
                {backendStatus.total_documents} Docs • {backendStatus.total_chunks} Chunks
              </span>
            )}
            {backendStatus.online && (
              <span className={backendStatus.api_configured ? 'badge badge-green' : 'badge badge-amber'}>
                API key {backendStatus.api_configured ? 'configured' : 'not configured'}
              </span>
            )}
          </div>

          <a
            href={API_BASE_URL ? `${API_BASE_URL}/docs` : undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!API_BASE_URL}
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none' }}
          >
            <span>Open Swagger Docs</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Student Profile Section */}
        <div className="card card-p">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-50)',
                color: 'var(--primary-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <User size={18} />
            </div>
            <div>
              <h3>Student Profile</h3>
              <p className="text-sm">Personalize your study space and notifications</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Student Name:</label>
              <input
                type="text"
                className="input-text"
                value={formData.userName}
                onChange={(e) => handleChange('userName', e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Degree / Major:</label>
              <input
                type="text"
                className="input-text"
                value={formData.userMajor}
                onChange={(e) => handleChange('userMajor', e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Target Exam Date:</label>
              <input
                type="date"
                className="input-text"
                value={formData.targetExamDate}
                onChange={(e) => handleChange('targetExamDate', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Daily Study Target (minutes):</label>
              <input
                type="number"
                className="input-text"
                value={formData.dailyGoalMinutes}
                onChange={(e) => handleChange('dailyGoalMinutes', Number(e.target.value))}
                min={15}
                max={360}
              />
            </div>
          </div>
        </div>

        {/* AI Provider Configuration Section */}
        <div className="card card-p">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: '#f5f3ff',
                color: 'var(--purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3>Backend AI Provider Configuration</h3>
              <p className="text-sm">Provider credentials are loaded only by the backend</p>
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              background: 'var(--primary-50)',
              border: '1px solid var(--primary-100)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--primary-800)',
              lineHeight: 1.5
            }}
          >
            Configure <code>API_KEY</code> in the backend environment (or local <code>backend/.env</code>). The key stays on the backend and is never sent by the browser.
            Set <code>AI_PROVIDER</code> and <code>AI_MODEL</code> separately to choose the provider and model.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '12px' }}>
            {/* Model Selector */}
            <div
              className="input-group"
            >
              <label className="input-label">Configured AI Provider & Model:</label>
              <select className="select-input" value={backendStatus.model || ''} disabled>
                <option value={backendStatus.model || ''}>
                  {backendStatus.provider || 'Provider'} • {backendStatus.model || 'Model'}
                </option>
              </select>
            </div>

            {/* Response Style */}
            <div className="input-group">
              <label className="input-label">Tutor Response Style:</label>
              <select
                className="select-input"
                value={formData.responseStyle}
                onChange={(e) => handleChange('responseStyle', e.target.value)}
              >
                <option value="Academic & Structured">Academic & Structured (Formulas, Code, Proofs)</option>
                <option value="Concise & Direct">Concise & Direct (High-Yield Bullets)</option>
                <option value="Socratic & Step-by-Step">Socratic & Step-by-Step (Walkthrough with Examples)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSaved && (
              <span className="badge badge-green">
                <CheckCircle2 size={13} />
                <span>All changes saved</span>
              </span>
            )}
          </div>

          <button type="submit" className="btn btn-primary" id="save-settings-btn">
            <Save size={16} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
