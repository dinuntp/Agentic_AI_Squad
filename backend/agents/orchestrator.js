// Agent Pipeline Orchestrator
// Runs agents sequentially: Lead → Developer → Tester → Regression → Lead (PR)

import Anthropic from '@anthropic-ai/sdk';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as github from '../connectors/github.js';
import * as jira from '../connectors/jira.js';
import * as confluence from '../connectors/confluence.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates');
const DATA_DIR = join(__dirname, '..', 'data');

// ─── Story Output Helpers ─────────────────────────────────────────────────────

function slugifyKey(key) {
  return key.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'story';
}

// Returns the data directory for a project (mirrors server.js getProjectDir)
function getProjectDir(project) {
  return join(DATA_DIR, project.folderName || project.id);
}

// Persists a single agent's output as {agentType}.md inside the story subfolder.
async function saveAgentOutput(project, storyKey, agentType, content) {
  try {
    const storyDir = join(getProjectDir(project), slugifyKey(storyKey));
    await mkdir(storyDir, { recursive: true });
    await writeFile(join(storyDir, `${agentType}.md`), content, 'utf-8');
  } catch (err) {
    console.warn(`[saveAgentOutput] Could not write ${agentType}.md: ${err.message}`);
  }
}

// Reads a previously saved agent output from disk (returns null if not found).
async function loadAgentOutputFromDisk(project, storyKey, agentType) {
  try {
    return await readFile(
      join(getProjectDir(project), slugifyKey(storyKey), `${agentType}.md`), 'utf-8'
    );
  } catch {
    return null;
  }
}

