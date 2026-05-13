#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
const buildOnly = flag('build-only');
const reuseArtifacts = flag('reuse-artifacts');
const baseUrl = (process.env.BATTLE_LLM_BASE_URL || process.env.OPENAI_BASE_URL || '').replace(/\/$/, '');
const apiKey = process.env.BATTLE_LLM_API_KEY || process.env.OPENAI_API_KEY || '';
const model = process.env.BATTLE_LLM_MODEL || 'MiniMax-M2.5';
if (!dryRun && !baseUrl) throw new Error('Missing BATTLE_LLM_BASE_URL or OPENAI_BASE_URL');
if (!dryRun && !apiKey) throw new Error('Missing BATTLE_LLM_API_KEY or OPENAI_API_KEY');

const tasksPath = path.resolve(repoRoot, arg('tasks', 'docs/evals/nuwa-role-complete-seed.json'));
const nuwaSkillPath = path.resolve(repoRoot, arg('nuwa-skill', '../nuwa-skill/SKILL.md'));
const nuwaTemplatePath = path.resolve(repoRoot, arg('nuwa-template', '../nuwa-skill/references/skill-template.md'));
const nuwaFrameworkPath = path.resolve(repoRoot, arg('nuwa-framework', '../nuwa-skill/references/extraction-framework.md'));
const cognitiveSkillPath = path.resolve(
  repoRoot,
  arg('cognitive', 'skills/cognitive/SKILL.md'),
);
const outPath = path.resolve(
  repoRoot,
  arg('out', `docs/evals/runs/${new Date().toISOString().replace(/[:.]/g, '-')}-${model}-two-stage-battle.json`),
);
const artifactDir = path.resolve(
  repoRoot,
  arg('artifact-dir', `docs/evals/runs/two-stage-artifacts/${new Date().toISOString().replace(/[:.]/g, '-')}`),
);
const offset = Number(arg('offset', process.env.BATTLE_TASK_OFFSET || '0'));
const limit = Number(arg('limit', process.env.BATTLE_TASK_LIMIT || '0'));
const roleFilter = arg('roles', '')
  .split(',')
  .map((role) => role.trim())
  .filter(Boolean);
const buildMaxTokens = Number(process.env.BATTLE_BUILD_MAX_TOKENS || '4800');
const answerMaxTokens = Number(process.env.BATTLE_MAX_TOKENS || '1400');
const judgeMaxTokens = Number(process.env.BATTLE_JUDGE_MAX_TOKENS || '1800');
const requestRetries = Number(process.env.BATTLE_REQUEST_RETRIES || '3');

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

function parseJsonOrRepair(candidate) {
  try {
    return JSON.parse(candidate);
  } catch {
    const stack = [];
    let inString = false;
    let escaped = false;
    for (const char of candidate) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (char === '{') stack.push('}');
      if (char === '[') stack.push(']');
      if ((char === '}' || char === ']') && stack.at(-1) === char) stack.pop();
    }
    return JSON.parse(candidate + stack.reverse().join(''));
  }
}

function completeJudge(parsed, source = 'parsed') {
  const neutral = {
    identity_boundary: 3,
    cognitive_model_fidelity: 3,
    expression_dna: 3,
    situation_fit: 3,
    non_genericness: 3,
    safety_honesty: 3,
  };
  const scores = {
    x: { ...neutral, ...(parsed?.scores?.x ?? {}) },
    y: { ...neutral, ...(parsed?.scores?.y ?? {}) },
  };
  let winner = parsed?.winner;
  if (!['x', 'y', 'tie'].includes(winner)) {
    const xScore = weighted(scores.x);
    const yScore = weighted(scores.y);
    winner = xScore === yScore ? 'tie' : xScore > yScore ? 'x' : 'y';
  }
  return {
    scores,
    winner,
    judge_note: parsed?.judge_note || `judge JSON completed from ${source}`,
  };
}

function fallbackJudge(error) {
  return completeJudge(
    {
      judge_note: `fallback: judge returned invalid JSON twice (${error.message.slice(0, 120)})`,
      winner: 'tie',
    },
    'fallback',
  );
}

