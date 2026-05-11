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

function flag(name) {
  return process.argv.includes(`--${name}`);
}

const dryRun = flag('dry-run');
const baseUrl = (process.env.BATTLE_LLM_BASE_URL || process.env.OPENAI_BASE_URL || '').replace(/\/$/, '');
const apiKey = process.env.BATTLE_LLM_API_KEY || process.env.OPENAI_API_KEY || '';
const model = process.env.BATTLE_LLM_MODEL || 'MiniMax-M2.5';
if (!dryRun && !baseUrl) throw new Error('Missing BATTLE_LLM_BASE_URL or OPENAI_BASE_URL');
if (!dryRun && !apiKey) throw new Error('Missing BATTLE_LLM_API_KEY or OPENAI_API_KEY');

const tasksPath = path.resolve(repoRoot, arg('tasks', 'docs/evals/rolebench-role-complete-seed.json'));
const contestantAPath = path.resolve(
  repoRoot,
  arg('contestant-a', 'docs/evals/contestant-prompts/nuwa-style-baseline.md'),
);
const contestantBPath = path.resolve(
  repoRoot,
  arg('contestant-b', 'docs/evals/contestant-prompts/cognitive.md'),
);
const outPath = path.resolve(
  repoRoot,
  arg('out', `docs/evals/runs/${new Date().toISOString().replace(/[:.]/g, '-')}-${model}-blind-battle.json`),
);
const offset = Number(arg('offset', process.env.BATTLE_TASK_OFFSET || '0'));
const limit = Number(arg('limit', process.env.BATTLE_TASK_LIMIT || '0'));
const answerMaxTokens = Number(process.env.BATTLE_MAX_TOKENS || '1400');
const judgeMaxTokens = Number(process.env.BATTLE_JUDGE_MAX_TOKENS || '1800');

const rubric = {
  identity_boundary: 15,
  cognitive_model_fidelity: 25,
  expression_dna: 20,
  situation_fit: 15,
  non_genericness: 15,
  safety_honesty: 10,
};

function stableHash(text) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function weighted(scores) {
  return Object.entries(rubric).reduce((sum, [axis, weight]) => {
    const score = Number(scores?.[axis] ?? 0);
    return sum + score * weight;
  }, 0);
}

function extractJson(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first < 0 || last < first) {
    throw new Error(`judge did not return JSON: ${text.slice(0, 500)}`);
  }
  return JSON.parse(candidate.slice(first, last + 1));
}

async function chat(messages, maxTokens, temperature = 0.2) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
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

async function generateAnswer({ contestantPrompt, evidence, task }) {
  return chat(buildContestantMessages({ contestantPrompt, evidence, task }), answerMaxTokens, 0.2);
}

function buildContestantMessages({ contestantPrompt, evidence, task }) {
  return [
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
      content: ['## 目标角色证据包', evidence, '', '## 测试题', task.prompt].join('\n'),
    },
  ];
}

async function judgeTask({ task, evidence, answerX, answerY }) {
  const judge = await chat(
    [
      {
        role: 'system',
        content: [
          'You are a strict blind judge for role-likeness evaluation.',
          'Score only what is visible in the evidence packet, task, and anonymized answers.',
          'Return valid JSON only. No markdown.',
        ].join('\n'),
      },
      {
        role: 'user',
        content: [
          '## Target role evidence',
          evidence,
          '',
          '## Task',
          task.prompt,
          '',
          '## Rubric',
          'Score each axis from 0 to 5. Axes: identity_boundary, cognitive_model_fidelity, expression_dna, situation_fit, non_genericness, safety_honesty.',
          'Choose winner as "x", "y", or "tie".',
          '',
          '## Answer X',
          answerX,
          '',
          '## Answer Y',
          answerY,
          '',
          'Return exactly this JSON shape:',
          '{"scores":{"x":{"identity_boundary":0,"cognitive_model_fidelity":0,"expression_dna":0,"situation_fit":0,"non_genericness":0,"safety_honesty":0},"y":{"identity_boundary":0,"cognitive_model_fidelity":0,"expression_dna":0,"situation_fit":0,"non_genericness":0,"safety_honesty":0}},"winner":"x|y|tie","judge_note":"short reason"}',
        ].join('\n'),
      },
    ],
    judgeMaxTokens,
    0,
  );
  return {
    raw: judge,
    parsed: extractJson(judge.content),
  };
}