// Lazy client — created on first use so dotenv has time to load before this runs
let _anthropic = null;
function getAnthropicClient() {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set. Check backend/.env and restart the server.');
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

// ─── Template Loader ────────────────────────────────────────────────────────

async function loadTemplate(templateType) {
  let systemPrompt = '';
  let instructions = '';
  try {
    systemPrompt = await readFile(
      join(TEMPLATES_DIR, templateType, 'system-prompt.md'), 'utf-8'
    );
  } catch {
    systemPrompt = `You are a ${templateType} agent in a software development pipeline.`;
  }
  try {
    instructions = await readFile(
      join(TEMPLATES_DIR, templateType, 'instructions.md'), 'utf-8'
    );
  } catch {
    instructions = '';
  }
  return { systemPrompt, instructions };
}

// ─── Context Gatherers ───────────────────────────────────────────────────────

async function gatherJiraContext(project, jiraStory, manualStory = null) {
  // Manual story takes priority — the user explicitly created it with full details
  if (manualStory) {
    return `## Story: ${manualStory.key || jiraStory} (Manual)
**Summary:** ${manualStory.summary}
**Source:** Manually entered (not fetched from Jira)

### Description
${manualStory.description || 'No description provided.'}`;
  }

  if (!jira.isConfigured(project.jira)) {
    return `Jira Story: ${jiraStory}\n(Jira not configured — no story details available)`;
  }
  try {
    const story = await jira.getStory(project.jira, jiraStory);
    return `## Jira Story: ${story.key}
**Summary:** ${story.summary}
**Type:** ${story.type}
**Status:** ${story.status}
**Priority:** ${story.priority}
**Reporter:** ${story.reporter}
**Assignee:** ${story.assignee || 'Unassigned'}
**Sprint:** ${story.sprint || 'No sprint'}
**Epic:** ${story.epicLink || 'None'}
**Labels:** ${story.labels.join(', ') || 'None'}
**URL:** ${story.url}

### Description
${story.description || 'No description provided.'}

### Acceptance Criteria
${story.acceptanceCriteria || 'No acceptance criteria defined.'}`;
  } catch (err) {
    return `Jira Story: ${jiraStory}\nFailed to fetch story details: ${err.message}`;
  }
}

async function gatherConfluenceContext(project, jiraStory, manualStory = null) {
  if (!confluence.isConfigured(project.confluence)) {
    return '(Confluence not configured — no documentation available)';
  }
  try {
    const results = [];

    // Use manual story summary as search keyword if available, otherwise use story key
    const searchTerm = manualStory ? manualStory.summary : jiraStory;
    if (searchTerm) {
      const searchResults = await confluence.searchPages(
        project.confluence, searchTerm, project.confluence.spaceKey, 5
      );
      results.push(...searchResults);
    }

    // Also pull recent pages from the space
    const recentPages = await confluence.getSpacePages(
      project.confluence, project.confluence.spaceKey, 10
    );
    const seen = new Set(results.map(p => p.id));
    for (const p of recentPages) {
      if (!seen.has(p.id)) { results.push(p); seen.add(p.id); }
    }

    if (!results.length) return '(No Confluence pages found)';

    // Fetch actual content for the top 5 pages
    const fetched = await Promise.allSettled(
      results.slice(0, 5).map(p => confluence.getPage(project.confluence, p.id))
    );

    const pageDetails = fetched
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .map(p => `### ${p.title}\n**URL:** ${p.url}\n\n${p.content.slice(0, 1500)}`);

    return `## Confluence Documentation (Space: ${project.confluence.spaceKey})\n\n${pageDetails.join('\n\n---\n\n')}`;
  } catch (err) {
    return `(Confluence fetch failed: ${err.message})`;
  }
}

async function gatherGitContext(project) {
  if (!github.isConfigured(project.git)) {
    return `Repository: ${project.git?.repoUrl || 'Not configured'}\n(GitHub not configured)`;
  }
  try {
    const branch = project.git.branch || 'main';
    const [info, tree] = await Promise.all([
      github.getRepoInfo(project.git),
      github.getRepoTree(project.git, branch)
    ]);
    const fileList = tree.join('\n');

    // Fetch actual source file contents for key architecture files.
    // Priority rules (highest first):
    //   1. Exact entry-point filenames wherever they appear
    //   2. Direct children of frontend/, backend/, src/ folders
    //   3. Component files one level deep under components/
    // Caps: max 15 files, each truncated at 6 000 chars, ~90 k chars total.
    const ENTRY_NAMES = new Set([
      'app.jsx','app.js','app.tsx','app.ts',
      'appcontext.jsx','appcontext.js','appcontext.tsx',
      'server.js','server.ts',
      'client.js','client.ts','client.jsx',
      'router.jsx','router.js','routes.js','routes.ts',
      'main.jsx','main.js','index.jsx','index.js',
      'dashboard.jsx','dashboard.js','dashboard.tsx',
    ]);

    function fileScore(path) {
      const lower = path.toLowerCase();
      const name  = lower.split('/').pop();
      if (lower.includes('node_modules') || lower.includes('.test.') ||
          lower.includes('.spec.') || lower.includes('dist/') ||
          lower.includes('build/') || lower.includes('.min.')) return -1;
      const ext = name.split('.').pop();
      if (!['js','jsx','ts','tsx'].includes(ext)) return -1;
      const depth = path.split('/').length;
      if (ENTRY_NAMES.has(name)) return 100 - depth;         // entry files score highest
      if (depth <= 3 && ['frontend','backend','src','app'].some(d => lower.startsWith(d + '/')))
        return 50 - depth;                                    // shallow project files
      if (/\/components\/[^/]+\.(jsx?|tsx?)$/.test(lower) && depth <= 4)
        return 30 - depth;                                    // direct component children
      return -1;
    }

    const keyFiles = tree
      .map(p => ({ path: p, score: fileScore(p) }))
      .filter(f => f.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map(f => f.path);

    const MAX_FILE_CHARS = 6000;
    const fetched = await Promise.allSettled(
      keyFiles.map(p => github.getFileContent(project.git, p, branch))
    );

    const fileSections = keyFiles
      .map((path, i) => {
        const content = fetched[i].status === 'fulfilled' ? fetched[i].value : null;
        if (!content) return null;
        const ext = path.split('.').pop();
        const truncated = content.length > MAX_FILE_CHARS
          ? content.slice(0, MAX_FILE_CHARS) + `\n... [truncated — ${content.length - MAX_FILE_CHARS} chars omitted]`
          : content;
        return `#### \`${path}\`\n\`\`\`${ext}\n${truncated}\n\`\`\``;
      })
      .filter(Boolean)
      .join('\n\n');

    return `## Git Repository: ${info.full_name}
**Default Branch:** ${info.default_branch}
**Description:** ${info.description || 'No description'}
**Language:** ${info.language}
**URL:** ${info.html_url}

### Repository File Structure
\`\`\`
${fileList}
\`\`\`

### Key Source Files (${keyFiles.length} files read)
> These are the most architecturally significant files in the repository. Use them to understand existing patterns before specifying changes.

${fileSections || '(No key source files could be fetched)'}`;
  } catch (err) {
    return `Repository: ${project.git?.repoUrl}\n(Git fetch failed: ${err.message})`;
  }
}

// ─── Claude Streaming Call ───────────────────────────────────────────────────

const CLAUDE_TIMEOUT_MS = parseInt(process.env.CLAUDE_TIMEOUT_MS || '120000', 10);
const CLAUDE_MAX_TOKENS = parseInt(process.env.CLAUDE_MAX_TOKENS || '8192', 10);
const CLAUDE_MAX_RETRIES = 3;

async function callClaude(systemPrompt, userMessage, onToken) {
  for (let attempt = 1; attempt <= CLAUDE_MAX_RETRIES; attempt++) {
    let fullResponse = '';

    const streamWork = async () => {
      const stream = getAnthropicClient().messages.stream({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
        max_tokens: CLAUDE_MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          const token = event.delta.text;
          fullResponse += token;
          onToken(token);
        }
      }
      return fullResponse;
    };

    const timeout = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Claude API timed out after ${CLAUDE_TIMEOUT_MS / 1000}s`)),
        CLAUDE_TIMEOUT_MS
      )
    );

    try {
      return await Promise.race([streamWork(), timeout]);
    } catch (err) {
      // Never retry if we already streamed partial output — would cause duplicate tokens
      if (fullResponse.length > 0) throw err;
      if (attempt === CLAUDE_MAX_RETRIES) throw err;

      const isTransient = !err.status || err.status >= 500 || err.status === 429;
      if (!isTransient) throw err;

      const delay = Math.pow(2, attempt) * 1000; // 2 s, 4 s
      console.warn(`[Claude] Attempt ${attempt} failed (${err.message}). Retrying in ${delay / 1000}s…`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ─── Clarification Question Parser ──────────────────────────────────────────
// Detects a "## CLARIFICATION_NEEDED" block in agent output and extracts questions.

function extractClarificationQuestions(output) {
  const match = output.match(/##\s*CLARIFICATION[_\s]NEEDED\s*\n([\s\S]*?)(?=\n##\s|\n---\s*\n|$)/i);
  if (!match) return null;
  const questions = [];
  for (const line of match[1].split('\n')) {
    const q = line.replace(/^\s*\d+[\.\)]\s*/, '').trim();
    if (q.length > 10 && !q.startsWith('#') && !q.startsWith('`')) questions.push(q);
  }
  return questions.length ? questions : null;
}

function buildAnswersContext(questions, answers) {
  return `\n\n## User Clarifications (provided before plan was finalized)\n\n${
    questions.map((q, i) => `**Q: ${q}**\nA: ${answers[i] || '(no answer provided)'}`).join('\n\n')
  }`;
}

// ─── Developer File Parser ───────────────────────────────────────────────────
// Extracts file sections from Developer Agent output.
// Each section has: path, action ('create'|'modify'), content (code block body).
// For MODIFY sections the content may contain patch markers — applied at commit time.

function parseDeveloperFiles(markdownText) {
  const files = [];
  const headerRegex = /###\s+File:\s+`([^`]+)`/g;
  const headers = [];
  let m;
  while ((m = headerRegex.exec(markdownText)) !== null) {
    headers.push({ path: m[1].trim(), index: m.index });
  }

  for (let i = 0; i < headers.length; i++) {
    const { path, index } = headers[i];
    const sectionEnd = i + 1 < headers.length ? headers[i + 1].index : markdownText.length;
    const section = markdownText.slice(index, sectionEnd);

    // Detect action type from the section header
    const actionMatch = section.match(/\*\*Action:\*\*\s*(Create|Modify|Delete)/i);
    const action = actionMatch ? actionMatch[1].toLowerCase() : 'create';

    // Extract first fenced code block — handles ``` and ````
    const codeMatch = section.match(/`{3,}[\w-]*\n([\s\S]*?)`{3,}/);
    if (!codeMatch) continue;

    files.push({ path, action, content: codeMatch[1] });
  }
  return files;
}

// Applies a MODIFY patch to an existing file's content.
//
// Supports these marker styles (all equivalent, both formats accepted):
//   // [INSERT AFTER: <unique line from existing file>]
//   // [INSERT BEFORE: <unique line from existing file>]
//   // === INSERT AFTER: <unique line> ===
//   // === INSERT BEFORE: <unique line> ===
//   // === REPLACE: <exact existing line(s) to replace> ===  (followed by replacement)
//
// When no marker is found, defaults to inserting before app.listen / export default.
function applyModifyPatch(existingContent, patchContent) {

  // ── Helper: extract first non-empty line from a possibly-multi-line marker value ──
  function firstLine(text) {
    return text.split('\n').map(l => l.replace(/^\/\/\s*/, '').replace(/\s*===\s*$/, '').trim()).find(l => l) || '';
  }

  // ── Normalise: collect all directives in order ──
  // Each directive: { type: 'insert_after'|'insert_before'|'replace', marker, code }
  // We scan the patch line-by-line and split it into directive blocks.
  const lines = patchContent.split('\n');
  const directives = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Detect INSERT AFTER (both formats)
    const iaNew = line.match(/^\/\/\s*\[INSERT AFTER:\s*(.+?)\]\s*$/);
    const iaOld = line.match(/^\/\/\s*===\s*INSERT AFTER:\s*(.+?)(?:\s*===)?\s*$/);
    // Detect INSERT BEFORE (both formats)
    const ibNew = line.match(/^\/\/\s*\[INSERT BEFORE:\s*(.+?)\]\s*$/);
    const ibOld = line.match(/^\/\/\s*===\s*INSERT BEFORE:\s*(.+?)(?:\s*===)?\s*$/);
    // Detect REPLACE (=== format, possibly multi-line old-code block)
    const repStart = line.match(/^\/\/\s*===\s*REPLACE:/);

    if (iaNew || iaOld) {
      // Possibly multi-line marker comment block — read until non-comment or empty
      const markerLines = [iaNew ? iaNew[1] : iaOld[1]];
      i++;
      while (i < lines.length && lines[i].match(/^\/\//) && !lines[i].match(/^\/\/\s*===/)) {
        markerLines.push(lines[i].replace(/^\/\/\s*/, '').replace(/\s*===\s*$/, '').trim());
        i++;
      }
      // Skip closing === line if present
      if (i < lines.length && lines[i].match(/^\/\/\s*===\s*$/)) i++;
      // Collect code lines until next directive or end
      const codeLines = [];
      while (i < lines.length && !lines[i].match(/^\/\/\s*(?:\[INSERT|\[REPLACE|===\s*(?:INSERT|REPLACE))/)) {
        codeLines.push(lines[i]);
        i++;
      }
      directives.push({ type: 'insert_after', marker: firstLine(markerLines.join('\n')), code: codeLines.join('\n').trimEnd() });

    } else if (ibNew || ibOld) {
      const markerLines = [ibNew ? ibNew[1] : ibOld[1]];
      i++;
      while (i < lines.length && lines[i].match(/^\/\//) && !lines[i].match(/^\/\/\s*===/)) {
        markerLines.push(lines[i].replace(/^\/\/\s*/, '').replace(/\s*===\s*$/, '').trim());
        i++;
      }
      if (i < lines.length && lines[i].match(/^\/\/\s*===\s*$/)) i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].match(/^\/\/\s*(?:\[INSERT|\[REPLACE|===\s*(?:INSERT|REPLACE))/)) {
        codeLines.push(lines[i]);
        i++;
      }
      directives.push({ type: 'insert_before', marker: firstLine(markerLines.join('\n')), code: codeLines.join('\n').trimEnd() });

    } else if (repStart) {
      // Collect old-code comment lines (prefixed with //)
      i++;
      const oldLines = [];
      while (i < lines.length && lines[i].match(/^\/\//)) {
        const stripped = lines[i].replace(/^\/\/\s?/, '');
        if (!stripped.match(/^===\s*$/)) oldLines.push(stripped);
        else { i++; break; }
        i++;
      }
      // Collect replacement code until next directive or end
      const codeLines = [];
      while (i < lines.length && !lines[i].match(/^\/\/\s*(?:\[INSERT|\[REPLACE|===\s*(?:INSERT|REPLACE))/)) {
        codeLines.push(lines[i]);
        i++;
      }
      directives.push({ type: 'replace', oldCode: oldLines.join('\n').trim(), code: codeLines.join('\n').trimEnd() });

    } else {
      i++;
    }
  }

  // If no directives found, treat the whole patch as a plain insertion
  if (!directives.length) {
    const cleanPatch = patchContent.trimEnd();
    const listenIdx = existingContent.lastIndexOf('\napp.listen(');
    if (listenIdx !== -1) return existingContent.slice(0, listenIdx) + '\n\n' + cleanPatch + existingContent.slice(listenIdx);
    const exportIdx = existingContent.lastIndexOf('\nexport default ');
    if (exportIdx !== -1) return existingContent.slice(0, exportIdx) + '\n\n' + cleanPatch + existingContent.slice(exportIdx);
    return existingContent + '\n\n' + cleanPatch;
  }

  // ── Apply each directive in order ──
  let result = existingContent;
  for (const d of directives) {
    if (d.type === 'insert_after') {
      const idx = result.indexOf(d.marker);
      if (idx === -1) {
        // Marker not found — fall back to inserting before app.listen / export default
        const fallbackIdx = result.lastIndexOf('\napp.listen(') !== -1
          ? result.lastIndexOf('\napp.listen(')
          : result.lastIndexOf('\nexport default ');
        if (fallbackIdx !== -1) result = result.slice(0, fallbackIdx) + '\n\n' + d.code + result.slice(fallbackIdx);
        else result += '\n\n' + d.code;
        continue;
      }
      const after = idx + d.marker.length;
      // Advance past the end of that line
      const eol = result.indexOf('\n', after);
      const insertAt = eol !== -1 ? eol : after;
      result = result.slice(0, insertAt) + '\n\n' + d.code + result.slice(insertAt);

    } else if (d.type === 'insert_before') {
      const idx = result.indexOf(d.marker);
      if (idx === -1) {
        const fallbackIdx = result.lastIndexOf('\napp.listen(') !== -1
          ? result.lastIndexOf('\napp.listen(')
          : result.lastIndexOf('\nexport default ');
        if (fallbackIdx !== -1) result = result.slice(0, fallbackIdx) + '\n\n' + d.code + result.slice(fallbackIdx);
        else result += '\n\n' + d.code;
        continue;
      }
      // Insert before the line containing the marker
      const lineStart = result.lastIndexOf('\n', idx) + 1;
      result = result.slice(0, lineStart) + d.code + '\n' + result.slice(lineStart);

    } else if (d.type === 'replace') {
      const idx = result.indexOf(d.oldCode);
      if (idx !== -1) {
        result = result.slice(0, idx) + d.code + result.slice(idx + d.oldCode.length);
      }
    }
  }

  return result;
}

async function commitDeveloperFiles(project, jiraStory, pipelineContext, developerOutput, emit) {
  if (!github.isConfigured(project.git)) return;

  const files = parseDeveloperFiles(developerOutput);
  if (!files.length) {
    emit('pipeline_log', { message: 'No file blocks found in Developer Agent output — skipping GitHub commit.' });
    return;
  }

  const branchName = extractBranchName(pipelineContext.previousOutputs, jiraStory);
  emit('pipeline_log', { message: `Creating branch: ${branchName}` });

  try {
    await github.createBranch(project.git, branchName, project.git.branch || 'main');
  } catch (err) {
    const msg = err.message.toLowerCase();
    if (!msg.includes('already exists') && !msg.includes('422')) {
      emit('pipeline_log', { message: `Branch creation failed: ${err.message}` });
      return;
    }
    emit('pipeline_log', { message: `Branch ${branchName} already exists — reusing.` });
  }

  emit('pipeline_log', { message: `Committing ${files.length} file(s) to ${branchName}…` });

  for (const file of files) {
    if (file.action === 'delete') {
      emit('pipeline_log', { message: `⚠ Skipping delete action for ${file.path} (manual review required)` });
      continue;
    }
    try {
      let contentToCommit = file.content;

      if (file.action === 'modify') {
        // Fetch existing file content and apply patch markers
        try {
          const baseBranch = project.git.branch || 'main';
          const existing = await github.getFileContent(project.git, file.path, branchName)
            .catch(() => github.getFileContent(project.git, file.path, baseBranch));
          contentToCommit = applyModifyPatch(existing, file.content);
          emit('pipeline_log', { message: `↪ Merging patch into existing ${file.path}` });
        } catch (fetchErr) {
          emit('pipeline_log', { message: `⚠ Could not fetch ${file.path} for merge — creating new: ${fetchErr.message}` });
        }
      }

      const commitMsg = file.action === 'modify'
        ? `feat: update ${file.path} [${jiraStory}]`
        : `feat: add ${file.path} [${jiraStory}]`;

      await github.createOrUpdateFile(project.git, file.path, contentToCommit, commitMsg, branchName);
      emit('pipeline_log', { message: `✓ Committed (${file.action || 'create'}): ${file.path}` });
    } catch (err) {
      emit('pipeline_log', { message: `✗ Failed to commit ${file.path}: ${err.message}` });
    }
  }

  // Store so PR creation reuses this branch without recreating it
  pipelineContext.branchName = branchName;
  emit('pipeline_log', { message: `All files committed to branch ${branchName}.` });
}

// ─── PR Creation Helpers ─────────────────────────────────────────────────────

function extractBranchName(previousOutputs, jiraStory) {
  const allText = Object.values(previousOutputs).map(o => o.output || '').join('\n');
  // Check specific branch-type prefixes first (most reliable) before the generic pattern.
  // The generic pattern must require a colon so it doesn't match headings like "Branch Name".
  const patterns = [
    /`(feature\/[a-zA-Z0-9][a-zA-Z0-9\-\/]{2,58})`/,
    /`(bugfix\/[a-zA-Z0-9][a-zA-Z0-9\-\/]{2,58})`/,
    /`(hotfix\/[a-zA-Z0-9][a-zA-Z0-9\-\/]{2,58})`/,
    /`(fix\/[a-zA-Z0-9][a-zA-Z0-9\-\/]{2,58})`/,
    /branch(?:\s+name)?:\s*[`'"]*([a-zA-Z0-9][a-zA-Z0-9\-\/]{3,60})[`'"']*/i,
  ];
  for (const pattern of patterns) {
    const match = allText.match(pattern);
    if (match?.[1]) return match[1].toLowerCase().replace(/[^a-z0-9\-\/]/g, '-');
  }
  return `feature/${jiraStory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function extractPRTitle(previousOutputs, jiraStory) {
  const leadOutput = Object.values(previousOutputs)
    .filter(o => o.agentType === 'lead-agent')
    .map(o => o.output || '')
    .join('\n');
  for (const line of leadOutput.split('\n').slice(0, 15)) {
    const clean = line.replace(/^#+\s*/, '').replace(/\*+/g, '').trim();
    if (clean.length > 15 && clean.length < 120 && !clean.startsWith('http')) return clean;
  }
  return `Implementation of ${jiraStory}`;
}

function compilePRBody(jiraStory, previousOutputs) {
  const sections = Object.values(previousOutputs)
    .map(({ agentName, agentType, output }) => `## ${agentName} (${agentType})\n\n${output}`)
    .join('\n\n---\n\n');
  return `# Agent AI Squad — ${jiraStory}\n\n> This PR was generated by the Agentic AI Squad pipeline.\n\n---\n\n${sections}`;
}

async function attemptPRCreation(project, jiraStory, pipelineContext, emit) {
  if (!github.isConfigured(project.git)) return null;
  try {
    // Prefer branch already created during developer-agent file commit
    const branchName = pipelineContext.branchName || extractBranchName(pipelineContext.previousOutputs, jiraStory);

    if (!pipelineContext.branchName) {
      emit('pipeline_log', { message: `Creating branch: ${branchName}` });
      try {
        await github.createBranch(project.git, branchName, project.git.branch || 'main');
      } catch (branchErr) {
        const msg = branchErr.message.toLowerCase();
        if (!msg.includes('already exists') && !msg.includes('422')) throw branchErr;
        emit('pipeline_log', { message: `Branch ${branchName} already exists — reusing.` });
      }
    }

    emit('pipeline_log', { message: `Creating pull request from ${branchName}…` });
    const pr = await github.createPullRequest(project.git, {
      title: extractPRTitle(pipelineContext.previousOutputs, jiraStory),
      body: compilePRBody(jiraStory, pipelineContext.previousOutputs),
      head: branchName,
      base: project.git.branch || 'main'
    });

    emit('pr_created', { prNumber: pr.number, prUrl: pr.url, prTitle: pr.title, branchName });
    emit('pipeline_log', { message: `PR #${pr.number} created: ${pr.url}` });
    return pr;
  } catch (err) {
    console.error('[PR] Creation failed:', err.message);
    emit('pipeline_log', { message: `PR creation skipped: ${err.message}` });
    return null;
  }
}

// ─── Pipeline Runner ─────────────────────────────────────────────────────────

export async function runPipeline(project, jiraStory, run, emit, manualStory = null, waitForClarification = null) {
  const sortedAgents = [...project.agents].sort((a, b) => a.order - b.order);

  // Pre-gather shared context
  emit('pipeline_log', { message: 'Gathering project context from Jira, Confluence, and Git...' });
  if (manualStory) {
    emit('pipeline_log', { message: `Using manual story: ${manualStory.summary}` });
  }
  const [jiraContext, confluenceContext, gitContext] = await Promise.all([
    gatherJiraContext(project, jiraStory, manualStory),
    gatherConfluenceContext(project, jiraStory, manualStory),
    gatherGitContext(project)
  ]);

  const sharedContext = `# Project: ${project.name}

${jiraContext}

${confluenceContext}

${gitContext}`;

  emit('pipeline_log', { message: 'Context gathered. Starting agent pipeline...' });

  // Track context passed between agents
  let pipelineContext = {
    jiraStory,
    sharedContext,
    previousOutputs: {}
  };

  let finalResult = null;

  // Execute each agent in order
  for (let i = 0; i < sortedAgents.length; i++) {
    const agent = sortedAgents[i];
    const stepIndex = run.steps.findIndex(s => s.agentId === agent.id);

    emit('step_start', {
      agentId: agent.id,
      agentName: agent.name,
      agentType: agent.type,
      stepIndex,
      status: 'running',
      startedAt: new Date().toISOString()
    });

    try {
      let output = await runAgent(agent, project, pipelineContext, emit);

      // Lead Agent: pause if clarification is needed, then re-run with answers
      if (agent.type === 'lead-agent' && waitForClarification) {
        const questions = extractClarificationQuestions(output);
        if (questions?.length) {
          emit('clarification_needed', { questions });
          const answers = await waitForClarification(questions);
          pipelineContext.sharedContext += buildAnswersContext(questions, answers);
          emit('pipeline_log', { message: 'Answers received — re-running Lead Agent with clarifications…' });
          emit('step_start', {
            agentId: agent.id, agentName: agent.name, agentType: agent.type,
            stepIndex, status: 'running', startedAt: new Date().toISOString()
          });
          output = await runAgent(agent, project, pipelineContext, emit);
        }
      }

      // Store output in pipeline context for next agent
      pipelineContext.previousOutputs[agent.type] = {
        agentName: agent.name,
        agentType: agent.type,
        output
      };

      // Persist output to disk as {agentType}.md inside the story subfolder
      await saveAgentOutput(project, jiraStory, agent.type, output);

      // Developer agent: parse code blocks and commit files to GitHub
      if (agent.type === 'developer-agent' && output) {
        try {
          await commitDeveloperFiles(project, jiraStory, pipelineContext, output, emit);
        } catch (err) {
          emit('pipeline_log', { message: `File commit warning: ${err.message}` });
        }
      }

      emit('step_complete', {
        agentId: agent.id,
        agentName: agent.name,
        agentType: agent.type,
        stepIndex,
        status: 'completed',
        output,
        completedAt: new Date().toISOString()
      });

      // Update run step
      if (run.steps[stepIndex]) {
        run.steps[stepIndex].status = 'completed';
        run.steps[stepIndex].output = output;
        run.steps[stepIndex].completedAt = new Date().toISOString();
      }

      finalResult = output;

    } catch (err) {
      emit('step_error', {
        agentId: agent.id,
        agentName: agent.name,
        agentType: agent.type,
        stepIndex,
        status: 'failed',
        error: err.message,
        completedAt: new Date().toISOString()
      });

      if (run.steps[stepIndex]) {
        run.steps[stepIndex].status = 'failed';
        run.steps[stepIndex].error = err.message;
        run.steps[stepIndex].completedAt = new Date().toISOString();
      }

      throw err;
    }
  }

  emit('pipeline_complete', { message: 'All agents completed successfully.', result: finalResult });

  // Attempt GitHub PR creation using all agent outputs
  const pr = await attemptPRCreation(project, jiraStory, pipelineContext, emit);
  run.result = pr
    ? { summary: finalResult, prNumber: pr.number, prUrl: pr.url, prTitle: pr.title }
    : { summary: finalResult };
}

// ─── Single Agent Runner (exported for step-by-step UI) ──────────────────────

export async function runSingleAgent(agent, project, storyKey, previousContext, emit, manualStory = null, waitForClarification = null) {
  // Gather shared context (non-blocking — skip if connectors not configured)
  let jiraCtx = `Jira Story: ${storyKey}`;
  let gitCtx = `Repository: ${project.git?.repoUrl || 'Not configured'}`;
  let confCtx = '(Confluence not configured)';

  try { [jiraCtx, confCtx, gitCtx] = await Promise.all([
    gatherJiraContext(project, storyKey, manualStory),
    gatherConfluenceContext(project, storyKey, manualStory),
    gatherGitContext(project)
  ]); } catch {}

  const sharedContext = `# Project: ${project.name}\n\n${jiraCtx}\n\n${confCtx}\n\n${gitCtx}`;

  // Build previous outputs from frontend array, supplementing with any disk-saved .md files
  // so the Developer/Tester agents get the Lead Agent's plan even after a page refresh.
  const diskAgentOrder = ['lead-agent', 'developer-agent', 'tester-agent', 'regression-agent'];
  const previousMap = Object.fromEntries((previousContext || []).map(p => [p.agentType, p]));
  for (const type of diskAgentOrder) {
    if (type === agent.type) break;                       // stop at the current agent
    if (previousMap[type]) continue;                      // already have it from frontend
    const diskOutput = await loadAgentOutputFromDisk(project, storyKey, type);
    if (diskOutput) {
      previousMap[type] = { agentId: '', agentName: type, agentType: type, output: diskOutput };
    }
  }

  const previousOutputsText = Object.values(previousMap)
    .map(p => `### Output from ${p.agentName} (${p.agentType})\n${p.output}`)
    .join('\n\n---\n\n');

  const pipelineContext = {
    jiraStory: storyKey,
    sharedContext,
    previousOutputs: previousMap,
  };

  let output = await runAgent(agent, project, pipelineContext, emit, previousOutputsText);

  // Lead Agent in step-by-step mode: pause if clarification needed, then re-run with answers
  if (agent.type === 'lead-agent' && waitForClarification) {
    const questions = extractClarificationQuestions(output);
    if (questions?.length) {
      emit('clarification_needed', { questions });
      const answers = await waitForClarification(questions);
      pipelineContext.sharedContext += buildAnswersContext(questions, answers);
      emit('pipeline_log', { message: 'Answers received — re-running Lead Agent with clarifications…' });
      output = await runAgent(agent, project, pipelineContext, emit, previousOutputsText);
    }
  }

  // Persist final output to disk as {agentType}.md
  await saveAgentOutput(project, storyKey, agent.type, output);

  // Developer agent in step-by-step mode: commit files then raise a PR
  if (agent.type === 'developer-agent' && output) {
    pipelineContext.previousOutputs['developer-agent'] = {
      agentName: agent.name,
      agentType: agent.type,
      output
    };
    try {
      await commitDeveloperFiles(project, storyKey, pipelineContext, output, emit);
    } catch (err) {
      emit('pipeline_log', { message: `File commit warning: ${err.message}` });
    }
    // Raise a PR after files are committed (same as end of full pipeline)
    if (pipelineContext.branchName) {
      await attemptPRCreation(project, storyKey, pipelineContext, emit);
    }
  }

  return output;
}

// ─── Individual Agent Runner ─────────────────────────────────────────────────

async function runAgent(agent, _project, pipelineContext, emit, previousOutputsOverride) {
  const { systemPrompt, instructions } = await loadTemplate(agent.templateType || agent.type);

  // Build the user message combining all context
  const previousOutputsText = previousOutputsOverride !== undefined
    ? previousOutputsOverride
    : Object.values(pipelineContext.previousOutputs)
        .map(p => `### Output from ${p.agentName} (${p.agentType})\n${p.output}`)
        .join('\n\n---\n\n');

  const userMessage = buildAgentMessage(
    agent,
    pipelineContext,
    previousOutputsText,
    instructions
  );

  let fullOutput = '';

  await callClaude(systemPrompt, userMessage, (token) => {
    fullOutput += token;
    emit('step_token', {
      agentId: agent.id,
      agentType: agent.type,
      token
    });
  });

  return fullOutput;
}

// ─── Message Builder ─────────────────────────────────────────────────────────

function buildAgentMessage(agent, pipelineContext, previousOutputsText, instructions) {
  const parts = [];

  // Project context
  parts.push(pipelineContext.sharedContext);

  // Previous agent outputs (if any)
  if (previousOutputsText) {
    parts.push(`\n---\n\n# Previous Agent Outputs\n\n${previousOutputsText}`);
  }

  // Agent-specific instructions from template
  if (instructions) {
    parts.push(`\n---\n\n# Your Instructions\n\n${instructions}`);
  }

  // Custom instructions from agent config
  if (agent.customInstructions?.trim()) {
    parts.push(`\n---\n\n# Additional Custom Instructions\n\n${agent.customInstructions}`);
  }

  // Final task directive
  parts.push(`\n---\n\n# Task\nYou are the **${agent.name}** in the Agent AI Squad pipeline.
Please analyze all the context above and perform your role as defined.
The Jira story to work on is: **${pipelineContext.jiraStory}**

Provide a thorough, structured output that the next agent in the pipeline can use effectively.`);

  return parts.join('\n');
}
