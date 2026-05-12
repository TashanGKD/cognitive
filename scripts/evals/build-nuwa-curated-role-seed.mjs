#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const sourcePath = path.resolve(repoRoot, 'docs/evals/nuwa-all-role-complete-seed.json');
const outPath = path.resolve(repoRoot, 'docs/evals/nuwa-curated-role-100-seed.json');
const reportPath = path.resolve(repoRoot, 'docs/evals/nuwa-curated-role-100-report.md');

const generalTarget = 30;
const specificTarget = 70;

const preferredGeneralPrefixes = [
  'headline_generation',
  'short_plan',
  'email_subject',
  'analogy',
  'positive_rewrite',
  'yaml_conversion',
  'constrained_disclaimer',
  'arithmetic_validity',
  'stance_classification',
  'translation',
];

const preferredGeneralVariants = [
  'role_tint',
  'natural',
  'plain_language',
  'compact_reason',
  'high_signal',
  'answer_first',
  'concise',
  'direct',
  'no_bullets',
];

const preferredSpecificTemplates = [
  'diagnose_situation',
  'recommendation',
  'tradeoff',
  'failure_mode',
  'anti_pattern',
  'boundary',
  'objection',
  'short_reply',
  'teaching',
  'explain_principle',
];

const preferredSpecificAngles = ['core', 'decision', 'voice', 'evidence', 'social'];

function subtypeParts(task) {
  return String(task.subtype ?? '').split('_');
}

function generalRank(task) {
  const subtype = String(task.subtype ?? '');
  const prefixIndex = preferredGeneralPrefixes.findIndex((prefix) => subtype.startsWith(prefix));
  const variantIndex = preferredGeneralVariants.findIndex((variant) => subtype.endsWith(`_${variant}`));
  const diversityTie = stableHash(`${task.role}:${task.subtype}:${task.id}`) % 1000;
  return [
    prefixIndex < 0 ? preferredGeneralPrefixes.length : prefixIndex,
    variantIndex < 0 ? preferredGeneralVariants.length : variantIndex,
    diversityTie,
  ];
}

function specificRank(task) {
  const subtype = String(task.subtype ?? '');
  const templateIndex = preferredSpecificTemplates.findIndex((template) => subtype.includes(`_${template}_`));
  const angleIndex = preferredSpecificAngles.findIndex((angle) => subtype.endsWith(`_${angle}`));
  const diversityTie = stableHash(`${task.role}:${task.subtype}:${task.id}`) % 1000;
  return [
    templateIndex < 0 ? preferredSpecificTemplates.length : templateIndex,
    angleIndex < 0 ? preferredSpecificAngles.length : angleIndex,
    diversityTie,
  ];
}

function compareRank(a, b, ranker) {
  const ar = ranker(a);
  const br = ranker(b);
  for (let i = 0; i < Math.max(ar.length, br.length); i += 1) {
    if ((ar[i] ?? 0) !== (br[i] ?? 0)) return (ar[i] ?? 0) - (br[i] ?? 0);
  }
  return a.id.localeCompare(b.id);
}

function stableHash(text) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function selectWithThemeBalance(tasks, target, ranker) {
  const sorted = [...tasks].sort((a, b) => compareRank(a, b, ranker));
  const selected = [];
  const selectedIds = new Set();
  const buckets = new Map();
  for (const task of sorted) {
    const theme = themeKey(task);
    if (!buckets.has(theme)) buckets.set(theme, []);
    buckets.get(theme).push(task);
  }

  while (selected.length < target) {
    let added = false;
    for (const bucket of buckets.values()) {
      const task = bucket.find((candidate) => !selectedIds.has(candidate.id));
      if (!task) continue;
      selected.push(task);
      selectedIds.add(task.id);
      added = true;
      if (selected.length >= target) break;
    }
    if (!added) break;
  }

  return selected.sort((a, b) => a.id.localeCompare(b.id));
}

