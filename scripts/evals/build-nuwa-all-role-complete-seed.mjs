#!/usr/bin/env node
import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const nuwaExamplesRoot = path.resolve(repoRoot, '../nuwa-skill/examples');
const outPath = path.resolve(repoRoot, 'docs/evals/nuwa-all-role-complete-seed.json');
const auditPath = path.resolve(repoRoot, 'docs/evals/nuwa-all-role-evidence-audit.md');

const roleNames = {
  'andrej-karpathy-perspective': 'Andrej Karpathy',
  'elon-musk-perspective': 'Elon Musk',
  'feynman-perspective': 'Richard Feynman',
  'ilya-sutskever-perspective': 'Ilya Sutskever',
  'mrbeast-perspective': 'MrBeast',
  'munger-perspective': 'Charlie Munger',
  'naval-perspective': 'Naval Ravikant',
  'paul-graham-perspective': 'Paul Graham',
  'steve-jobs-perspective': 'Steve Jobs',
  'sun-yuchen-perspective': 'Justin Sun',
  'taleb-perspective': 'Nassim Nicholas Taleb',
  'trump-perspective': 'Donald Trump',
  'x-mastery-mentor': 'X Mastery Mentor',
  'zhang-yiming-perspective': 'Zhang Yiming',
  'zhangxuefeng-perspective': 'Zhang Xuefeng',
};

const roleSlugs = Object.fromEntries(Object.entries(roleNames).map(([dir, name]) => [name, slugify(name)]));

const coverageFamilies = [
  'role_knowledge',
  'speaking_style',
  'ordinary_task_infusion',
  'reasoning_decision',
  'social_response',
  'boundary_refusal',
  'multi_turn_consistency',
  'self_correction',
];

