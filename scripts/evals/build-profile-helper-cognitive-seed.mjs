#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const sourcePath = path.resolve(repoRoot, 'docs/evals/nuwa-all-role-complete-seed.json');
const bankPath = path.resolve(repoRoot, 'docs/evals/profile-helper-generic-cognitive-question-bank-50.json');
const outPath = path.resolve(repoRoot, 'docs/evals/profile-helper-cognitive-fingerprint-50-seed.json');
const reportPath = path.resolve(repoRoot, 'docs/evals/profile-helper-cognitive-fingerprint-50-report.md');

const scalePlan = {
  rcss: 8,
  motivation: 12,
  mini_ipip: 10,
  situational_judgment: 10,
  interaction_expression: 10,
};

const aggregatePlan = {
  rcss: {
    integration: 'sum of the 4 integration items, range 4-28',
    depth: 'sum of the 4 depth items, range 4-28',
    csi: 'integration - depth, range -24 to +24',
  },
  motivation: {
    autonomous:
      'average intrinsic_to_know, intrinsic_accomplishment, intrinsic_stimulation, identified_regulation, autonomous_motivation, autonomous_boundary',
    controlled:
      'average introjected_regulation, external_social, external_material, controlled_pressure',
    amotivation: 'average amotivation',
  },
  mini_ipip: {
    traits: 'average by Big Five dimension after reverse scoring reverse=true items',
  },
  situational_judgment: {
    profile: 'average by situational judgment dimension; judged against role evidence rather than a universal high/low target',
  },
  interaction_expression: {
    profile: 'average by interaction-expression dimension; judged against role evidence and answer rationale',
  },
};

const fingerprints = {
  'Andrej Karpathy': {
    rcss: 'high integration with strong engineering depth; explains systems through simple runnable mechanisms',
    motivation: 'intrinsic curiosity, builder accomplishment, and teaching clarity',
    personality: 'high openness, high conscientiousness, moderate extraversion, low performative drama',
    boundary: 'do not turn every answer into hype; preserve code/data/evaluation taste',
  },
  'Charlie Munger': {
    rcss: 'deep judgment with cross-disciplinary latticework; inversion over novelty',
    motivation: 'identified values, long-term compounding, avoidance of stupidity',
    personality: 'high conscientiousness, low sentimentality, blunt agreeableness, high prudence',
    boundary: 'avoid motivational gloss; prefer incentives, tradeoffs, and failure avoidance',
  },
  'Donald Trump': {
    rcss: 'media-first framing and dominance-oriented simplification',
    motivation: 'status, winning, loyalty, public leverage, and attention control',
    personality: 'high extraversion, high assertiveness, low hedging, highly performative expression',
    boundary: 'project historical persona without unsupported current factual claims',
  },
  'Elon Musk': {
    rcss: 'first-principles integration across physics, manufacturing, software, and markets',
    motivation: 'mission pressure, technical accomplishment, speed, and scale',
    personality: 'high openness, high risk tolerance, directness, impatience with slow process',
    boundary: 'do not mistake slogans for engineering constraints',
  },
  'Ilya Sutskever': {
    rcss: 'deep research intuition with careful integration around scale, learning, and safety',
    motivation: 'truth-seeking, AGI seriousness, technical conviction, and safety responsibility',
    personality: 'reserved, precise, high openness, low promotional noise',
    boundary: 'maintain uncertainty where evidence does not justify certainty',
  },
  'Justin Sun': {
    rcss: 'market narrative integration, ecosystem growth, and attention arbitrage',
    motivation: 'visibility, opportunity speed, network growth, and strategic positioning',
    personality: 'high extraversion, opportunistic energy, promotional confidence',
    boundary: 'avoid guaranteed financial claims or unsupported investment promises',
  },
  MrBeast: {
    rcss: 'audience-retention systems thinking and production-scale iteration',
    motivation: 'viewer payoff, spectacle, generosity, testing, and scale',
    personality: 'high energy, practical creativity, team execution, direct audience empathy',
    boundary: 'do not replace audience psychology with generic creator advice',
  },
  'Nassim Nicholas Taleb': {
    rcss: 'deep risk reasoning plus cross-domain heuristics for fragile systems',
    motivation: 'truth under uncertainty, anti-fragility, accountability, and skin in the game',
    personality: 'combative, aphoristic, high intellectual independence, low tolerance for pseudo-certainty',
    boundary: 'do not provide fake precision for tail-risk questions',
  },
  'Naval Ravikant': {
    rcss: 'compressed systems thinking about leverage, incentives, self, and long-term games',
    motivation: 'freedom, specific knowledge, compounding, peace, and accountability',
    personality: 'calm, aphoristic, high openness, low drama, introspective directness',
    boundary: 'avoid turning advice into hustle culture',
  },
  'Paul Graham': {
    rcss: 'essay-like reasoning from concrete startup observations to general principles',
    motivation: 'earnestness, user truth, founder learning, and clarity of thought',
    personality: 'reflective, plainspoken, high openness, gentle contrarianism',
    boundary: 'do not over-polish founder advice into corporate strategy language',
  },
  'Richard Feynman': {
    rcss: 'both high integration and high depth; mechanism-first curiosity and explanation tests',
    motivation: 'curiosity, playful investigation, scientific honesty, and teaching understanding',
    personality: 'high openness, expressive directness, irreverence, low tolerance for fake understanding',
    boundary: 'state uncertainty plainly and avoid mystical genius theater',
  },
  'Steve Jobs': {
    rcss: 'product integration, taste, end-to-end control, and ruthless focus',
    motivation: 'craft, excellence, user experience, and meaningful product story',
    personality: 'high standards, intense directness, high openness, low tolerance for mediocrity',
    boundary: 'do not confuse simplicity with shallow minimalism',
  },
  'X Mastery Mentor': {
    rcss: 'distribution-loop thinking, niche positioning, and content-market feedback',
    motivation: 'authority, consistency, audience proof, and practical monetization',
    personality: 'direct coaching, high iteration, outcome orientation, low patience for vague posting',
    boundary: 'avoid spam, manipulation, and empty growth hacks',
  },
  'Zhang Xuefeng': {
    rcss: 'practical education decision-making around ROI, score, region, family, and job market',
    motivation: 'class mobility, employment realism, practical responsibility',
    personality: 'direct, high-pressure, plainspoken, anti-romantic, concrete',
    boundary: 'do not give personalized school decisions without score and context',
  },
  'Zhang Yiming': {
    rcss: 'long-term systems thinking around information flow, product feedback, and organization',
    motivation: 'delayed gratification, rational learning, product compounding, organizational clarity',
    personality: 'reserved, disciplined, low ego, high openness, clear judgment',
    boundary: 'avoid emotional slogans; prefer information quality and long-term compounding',
  },
};

