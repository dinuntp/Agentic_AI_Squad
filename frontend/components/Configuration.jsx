import React, { useState, useEffect, useCallback } from 'react';
import { Btn } from './UI.jsx';
import { getConfig, saveConfig } from '../client.js';

// Keys containing these substrings (case-insensitive) are masked by default
const SENSITIVE_PATTERNS = ['TOKEN', 'KEY', 'SECRET', 'PASSWORD', 'PASS'];

function isSensitive(key) {
  const upper = key.toUpperCase();
  return SENSITIVE_PATTERNS.some(p => upper.includes(p));
}

export default function Configuration() {
  const [entries, setEntries]       = useState([]);   // [{ key, value, originalValue }]
  const [visible, setVisible]       = useState(new Set());
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const isDirty = entries.some(e => e.value !== e.originalValue);

  // ── Load on mount ───────────────────────────────────────────────────────────

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { entries: raw } = await getConfig();
      setEntries(raw.map(e => ({ ...e, originalValue: e.value })));
    } catch (err) {
      setError('Failed to load configuration: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleChange(key, newValue) {
    setEntries(prev =>
      prev.map(e => e.key === key ? { ...e, value: newValue } : e)
    );
  }

  function toggleVisible(key) {
    setVisible(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await saveConfig(entries.map(({ key, value }) => ({ key, value })));
      // Mark all as saved
      setEntries(prev => prev.map(e => ({ ...e, originalValue: e.value })));
      setSuccessMsg('Configuration saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 24,
          color: 'var(--text)', margin: 0, marginBottom: 4,
        }}>
          Configuration
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0 }}>
          Manage server environment variables. Changes are written to{' '}
          <code style={{
            fontFamily: 'monospace', fontSize: 12,
            background: 'var(--bg2)', padding: '1px 6px', borderRadius: 4,
          }}>backend/.env</code>{' '}
          and take effect immediately without a server restart.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 8,
          background: 'var(--red-bg)', border: '1px solid var(--red-border)',
          color: 'var(--red)', fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Success alert */}
      {successMsg && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 8,
          background: 'var(--green-bg)', border: '1px solid var(--green-border)',
          color: 'var(--green)', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            Environment Variables
            {!loading && (
              <span style={{
                fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8,
              }}>
                ({entries.length} variable{entries.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isDirty && (
              <span style={{
                fontSize: 11, color: 'var(--text3)',
                padding: '3px 8px', borderRadius: 20,
                background: 'var(--bg2)', border: '1px solid var(--border2)',
              }}>
                Unsaved changes
              </span>
            )}
            <Btn
              onClick={handleSave}
              disabled={saving || !isDirty || loading}
              style={{ minWidth: 110 }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Btn>
          </div>
        </div>

        <div style={{ padding: '8px 24px 24px' }}>

          {/* Loading state */}
          {loading && (
            <div style={{
              padding: '40px 0', textAlign: 'center',
              color: 'var(--text3)', fontSize: 13,
            }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>⚙️</div>
              Loading configuration…
            </div>
          )}

          {/* Empty state */}
          {!loading && entries.length === 0 && (
            <div style={{
              padding: '40px 0', textAlign: 'center',
              color: 'var(--text3)', fontSize: 13,
            }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>📄</div>
              No environment variables found in <code>backend/.env</code>.
            </div>
          )}

          {/* Variable list */}
          {!loading && entries.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {entries.map((entry, idx) => {
                const sensitive = isSensitive(entry.key);
                const isVisible = visible.has(entry.key);
                const changed = entry.value !== entry.originalValue;

                return (
                  <div
                    key={entry.key}
                    className="form-group"
                    style={{
                      marginBottom: 0,
                      padding: '14px 0',
                      borderBottom: idx < entries.length - 1
                        ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    {/* Label row */}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      gap: 8, marginBottom: 6,
                    }}>
                      <label style={{
                        fontFamily: 'monospace', fontSize: 12.5,
                        fontWeight: 600, color: 'var(--text2)',
                        margin: 0,
                      }}>
                        {entry.key}
                      </label>
                      {sensitive && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '1px 6px',
                          borderRadius: 20, background: 'var(--accent-bg)',
                          color: 'var(--accent)', border: '1px solid var(--accent-border)',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          sensitive
                        </span>
                      )}
                      {changed && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '1px 6px',
                          borderRadius: 20, background: 'var(--yellow-bg, #fef9c3)',
                          color: 'var(--yellow, #854d0e)',
                          border: '1px solid var(--yellow-border, #fde68a)',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          modified
                        </span>
                      )}
                    </div>

                    {/* Input row */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type={sensitive && !isVisible ? 'password' : 'text'}
                        value={entry.value}
                        onChange={e => handleChange(entry.key, e.target.value)}
                        style={{
                          flex: 1,
                          fontFamily: sensitive && !isVisible ? 'monospace' : 'inherit',
                          borderColor: changed ? 'var(--accent-border)' : undefined,
                        }}
                        autoComplete="off"
                        spellCheck={false}
                      />
                      {sensitive && (
                        <button
                          onClick={() => toggleVisible(entry.key)}
                          style={{
                            padding: '0 14px', borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)', background: 'var(--bg2)',
                            color: 'var(--text3)', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                            fontFamily: 'var(--font)',
                          }}
                          title={isVisible ? 'Hide value' : 'Show value'}
                        >
                          {isVisible ? '🙈 Hide' : '👁 Show'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Security notice */}
      <div style={{
        marginTop: 16, padding: '10px 14px',
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 8, fontSize: 12, color: 'var(--text3)',
        display: 'flex', gap: 8, alignItems: 'flex-start',
      }}>
        <span>🔒</span>
        <span>
          This page is intended for internal development use only. Do not expose
          this interface publicly — all environment variable values including secrets
          are transmitted in plaintext.
        </span>
      </div>
    </div>
  );
}
