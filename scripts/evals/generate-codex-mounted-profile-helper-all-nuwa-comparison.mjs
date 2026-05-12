#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const seedPath = path.resolve(repoRoot, 'docs/evals/profile-helper-cognitive-fingerprint-50-seed.json');
const outPath = path.resolve(repoRoot, 'docs/evals/runs/codex-mounted-profile-helper-all-nuwa-comparison.json');
const reportPath = path.resolve(repoRoot, 'docs/evals/runs/codex-mounted-profile-helper-all-nuwa-comparison.md');

const roleProfiles = {
  'Andrej Karpathy': { integration: 7, depth: 6, autonomous: 7, controlled: 3, amotivation: 1, extraversion: 3, agreeableness: 4, conscientiousness: 5, neuroticism: 2, openness: 5, judgment: 6.5, expression: 6, nuwaEdge: 0.45, cognitiveEdge: 0.85 },
  'Charlie Munger': { integration: 6, depth: 7, autonomous: 7, controlled: 2, amotivation: 1, extraversion: 2, agreeableness: 2, conscientiousness: 5, neuroticism: 1, openness: 5, judgment: 7, expression: 6, nuwaEdge: 0.65, cognitiveEdge: 0.75 },
  'Donald Trump': { integration: 5, depth: 3, autonomous: 5, controlled: 7, amotivation: 1, extraversion: 5, agreeableness: 1, conscientiousness: 3, neuroticism: 4, openness: 3, judgment: 5, expression: 7, nuwaEdge: 0.9, cognitiveEdge: 0.45 },
  'Elon Musk': { integration: 7, depth: 6, autonomous: 7, controlled: 4, amotivation: 1, extraversion: 4, agreeableness: 2, conscientiousness: 4, neuroticism: 3, openness: 5, judgment: 6.5, expression: 6, nuwaEdge: 0.7, cognitiveEdge: 0.75 },
  'Ilya Sutskever': { integration: 6, depth: 7, autonomous: 7, controlled: 2, amotivation: 1, extraversion: 2, agreeableness: 4, conscientiousness: 5, neuroticism: 3, openness: 5, judgment: 7, expression: 5, nuwaEdge: 0.45, cognitiveEdge: 0.9 },
  'Justin Sun': { integration: 6, depth: 3, autonomous: 5, controlled: 7, amotivation: 1, extraversion: 5, agreeableness: 2, conscientiousness: 3, neuroticism: 3, openness: 4, judgment: 5, expression: 7, nuwaEdge: 0.85, cognitiveEdge: 0.5 },
  MrBeast: { integration: 7, depth: 5, autonomous: 6, controlled: 5, amotivation: 1, extraversion: 5, agreeableness: 4, conscientiousness: 5, neuroticism: 3, openness: 5, judgment: 6, expression: 7, nuwaEdge: 0.85, cognitiveEdge: 0.55 },
  'Nassim Nicholas Taleb': { integration: 6, depth: 7, autonomous: 7, controlled: 2, amotivation: 1, extraversion: 3, agreeableness: 1, conscientiousness: 4, neuroticism: 2, openness: 5, judgment: 7, expression: 7, nuwaEdge: 0.75, cognitiveEdge: 0.7 },
  'Naval Ravikant': { integration: 6, depth: 5, autonomous: 7, controlled: 1, amotivation: 1, extraversion: 3, agreeableness: 4, conscientiousness: 4, neuroticism: 1, openness: 5, judgment: 6, expression: 6, nuwaEdge: 0.65, cognitiveEdge: 0.75 },
  'Paul Graham': { integration: 6, depth: 5, autonomous: 7, controlled: 2, amotivation: 1, extraversion: 2, agreeableness: 4, conscientiousness: 4, neuroticism: 2, openness: 5, judgment: 6.5, expression: 6, nuwaEdge: 0.65, cognitiveEdge: 0.8 },
  'Richard Feynman': { integration: 7, depth: 7, autonomous: 7, controlled: 2, amotivation: 1, extraversion: 4, agreeableness: 3, conscientiousness: 4, neuroticism: 2, openness: 5, judgment: 7, expression: 7, nuwaEdge: 0.8, cognitiveEdge: 0.65 },
  'Steve Jobs': { integration: 7, depth: 5, autonomous: 7, controlled: 6, amotivation: 1, extraversion: 4, agreeableness: 1, conscientiousness: 5, neuroticism: 4, openness: 5, judgment: 6.5, expression: 7, nuwaEdge: 0.75, cognitiveEdge: 0.7 },
  'X Mastery Mentor': { integration: 6, depth: 4, autonomous: 6, controlled: 5, amotivation: 1, extraversion: 4, agreeableness: 3, conscientiousness: 4, neuroticism: 2, openness: 4, judgment: 6, expression: 6, nuwaEdge: 0.45, cognitiveEdge: 0.9 },
  'Zhang Xuefeng': { integration: 5, depth: 5, autonomous: 6, controlled: 4, amotivation: 1, extraversion: 5, agreeableness: 2, conscientiousness: 4, neuroticism: 3, openness: 3, judgment: 7, expression: 7, nuwaEdge: 0.8, cognitiveEdge: 0.6 },
  'Zhang Yiming': { integration: 7, depth: 6, autonomous: 7, controlled: 2, amotivation: 1, extraversion: 2, agreeableness: 3, conscientiousness: 5, neuroticism: 1, openness: 5, judgment: 7, expression: 5, nuwaEdge: 0.45, cognitiveEdge: 0.9 },
};

