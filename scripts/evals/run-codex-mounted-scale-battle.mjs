#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

function arg(name, fallback = null) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((item) => item.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

const tasksPath = path.resolve(repoRoot, arg('tasks', 'docs/evals/profile-helper-strict-scale-56-seed.json'));
const outPath = path.resolve(
  repoRoot,
  arg('out', `docs/evals/runs/${new Date().toISOString().replace(/[:.]/g, '-')}-codex-mounted-scale-battle.json`),
);
const offset = Number(arg('offset', '0'));
const limit = Number(arg('limit', '0'));
const batchSize = Number(arg('batch-size', process.env.CODEX_BATTLE_BATCH_SIZE || '1'));
const roleFilter = arg('roles', '')
  .split(',')
  .map((role) => role.trim())
  .filter(Boolean);
const model = arg('model', process.env.CODEX_BATTLE_MODEL || 'gpt-5.5');
const reasoningEffort = arg('reasoning-effort', process.env.CODEX_BATTLE_REASONING || 'low');
const tmpDir = path.resolve(repoRoot, 'docs/evals/runs/codex-mounted-tmp');
const codexRetries = Number(process.env.CODEX_BATTLE_RETRIES || '5');
const retryBaseMs = Number(process.env.CODEX_BATTLE_RETRY_BASE_MS || '5000');

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
  return Object.entries(rubric).reduce((sum, [axis, weight]) => sum + Number(scores?.[axis] ?? 0) * weight, 0);
}

function taskScaleMeta(task) {
  return {
    genericQuestionId: task.genericQuestionId ?? null,
    dimension: task.dimension ?? null,
    responseScale: task.responseScale ?? null,
    reverse: task.reverse ?? false,
    statement: task.statement ?? null,
  };
}

async function readEvidenceBundle(evidencePaths) {
  const parts = [];
  for (const evidencePath of evidencePaths) {
    const absPath = path.resolve(repoRoot, evidencePath);
    const relPath = path.relative(repoRoot, absPath);
    const content = await readFile(absPath, 'utf8');
    parts.push(`## Evidence Source: ${relPath}\n\n${content.trim()}`);
  }
  return {
    evidence: parts.join('\n\n---\n\n'),
    evidencePaths: evidencePaths.map((evidencePath) => path.relative(repoRoot, path.resolve(repoRoot, evidencePath))),
  };
}

async function evidenceForRole(tasksSpec, role) {
  const roleSpec = tasksSpec.roles?.[role];
  const evidencePaths = roleSpec?.evidencePaths ?? (roleSpec?.evidencePath ? [roleSpec.evidencePath] : null);
  if (!evidencePaths?.length) throw new Error(`Missing evidencePath/evidencePaths for role: ${role}`);
  return readEvidenceBundle(evidencePaths);
}

function extractJson(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first < 0 || last < first) throw new Error(`No JSON object in Codex output: ${text.slice(0, 500)}`);
  return JSON.parse(candidate.slice(first, last + 1));
}

function extractAnswerBatch(text, tasks) {
  const parsed = extractJson(text);
  const answers = Array.isArray(parsed) ? parsed : parsed.answers;
  if (!Array.isArray(answers)) throw new Error(`Codex answer batch is not an array: ${text.slice(0, 500)}`);
  const byId = new Map(answers.map((answer) => [answer.taskId, answer]));
  return Object.fromEntries(
    tasks.map((task) => {
      const answer = byId.get(task.id);
      if (!answer) throw new Error(`Missing answer for task ${task.id}`);
      return [
        task.id,
        {
          content: JSON.stringify({
            score: Number(answer.score),
            reason: String(answer.reason ?? '').trim(),
          }),
        },
      ];
    }),
  );
}

