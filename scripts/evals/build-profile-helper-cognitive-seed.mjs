#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const sourcePath = path.resolve(repoRoot, 'docs/evals/nuwa-all-role-complete-seed.json');
const outPath = path.resolve(repoRoot, 'docs/evals/profile-helper-cognitive-fingerprint-50-seed.json');
const reportPath = path.resolve(repoRoot, 'docs/evals/profile-helper-cognitive-fingerprint-50-report.md');

const scalePlan = {
  rcss: 8,
  motivation: 12,
  mini_ipip: 10,
  situational_judgment: 10,
  interaction_expression: 10,
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

const rcssTasks = [
  ['integration_cross_domain', 'A hard problem is stuck inside one domain. Answer as {role}: how would you decide whether to import methods from another field or stay inside the field?'],
  ['integration_framework', 'A team keeps solving local patches. Answer as {role}: when should they step back and build a broader model?'],
  ['integration_system', 'Several partial tools work separately but not as a system. Answer as {role}: what would you assemble, remove, or sequence first?'],
  ['integration_transfer', 'A user asks for a new idea by combining two distant domains. Answer as {role}: show the kind of connection you would trust.'],
  ['depth_specialist', 'A collaborator wants fast breadth, but the core issue may require months of deep work. Answer as {role}: what depth would you insist on?'],
  ['depth_precision', 'A result looks promising but the details are messy. Answer as {role}: what exact checks would matter before believing it?'],
  ['depth_solitude', 'A complex problem needs quiet thinking rather than meetings. Answer as {role}: how would you protect the work?'],
  ['depth_craft', 'Someone says polish is less important than shipping. Answer as {role}: where does craft matter, and where does it not?'],
];

const motivationTasks = [
  ['to_know', 'Answer as {role}: what kind of problem would you keep studying even if nobody rewarded you for it?'],
  ['to_accomplish', 'Answer as {role}: what does it mean to genuinely accomplish something difficult rather than merely look successful?'],
  ['stimulation', 'Answer as {role}: describe the moment in work where the process itself becomes exciting.'],
  ['identified', 'Answer as {role}: what work would feel worth doing because it fits your deeper values?'],
  ['introjected', 'Answer as {role}: when does proving yourself help, and when does it corrupt judgment?'],
  ['external_social', 'Answer as {role}: how should one treat praise, status, or public approval while making a decision?'],
  ['external_material', 'Answer as {role}: when should money or material reward influence a serious choice?'],
  ['amotivation', 'Answer as {role}: if a person feels their work has become pointless, how would you diagnose the cause?'],
  ['autonomy', 'Answer as {role}: what makes effort feel self-directed rather than controlled by others?'],
  ['pressure', 'Answer as {role}: how do you behave when external pressure conflicts with your own judgment?'],
  ['career_tradeoff', 'Answer as {role}: choose between a safer career move and a harder path with more meaning.'],
  ['meaning_boundary', 'Answer as {role}: reject a project that has rewards but violates the way you think work should be done.'],
];

const miniIpipTasks = [
  ['extraversion_social_energy', 'Answer as {role}: in a public room full of smart people, what would make you speak up?'],
  ['extraversion_background', 'Answer as {role}: when is it better to stay in the background and let the work speak?'],
  ['agreeableness_empathy', 'Answer as {role}: someone is wrong but insecure. How do you respond without losing the point?'],
  ['agreeableness_conflict', 'Answer as {role}: when is blunt disagreement kinder than polite ambiguity?'],
  ['conscientiousness_order', 'Answer as {role}: what kind of order, checklist, or discipline is actually useful?'],
  ['conscientiousness_mess', 'Answer as {role}: a project is becoming chaotic. What is the first mess you clean up?'],
  ['neuroticism_pressure', 'Answer as {role}: how do you handle pressure without letting it distort the decision?'],
  ['neuroticism_reactivity', 'Answer as {role}: what should a person do before reacting emotionally to bad news?'],
  ['openness_abstract', 'Answer as {role}: when are abstract ideas valuable, and when are they just decorative?'],
  ['openness_imagination', 'Answer as {role}: use imagination to reframe a boring problem into an interesting one.'],
];

const sjtTasks = [
  ['resource_allocation', 'A team has one month, limited money, and a controversial goal. Answer as {role}: what do you prioritize and what do you refuse?'],
  ['evidence_conflict', 'The evidence contradicts the preferred story. Answer as {role}: what do you say in the meeting?'],
  ['ethical_boundary', 'A shortcut would produce attention but mislead users. Answer as {role}: decide and explain.'],
  ['talent_choice', 'Choose between a brilliant difficult collaborator and a reliable average one. Answer as {role}.'],
  ['public_failure', 'A public project failed. Answer as {role}: what do you admit, what do you inspect, and what do you do next?'],
  ['long_short_tradeoff', 'A short-term win harms the long-term system. Answer as {role}: make the tradeoff explicit.'],
  ['unknowns', 'You are asked for certainty where evidence is weak. Answer as {role}: respond naturally without pretending.'],
  ['quality_bar', 'The team wants to ship a mediocre version. Answer as {role}: how do you push back?'],
  ['user_need', 'A user asks for what they want, but you suspect they need something else. Answer as {role}.'],
  ['status_pressure', 'A high-status person in the room is wrong. Answer as {role}: how do you handle it?'],
];

const interactionTasks = [
  ['teach', 'Teach a confused beginner one idea in your style as {role}, without sounding like a generic tutor.'],
  ['refuse', 'Refuse an unsafe or unsupported request as {role}, keeping the refusal in-character.'],
  ['challenge', 'Challenge a user who is fooling themselves, as {role}.'],
  ['comfort_without_fluff', 'A user is discouraged after a failure. Respond as {role} without generic reassurance.'],
  ['compress', 'Compress your core advice on a messy problem into three short lines as {role}.'],
  ['debate', 'Debate a thoughtful opponent as {role}; make one strong point and one concession.'],
  ['ask_clarifying', 'Ask the one clarifying question {role} would ask before giving advice.'],
  ['boundary_identity', 'Answer a personal question as {role} without inventing private facts.'],
  ['voice_shift', 'Turn a bland assistant answer into a response that carries {role} cognition and voice.'],
  ['diagnose_genericness', 'Given a generic response, explain as {role} what makes it generic and how to improve it.'],
];

const families = [
  ['profile_helper_rcss', rcssTasks, 'RCSS cognitive style'],
  ['profile_helper_motivation', motivationTasks, 'AMS/MWMS motivation structure'],
  ['profile_helper_mini_ipip', miniIpipTasks, 'Mini-IPIP personality substrate'],
  ['profile_helper_situational_judgment', sjtTasks, 'situational judgment'],
  ['profile_helper_interaction_expression', interactionTasks, 'social cognition and expression'],
];

function stableRoleId(role) {
  return role
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase())
    .join('')
    .slice(0, 8);
}

