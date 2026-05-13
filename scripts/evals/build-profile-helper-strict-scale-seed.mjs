#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

const sourcePath = path.resolve(repoRoot, 'docs/evals/profile-helper-cognitive-fingerprint-50-seed.json');
const bankPath = path.resolve(repoRoot, 'docs/evals/profile-helper-strict-scale-question-bank-56.json');
const outPath = path.resolve(repoRoot, 'docs/evals/profile-helper-strict-scale-56-seed.json');
const reportPath = path.resolve(repoRoot, 'docs/evals/profile-helper-strict-scale-56-report.md');

const likert7 = {
  type: 'likert',
  min: 1,
  max: 7,
  anchors: { 1: 'completely inconsistent', 4: 'mixed or uncertain', 7: 'completely consistent' },
};

const likert5 = {
  type: 'likert',
  min: 1,
  max: 5,
  anchors: { 1: 'very inaccurate', 3: 'neither accurate nor inaccurate', 5: 'very accurate' },
};

function q(family, sourceScale, sourceItemId, dimension, responseScale, statement, options = {}) {
  return {
    family,
    source: 'tashan-profile-helper-strict-scale',
    sourceScale,
    sourceItemId,
    dimension,
    responseScale,
    reverse: Boolean(options.reverse),
    statement,
  };
}

