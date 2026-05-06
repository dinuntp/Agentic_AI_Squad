// === INSERT AFTER: app.get('/api/status', (req, res) => {
//   res.json({
//     status: 'ok',
//     version: '1.0.0',
//     port: PORT,
//     timestamp: new Date().toISOString()
//   });
// }); ===

// ─── Config Helpers ───────────────────────────────────────────────────────────

const ENV_PATH = join(__dirname, '.env');

/** Parse a .env file text into an ordered array of {key, value} objects.
 *  Comment lines (starting with #) and blank lines are preserved as
 *  sentinel entries so the file round-trips cleanly, but the client
 *  only receives real key=value entries.
 */
function parseEnvFile(text) {
  const entries = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, ''); // strip surrounding quotes
    if (key) entries.push({ key, value });
  }
  return entries;
}

/** Serialise an array of {key, value} back to .env file text.
 *  Values containing spaces, #, or = are wrapped in double-quotes.
 */
function serialiseEnvFile(entries) {
  return entries
    .map(({ key, value }) => {
      const needsQuotes = /[\s#=]/.test(value);
      const serialisedValue = needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;
      return `${key}=${serialisedValue}`;
    })
    .join('\n') + '\n';
}

const VALID_KEY_RE = /^[A-Z_][A-Z0-9_]*$/i;

// ─── GET /api/config ──────────────────────────────────────────────────────────

app.get('/api/config', async (req, res) => {
  try {
    let text = '';
    try {
      text = await readFile(ENV_PATH, 'utf-8');
    } catch {
      // .env file doesn't exist yet — return empty list
      return res.json({ entries: [] });
    }
    const entries = parseEnvFile(text);
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/config ──────────────────────────────────────────────────────────

app.put('/api/config', async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: '`entries` must be an array of { key, value } objects' });
    }

    // Validate all keys before touching the file
    for (const { key } of entries) {
      if (!key || !VALID_KEY_RE.test(key)) {
        return res.status(400).json({
          error: `Invalid key "${key}". Keys must match /^[A-Z_][A-Z0-9_]*$/i`
        });
      }
    }

    const text = serialiseEnvFile(entries);
    const tmp = ENV_PATH + '.tmp';
    await writeFile(tmp, text, 'utf-8');
    await rename(tmp, ENV_PATH);

    // Refresh in-process environment variables immediately (Risk 3 mitigation)
    for (const { key, value } of entries) {
      process.env[key] = value;
    }
    dotenv.config({ override: true });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