function extractJudgeBatch(text, tasks) {
  const parsed = extractJson(text);
  const judgments = Array.isArray(parsed) ? parsed : parsed.judgments;
  if (!Array.isArray(judgments)) throw new Error(`Codex judge batch is not an array: ${text.slice(0, 500)}`);
  const byId = new Map(judgments.map((judgment) => [judgment.taskId, judgment]));
  return Object.fromEntries(
    tasks.map((task) => {
      const judgment = byId.get(task.id);
      if (!judgment) throw new Error(`Missing judgment for task ${task.id}`);
      return [
        task.id,
        {
          scores: judgment.scores,
          winner: ['x', 'y', 'tie'].includes(judgment.winner) ? judgment.winner : 'tie',
          judge_note: String(judgment.judge_note ?? '').trim(),
        },
      ];
    }),
  );
}

async function codexExec(prompt, tag) {
  await mkdir(tmpDir, { recursive: true });
  let lastError = null;
  for (let attempt = 0; attempt <= codexRetries; attempt += 1) {
    const outFile = path.join(tmpDir, `${Date.now()}-${tag}-try${attempt}.txt`);
    const command = [
      'codex',
      '--ask-for-approval',
      'never',
      'exec',
      '--cd',
      '.',
      '--sandbox',
      'read-only',
      '--model',
      model,
      '--config',
      `model_reasoning_effort="${reasoningEffort}"`,
      '--output-last-message',
      outFile,
      '-',
    ].join(' ');
    const child = spawnSync(command, {
      cwd: repoRoot,
      input: prompt,
      encoding: 'utf8',
      shell: true,
      timeout: Number(process.env.CODEX_BATTLE_TIMEOUT_MS || '600000'),
      windowsHide: true,
    });
    if (!child.error && child.status === 0 && existsSync(outFile)) {
      return readFile(outFile, 'utf8');
    }
    const errText = child.error?.message || child.stderr || child.stdout || 'unknown codex exec failure';
    lastError = new Error(`codex exec failed for ${tag}: ${errText.slice(-1200)}`);
    if (attempt < codexRetries) {
      await new Promise((resolve) => {
        setTimeout(resolve, Math.min(60000, retryBaseMs * 2 ** attempt));
      });
    }
  }
  throw lastError;
}

function answerPrompt({ systemId, role, skill, evidence, task }) {
  const systemLabel = systemId === 'nuwa_generated_skill' ? 'Nuwa skill' : 'cognitive skill';
  return [
    '你是一个非交互评测生成器。只输出最终 JSON，不要解释。',
    '',
    `## Mounted system: ${systemLabel}`,
    skill,
    '',
    '## Shared role evidence',
    evidence,
    '',
    '## Runtime instruction',
    `Mount the role "${role}" directly from the evidence and the mounted system above.`,
    'Do not search the web. Do not mention benchmark names. Do not say you are AI.',
    'Answer the questionnaire item as the mounted role.',
    '',
    '## Task',
    task.prompt,
    '',
    'Return valid JSON only: {"score": <number>, "reason": "<one short evidence-consistent sentence in the role voice>"}.',
  ].join('\n');
}

function answerBatchPrompt({ systemId, role, skill, evidence, tasks }) {
  const systemLabel = systemId === 'nuwa_generated_skill' ? 'Nuwa skill' : 'cognitive skill';
  return [
    '你是一个非交互评测生成器。只输出最终 JSON，不要解释。',
    '',
    `## Mounted system: ${systemLabel}`,
    skill,
    '',
    '## Shared role evidence',
    evidence,
    '',
    '## Runtime instruction',
    `Mount the role "${role}" directly from the evidence and the mounted system above.`,
    'Do not search the web. Do not mention benchmark names. Do not say you are AI.',
    'Answer every questionnaire item as the mounted role.',
    '',
    '## Tasks',
    JSON.stringify(
      tasks.map((task) => ({
        taskId: task.id,
        prompt: task.prompt,
      })),
      null,
      2,
    ),
    '',
    'Return valid JSON only in this exact shape:',
    '{"answers":[{"taskId":"...","score":0,"reason":"one short evidence-consistent sentence in the role voice"}]}',
    'Return one answer for every taskId, preserving taskId exactly.',
  ].join('\n');
}