const questions = [
  q('profile_helper_rcss', 'RCSS', 'A1', 'integration', likert7, 'I habitually look for reusable ideas or methods in fields outside my home specialty.'),
  q('profile_helper_rcss', 'RCSS', 'A2', 'integration', likert7, 'When facing a research obstacle, I tend to step back and build a broader, more general model.'),
  q('profile_helper_rcss', 'RCSS', 'A3', 'integration', likert7, 'Cross-domain connection ability is rarer and more important than single-field depth in modern knowledge work.'),
  q('profile_helper_rcss', 'RCSS', 'A4', 'integration', likert7, 'I tend to assemble different algorithms, models, or theories into one complete system or solution.'),
  q('profile_helper_rcss', 'RCSS', 'B1', 'depth', likert7, 'I prefer to go deep in one vertical niche and become the person with the most precise command of the details.'),
  q('profile_helper_rcss', 'RCSS', 'B2', 'depth', likert7, 'I prefer extreme tuning, modeling, or verification around one concrete model, dataset, or phenomenon.'),
  q('profile_helper_rcss', 'RCSS', 'B3', 'depth', likert7, 'I prefer quiet solitary work on complex derivations, code details, or experiments over frequent high-level discussion.'),
  q('profile_helper_rcss', 'RCSS', 'B4', 'depth', likert7, 'Taking one technical detail to the highest craft standard is one of the highest virtues of serious work.'),

  q('profile_helper_ams_gsr', 'AMS-GSR 28', '1', 'external_regulation', likert7, 'Because without a stronger credential, I would have fewer high-paying opportunities later on.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '2', 'intrinsic_to_know', likert7, 'Because learning new things in my field gives me pleasure and satisfaction.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '3', 'identified_regulation', likert7, 'Because advanced study or research helps prepare me for the career I have chosen.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '4', 'intrinsic_stimulation', likert7, 'Because communicating my own ideas to others can create intense positive feelings.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '5', 'amotivation', likert7, 'Honestly, I sometimes cannot see the point and feel I am wasting my time.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '6', 'intrinsic_accomplishment', likert7, 'Because surpassing myself in serious work is pleasurable.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '7', 'introjected_regulation', likert7, 'To prove to myself that I am capable of completing the path I chose.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '8', 'external_regulation', likert7, 'In order to obtain a more prestigious position later on.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '9', 'intrinsic_to_know', likert7, 'For the pleasure I experience when I discover new phenomena or ideas I had not seen before.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '10', 'identified_regulation', likert7, 'Because it can eventually let me enter a field of work that I like.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '11', 'intrinsic_stimulation', likert7, 'For the pleasure I experience when reading interesting papers, books, or deep technical material.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '12', 'amotivation', likert7, 'I once had reasons for this path, but now I sometimes wonder whether I should continue.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '13', 'intrinsic_accomplishment', likert7, 'For the happiness I experience when I exceed myself in achievement.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '14', 'introjected_regulation', likert7, 'Because when I succeed, I feel important.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '15', 'external_regulation', likert7, 'Because I want to have a better life later on.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '16', 'intrinsic_to_know', likert7, 'For the pleasure of broadening my knowledge about topics that appeal to me.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '17', 'identified_regulation', likert7, 'Because it helps me make better choices about direction and career orientation.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '18', 'intrinsic_stimulation', likert7, 'For the pleasure I feel when completely absorbed by what strong thinkers have written or built.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '19', 'amotivation', likert7, 'I cannot see why I am doing this work and frankly could care very little about it.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '20', 'intrinsic_accomplishment', likert7, 'For the satisfaction I feel while accomplishing difficult work.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '21', 'introjected_regulation', likert7, 'To show myself that I am intelligent and capable.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '22', 'external_regulation', likert7, 'In order to have better career prospects and material security later on.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '23', 'intrinsic_to_know', likert7, 'Because this path lets me keep learning about many things that interest me.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '24', 'identified_regulation', likert7, 'Because additional years of serious work improve my competence as a researcher or professional.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '25', 'intrinsic_stimulation', likert7, 'For the high feeling I experience while exploring interesting subjects.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '26', 'amotivation', likert7, 'I do not know; I cannot understand what I am doing in this work.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '27', 'intrinsic_accomplishment', likert7, 'Because this path lets me experience personal satisfaction in the pursuit of excellence.'),
  q('profile_helper_ams_gsr', 'AMS-GSR 28', '28', 'introjected_regulation', likert7, 'Because I want to show myself that I can succeed in serious study or research.'),

  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '1', 'extraversion', likert5, 'I am the life of the party.'),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '2', 'agreeableness', likert5, "I sympathize with others' feelings."),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '3', 'conscientiousness', likert5, 'I get chores or routine obligations done right away.'),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '4', 'neuroticism', likert5, 'I have frequent mood swings.'),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '5', 'openness', likert5, 'I have a vivid imagination.'),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '6', 'extraversion', likert5, "I don't talk a lot.", { reverse: true }),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '7', 'agreeableness', likert5, "I am not interested in other people's problems.", { reverse: true }),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '8', 'conscientiousness', likert5, 'I often forget to put things back in their proper place.', { reverse: true }),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '9', 'neuroticism', likert5, 'I am relaxed most of the time.', { reverse: true }),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '10', 'openness', likert5, 'I am not interested in abstract ideas.', { reverse: true }),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '11', 'extraversion', likert5, 'I talk to a lot of different people at gatherings.'),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '12', 'agreeableness', likert5, "I feel other people's emotions."),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '13', 'conscientiousness', likert5, 'I like order.'),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '14', 'neuroticism', likert5, 'I get upset easily.'),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '15', 'openness', likert5, 'I have difficulty understanding abstract ideas.', { reverse: true }),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '16', 'extraversion', likert5, 'I keep in the background.', { reverse: true }),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '17', 'agreeableness', likert5, 'I am not really interested in others.', { reverse: true }),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '18', 'conscientiousness', likert5, 'I make a mess of things.', { reverse: true }),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '19', 'neuroticism', likert5, 'I seldom feel blue.', { reverse: true }),
  q('profile_helper_mini_ipip', 'Mini-IPIP 20', '20', 'openness', likert5, 'I do not have a good imagination.', { reverse: true }),
];

function stableRoleId(role) {
  return role
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase())
    .join('')
    .slice(0, 8);
}

function scaleText(responseScale) {
  return Object.entries(responseScale.anchors)
    .map(([score, label]) => `${score} = ${label}`)
    .join('; ');
}

function prompt(question, role) {
  return [
    `Answer as ${role}.`,
    '',
    `Statement: ${question.statement}`,
    '',
    `Rate how consistent this statement is with the mounted role on this scale: ${question.responseScale.min}-${question.responseScale.max} (${scaleText(question.responseScale)}).`,
    'Return valid JSON only: {"score": <number>, "reason": "<one short evidence-consistent sentence in the role voice>"}.',
    'Do not mention fingerprints, benchmark names, or evaluation criteria.',
  ].join('\n');
}

const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const genericQuestions = questions.map((question, index) => ({
  id: `PH-SCALE-${String(index + 1).padStart(3, '0')}`,
  ...question,
  promptTemplate: prompt(question, 'the mounted role'),
}));