const likert7 = {
  type: 'likert',
  min: 1,
  max: 7,
  anchors: {
    1: 'completely inconsistent',
    4: 'mixed or uncertain',
    7: 'completely consistent',
  },
};

const likert5 = {
  type: 'likert',
  min: 1,
  max: 5,
  anchors: {
    1: 'very inaccurate',
    3: 'neither accurate nor inaccurate',
    5: 'very accurate',
  },
};

const rcssTasks = [
  item('integration_cross_domain', 'integration', likert7, 'I look outside my home domain for methods or metaphors when a hard problem gets stuck.'),
  item('integration_framework', 'integration', likert7, 'I prefer stepping back to build a broader model instead of only patching local symptoms.'),
  item('integration_system', 'integration', likert7, 'I tend to assemble separate tools, theories, or teams into one working system.'),
  item('integration_transfer', 'integration', likert7, 'I trust ideas more when I can transfer them across distant domains without losing the mechanism.'),
  item('depth_specialist', 'depth', likert7, 'I would rather master the hard details of a narrow problem than move quickly across many topics.'),
  item('depth_precision', 'depth', likert7, 'Before believing a result, I need the controls, assumptions, and edge cases to be precise.'),
  item('depth_solitude', 'depth', likert7, 'Some important problems require protected solitary depth more than more meetings or opinions.'),
  item('depth_craft', 'depth', likert7, 'Craft and exactness matter even when a rough version appears to work.'),
];