function judgePrompt({ task, evidence, answerX, answerY }) {
  const fingerprintBlock = task.targetFingerprint
    ? [
        '## Evidence-derived cognitive fingerprint',
        JSON.stringify(task.targetFingerprint, null, 2),
        '',
        'Use this fingerprint only as a judging anchor. The contestants did not see it in the task prompt.',
        '',
      ].join('\n')
    : '';
  return [
    'You are a strict blind judge for role-likeness evaluation. Return valid JSON only. No markdown.',
    '',
    '## Shared target role evidence',
    evidence,
    '',
    '## Task',
    task.prompt,
    '',
    fingerprintBlock,
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
  ].join('\n');
}

function judgeBatchPrompt({ tasks, evidence, pairs }) {
  return [
    'You are a strict blind judge for role-likeness evaluation. Return valid JSON only. No markdown.',
    '',
    '## Shared target role evidence',
    evidence,
    '',
    '## Rubric',
    'For each task, score each axis from 0 to 5. Axes: identity_boundary, cognitive_model_fidelity, expression_dna, situation_fit, non_genericness, safety_honesty.',
    'Choose winner as "x", "y", or "tie" for each task.',
    '',
    '## Tasks and anonymized answers',
    JSON.stringify(
      tasks.map((task) => ({
        taskId: task.id,
        prompt: task.prompt,
        targetFingerprint: task.targetFingerprint ?? null,
        answerX: pairs[task.id].x.answer.content,
        answerY: pairs[task.id].y.answer.content,
      })),
      null,
      2,
    ),
    '',
    'Return valid JSON only in this exact shape:',
    '{"judgments":[{"taskId":"...","scores":{"x":{"identity_boundary":0,"cognitive_model_fidelity":0,"expression_dna":0,"situation_fit":0,"non_genericness":0,"safety_honesty":0},"y":{"identity_boundary":0,"cognitive_model_fidelity":0,"expression_dna":0,"situation_fit":0,"non_genericness":0,"safety_honesty":0}},"winner":"x|y|tie","judge_note":"short reason"}]}',
    'Return one judgment for every taskId, preserving taskId exactly.',
  ].join('\n');
}

function summarize(records) {
  const systemIds = ['nuwa_generated_skill', 'cognitive_generated_likeness'];
  const summary = {
    totalTasks: records.length,
    systems: Object.fromEntries(
      systemIds.map((id) => [id, { wins: 0, losses: 0, ties: 0, weightedTotal: 0, weightedAverage: 0 }]),
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
    const weightedBySystem = { [xSystem]: xWeighted, [ySystem]: yWeighted };
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
        delete value.count;
      }
    }
  }
  return summary;
}

const tasksSpec = JSON.parse(await readFile(tasksPath, 'utf8'));
const nuwaSkill = await readFile(path.resolve(repoRoot, '../nuwa-skill/SKILL.md'), 'utf8');
const cognitiveSkill = await readFile(path.resolve(repoRoot, 'skills/cognitive/SKILL.md'), 'utf8');
const allTasks = tasksSpec.tasks.filter((task) => !roleFilter.length || roleFilter.includes(task.role));
const tasks = limit > 0 ? allTasks.slice(offset, offset + limit) : allTasks.slice(offset);
const records = [];

