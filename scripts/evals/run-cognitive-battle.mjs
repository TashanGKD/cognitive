#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

function arg(name, fallback = null) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((item) => item.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

const baseUrl = (process.env.BATTLE_LLM_BASE_URL || process.env.OPENAI_BASE_URL || '').replace(/\/$/, '');
const apiKey = process.env.BATTLE_LLM_API_KEY || process.env.OPENAI_API_KEY || '';
const model = process.env.BATTLE_LLM_MODEL || 'MiniMax-M2.5';
if (!baseUrl) throw new Error('Missing BATTLE_LLM_BASE_URL or OPENAI_BASE_URL');
if (!apiKey) throw new Error('Missing BATTLE_LLM_API_KEY or OPENAI_API_KEY');

const tasksPath = path.resolve(repoRoot, arg('tasks', 'docs/evals/cognitive-battle-tasks.json'));
const evidencePath = path.resolve(repoRoot, arg('evidence', 'docs/evals/example-role-evidence.md'));
const contestantPath = path.resolve(repoRoot, arg('contestant', 'docs/evals/contestant-prompts/cognitive.md'));
const outPath = path.resolve(
  repoRoot,
  arg('out', `docs/evals/runs/${new Date().toISOString().replace(/[:.]/g, '-')}-${model}-answers.json`),
);
const limit = Number(arg('limit', process.env.BATTLE_TASK_LIMIT || '0'));
const maxTokens = Number(process.env.BATTLE_MAX_TOKENS || '1400');

async function chat(messages) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`LLM request failed ${response.status}: ${text.slice(0, 1000)}`);
  }
  const json = JSON.parse(text);
  const choice = json.choices?.[0];
  const message = choice?.message ?? {};
  return {
    content: typeof message.content === 'string' ? message.content.trim() : '',
    reasoningTokens: typeof message.reasoning_content === 'string' ? message.reasoning_content.length : 0,
    finishReason: choice?.finish_reason ?? null,
    usage: json.usage ?? null,
  };
}

const tasksSpec = JSON.parse(await readFile(tasksPath, 'utf8'));
const contestantPrompt = await readFile(contestantPath, 'utf8');
const tasks = limit > 0 ? tasksSpec.tasks.slice(0, limit) : tasksSpec.tasks;
const evidenceCache = new Map();

async function readEvidenceBundle(evidencePaths) {
  const parts = [];
  for (const roleEvidencePath of evidencePaths) {
    const absPath = path.resolve(repoRoot, roleEvidencePath);
    if (!evidenceCache.has(absPath)) {
      evidenceCache.set(absPath, await readFile(absPath, 'utf8'));
    }
    const relPath = path.relative(repoRoot, absPath);
    parts.push(`## Evidence Source: ${relPath}\n\n${evidenceCache.get(absPath).trim()}`);
  }
  return {
    evidence: parts.join('\n\n---\n\n'),
    evidencePaths: evidencePaths.map((roleEvidencePath) =>
      path.relative(repoRoot, path.resolve(repoRoot, roleEvidencePath)),
    ),
  };
}

async function evidenceForTask(task) {
  const roleSpec = task.role && tasksSpec.roles ? tasksSpec.roles[task.role] : null;
  const evidencePaths = roleSpec?.evidencePaths ?? (roleSpec?.evidencePath ? [roleSpec.evidencePath] : null);
  if (evidencePaths?.length) return readEvidenceBundle(evidencePaths);
  return readEvidenceBundle([path.relative(repoRoot, evidencePath)]);
}

const results = [];
for (const task of tasks) {
  const { evidence: roleEvidence, evidencePaths } = await evidenceForTask(task);
  const messages = [
    {
      role: 'system',
      content: [
        contestantPrompt,
        '',
        '你正在参加匿名角色像真度 Battle。只输出给访客看的回答，不要解释评测过程。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        '## 目标角色证据包',
        roleEvidence,
        '',
        '## 测试题',
        task.prompt,
      ].join('\n'),
    },
  ];
  const answer = await chat(messages);
  results.push({
    taskId: task.id,
    role: task.role ?? null,
    family: task.family,
    source: task.source ?? null,
    prompt: task.prompt,
    evidencePaths,
    answer,
  });
  process.stdout.write(`${task.id} ${answer.finishReason} ${answer.content ? 'ok' : 'empty'}\n`);
}

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(
  outPath,
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    model,
    baseUrl,
    tasksPath: path.relative(repoRoot, tasksPath),
    defaultEvidencePath: path.relative(repoRoot, evidencePath),
    contestantPath: path.relative(repoRoot, contestantPath),
    resultCount: results.length,
    results,
  }, null, 2) + '\n',
  'utf8',
);
process.stdout.write(`wrote ${outPath}\n`);
