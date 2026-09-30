const fs=require('fs'),path=require('path'),E=require('../src/engine.js');
const dir=path.join(__dirname,'resumes');const texts=fs.readdirSync(dir).map(f=>fs.readFileSync(path.join(dir,f),'utf8'));
const N=200;const t0=process.hrtime.bigint();
for(let i=0;i<N;i++)for(const t of texts)E.analyze(t,{role:'Software Developer'});
const ms=Number(process.hrtime.bigint()-t0)/1e6/(N*texts.length);
console.log(JSON.stringify({runs:N*texts.length,avgMsPerAnalysis:+ms.toFixed(3)}));
// safe-fix effect
for(const f of ['03_weak_messy.txt','06_symbols_spacing.txt']){
  let t=fs.readFileSync(path.join(dir,f),'utf8');const r=E.analyze(t);
  const safe=new Set(['spelling','repeat','case','spacing']);
  r.issues.filter(i=>safe.has(i.type)).sort((a,b)=>b.start-a.start).forEach(i=>{t=t.slice(0,i.start)+i.fix+t.slice(i.end)});
  const r2=E.analyze(t);console.log(f,'issues',r.issues.length,'->',r2.issues.length,'score',r.score,'->',r2.score);}
