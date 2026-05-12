#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

function arg(name, fallback = null) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((item) => item.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

const runPath = path.resolve(repoRoot, arg('run', 'docs/evals/runs/profile-helper-questionnaire-run.json'));
const tasksPath = path.resolve(repoRoot, arg('tasks', 'docs/evals/profile-helper-cognitive-fingerprint-50-seed.json'));
const outPath = path.resolve(repoRoot, arg('out', 'docs/evals/runs/profile-helper-questionnaire-scale-summary.json'));
const reportPath = path.resolve(repoRoot, arg('report', outPath.replace(/\.json$/i, '.md')));

function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(candidate.slice(first, last + 1));
    } catch {
      // fall through to numeric extraction
    }
  }
  const scoreMatch = candidate.match(/(?:score|评分|分数)["'\s:：-]*([1-7](?:\.\d+)?)/i);
  return scoreMatch ? { score: Number(scoreMatch[1]), reason: candidate.trim().slice(0, 240) } : null;
}

function clampScore(score, scale) {
  if (!Number.isFinite(score)) return null;
  if (!scale) return score;
  return Math.min(Number(scale.max), Math.max(Number(scale.min), score));
}

function scoredValue(raw, meta) {
  const score = clampScore(Number(raw?.score), meta.responseScale);
  if (score == null) return null;
  if (!meta.reverse) return score;
  return Number(meta.responseScale.max) + Number(meta.responseScale.min) - score;
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : null;
}

function round(value) {
  return value == null ? null : Math.round(value * 100) / 100;
}

function ensureProfile(container, system, role, targetFingerprint) {
  container[system] ??= {};
  container[system][role] ??= {
    role,
    targetFingerprint,
    itemCount: 0,
    parsedCount: 0,
    items: [],
  };
  return container[system][role];
}

function summarizeProfile(profile) {
  const byFamily = {};
  const byDimension = {};
  for (const item of profile.items) {
    byFamily[item.family] ??= [];
    byDimension[item.dimension] ??= [];
    byFamily[item.family].push(item.scoredScore);
    byDimension[item.dimension].push(item.scoredScore);
  }

  const integration = profile.items
    .filter((item) => item.family === 'profile_helper_rcss' && item.dimension === 'integration')
    .map((item) => item.scoredScore);
  const depth = profile.items
    .filter((item) => item.family === 'profile_helper_rcss' && item.dimension === 'depth')
    .map((item) => item.scoredScore);

  const motivationAutonomous = [
    'intrinsic_to_know',
    'intrinsic_accomplishment',
    'intrinsic_stimulation',
    'identified_regulation',
    'autonomous_motivation',
    'autonomous_boundary',
  ];
  const motivationControlled = ['introjected_regulation', 'external_social', 'external_material', 'controlled_pressure'];

  const miniTraits = {};
  for (const trait of ['extraversion', 'agreeableness', 'conscientiousness', 'neuroticism', 'openness']) {
    miniTraits[trait] = round(average(profile.items.filter((item) => item.dimension === trait).map((item) => item.scoredScore)));
  }

  return {
    itemCount: profile.itemCount,
    parsedCount: profile.parsedCount,
    parseRate: round(profile.parsedCount / Math.max(1, profile.itemCount)),
    rcss: {
      integration: round(integration.reduce((sum, value) => sum + value, 0)),
      depth: round(depth.reduce((sum, value) => sum + value, 0)),
      csi: round(integration.reduce((sum, value) => sum + value, 0) - depth.reduce((sum, value) => sum + value, 0)),
    },
    motivation: {
      autonomous: round(
        average(profile.items.filter((item) => motivationAutonomous.includes(item.dimension)).map((item) => item.scoredScore)),
      ),
      controlled: round(
        average(profile.items.filter((item) => motivationControlled.includes(item.dimension)).map((item) => item.scoredScore)),
      ),
      amotivation: round(average(profile.items.filter((item) => item.dimension === 'amotivation').map((item) => item.scoredScore))),
    },
    miniIpip: miniTraits,
    familyAverages: Object.fromEntries(Object.entries(byFamily).map(([key, values]) => [key, round(average(values))])),
    dimensionAverages: Object.fromEntries(Object.entries(byDimension).map(([key, values]) => [key, round(average(values))])),
  };
}

const run = JSON.parse(await readFile(runPath, 'utf8'));
const tasksSpec = JSON.parse(await readFile(tasksPath, 'utf8'));
const taskMap = new Map(tasksSpec.tasks.map((task) => [task.id, task]));
const profiles = {};
const parseFailures = [];

for (const record of run.records ?? []) {
  if (!record.anonymized) continue;
  const task = taskMap.get(record.taskId);
  if (!task) continue;
  const targetFingerprint = tasksSpec.rolePool?.[record.role]?.cognitiveFingerprint ?? null;
  const seenSystemsInRecord = new Set();
  for (const side of ['x', 'y']) {
    const entry = record.anonymized[side];
    if (!entry) continue;
    const system = entry.system;
    if (seenSystemsInRecord.has(system)) continue;
    seenSystemsInRecord.add(system);
    const profile = ensureProfile(profiles, system, record.role, targetFingerprint);
    const parsed = extractJson(entry.answer?.content ?? entry.answer);
    const scored = scoredValue(parsed, task);
    profile.itemCount += 1;
    if (scored == null) {
      parseFailures.push({ taskId: record.taskId, role: record.role, system, answer: entry.answer?.content ?? entry.answer });
      continue;
    }
    profile.parsedCount += 1;
    profile.items.push({
      taskId: record.taskId,
      genericQuestionId: task.genericQuestionId,
      family: task.family,
      dimension: task.dimension,
      reverse: task.reverse,
      rawScore: Number(parsed.score),
      scoredScore: scored,
      reason: String(parsed.reason ?? '').slice(0, 500),
    });
  }
}

const summary = {};
for (const [system, byRole] of Object.entries(profiles)) {
  summary[system] = {};
  for (const [role, profile] of Object.entries(byRole)) {
    summary[system][role] = {
      role,
      targetFingerprint: profile.targetFingerprint,
      scaleSummary: summarizeProfile(profile),
    };
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  runPath: path.relative(repoRoot, runPath).replaceAll(path.sep, '/'),
  tasksPath: path.relative(repoRoot, tasksPath).replaceAll(path.sep, '/'),
  systems: Object.keys(summary),
  parseFailures,
  summary,
};

const report = [
  '# Profile-helper questionnaire scale summary',
  '',
  `Run: \`${output.runPath}\``,
  `Tasks: \`${output.tasksPath}\``,
  '',
  '| System | Role | Parsed | RCSS I | RCSS D | CSI | Autonomous | Controlled | Amotivation | Openness | Conscientiousness |',
  '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
];

for (const [system, byRole] of Object.entries(summary)) {
  for (const [role, profile] of Object.entries(byRole)) {
    const s = profile.scaleSummary;
    report.push(
      `| ${system} | ${role} | ${s.parsedCount}/${s.itemCount} | ${s.rcss.integration ?? ''} | ${s.rcss.depth ?? ''} | ${s.rcss.csi ?? ''} | ${s.motivation.autonomous ?? ''} | ${s.motivation.controlled ?? ''} | ${s.motivation.amotivation ?? ''} | ${s.miniIpip.openness ?? ''} | ${s.miniIpip.conscientiousness ?? ''} |`,
    );
  }
}

if (parseFailures.length) {
  report.push('', `Parse failures: ${parseFailures.length}`);
}

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
await writeFile(reportPath, `${report.join('\n')}\n`, 'utf8');
console.log(path.relative(repoRoot, outPath));
console.log(path.relative(repoRoot, reportPath));