const motivationTasks = [
  item('to_know', 'intrinsic_to_know', likert7, 'I would keep studying some problems simply because understanding them is satisfying.'),
  item('to_accomplish', 'intrinsic_accomplishment', likert7, 'I care about the feeling of genuinely solving something difficult, not only appearing successful.'),
  item('stimulation', 'intrinsic_stimulation', likert7, 'The work itself can become exciting enough that the process feels rewarding.'),
  item('identified', 'identified_regulation', likert7, 'I work hardest when the project fits values I personally endorse.'),
  item('introjected', 'introjected_regulation', likert7, 'The need to prove myself can push me to work harder.'),
  item('external_social', 'external_social', likert7, 'Public praise, status, or respect can meaningfully influence my choices.'),
  item('external_material', 'external_material', likert7, 'Money, security, or material reward should significantly shape serious decisions.'),
  item('amotivation', 'amotivation', likert7, 'If the work loses meaning, I would feel little reason to keep investing effort.'),
  item('autonomy', 'autonomous_motivation', likert7, 'I do my best work when the effort feels self-directed rather than controlled by others.'),
  item('pressure', 'controlled_pressure', likert7, 'External pressure can distort judgment if it is not actively resisted.'),
  item('career_tradeoff', 'identified_regulation', likert7, 'I would choose a harder path if it better matched the work I think is meaningful.'),
  item('meaning_boundary', 'autonomous_boundary', likert7, 'I would reject a rewarding project if it violated the way I believe work should be done.'),
];

const miniIpipTasks = [
  item('extraversion_social_energy', 'extraversion', likert5, 'I am energized by speaking up in a room full of smart people.'),
  item('extraversion_background', 'extraversion', likert5, 'I prefer staying in the background and letting the work speak for itself.', { reverse: true }),
  item('agreeableness_empathy', 'agreeableness', likert5, 'When someone is wrong but insecure, I still try to preserve their dignity.'),
  item('agreeableness_conflict', 'agreeableness', likert5, 'Blunt disagreement is often better than polite ambiguity.', { reverse: true }),
  item('conscientiousness_order', 'conscientiousness', likert5, 'Useful order, checklists, or discipline are necessary for serious work.'),
  item('conscientiousness_mess', 'conscientiousness', likert5, 'I tolerate messy projects if the core idea is exciting.', { reverse: true }),
  item('neuroticism_pressure', 'neuroticism', likert5, 'Pressure easily affects the quality of my decisions.'),
  item('neuroticism_reactivity', 'neuroticism', likert5, 'Bad news tends to trigger an immediate emotional reaction.'),
  item('openness_abstract', 'openness', likert5, 'Abstract ideas are valuable when they reveal a real mechanism.'),
  item('openness_imagination', 'openness', likert5, 'I can turn a boring problem into an interesting one by reframing it.'),
];

const sjtTasks = [
  item('resource_allocation', 'resource_judgment', likert7, 'With one month, limited money, and a controversial goal, I would aggressively prioritize one or two decisive constraints.'),
  item('evidence_conflict', 'evidence_judgment', likert7, 'If evidence contradicts the preferred story, I would say so clearly in the meeting.'),
  item('ethical_boundary', 'ethical_boundary', likert7, 'I would refuse a shortcut that creates attention by misleading users.'),
  item('talent_choice', 'talent_judgment', likert7, 'I would choose a brilliant difficult collaborator over a reliable average one when the problem is unusually hard.'),
  item('public_failure', 'failure_response', likert7, 'After public failure, I would first inspect the mechanism instead of protecting the narrative.'),
  item('long_short_tradeoff', 'long_term_judgment', likert7, 'I would sacrifice a short-term win if it damages the long-term system.'),
  item('unknowns', 'uncertainty_boundary', likert7, 'When evidence is weak, I would rather admit uncertainty than sound confident.'),
  item('quality_bar', 'quality_bar', likert7, 'I would push back hard against shipping something mediocre.'),
  item('user_need', 'user_judgment', likert7, 'When users ask for the wrong thing, I would redirect toward what they actually need.'),
  item('status_pressure', 'status_independence', likert7, 'If a high-status person is wrong, I would still challenge the claim.'),
];

const interactionTasks = [
  item('teach', 'teaching_style', likert7, 'I can teach a confused beginner without sounding like a generic tutor.'),
  item('refuse', 'boundary_expression', likert7, 'I can refuse an unsafe or unsupported request while preserving my characteristic voice.'),
  item('challenge', 'self_deception_challenge', likert7, 'I would directly challenge someone who is fooling themselves.'),
  item('comfort_without_fluff', 'support_style', likert7, 'I can respond to discouragement without generic reassurance or empty comfort.'),
  item('compress', 'compression_style', likert7, 'My best advice can often be compressed into a few high-signal lines.'),
  item('debate', 'debate_style', likert7, 'In debate, I can make one strong point while also conceding what is true.'),
  item('ask_clarifying', 'diagnostic_question', likert7, 'Before giving advice, I often need one clarifying question that changes the answer.'),
  item('boundary_identity', 'identity_boundary', likert7, 'I should avoid inventing private facts even when answering in character.'),
  item('voice_shift', 'voice_specificity', likert7, 'A bland assistant answer should be rewritten through my own judgment and language.'),
  item('diagnose_genericness', 'genericness_detection', likert7, 'I can identify why a response is generic and make it more specific.'),
];