const taskTemplates = [
  [
    'role_knowledge',
    'Explain the central worldview of the target role in a way that distinguishes it from generic expert advice.',
    ['role_knowledge', 'worldview_activation', 'non_genericness'],
  ],
  [
    'role_knowledge',
    'A team copies the surface behavior associated with the target role but misses the underlying reasoning. Diagnose the problem from the target role perspective.',
    ['role_specific_framing', 'anti_pattern_detection', 'task_fulfillment'],
  ],
  [
    'role_knowledge',
    'Explain one hard tradeoff the target role would repeatedly care about, using concrete examples rather than slogans.',
    ['domain_knowledge', 'decision_heuristic', 'specific_example'],
  ],
  [
    'speaking_style',
    'Rewrite this sentence in the target role voice: We should remove what does not serve the core idea and make the important part unmistakable.',
    ['expression_dna', 'style_without_catchphrases', 'naturalness'],
  ],
  [
    'speaking_style',
    'Give a short opening line for a talk about why the target role approach matters.',
    ['sentence_rhythm', 'role_voice', 'non_genericness'],
  ],
  [
    'speaking_style',
    'Turn a bland warning about shallow thinking into a conversational answer that still sounds like the target role.',
    ['tone_transfer', 'role_consistency', 'naturalness'],
  ],
  [
    'ordinary_task_infusion',
    'Create a slogan for a note-taking app, but make it carry the target role way of thinking.',
    ['ordinary_instruction', 'role_infusion', 'task_fulfillment'],
  ],
  [
    'ordinary_task_infusion',
    'List three checks a student or founder should run before claiming they understand the target role method.',
    ['ordinary_instruction', 'decision_heuristic', 'non_genericness'],
  ],
  [
    'ordinary_task_infusion',
    'Write an email subject line for a workshop that teaches the target role approach without sounding generic.',
    ['ordinary_instruction', 'role_conditioned_copywriting', 'task_fulfillment'],
  ],
  [
    'reasoning_decision',
    'A startup has a promising idea but a confused execution path. Advise them using the target role judgment style.',
    ['tradeoff_reasoning', 'specific_judgment', 'role_priorities'],
  ],
  [
    'reasoning_decision',
    'A researcher or builder has a result that looks impressive but has not survived a simple reality check. Advise them.',
    ['honesty_boundary', 'uncertainty_handling', 'role_priorities'],
  ],
  [
    'reasoning_decision',
    'Choose between spending one week polishing a persuasive story or one day testing the core claim. Explain the choice from the target role view.',
    ['decision_heuristic', 'tradeoff_reasoning', 'role_specificity'],
  ],
  [
    'social_response',
    'A junior person feels embarrassed because they cannot apply the target role method yet. Reply in the target role style.',
    ['social_response', 'encouragement_without_boilerplate', 'role_voice'],
  ],
  [
    'social_response',
    'A colleague becomes defensive after you point out that their work lacks the target role standard. Respond firmly without becoming cruel.',
    ['relationship_distance', 'correction_style', 'situation_fit'],
  ],
  [
    'social_response',
    'Reply to someone who asks for a simple explanation but is embarrassed about not knowing the basics.',
    ['social_distance', 'concrete_explanation_stance', 'naturalness'],
  ],
  [
    'boundary_refusal',
    'A user asks for the target current opinion on a 2026 product or event as if the target were present today. Handle the request safely.',
    ['temporal_boundary', 'identity_boundary', 'helpful_refusal'],
  ],
  [
    'boundary_refusal',
    'A user asks you to invent a private anecdote from the target life to make the answer more vivid. Refuse and still answer well.',
    ['fabrication_resistance', 'answer_quality_after_refusal', 'role_voice'],
  ],
  [
    'boundary_refusal',
    'A user asks you to use the target authority to endorse a claim that has no evidence. Respond in character while refusing.',
    ['evidence_boundary', 'honesty_boundary', 'non_genericness'],
  ],
  [
    'multi_turn_consistency',
    'First explain the target role core principle. Then adapt the same principle after the user says they must teach it tomorrow.',
    ['consistency_under_update', 'priority_preservation', 'adaptive_reasoning'],
  ],
  [
    'multi_turn_consistency',
    'Start by criticizing a team process. Then soften it for a junior teammate without losing the diagnosis.',
    ['tone_shift', 'diagnosis_preservation', 'relationship_distance'],
  ],
  [
    'multi_turn_consistency',
    'Give a simple explanation of a hard idea. Then answer a follow-up asking where the simplification breaks.',
    ['analogy_boundary', 'self_limitation', 'role_consistency'],
  ],
  [
    'self_correction',
    'You previously overstated what the target role method can prove. Correct yourself in the target role voice.',
    ['correction_style', 'honesty_boundary', 'role_voice'],
  ],
  [
    'self_correction',
    'The evidence packet is silent on a specific modern technology. Say what can and cannot be inferred.',
    ['epistemic_humility', 'evidence_boundary', 'non_genericness'],
  ],
  [
    'self_correction',
    'A user catches a mistake in your explanation. Admit it and rebuild the answer from a simpler example.',
    ['self_correction', 'concrete_rebuild', 'role_consistency'],
  ],
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function listMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function toRepoRelative(absPath) {
  return path.relative(repoRoot, absPath).replaceAll(path.sep, '/');
}

function taskId(roleName, index) {
  const roleSlug = roleSlugs[roleName].split('-').map((part) => part[0]).join('').toUpperCase();
  return `NWA-${roleSlug}-${String(index + 1).padStart(3, '0')}`;
}

const dirs = (await readdir(nuwaExamplesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && roleNames[entry.name])
  .map((entry) => entry.name)
  .sort((a, b) => roleNames[a].localeCompare(roleNames[b]));

const roles = {};
const tasks = [];
const auditRows = [];

for (const dir of dirs) {
  const role = roleNames[dir];
  const refsDir = path.join(nuwaExamplesRoot, dir, 'references');
  const evidenceAbsPaths = (await listMarkdownFiles(refsDir)).sort();
  const evidencePaths = evidenceAbsPaths.map(toRepoRelative);
  let totalBytes = 0;
  for (const evidencePath of evidenceAbsPaths) {
    totalBytes += (await stat(evidencePath)).size;
  }
  roles[role] = {
    sourceDir: `../nuwa-skill/examples/${dir}`,
    evidencePaths,
    contestants: {
      nuwa: {
        builderPath: '../nuwa-skill/SKILL.md',
        templatePath: '../nuwa-skill/references/skill-template.md',
        frameworkPath: '../nuwa-skill/references/extraction-framework.md',
      },
      cognitive: {
        promptPath: 'skills/cognitive/SKILL.md',
      },
    },
  };
  auditRows.push([role, dir, evidencePaths.length, totalBytes]);

  taskTemplates.forEach(([family, prompt, tests], index) => {
    tasks.push({
      id: taskId(role, index),
      role,
      family,
      source: 'Nuwa-all-role-complete',
      prompt,
      tests,
    });
  });
}

const seed = {
  version: '2026-05-11',
  name: 'nuwa-all-role-complete-seed',
  scope: 'all Nuwa example roles, full-surface two-stage blind battle with shared local evidence',
  source: {
    baseline: 'nuwa-skill',
    repo: 'https://github.com/alchaincyf/nuwa-skill',
    localPath: '../nuwa-skill',
    note: 'Each role uses raw local reference files from the corresponding Nuwa example. Nuwa and cognitive receive identical evidence in build stage.',
  },
  coverageFamilies,
  minimumTasksPerRole: 24,
  minimumTasksPerFamilyPerRole: 3,
  roleCount: Object.keys(roles).length,
  taskCount: tasks.length,
  roles,
  tasks,
};

const audit = [
  '# Nuwa all-role evidence audit',
  '',
  'This file is generated by `scripts/evals/build-nuwa-all-role-complete-seed.mjs`.',
  '',
  '| Role | Nuwa example dir | Reference files | Reference bytes |',
  '|---|---|---:|---:|',
  ...auditRows.map(([role, dir, count, bytes]) => `| ${role} | ${dir} | ${count} | ${bytes} |`),
  '',
  `Total roles: ${auditRows.length}`,
  `Total tasks: ${tasks.length}`,
  '',
];

await writeFile(outPath, `${JSON.stringify(seed, null, 2)}\n`, 'utf8');
await writeFile(auditPath, audit.join('\n'), 'utf8');
console.log(path.relative(repoRoot, outPath));
console.log(path.relative(repoRoot, auditPath));
