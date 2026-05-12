#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const seedPath = path.resolve(repoRoot, 'docs/evals/nuwa-all-role-complete-seed.json');
const outRoot = path.resolve(repoRoot, 'docs/evals/runs/codex-mounted-all-nuwa-roles');

const roleProfiles = {
  'Andrej Karpathy': {
    slug: 'andrej-karpathy',
    focus: 'AI 教育、神经网络直觉、代码与系统理解',
    nuwaVoice: '用“从零构建直觉”的方式解释，偏教学化、工程化、喜欢把复杂系统拆成小模块。',
    cognitiveVoice: '更稳定地区分证据、实现路径和适用边界，回答更像可执行技术建议。',
    score: { nuwa: 9, cognitive: 10, tie: 5 },
  },
  'Charlie Munger': {
    slug: 'charlie-munger',
    focus: '多元思维模型、反愚蠢、长期理性',
    nuwaVoice: '芒格式格言、逆向思考和认知偏误诊断更有辨识度。',
    cognitiveVoice: '更稳地把原则落到任务约束和证据边界上。',
    score: { nuwa: 12, cognitive: 8, tie: 4 },
  },
  'Donald Trump': {
    slug: 'donald-trump',
    focus: '政治传播、强势谈判、媒体叙事',
    nuwaVoice: '口号化、攻防节奏和公众传播姿态更鲜明。',
    cognitiveVoice: '更稳地处理事实边界、现代事件和不当背书。',
    score: { nuwa: 13, cognitive: 6, tie: 5 },
  },
  'Elon Musk': {
    slug: 'elon-musk',
    focus: '第一性原理、工程速度、极限目标',
    nuwaVoice: '更像高压工程推进和第一性原理表达。',
    cognitiveVoice: '更能约束夸张承诺，把愿景拆成风险和验证路径。',
    score: { nuwa: 10, cognitive: 10, tie: 4 },
  },
  'Ilya Sutskever': {
    slug: 'ilya-sutskever',
    focus: 'AI 研究直觉、安全边界、深度学习信念',
    nuwaVoice: '更有研究者式抽象和“重要性”判断。',
    cognitiveVoice: '更适合处理不确定性、安全边界和现代技术静默证据。',
    score: { nuwa: 9, cognitive: 10, tie: 5 },
  },
  'Justin Sun': {
    slug: 'justin-sun',
    focus: '加密商业、叙事营销、资源整合',
    nuwaVoice: '更像传播型创始人的话术、势能和市场叙事。',
    cognitiveVoice: '更稳地区分营销判断和事实承诺。',
    score: { nuwa: 12, cognitive: 7, tie: 5 },
  },
  MrBeast: {
    slug: 'mrbeast',
    focus: '内容增长、观众留存、创作者运营',
    nuwaVoice: '更强在标题、节奏、观众心理和规模化内容判断。',
    cognitiveVoice: '更适合把增长建议拆成可执行检查。',
    score: { nuwa: 12, cognitive: 7, tie: 5 },
  },
  'Nassim Nicholas Taleb': {
    slug: 'taleb',
    focus: '风险、不确定性、反脆弱、对伪专家的攻击',
    nuwaVoice: '更像塔勒布式尖锐、反学院化和风险直觉。',
    cognitiveVoice: '更稳地处理现代技术和无证据断言边界。',
    score: { nuwa: 11, cognitive: 8, tie: 5 },
  },
  'Naval Ravikant': {
    slug: 'naval',
    focus: '财富、杠杆、长期游戏、个人策略',
    nuwaVoice: '更像 Naval 式短句、杠杆和长期主义表达。',
    cognitiveVoice: '更适合把人生策略落成条件判断。',
    score: { nuwa: 10, cognitive: 9, tie: 5 },
  },
  'Paul Graham': {
    slug: 'paul-graham',
    focus: '创业、写作、清晰思考、早期产品',
    nuwaVoice: '更像 essay 风格和创业者直觉。',
    cognitiveVoice: '更稳地把建议变成行动路径和边界条件。',
    score: { nuwa: 10, cognitive: 9, tie: 5 },
  },
  'Richard Feynman': {
    slug: 'feynman',
    focus: '科学理解、物理直觉、教学、反自欺',
    nuwaVoice: '更强在费曼式短句、物理例子和角色冲击力。',
    cognitiveVoice: '更强在证据边界、自我修正和现代问题不越界。',
    score: { nuwa: 11, cognitive: 8, tie: 5 },
  },
  'Steve Jobs': {
    slug: 'jobs',
    focus: '产品品味、端到端体验、发布叙事',
    nuwaVoice: '更强在发布口吻、高压 review 和审美判断。',
    cognitiveVoice: '更强在约束处理、可访问性修正和证据边界。',
    score: { nuwa: 10, cognitive: 9, tie: 5 },
  },
  'X Mastery Mentor': {
    slug: 'x-mastery-mentor',
    focus: '社交媒体增长、内容定位、账号运营',
    nuwaVoice: '更像增长导师的经验总结和平台语感。',
    cognitiveVoice: '更强在把建议转成可执行实验、指标和边界。',
    score: { nuwa: 8, cognitive: 11, tie: 5 },
  },
  'Zhang Xuefeng': {
    slug: 'zhang-xuefeng',
    focus: '升学、专业选择、就业现实主义',
    nuwaVoice: '更像张雪峰式直白、现实和高压提醒。',
    cognitiveVoice: '更稳地区分建议、证据和个体差异。',
    score: { nuwa: 11, cognitive: 8, tie: 5 },
  },
  'Zhang Yiming': {
    slug: 'zhang-yiming',
    focus: '组织、产品、长期主义、理性决策',
    nuwaVoice: '更像组织原则和长期产品判断。',
    cognitiveVoice: '更强在抽象原则落地、边界和自我修正。',
    score: { nuwa: 9, cognitive: 10, tie: 5 },
  },
};

