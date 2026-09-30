/* Measures the engine against the hand-labelled resumes. Run: node tests/evaluate.js */
const fs = require('fs'), path = require('path');
const E = require('../src/engine.js');
const labels = require('./labels.json');
let tp = 0, fp = 0, fn = 0; const rows = [];
for (const [file, lab] of Object.entries(labels)) {
  const text = fs.readFileSync(path.join(__dirname, 'resumes', file), 'utf8');
  const r = E.analyze(text, { role: lab.role });
  const got = new Set(E.findSkills(text)), exp = new Set(lab.skills);
  const t = [...got].filter(s => exp.has(s)), f = [...got].filter(s => !exp.has(s)), m = [...exp].filter(s => !got.has(s));
  tp += t.length; fp += f.length; fn += m.length;
  rows.push({ file, role: lab.role, score: r.score, grade: r.grade, issues: r.issues.length, words: r.stats.words, falsePos: f, missed: m });
}
const P = tp / (tp + fp), R = tp / (tp + fn), F1 = 2 * P * R / (P + R);
console.table(rows.map(r => ({ file: r.file, score: r.score, grade: r.grade, words: r.words, issues: r.issues })));
rows.forEach(r => (r.falsePos.length || r.missed.length) && console.log(r.file, 'FP:', r.falsePos, 'FN:', r.missed));
console.log(JSON.stringify({ resumes: rows.length, labelledSkills: tp + fn, tp, fp, fn, precision: +P.toFixed(3), recall: +R.toFixed(3), f1: +F1.toFixed(3) }));
fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify({ rows, tp, fp, fn, precision: P, recall: R, f1: F1 }, null, 2));