function themeKey(task) {
  const subtype = String(task.subtype ?? '');
  if (task.family === 'rolebench_general_instruction') {
    return preferredGeneralPrefixes.find((prefix) => subtype.startsWith(prefix)) ?? subtype.split('_').slice(0, -1).join('_');
  }
  const parts = subtypeParts(task);
  const templateIndex = parts.findIndex((_, index) => preferredSpecificTemplates.includes(parts.slice(index, index + 2).join('_')));
  if (templateIndex > 0) return parts.slice(0, templateIndex).join('_');
  return parts.slice(0, -2).join('_') || subtype;
}

function remapTaskId(task, index) {
  const prefix = task.id.replace(/\d+$/, '');
  return {
    ...task,
    originalId: task.id,
    id: `${prefix}${String(index + 1).padStart(3, '0')}`,
    curated: true,
  };
}

const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const curatedTasks = [];
const reportRows = [];

for (const role of Object.keys(source.roles).sort()) {
  const roleTasks = source.tasks.filter((task) => task.role === role);
  const general = roleTasks.filter((task) => task.family === 'rolebench_general_instruction');
  const specific = roleTasks.filter((task) => task.family === 'rolebench_role_specific');
  const selectedGeneral = selectWithThemeBalance(general, generalTarget, generalRank);
  const selectedSpecific = selectWithThemeBalance(specific, specificTarget, specificRank);
  const selected = [...selectedGeneral, ...selectedSpecific].map(remapTaskId);
  curatedTasks.push(...selected);

  reportRows.push(
    `| ${role} | ${selectedGeneral.length} | ${selectedSpecific.length} | ${selected.length} | ${[
      ...new Set(selectedSpecific.map(themeKey)),
    ].join(', ')} |`,
  );
}

const seed = {
  ...source,
  version: '2026-05-12',
  name: 'nuwa-curated-role-100-seed',
  scope: 'all Nuwa example roles, curated 100-task benchmark per role from the 6000-task RoleBench-scale mother pool',
  sourceSeed: path.relative(repoRoot, sourcePath).replaceAll(path.sep, '/'),
  curation: {
    tasksPerRole: generalTarget + specificTarget,
    rolebench_general_instruction: generalTarget,
    rolebench_role_specific: specificTarget,
    rationale:
      'Keep a lightweight but high-signal evaluation set: enough general instructions to catch task-following regressions, with most weight on role-specific cognition and expression.',
    selection:
      'General tasks prefer open-ended generation, rewriting, explanation, and natural/role-tinted variants. Role-specific tasks prefer diagnosis, recommendation, tradeoff, failure-mode, anti-pattern, boundary, and objection prompts, balanced across role themes.',
  },
  minimumTasksPerRole: generalTarget + specificTarget,
  minimumTasksPerFamilyPerRole: null,
  taskCount: curatedTasks.length,
  rolePool: Object.fromEntries(
    Object.entries(source.rolePool).map(([role, info]) => [
      role,
      {
        ...info,
        taskPlan: {
          rolebench_general_instruction: generalTarget,
          rolebench_role_specific: specificTarget,
          total: generalTarget + specificTarget,
        },
      },
    ]),
  ),
  tasks: curatedTasks,
};

const report = [
  '# Nuwa curated role-100 seed',
  '',
  'This file is generated by `scripts/evals/build-nuwa-curated-role-seed.mjs`.',
  '',
  'The 6000-task seed is the mother pool. This curated seed keeps 100 high-signal tasks per role:',
  '',
  '- 30 RoleBench CUS-style general-instruction tasks',
  '- 70 RoleBench SPE-style role-specific tasks',
  '',
  'The ratio keeps basic task-following checks while putting the main weight on role cognition, judgment, expression DNA, evidence boundaries, and anti-patterns.',
  '',
  '| Role | General | Role-specific | Total | Role-specific themes represented |',
  '|---|---:|---:|---:|---|',
  ...reportRows,
  '',
  `Total roles: ${Object.keys(source.roles).length}`,
  `Total tasks: ${curatedTasks.length}`,
  '',
];

await writeFile(outPath, `${JSON.stringify(seed, null, 2)}\n`, 'utf8');
await writeFile(reportPath, report.join('\n'), 'utf8');
console.log(path.relative(repoRoot, outPath));
console.log(path.relative(repoRoot, reportPath));