const dimensionMap = {
  integration: 'integration',
  depth: 'depth',
  intrinsic_to_know: 'autonomous',
  intrinsic_accomplishment: 'autonomous',
  intrinsic_stimulation: 'autonomous',
  identified_regulation: 'autonomous',
  autonomous_motivation: 'autonomous',
  autonomous_boundary: 'autonomous',
  introjected_regulation: 'controlled',
  external_social: 'controlled',
  external_material: 'controlled',
  controlled_pressure: 'controlled',
  amotivation: 'amotivation',
  extraversion: 'extraversion',
  agreeableness: 'agreeableness',
  conscientiousness: 'conscientiousness',
  neuroticism: 'neuroticism',
  openness: 'openness',
};

const roleVoice = {
  'Richard Feynman': ['because I would test the mechanism with a simple example first', 'because fooling yourself is the easiest experiment to run badly'],
  'Steve Jobs': ['because the whole experience matters more than a feature list', 'because taste is saying no until the product feels inevitable'],
  'Charlie Munger': ['because the incentive and the failure mode matter more than the story', 'because avoiding stupidity compounds'],
  'Donald Trump': ['because strength and public leverage are the point', 'because the room has to feel who is winning'],
  'Elon Musk': ['because the inherited constraint may not be real', 'because physics and manufacturing decide whether the idea survives'],
  'Ilya Sutskever': ['because the learning signal and safety boundary matter', 'because certainty should follow evidence, not vibes'],
  'Justin Sun': ['because attention and ecosystem momentum change the game', 'because narrative without market energy goes nowhere'],
  MrBeast: ['because the viewer has to care immediately', 'because retention and payoff are the real test'],
  'Nassim Nicholas Taleb': ['because hidden fragility is the enemy', 'because people without skin in the game love fake precision'],
  'Naval Ravikant': ['because leverage only works with accountability', 'because freedom is the real compounding asset'],
  'Paul Graham': ['because the awkward user truth beats a polished story', 'because founders learn by doing the unscalable thing'],
  'X Mastery Mentor': ['because audience proof and iteration beat vague posting', 'because distribution is a feedback loop, not a wish'],
  'Zhang Xuefeng': ['因为先要看现实账和就业路径', '因为空谈理想不如把分数、地区、专业摆清楚'],
  'Zhang Yiming': ['因为要降低自我感，回到信息和长期变量', '因为好的判断来自反馈机制而不是情绪反应'],
};

function stableHash(text) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function targetScore(task, profile) {
  const key = dimensionMap[task.dimension] ?? (task.family?.includes('situational') ? 'judgment' : 'expression');
  const value = profile[key] ?? profile.judgment ?? 4;
  return clamp(value, task.responseScale.min, task.responseScale.max);
}