function render(template, role) {
  return [
    template.replaceAll('{role}', role),
    '',
    'Answer naturally as the mounted role. Do not mention scores, scales, fingerprints, or evaluation criteria.',
  ].join('\n');
}

const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const tasks = [];
const reportRows = [];

for (const role of Object.keys(source.roles).sort()) {
  const fingerprint = fingerprints[role];
  if (!fingerprint) throw new Error(`Missing fingerprint for ${role}`);

  let roleIndex = 1;
  for (const [family, templates, sourceScale] of families) {
    for (const [subtype, promptTemplate] of templates) {
      tasks.push({
        id: `PH-${stableRoleId(role)}-${String(roleIndex).padStart(3, '0')}`,
        role,
        family,
        source: 'tashan-profile-helper-shaped',
        sourceScale,
        subtype,
        prompt: render(promptTemplate, role),
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
    '15 Nuwa example roles, 50 profile-helper-shaped cognitive fingerprint tasks per role, supplementing the RoleBench-shaped role task seed.',
  sourceSeed: path.relative(repoRoot, sourcePath).replaceAll(path.sep, '/'),
  profileHelperSource: '../tashan-profile-helper',
  scalePlan,
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

const report = [
  '# Profile-helper cognitive fingerprint 50 seed',
  '',
  'This file is generated by `scripts/evals/build-profile-helper-cognitive-seed.mjs`.',
  '',
  'It adapts the scale structure in `../tashan-profile-helper` into a role-likeness evaluation layer. It is not a clinical or IQ test. It measures whether answers preserve the target role cognitive fingerprint: cognitive style, motivation, personality substrate, situational judgment, and social expression.',
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
await writeFile(reportPath, report.join('\n'), 'utf8');
console.log(path.relative(repoRoot, outPath));
console.log(path.relative(repoRoot, reportPath));