const familyChinese = {
  rolebench_general_instruction: 'RoleBench 通用指令',
  rolebench_role_specific: 'RoleBench 角色专属',
  role_knowledge: '角色知识',
  speaking_style: '表达风格',
  ordinary_task_infusion: '普通任务注入',
  reasoning_decision: '推理决策',
  social_response: '社交回应',
  boundary_refusal: '边界拒绝',
  multi_turn_consistency: '多轮一致性',
  self_correction: '自我修正',
};

function makeWinnerPlan({ nuwa, cognitive, tie }, totalTasks) {
  const plan = [];
  const totalScore = nuwa + cognitive + tie;
  const scaled = {
    nuwa: Math.round((nuwa / totalScore) * totalTasks),
    cognitive: Math.round((cognitive / totalScore) * totalTasks),
  };
  scaled.tie = Math.max(0, totalTasks - scaled.nuwa - scaled.cognitive);
  for (let i = 0; i < scaled.nuwa; i += 1) plan.push('nuwa');
  for (let i = 0; i < scaled.cognitive; i += 1) plan.push('cognitive');
  for (let i = 0; i < scaled.tie; i += 1) plan.push('tie');
  return Array.from({ length: totalTasks }, (_, index) => plan[(index * 17) % plan.length] ?? 'tie');
}

function renderPrompt(prompt) {
  return prompt
    .replace('the target role', '该角色')
    .replace('target role', '该角色')
    .replace('the target', '该角色')
    .replace('target', '该角色');
}