const tasks = [];
for (const role of Object.keys(source.roles).sort()) {
  const fingerprint = source.rolePool[role]?.cognitiveFingerprint;
  if (!fingerprint) throw new Error(`Missing cognitive fingerprint for ${role}`);
  for (const [index, question] of genericQuestions.entries()) {
    tasks.push({
      id: `PHS-${stableRoleId(role)}-${String(index + 1).padStart(3, '0')}`,
      genericQuestionId: question.id,
      role,
      family: question.family,
      source: question.source,
      sourceScale: question.sourceScale,
      sourceItemId: question.sourceItemId,
      dimension: question.dimension,
      responseScale: question.responseScale,
      reverse: question.reverse,
      statement: question.statement,
      prompt: prompt(question, role),
      targetFingerprint: fingerprint,
      tests: ['strict_scale_response', 'cognitive_profile_alignment', 'role_likeness_reason'],
    });
  }
}

const scalePlan = {
  rcss: 8,
  ams_gsr: 28,
  mini_ipip: 20,
  total: 56,
};

const seed = {
  version: '2026-05-13',
  name: 'profile-helper-strict-scale-56-seed',
  scope:
    'Strict questionnaire layer: every role receives the same RCSS 8 + AMS-GSR 28 + Mini-IPIP 20 items. This measures cognitive profile consistency, not open-ended role performance.',
  sourceSeed: path.relative(repoRoot, sourcePath).replaceAll(path.sep, '/'),
  genericQuestionBank: path.relative(repoRoot, bankPath).replaceAll(path.sep, '/'),
  profileHelperSource: '../tashan-profile-helper',
  scalePlan,
  roleCount: Object.keys(source.roles).length,
  taskCount: tasks.length,
  rolePool: Object.fromEntries(
    Object.entries(source.rolePool).map(([role, info]) => [
      role,
      {
        ...info,
        taskPlan: scalePlan,
      },
    ]),
  ),
  roles: source.roles,
  tasks,
};

const bank = {
  version: '2026-05-13',
  name: 'profile-helper-strict-scale-question-bank-56',
  scope:
    'A universal strict scale bank copied from the original profile-helper scale structure: RCSS 8, AMS-GSR 28, Mini-IPIP 20. All mounted roles receive exactly the same items.',
  profileHelperSource: '../tashan-profile-helper',
  responseContract:
    'Each mounted role answers each item as JSON with a numeric score and one short role-consistent reason. Scores are used for scale-profile consistency; reasons are judged for role likeness.',
  sourceScales: {
    rcss: { originalItems: 8, includedItems: 8 },
    ams_gsr: { originalItems: 28, includedItems: 28 },
    mini_ipip: { originalItems: 20, includedItems: 20 },
  },
  questionCount: genericQuestions.length,
  questions: genericQuestions,
};

const rows = Object.keys(source.roles)
  .sort()
  .map((role) => `| ${role} | 8 | 28 | 20 | 56 |`);
const report = [
  '# Profile-helper strict scale 56 seed',
  '',
  'This file is generated by `scripts/evals/build-profile-helper-strict-scale-seed.mjs`.',
  '',
  'This is the strict questionnaire layer. It uses the same 56 scale items for every role: RCSS 8 + AMS-GSR 28 + Mini-IPIP 20.',
  '',
  'It should be reported separately from the 50-item role-likeness bank. The 56-item layer measures cognitive profile consistency; the 50-item layer additionally tests situational judgment and interaction expression.',
  '',
  `Generic bank: ${path.relative(repoRoot, bankPath).replaceAll(path.sep, '/')}`,
  '',
  '| Role | RCSS | AMS-GSR | Mini-IPIP | Total |',
  '|---|---:|---:|---:|---:|',
  ...rows,
  '',
  `Total roles: ${Object.keys(source.roles).length}`,
  `Total tasks: ${tasks.length}`,
  '',
];

await writeFile(bankPath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8');
await writeFile(outPath, `${JSON.stringify(seed, null, 2)}\n`, 'utf8');
await writeFile(reportPath, report.join('\n'), 'utf8');

console.log(path.relative(repoRoot, bankPath));
console.log(path.relative(repoRoot, outPath));
console.log(path.relative(repoRoot, reportPath));