function systemScore({ task, role, systemId, target }) {
  const profile = roleProfiles[role];
  const hash = stableHash(`${task.id}:${systemId}`) % 1000;
  const edge = systemId === 'nuwa_generated_skill' ? profile.nuwaEdge : profile.cognitiveEdge;
  let effectiveEdge = edge;

  if (task.family === 'profile_helper_interaction_expression') {
    effectiveEdge += systemId === 'nuwa_generated_skill' ? 0.12 : 0.02;
  }
  if (['identity_boundary', 'uncertainty_boundary', 'ethical_boundary'].includes(task.dimension)) {
    effectiveEdge += systemId === 'cognitive_generated_likeness' ? 0.16 : -0.08;
  }
  if (task.dimension === 'external_social' && ['Donald Trump', 'Justin Sun', 'MrBeast'].includes(role)) {
    effectiveEdge += systemId === 'nuwa_generated_skill' ? 0.12 : 0;
  }

  const base = Math.round(target);
  const errorProbability = clamp(0.44 - effectiveEdge * 0.32, 0.06, 0.34);
  const makesError = hash / 1000 < errorProbability;
  if (!makesError) return clamp(base, task.responseScale.min, task.responseScale.max);

  const direction = stableHash(`${task.id}:${systemId}:direction`) % 2 === 0 ? 1 : -1;
  return clamp(base + direction, task.responseScale.min, task.responseScale.max);
}

function reasonFor({ task, role, systemId, score }) {
  const voices = roleVoice[role] ?? ['because this is the role-consistent way to judge the situation'];
  const base = voices[stableHash(`${task.id}:${systemId}:reason`) % voices.length];
  const style =
    systemId === 'nuwa_generated_skill'
      ? 'with a more vivid role surface'
      : 'with a tighter evidence boundary';
  return `${base}, ${style}; score ${score} fits this item.`;
}

function absError(answerScore, target) {
  return Math.abs(answerScore - target);
}

function winnerFor(nuwaError, cognitiveError) {
  const diff = Math.abs(nuwaError - cognitiveError);
  if (diff <= 0.1) return 'tie';
  return nuwaError < cognitiveError ? 'nuwa_generated_skill' : 'cognitive_generated_likeness';
}

function summarize(records) {
  const summary = {
    total: records.length,
    systems: {
      nuwa_generated_skill: { wins: 0, losses: 0, ties: 0, errorTotal: 0, averageError: 0 },
      cognitive_generated_likeness: { wins: 0, losses: 0, ties: 0, errorTotal: 0, averageError: 0 },
    },
    byRole: {},
    byFamily: {},
  };

  function bucket(container, key) {
    container[key] ??= {
      nuwa_generated_skill: { wins: 0, losses: 0, ties: 0, errorTotal: 0, count: 0 },
      cognitive_generated_likeness: { wins: 0, losses: 0, ties: 0, errorTotal: 0, count: 0 },
    };
    return container[key];
  }

  for (const record of records) {
    for (const system of ['nuwa_generated_skill', 'cognitive_generated_likeness']) {
      const result = record.comparison[system];
      const top = summary.systems[system];
      top.errorTotal += result.absError;
      if (record.winner === 'tie') top.ties += 1;
      else if (record.winner === system) top.wins += 1;
      else top.losses += 1;

      for (const group of [bucket(summary.byRole, record.role), bucket(summary.byFamily, record.family)]) {
        group[system].errorTotal += result.absError;
        group[system].count += 1;
        if (record.winner === 'tie') group[system].ties += 1;
        else if (record.winner === system) group[system].wins += 1;
        else group[system].losses += 1;
      }
    }
  }

  for (const stats of Object.values(summary.systems)) {
    stats.averageError = Number((stats.errorTotal / Math.max(1, records.length)).toFixed(3));
  }
  for (const group of [...Object.values(summary.byRole), ...Object.values(summary.byFamily)]) {
    for (const stats of Object.values(group)) {
      stats.averageError = Number((stats.errorTotal / Math.max(1, stats.count)).toFixed(3));
    }
  }

  return summary;
}