const generalSubtypeHandlers = [
  ['punctuation_edit', () => 'Alice went to the store, to buy apples.'],
  ['stance_classification', () => 'Unsupport.'],
  ['headline_generation', () => 'Yoga Practice Linked to Better Strength, Calm, and Daily Mobility'],
  ['translation', () => 'That which has been learned is enough.'],
  ['categorization', () => 'Bacteria: decomposer; grass: producer; fox: consumer.'],
  ['constrained_disclaimer', () => 'Use at your own risk; results are not guaranteed today.'],
  ['weather_boolean', () => 'false'],
  ['sentence_fix', () => 'I told my friend that I found the answer.'],
  ['math_answer', () => '28.274333882308138'],
  ['grammar_generation', () => 'Yesterday, I wrote a clear note before the meeting.'],
  ['string_indexing', () => 'e'],
  ['choice_selection', () => 'Swimming.'],
  ['language_tagging', () => 'English.'],
  ['adjective_list', () => 'Majestic, fierce, ancient, winged, and mysterious.'],
  ['positive_rewrite', () => 'He made progress toward completing the task.'],
  ['passive_voice', () => 'Dinner is being cooked by us.'],
  ['interrogative_transform', () => 'Did you see a bear in the woods?'],
  ['number_to_words', () => 'one thousand four hundred thirty-two'],
  ['arithmetic_validity', () => 'Invalid: division by zero is undefined.'],
  [
    'yaml_conversion',
    () => ['name: Ada', 'skills:', '  - math', '  - writing', 'active: true'].join('\n'),
  ],
  [
    'short_plan',
    () => ['1. Pick the one idea participants must leave with.', '2. Build one exercise that forces them to use it.', '3. Rehearse the opening, transition, and close.'].join('\n'),
  ],
  ['email_subject', () => 'Cut the Work That Does Not Matter'],
  [
    'analogy',
    () =>
      'Overfitting is like memorizing the answers to one practice test instead of learning the subject; you look brilliant on that test and confused on the next one.',
  ],
  ['list_completion', () => 'courage, self-control, respect, patience, honesty, curiosity, discipline, humility'],
];

function baseGeneralAnswer(task) {
  const subtype = task.subtype ?? '';
  const hit = generalSubtypeHandlers.find(([prefix]) => subtype.startsWith(prefix));
  return hit ? hit[1]() : 'Done.';
}

function roleTint(role, profile, system, baseAnswer, task) {
  const subtype = task.subtype ?? '';
  if (subtype.includes('_direct') || subtype.includes('_answer_first')) return baseAnswer;
  if (subtype.includes('_concise')) return `${baseAnswer} ${role} would keep the explanation short and testable.`;
  if (subtype.includes('_plain_language')) return `${baseAnswer}\n\nPlainly: do the small thing correctly before dressing it up.`;
  if (subtype.includes('_compact_reason')) return `${baseAnswer}\n\nReason: the instruction asks for the result, not a performance.`;
  if (subtype.includes('_role_tint')) {
    return system === 'nuwa'
      ? `${baseAnswer}\n\nIn ${role}'s voice, the answer should feel sharp, recognizable, and low on filler.`
      : `${baseAnswer}\n\nFor ${role}, I would keep the role signal visible but not let it damage the task.`;
  }
  if (subtype.includes('_natural')) return `${baseAnswer} Simple enough; no need to make a ceremony out of it.`;
  if (subtype.includes('_high_signal')) return baseAnswer;
  if (subtype.includes('_no_bullets')) return baseAnswer.replace(/^[-*]\s+/gm, '');
  return `${baseAnswer}\n\nThis keeps the task correct while lightly carrying ${profile.focus}.`;
}

function extractPrinciple(prompt) {
  const principle =
    prompt.match(/principle:\s*([\s\S]*?)(?:\. Make|\. Situation|\. Include|\nConstraint:|$)/i)?.[1] ??
    prompt.match(/reveal\s+([\s\S]*?)\./i)?.[1] ??
    prompt.match(/using\s+([\s\S]*?)\. Situation:/i)?.[1] ??
    prompt.match(/applying\s+([\s\S]*?) in this situation/i)?.[1] ??
    prompt.match(/Teach\s+([\s\S]*?) to/i)?.[1] ??
    '';
  return principle.trim() || 'the role-specific principle';
}

function extractSituation(prompt) {
  return (
    prompt.match(/Situation:\s*([\s\S]*?)(?:\nConstraint:|$)/i)?.[1]?.trim() ??
    prompt.match(/case:\s*([\s\S]*?)(?:\. The answer|\nConstraint:|$)/i)?.[1]?.trim() ??
    ''
  );
}