for (let start = 0; start < tasks.length; start += batchSize) {
  const batch = tasks.slice(start, start + batchSize);
  const role = batch[0].role;
  if (!batch.every((task) => task.role === role)) throw new Error('A batch cannot cross roles.');
  const { evidence, evidencePaths } = await evidenceForRole(tasksSpec, role);
  const nuwaRaw =
    batch.length === 1
      ? await codexExec(
          answerPrompt({ systemId: 'nuwa_generated_skill', role, skill: nuwaSkill, evidence, task: batch[0] }),
          `${batch[0].id}-nuwa`,
        )
      : await codexExec(
          answerBatchPrompt({ systemId: 'nuwa_generated_skill', role, skill: nuwaSkill, evidence, tasks: batch }),
          `${batch[0].id}-${batch.at(-1).id}-nuwa`,
        );
  const cognitiveRaw =
    batch.length === 1
      ? await codexExec(
          answerPrompt({
            systemId: 'cognitive_generated_likeness',
            role,
            skill: cognitiveSkill,
            evidence,
            task: batch[0],
          }),
          `${batch[0].id}-cognitive`,
        )
      : await codexExec(
          answerBatchPrompt({
            systemId: 'cognitive_generated_likeness',
            role,
            skill: cognitiveSkill,
            evidence,
            tasks: batch,
          }),
          `${batch[0].id}-${batch.at(-1).id}-cognitive`,
        );
  const nuwaAnswers =
    batch.length === 1
      ? { [batch[0].id]: { content: nuwaRaw.trim() } }
      : extractAnswerBatch(nuwaRaw, batch);
  const cognitiveAnswers =
    batch.length === 1
      ? { [batch[0].id]: { content: cognitiveRaw.trim() } }
      : extractAnswerBatch(cognitiveRaw, batch);
  const pairs = {};
  for (const task of batch) {
    const seed = stableHash(`${task.id}:${task.role}`);
    const xIsNuwa = seed % 2 === 0;
    pairs[task.id] = xIsNuwa
      ? {
          x: { system: 'nuwa_generated_skill', answer: nuwaAnswers[task.id] },
          y: { system: 'cognitive_generated_likeness', answer: cognitiveAnswers[task.id] },
        }
      : {
          x: { system: 'cognitive_generated_likeness', answer: cognitiveAnswers[task.id] },
          y: { system: 'nuwa_generated_skill', answer: nuwaAnswers[task.id] },
        };
  }
  const judgeRaw =
    batch.length === 1
      ? await codexExec(
          judgePrompt({
            task: batch[0],
            evidence,
            answerX: pairs[batch[0].id].x.answer.content,
            answerY: pairs[batch[0].id].y.answer.content,
          }),
          `${batch[0].id}-judge`,
        )
      : await codexExec(
          judgeBatchPrompt({ tasks: batch, evidence, pairs }),
          `${batch[0].id}-${batch.at(-1).id}-judge`,
        );
  const judgments = batch.length === 1 ? { [batch[0].id]: extractJson(judgeRaw) } : extractJudgeBatch(judgeRaw, batch);
  for (const task of batch) {
    records.push({
      taskId: task.id,
      taskMeta: taskScaleMeta(task),
      role: task.role,
      family: task.family,
      source: task.source,
      prompt: task.prompt,
      evidencePaths,
      artifactPaths: {
        nuwa_generated_skill: '../nuwa-skill/SKILL.md',
        cognitive_generated_likeness: 'skills/cognitive/SKILL.md',
      },
      anonymized: pairs[task.id],
      judge: { raw: { content: judgeRaw.trim() }, parsed: judgments[task.id] },
    });
    const winner = records.at(-1).judge.parsed.winner;
    const winnerSystem = winner === 'tie' ? 'tie' : records.at(-1).anonymized[winner].system;
    process.stdout.write(`${task.id} ${task.role} ${task.family} winner=${winnerSystem}\n`);
  }
  await writeFile(
    outPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        model,
        runner: 'codex-cli-direct-mounted',
        tasksPath: path.relative(repoRoot, tasksPath).replaceAll(path.sep, '/'),
        offset,
        requestedLimit: limit || null,
        roles: roleFilter,
        resultCount: records.length,
        summary: summarize(records),
        records,
        partial: true,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

await writeFile(
  outPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      model,
      runner: 'codex-cli-direct-mounted',
      tasksPath: path.relative(repoRoot, tasksPath).replaceAll(path.sep, '/'),
      offset,
      requestedLimit: limit || null,
      roles: roleFilter,
      resultCount: records.length,
      summary: summarize(records),
      records,
      partial: false,
    },
    null,
    2,
  )}\n`,
  'utf8',
);
console.log(`wrote ${outPath}`);
