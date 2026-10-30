import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateQuizBackend } from '../services/api';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ChevronRight,
  BookOpen,
  Check
} from 'lucide-react';

export default function Quiz() {
  const {
    documents,
    selectedDocId,
    setSelectedDocId,
    recordQuizResult,
    showToast
  } = useApp();

  const [subject, setSubject] = useState('Computer Science');
  const [topic, setTopic] = useState('Operating Systems');
  const [questionCount, setQuestionCount] = useState(3);
  const [difficulty, setDifficulty] = useState('Medium');
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qId]: optionIndex }
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState([]);

  // Start Quiz with backend RAG generation
  const handleStartQuiz = async () => {
    setIsLoadingQuiz(true);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(0);

    try {
      const res = await generateQuizBackend(
        selectedDocId !== 'ALL' ? selectedDocId : null,
        subject.trim(),
        topic,
        questionCount,
        difficulty
      );

      if (res && res.questions && res.questions.length > 0) {
        setActiveQuestions(res.questions);
      } else {
        throw new Error('No quiz questions were returned for this subject and topic.');
      }
    } catch (err) {
      showToast(`Quiz generation failed: ${err.message}`, 'error');
      setIsLoadingQuiz(false);
      return;
    } finally {
      setIsLoadingQuiz(false);
    }
    setIsQuizActive(true);
  };

  // Select Option
  const handleSelectOption = (questionId, optionIndex) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Submit Quiz
  const handleSubmitQuiz = () => {
    let correctCount = 0;
    activeQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });

    setScore(correctCount);
    setIsSubmitted(true);
    recordQuizResult(correctCount, activeQuestions.length);

    const percentage = Math.round((correctCount / activeQuestions.length) * 100);

    // Trigger celebratory confetti if score >= 70%
    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Fallback gracefully
      }
      showToast(`Outstanding! You scored ${percentage}% (${correctCount}/${activeQuestions.length})`, 'success');
    } else {
      showToast(`Quiz completed: ${percentage}% score. Review the explanations below.`, 'info');
    }
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">AI Quiz Generator</h1>
          <p className="page-header-desc">
            Test your understanding with curriculum-aligned multiple-choice questions grounded in your course materials.
          </p>
        </div>
      </div>

      {/* Quiz Setup Controls Card */}
      {!isQuizActive ? (
        <div className="card card-p" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: '#f5f3ff',
                color: 'var(--purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HelpCircle size={22} />
            </div>
            <div>
              <h3>Configure Practice Quiz</h3>
              <p className="text-sm">Customize source document, topic, and difficulty</p>
            </div>
          </div>

          {/* Source Document Selection */}
          <div className="input-group">
            <label className="input-label">Source Document (or All Syllabus):</label>
            <select
              className="select-input"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              id="quiz-source-select"
            >
              <option value="ALL">All Course Materials</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="quiz-subject-input">Subject:</label>
              <input
                className="input-text"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Computer Science"
                id="quiz-subject-input"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="quiz-topic-input">Topic:</label>
              <input
                className="input-text"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Virtual Memory and Paging"
                id="quiz-topic-input"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {/* Number of Questions */}
            <div>
              <label className="input-label">Questions:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[3, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setQuestionCount(num)}
                    className={`btn btn-sm ${questionCount === num ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="input-label">Difficulty:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Easy', 'Medium', 'Hard'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`btn btn-sm ${difficulty === lvl ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleStartQuiz}
            disabled={isLoadingQuiz || !subject.trim() || !topic.trim()}
            style={{ width: '100%' }}
            id="start-quiz-btn"
          >
            <Sparkles size={18} />
            <span>{isLoadingQuiz ? 'Generating Grounded Quiz...' : 'Start Practice Quiz'}</span>
          </button>
        </div>
      ) : (
        /* Active Quiz View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Progress Header Bar */}
          <div
            className="card card-p-sm"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-purple">{subject}: {topic}</span>
              <span className="badge badge-gray">{difficulty} Level</span>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                {Object.keys(selectedAnswers).length} of {activeQuestions.length} answered
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isSubmitted && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={18} color="var(--primary-600)" />
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-700)' }}>
                    Score: {score} / {activeQuestions.length} ({Math.round((score / activeQuestions.length) * 100)}%)
                  </span>
                </div>
              )}

              <button
                className="btn btn-outline btn-sm"
                onClick={() => setIsQuizActive(false)}
              >
                <RotateCcw size={14} />
                <span>Configure New Quiz</span>
              </button>
            </div>
          </div>

          {/* Question Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {activeQuestions.map((q, qIndex) => {
              const selectedOpt = selectedAnswers[q.id];

              return (
                <div
                  key={q.id}
                  className="card card-p"
                  style={{
                    borderColor: isSubmitted
                      ? selectedOpt === q.correctIndex
                        ? 'var(--success-border)'
                        : 'var(--danger-border)'
                      : 'var(--border-light)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--primary-50)',
                          color: 'var(--primary-700)',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        Q{qIndex + 1}
                      </span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{q.question}</h3>
                    </div>

                    {isSubmitted && (
                      <div>
                        {selectedOpt === q.correctIndex ? (
                          <span className="badge badge-green">
                            <CheckCircle2 size={13} />
                            <span>Correct</span>
                          </span>
                        ) : (
                          <span className="badge badge-amber" style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' }}>
                            <XCircle size={13} />
                            <span>Incorrect</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Options List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    {q.options.map((option, optIdx) => {
                      const isSelected = selectedOpt === optIdx;
                      const isCorrect = q.correctIndex === optIdx;

                      let btnBorder = 'var(--border-light)';
                      let btnBg = 'var(--bg-surface)';
                      let btnColor = 'var(--text-main)';

                      if (isSubmitted) {
                        if (isCorrect) {
                          btnBorder = 'var(--success)';
                          btnBg = 'var(--success-bg)';
                          btnColor = '#065f46';
                        } else if (isSelected && !isCorrect) {
                          btnBorder = 'var(--danger)';
                          btnBg = 'var(--danger-bg)';
                          btnColor = '#991b1b';
                        }
                      } else if (isSelected) {
                        btnBorder = 'var(--primary-600)';
                        btnBg = 'var(--primary-50)';
                        btnColor = 'var(--primary-800)';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${btnBorder}`,
                            background: btnBg,
                            color: btnColor,
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            fontWeight: isSelected ? 600 : 500,
                            transition: 'all var(--transition-fast)',
                            cursor: isSubmitted ? 'default' : 'pointer'
                          }}
                        >
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: 'var(--radius-full)',
                              border: `1px solid ${isSelected ? 'var(--primary-600)' : 'var(--border-hover)'}`,
                              background: isSelected ? 'var(--primary-600)' : 'transparent',
                              color: isSelected ? '#ffffff' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              flexShrink: 0
                            }}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span style={{ flex: 1 }}>{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation Section */}
                  {isSubmitted && (
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-light)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={14} color="var(--primary-600)" />
                        <span>Explanation & Course Rationale:</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submission and Action Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '12px'
            }}
          >
            {!isSubmitted ? (
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmitQuiz}
                disabled={Object.keys(selectedAnswers).length === 0}
                id="submit-quiz-btn"
              >
                <Check size={18} />
                <span>Submit & View Explanations</span>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={handleStartQuiz}
                >
                  <RotateCcw size={16} />
                  <span>Retry Quiz</span>
                </button>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => setIsQuizActive(false)}
                >
                  <span>Choose Another Topic</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
