import { useState, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const PILLAR_META = {
  behavioral:           { label: 'Behavioral',       color: '#6366f1', emoji: '🤝' },
  product_metric_sense: { label: 'Product & Metrics', color: '#a78bfa', emoji: '📊' },
  data_modeling:        { label: 'Data Modeling',    color: '#0891b2', emoji: '🗄️' },
  sql:                  { label: 'SQL',              color: '#059669', emoji: '🔍' },
  python:               { label: 'Python',           color: '#d97706', emoji: '🐍' },
  system_design:        { label: 'System Design',    color: '#dc2626', emoji: '🏗️' },
};

const SCORE_COLOR = {
  1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#6366f1',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseQuestions(text) {
  // Try tagged format first
  const tagged = text.match(/<questions>([\s\S]*?)<\/questions>/);
  const raw = tagged ? tagged[1].trim() : text.match(/\[[\s\S]*\]/)?.[0];

  if (!raw) {
    console.error('parseQuestions: no <questions> tag or JSON array found.\nRaw response:', text);
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (e) {
    console.error('parseQuestions: JSON.parse failed:', e.message, '\nRaw:', raw);
    return null;
  }
}

function parseDebrief(text) {
  const m = text.match(/<debrief>([\s\S]*?)<\/debrief>/);
  if (!m) return null;
  try { return JSON.parse(m[1].trim()); }
  catch { return null; }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PillarBadge({ pillar }) {
  if (!pillar || !PILLAR_META[pillar]) return null;
  const meta = PILLAR_META[pillar];
  return (
    <div className="pillar-badge" style={{ borderColor: meta.color, color: meta.color }}>
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </div>
  );
}

function ReadinessRing({ score }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#6366f1' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg className="readiness-ring" width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="10" />
      <circle
        cx="70" cy="70" r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dashoffset 1.2s ease' }}
      />
      <text x="70" y="63" textAnchor="middle" fill="var(--text)" fontSize="26" fontWeight="700"
        fontFamily="'Fira Code', monospace">
        {score}%
      </text>
      <text x="70" y="83" textAnchor="middle" fill="var(--text-2)" fontSize="11"
        fontFamily="'Inter', sans-serif">
        Readiness
      </text>
    </svg>
  );
}

function PillarScoreCard({ pillarKey, data }) {
  const meta = PILLAR_META[pillarKey];
  const pct = (data.score / 5) * 100;
  const barColor = SCORE_COLOR[data.score] || '#6366f1';

  return (
    <div className="pillar-score-card">
      <div className="psc-header">
        <span className="psc-emoji">{meta?.emoji}</span>
        <span className="psc-label">{meta?.label || pillarKey}</span>
        <span className="psc-score" style={{ color: barColor }}>{data.score}/5</span>
      </div>
      <div className="psc-bar-bg">
        <div className="psc-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <div className="psc-rating" style={{ color: barColor }}>{data.label}</div>
    </div>
  );
}

// ─── Generating Screen ────────────────────────────────────────────────────────

function GeneratingScreen({ error, onBack }) {
  if (error) {
    return (
      <div className="generating-screen">
        <p className="generating-error">⚠️ {error}</p>
        <button className="reset-btn" onClick={onBack}>← Back to Setup</button>
      </div>
    );
  }
  return (
    <div className="generating-screen">
      <div className="generating-spinner" />
      <p className="generating-text">Generating your interview questions…</p>
    </div>
  );
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────

function SetupScreen({ onStart }) {
  const [name, setName] = useState('');
  const [jd, setJd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleStart = () => {
    if (!jd.trim() || submitting) return;
    setSubmitting(true);
    onStart(name.trim(), jd.trim());
  };

  return (
    <div className="setup-screen">
      <div className="setup-hero">
        <div className="setup-icon">🎯</div>
        <h1 className="setup-title">DE Interview Prep</h1>
        <p className="setup-subtitle">
          AI-powered mock interview tailored to your target data engineering role
        </p>
        <div className="setup-pillars">
          {Object.values(PILLAR_META).map((m) => (
            <span key={m.label} className="setup-pill">
              {m.emoji} {m.label}
            </span>
          ))}
        </div>
      </div>

      <div className="setup-card">
        <div className="field-group">
          <label className="field-label">
            Candidate Name <span className="field-opt">(optional)</span>
          </label>
          <input
            className="field-input"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field-group">
          <label className="field-label">
            Job Description <span className="field-req">*</span>
          </label>
          <textarea
            className="field-textarea"
            placeholder="Paste the full job description here — the interviewer will tailor every question to this specific role..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={12}
          />
          {jd.trim() && (
            <div className="field-hint">{jd.trim().split(/\s+/).length} words</div>
          )}
        </div>

        <button
          className="start-btn"
          onClick={handleStart}
          disabled={!jd.trim() || submitting}
        >
          {submitting ? 'Starting interview…' : 'Start Interview →'}
        </button>

        <div className="setup-footer">
          12 questions · 6 pillars · Answer all at once · Full scored debrief
        </div>
      </div>
    </div>
  );
}

// ─── Questions Screen ─────────────────────────────────────────────────────────

function QuestionsScreen({ questions, onSubmit, isLoading, error }) {
  const [answers, setAnswers] = useState(() => Array(questions.length).fill(''));

  const answered = answers.filter((a) => a.trim().length > 0).length;
  const allAnswered = answered === questions.length;

  const setAnswer = useCallback((i, val) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  }, []);

  return (
    <div className="questions-screen">
      <header className="questions-header">
        <div className="header-left">
          <span className="header-logo">🎯</span>
          <span className="header-title">Mock Interview</span>
        </div>
        <div className="header-right">
          <span className="answered-count">{answered} / {questions.length} answered</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(answered / questions.length) * 100}%` }} />
          </div>
        </div>
      </header>

      <div className="questions-body">
        <div className="questions-container">
          {questions.map((q, i) => (
            <div key={q.num} className="question-card">
              <div className="question-meta">
                <span className="q-num">{q.num}</span>
                <PillarBadge pillar={q.pillar} />
              </div>
              <p className="question-text">{q.text}</p>
              <textarea
                className="question-answer"
                placeholder="Your answer…"
                value={answers[i]}
                onChange={(e) => setAnswer(i, e.target.value)}
                disabled={isLoading}
                rows={4}
              />
            </div>
          ))}

          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
            </div>
          )}

          <div className="questions-submit">
            <button
              className="start-btn"
              style={{ maxWidth: 360 }}
              onClick={() => onSubmit(answers)}
              disabled={!allAnswered || isLoading}
            >
              {isLoading ? 'Evaluating answers…' : `Submit All ${questions.length} Answers →`}
            </button>
            {!allAnswered && !isLoading && (
              <p className="submit-hint">
                {questions.length - answered} question{questions.length - answered !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Debrief Screen ───────────────────────────────────────────────────────────

function DebriefScreen({ debrief, candidateName, onReset }) {
  const { pillar_scores, weak_spots, strengths, overall_readiness, summary } = debrief;
  const readinessColor =
    overall_readiness >= 75 ? '#6366f1' : overall_readiness >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="debrief-screen">
      <div className="debrief-container">

        <div className="debrief-header">
          <div className="debrief-header-left">
            <div className="debrief-tag">Interview Complete</div>
            <h1 className="debrief-name">
              {candidateName || 'Your Debrief'}
            </h1>
            <p className="debrief-subtitle">Data Engineering Mock Interview · Full Report</p>
          </div>
          <div className="debrief-readiness">
            <ReadinessRing score={overall_readiness} />
          </div>
        </div>

        <section className="debrief-section">
          <h2 className="section-title">Pillar Scores</h2>
          <div className="pillar-scores-grid">
            {Object.entries(pillar_scores).map(([key, data]) => (
              <PillarScoreCard key={key} pillarKey={key} data={data} />
            ))}
          </div>
        </section>

        <div className="debrief-two-col">
          <section className="debrief-section">
            <h2 className="section-title section-weak">Areas to Improve</h2>
            <div className="spot-list">
              {weak_spots.map((ws, i) => (
                <div key={i} className="spot-card spot-weak">
                  <div className="spot-header">
                    <span className="spot-num">{i + 1}</span>
                    <span className="spot-area-name">{ws.area}</span>
                  </div>
                  <p className="spot-advice">{ws.advice}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="debrief-section">
            <h2 className="section-title section-strong">Strengths</h2>
            <div className="spot-list">
              {strengths.map((s, i) => (
                <div key={i} className="spot-card spot-strong">
                  <div className="spot-header">
                    <span className="spot-check">✓</span>
                    <span className="spot-area-name">{s.area}</span>
                  </div>
                  <p className="spot-advice">{s.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="debrief-section">
          <h2 className="section-title">Summary</h2>
          <div className="summary-card">
            <p className="summary-text">{summary}</p>
          </div>
        </section>

        <div className="readiness-bar-wrap">
          <div className="readiness-bar-label">
            <span>Overall Readiness</span>
            <span style={{ color: readinessColor, fontFamily: 'var(--mono)' }}>
              {overall_readiness}%
            </span>
          </div>
          <div className="readiness-bar-bg">
            <div
              className="readiness-bar-fill"
              style={{ width: `${overall_readiness}%`, background: readinessColor }}
            />
          </div>
        </div>

        <div className="debrief-actions">
          <button className="reset-btn" onClick={onReset}>
            ← Start New Interview
          </button>
          <span className="debrief-brand">DE Interview Prep · Powered by Claude</span>
        </div>

      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('setup'); // setup | generating | questions | debrief
  const [candidateName, setCandidateName] = useState('');
  const [questions, setQuestions] = useState([]);
  const [questionsRaw, setQuestionsRaw] = useState('');
  const [firstUserMsg, setFirstUserMsg] = useState('');
  const [debrief, setDebrief] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const callAPI = useCallback(async (messages, maxTokens = 1500) => {
    setError(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, maxTokens }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Request failed');
      }
      return (await res.json()).content;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const startInterview = useCallback(async (name, jd) => {
    setCandidateName(name);
    const msg = name
      ? `Candidate: ${name}\n\nJob Description:\n${jd}`
      : `Job Description:\n${jd}`;
    setFirstUserMsg(msg);
    setScreen('generating');

    const reply = await callAPI([{ role: 'user', content: msg }], 3000);

    if (!reply) return; // error already set by callAPI, stays on generating screen

    const qs = parseQuestions(reply);
    if (!qs?.length) {
      console.error('Full API reply that failed to parse:', reply);
      setError('Could not parse questions — check the browser console for the raw response.');
      return;
    }

    setQuestionsRaw(reply);
    setQuestions(qs);
    setScreen('questions');
  }, [callAPI]);

  const submitAnswers = useCallback(async (answers) => {
    setIsLoading(true);
    const formatted = questions
      .map((q, i) => `Q${q.num} [${q.pillar}]: ${q.text}\nAnswer: ${answers[i].trim()}`)
      .join('\n\n');

    const msgs = [
      { role: 'user', content: firstUserMsg },
      { role: 'assistant', content: questionsRaw },
      { role: 'user', content: `Here are my answers:\n\n${formatted}` },
    ];

    const reply = await callAPI(msgs, 1500);
    setIsLoading(false);
    if (!reply) return;

    const parsed = parseDebrief(reply);
    if (parsed) {
      setDebrief(parsed);
      setScreen('debrief');
    } else {
      setError('Could not parse evaluation. Please try again.');
    }
  }, [questions, firstUserMsg, questionsRaw, callAPI]);

  const reset = useCallback(() => {
    setScreen('setup');
    setCandidateName('');
    setQuestions([]);
    setQuestionsRaw('');
    setFirstUserMsg('');
    setDebrief(null);
    setIsLoading(false);
    setError(null);
  }, []);

  if (screen === 'generating') return (
    <GeneratingScreen
      error={error}
      onBack={() => { setError(null); setScreen('setup'); }}
    />
  );
  if (screen === 'setup') return <SetupScreen onStart={startInterview} />;
  if (screen === 'questions') return (
    <QuestionsScreen
      questions={questions}
      onSubmit={submitAnswers}
      isLoading={isLoading}
      error={error}
    />
  );
  if (screen === 'debrief' && debrief) return (
    <DebriefScreen debrief={debrief} candidateName={candidateName} onReset={reset} />
  );
  return null;
}
