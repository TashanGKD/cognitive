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
  'rolebench_general_instruction',
  'rolebench_role_specific',
];

const generalInstructionTemplates = [
  ['punctuation_edit', 'Insert the missing punctuation while keeping the answer brief: Alice went to the store to buy apples'],
  ['stance_classification', 'Classify the text as Support or Unsupport.\nStatement: Eating healthy is always expensive.\nText: Recent studies show people can eat varied, healthy food while staying within a budget.'],
  ['headline_generation', 'Create a headline for a news article about the benefits of regular yoga practice.'],
  ['translation', 'Translate this sentence into English: Ce qui a été appris est assez.'],
  ['categorization', 'Categorize these organisms as producer, consumer, or decomposer: bacteria, grass, fox.'],
  ['constrained_disclaimer', 'Generate a disclaimer with exactly ten words.'],
  ['weather_boolean', 'Determine whether this forecast is sunny. Output true or false: temperature around 20 Celsius with light showers.'],
  ['sentence_fix', 'Fix the punctuation and capitalization: I told my friend that i found the answer'],
  ['math_answer', 'Calculate the area of a circle with radius 3. Output a number and no extra derivation.'],
  ['grammar_generation', 'Construct one sentence using an irregular past-tense verb.'],
  ['string_indexing', 'Find the 5th character in this string: abcdefg.'],
  ['choice_selection', 'Using the given list, pick one sport: swimming, soccer, hockey, tennis, badminton.'],
  ['language_tagging', 'Tag the language of this text: Kareena always had a passion for art.'],
  ['adjective_list', 'Give five adjectives that describe a dragon.'],
  ['positive_rewrite', 'Rewrite this sentence in a positive way: He was unable to finish the task.'],
  ['passive_voice', 'Change this sentence into passive voice: We are cooking dinner.'],
  ['interrogative_transform', 'Transform this sentence into an interrogative sentence: I saw a bear in the woods.'],
  ['number_to_words', 'Convert the number 1432 into English words.'],
  ['arithmetic_validity', 'Determine whether this arithmetic expression is valid: 8 / 0.'],
  ['yaml_conversion', 'Convert this JSON to YAML: {"name":"Ada","skills":["math","writing"],"active":true}.'],
  ['short_plan', 'Create a three-step plan for preparing a small workshop tomorrow.'],
  ['email_subject', 'Write one concise email subject line for a meeting about removing unnecessary work.'],
  ['analogy', 'Explain overfitting with a simple analogy for a high-school student.'],
  ['list_completion', 'Add five traits to this list: courage, self-control, respect.'],
];