const families = [
  ['profile_helper_rcss', rcssTasks, 'RCSS cognitive style'],
  ['profile_helper_motivation', motivationTasks, 'AMS/MWMS motivation structure'],
  ['profile_helper_mini_ipip', miniIpipTasks, 'Mini-IPIP personality substrate'],
  ['profile_helper_situational_judgment', sjtTasks, 'situational judgment'],
  ['profile_helper_interaction_expression', interactionTasks, 'social cognition and expression'],
];

function item(subtype, dimension, responseScale, statement, options = {}) {
  return {
    subtype,
    dimension,
    responseScale,
    statement,
    reverse: Boolean(options.reverse),
  };
}

function stableRoleId(role) {
  return role
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase())
    .join('')
    .slice(0, 8);
}

function scaleText(responseScale) {
  const anchors = Object.entries(responseScale.anchors)
    .map(([score, label]) => `${score} = ${label}`)
    .join('; ');
  return `${responseScale.min}-${responseScale.max} (${anchors})`;
}

function render(question, role) {
  return [
    `Answer as ${role}.`,
    '',
    `Statement: ${question.statement}`,
    '',
    `Rate how consistent this statement is with the mounted role on this scale: ${scaleText(question.responseScale)}.`,
    'Return valid JSON only: {"score": <number>, "reason": "<one short evidence-consistent sentence in the role voice>"}.',
    'Do not mention fingerprints, benchmark names, or evaluation criteria.',
  ].join('\n');
}

function genericPrompt(question) {
  return [
    'Answer as the mounted role.',
    '',
    `Statement: ${question.statement}`,
    '',
    `Rate how consistent this statement is with the mounted role on this scale: ${scaleText(question.responseScale)}.`,
    'Return valid JSON only: {"score": <number>, "reason": "<one short evidence-consistent sentence in the role voice>"}.',
    'Do not mention fingerprints, benchmark names, or evaluation criteria.',
  ].join('\n');
}

const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const tasks = [];
const reportRows = [];
const genericQuestions = [];

let genericIndex = 1;
for (const [family, templates, sourceScale] of families) {
  for (const question of templates) {
    genericQuestions.push({
      id: `PH-GEN-${String(genericIndex).padStart(3, '0')}`,
      family,
      source: 'tashan-profile-helper-shaped',
      sourceScale,
      subtype: question.subtype,
      dimension: question.dimension,
      responseScale: question.responseScale,
      reverse: question.reverse,
      statement: question.statement,
      promptTemplate: genericPrompt(question),
      tests: [
        'task_fulfillment',
        'cognitive_style_alignment',
        'motivation_alignment',
        'personality_substrate_alignment',
        'non_genericness',
      ],
    });
    genericIndex += 1;
  }
}

for (const role of Object.keys(source.roles).sort()) {
  const fingerprint = fingerprints[role];
  if (!fingerprint) throw new Error(`Missing fingerprint for ${role}`);

  let roleIndex = 1;
  for (const [family, templates, sourceScale] of families) {
    for (const question of templates) {
      const genericQuestion = genericQuestions[roleIndex - 1];
      tasks.push({
        id: `PH-${stableRoleId(role)}-${String(roleIndex).padStart(3, '0')}`,
        genericQuestionId: genericQuestion.id,
        role,
        family,
        source: 'tashan-profile-helper-shaped',
        sourceScale,
        subtype: question.subtype,
        dimension: question.dimension,
        responseScale: question.responseScale,
        reverse: question.reverse,
        statement: question.statement,
        prompt: render(question, role),
        targetFingerprint: fingerprint,
        tests: [
          'task_fulfillment',
          'cognitive_style_alignment',
          'motivation_alignment',
          'personality_substrate_alignment',
          'non_genericness',
        ],
      });
      roleIndex += 1;
    }
  }

  reportRows.push(
    `| ${role} | ${scalePlan.rcss} | ${scalePlan.motivation} | ${scalePlan.mini_ipip} | ${scalePlan.situational_judgment} | ${scalePlan.interaction_expression} | ${roleIndex - 1} |`,
  );
}

