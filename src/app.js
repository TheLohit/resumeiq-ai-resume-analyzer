(function () {
  const $ = id => document.getElementById(id);
  const E = window.ResumeEngine;
  const roleSel = $('role'), ta = $('resume'), status = $('status');
  let last = null;

  Object.keys(E.ROLES).forEach(r => roleSel.add(new Option(r, r)));

  const escapeHtml = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const say = (m, bad) => { status.textContent = m; status.style.color = bad ? 'var(--bad)' : ''; };

  /* ---------- File reading (parsers load on demand from cdnjs) ---------- */
  const loadScript = src => new Promise((ok, no) => {
    const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Could not load ' + src)); document.head.appendChild(s);
  });
  async function readPdf(buf) {
    if (!window.pdfjsLib) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise; let out = '';
    for (let p = 1; p <= pdf.numPages; p++) {
      const items = (await (await pdf.getPage(p)).getTextContent()).items; let y = null;
      for (const it of items) {
        const ny = Math.round(it.transform[5]);
        if (y !== null && Math.abs(ny - y) > 2) out += '\n';
        out += it.str + (it.hasEOL ? '\n' : ''); y = ny;
      }
      out += '\n';
    }
    return out;
  }
  async function readDocx(buf) {
    if (!window.mammoth) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
    return (await mammoth.extractRawText({ arrayBuffer: buf })).value;
  }
  $('file').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) return say('File is larger than 5 MB.', true);
    say('Reading ' + f.name + '...');
    try {
      const ext = f.name.split('.').pop().toLowerCase();
      ta.value = ext === 'pdf' ? await readPdf(await f.arrayBuffer())
        : ext === 'docx' ? await readDocx(await f.arrayBuffer()) : await f.text();
      say('Loaded ' + f.name + '. Check the text, then press Analyze.'); run();
    } catch (err) { say('Could not read that file (' + err.message + '). Paste the text instead.', true); }
    e.target.value = '';
  });

  /* ---------- Rendering ---------- */
  function markup(text, issues) {
    let html = '', pos = 0;
    for (const i of issues) {
      if (i.start < pos) continue;
      html += escapeHtml(text.slice(pos, i.start)) +
        `<mark class="i-${i.type}" title="${escapeHtml(i.message + ' -> ' + i.fix)}">${escapeHtml(text.slice(i.start, i.end) || ' ')}</mark>`;
      pos = i.end;
    }
    return html + escapeHtml(text.slice(pos));
  }
  const chips = (arr, cls) => arr.length ? `<ul class="chips">${arr.map(s => `<li class="${cls}">${escapeHtml(s)}</li>`).join('')}</ul>` : '<p>None</p>';

  function run() {
    const text = ta.value;
    const r = E.analyze(text, { role: roleSel.value, jd: $('jd').value });
    last = { text, r };
    $('empty').hidden = !r.empty ? true : false;
    $('result').hidden = !!r.empty;
    if (r.empty) { $('empty').textContent = r.tips[0]; $('empty').hidden = false; $('fix').disabled = true; return; }

    $('sc').textContent = r.score; $('gr').textContent = r.grade;
    $('src').textContent = 'Skills compared with the ' + r.source;
    $('bars').innerHTML = r.breakdown.map(b =>
      `<div class="bar"><b><span>${b.name}</span><span>${b.score} / ${b.max}</span></b><i><span style="width:${b.score / b.max * 100}%"></span></i><small>${escapeHtml(b.notes.join('. '))}</small></div>`).join('');
    $('legend').innerHTML = '<span><mark class="i-spelling">spelling / repeat</mark></span><span><mark class="i-pronoun">weak wording</mark></span><span><mark class="i-case">capitalisation / spacing</mark></span><span>Hover a highlight for the fix</span>';
    $('marked').innerHTML = markup(text, r.issues);
    $('t-skills').innerHTML =
      `<h3>Matched skills (${r.skills.matched.length})</h3>${chips(r.skills.matched, 'ok')}` +
      `<h3>Missing skills (${r.skills.missing.length})</h3><p>Add only what you truly know.</p>${chips(r.skills.missing, 'no')}` +
      (r.skills.extraKeywords.length ? `<h3>Other keywords in the job description</h3>${chips(r.skills.extraKeywords, 'ex')}` : '') +
      `<h3>All skills detected (${r.skills.found.length})</h3>${chips(r.skills.found, 'ex')}`;
    $('t-tips').innerHTML = `<ol class="tips">${(r.tips.length ? r.tips : ['Nothing major to fix. Tailor keywords for each job.']).map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ol>`;
    $('fix').disabled = !r.issues.some(i => SAFE.has(i.type));
  }

  /* ---------- Safe auto-fixes: only mechanical changes, never rewrites ---------- */
  const SAFE = new Set(['spelling', 'repeat', 'case', 'spacing']);
  $('fix').addEventListener('click', () => {
    if (!last) return;
    let t = last.text;
    last.r.issues.filter(i => SAFE.has(i.type)).sort((a, b) => b.start - a.start)
      .forEach(i => { t = t.slice(0, i.start) + i.fix + t.slice(i.end); });
    ta.value = t; say('Applied spelling, repeated-word, capitalisation and spacing fixes. Wording changes are left to you.'); run();
  });

  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
    ['mark', 'skills', 'tips'].forEach(k => $('t-' + k).hidden = k !== b.dataset.t);
  }));
  $('go').addEventListener('click', () => { say(''); run(); });
  $('s-good').addEventListener('click', () => { say(''); ta.value = SAMPLES.good; roleSel.value = 'Generative AI Developer'; run(); });
  $('s-bad').addEventListener('click', () => { say(''); ta.value = SAMPLES.bad; roleSel.value = 'Web Developer'; run(); });
  roleSel.addEventListener('change', () => ta.value.trim() && run());
})();
