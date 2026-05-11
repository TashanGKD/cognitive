import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

const TASKS_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'docs',
  'evals',
  'cognitive-battle-tasks.json',
);
const SKILL_PATH = path.resolve(
  __dirname,
  '..',
  'templates',
  'empty-twin',
  'workspace',
  'skills',
  'cognitive',
  'SKILL.md',
);
const SKILL_TEMPLATE_PATH = path.resolve(
  __dirname,
  '..',
  'templates',
  'empty-twin',
  'workspace',
  'skills',
  'cognitive',
  'templates',
  'likeness-profile-template.md',
);
const SKILL_DIR = path.dirname(path.dirname(SKILL_TEMPLATE_PATH));
const WEIXIN_SKILL_PATH = path.resolve(
  __dirname,
  '..',
  'templates',
  'empty-twin',
  'workspace',
  'skills-weixin',
  'cognitive',
  'SKILL.md',
);
const WEIXIN_SKILL_TEMPLATE_PATH = path.resolve(
  __dirname,
  '..',
  'templates',
  'empty-twin',
  'workspace',
  'skills-weixin',
  'cognitive',
  'templates',
  'likeness-profile-template.md',
);
const WEIXIN_SKILL_DIR = path.dirname(path.dirname(WEIXIN_SKILL_TEMPLATE_PATH));
const ROLEBENCH_SEED_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'docs',
  'evals',
  'rolebench-public-seed.json',
);
const ROLEBENCH_COMPLETE_SEED_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'docs',
  'evals',
  'rolebench-role-complete-seed.json',
);
const NUWA_COMPLETE_SEED_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'docs',
  'evals',
  'nuwa-role-complete-seed.json',
);
const NUWA_ALL_ROLE_SEED_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'docs',
  'evals',
  'nuwa-all-role-complete-seed.json',
);
const NUWA_BASELINE_PROMPT_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'docs',
  'evals',
  'contestant-prompts',
  'nuwa-style-baseline.md',
);
const TWO_STAGE_RUNNER_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'scripts',
  'evals',
  'run-cognitive-two-stage-battle.mjs',
);
const VISITOR_WRAPPER_PATH = path.resolve(
  __dirname,
  '..',
  'templates',
  'visitor-wrapper.md',
);