const roleSpecificThemes = {
  'Andrej Karpathy': [
    ['software_20', 'neural networks as a new kind of software stack', 'a team is treating model behavior like ordinary deterministic code'],
    ['data_engine', 'data quality, iteration loops, and error analysis as the center of progress', 'a lab wants to buy bigger models before inspecting failures'],
    ['education_style', 'teaching from first principles with runnable intuition', 'a student thinks deep learning is only formulas and libraries'],
    ['autonomy_stack', 'building AI systems as layered products with sensors, datasets, models, and evaluation', 'an autonomous-product team argues only about model architecture'],
    ['taste_for_simplicity', 'small clean demos that reveal the real mechanism', 'a demo has many features but nobody can explain the core behavior'],
    ['public_builder_voice', 'transparent builder communication without inflated claims', 'a founder wants to oversell a prototype on social media'],
  ],
  'Charlie Munger': [
    ['mental_models', 'latticework of mental models across disciplines', 'an investor reasons from one narrow framework'],
    ['inversion', 'inverting the problem to avoid stupidity', 'a team only asks how to succeed and never asks how to fail'],
    ['incentives', 'incentives and human misjudgment as dominant forces', 'a company designs a metric that rewards bad behavior'],
    ['circle_of_competence', 'staying inside the circle of competence', 'a smart person wants to bet heavily on a field they barely understand'],
    ['worldly_wisdom', 'compound learning, patience, and temperament', 'someone wants a shortcut to judgment without years of accumulation'],
    ['blunt_expression', 'plain, dry, anti-nonsense communication', 'a memo hides a weak idea behind elaborate language'],
  ],
  'Donald Trump': [
    ['dominance_frame', 'dominance, winning, and public contrast', 'a campaign message is technically correct but has no force'],
    ['media_instinct', 'attention capture through repetition and simple labels', 'a spokesperson writes a careful paragraph nobody remembers'],
    ['deal_making', 'negotiation framed around leverage and visible strength', 'a negotiator gives away leverage before the meeting starts'],
    ['loyalty_attack', 'loyalty, conflict, and attack-counterattack rhythm', 'an ally is wavering in public'],
    ['superlative_voice', 'superlative, compressed, highly performative expression', 'a speech opener sounds neutral and academic'],
    ['boundary_current_events', 'separating historical persona projection from unsupported present-day claims', 'a user asks for a real 2026 endorsement'],
  ],
  'Elon Musk': [
    ['first_principles', 'first-principles decomposition and physics-style constraints', 'a company assumes an industry cost is fixed'],
    ['manufacturing_scale', 'manufacturing, iteration speed, and vertical integration', 'a hardware team treats prototypes as the hard part'],
    ['risk_tolerance', 'high-conviction risk-taking under mission pressure', 'a founder avoids a hard technical bet because it may look foolish'],
    ['talent_density', 'small teams of intense builders moving fast', 'a project adds committees to reduce discomfort'],
    ['multi_company_context', 'cross-domain thinking across rockets, cars, energy, AI, and platforms', 'a strategy memo treats each domain as unrelated'],
    ['memetic_directness', 'compressed, blunt, sometimes playful technical communication', 'a product launch explanation is accurate but lifeless'],
  ],
  'Ilya Sutskever': [
    ['scaling_belief', 'deep belief in representation learning, scale, and unsupervised objectives', 'a researcher dismisses scale before checking the evidence'],
    ['safety_seriousness', 'AI capability and safety as inseparable concerns', 'a lab separates deployment speed from alignment risk'],
    ['research_intuition', 'quiet technical intuition about what matters in learning systems', 'a team chases benchmarks without understanding the learning signal'],
    ['agi_language', 'careful, high-stakes language around AGI and superintelligence', 'an interviewer asks for a casual prediction about AGI'],
    ['scientific_reserve', 'reserved expression with dense conviction', 'a public answer needs to be precise without sounding promotional'],
    ['uncertainty_boundary', 'knowing when evidence does not justify a confident claim', 'a user asks for certainty about a future model behavior'],
  ],
  'Justin Sun': [
    ['attention_arbitrage', 'attention, narrative, and market visibility as strategic assets', 'a crypto project has technology but no market mindshare'],
    ['ecosystem_growth', 'exchange, chain, community, and partnership flywheels', 'a founder treats token distribution as an afterthought'],
    ['opportunistic_speed', 'fast opportunistic positioning around new narratives', 'a team waits for perfect certainty before entering a hot market'],
    ['publicity_risk', 'public stunts, controversy, and reputation tradeoffs', 'a campaign could gain attention but damage credibility'],
    ['global_crypto_voice', 'crypto-native optimism with promotional directness', 'a launch announcement sounds like enterprise software copy'],
    ['boundary_hype', 'distinguishing strategic narrative from unsupported financial promises', 'a user asks for guaranteed investment returns'],
  ],
  'MrBeast': [
    ['retention_engine', 'retention, click-through, and payoff pacing', 'a video idea has a good cause but weak opening tension'],
    ['thumbnail_title', 'titles and thumbnails as promise compression', 'a team writes a title that explains instead of hooks'],
    ['scale_spectacle', 'escalating stakes, clarity, and generosity at scale', 'a challenge video feels small and slow'],
    ['obsessive_testing', 'testing, analytics, and ruthless iteration', 'a creator trusts taste but ignores audience drop-off'],
    ['team_production', 'high-throughput production systems around creative ideas', 'a creator wants to do everything alone'],
    ['creator_voice', 'simple, energetic, audience-first delivery', 'a sponsor segment needs to feel natural and fast'],
  ],
  'Nassim Nicholas Taleb': [
    ['antifragility', 'antifragility and gaining from disorder', 'a system survives volatility but does not benefit from it'],
    ['skin_in_game', 'skin in the game and distrust of unaccountable advice', 'a consultant recommends risk while bearing none'],
    ['black_swan', 'fat tails, opacity, and the limits of prediction', 'a forecast looks precise but ignores tail risk'],
    ['barbell_strategy', 'barbell strategy and optionality', 'an investor puts everything into medium-risk sameness'],
    ['anti_fragile_voice', 'combative, aphoristic critique of fragilistas and pseudo-experts', 'a response to a fragile policy sounds too polite'],
    ['epistemic_boundary', 'distinguishing robust heuristics from fake certainty', 'a user asks for a precise probability that evidence cannot support'],
  ],
  'Naval Ravikant': [
    ['specific_knowledge', 'specific knowledge, leverage, and accountability', 'a young builder asks how to become wealthy without becoming replaceable'],
    ['desire_contract', 'desire, happiness, and internal freedom', 'a successful founder feels trapped by goals they chose'],
    ['long_term_games', 'long-term games with long-term people', 'a partnership offers short-term upside but weak trust'],
    ['permissionless_leverage', 'code, media, capital, and permissionless scale', 'someone wants permission before publishing their work'],
    ['aphoristic_style', 'compressed aphoristic statements with calm precision', 'a paragraph about focus needs to become sharper'],
    ['spiritual_pragmatism', 'practical spirituality without sentimentality', 'a user asks for advice after confusing ambition with peace'],
  ],
  'Paul Graham': [
    ['startup_idea', 'startup ideas from noticing what is missing or broken', 'a founder searches for ideas by brainstorming markets'],
    ['founder_earnestness', 'earnest, formidable founders over polished business theater', 'a team optimizes pitch polish before user love'],
    ['do_things', 'doing unscalable things to learn the truth', 'a startup wants automation before talking to users'],
    ['writing_thinking', 'essay-like reasoning that makes hidden assumptions visible', 'a founder cannot explain why the product matters'],
    ['schlep_blindness', 'schlep blindness and neglected hard work', 'a team avoids a boring operational problem that customers need solved'],
    ['calm_direct_voice', 'plain, reflective, mildly contrarian style', 'an answer should be critical without sounding aggressive'],
  ],
  'Richard Feynman': [
    ['simple_explanation', 'explaining hard ideas through concrete simple examples', 'a student memorizes a formula without understanding it'],
    ['not_fooling_self', 'scientific honesty and not fooling yourself', 'a researcher likes a result before checking the controls'],
    ['curiosity_play', 'curiosity, play, and hands-on investigation', 'a class turns science into rule-following'],
    ['caltech_style', 'irreverent directness mixed with delight in mechanism', 'a lecture opener sounds solemn and dull'],
    ['uncertainty', 'saying what is known, unknown, and merely guessed', 'a user asks for certainty beyond the experiment'],
    ['teaching_diagnosis', 'diagnosing fake understanding through explanation tests', 'a team says they understand a system but cannot predict it'],
  ],
  'Steve Jobs': [
    ['taste_focus', 'taste, focus, and saying no', 'a product team keeps adding features to avoid hard choices'],
    ['end_to_end', 'end-to-end control of experience', 'a team treats design, hardware, and software as separate silos'],
    ['simplicity_depth', 'simplicity that comes from deep understanding', 'an interface is simple only because it hides unresolved complexity'],
    ['reality_distortion', 'high standards and persuasive force without accepting mediocrity', 'a team wants to ship something merely acceptable'],
    ['product_story', 'turning technology into a felt human promise', 'a launch script lists specs but has no soul'],
    ['boundary_persona', 'projecting historical judgment without inventing private anecdotes', 'a user asks for a made-up private Jobs story'],
  ],
  'X Mastery Mentor': [
    ['niche_positioning', 'clear niche, audience promise, and repeated signal', 'a creator posts broadly and attracts no distinct audience'],
    ['hook_structure', 'hooks, threads, and idea compression for X', 'a post has useful content but no opening pull'],
    ['distribution_loop', 'content-market fit, feedback loops, and monetization path', 'a creator writes daily but never learns from engagement'],
    ['authority_building', 'building authority through proof, taste, and consistency', 'a beginner wants credibility without receipts'],
    ['ai_tech_niche', 'using AI and technical insight as a differentiated niche', 'a creator repeats generic AI news'],
    ['anti_spam_boundary', 'growth without spammy engagement bait', 'a user asks for manipulative engagement tactics'],
  ],
  'Zhang Xuefeng': [
    ['education_roi', 'education choices through ROI, employment, and family reality', 'a student chooses a major only because it sounds prestigious'],
    ['class_mobility', 'class mobility and practical constraints in Chinese education', 'a family ignores budget and job-market constraints'],
    ['plain_talk', 'direct, earthy, high-pressure communication', 'an answer about major selection sounds evasive'],
    ['exam_strategy', 'score, region, school tier, and profession as a system', 'a student compares universities without considering admissions range'],
    ['anti_romanticism', 'pushing back against romantic but low-return advice', 'a student wants to choose purely by passion'],
    ['boundary_personalized_advice', 'not pretending to know a student profile without data', 'a user asks for a specific school decision with missing scores'],
  ],
  'Zhang Yiming': [
    ['delayed_gratification', 'delayed gratification and long-term rationality', 'a team wants immediate metrics at the cost of compounding'],
    ['information_flow', 'information density, systems, and reducing ego in organizations', 'a company hides bad news to preserve hierarchy'],
    ['product_algorithm', 'product, recommendation, and feedback loops', 'a product team argues from opinions instead of user behavior'],
    ['ordinary_mind', 'ordinary mind, self-discipline, and clear thinking', 'a manager confuses emotional reaction with judgment'],
    ['global_organization', 'building scalable organizations beyond founder charisma', 'a team depends on heroic individual effort'],
    ['reserved_voice', 'calm, rational, non-performative expression', 'a public answer must be firm without becoming theatrical'],
  ],
};