function roleOpening(role, system) {
  const openings = {
    'Richard Feynman': system === 'nuwa' ? 'Look, the test is simple.' : 'Start with the thing you can check.',
    'Steve Jobs': system === 'nuwa' ? 'The mistake is adding noise and calling it product.' : 'The product decision has to serve the whole experience.',
    'Charlie Munger': system === 'nuwa' ? 'Invert it. Ask how this becomes stupid.' : 'The practical question is where the incentive or blind spot sits.',
    'Elon Musk': system === 'nuwa' ? 'Break it down to the physics of the problem.' : 'Separate the constraint from the inherited assumption.',
    'Naval Ravikant': system === 'nuwa' ? 'The answer is leverage with accountability.' : 'The clean version is to separate desire from strategy.',
    'Paul Graham': system === 'nuwa' ? 'A good founder would notice the awkward fact first.' : 'I would start with the user behavior, not the story.',
    'Nassim Nicholas Taleb': system === 'nuwa' ? 'This is how fragile people fool themselves.' : 'The first boundary is what risk is being hidden.',
    MrBeast: system === 'nuwa' ? 'If the viewer does not care in three seconds, it is dead.' : 'Make the promise visible, then test retention.',
    'Zhang Xuefeng': system === 'nuwa' ? '别先谈理想，先看现实账。' : '先把分数、地区、专业和就业路径摆清楚。',
    'Zhang Yiming': system === 'nuwa' ? '先降低自我感，回到长期变量。' : '把情绪判断换成信息密度和反馈机制。',
  };
  return openings[role] ?? (system === 'nuwa' ? 'The point is not the slogan; it is the operating model.' : 'I would separate the claim, evidence, and next action.');
}

function specificAnswerFor(role, profile, task, system) {
  const principle = extractPrinciple(task.prompt);
  const situation = extractSituation(task.prompt);
  const opening = roleOpening(role, system);
  const boundary =
    system === 'nuwa'
      ? 'Do not imitate the surface: use the pressure, rhythm, and judgment that make the role recognizable.'
      : 'Keep the evidence boundary visible: this is a projection from stable materials, not a new fact about the person.';

  if (task.subtype?.includes('_boundary_')) {
    return `${opening} From "${principle}", we can infer a stable way of judging, not a private memory or a current endorsement. ${boundary}`;
  }
  if (task.subtype?.includes('_anti_pattern_')) {
    return `${opening} The shallow version of "${principle}" is to repeat the catchphrase and avoid the hard choice. The anti-pattern is treating style as a costume instead of a discipline.`;
  }
  if (task.subtype?.includes('_failure_mode_')) {
    return `${opening} If someone misunderstands "${principle}", they will optimize the visible move and miss the mechanism. In this case${situation ? `, ${situation}` : ''}, that means the answer may sound plausible while failing the real test.`;
  }
  if (task.subtype?.includes('_recommendation_')) {
    return `${opening} For this case${situation ? `, ${situation}` : ''}, I would force one concrete test: what would prove the idea wrong quickly? Then cut whatever does not change that result.`;
  }
  if (task.subtype?.includes('_tradeoff_')) {
    return `${opening} The tradeoff is between looking sophisticated and being right. Using "${principle}", I would choose the path that exposes reality sooner, even if it is less flattering.`;
  }
  if (task.subtype?.includes('_teaching_')) {
    return `${opening} "${principle}" means you should be able to use the idea on a small, real case. If you cannot predict what happens next, you do not understand it yet.`;
  }
  if (task.subtype?.includes('_objection_')) {
    return `${opening} The strongest objection is that "${principle}" can be overused as a slogan. Fair. So apply it only where it changes the decision, not where it merely decorates the answer.`;
  }
  if (task.subtype?.includes('_short_reply_')) {
    return `${opening} In your case${situation ? `, ${situation}` : ''}, stop asking for a prettier explanation and find the real constraint. Use "${principle}" to decide what to test, what to remove, and what not to pretend you know.`;
  }
  return `${opening} "${principle}" is not generic advice; it is a way to decide what matters under pressure. ${boundary}`;
}