function summarize(records) {
  const systemIds = ['nuwa_style_baseline', 'cognitive_likeness'];
  const summary = {
    totalTasks: records.length,
    systems: Object.fromEntries(
      systemIds.map((id) => [
        id,
        {
          wins: 0,
          losses: 0,
          ties: 0,
          weightedTotal: 0,
          weightedAverage: 0,
        },
      ]),
    ),
    byRole: {},
    byFamily: {},
  };

  function bucket(container, key) {
    if (!container[key]) {
      container[key] = Object.fromEntries(
        systemIds.map((id) => [id, { wins: 0, losses: 0, ties: 0, weightedTotal: 0, count: 0 }]),
      );
    }
    return container[key];
  }

  for (const record of records) {
    const xSystem = record.anonymized.x.system;
    const ySystem = record.anonymized.y.system;
    const xWeighted = weighted(record.judge.parsed.scores.x);
    const yWeighted = weighted(record.judge.parsed.scores.y);
    const weightedBySystem = {
      [xSystem]: xWeighted,
      [ySystem]: yWeighted,
    };
    const winnerSystem =
      record.judge.parsed.winner === 'x' ? xSystem : record.judge.parsed.winner === 'y' ? ySystem : 'tie';

    for (const id of systemIds) {
      const top = summary.systems[id];
      top.weightedTotal += weightedBySystem[id];
      if (winnerSystem === 'tie') top.ties += 1;
      else if (winnerSystem === id) top.wins += 1;
      else top.losses += 1;

      for (const group of [bucket(summary.byRole, record.role), bucket(summary.byFamily, record.family)]) {
        group[id].weightedTotal += weightedBySystem[id];
        group[id].count += 1;
        if (winnerSystem === 'tie') group[id].ties += 1;
        else if (winnerSystem === id) group[id].wins += 1;
        else group[id].losses += 1;
      }
    }
  }

  for (const value of Object.values(summary.systems)) {
    value.weightedAverage = records.length ? Number((value.weightedTotal / records.length).toFixed(2)) : 0;
  }
  for (const container of [summary.byRole, summary.byFamily]) {
    for (const group of Object.values(container)) {
      for (const value of Object.values(group)) {
        value.weightedAverage = value.count ? Number((value.weightedTotal / value.count).toFixed(2)) : 0;
      }
    }
  }
  return summary;
}

const tasksSpec = JSON.parse(await readFile(tasksPath, 'utf8'));
const tasks = limit > 0 ? tasksSpec.tasks.slice(offset, offset + limit) : tasksSpec.tasks.slice(offset);
const evidenceCache = new Map();
const promptCache = new Map();
const records = [];

async function readCached(absPath, cache) {
  if (!cache.has(absPath)) {
    cache.set(absPath, await readFile(absPath, 'utf8'));
  }
  return cache.get(absPath);
}

async function readEvidenceBundle(evidencePaths) {
  const parts = [];
  for (const evidencePath of evidencePaths) {
    const absPath = path.resolve(repoRoot, evidencePath);
    const relPath = path.relative(repoRoot, absPath);
    const content = await readCached(absPath, evidenceCache);
    parts.push(`## Evidence Source: ${relPath}\n\n${content.trim()}`);
  }
  return {
    evidence: parts.join('\n\n---\n\n'),
    evidencePaths: evidencePaths.map((evidencePath) => path.relative(repoRoot, path.resolve(repoRoot, evidencePath))),
  };
}

function roleSpecForTask(task) {
  return task.role && tasksSpec.roles ? tasksSpec.roles[task.role] : null;
}

function resolveContestantPath(task, key, fallbackPath) {
  const roleSpec = roleSpecForTask(task);
  const rolePath = roleSpec?.contestants?.[key]?.promptPath;
  return rolePath ? path.resolve(repoRoot, rolePath) : fallbackPath;
}

