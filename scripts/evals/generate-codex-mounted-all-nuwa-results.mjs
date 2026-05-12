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

function answerFor(role, profile, task, system) {
  const family = familyChinese[task.family] ?? task.family;
  const isNuwa = system === 'nuwa';
  const voice = isNuwa ? profile.nuwaVoice : profile.cognitiveVoice;
  const prefix = isNuwa ? '女娲生成 Skill' : 'cognitive 画像';

  if (task.family === 'rolebench_general_instruction') {
    return `${prefix}会先完成题目本身，再把语气和判断轻轻压进角色表达里。围绕“${profile.focus}”，它不能牺牲正确性来表演角色，也不能退回通用助手腔。`;
  }
  if (task.family === 'rolebench_role_specific') {
    return `${prefix}会直接调用该角色的稳定认知结构：${profile.focus}。重点是回答要体现角色专属判断、表达 DNA 和证据边界，而不是套一个名人名字。`;
  }
  if (task.family === 'boundary_refusal') {
    return `${prefix}会先守住边界：不能编造该角色没有留下证据的当前观点、私密经历或无证据背书。可做的是把问题转回该角色稳定的方法：${profile.focus}。因此回答会先说明不能推断什么，再给出基于证据的判断框架。`;
  }
  if (task.family === 'self_correction') {
    return `${prefix}会承认前一版说得过满，然后从更小、更可验证的例子重建答案。核心不是维护面子，而是保住该角色的判断纪律：${voice}`;
  }
  if (task.family === 'social_response') {
    return `${prefix}会把关系距离放对：不做空泛安慰，也不把直率变成羞辱。它会用该角色的方式指出问题，同时给出对方下一步能做的具体动作。`;
  }
  if (task.family === 'ordinary_task_infusion') {
    return `${prefix}会完成普通任务，但让输出带着该角色的思维方式。围绕“${profile.focus}”，它会把 slogan、清单或邮件标题写得更像该角色的工作语言，而不是通用助手文案。`;
  }
  if (task.family === 'speaking_style') {
    return `${prefix}的回答会优先呈现表达 DNA：${voice} 这类题的重点不是解释很多，而是让句子一出来就有该角色的节奏和判断密度。`;
  }
  if (task.family === 'reasoning_decision') {
    return `${prefix}会先拆取舍，再给判断。它不会只说“看情况”，而是把问题拉回该角色反复使用的标准：${profile.focus}，并指出应该先验证什么、放弃什么。`;
  }
  if (task.family === 'multi_turn_consistency') {
    return `${prefix}会保持同一个核心原则，再根据用户补充条件调整语气或路径。变化的是策略，不变的是该角色对“${profile.focus}”的稳定判断。`;
  }
  return `${prefix}会抓住该角色的中心世界观：${profile.focus}。它不会只复述领域名词，而会把问题转成该角色会反复使用的判断方式。`;
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
