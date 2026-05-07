import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../AppContext.jsx';
import { Modal, ModalHeader, ModalBody, ModalFooter, getAgentType, Alert } from './UI.jsx';
import { startRun, submitClarification } from '../client.js';

export default function WorkflowRunner({ project, onRunComplete }) {
  const { loadRuns } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [jiraStory, setJiraStory] = useState('');
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | running | done | error
  const [logs, setLogs] = useState([]);
  const [steps, setSteps] = useState([]);
  const [stepTokens, setStepTokens] = useState({});
  const [expandedSteps, setExpandedSteps] = useState({});
  const [finalError, setFinalError] = useState('');
  const [storyError, setStoryError] = useState('');
  const [prInfo, setPrInfo] = useState(null);
  const [clarification, setClarification] = useState(null); // { questions, answers[] }
  const [clarifySubmitting, setClarifySubmitting] = useState(false);
  const logsRef = useRef(null);

  const sortedAgents = [...(project.agents || [])].sort((a, b) => a.order - b.order);
  const isReady = project.status === 'ready';

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  function openModal() {
    setJiraStory('');
    setPhase('idle');
    setLogs([]);
    setFinalError('');
    setStoryError('');
    setPrInfo(null);
    setStepTokens({});
    setExpandedSteps({});
    // Initialize step statuses from project agents
    setSteps(sortedAgents.map(a => ({
      agentId: a.id,
      agentType: a.type,
      agentName: a.name,
      status: 'pending',
      output: ''
    })));
    setShowModal(true);
  }

  function addLog(msg) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev, { time, msg }]);
  }

  async function handleClarificationSubmit() {
    if (!clarification || !runId) return;
    setClarifySubmitting(true);
    try {
      await submitClarification(project.id, runId, clarification.answers);
      addLog('Clarification answers submitted — Lead Agent resuming…');
      setClarification(null);
    } catch (err) {
      addLog(`Failed to submit clarification: ${err.message}`);
    } finally {
      setClarifySubmitting(false);
    }
  }

  function handleRun() {
    const story = jiraStory.trim();
    if (!story) { setStoryError('Please enter a Jira story number'); return; }
    if (!isReady) return;

    setStoryError('');
    setPhase('running');
    setRunning(true);
    setFinalError('');
    setPrInfo(null);
    setClarification(null);
    setStepTokens({});
    setExpandedSteps({});
    setSteps(sortedAgents.map(a => ({
      agentId: a.id,
      agentType: a.type,
      agentName: a.name,
      status: 'pending',
      output: ''
    })));

    addLog(`Starting pipeline for story: ${story}`);

    startRun(project.id, story, {
      onStart: (data) => {
        setRunId(data.runId);
        addLog(`Run ${data.runId.slice(0, 8)} started — ${data.totalAgents} agent(s) in pipeline`);
      },
      onClarificationNeeded: (data) => {
        addLog(`Lead Agent needs clarification (${data.questions.length} question(s))`);
        setClarification({ questions: data.questions, answers: data.questions.map(() => '') });
      },
      onLog: (data) => {
        addLog(data.message);
      },
      onStepStart: (data) => {
        addLog(`▶ ${data.agentName} started`);
        setSteps(prev => prev.map(s =>
          s.agentId === data.agentId
            ? { ...s, status: 'running', startedAt: data.startedAt }
            : s
        ));
        setExpandedSteps(prev => ({ ...prev, [data.agentId]: true }));
      },
      onStepToken: (data) => {
        setStepTokens(prev => ({
          ...prev,
          [data.agentId]: (prev[data.agentId] || '') + data.token
        }));
      },
      onStepComplete: (data) => {
        addLog(`✓ ${data.agentName} completed`);
        setSteps(prev => prev.map(s =>
          s.agentId === data.agentId
            ? { ...s, status: 'completed', output: data.output, completedAt: data.completedAt }
            : s
        ));
        setStepTokens(prev => ({ ...prev, [data.agentId]: data.output }));
      },
      onStepError: (data) => {
        addLog(`✗ ${data.agentName} failed: ${data.error}`);
        setSteps(prev => prev.map(s =>
          s.agentId === data.agentId
            ? { ...s, status: 'failed', error: data.error }
            : s
        ));
      },
      onPRCreated: (data) => {
        setPrInfo(data);
        addLog(`PR #${data.prNumber} created: ${data.prUrl}`);
      },
      onComplete: (data) => {
        addLog('Pipeline completed successfully!');
        setPhase('done');
        setRunning(false);
        loadRuns(project.id);
        onRunComplete?.();
      },
      onError: (data) => {
        addLog(`Pipeline failed: ${data.error}`);
        setFinalError(data.error);
        setPhase('error');
        setRunning(false);
        loadRuns(project.id);
      }
    });
  }

  function toggleStep(agentId) {
    setExpandedSteps(prev => ({ ...prev, [agentId]: !prev[agentId] }));
  }

  function stepStatusColor(status) {
    return {
      pending: 'var(--text-muted)',
      running: 'var(--info)',
      completed: 'var(--success)',
      failed: 'var(--danger)'
    }[status] || 'var(--text-muted)';
  }

  function stepStatusIcon(status) {
    return { pending: '○', running: '⟳', completed: '✓', failed: '✗' }[status] || '○';
  }

  // ─── Validation checklist ─────────────────────────────────────────────────

  const checks = [
    { label: 'Jira connected', ok: !!(project.jira?.url && project.jira?.token) },
    { label: 'Git repository configured', ok: !!(project.git?.owner && project.git?.repo) },
    { label: 'At least one agent', ok: sortedAgents.length > 0 },
    { label: 'All agents configured', ok: sortedAgents.every(a => a.configured) }
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <button
        className={`btn btn-lg ${isReady ? 'btn-primary' : 'btn-secondary'}`}
        onClick={openModal}
      >
        ▶ Run Workflow
      </button>

      {showModal && (
        <Modal onClose={() => !running && setShowModal(false)} size="2xl">
          <ModalHeader
            title={phase === 'idle' ? 'Run Workflow' : `Running Pipeline — ${jiraStory}`}
            onClose={!running ? () => setShowModal(false) : undefined}
          />
          <ModalBody>
            {/* ── Idle Phase ── */}
            {phase === 'idle' && (
              <div>
                {/* Validation Checklist */}
                <div className="card" style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                    Pre-Execution Checklist
                  </div>
                  {checks.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: c.ok ? 'var(--success)' : 'var(--danger)', fontSize: 14 }}>
                        {c.ok ? '✓' : '✗'}
                      </span>
                      <span style={{ color: c.ok ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{c.label}</span>
                    </div>
                  ))}
                </div>

                {/* Pipeline Preview */}
                {sortedAgents.length > 0 && (
                  <div className="card" style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                      Pipeline Preview
                    </div>
                    <div className="pipeline">
                      {sortedAgents.map((agent, i) => {
                        const at = getAgentType(agent.type);
                        return (
                          <React.Fragment key={agent.id}>
                            {i > 0 && <div className="pipeline-arrow">→</div>}
                            <div className="pipeline-step">
                              <div className={`pipeline-node ${agent.type.replace('-agent', '')}`}>
                                <div className="pipeline-node-icon">{at.icon}</div>
                                <div className="pipeline-node-name">{agent.name}</div>
                                <div className="pipeline-node-type">{at.label}</div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Story Selection */}
                <div className="card">
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                    Select or Enter Story
                  </div>

                  {/* Manual stories list */}
                  {(project.stories || []).length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                        Manual Stories
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(project.stories || []).map(s => (
                          <button
                            key={s.id}
                            onClick={() => { setJiraStory(s.key || s.summary.slice(0, 30)); setStoryError(''); }}
                            style={{
                              textAlign: 'left',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius)',
                              border: `1px solid ${jiraStory === (s.key || s.summary.slice(0, 30)) ? 'var(--primary)' : 'var(--border)'}`,
                              background: jiraStory === (s.key || s.summary.slice(0, 30)) ? 'var(--primary-bg, #e8f0fe)' : 'var(--surface)',
                              cursor: 'pointer',
                              fontSize: 13,
                              color: 'var(--text-primary)'
                            }}
                          >
                            {s.key && <span style={{ fontWeight: 600, marginRight: 8, color: 'var(--primary)' }}>{s.key}</span>}
                            <span>{s.summary}</span>
                          </button>
                        ))}
                      </div>
                      <div style={{ margin: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>or type a Jira key</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        className="form-input"
                        value={jiraStory}
                        onChange={e => { setJiraStory(e.target.value); setStoryError(''); }}
                        placeholder="e.g. PROJ-123, GATEWAY-456"
                        onKeyDown={e => e.key === 'Enter' && isReady && handleRun()}
                        autoFocus={!(project.stories || []).length}
                        style={{ fontSize: 15, padding: '10px 14px' }}
                      />
                      {storyError && <div className="form-error">{storyError}</div>}
                      <div className="form-hint">
                        Manual stories above use their saved description. Jira keys are fetched live.
                      </div>
                    </div>
                  </div>
                </div>

                {!isReady && (
                  <Alert type="warning" style={{ marginTop: 12 }}>
                    Project is not ready. Please configure all agents and ensure Jira is connected.
                  </Alert>
                )}
              </div>
            )}

            {/* ── Clarification Modal Overlay ── */}
            {clarification && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                background: 'rgba(0,0,0,0.55)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius)',
              }}>
                <div style={{
                  background: 'var(--surface)', borderRadius: 10,
                  padding: '28px 32px', width: '90%', maxWidth: 560,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 22 }}>❓</span>
                    <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                      Lead Agent needs clarification
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                    The Lead Agent found ambiguities in the story. Please answer the questions below before it continues planning.
                  </p>
                  {clarification.questions.map((q, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                        {i + 1}. {q}
                      </div>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={clarification.answers[i]}
                        onChange={e => setClarification(prev => {
                          const answers = [...prev.answers];
                          answers[i] = e.target.value;
                          return { ...prev, answers };
                        })}
                        placeholder="Your answer…"
                        style={{ width: '100%', resize: 'vertical', fontSize: 13 }}
                      />
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleClarificationSubmit}
                      disabled={clarifySubmitting || clarification.answers.some(a => !a.trim())}
                    >
                      {clarifySubmitting ? 'Submitting…' : 'Submit Answers'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Running/Done Phase ── */}
            {(phase === 'running' || phase === 'done' || phase === 'error') && (
              <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
                {/* Left: Status panel */}
                <div>
                  {/* Log Panel */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                      Activity Log
                    </div>
                    <div className="log-panel" ref={logsRef}>
                      {logs.map((l, i) => (
                        <div key={i} className="log-entry">
                          <span className="log-time">{l.time}</span>
                          <span className="log-msg">{l.msg}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Agent Status */}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                    Agent Status
                  </div>
                  {steps.map(step => {
                    const at = getAgentType(step.agentType);
                    return (
                      <div key={step.agentId} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 0', borderBottom: '1px solid var(--border-subtle)'
                      }}>
                        <span style={{ fontSize: 14 }}>{at.icon}</span>
                        <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)' }}>{step.agentName}</span>
                        <span style={{ fontSize: 12, color: stepStatusColor(step.status), fontWeight: 600 }}>
                          {stepStatusIcon(step.status)}
                        </span>
                        {step.status === 'running' && <span className="spinner" />}
                      </div>
                    );
                  })}

                  {phase === 'done' && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ padding: '10px 12px', background: 'var(--success-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--success-border)', color: 'var(--success)', fontSize: 12, fontWeight: 600, marginBottom: prInfo ? 8 : 0 }}>
                        ✓ Pipeline completed successfully!
                      </div>
                      {prInfo && (
                        <div style={{ padding: '10px 12px', background: 'var(--info-bg, #e8f4fd)', borderRadius: 'var(--radius)', border: '1px solid var(--info-border, #90caf9)', fontSize: 12 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>Pull Request Created</div>
                          <div style={{ marginBottom: 2 }}>
                            <strong>PR #{prInfo.prNumber}:</strong> {prInfo.prTitle}
                          </div>
                          <div style={{ marginBottom: 2 }}>
                            <strong>Branch:</strong> {prInfo.branchName}
                          </div>
                          <a href={prInfo.prUrl} target="_blank" rel="noreferrer"
                            style={{ color: 'var(--info, #1976d2)', fontWeight: 600 }}>
                            View on GitHub →
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {phase === 'error' && (
                    <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--danger-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: 12 }}>
                      ✗ {finalError}
                    </div>
                  )}
                </div>

                {/* Right: Agent Outputs */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                    Agent Outputs
                  </div>
                  {steps.map(step => {
                    const at = getAgentType(step.agentType);
                    const expanded = expandedSteps[step.agentId];
                    const content = stepTokens[step.agentId] || step.output || '';
                    const isRunning = step.status === 'running';

                    return (
                      <div key={step.agentId} className="run-step-block">
                        <div
                          className={`run-step-header ${step.status}`}
                          onClick={() => content && toggleStep(step.agentId)}
                        >
                          <span>{at.icon}</span>
                          <span className="run-step-name">{step.agentName}</span>
                          {isRunning && <span className="spinner" />}
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: stepStatusColor(step.status)
                          }}>
                            {stepStatusIcon(step.status)}{' '}
                            {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                          </span>
                          {content && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {expanded ? '▲' : '▼'}
                            </span>
                          )}
                        </div>

                        {(expanded || isRunning) && content && (
                          <div className="run-step-content">
                            <div className="step-output-text">{content}</div>
                          </div>
                        )}

                        {step.status === 'pending' && (
                          <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                            Waiting...
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {phase === 'idle' && (
              <>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleRun}
                  disabled={!isReady || !jiraStory.trim()}
                >
                  ▶ Start Pipeline
                </button>
              </>
            )}
            {phase === 'running' && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Pipeline is running... please wait
              </span>
            )}
            {(phase === 'done' || phase === 'error') && (
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Close
              </button>
            )}
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}
