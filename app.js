const GRADE_POINTS = {A:5,B:4,C:3,D:2,E:1,F:0};
 
// ── STATE ──
let state = JSON.parse(localStorage.getItem('cgpa_data') || 'null') || {
  activeSem: 0,
  semesters: [
    { name:'100L 1st Semester', courses:[
      {code:'GST 101',units:2,grade:'A'},
      {code:'MTH 101',units:3,grade:'B'},
    ]},
  ]
};
 
function save(){ localStorage.setItem('cgpa_data', JSON.stringify(state)) }
 
// ── THEME ──
const html = document.documentElement;
const themeBtn = document.getElementById('themeBtn');
const savedTheme = localStorage.getItem('cgpa_theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
themeBtn.textContent = savedTheme === 'dark' ? '☀' : '☾';
themeBtn.addEventListener('click', () => {
  const t = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', t);
  localStorage.setItem('cgpa_theme', t);
  themeBtn.textContent = t === 'dark' ? '☀' : '☾';
});
 
// ── COMPUTE ──
function semGPA(sem){
  let tp=0,tu=0;
  sem.courses.forEach(c=>{
    const u=parseInt(c.units)||0;
    const p=(GRADE_POINTS[c.grade]??0)*u;
    tp+=p; tu+=u;
  });
  return tu>0 ? (tp/tu) : 0;
}
function computeCGPA(){
  let tp=0,tu=0;
  state.semesters.forEach(s=>{
    s.courses.forEach(c=>{
      const u=parseInt(c.units)||0;
      tp+=(GRADE_POINTS[c.grade]??0)*u; tu+=u;
    });
  });
  return tu>0 ? tp/tu : 0;
}
function totalUnits(){
  let t=0;
  state.semesters.forEach(s=>s.courses.forEach(c=>t+=parseInt(c.units)||0));
  return t;
}
function getClass(gpa){
  if(gpa>=4.5) return{label:'First Class',css:'excellent'};
  if(gpa>=3.5) return{label:'Second Class Upper',css:'good'};
  if(gpa>=2.4) return{label:'Second Class Lower',css:'average'};
  if(gpa>=1.5) return{label:'Third Class',css:'average'};
  if(gpa>0)   return{label:'Pass',css:'poor'};
  return{label:'— Add courses to begin —',css:''};
}
 
// ── RENDER ──
function render(){
  save();
  const cgpa = computeCGPA();
  const cl = getClass(cgpa);
  const cgpaEl = document.getElementById('cgpaValue');
  cgpaEl.textContent = cgpa.toFixed(2);
  cgpaEl.className = 'cgpa-value ' + cl.css;
  document.getElementById('cgpaClass').textContent = cl.label;
  document.getElementById('totalUnits').textContent = totalUnits();
  document.getElementById('totalSems').textContent = state.semesters.length;
 
  // tabs
  const tabs = document.getElementById('semTabs');
  tabs.innerHTML = '';
  state.semesters.forEach((s,i)=>{
    const t = document.createElement('button');
    t.className = 'sem-tab' + (i===state.activeSem?' active':'');
    t.textContent = s.name;
    t.onclick = ()=>{ state.activeSem=i; render(); };
    tabs.appendChild(t);
  });
 
  // remove button
  document.getElementById('removeSemBtn').style.display = state.semesters.length>1?'':'none';
 
  // courses
  const sem = state.semesters[state.activeSem];
  const gpa = semGPA(sem);
  const content = document.getElementById('semesterContent');
 
  let html2 = `<div class="course-section">
    <div class="course-header">
      <div>Course Code / Title</div><div>Credit Units</div><div>Grade</div><div></div>
    </div>`;
 
  if(sem.courses.length === 0){
    html2 += `<div style="padding:28px;text-align:center;color:var(--muted);font-size:13px">No courses yet. Click "+ Add course" below.</div>`;
  } else {
    sem.courses.forEach((c,ci)=>{
      html2 += `<div class="course-row">
        <input class="ci" value="${c.code||''}" placeholder="e.g. MTH 101" oninput="updateCourse(${ci},'code',this.value)">
        <select class="ci" onchange="updateCourse(${ci},'units',this.value)">
          ${[1,2,3,4,6].map(u=>`<option value="${u}"${parseInt(c.units)===u?' selected':''}>${u} unit${u>1?'s':''}</option>`).join('')}
        </select>
        <select class="ci" onchange="updateCourse(${ci},'grade',this.value)">
          ${['A','B','C','D','E','F'].map(g=>`<option value="${g}"${c.grade===g?' selected':''}>${g} (${GRADE_POINTS[g]}.0)</option>`).join('')}
        </select>
        <button class="del-btn" onclick="deleteCourse(${ci})" title="Remove course">✕</button>
      </div>`;
    });
  }
 
  html2 += `<div class="add-course-row">
    <button class="add-course-btn" onclick="addCourse()">+ Add course</button>
  </div>
  <div class="sem-gpa-bar">
    <span class="sem-gpa-label">Semester GPA</span>
    <span class="sem-gpa-val">${gpa.toFixed(2)}</span>
  </div>
  </div>`;
 
  // editable semester name
  html2 = `<div style="margin-bottom:12px;display:flex;align-items:center;gap:10px">
    <input class="ci" style="max-width:260px;font-weight:500" value="${sem.name}" 
      placeholder="Semester name" oninput="updateSemName(this.value)">
  </div>` + html2;
 
  content.innerHTML = html2;
}
 
function updateCourse(i,field,val){
  state.semesters[state.activeSem].courses[i][field]=val;
  render();
}
function updateSemName(val){
  state.semesters[state.activeSem].name=val;
  save();
  // re-render tabs only
  const tabs=document.getElementById('semTabs');
  tabs.innerHTML='';
  state.semesters.forEach((s,i)=>{
    const t=document.createElement('button');
    t.className='sem-tab'+(i===state.activeSem?' active':'');
    t.textContent=s.name;
    t.onclick=()=>{state.activeSem=i;render();};
    tabs.appendChild(t);
  });
}
function addCourse(){
  state.semesters[state.activeSem].courses.push({code:'',units:3,grade:'A'});
  render();
  toast('Course added','var(--accent2)');
}
function deleteCourse(i){
  state.semesters[state.activeSem].courses.splice(i,1);
  render();
  toast('Course removed','var(--danger)');
}
function addSemester(){
  const n=state.semesters.length+1;
  const levels=['100L','200L','300L','400L','500L'];
  const sems=['1st Semester','2nd Semester'];
  const label=`${levels[Math.floor((n-1)/2)]||n+'th'} ${sems[(n-1)%2]}`;
  state.semesters.push({name:label,courses:[]});
  state.activeSem=state.semesters.length-1;
  render();
  toast('Semester added','var(--accent2)');
}
function removeSemester(){
  if(state.semesters.length<=1){ toast('Cannot remove the only semester','var(--danger)'); return; }
  if(!confirm(`Remove "${state.semesters[state.activeSem].name}" and all its courses?`)) return;
  state.semesters.splice(state.activeSem,1);
  state.activeSem=Math.min(state.activeSem,state.semesters.length-1);
  render();
  toast('Semester removed','var(--danger)');
}
function clearAll(){
  if(!confirm('Clear ALL semesters and courses? This cannot be undone.')) return;
  state={activeSem:0,semesters:[{name:'100L 1st Semester',courses:[]}]};
  render();
  toast('All data cleared','var(--danger)');
}
function exportData(){
  let txt='CGPA REPORT\n===========\n\n';
  txt+=`Cumulative GPA: ${computeCGPA().toFixed(2)}\n`;
  txt+=`Class: ${getClass(computeCGPA()).label}\n`;
  txt+=`Total Credit Units: ${totalUnits()}\n\n`;
  state.semesters.forEach(s=>{
    txt+=`\n${s.name} — GPA: ${semGPA(s).toFixed(2)}\n`;
    txt+='-'.repeat(40)+'\n';
    s.courses.forEach(c=>{ txt+=`  ${(c.code||'—').padEnd(18)} ${String(c.units).padEnd(6)} ${c.grade}\n`; });
  });
  const blob=new Blob([txt],{type:'text/plain'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='CGPA_Report.txt'; document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  toast('Report downloaded','var(--accent2)');
}
 
// ── TOAST ──
function toast(msg,color='var(--accent)'){
  const t=document.getElementById('toast');
  document.getElementById('toastMsg').textContent=msg;
  document.getElementById('toastDot').style.background=color;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2400);
}
 
render();