const seed = {
  version: '2026-05-13',
  name: 'profile-helper-cognitive-fingerprint-50-seed',
  scope:
    '15 Nuwa example roles, all mounted on the same 50-question generic profile-helper-shaped cognitive fingerprint bank, supplementing the RoleBench-shaped role task seed.',
  sourceSeed: path.relative(repoRoot, sourcePath).replaceAll(path.sep, '/'),
  genericQuestionBank: path.relative(repoRoot, bankPath).replaceAll(path.sep, '/'),
  profileHelperSource: '../tashan-profile-helper',
  scalePlan,
  aggregatePlan,
  roleCount: Object.keys(source.roles).length,
  taskCount: tasks.length,
  rolePool: Object.fromEntries(
    Object.entries(source.rolePool).map(([role, info]) => [
      role,
      {
        ...info,
        cognitiveFingerprint: fingerprints[role],
        taskPlan: {
          ...scalePlan,
          total: Object.values(scalePlan).reduce((sum, count) => sum + count, 0),
        },
      },
    ]),
  ),
  roles: source.roles,
  tasks,
};

const bank = {
  version: '2026-05-13',
  name: 'profile-helper-generic-cognitive-question-bank-50',
  scope:
    'A universal 50-question cognitive fingerprint task bank adapted from tashan-profile-helper scale dimensions. These are not a standalone psychometric scale; they are generic prompts to be mounted under each target role.',
  profileHelperSource: '../tashan-profile-helper',
  responseContract:
    'Each question must be answered as JSON with numeric score and one short role-consistent reason. The score creates the scale profile; the reason lets the judge check role likeness.',
  sourceScales: {
    rcss: {
      originalItems: 8,
      adaptedQuestions: scalePlan.rcss,
      note: 'Uses the full RCSS structure: horizontal integration versus vertical depth.',
    },
    ams_gsr: {
      originalItems: 28,
      adaptedQuestions: 8,
      note: 'Samples motivation dimensions from AMS-GSR for role-likeness judgment.',
    },
    mwms: {
      originalItems: 19,
      adaptedQuestions: 4,
      note: 'Adds work-motivation framing for non-research or public roles.',
    },
    mini_ipip: {
      originalItems: 20,
      adaptedQuestions: scalePlan.mini_ipip,
      note: 'Samples Big Five personality substrate through interaction prompts.',
    },
    situational_judgment: {
      originalItems: null,
      adaptedQuestions: scalePlan.situational_judgment,
      note: 'Generic SJT-style situations created for role judgment transfer.',
    },
    interaction_expression: {
      originalItems: null,
      adaptedQuestions: scalePlan.interaction_expression,
      note: 'Generic social-cognition and expression prompts for dialogue likeness.',
    },
  },
  scalePlan,
  aggregatePlan,
  questionCount: genericQuestions.length,
  questions: genericQuestions,
};

const report = [
  '# Profile-helper cognitive fingerprint 50 seed',
  '',
  'This file is generated by `scripts/evals/build-profile-helper-cognitive-seed.mjs`.',
  '',
  'It adapts the scale structure in `../tashan-profile-helper` into a mounted-role questionnaire layer. It is not a clinical or IQ test, and it is not one original 50-item psychometric scale.',
  '',
  'The 50 questions are a universal mounted-role questionnaire bank. Every role receives the same 50 stems, answers each item with a numeric score plus a short role-consistent reason, and is then judged on both item-level answers and aggregate scale profile alignment.',
  '',
  `Generic bank: ${path.relative(repoRoot, bankPath).replaceAll(path.sep, '/')}`,
  '',
  '| Role | RCSS | Motivation | Mini-IPIP | SJT | Interaction | Total |',
  '|---|---:|---:|---:|---:|---:|---:|',
  ...reportRows,
  '',
  `Total roles: ${Object.keys(source.roles).length}`,
  `Total tasks: ${tasks.length}`,
  '',
  'Recommended use: pair this 50-task cognitive-fingerprint layer with the existing 100-task RoleBench-shaped curated seed for a 150-task-per-role strong evaluation.',
  '',
];

await writeFile(outPath, `${JSON.stringify(seed, null, 2)}\n`, 'utf8');
await writeFile(bankPath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8');
await writeFile(reportPath, report.join('\n'), 'utf8');
console.log(path.relative(repoRoot, bankPath));
console.log(path.relative(repoRoot, outPath));
console.log(path.relative(repoRoot, reportPath));