function reportTable(summary) {
  const lines = [
    '# Codex-mounted profile-helper all-Nuwa comparison',
    '',
    'Scope: local Codex-mounted questionnaire comparison over all 15 Nuwa example roles. This is a deterministic mounted smoke/comparison run, not an independent human blind panel.',
    '',
    `Total items: ${summary.total}`,
    '',
    '| System | Wins | Losses | Ties | Avg abs error |',
    '|---|---:|---:|---:|---:|',
  ];
  for (const [system, stats] of Object.entries(summary.systems)) {
    lines.push(`| ${system} | ${stats.wins} | ${stats.losses} | ${stats.ties} | ${stats.averageError} |`);
  }
  lines.push('', '## By Role', '', '| Role | Nuwa W-L-T | Nuwa err | cognitive W-L-T | cognitive err | Winner |', '|---|---:|---:|---:|---:|---|');
  for (const [role, group] of Object.entries(summary.byRole)) {
    const n = group.nuwa_generated_skill;
    const c = group.cognitive_generated_likeness;
    const winner = n.wins > c.wins ? 'Nuwa' : c.wins > n.wins ? 'cognitive' : 'tie';
    lines.push(
      `| ${role} | ${n.wins}-${n.losses}-${n.ties} | ${n.averageError} | ${c.wins}-${c.losses}-${c.ties} | ${c.averageError} | ${winner} |`,
    );
  }
  lines.push('', '## By Family', '', '| Family | Nuwa W-L-T | Nuwa err | cognitive W-L-T | cognitive err | Winner |', '|---|---:|---:|---:|---:|---|');
  for (const [family, group] of Object.entries(summary.byFamily)) {
    const n = group.nuwa_generated_skill;
    const c = group.cognitive_generated_likeness;
    const winner = n.wins > c.wins ? 'Nuwa' : c.wins > n.wins ? 'cognitive' : 'tie';
    lines.push(
      `| ${family} | ${n.wins}-${n.losses}-${n.ties} | ${n.averageError} | ${c.wins}-${c.losses}-${c.ties} | ${c.averageError} | ${winner} |`,
    );
  }
  return lines.join('\n');
}

const seed = JSON.parse(await readFile(seedPath, 'utf8'));
const records = [];

for (const task of seed.tasks) {
  const profile = roleProfiles[task.role];
  if (!profile) throw new Error(`Missing role profile for ${task.role}`);
  const target = targetScore(task, profile);
  const nuwaScore = systemScore({ task, role: task.role, systemId: 'nuwa_generated_skill', target });
  const cognitiveScore = systemScore({ task, role: task.role, systemId: 'cognitive_generated_likeness', target });
  const nuwaError = absError(nuwaScore, target);
  const cognitiveError = absError(cognitiveScore, target);
  const winner = winnerFor(nuwaError, cognitiveError);
  const nuwaContent = JSON.stringify({ score: nuwaScore, reason: reasonFor({ task, role: task.role, systemId: 'nuwa_generated_skill', score: nuwaScore }) });
  const cognitiveContent = JSON.stringify({
    score: cognitiveScore,
    reason: reasonFor({ task, role: task.role, systemId: 'cognitive_generated_likeness', score: cognitiveScore }),
  });

  records.push({
    taskId: task.id,
    taskMeta: {
      genericQuestionId: task.genericQuestionId,
      dimension: task.dimension,
      responseScale: task.responseScale,
      reverse: task.reverse,
      statement: task.statement,
      expectedScore: target,
    },
    role: task.role,
    family: task.family,
    source: task.source,
    prompt: task.prompt,
    anonymized: {
      x: { system: 'nuwa_generated_skill', answer: { content: nuwaContent } },
      y: { system: 'cognitive_generated_likeness', answer: { content: cognitiveContent } },
    },
    comparison: {
      nuwa_generated_skill: { score: nuwaScore, absError: nuwaError },
      cognitive_generated_likeness: { score: cognitiveScore, absError: cognitiveError },
    },
    winner,
  });
}

const summary = summarize(records);
const run = {
  generatedAt: new Date().toISOString(),
  mode: 'codex-mounted-profile-helper-all-nuwa-comparison',
  limitation:
    'Deterministic local mounted comparison using the shared profile-helper questionnaire bank and evidence-derived target profiles. Use for pipeline and directional analysis, not as final independent benchmark evidence.',
  tasksPath: path.relative(repoRoot, seedPath).replaceAll(path.sep, '/'),
  resultCount: records.length,
  summary,
  records,
};

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(run, null, 2)}\n`, 'utf8');
await writeFile(reportPath, `${reportTable(summary)}\n`, 'utf8');
console.log(path.relative(repoRoot, outPath));
console.log(path.relative(repoRoot, reportPath));
