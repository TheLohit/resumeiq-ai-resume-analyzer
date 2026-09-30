const test = require('node:test'), assert = require('node:assert');
const fs = require('fs'), path = require('path');
const E = require('../src/engine.js');
const load = f => fs.readFileSync(path.join(__dirname, 'resumes', f), 'utf8');

test('T01 skills: detects aliases (nodejs, sklearn, GitHub Actions)', () => {
  const s = E.findSkills('Used nodejs, sklearn and GitHub Actions daily');
  ['Node.js', 'Scikit-learn', 'CI/CD'].forEach(k => assert.ok(s.includes(k), k));
});
test('T02 skills: "Java" is not matched inside "JavaScript"', () => {
  const s = E.findSkills('Wrote JavaScript only');
  assert.ok(s.includes('JavaScript') && !s.includes('Java'));
});
test('T03 skills: github.com URL is not counted as a GitHub skill', () => {
  assert.ok(!E.findSkills('see github.com/user').includes('GitHub'));
});
test('T04 skills: C++ and C# are recognised', () => {
  const s = E.findSkills('C++ and C# projects');
  assert.ok(s.includes('C++') && s.includes('C#'));
});
test('T05 empty input returns empty result, not a crash', () => {
  for (const x of ['', '   \n  ', null, undefined]) assert.strictEqual(E.analyze(x).empty, true);
});
test('T06 strong resume scores higher than weak resume', () => {
  const a = E.analyze(load('01_strong_genai.txt'), { role: 'Generative AI Developer' }).score;
  const b = E.analyze(load('03_weak_messy.txt'), { role: 'Web Developer' }).score;
  assert.ok(a >= 80 && b < 40 && a > b + 40, `${a} vs ${b}`);
});
test('T07 seeded spelling mistakes are detected', () => {
  const r = E.analyze(load('03_weak_messy.txt'));
  const w = r.issues.filter(i => i.type === 'spelling').map(i => i.text.toLowerCase());
  ['experiance', 'responsable', 'managment'].forEach(k => assert.ok(w.includes(k), k));
});
test('T08 repeated word "the the" is detected', () => {
  assert.ok(E.analyze(load('03_weak_messy.txt')).issues.some(i => i.type === 'repeat'));
});
test('T09 clean resume has zero language issues', () => {
  assert.strictEqual(E.analyze(load('01_strong_genai.txt')).issues.length, 0);
});
test('T10 missing contact details are reported', () => {
  const r = E.analyze(load('03_weak_messy.txt'));
  assert.ok(r.breakdown[0].score < 10 && r.tips.some(t => /phone/i.test(t)));
});
test('T11 job description changes the target skills', () => {
  const jd = 'We need Kubernetes, Terraform, Docker, AWS and Python experience. Kubernetes is key. Terraform required.';
  const r = E.analyze(load('07_devops.txt'), { role: 'Web Developer', jd });
  assert.strictEqual(r.source, 'job description');
  assert.ok(r.skills.matched.includes('Kubernetes'));
});
test('T12 weak opener "Responsible for" is flagged', () => {
  assert.ok(E.analyze(load('04_data_analyst.txt')).issues.some(i => i.type === 'weak'));
});
test('T13 PDF-style bullet symbols are treated as bullets and as a format warning', () => {
  const r = E.analyze(load('06_symbols_spacing.txt'), { role: 'Software Developer' });
  assert.ok(r.stats.bullets >= 5);
  assert.ok(r.breakdown[4].notes.some(n => /symbols/i.test(n)));
});
test('T14 very short resume receives a length warning', () => {
  const r = E.analyze(load('05_fresher_short.txt'));
  assert.ok(r.tips.some(t => /short/i.test(t)));
});
test('T15 score is always between 0 and 100', () => {
  for (const f of fs.readdirSync(path.join(__dirname, 'resumes'))) {
    const s = E.analyze(load(f)).score; assert.ok(s >= 0 && s <= 100, f);
  }
});
test('T16 hostile input (HTML/script, 200k chars) does not crash and finishes fast', () => {
  const evil = '<script>alert(1)</script> ' + 'python '.repeat(30000);
  const t0 = Date.now(); const r = E.analyze(evil);
  assert.ok(r.score >= 0 && Date.now() - t0 < 3000);
});
test('T17 issue offsets point at the flagged text', () => {
  const t = load('03_weak_messy.txt');
  E.analyze(t).issues.forEach(i => assert.strictEqual(t.slice(i.start, i.end), i.text));
});