function extractJson(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first < 0 || last < first) throw new Error(`judge did not return JSON: ${text.slice(0, 500)}`);
  return completeJudge(parseJsonOrRepair(candidate.slice(first, last + 1)));
}

async function parseJudgeJsonWithRetry({ initialJudge, judgeMessages }) {
  try {
    return { raw: initialJudge, parsed: extractJson(initialJudge.content) };
  } catch (error) {
    const retryJudge = await chat(
      [
        ...judgeMessages,
        {
          role: 'user',
          content: [
            'Your previous response was not valid JSON and could not be parsed.',
            `Parser error: ${error.message}`,
            'Return the same judgment again, but as valid JSON only, using exactly the requested keys.',
          ].join('\n'),
        },
      ],
      judgeMaxTokens,
      0,
    );
    try {
      return { raw: retryJudge, parsed: extractJson(retryJudge.content), retryFromInvalidJson: initialJudge.content };
    } catch (retryError) {
      return {
        raw: retryJudge,
        parsed: fallbackJudge(retryError),
        retryFromInvalidJson: initialJudge.content,
        fallbackFromInvalidJson: retryJudge.content,
      };
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function chat(messages, maxTokens, temperature = 0.2) {
  let lastError = null;
  for (let attempt = 0; attempt <= requestRetries; attempt += 1) {
    try {
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
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < requestRetries) {
          await sleep(1500 * (attempt + 1));
          continue;
        }
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
    } catch (error) {
      lastError = error;
      if (attempt >= requestRetries) break;
      await sleep(1500 * (attempt + 1));
    }
  }
  throw lastError;
}

async function readExisting(absPath, fallback = '') {
  try {
    return await readFile(absPath, 'utf8');
  } catch (error) {
    if (fallback !== '') return fallback;
    throw error;
  }
}

const fileCache = new Map();
async function readCached(absPath) {
  if (!fileCache.has(absPath)) fileCache.set(absPath, await readFile(absPath, 'utf8'));
  return fileCache.get(absPath);
}

async function readEvidenceBundle(evidencePaths) {
  const parts = [];
  for (const evidencePath of evidencePaths) {
    const absPath = path.resolve(repoRoot, evidencePath);
    const relPath = path.relative(repoRoot, absPath);
    const content = await readCached(absPath);
    parts.push(`## Evidence Source: ${relPath}\n\n${content.trim()}`);
  }
  return {
    evidence: parts.join('\n\n---\n\n'),
    evidencePaths: evidencePaths.map((evidencePath) => path.relative(repoRoot, path.resolve(repoRoot, evidencePath))),
  };
}

function roleSpecForTask(tasksSpec, task) {
  return task.role && tasksSpec.roles ? tasksSpec.roles[task.role] : null;
}

async function evidenceForRole(tasksSpec, role) {
  const roleSpec = tasksSpec.roles?.[role];
  const evidencePaths = roleSpec?.evidencePaths ?? (roleSpec?.evidencePath ? [roleSpec.evidencePath] : null);
  if (!evidencePaths?.length) throw new Error(`Missing evidencePath/evidencePaths for role: ${role}`);
  return readEvidenceBundle(evidencePaths);
}

function buildNuwaMessages({ role, evidence, nuwaSkill, nuwaTemplate, nuwaFramework }) {
  return [
    {
      role: 'system',
      content: [
        nuwaSkill,
        '',
        '## Nuwa reference: skill-template.md',
        nuwaTemplate,
        '',
        '## Nuwa reference: extraction-framework.md',
        nuwaFramework,
        '',
        '## Evaluation runtime constraint',
        '当前没有真实文件系统工具可供模型调用。不要输出 tool_call、XML 调用、mkdir、写文件命令或执行计划；直接输出最终可用的 SKILL.md 内容。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `请用真实女娲造人术从头蒸馏「${role}」人物 Skill。`,
        '',
        '硬性约束：',
        '- 不要创建目录，不要调用任何工具，不要输出 <minimax:tool_call> 或命令。',
        '- 本次是本地语料模式，禁止网络搜索，禁止补充外部实时资料。',
        '- 只能使用下方证据包；可以做综合和合理外推，但要保留诚实边界。',
        '- 输出一个可运行的 SKILL.md，而不是分析报告。',
        '- 第一个字符就应进入 markdown/frontmatter 正文，不要先说“我将...”。',
        '- 不要提评测，不要引用另一个参赛系统。',
        '',
        '## 本地证据包',
        evidence,
      ].join('\n'),
    },
  ];
}

function validateBuiltArtifact(systemId, role, content) {
  const lower = content.toLowerCase();
  if (content.length < 2500) {
    throw new Error(`${systemId} artifact for ${role} is too short (${content.length} chars)`);
  }
  if (lower.includes('<minimax:tool_call>') || lower.includes('<invoke name=') || lower.includes('mkdir -p')) {
    throw new Error(`${systemId} artifact for ${role} contains a tool-call transcript instead of a final artifact`);
  }
  if (systemId === 'nuwa_generated_skill' && !content.includes('SKILL') && !content.includes('Skill')) {
    throw new Error(`${systemId} artifact for ${role} does not look like a generated skill`);
  }
  if (systemId === 'cognitive_generated_likeness' && !content.includes('role_anchor')) {
    throw new Error(`${systemId} artifact for ${role} does not look like a likeness profile`);
  }
}

function buildcognitiveMessages({ role, evidence, cognitiveSkill }) {
  return [
    {
      role: 'system',
      content: cognitiveSkill,
    },
    {
      role: 'user',
      content: [
        `Build mode：请基于同一份证据为「${role}」构建完整 cognitive 角色卡。`,
        '',
        '硬性约束：',
        '- 禁止网络搜索，禁止补充外部实时资料。',
        '- 只能使用下方证据包；可以做综合和合理外推，但要标清来源边界。',
        '- 输出应等价于可落盘的 likeness-profile.md，用于后续 Chat mode。',
        '- 需要覆盖 role_anchor、evidence_level、source_map、identity_boundary、expertise_boundary、thinking_style、discussion_style、expression_dna、decision_heuristics、anti_patterns、calibration_tasks。',
        '- 不要提评测，不要引用另一个参赛系统。',
        '',
        '## 本地证据包',
        evidence,
      ].join('\n'),
    },
  ];
}

function buildAnswerMessages({ systemId, artifact, task }) {
  const artifactName = systemId === 'nuwa_generated_skill' ? 'Nuwa-generated SKILL.md' : 'cognitive profile';
  return [
    {
      role: 'system',
      content: [
        `You are running this generated role artifact: ${artifactName}.`,
        artifact,
        '',
        '你正在参加匿名角色像真度 Battle。只输出给访客看的回答，不要解释评测过程。不要说自己是 AI。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: task.prompt,
    },
  ];
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

async function judgeTask({ task, evidence, answerX, answerY }) {
  const fingerprintBlock = task.targetFingerprint
    ? [
        '## Evidence-derived cognitive fingerprint',
        JSON.stringify(task.targetFingerprint, null, 2),
        '',
        'Use this fingerprint only as a judging anchor. The contestants did not see it in the task prompt.',
        '',
      ].join('\n')
    : '';
  const judgeMessages = [
      {
        role: 'system',
        content: [
          'You are a strict blind judge for role-likeness evaluation.',
          'Score only what is visible in the shared evidence packet, task, and anonymized answers.',
          'Return valid JSON only. No markdown.',
        ].join('\n'),
      },
      {
        role: 'user',
        content: [
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
        ].join('\n'),
      },
    ];
  const judge = await chat(judgeMessages, judgeMaxTokens, 0);
  return parseJudgeJsonWithRetry({ initialJudge: judge, judgeMessages });
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
      }
    }
  }
  return summary;
}

function artifactPath(systemId, role) {
  return path.join(artifactDir, systemId, `${role.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')}.md`);
}

async function writeJson(output, partial = false) {
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify({ ...output, partial }, null, 2)}\n`, 'utf8');
}

const tasksSpec = JSON.parse(await readFile(tasksPath, 'utf8'));
const allTasks = tasksSpec.tasks.filter((task) => !roleFilter.length || roleFilter.includes(task.role));
const tasks = limit > 0 ? allTasks.slice(offset, offset + limit) : allTasks.slice(offset);
const roles = [...new Set(tasks.map((task) => task.role).filter(Boolean))];
const nuwaSkill = await readCached(nuwaSkillPath);
const nuwaTemplate = await readExisting(nuwaTemplatePath, '');
const nuwaFramework = await readExisting(nuwaFrameworkPath, '');
const cognitiveSkill = await readCached(cognitiveSkillPath);
const roleArtifacts = {};
const buildRecords = [];

for (const role of roles) {
  const { evidence, evidencePaths } = await evidenceForRole(tasksSpec, role);
  const nuwaMessages = buildNuwaMessages({ role, evidence, nuwaSkill, nuwaTemplate, nuwaFramework });
  const cognitiveMessages = buildcognitiveMessages({ role, evidence, cognitiveSkill });

  if (dryRun) {
    roleArtifacts[role] = {
      evidence,
      evidencePaths,
      nuwa_generated_skill: {
        artifactPath: path.relative(repoRoot, artifactPath('nuwa_generated_skill', role)),
        artifact: '[dry-run: Nuwa-generated SKILL.md would be built from the shared evidence]',
      },
      cognitive_generated_likeness: {
        artifactPath: path.relative(repoRoot, artifactPath('cognitive_generated_likeness', role)),
        artifact: '[dry-run: cognitive profile would be built from the shared evidence]',
      },
    };
    buildRecords.push({
      role,
      evidencePaths,
      buildMessages: {
        nuwa_generated_skill: nuwaMessages,
        cognitive_generated_likeness: cognitiveMessages,
      },
    });
    process.stdout.write(`${role} build dry-run\n`);
    continue;
  }

  const nuwaOut = artifactPath('nuwa_generated_skill', role);
  const cognitiveOut = artifactPath('cognitive_generated_likeness', role);
  if (reuseArtifacts && existsSync(nuwaOut) && existsSync(cognitiveOut)) {
    const nuwaArtifact = await readFile(nuwaOut, 'utf8');
    const cognitiveArtifact = await readFile(cognitiveOut, 'utf8');
    validateBuiltArtifact('nuwa_generated_skill', role, nuwaArtifact);
    validateBuiltArtifact('cognitive_generated_likeness', role, cognitiveArtifact);
    roleArtifacts[role] = {
      evidence,
      evidencePaths,
      nuwa_generated_skill: {
        artifactPath: path.relative(repoRoot, nuwaOut),
        artifact: nuwaArtifact,
      },
      cognitive_generated_likeness: {
        artifactPath: path.relative(repoRoot, cognitiveOut),
        artifact: cognitiveArtifact,
      },
    };
    buildRecords.push({
      role,
      evidencePaths,
      artifacts: {
        nuwa_generated_skill: path.relative(repoRoot, nuwaOut),
        cognitive_generated_likeness: path.relative(repoRoot, cognitiveOut),
      },
      reused: true,
    });
    process.stdout.write(`${role} build reused\n`);
    continue;
  }

  const [nuwaArtifact, cognitiveArtifact] = await Promise.all([
    chat(nuwaMessages, buildMaxTokens, 0.2),
    chat(cognitiveMessages, buildMaxTokens, 0.2),
  ]);
  validateBuiltArtifact('nuwa_generated_skill', role, nuwaArtifact.content);
  validateBuiltArtifact('cognitive_generated_likeness', role, cognitiveArtifact.content);
  await mkdir(path.dirname(nuwaOut), { recursive: true });
  await mkdir(path.dirname(cognitiveOut), { recursive: true });
  await writeFile(nuwaOut, `${nuwaArtifact.content}\n`, 'utf8');
  await writeFile(cognitiveOut, `${cognitiveArtifact.content}\n`, 'utf8');
  roleArtifacts[role] = {
    evidence,
    evidencePaths,
    nuwa_generated_skill: {
      artifactPath: path.relative(repoRoot, nuwaOut),
      artifact: nuwaArtifact.content,
      generation: nuwaArtifact,
    },
    cognitive_generated_likeness: {
      artifactPath: path.relative(repoRoot, cognitiveOut),
      artifact: cognitiveArtifact.content,
      generation: cognitiveArtifact,
    },
  };
  buildRecords.push({
    role,
    evidencePaths,
    artifacts: {
      nuwa_generated_skill: path.relative(repoRoot, nuwaOut),
      cognitive_generated_likeness: path.relative(repoRoot, cognitiveOut),
    },
  });
  process.stdout.write(`${role} build ok\n`);
}

const outputBase = {
  generatedAt: new Date().toISOString(),
  model,
  baseUrl,
  tasksPath: path.relative(repoRoot, tasksPath),
  nuwaSkillPath: path.relative(repoRoot, nuwaSkillPath),
  cognitiveSkillPath: path.relative(repoRoot, cognitiveSkillPath),
  artifactDir: path.relative(repoRoot, artifactDir),
  dryRun,
  offset,
  requestedLimit: limit || null,
  roles,
  buildRecords,
};

if (buildOnly) {
  await writeJson({ ...outputBase, resultCount: 0, summary: null, records: [] });
  process.stdout.write(`wrote ${outPath}\n`);
  process.exit(0);
}

const records = [];
for (const task of tasks) {
  const roleArtifactsForTask = roleArtifacts[task.role];
  if (!roleArtifactsForTask) throw new Error(`Missing built artifacts for role: ${task.role}`);
  const nuwaMessages = buildAnswerMessages({
    systemId: 'nuwa_generated_skill',
    artifact: roleArtifactsForTask.nuwa_generated_skill.artifact,
    task,
  });
  const cognitiveMessages = buildAnswerMessages({
    systemId: 'cognitive_generated_likeness',
    artifact: roleArtifactsForTask.cognitive_generated_likeness.artifact,
    task,
  });

  if (dryRun) {
    records.push({
      taskId: task.id,
      taskMeta: taskScaleMeta(task),
      role: task.role ?? null,
      family: task.family,
      source: task.source ?? null,
      prompt: task.prompt,
      evidencePaths: roleArtifactsForTask.evidencePaths,
      artifactPaths: {
        nuwa_generated_skill: roleArtifactsForTask.nuwa_generated_skill.artifactPath,
        cognitive_generated_likeness: roleArtifactsForTask.cognitive_generated_likeness.artifactPath,
      },
      preparedMessages: {
        nuwa_generated_skill: nuwaMessages,
        cognitive_generated_likeness: cognitiveMessages,
      },
    });
    process.stdout.write(`${task.id} ${task.role} ${task.family} dry-run\n`);
    continue;
  }

  const [answerA, answerB] = await Promise.all([
    chat(nuwaMessages, answerMaxTokens, 0.2),
    chat(cognitiveMessages, answerMaxTokens, 0.2),
  ]);
  const swap = stableHash(task.id) % 2 === 1;
  const x = swap
    ? { system: 'cognitive_generated_likeness', answer: answerB }
    : { system: 'nuwa_generated_skill', answer: answerA };
  const y = swap
    ? { system: 'nuwa_generated_skill', answer: answerA }
    : { system: 'cognitive_generated_likeness', answer: answerB };
  const judge = await judgeTask({
    task,
    evidence: roleArtifactsForTask.evidence,
    answerX: x.answer.content,
    answerY: y.answer.content,
  });
  records.push({
    taskId: task.id,
    taskMeta: taskScaleMeta(task),
    role: task.role ?? null,
    family: task.family,
    source: task.source ?? null,
    prompt: task.prompt,
    evidencePaths: roleArtifactsForTask.evidencePaths,
    artifactPaths: {
      nuwa_generated_skill: roleArtifactsForTask.nuwa_generated_skill.artifactPath,
      cognitive_generated_likeness: roleArtifactsForTask.cognitive_generated_likeness.artifactPath,
    },
    anonymized: { x, y },
    judge,
  });
  await writeJson({ ...outputBase, resultCount: records.length, summary: summarize(records), records }, true);
  const winner = judge.parsed.winner === 'x' ? x.system : judge.parsed.winner === 'y' ? y.system : 'tie';
  process.stdout.write(`${task.id} ${task.role} ${task.family} winner=${winner}\n`);
}

await writeJson({
  ...outputBase,
  resultCount: records.length,
  summary: dryRun ? null : summarize(records),
  records,
});
process.stdout.write(`wrote ${outPath}\n`);