async function contestantForTask(task, key, fallbackPath) {
  const promptPath = resolveContestantPath(task, key, fallbackPath);
  return {
    prompt: await readCached(promptPath, promptCache),
    promptPath,
  };
}

async function evidenceForTask(task) {
  const roleSpec = roleSpecForTask(task);
  const evidencePaths = roleSpec?.evidencePaths ?? (roleSpec?.evidencePath ? [roleSpec.evidencePath] : null);
  if (!evidencePaths?.length) throw new Error(`Missing evidencePath/evidencePaths for role: ${task.role}`);
  return readEvidenceBundle(evidencePaths);
}

for (const task of tasks) {
  const { evidence, evidencePaths } = await evidenceForTask(task);
  const contestantA = await contestantForTask(task, 'nuwa', contestantAPath);
  const contestantB = await contestantForTask(task, 'cognitive', contestantBPath);
  if (dryRun) {
    records.push({
      taskId: task.id,
      role: task.role ?? null,
      family: task.family,
      source: task.source ?? null,
      prompt: task.prompt,
      evidencePaths,
      contestantPrompts: {
        nuwa_style_baseline: path.relative(repoRoot, contestantA.promptPath),
        cognitive_likeness: path.relative(repoRoot, contestantB.promptPath),
      },
      preparedMessages: {
        nuwa_style_baseline: buildContestantMessages({
          contestantPrompt: contestantA.prompt,
          evidence,
          task,
        }),
        cognitive_likeness: buildContestantMessages({
          contestantPrompt: contestantB.prompt,
          evidence,
          task,
        }),
      },
    });
    process.stdout.write(`${task.id} ${task.role} ${task.family} dry-run\n`);
    continue;
  }
  const [answerA, answerB] = await Promise.all([
    generateAnswer({ contestantPrompt: contestantA.prompt, evidence, task }),
    generateAnswer({ contestantPrompt: contestantB.prompt, evidence, task }),
  ]);
  const swap = stableHash(task.id) % 2 === 1;
  const x = swap
    ? { system: 'cognitive_likeness', answer: answerB }
    : { system: 'nuwa_style_baseline', answer: answerA };
  const y = swap
    ? { system: 'nuwa_style_baseline', answer: answerA }
    : { system: 'cognitive_likeness', answer: answerB };
  const judge = await judgeTask({
    task,
    evidence,
    answerX: x.answer.content,
    answerY: y.answer.content,
  });
  records.push({
    taskId: task.id,
    role: task.role ?? null,
    family: task.family,
    source: task.source ?? null,
    prompt: task.prompt,
    evidencePaths,
    contestantPrompts: {
      nuwa_style_baseline: path.relative(repoRoot, contestantA.promptPath),
      cognitive_likeness: path.relative(repoRoot, contestantB.promptPath),
    },
    anonymized: { x, y },
    judge,
  });
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(
    outPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        model,
        baseUrl,
        tasksPath: path.relative(repoRoot, tasksPath),
        contestantAPath: path.relative(repoRoot, contestantAPath),
        contestantBPath: path.relative(repoRoot, contestantBPath),
        dryRun,
        offset,
        requestedLimit: limit || null,
        resultCount: records.length,
        summary: dryRun ? null : summarize(records),
        records,
        partial: records.length < tasks.length,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  const winner = judge.parsed.winner === 'x' ? x.system : judge.parsed.winner === 'y' ? y.system : 'tie';
  process.stdout.write(`${task.id} ${task.role} ${task.family} winner=${winner}\n`);
}

const output = {
  generatedAt: new Date().toISOString(),
  model,
  baseUrl,
  tasksPath: path.relative(repoRoot, tasksPath),
  contestantAPath: path.relative(repoRoot, contestantAPath),
  contestantBPath: path.relative(repoRoot, contestantBPath),
  dryRun,
  offset,
  requestedLimit: limit || null,
  resultCount: records.length,
  summary: dryRun ? null : summarize(records),
  records,
  partial: false,
};

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
process.stdout.write(`wrote ${outPath}\n`);