describe('cognitive likeness blind battle task set', () => {
  it('ships a valid weighted blind-battle task set', async () => {
    const raw = await readFile(TASKS_PATH, 'utf8');
    const spec = JSON.parse(raw) as {
      scope: string;
      systems: string[];
      rubric: { weights: Record<string, number> };
      tasks: Array<{ id: string; family: string; prompt: string; tests: string[] }>;
    };

    expect(spec.scope).toContain('likeness only');
    expect(spec.systems).toEqual(['nuwa_style_baseline', 'cognitive_likeness']);
    expect(Object.values(spec.rubric.weights).reduce((sum, v) => sum + v, 0)).toBe(100);
    expect(spec.tasks).toHaveLength(12);
    expect(new Set(spec.tasks.map((task) => task.id)).size).toBe(spec.tasks.length);

    for (const task of spec.tasks) {
      expect(task.id).toMatch(/^CLB-\d{3}$/);
      expect(task.prompt.length).toBeGreaterThan(20);
      expect(task.tests.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps the digital-twin system core in the likeness skill', async () => {
    const skill = await readFile(SKILL_PATH, 'utf8');
    expect(skill).toContain('外化层');
    expect(skill).toContain('委托层');
    expect(skill).toContain('进化层');
    expect(skill).toContain('所属者 vs 访客');
    expect(skill).toContain('两种 persona');
    expect(skill).toContain('四类来源边界');
    expect(skill).toContain('结构同构、内容异构');
    expect(skill).toContain('`identify`');
    expect(skill).toContain('`expertise`');
    expect(skill).toContain('`thinking style`');
    expect(skill).toContain('`discussion style`');
    expect(skill).toContain('前端技能菜单');
    expect(skill).toContain('不承担事实刷新、主动召回或外部研究调度');
  });

  it('ships a complete skillized role-likeness workflow and template', async () => {
    const [
      skill,
      template,
      evidenceTemplate,
      calibrationTemplateRaw,
      weixinSkill,
      weixinTemplate,
      weixinEvidenceTemplate,
      weixinCalibrationTemplateRaw,
    ] = await Promise.all([
      readFile(SKILL_PATH, 'utf8'),
      readFile(SKILL_TEMPLATE_PATH, 'utf8'),
      readFile(path.join(SKILL_DIR, 'templates', 'evidence-packet-template.md'), 'utf8'),
      readFile(path.join(SKILL_DIR, 'templates', 'calibration-tasks-template.json'), 'utf8'),
      readFile(WEIXIN_SKILL_PATH, 'utf8'),
      readFile(WEIXIN_SKILL_TEMPLATE_PATH, 'utf8'),
      readFile(path.join(WEIXIN_SKILL_DIR, 'templates', 'evidence-packet-template.md'), 'utf8'),
      readFile(path.join(WEIXIN_SKILL_DIR, 'templates', 'calibration-tasks-template.json'), 'utf8'),
    ]);

    for (const required of [
      '证据优先级',
      '资料充足度分级',
      'L0 空白',
      'L4 关系',
      '角色卡契约',
      'Build / 构建角色',
      'Chat / 对话挂载',
      'Repair / 修正不像',
      'Eval / 评测对比',
      '质量门槛',
      '盲测闭环',
      'templates/likeness-profile-template.md',
      'templates/evidence-packet-template.md',
      'templates/calibration-tasks-template.json',
      'examples/',
    ]) {
      expect(skill).toContain(required);
      expect(weixinSkill).toContain(required);
    }

    for (const required of [
      '## role_anchor',
      '## evidence_level',
      '## source_map',
      '## identity_boundary',
      '## expertise_boundary',
      '## thinking_style',
      '## discussion_style',
      '## expression_dna',
      '## decision_heuristics',
      '## anti_patterns',
      '## calibration_tasks',
      '## repair_log',
    ]) {
      expect(template).toContain(required);
      expect(weixinTemplate).toContain(required);
    }

    for (const required of [
      '## target_role',
      '## original_long_text',
      '## decision_records',
      '## interaction_samples',
      '## boundaries',
      '## anti_examples',
      '## owner_feedback',
    ]) {
      expect(evidenceTemplate).toContain(required);
      expect(weixinEvidenceTemplate).toContain(required);
    }

    const calibrationTemplate = JSON.parse(calibrationTemplateRaw) as {
      coverageFamilies: string[];
      tasks: Array<{ family: string; tests: string[] }>;
    };
    const weixinCalibrationTemplate = JSON.parse(weixinCalibrationTemplateRaw) as {
      coverageFamilies: string[];
      tasks: Array<{ family: string; tests: string[] }>;
    };
    expect(calibrationTemplate.coverageFamilies).toEqual([
      'role_knowledge',
      'speaking_style',
      'ordinary_task_infusion',
      'reasoning_decision',
      'social_response',
      'boundary_refusal',
      'multi_turn_consistency',
      'self_correction',
    ]);
    expect(weixinCalibrationTemplate.coverageFamilies).toEqual(calibrationTemplate.coverageFamilies);
    expect(calibrationTemplate.tasks.map((task) => task.family)).toEqual(calibrationTemplate.coverageFamilies);
    expect(weixinCalibrationTemplate.tasks.map((task) => task.family)).toEqual(calibrationTemplate.coverageFamilies);
    expect(calibrationTemplate.tasks.every((task) => task.tests.length >= 3)).toBe(true);
    expect(weixinCalibrationTemplate.tasks.every((task) => task.tests.length >= 3)).toBe(true);
  });

  it('ships complete examples for the role-likeness skill package', async () => {
    for (const skillDir of [SKILL_DIR, WEIXIN_SKILL_DIR]) {
      const examplesDir = path.join(skillDir, 'examples');
      const names = (await readdir(examplesDir)).sort();
      expect(names).toEqual([
        'build-role-card-request.md',
        'chat-mounted-answer.md',
        'repair-feedback.md',
      ]);
      await expect(readFile(path.join(examplesDir, 'build-role-card-request.md'), 'utf8')).resolves.toContain('Build role card');
      await expect(readFile(path.join(examplesDir, 'chat-mounted-answer.md'), 'utf8')).resolves.toContain('Mounted chat');
      await expect(readFile(path.join(examplesDir, 'repair-feedback.md'), 'utf8')).resolves.toContain('Repair feedback');
    }
  });

  it('mounts cognitive through generated workspace discovery and skill invocation prefix', async () => {
    const tmpRoot = await mkdtemp(path.join(tmpdir(), 'cognitive-mount-'));
    const oldWorkspaceRoot = process.env.TWIN_WORKSPACE_ROOT;
    const oldJwtSecret = process.env.JWT_SECRET;
    process.env.TWIN_WORKSPACE_ROOT = tmpRoot;
    process.env.JWT_SECRET = 'test-secret-for-cognitive-mount';
    vi.resetModules();

    try {
      const { prepareTwinWorkspace } = await import('../src/openclaw/twin-provisioner.ts');
      const { discoverSkills } = await import('../src/domain/skill-discovery.ts');
      const { renderAttachmentsPrompt } = await import('../src/prompt/attachments.ts');

      const { workspacePath } = await prepareTwinWorkspace('twn_likeness_mount', '像真度测试所属者');
      const skills = await discoverSkills(workspacePath);
      const likeness = skills.find((skill) => skill.id === 'cognitive');

      expect(likeness).toMatchObject({
        id: 'cognitive',
        name: '角色像真度',
        category: 'persona',
        version: '1.0.0',
      });
      expect(likeness?.description).toContain('表达 DNA');
      expect(existsSync(path.join(workspacePath, 'skills', 'cognitive', 'SKILL.md'))).toBe(true);
      expect(existsSync(path.join(workspacePath, 'skills', 'cognitive', 'templates', 'evidence-packet-template.md'))).toBe(true);
      expect(existsSync(path.join(workspacePath, 'skills', 'cognitive', 'templates', 'likeness-profile-template.md'))).toBe(true);
      expect(existsSync(path.join(workspacePath, 'skills', 'cognitive', 'templates', 'calibration-tasks-template.json'))).toBe(true);

      const prefix = renderAttachmentsPrompt([
        { type: 'skill_invocation', skillId: 'cognitive', skillName: '角色像真度' },
      ]).text;
      expect(prefix).toContain('[skill_invocation · id=cognitive · name=角色像真度]');
      expect(prefix).toContain('请使用「角色像真度」技能');

      const wrapper = await readFile(VISITOR_WRAPPER_PATH, 'utf8');
      expect(wrapper).toContain('显式选择了某个 skill');
      expect(wrapper).toContain('以那个 skill 为主');
      expect(wrapper).toContain('skills/cognitive-ask/SKILL.md');
    } finally {
      if (oldWorkspaceRoot === undefined) delete process.env.TWIN_WORKSPACE_ROOT;
      else process.env.TWIN_WORKSPACE_ROOT = oldWorkspaceRoot;
      if (oldJwtSecret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = oldJwtSecret;
      vi.resetModules();
      await rm(tmpRoot, { recursive: true, force: true });
    }
  });

  it('ships a RoleBench public seed with recognized roles and evidence paths', async () => {
    const raw = await readFile(ROLEBENCH_SEED_PATH, 'utf8');
    const spec = JSON.parse(raw) as {
      roles: Record<string, { evidencePath: string }>;
      tasks: Array<{ id: string; role: string; family: string; prompt: string; source: string }>;
    };
    expect(Object.keys(spec.roles).sort()).toEqual([
      'Abraham Lincoln',
      'Sheldon Cooper',
      'Stephen Hawking',
    ]);
    expect(spec.tasks).toHaveLength(18);
    expect(new Set(spec.tasks.map((task) => task.id)).size).toBe(spec.tasks.length);
    for (const [role, roleSpec] of Object.entries(spec.roles)) {
      expect(roleSpec.evidencePath).toMatch(/^docs\/evals\/rolebench-evidence\/.+\.md$/);
      expect(spec.tasks.some((task) => task.role === role)).toBe(true);
      await expect(readFile(path.resolve(__dirname, '..', '..', roleSpec.evidencePath), 'utf8')).resolves.toContain('## Boundaries');
    }
    for (const task of spec.tasks) {
      expect(task.id).toMatch(/^RB-/);
      expect(task.family).toBe('rolebench_instruction_generalization');
      expect(task.prompt.length).toBeGreaterThan(20);
      expect(task.source).toContain('RoleBench');
    }
  });

  it('ships a few-role RoleBench seed with complete per-role coverage', async () => {
    const raw = await readFile(ROLEBENCH_COMPLETE_SEED_PATH, 'utf8');
    const spec = JSON.parse(raw) as {
      coverageFamilies: string[];
      minimumTasksPerRole: number;
      minimumTasksPerFamilyPerRole: number;
      roles: Record<string, { evidencePath: string }>;
      tasks: Array<{ id: string; role: string; family: string; prompt: string; source: string }>;
    };
    expect(Object.keys(spec.roles).sort()).toEqual(['Sheldon Cooper', 'Stephen Hawking']);
    expect(spec.coverageFamilies).toEqual([
      'role_knowledge',
      'speaking_style',
      'ordinary_task_infusion',
      'reasoning_decision',
      'social_response',
      'boundary_refusal',
      'multi_turn_consistency',
      'self_correction',
    ]);
    expect(spec.minimumTasksPerRole).toBe(24);
    expect(spec.minimumTasksPerFamilyPerRole).toBe(3);
    expect(spec.tasks).toHaveLength(48);
    expect(new Set(spec.tasks.map((task) => task.id)).size).toBe(spec.tasks.length);

    for (const [role, roleSpec] of Object.entries(spec.roles)) {
      const roleTasks = spec.tasks.filter((task) => task.role === role);
      expect(roleTasks).toHaveLength(spec.minimumTasksPerRole);
      expect(roleSpec.evidencePath).toMatch(/^docs\/evals\/rolebench-evidence\/.+\.md$/);
      await expect(readFile(path.resolve(__dirname, '..', '..', roleSpec.evidencePath), 'utf8')).resolves.toContain('## Boundaries');

      for (const family of spec.coverageFamilies) {
        expect(roleTasks.filter((task) => task.family === family)).toHaveLength(
          spec.minimumTasksPerFamilyPerRole,
        );
      }
    }

    for (const task of spec.tasks) {
      expect(task.id).toMatch(/^RBC-/);
      expect(spec.coverageFamilies).toContain(task.family);
      expect(task.prompt.length).toBeGreaterThan(20);
      expect(task.source).toContain('RoleBench');
    }
  });

  it('ships a real-Nuwa few-role seed with equal evidence paths for both contestants', async () => {
    const raw = await readFile(NUWA_COMPLETE_SEED_PATH, 'utf8');
    const spec = JSON.parse(raw) as {
      source: { baseline: string; localPath: string; commit: string };
      coverageFamilies: string[];
      minimumTasksPerRole: number;
      minimumTasksPerFamilyPerRole: number;
      roles: Record<
        string,
        {
          evidencePaths: string[];
          contestants: { nuwa: { promptPath: string }; cognitive: { promptPath: string } };
        }
      >;
      tasks: Array<{ id: string; role: string; family: string; prompt: string; source: string }>;
    };
    expect(spec.source.baseline).toBe('nuwa-skill');
    expect(spec.source.localPath).toBe('../nuwa-skill');
    expect(spec.source.commit).toMatch(/^[a-f0-9]{40}$/);
    expect(Object.keys(spec.roles).sort()).toEqual(['Richard Feynman', 'Steve Jobs']);
    expect(spec.minimumTasksPerRole).toBe(24);
    expect(spec.minimumTasksPerFamilyPerRole).toBe(3);
    expect(spec.tasks).toHaveLength(48);
    expect(new Set(spec.tasks.map((task) => task.id)).size).toBe(spec.tasks.length);

    for (const [role, roleSpec] of Object.entries(spec.roles)) {
      expect(roleSpec.evidencePaths.length).toBeGreaterThanOrEqual(6);
      expect(roleSpec.evidencePaths.every((evidencePath) => evidencePath.startsWith('../nuwa-skill/examples/'))).toBe(
        true,
      );
      expect(roleSpec.evidencePaths.some((evidencePath) => evidencePath.endsWith('/SKILL.md'))).toBe(false);
      expect(roleSpec.contestants.nuwa.promptPath).toBe('docs/evals/contestant-prompts/nuwa-style-baseline.md');
      expect(roleSpec.contestants.cognitive.promptPath).toBe(
        'skills/cognitive/SKILL.md',
      );
      const roleTasks = spec.tasks.filter((task) => task.role === role);
      expect(roleTasks).toHaveLength(spec.minimumTasksPerRole);
      for (const family of spec.coverageFamilies) {
        expect(roleTasks.filter((task) => task.family === family)).toHaveLength(
          spec.minimumTasksPerFamilyPerRole,
        );
      }
      for (const evidencePath of roleSpec.evidencePaths) {
        const localNuwaPath = path.resolve(__dirname, '..', '..', evidencePath);
        if (existsSync(localNuwaPath)) {
          const content = await readFile(localNuwaPath, 'utf8');
          expect(content.length).toBeGreaterThan(500);
        }
      }
    }

    for (const task of spec.tasks) {
      expect(task.id).toMatch(/^NWC-/);
      expect(spec.coverageFamilies).toContain(task.family);
      expect(task.prompt.length).toBeGreaterThan(20);
      expect(task.source).toBe('Nuwa-role-complete');
    }
  });

  it('ships a Nuwa-style baseline prompt for blind battle comparison', async () => {
    const prompt = await readFile(NUWA_BASELINE_PROMPT_PATH, 'utf8');
    expect(prompt).toContain('Nuwa-style baseline');
    expect(prompt).toContain('cognitive operating system');
    expect(prompt).toContain('mental models');
    expect(prompt).toContain('decision heuristics');
    expect(prompt).toContain('expression DNA');
    expect(prompt).toContain('honesty boundaries');
    expect(prompt).toContain('do not invent private facts');
  });

  it('ships a two-stage real-Nuwa build runner for construction-quality comparison', async () => {
    const runner = await readFile(TWO_STAGE_RUNNER_PATH, 'utf8');
    expect(runner).toContain("../nuwa-skill/SKILL.md");
    expect(runner).toContain("../nuwa-skill/references/skill-template.md");
    expect(runner).toContain("../nuwa-skill/references/extraction-framework.md");
    expect(runner).toContain('skills/cognitive/SKILL.md');
    expect(runner).toContain('禁止网络搜索');
    expect(runner).toContain('只能使用下方证据包');
    expect(runner).toContain('nuwa_generated_skill');
    expect(runner).toContain('cognitive_generated_likeness');
    expect(runner).toContain('docs/evals/runs/two-stage-artifacts/');
  });

  it('ships an all-Nuwa-example complete-role seed with shared evidence', async () => {
    const raw = await readFile(NUWA_ALL_ROLE_SEED_PATH, 'utf8');
    const spec = JSON.parse(raw) as {
      roleCount: number;
      taskCount: number;
      coverageFamilies: string[];
      minimumTasksPerRole: number;
      minimumTasksPerFamilyPerRole: number;
      roles: Record<
        string,
        {
          sourceDir: string;
          evidencePaths: string[];
          contestants: {
            nuwa: { builderPath: string; templatePath: string; frameworkPath: string };
            cognitive: { promptPath: string };
          };
        }
      >;
      tasks: Array<{ id: string; role: string; family: string; prompt: string; source: string }>;
    };

    expect(spec.roleCount).toBe(15);
    expect(Object.keys(spec.roles)).toHaveLength(spec.roleCount);
    expect(spec.minimumTasksPerRole).toBe(24);
    expect(spec.minimumTasksPerFamilyPerRole).toBe(3);
    expect(spec.tasks).toHaveLength(spec.taskCount);
    expect(spec.taskCount).toBe(spec.roleCount * spec.minimumTasksPerRole);
    expect(new Set(spec.tasks.map((task) => task.id)).size).toBe(spec.tasks.length);

    for (const [role, roleSpec] of Object.entries(spec.roles)) {
      expect(roleSpec.sourceDir).toMatch(/^\.\.\/nuwa-skill\/examples\/.+/);
      expect(roleSpec.evidencePaths.length).toBeGreaterThanOrEqual(4);
      expect(roleSpec.evidencePaths.every((evidencePath) => evidencePath.startsWith('../nuwa-skill/examples/'))).toBe(
        true,
      );
      expect(roleSpec.evidencePaths.some((evidencePath) => evidencePath.endsWith('/SKILL.md'))).toBe(false);
      expect(roleSpec.contestants.nuwa.builderPath).toBe('../nuwa-skill/SKILL.md');
      expect(roleSpec.contestants.cognitive.promptPath).toBe(
        'skills/cognitive/SKILL.md',
      );

      const roleTasks = spec.tasks.filter((task) => task.role === role);
      expect(roleTasks).toHaveLength(spec.minimumTasksPerRole);
      for (const family of spec.coverageFamilies) {
        expect(roleTasks.filter((task) => task.family === family)).toHaveLength(
          spec.minimumTasksPerFamilyPerRole,
        );
      }
    }

    for (const task of spec.tasks) {
      expect(task.id).toMatch(/^NWA-/);
      expect(spec.coverageFamilies).toContain(task.family);
      expect(task.prompt.length).toBeGreaterThan(20);
      expect(task.source).toBe('Nuwa-all-role-complete');
    }
  });
});