const roleSpecificPromptTemplates = [
  (role, label, knowledge) => `${role}, explain your view of this principle: ${knowledge}. Make the answer specific enough that it could not be replaced by generic expert advice.`,
  (role, label, knowledge, scenario) => `${role}, diagnose this situation using this principle: ${knowledge}. Situation: ${scenario}.`,
  (role, label, knowledge, scenario) => `${role}, give a concrete recommendation for this case, preserving your characteristic judgment style: ${scenario}.`,
  (role, label, knowledge) => `${role}, contrast your real view of this principle with the shallow version people often imitate: ${knowledge}. Include one anti-pattern.`,
];

function buildGeneralTask(role, [subtype, instruction], index) {
  return {
    id: taskId(role, index),
    role,
    family: 'rolebench_general_instruction',
    source: 'RoleBench-CUS-style',
    subtype,
    prompt: [
      `Answer as ${role}. Complete the user instruction correctly, but let the role's speaking style and judgment naturally shape the response.`,
      '',
      instruction,
    ].join('\n'),
    tests: ['task_fulfillment', 'role_conditioned_expression', 'non_genericness'],
  };
}

function buildRoleSpecificTasks(role, startIndex) {
  const themes = roleSpecificThemes[role];
  if (!themes) throw new Error(`Missing role-specific themes for role: ${role}`);
  const tasks = [];
  for (const [label, knowledge, scenario] of themes) {
    for (const template of roleSpecificPromptTemplates) {
      tasks.push({
        id: taskId(role, startIndex + tasks.length),
        role,
        family: 'rolebench_role_specific',
        source: 'RoleBench-SPE-style',
        subtype: label,
        prompt: template(role, label, knowledge, scenario),
        tests: ['role_specific_knowledge', 'cognitive_model_fidelity', 'evidence_grounding', 'expression_dna'],
      });
    }
  }
  return tasks;
}

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

  generalInstructionTemplates.forEach((template, index) => {
    tasks.push(buildGeneralTask(role, template, index));
  });
  tasks.push(...buildRoleSpecificTasks(role, generalInstructionTemplates.length));
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
  rolebenchAdaptation: {
    paper: 'RoleLLM: Benchmarking, Eliciting, and Enhancing Role-Playing Abilities of Large Language Models, Findings ACL 2024',
    repo: 'https://github.com/InteractiveNLP-Team/RoleLLM-public',
    dataset: 'https://huggingface.co/datasets/ZenMoore/RoleBench',
    note: 'The 15 Nuwa example roles do not overlap by name with the public RoleBench role list, so this seed reproduces the RoleBench task construction pattern rather than copying same-role questions.',
    taskShape: {
      rolebench_general_instruction: 'CUS-style: ordinary instructions answered in the target role voice while preserving task correctness.',
      rolebench_role_specific: 'SPE-style: role-specific questions generated from role evidence themes to test knowledge, memory, judgment, and expression.',
    },
  },
  coverageFamilies,
  minimumTasksPerRole: 48,
  minimumTasksPerFamilyPerRole: 24,
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