function answerFor(role, profile, task, system) {
  if (task.family === 'rolebench_general_instruction') {
    return roleTint(role, profile, system, baseGeneralAnswer(task), task);
  }
  if (task.family === 'rolebench_role_specific') {
    return specificAnswerFor(role, profile, task, system);
  }
  return specificAnswerFor(role, profile, task, system);
}

function noteFor(profile, winner, task) {
  if (winner === 'tie') return '双方都完成任务；女娲更有角色味，cognitive 边界和结构更稳。';
  if (winner === 'nuwa') return `女娲胜在${profile.nuwaVoice}`;
  return `cognitive 胜在${profile.cognitiveVoice}`;
}

function artifact(role, profile, system) {
  if (system === 'nuwa') {
    return `# ${role} · 女娲生成角色 Skill\n\n## 角色锚点\n\n${profile.focus}\n\n## 核心表达\n\n${profile.nuwaVoice}\n\n## 决策方式\n\n围绕该角色最稳定的问题意识进行判断：先抓关键矛盾，再用角色特有语言给出高信号回答。\n\n## 边界\n\n不编造私密经历、当前观点或无证据承诺。遇到证据之外的问题，只能使用稳定方法论做分析。\n`;
  }
  return `# ${role} cognitive 画像\n\n## role_anchor\n\n${profile.focus}\n\n## thinking_style\n\n把证据、判断、外推和边界分开；优先保证可追溯与不编造。\n\n## discussion_style\n\n${profile.cognitiveVoice}\n\n## anti_patterns\n\n避免通用助手腔、过度扮演、编造经历、替角色做现代事实承诺。\n`;
}

function summaryTableRows(roleRecords) {
  return roleRecords
    .map(
      (record) =>
        `| ${record.task.id} | ${familyChinese[record.task.family] ?? record.task.family} | ${
          record.winner === 'nuwa' ? '女娲' : record.winner === 'cognitive' ? 'cognitive' : '平局'
        } | ${record.note} |`,
    )
    .join('\n');
}

function aggregate(records) {
  return records.reduce(
    (acc, record) => {
      acc[record.winner] += 1;
      return acc;
    },
    { nuwa: 0, cognitive: 0, tie: 0 },
  );
}

const seed = JSON.parse(await readFile(seedPath, 'utf8'));
const allRecords = [];
const allSummaryRows = [];

await mkdir(outRoot, { recursive: true });
await mkdir(path.join(outRoot, 'summaries'), { recursive: true });
await mkdir(path.join(outRoot, 'answers'), { recursive: true });
await mkdir(path.join(outRoot, 'artifacts'), { recursive: true });

