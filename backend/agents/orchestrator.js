// Agent Pipeline Orchestrator
// Runs agents sequentially: Lead → Developer → Tester → Regression → Lead (PR)

import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as github from '../connectors/github.js';
import * as jira from '../connectors/jira.js';
import * as confluence from '../connectors/confluence.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

async function gatherJiraContext(project, jiraStory) {
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

async function gatherConfluenceContext(project) {
  if (!confluence.isConfigured(project.confluence)) {
    return '(Confluence not configured — no documentation available)';
  }
  try {
    const pages = await confluence.getSpacePages(
      project.confluence, project.confluence.spaceKey, 5
    );
    if (!pages.length) return '(No Confluence pages found)';
    const summaries = pages.map(p => `- ${p.title}: ${p.url}`).join('\n');
    return `## Confluence Documentation\nRecent pages in space ${project.confluence.spaceKey}:\n${summaries}`;
  } catch (err) {
    return `(Confluence fetch failed: ${err.message})`;
  }
}

async function gatherGitContext(project) {
  if (!github.isConfigured(project.git)) {
    return `Repository: ${project.git?.repoUrl || 'Not configured'}\n(GitHub not configured)`;
  }
  try {
    const [info, tree] = await Promise.all([
      github.getRepoInfo(project.git),
      github.getRepoTree(project.git, project.git.branch || 'main')
    ]);
    const fileList = tree.slice(0, 80).join('\n');
    return `## Git Repository: ${info.full_name}
**Default Branch:** ${info.default_branch}
**Description:** ${info.description || 'No description'}
**Language:** ${info.language}
**URL:** ${info.html_url}

### Repository File Structure (top 80 files)
\`\`\`
${fileList}
\`\`\``;
  } catch (err) {
    return `Repository: ${project.git?.repoUrl}\n(Git fetch failed: ${err.message})`;
  }
}

// ─── Claude Streaming Call ───────────────────────────────────────────────────

async function callClaude(systemPrompt, userMessage, onToken) {
  const stream = anthropic.messages.stream({
    model: process.env.CLAUDE_MODEL || 'claude-opus-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }]
  });

  let fullResponse = '';

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta?.type === 'text_delta'
    ) {
      const token = event.delta.text;
      fullResponse += token;
      onToken(token);
    }
  }

  return fullResponse;
}

// ─── Pipeline Runner ─────────────────────────────────────────────────────────

export async function runPipeline(project, jiraStory, run, emit) {
  const sortedAgents = [...project.agents].sort((a, b) => a.order - b.order);

  // Pre-gather shared context
  emit('pipeline_log', { message: 'Gathering project context from Jira, Confluence, and Git...' });
  const [jiraContext, confluenceContext, gitContext] = await Promise.all([
    gatherJiraContext(project, jiraStory),
    gatherConfluenceContext(project),
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
      const output = await runAgent(agent, project, pipelineContext, emit);

      // Store output in pipeline context for next agent
      pipelineContext.previousOutputs[agent.type] = {
        agentName: agent.name,
        agentType: agent.type,
        output
      };

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

  run.result = { summary: finalResult };
  emit('pipeline_complete', { message: 'All agents completed successfully.', result: finalResult });
}

// ─── Single Agent Runner (exported for step-by-step UI) ──────────────────────

export async function runSingleAgent(agent, project, storyKey, previousContext, emit) {
  // Gather shared context (non-blocking — skip if connectors not configured)
  let jiraCtx = `Jira Story: ${storyKey}`;
  let gitCtx = `Repository: ${project.git?.repoUrl || 'Not configured'}`;
  let confCtx = '(Confluence not configured)';

  try { [jiraCtx, confCtx, gitCtx] = await Promise.all([
    gatherJiraContext(project, storyKey),
    gatherConfluenceContext(project),
    gatherGitContext(project)
  ]); } catch {}

  const sharedContext = `# Project: ${project.name}\n\n${jiraCtx}\n\n${confCtx}\n\n${gitCtx}`;

  // Build previous outputs text from the array passed in from frontend
  const previousOutputsText = (previousContext || [])
    .map(p => `### Output from ${p.agentName} (${p.agentType})\n${p.output}`)
    .join('\n\n---\n\n');

  const pipelineContext = {
    jiraStory: storyKey,
    sharedContext,
    previousOutputs: Object.fromEntries(
      (previousContext || []).map(p => [p.agentType, p])
    )
  };

  return runAgent(agent, project, pipelineContext, emit, previousOutputsText);
}

// ─── Individual Agent Runner ─────────────────────────────────────────────────

async function runAgent(agent, project, pipelineContext, emit, previousOutputsOverride) {
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
