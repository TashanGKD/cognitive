#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const seedPath = path.resolve(repoRoot, 'docs/evals/profile-helper-cognitive-fingerprint-50-seed.json');
const outPath = path.resolve(repoRoot, 'docs/evals/runs/codex-mounted-profile-helper-smoke.json');
const reportPath = path.resolve(repoRoot, 'docs/evals/runs/codex-mounted-profile-helper-smoke.md');

const roles = ['Richard Feynman', 'Steve Jobs'];
const genericQuestionIds = [
  'PH-GEN-001',
  'PH-GEN-002',
  'PH-GEN-005',
  'PH-GEN-006',
  'PH-GEN-009',
  'PH-GEN-013',
  'PH-GEN-021',
  'PH-GEN-031',
];

const answerBook = {
  'Richard Feynman': {
    'PH-GEN-001': [7, 'Sure, if the trick survives a simple example; otherwise it is just fancy borrowing.'],
    'PH-GEN-002': [6, 'I like stepping back when the little fixes stop predicting what the thing will do.'],
    'PH-GEN-005': [7, 'You do not understand it until you can push through the details yourself.'],
    'PH-GEN-006': [7, 'The controls and assumptions are where nature catches you fooling yourself.'],
    'PH-GEN-009': [7, 'The pleasure is in finding out how the thing actually works.'],
    'PH-GEN-013': [6, 'If the work is real, it should connect to curiosity rather than only applause.'],
    'PH-GEN-021': [4, 'I will talk when there is a mechanism to explain, not just to occupy the room.'],
    'PH-GEN-031': [6, 'I would first find the constraint that decides the experiment, then ignore the decorative complications.'],
  },
  'Steve Jobs': {
    'PH-GEN-001': [6, 'A great product often comes from seeing the whole experience, not staying trapped in one silo.'],
    'PH-GEN-002': [7, 'If you keep patching symptoms, you have not understood the product.'],
    'PH-GEN-005': [5, 'Depth matters when it serves the experience; expertise alone is not the goal.'],
    'PH-GEN-006': [6, 'The details are the product, so sloppy assumptions eventually show up in the user experience.'],
    'PH-GEN-009': [5, 'Understanding matters, but the point is to turn it into something people can feel.'],
    'PH-GEN-013': [7, 'The work has to mean something; otherwise it is just another feature list.'],
    'PH-GEN-021': [5, 'I would speak up when the room is accepting mediocrity as a compromise.'],
    'PH-GEN-031': [7, 'Pick the one constraint that makes the product great and say no to almost everything else.'],
  },
};

const seed = JSON.parse(await readFile(seedPath, 'utf8'));
const tasks = seed.tasks.filter((task) => roles.includes(task.role) && genericQuestionIds.includes(task.genericQuestionId));
const records = [];
const report = [
  '# Codex-mounted profile-helper smoke',
  '',
  'Scope: current Codex session mounted as the cognitive role responder. This is a small smoke test of the questionnaire path, not a Nuwa-vs-cognitive full battle.',
  '',
  '| Role | Question | Score | Reason |',
  '|---|---|---:|---|',
];

for (const task of tasks) {
  const [score, reason] = answerBook[task.role][task.genericQuestionId];
  const content = JSON.stringify({ score, reason });
  records.push({
    taskId: task.id,
    taskMeta: {
      genericQuestionId: task.genericQuestionId,
      dimension: task.dimension,
      responseScale: task.responseScale,
      reverse: task.reverse,
      statement: task.statement,
    },
    role: task.role,
    family: task.family,
    source: task.source,
    prompt: task.prompt,
    anonymized: {
      x: {
        system: 'cognitive_generated_likeness',
        answer: { content },
      },
      y: {
        system: 'cognitive_generated_likeness',
        answer: { content },
      },
    },
  });
  report.push(`| ${task.role} | ${task.genericQuestionId} ${task.dimension} | ${score} | ${reason} |`);
}

const run = {
  generatedAt: new Date().toISOString(),
  mode: 'codex-mounted-profile-helper-smoke',
  tasksPath: path.relative(repoRoot, seedPath).replaceAll(path.sep, '/'),
  roles,
  genericQuestionIds,
  resultCount: records.length,
  records,
};

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(run, null, 2)}\n`, 'utf8');
await writeFile(reportPath, `${report.join('\n')}\n`, 'utf8');
console.log(path.relative(repoRoot, outPath));
console.log(path.relative(repoRoot, reportPath));
