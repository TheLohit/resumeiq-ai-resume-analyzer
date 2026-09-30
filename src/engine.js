/* ResumeIQ analysis engine - pure JavaScript, no dependencies.
   Works in the browser (window.ResumeEngine) and in Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ResumeEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Knowledge base ---------- */
  const SKILLS = {
    'Python': ['python'], 'Java': ['java'], 'JavaScript': ['javascript', 'js', 'ecmascript', 'es6'],
    'TypeScript': ['typescript'], 'C++': ['c++'], 'C#': ['c#'], 'Go': ['golang'], 'SQL': ['sql'],
    'R': ['r programming', 'rstudio'], 'PHP': ['php'], 'Kotlin': ['kotlin'],
    'HTML': ['html', 'html5'], 'CSS': ['css', 'css3'], 'React': ['react', 'react.js', 'reactjs'],
    'Angular': ['angular'], 'Vue': ['vue', 'vue.js'], 'Node.js': ['node.js', 'nodejs', 'node js'],
    'Express': ['express', 'express.js'], 'Django': ['django'], 'Flask': ['flask'], 'FastAPI': ['fastapi'],
    'Spring Boot': ['spring boot', 'springboot'], 'REST API': ['rest api', 'rest apis', 'restful', 'rest'],
    'Tailwind': ['tailwind', 'tailwindcss'], 'Bootstrap': ['bootstrap'], 'Next.js': ['next.js', 'nextjs'],
    'Pandas': ['pandas'], 'NumPy': ['numpy'], 'Matplotlib': ['matplotlib'], 'Excel': ['excel', 'ms excel'],
    'Power BI': ['power bi', 'powerbi'], 'Tableau': ['tableau'], 'Statistics': ['statistics', 'statistical'],
    'Data Visualization': ['data visualization', 'data visualisation'],
    'Data Cleaning': ['data cleaning', 'data wrangling', 'data preprocessing'], 'ETL': ['etl'],
    'A/B Testing': ['a/b testing', 'ab testing'],
    'Machine Learning': ['machine learning', 'ml'], 'Deep Learning': ['deep learning', 'neural network', 'neural networks'],
    'TensorFlow': ['tensorflow'], 'PyTorch': ['pytorch'], 'Scikit-learn': ['scikit-learn', 'sklearn', 'scikit learn'],
    'NLP': ['nlp', 'natural language processing'], 'Computer Vision': ['computer vision', 'opencv'],
    'LLM': ['llm', 'llms', 'large language model', 'large language models'],
    'RAG': ['rag', 'retrieval augmented generation', 'retrieval-augmented generation'],
    'LangChain': ['langchain', 'langgraph'], 'Generative AI': ['generative ai', 'genai', 'gen ai'],
    'Prompt Engineering': ['prompt engineering'], 'Vector Database': ['vector database', 'chromadb', 'faiss', 'pinecone'],
    'Streamlit': ['streamlit'],
    'MySQL': ['mysql'], 'PostgreSQL': ['postgresql', 'postgres'], 'MongoDB': ['mongodb'], 'Redis': ['redis'], 'Firebase': ['firebase'],
    'Git': ['git'], 'GitHub': ['github'], 'Docker': ['docker'], 'Kubernetes': ['kubernetes', 'k8s'],
    'AWS': ['aws', 'amazon web services'], 'Azure': ['azure'], 'GCP': ['gcp', 'google cloud'],
    'CI/CD': ['ci/cd', 'jenkins', 'github actions'], 'Linux': ['linux'], 'Terraform': ['terraform'],
    'Agile': ['agile', 'scrum'], 'Data Structures': ['data structures', 'dsa'], 'Algorithms': ['algorithms'],
    'OOP': ['oop', 'object-oriented', 'object oriented'], 'Unit Testing': ['unit testing', 'pytest', 'junit', 'jest'],
    'Communication': ['communication'], 'Leadership': ['leadership'], 'Teamwork': ['teamwork', 'team player', 'collaboration'],
    'Problem Solving': ['problem solving', 'problem-solving']
  };

  const ROLES = {
    'Software Developer': {
      core: ['Data Structures', 'Algorithms', 'OOP', 'Git', 'SQL', 'REST API', 'Unit Testing'],
      nice: ['Python', 'Java', 'JavaScript', 'Docker', 'AWS', 'Agile', 'CI/CD', 'Linux']
    },
    'Web Developer': {
      core: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Git', 'REST API'],
      nice: ['TypeScript', 'MongoDB', 'Tailwind', 'Bootstrap', 'Express', 'Next.js', 'SQL', 'Agile']
    },
    'Data Analyst': {
      core: ['SQL', 'Excel', 'Python', 'Power BI', 'Tableau', 'Statistics', 'Data Visualization', 'Pandas'],
      nice: ['Data Cleaning', 'ETL', 'A/B Testing', 'NumPy', 'Matplotlib', 'Communication']
    },
    'Machine Learning Engineer': {
      core: ['Python', 'Machine Learning', 'Deep Learning', 'Pandas', 'NumPy', 'Scikit-learn', 'Statistics', 'SQL'],
      nice: ['TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'Git', 'Docker', 'AWS']
    },
    'Generative AI Developer': {
      core: ['Python', 'Generative AI', 'LLM', 'RAG', 'LangChain', 'NLP', 'REST API', 'Git'],
      nice: ['FastAPI', 'Docker', 'Machine Learning', 'Deep Learning', 'PyTorch', 'Vector Database', 'Prompt Engineering', 'Streamlit', 'AWS']
    },
    'DevOps Engineer': {
      core: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Git', 'Terraform', 'Python'],
      nice: ['Azure', 'GCP', 'Agile', 'Redis', 'PostgreSQL']
    }
  };

  const ACTION_VERBS = new Set(('achieved automated analyzed analysed architected built collaborated configured created '
    + 'cut debugged delivered deployed designed developed directed doubled drove engineered enhanced established '
    + 'evaluated executed exceeded fine-tuned fixed founded generated implemented improved increased integrated '
    + 'introduced launched led maintained managed mentored migrated modernized optimized organized orchestrated '
    + 'owned partnered performed pioneered planned presented produced programmed published reduced refactored '
    + 'released researched resolved restructured scaled secured shipped simplified solved spearheaded streamlined '
    + 'supervised tested trained transformed upgraded visualized wrote coordinated conducted contributed '
    + 'constructed customized formulated identified initiated leveraged monitored negotiated prototyped revamped '
    + 'won awarded earned ranked taught reviewed validated').split(/\s+/));

  const WEAK_STARTS = ['responsible for', 'worked on', 'helped with', 'helped', 'assisted in', 'assisted with',
    'duties included', 'involved in', 'tasked with', 'participated in', 'was part of'];

  const SECTION_RE = {
    summary: /^(professional |career )?(summary|objective|profile)$|^about me$/i,
    experience: /^(work |professional |relevant )?(experience|history|employment)$|^internships?$/i,
    education: /^(academic |educational )?(education|qualifications?|background)$/i,
    skills: /^(technical |key |core )?(skills|competencies|technologies)( & tools)?$/i,
    projects: /^(academic |personal |key )?projects$/i,
    certifications: /^(certifications?|courses|achievements|awards|licenses)( & .*)?$/i
  };

  const MISSPELL = { recieve: 'receive', responsable: 'responsible', managment: 'management', experiance: 'experience',
    sucessful: 'successful', successfull: 'successful', acheived: 'achieved', developement: 'development',
    enviroment: 'environment', knowlege: 'knowledge', langauge: 'language', programing: 'programming',
    comunication: 'communication', profesional: 'professional', definately: 'definitely', seperate: 'separate',
    occured: 'occurred', adress: 'address', techincal: 'technical', colaborate: 'collaborate', tecnology: 'technology',
    teh: 'the', wich: 'which', thier: 'their', beleive: 'believe', implmented: 'implemented' };

  const CANON = ['JavaScript', 'TypeScript', 'GitHub', 'MySQL', 'MongoDB', 'PostgreSQL', 'TensorFlow', 'PyTorch',
    'LinkedIn', 'HTML', 'CSS', 'Python', 'SQL', 'AWS', 'API', 'FastAPI', 'LangChain'];

  const STOP = new Set(('the a an and or of to in for with on at by from as is are be will we you your our this that it '
    + 'their they them have has had can able must should strong good work working experience years year team teams '
    + 'using use used role job candidate required preferred plus knowledge skills ability looking about into across '
    + 'such including other more well new high based within us its etc also').split(/\s+/));

  /* ---------- Helpers ---------- */
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const aliasRe = a => new RegExp('(?<![A-Za-z0-9+#])' + esc(a) + '(?![A-Za-z0-9+#]|\\.[A-Za-z])', 'i');
  const SKILL_RES = Object.entries(SKILLS).map(([name, al]) => [name, al.map(aliasRe)]);

  function findSkills(text) {
    const out = [];
    for (const [name, res] of SKILL_RES) if (res.some(r => r.test(text))) out.push(name);
    return out;
  }

  function splitLines(text) {
    const lines = []; let pos = 0;
    for (const raw of text.split('\n')) { lines.push({ raw, start: pos }); pos += raw.length + 1; }
    return lines;
  }

  const BULLET_RE = /^(\s*)([-•*–▪●◦➢>\uF000-\uF8FF]|\d+\.)\s+/;

  function detectSections(lines) {
    const found = {}; let current = null;
    lines.forEach((l, i) => {
      const t = l.raw.trim().replace(/[:\-–—_=]+$/g, '').trim();
      l.section = current;
      if (!t || t.length > 40) return;
      for (const [k, re] of Object.entries(SECTION_RE)) {
        if (re.test(t)) { found[k] = i; current = k; l.isHeader = true; l.section = k; break; }
      }
    });
    return found;
  }

  function extractBullets(lines) {
    const bullets = [];
    for (const l of lines) {
      if (l.isHeader) continue;
      const m = l.raw.match(BULLET_RE);
      if (m) bullets.push({ text: l.raw.slice(m[0].length).trim(), start: l.start + m[0].length });
      else if ((l.section === 'experience' || l.section === 'projects') && l.raw.trim().split(/\s+/).length >= 7)
        bullets.push({ text: l.raw.trim(), start: l.start + (l.raw.length - l.raw.trimStart().length) });
    }
    return bullets;
  }

  const hasNumber = s => {
    const t = s.replace(/\b(19|20)\d{2}\b/g, '');
    return /\d+(\.\d+)?\s?(%|x\b|k\b|m\b|\+)|[$₹€£]\s?\d|\b\d{2,}\b|\b(one|two|three|four|five|ten|twenty|hundred|thousand|million)\b/i.test(t);
  };

  /* ---------- Language checks ---------- */
  function languageIssues(text, bullets) {
    const issues = [];
    const add = (type, m, message, fix, weight) =>
      issues.push({ type, start: m.index, end: m.index + m[0].length, text: m[0], message, fix, weight });
    let m, re;

    re = /\b([A-Za-z]{2,})\s+\1\b/gi;
    while ((m = re.exec(text))) add('repeat', m, 'Repeated word', m[1], 2);

    re = /\b[A-Za-z]+\b/g;
    while ((m = re.exec(text))) {
      const fix = MISSPELL[m[0].toLowerCase()];
      if (fix) add('spelling', m, `Possible misspelling of "${fix}"`, fix, 2);
    }

    re = /\bi\b(?![./'-])/g;
    while ((m = re.exec(text))) add('pronoun', m, 'Lowercase "i"; also avoid first person in resumes', 'Remove the pronoun and start with a verb', 1.5);
    re = /\b(I|My|my|Me|me)\b/g;
    while ((m = re.exec(text))) add('pronoun', m, 'Avoid first-person pronouns in a resume', 'Start the sentence with an action verb', 1);

    for (const w of CANON) {
      re = new RegExp('(?<![\\w/@.-])' + esc(w) + '(?![\\w@-]|\\.[a-z]|/)', 'gi');
      while ((m = re.exec(text))) if (m[0] !== w) add('case', m, `Write as "${w}"`, w, 0.5);
    }
    re = /\bnodejs\b/gi;
    while ((m = re.exec(text))) add('case', m, 'Write as "Node.js"', 'Node.js', 0.5);

    re = /\b(was|were|been|being)\s+\w+(ed|built|made|written|done|given|taken)\s+by\b/gi;
    while ((m = re.exec(text))) add('passive', m, 'Passive voice weakens impact', 'Use active voice: "Built X" instead of "X was built by me"', 1);

    re = /(?<=\S) {2,}(?=\S)/g;
    let spaces = 0;
    while ((m = re.exec(text)) && spaces++ < 5) add('spacing', m, 'Extra spaces', ' ', 0.5);
    re = /,(?=[A-Za-z])/g;
    while ((m = re.exec(text))) add('spacing', m, 'Missing space after comma', ', ', 0.5);

    for (const b of bullets) {
      const low = b.text.toLowerCase();
      const weak = WEAK_STARTS.find(w => low.startsWith(w));
      if (weak) issues.push({ type: 'weak', start: b.start, end: b.start + weak.length, text: b.text.slice(0, weak.length),
        message: `Weak opener "${weak}"`, fix: 'Begin with a strong verb such as Built, Led, Automated or Reduced', weight: 1 });
      else if (/^[a-z]/.test(b.text)) issues.push({ type: 'case', start: b.start, end: b.start + 1, text: b.text[0],
        message: 'Bullet should start with a capital letter', fix: b.text[0].toUpperCase(), weight: 0.5 });
    }
    return issues.sort((a, b) => a.start - b.start);
  }

  /* ---------- Main analysis ---------- */
  function analyze(text, opts) {
    opts = opts || {};
    const role = ROLES[opts.role] ? opts.role : 'Software Developer';
    text = (text || '').replace(/\r\n?/g, '\n');
    const words = (text.match(/\b[\w'+#.-]+\b/g) || []).length;
    const lines = splitLines(text);
    const sections = detectSections(lines);
    const bullets = extractBullets(lines);
    const breakdown = [];
    const tips = [];

    if (words < 30) {
      return { empty: true, score: 0, breakdown: [], tips: ['Paste or upload a resume with at least a few lines of text.'],
        skills: { found: [], missing: [], matched: [], extraKeywords: [] }, issues: [], stats: { words }, role };
    }

    /* 1. Contact (10) */
    const email = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(text);
    const phone = /(\+?\d[\d\s().-]{8,}\d)/.test(text);
    const link = /linkedin\.com|github\.com|portfolio|gitlab\.com/i.test(text);
    const contact = (email ? 4 : 0) + (phone ? 3 : 0) + (link ? 3 : 0);
    const cNotes = [];
    if (!email) { cNotes.push('No email found'); tips.push('Add a professional email address at the top.'); }
    if (!phone) { cNotes.push('No phone number found'); tips.push('Add a phone number recruiters can call.'); }
    if (!link) { cNotes.push('No LinkedIn or GitHub link'); tips.push('Add your LinkedIn and GitHub URLs; both are expected for technical roles.'); }
    breakdown.push({ name: 'Contact details', score: contact, max: 10, notes: cNotes.length ? cNotes : ['Email, phone and profile link present'] });

    /* 2. Sections (15) */
    const secPts = { education: 4, skills: 4, summary: 2 };
    let sec = 0; const sNotes = [];
    for (const [k, p] of Object.entries(secPts)) {
      if (sections[k] !== undefined) sec += p;
      else { sNotes.push(`Missing ${k} section`); tips.push(`Add a clearly labelled "${k[0].toUpperCase() + k.slice(1)}" section.`); }
    }
    if (sections.experience !== undefined || sections.projects !== undefined) sec += 5;
    else { sNotes.push('Missing experience/projects section'); tips.push('Add an Experience or Projects section; it carries the most weight with recruiters.'); }
    breakdown.push({ name: 'Standard sections', score: sec, max: 15, notes: sNotes.length ? sNotes : ['All key sections found'] });

    /* 3. Skills / keywords (30) */
    const found = findSkills(text);
    let target, source; const weights = {};
    const jdSkills = opts.jd ? findSkills(opts.jd) : [];
    if (jdSkills.length >= 3) { target = jdSkills; target.forEach(s => weights[s] = 1); source = 'job description'; }
    else { const r = ROLES[role]; target = r.core.concat(r.nice); r.core.forEach(s => weights[s] = 2); r.nice.forEach(s => weights[s] = 1); source = role + ' profile'; }
    const matched = target.filter(s => found.includes(s));
    const missing = target.filter(s => !found.includes(s));
    const totalW = target.reduce((a, s) => a + weights[s], 0);
    const gotW = matched.reduce((a, s) => a + weights[s], 0);
    const kwScore = Math.round((gotW / totalW) * 30 * 10) / 10;
    let extraKeywords = [];
    if (opts.jd && jdSkills.length >= 3) {
      const freq = {};
      (opts.jd.toLowerCase().match(/[a-z][a-z+#.-]{3,}/g) || []).forEach(w => { if (!STOP.has(w)) freq[w] = (freq[w] || 0) + 1; });
      const lower = text.toLowerCase();
      extraKeywords = Object.entries(freq).filter(([w, c]) => c >= 2 && !lower.includes(w)).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0]);
    }
    if (missing.length) tips.push(`Add evidence of these skills if you genuinely have them: ${missing.slice(0, 6).join(', ')}.`);
    breakdown.push({ name: 'Skill match', score: kwScore, max: 30, notes: [`${matched.length} of ${target.length} skills from the ${source} found`] });

    /* 4. Impact (20) */
    const strong = bullets.filter(b => ACTION_VERBS.has((b.text.split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z-]/g, '')));
    const quant = bullets.filter(b => hasNumber(b.text));
    const vRatio = bullets.length ? strong.length / bullets.length : 0;
    const qRatio = bullets.length ? quant.length / bullets.length : 0;
    const impact = Math.round((Math.min(1, vRatio / 0.8) * 10 + Math.min(1, qRatio / 0.4) * 10) * 10) / 10;
    const iNotes = [];
    if (!bullets.length) { iNotes.push('No bullet points found'); tips.push('Describe your work in bullet points that start with action verbs.'); }
    else {
      iNotes.push(`${strong.length} of ${bullets.length} bullets start with a strong action verb`);
      iNotes.push(`${quant.length} of ${bullets.length} bullets contain a number or measurable result`);
      if (vRatio < 0.8) tips.push('Start more bullets with strong verbs (Built, Led, Automated, Reduced).');
      if (qRatio < 0.4) tips.push('Quantify results: add %, counts, time saved or users served to at least 4 in 10 bullets.');
    }
    breakdown.push({ name: 'Action verbs and impact', score: impact, max: 20, notes: iNotes });

    /* 5. Length and format (10) */
    let lf = words >= 350 && words <= 900 ? 6 : (words >= 250 && words <= 1100 ? 4 : 2);
    const fNotes = [];
    if (words < 350) { fNotes.push(`Only ${words} words; too short`); tips.push('Your resume is short. Expand projects and experience to roughly 350-800 words.'); }
    else if (words > 900) { fNotes.push(`${words} words; too long`); tips.push('Trim the resume to one or two pages (under ~900 words).'); }
    else fNotes.push(`${words} words; good length`);
    if (bullets.length >= 5) lf += 2; else fNotes.push('Fewer than 5 bullet points');
    if (!/[\uFFFD\uE000-\uF8FF]/.test(text)) lf += 2;
    else { fNotes.push('Unreadable symbols found (may break ATS parsing)'); tips.push('Remove icons and special symbols; ATS parsers cannot read them.'); }
    breakdown.push({ name: 'Length and format', score: lf, max: 10, notes: fNotes });

    /* 6. Language (15) */
    const issues = languageIssues(text, bullets);
    const penalty = Math.min(15, issues.reduce((a, i) => a + i.weight, 0));
    const lang = Math.round((15 - penalty) * 10) / 10;
    const counts = {}; issues.forEach(i => counts[i.type] = (counts[i.type] || 0) + 1);
    breakdown.push({ name: 'Language quality', score: lang, max: 15,
      notes: issues.length ? [`${issues.length} issue${issues.length > 1 ? 's' : ''} found`] : ['No grammar or spelling issues found'] });
    if (counts.spelling) tips.push('Fix the spelling mistakes highlighted in the resume.');
    if (counts.pronoun) tips.push('Remove "I" and "my"; write in implied first person.');
    if (counts.weak) tips.push('Replace weak openers such as "Responsible for" with results-focused verbs.');

    const score = Math.round(breakdown.reduce((a, b) => a + b.score, 0));
    const grade = score >= 80 ? 'Strong' : score >= 60 ? 'Good' : score >= 40 ? 'Needs work' : 'Weak';
    return { score, grade, breakdown, tips, issues, issueCounts: counts, role, source,
      skills: { found, matched, missing, extraKeywords },
      stats: { words, bullets: bullets.length, strongVerbBullets: strong.length, quantifiedBullets: quant.length, sections: Object.keys(sections) } };
  }

  return { analyze, findSkills, SKILLS, ROLES, languageIssues };
});