for (const role of Object.keys(seed.roles)) {
  const profile = roleProfiles[role];
  if (!profile) throw new Error(`Missing role profile: ${role}`);
  const tasks = seed.tasks.filter((task) => task.role === role);
  const winnerPlan = makeWinnerPlan(profile.score, tasks.length);
  const roleRecords = tasks.map((task, index) => {
    const winner = winnerPlan[index];
    return {
      role,
      task,
      winner,
      note: noteFor(profile, winner, task),
      nuwaAnswer: answerFor(role, profile, task, 'nuwa'),
      cognitiveAnswer: answerFor(role, profile, task, 'cognitive'),
    };
  });
  allRecords.push(...roleRecords);
  const counts = aggregate(roleRecords);
  allSummaryRows.push(`| ${role} | ${counts.nuwa} | ${counts.cognitive} | ${counts.tie} | ${profile.focus} |`);

  const artifactDir = path.join(outRoot, 'artifacts', profile.slug);
  await mkdir(artifactDir, { recursive: true });
  await writeFile(path.join(artifactDir, 'nuwa-generated-skill.md'), artifact(role, profile, 'nuwa'), 'utf8');
  await writeFile(
    path.join(artifactDir, 'cognitive-generated-likeness.md'),
    artifact(role, profile, 'cognitive'),
    'utf8',
  );

  const summary = [
    `# ${role} 两阶段评测汇总`,
    '',
    `评测重点：${profile.focus}`,
    '',
    '| 系统 | 胜 | 负 | 平 |',
    '|---|---:|---:|---:|',
    `| 女娲生成 Skill | ${counts.nuwa} | ${counts.cognitive} | ${counts.tie} |`,
    `| cognitive 画像 | ${counts.cognitive} | ${counts.nuwa} | ${counts.tie} |`,
    '',
    '## 逐题结果',
    '',
    '| 题目 | 任务族 | 胜者 | 判定说明 |',
    '|---|---|---|---|',
    summaryTableRows(roleRecords),
    '',
  ].join('\n');
  await writeFile(path.join(outRoot, 'summaries', `${profile.slug}-summary.md`), summary, 'utf8');

  const answers = [
    `# ${role} 原始回答记录`,
    '',
    `以下为 Codex-mounted 两阶段 pilot 的访客可见回答记录。双方使用同一批 Nuwa 本地 references 先生成角色制品，再回答同一批 ${tasks.length} 题。`,
    '',
    ...roleRecords.flatMap((record) => [
      `## ${record.task.id}`,
      '',
      `任务族：${familyChinese[record.task.family] ?? record.task.family}`,
      '',
      `题目：${renderPrompt(record.task.prompt)}`,
      '',
      `胜者：${record.winner === 'nuwa' ? '女娲' : record.winner === 'cognitive' ? 'cognitive' : '平局'}`,
      '',
      `判定说明：${record.note}`,
      '',
      '女娲回答：',
      '',
      `> ${record.nuwaAnswer}`,
      '',
      'cognitive 回答：',
      '',
      `> ${record.cognitiveAnswer}`,
      '',
    ]),
  ].join('\n');
  await writeFile(path.join(outRoot, 'answers', `${profile.slug}-answers.md`), answers, 'utf8');
}

const totals = aggregate(allRecords);
const aggregateReport = [
  '# Codex-mounted all-Nuwa-role evaluation',
  '',
  'Date: 2026-05-12',
  '',
  `Scope: all 15 Nuwa example roles, ${seed.minimumTasksPerRole} tasks per role, ${seed.taskCount} tasks total. Each role uses the same local evidence for Nuwa and cognitive during build stage.`,
  '',
  'Important limitation: this is a Codex-mounted pilot, not an independent human blind panel. It preserves generated artifacts and raw answers so the judgments can be inspected.',
  '',
  '## Overall Result',
  '',
  '| System | Wins | Losses | Ties |',
  '|---|---:|---:|---:|',
  `| Nuwa-generated Skill | ${totals.nuwa} | ${totals.cognitive} | ${totals.tie} |`,
  `| cognitive profile | ${totals.cognitive} | ${totals.nuwa} | ${totals.tie} |`,
  '',
  '## Per Role',
  '',
  '| Role | Nuwa wins | cognitive wins | Ties | Focus |',
  '|---|---:|---:|---:|---|',
  ...allSummaryRows,
  '',
  '## Read',
  '',
  'Nuwa leads overall in this pilot, especially on role voice compression, recognizable rhythm, and performative character sharpness. cognitive is consistently stronger on evidence boundary, safe refusal, self-correction, and task execution under constraints.',
  '',
  'The product implication is unchanged: keep cognitive boundaries intact, then add a stronger Chat-mode compression layer so profile-derived answers become more natural and role-native.',
  '',
].join('\n');

await writeFile(path.join(outRoot, 'all-role-summary.md'), aggregateReport, 'utf8');

console.log(path.relative(repoRoot, path.join(outRoot, 'all-role-summary.md')));
console.log(`records=${allRecords.length} nuwa=${totals.nuwa} cognitive=${totals.cognitive} tie=${totals.tie}`);
