# ResumeIQ - AI Resume Analyzer

Upload or paste a resume and get:

- an **ATS score out of 100** with a six-category breakdown
- **missing skills** for a chosen role, or for a pasted job description
- **grammar, spelling and wording corrections**, highlighted inside a marked-up copy of the resume
- prioritised **improvement suggestions** and one-click **safe fixes**

Everything runs in the browser. No resume text is sent to any server.

## Run it

No build step and no API key.

```bash
# option 1: just open index.html in a browser
# option 2: serve it locally
npx serve .
```

## Tests and evaluation

```bash
npm test             # 17 unit tests (node:test, Node 18+)
npm run evaluate     # skill-extraction precision/recall on 8 hand-labelled resumes
npm run benchmark    # speed + effect of safe fixes
```

## Project layout

```
index.html           page
src/engine.js        analysis engine (pure JS, also runs in Node)
src/app.js           UI, file reading (pdf.js and mammoth.js load from cdnjs on demand)
src/style.css        styles
src/samples.js       two built-in sample resumes
tests/               unit tests, labelled resumes, evaluation + benchmark scripts
docs/                architecture diagram and screenshots
```

## How the score works

| Category | Points |
|---|---|
| Contact details (email, phone, LinkedIn/GitHub) | 10 |
| Standard sections (education, skills, summary, experience/projects) | 15 |
| Skill match against the role profile or job description | 30 |
| Action verbs and measurable impact in bullet points | 20 |
| Length and format | 10 |
| Language quality (spelling, repeats, pronouns, weak openers, passive voice) | 15 |

The score is heuristic guidance. It does not reproduce any specific employer's ATS.

## Deploy (free)

**Vercel:** import the GitHub repo at vercel.com/new, framework preset "Other", no build command, output directory `.`
**Netlify:** app.netlify.com/drop, drag the project folder in, or connect the GitHub repo with no build command and publish directory `.`
**GitHub Pages:** Settings > Pages > Deploy from branch `main` / root.

## Manual check before submitting

Upload a real PDF and a real DOCX resume and confirm the text appears. These two paths load pdf.js and mammoth.js from cdnjs and need internet access.

## Known limitations

- Rule-based (dictionary and patterns), not a language model. It cannot judge the meaning or truth of a bullet.
- Section headers must be spelled normally ("Experience"); a misspelled header is not recognised.
- English resumes only. Scanned (image-only) PDFs need OCR and are not supported.
