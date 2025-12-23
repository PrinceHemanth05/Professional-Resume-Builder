let sectionOrder = ['objective','experience','education','skills','projects','certifications','languages','hobbies','declaration'];
let draggedItem = null;

let skills = { personal: [], professional: [], technical: [] };
let hobbies = [];
let languages = [];

let expCounter = 0;
let eduCounter = 0;
let projCounter = 0;
let certCounter = 0;

document.addEventListener('DOMContentLoaded', () => {
  bindTooltipFocusHandlers();
  bindStaticInputs();
  initializeSectionOrder();

  addExperience();
  addEducation();

  renderSkillLists();
  renderHobbyList();
  renderLanguageList();

  updateCharCounter();
  updatePreview();
});

/* tooltips on focus */
function bindTooltipFocusHandlers(){
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if(el && el.matches('input[data-tooltip], textarea[data-tooltip], select[data-tooltip]')){
      el.classList.add('tooltip-open');
    }
  });
  document.addEventListener('focusout', (e) => {
    const el = e.target;
    if(el && el.matches('input[data-tooltip], textarea[data-tooltip], select[data-tooltip]')){
      el.classList.remove('tooltip-open');
    }
  });
}

/* bind static fields */
function bindStaticInputs(){
  const fields = document.querySelectorAll('#resumeForm input, #resumeForm textarea');
  fields.forEach(el => {
    if(el.type === 'file') return;

    el.addEventListener('input', () => {
      if(el.id === 'objective') updateCharCounter();
      validateField(el);
      updatePreview();
    });
    el.addEventListener('blur', () => validateField(el));
  });

  // enter to add chips
  const map = [
    { id: 'personalSkillInput', fn: () => addSkillFromInput('personal') },
    { id: 'professionalSkillInput', fn: () => addSkillFromInput('professional') },
    { id: 'technicalSkillInput', fn: () => addSkillFromInput('technical') },
    { id: 'hobbyInput', fn: () => addHobbyFromInput() },
    { id: 'languageInput', fn: () => addLanguageFromInput() }
  ];
  map.forEach(x => {
    const el = document.getElementById(x.id);
    if(!el) return;
    el.addEventListener('keydown', (e) => {
      if(e.key === 'Enter'){ e.preventDefault(); x.fn(); }
    });
  });
}

/* settings */
function toggleSettings(){
  document.getElementById('settingsPanel').classList.toggle('open');
}
function updateColors(){
  const headerColor = document.getElementById('headerColor').value;
  const accentColor = document.getElementById('accentColor').value;
  const titleColor  = document.getElementById('titleColor').value;

  document.documentElement.style.setProperty('--header-color', headerColor);
  document.documentElement.style.setProperty('--accent-color', accentColor);
  document.documentElement.style.setProperty('--title-color', titleColor);

  document.getElementById('headerColorValue').textContent = headerColor;
  document.getElementById('accentColorValue').textContent = accentColor;
  document.getElementById('titleColorValue').textContent = titleColor;

  document.getElementById('resumeHeader').style.background = `linear-gradient(135deg, ${headerColor}, ${accentColor})`;
  document.querySelector('.main-header').style.background = `linear-gradient(135deg, ${headerColor}, ${accentColor})`;
  updatePreview();
}

/* preview */
function openPreview(){
  if(!validateAll()) return;
  updatePreview();
  document.getElementById('previewPanel').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closePreview(){
  document.getElementById('previewPanel').classList.remove('active');
  document.body.style.overflow = '';
}

/* print: clone preview exactly */
function printResume(){
  if(!validateAll()) return;
  updatePreview();
  const printArea = document.getElementById('printArea');
  printArea.innerHTML = '';
  const clone = document.getElementById('resumePreview').cloneNode(true);
  printArea.appendChild(clone);
  window.print();
  printArea.innerHTML = '';
}

/* word */
function saveAsWord(){
  if(!validateAll()) return;
  updatePreview();
  const content = document.getElementById('resumePreview').innerHTML;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Resume</title></head><body>${content}</body></html>`;
  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  const name = (document.getElementById('fullName').value || 'Resume').replace(/[^\w\-]+/g,'_');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

/* validation */
function setError(id, msg){
  const err = document.getElementById(`err-${id}`);
  if(err) err.textContent = msg || '';
}
function validateField(el){
  if(!el || !el.id) return true;
  const v = (el.value || '').trim();
  if(el.required && v.length === 0){
    el.classList.add('is-invalid');
    setError(el.id, 'This field is required.');
    return false;
  }
  el.classList.remove('is-invalid');
  setError(el.id, '');
  return true;
}
function validateAll(){
  const required = ['fullName','jobTitle','email','phone','location','objective','declaration'];
  let ok = true;
  required.forEach(id => {
    const el = document.getElementById(id);
    if(el && !validateField(el)) ok = false;
  });

  // validate repeatable required fields
  document.querySelectorAll('#experienceContainer input[required], #educationContainer input[required], #projectsContainer input[required], #certificationsContainer input[required]')
    .forEach(el => { if(!validateField(el)) ok = false; });

  if(!ok){
    const first = document.querySelector('.is-invalid');
    if(first) first.scrollIntoView({behavior:'smooth', block:'center'});
  }
  return ok;
}

/* objective counter */
function updateCharCounter(){
  const t = document.getElementById('objective');
  const c = document.getElementById('objectiveCounter');
  if(!t || !c) return;
  c.textContent = `${(t.value || '').length} / 500`;
}

/* helpers */
function normalizeItem(text){ return (text||'').trim().replace(/\s+/g,' '); }
function escapeHtml(text){ const d=document.createElement('div'); d.textContent=text||''; return d.innerHTML; }
function ensureHttp(url){
  const u = (url||'').trim();
  if(!u) return '';
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

/* chips */
function renderChipList(containerId, arr, removeFnName){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = arr.map((t,i)=>`
    <span class="chip">${escapeHtml(t)}
      <button type="button" aria-label="Remove" onclick="${removeFnName}(${i})">&times;</button>
    </span>
  `).join('');
}

/* skills */
function addSkillFromInput(type){
  const id = type==='personal'?'personalSkillInput':type==='professional'?'professionalSkillInput':'technicalSkillInput';
  const el = document.getElementById(id);
  if(!el) return;
  const val = normalizeItem(el.value);
  if(!val) return;
  if(!skills[type].some(s=>s.toLowerCase()===val.toLowerCase())) skills[type].push(val);
  el.value = '';
  renderSkillLists();
  updatePreview();
}
function renderSkillLists(){
  renderChipList('personalSkillsList', skills.personal, 'removePersonalSkill');
  renderChipList('professionalSkillsList', skills.professional, 'removeProfessionalSkill');
  renderChipList('technicalSkillsList', skills.technical, 'removeTechnicalSkill');
}
function removePersonalSkill(i){ skills.personal.splice(i,1); renderSkillLists(); updatePreview(); }
function removeProfessionalSkill(i){ skills.professional.splice(i,1); renderSkillLists(); updatePreview(); }
function removeTechnicalSkill(i){ skills.technical.splice(i,1); renderSkillLists(); updatePreview(); }

/* hobbies */
function addHobbyFromInput(){
  const el = document.getElementById('hobbyInput');
  if(!el) return;
  const val = normalizeItem(el.value);
  if(!val) return;
  if(!hobbies.some(h=>h.toLowerCase()===val.toLowerCase())) hobbies.push(val);
  el.value = '';
  renderHobbyList();
  updatePreview();
}
function renderHobbyList(){ renderChipList('hobbiesList', hobbies, 'removeHobby'); }
function removeHobby(i){ hobbies.splice(i,1); renderHobbyList(); updatePreview(); }

/* languages */
function addLanguageFromInput(){
  const el = document.getElementById('languageInput');
  if(!el) return;
  const val = normalizeItem(el.value);
  if(!val) return;
  if(!languages.some(l=>l.toLowerCase()===val.toLowerCase())) languages.push(val);
  el.value = '';
  renderLanguageList();
  updatePreview();
}
function renderLanguageList(){ renderChipList('languagesList', languages, 'removeLanguage'); }
function removeLanguage(i){ languages.splice(i,1); renderLanguageList(); updatePreview(); }

/* repeatables */
function addExperience(){
  expCounter++;
  const c = document.getElementById('experienceContainer');
  const div = document.createElement('div');
  div.className = 'repeatable-item';
  div.id = `exp-${expCounter}`;
  div.innerHTML = `
    <button class="remove-btn" type="button" onclick="removeExperience(${expCounter})" title="Remove experience"><i class="fas fa-times"></i></button>

    <div class="form-row">
      <div class="form-group">
        <label>Job Title *</label>
        <input type="text" id="expTitle-${expCounter}" required data-tooltip="Required: job title.">
      </div>
      <div class="form-group">
        <label>Company *</label>
        <input type="text" id="expCompany-${expCounter}" required data-tooltip="Required: company name.">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Start Date</label>
        <input type="month" id="expStart-${expCounter}" data-tooltip="Optional: start month/year.">
      </div>
      <div class="form-group">
        <label>End Date</label>
        <input type="month" id="expEnd-${expCounter}" data-tooltip="Optional: end month/year.">
        <label class="checkbox-inline" data-tooltip="Check if currently working here.">
          <input type="checkbox" id="expCurrent-${expCounter}"> Currently working here
        </label>
      </div>
    </div>

    <div id="expDuration-${expCounter}" class="duration-display" style="display:none;"></div>

    <div class="form-group">
      <label>Description</label>
      <textarea id="expDesc-${expCounter}" data-tooltip="Optional: responsibilities/achievements."></textarea>
    </div>
  `;
  c.appendChild(div);

  // bind dynamic events
  const start = div.querySelector(`#expStart-${expCounter}`);
  const end = div.querySelector(`#expEnd-${expCounter}`);
  const cur = div.querySelector(`#expCurrent-${expCounter}`);
  [start,end,cur].forEach(x => x.addEventListener('change', () => { calcExpDuration(expCounter); updatePreview(); }));
  div.querySelectorAll('input,textarea').forEach(el => {
    el.addEventListener('input', ()=>{ validateField(el); updatePreview(); });
    el.addEventListener('blur', ()=> validateField(el));
  });

  updatePreview();
}
function removeExperience(i){
  document.getElementById(`exp-${i}`)?.remove();
  updatePreview();
}
function calcExpDuration(i){
  const startVal = document.getElementById(`expStart-${i}`)?.value;
  const endEl = document.getElementById(`expEnd-${i}`);
  const endVal = endEl?.value;
  const current = document.getElementById(`expCurrent-${i}`)?.checked;
  const out = document.getElementById(`expDuration-${i}`);

  if(!startVal || !out){ out && (out.style.display='none'); return; }
  const s = new Date(startVal);
  const e = current ? new Date() : (endVal ? new Date(endVal) : null);
  if(!e){ out.style.display='none'; return; }

  const months = (e.getFullYear()-s.getFullYear())*12 + (e.getMonth()-s.getMonth());
  const yrs = Math.floor(months/12);
  const rem = months%12;
  let txt='';
  if(yrs>0) txt += `${yrs} year${yrs>1?'s':''}`;
  if(rem>0){ if(yrs>0) txt+=' '; txt += `${rem} month${rem>1?'s':''}`; }
  if(!txt) txt = 'Less than a month';

  out.textContent = `Duration: ${txt}`;
  out.style.display='inline-block';

  if(current && endEl){ endEl.value=''; endEl.disabled=true; }
  if(!current && endEl){ endEl.disabled=false; }
}

function addEducation(){
  eduCounter++;
  const c = document.getElementById('educationContainer');
  const div = document.createElement('div');
  div.className = 'repeatable-item';
  div.id = `edu-${eduCounter}`;
  div.innerHTML = `
    <button class="remove-btn" type="button" onclick="removeEducation(${eduCounter})" title="Remove education"><i class="fas fa-times"></i></button>

    <div class="form-row">
      <div class="form-group">
        <label>Degree *</label>
        <input type="text" id="eduDegree-${eduCounter}" required data-tooltip="Required: degree name.">
      </div>
      <div class="form-group">
        <label>Institution *</label>
        <input type="text" id="eduInst-${eduCounter}" required data-tooltip="Required: institution name.">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Year</label>
        <input type="text" id="eduYear-${eduCounter}" data-tooltip="Optional: completion year.">
      </div>
      <div class="form-group">
        <label>Grade/GPA</label>
        <input type="text" id="eduGpa-${eduCounter}" data-tooltip="Optional: grade/gpa.">
      </div>
    </div>
  `;
  c.appendChild(div);

  div.querySelectorAll('input').forEach(el=>{
    el.addEventListener('input', ()=>{ validateField(el); updatePreview(); });
    el.addEventListener('blur', ()=> validateField(el));
  });

  updatePreview();
}
function removeEducation(i){
  document.getElementById(`edu-${i}`)?.remove();
  updatePreview();
}

function addProject(){
  projCounter++;
  const c = document.getElementById('projectsContainer');
  const div = document.createElement('div');
  div.className = 'repeatable-item';
  div.id = `proj-${projCounter}`;
  div.innerHTML = `
    <button class="remove-btn" type="button" onclick="removeProject(${projCounter})" title="Remove project"><i class="fas fa-times"></i></button>

    <div class="form-row">
      <div class="form-group">
        <label>Project Name *</label>
        <input type="text" id="projName-${projCounter}" required data-tooltip="Required: project name.">
      </div>
      <div class="form-group">
        <label>Technologies</label>
        <input type="text" id="projTech-${projCounter}" data-tooltip="Optional: tech used.">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Project URL</label>
        <input type="url" id="projUrl-${projCounter}" data-tooltip="Optional: GitHub/live demo link.">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="projDesc-${projCounter}" data-tooltip="Optional: description."></textarea>
      </div>
    </div>
  `;
  c.appendChild(div);

  div.querySelectorAll('input,textarea').forEach(el=>{
    el.addEventListener('input', ()=>{ validateField(el); updatePreview(); });
    el.addEventListener('blur', ()=> validateField(el));
  });

  updatePreview();
}
function removeProject(i){
  document.getElementById(`proj-${i}`)?.remove();
  updatePreview();
}

function addCertification(){
  certCounter++;
  const c = document.getElementById('certificationsContainer');
  const div = document.createElement('div');
  div.className = 'repeatable-item';
  div.id = `cert-${certCounter}`;
  div.innerHTML = `
    <button class="remove-btn" type="button" onclick="removeCertification(${certCounter})" title="Remove certification"><i class="fas fa-times"></i></button>

    <div class="form-row">
      <div class="form-group">
        <label>Certification Name *</label>
        <input type="text" id="certName-${certCounter}" required data-tooltip="Required: certification name.">
      </div>
      <div class="form-group">
        <label>Organization</label>
        <input type="text" id="certOrg-${certCounter}" data-tooltip="Optional: issuing organization.">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Date</label>
        <input type="month" id="certDate-${certCounter}" data-tooltip="Optional: month/year.">
      </div>
      <div class="form-group">
        <label>Credential ID</label>
        <input type="text" id="certId-${certCounter}" data-tooltip="Optional: credential id.">
      </div>
    </div>
  `;
  c.appendChild(div);

  div.querySelectorAll('input').forEach(el=>{
    el.addEventListener('input', ()=>{ validateField(el); updatePreview(); });
    el.addEventListener('blur', ()=> validateField(el));
  });

  updatePreview();
}
function removeCertification(i){
  document.getElementById(`cert-${i}`)?.remove();
  updatePreview();
}

/* section order (drag + up/down) */
function initializeSectionOrder(){
  const container = document.getElementById('sectionOrder');
  const names = {
    objective:'Career Objective',
    experience:'Work Experience',
    education:'Education',
    skills:'Skills',
    projects:'Projects',
    certifications:'Certifications',
    languages:'Languages',
    hobbies:'Hobbies',
    declaration:'Declaration'
  };

  container.innerHTML = '';
  sectionOrder.forEach((sec, idx) => {
    const item = document.createElement('div');
    item.className = 'section-order-item';
    item.draggable = true;
    item.dataset.section = sec;
    item.innerHTML = `
      <span><i class="fas fa-grip-vertical drag-handle"></i>${names[sec]}</span>
      <div class="order-buttons">
        <button type="button" onclick="moveSectionUp('${sec}')" ${idx===0?'disabled':''}><i class="fas fa-chevron-up"></i></button>
        <button type="button" onclick="moveSectionDown('${sec}')" ${idx===sectionOrder.length-1?'disabled':''}><i class="fas fa-chevron-down"></i></button>
      </div>
    `;

    item.addEventListener('dragstart', () => { draggedItem = item; item.classList.add('dragging'); });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      document.querySelectorAll('.section-order-item').forEach(x => x.classList.remove('drag-over'));
    });
    item.addEventListener('dragover', (e) => e.preventDefault());
    item.addEventListener('dragenter', () => item.classList.add('drag-over'));
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      if(draggedItem && draggedItem !== item){
        const a = draggedItem.dataset.section;
        const b = item.dataset.section;
        const ai = sectionOrder.indexOf(a);
        const bi = sectionOrder.indexOf(b);
        sectionOrder.splice(ai, 1);
        sectionOrder.splice(bi, 0, a);
        initializeSectionOrder();
        updatePreview();
      }
      item.classList.remove('drag-over');
    });

    container.appendChild(item);
  });
}
function moveSectionUp(sec){
  const i = sectionOrder.indexOf(sec);
  if(i>0){ [sectionOrder[i-1], sectionOrder[i]] = [sectionOrder[i], sectionOrder[i-1]]; initializeSectionOrder(); updatePreview(); }
}
function moveSectionDown(sec){
  const i = sectionOrder.indexOf(sec);
  if(i<sectionOrder.length-1){ [sectionOrder[i+1], sectionOrder[i]] = [sectionOrder[i], sectionOrder[i+1]]; initializeSectionOrder(); updatePreview(); }
}

/* preview rendering */
function updatePreview(){
  const name = document.getElementById('fullName').value || 'Your Name';
  const title = document.getElementById('jobTitle').value || 'Your Job Title';
  document.getElementById('previewName').textContent = name;
  document.getElementById('previewTitle').textContent = title;

  // photo in preview
  // (photo set by handlePhotoUpload)

  // contact
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const location = document.getElementById('location').value.trim();
  const website = document.getElementById('website').value.trim();
  const linkedin = document.getElementById('linkedin').value.trim();
  const github = document.getElementById('github').value.trim();
  const facebook = document.getElementById('facebook').value.trim();
  const youtube = document.getElementById('youtube').value.trim();

  let contact = '';
  if(email) contact += `<span class="resume-contact-item"><i class="fas fa-envelope"></i>${escapeHtml(email)}</span>`;
  if(phone) contact += `<span class="resume-contact-item"><i class="fas fa-phone"></i>${escapeHtml(phone)}</span>`;
  if(location) contact += `<span class="resume-contact-item"><i class="fas fa-map-marker-alt"></i>${escapeHtml(location)}</span>`;
  if(website) contact += `<span class="resume-contact-item"><i class="fas fa-globe"></i><a href="${escapeHtml(ensureHttp(website))}" target="_blank">Website</a></span>`;
  if(linkedin) contact += `<span class="resume-contact-item"><i class="fab fa-linkedin"></i><a href="${escapeHtml(ensureHttp(linkedin))}" target="_blank">LinkedIn</a></span>`;
  if(github) contact += `<span class="resume-contact-item"><i class="fab fa-github"></i><a href="${escapeHtml(ensureHttp(github))}" target="_blank">GitHub</a></span>`;
  if(facebook) contact += `<span class="resume-contact-item"><i class="fab fa-facebook"></i><a href="${escapeHtml(ensureHttp(facebook))}" target="_blank">Facebook</a></span>`;
  if(youtube) contact += `<span class="resume-contact-item"><i class="fab fa-youtube"></i><a href="${escapeHtml(ensureHttp(youtube))}" target="_blank">YouTube</a></span>`;
  document.getElementById('previewContact').innerHTML = contact;

  // sections
  const parts = [];
  sectionOrder.forEach(sec => {
    const html = generateSection(sec);
    if(html) parts.push(html);
  });
  document.getElementById('resumeBody').innerHTML = parts.join('');
}

function generateSection(sec){
  switch(sec){
    case 'objective': return genObjective();
    case 'experience': return genExperience();
    case 'education': return genEducation();
    case 'skills': return genSkills();
    case 'projects': return genProjects();
    case 'certifications': return genCerts();
    case 'languages': return genLanguages();
    case 'hobbies': return genHobbies();
    case 'declaration': return genDeclaration();
    default: return '';
  }
}

function genObjective(){
  const v = (document.getElementById('objective').value||'').trim();
  if(!v) return '';
  return `<div class="resume-section">
    <h2 class="resume-section-title"><i class="fas fa-bullseye"></i> Career Objective</h2>
    <p class="resume-objective">${escapeHtml(v)}</p>
  </div>`;
}

function genSkills(){
  const p = skills.personal, pr = skills.professional, t = skills.technical;
  if(p.length+pr.length+t.length===0) return '';
  const bullet = arr => arr.map(x=>`<li>${escapeHtml(x)}</li>`).join('');
  return `<div class="resume-section">
    <h2 class="resume-section-title"><i class="fas fa-cogs"></i> Skills</h2>
    <div class="skills-grid">
      <div class="skills-col">
        <div class="skills-col-title">Personal Skills</div>
        <ul class="bullet-list">${bullet(p)}</ul>
      </div>
      <div class="skills-col">
        <div class="skills-col-title">Professional Skills</div>
        <ul class="bullet-list">${bullet(pr)}</ul>
      </div>
      <div class="skills-col">
        <div class="skills-col-title">Technical Skills</div>
        <ul class="bullet-list">${bullet(t)}</ul>
      </div>
    </div>
  </div>`;
}

function genLanguages(){
  if(languages.length===0) return '';
  return `<div class="resume-section">
    <h2 class="resume-section-title"><i class="fas fa-language"></i> Languages</h2>
    <ul class="bullet-list">${languages.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>
  </div>`;
}
function genHobbies(){
  if(hobbies.length===0) return '';
  return `<div class="resume-section">
    <h2 class="resume-section-title"><i class="fas fa-heart"></i> Hobbies</h2>
    <ul class="bullet-list">${hobbies.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>
  </div>`;
}

function genExperience(){
  const items = document.querySelectorAll('#experienceContainer .repeatable-item');
  let out = '';
  let has = false;

  items.forEach(item=>{
    const i = item.id.split('-')[1];
    const title = (document.getElementById(`expTitle-${i}`)?.value||'').trim();
    const company = (document.getElementById(`expCompany-${i}`)?.value||'').trim();
    const start = document.getElementById(`expStart-${i}`)?.value || '';
    const end = document.getElementById(`expEnd-${i}`)?.value || '';
    const cur = document.getElementById(`expCurrent-${i}`)?.checked;
    const desc = (document.getElementById(`expDesc-${i}`)?.value||'').trim();

    if(title || company){
      has = true;
      const range = dateRange(start,end,cur);
      const dur = durationText(start,end,cur);
      out += `<div class="resume-item">
        <div class="resume-item-header">
          <div>
            <div class="resume-item-title">${escapeHtml(title||'Position')}</div>
            <div class="resume-item-subtitle">${escapeHtml(company||'Company')}</div>
          </div>
          <div>
            ${range?`<span class="resume-item-date">${range}</span>`:''}
            ${dur?`<div class="resume-item-duration">${dur}</div>`:''}
          </div>
        </div>
        ${desc?`<p class="resume-item-description">${escapeHtml(desc)}</p>`:''}
      </div>`;
    }
  });

  if(!has) return '';
  return `<div class="resume-section">
    <h2 class="resume-section-title"><i class="fas fa-briefcase"></i> Work Experience</h2>
    ${out}
  </div>`;
}

function genEducation(){
  const items = document.querySelectorAll('#educationContainer .repeatable-item');
  let out = '';
  let has = false;

  items.forEach(item=>{
    const i = item.id.split('-')[1];
    const degree = (document.getElementById(`eduDegree-${i}`)?.value||'').trim();
    const inst = (document.getElementById(`eduInst-${i}`)?.value||'').trim();
    const year = (document.getElementById(`eduYear-${i}`)?.value||'').trim();
    const gpa = (document.getElementById(`eduGpa-${i}`)?.value||'').trim();

    if(degree || inst){
      has = true;
      out += `<div class="resume-item">
        <div class="resume-item-header">
          <div>
            <div class="resume-item-title">${escapeHtml(degree||'Degree')}</div>
            <div class="resume-item-subtitle">${escapeHtml(inst||'Institution')}</div>
          </div>
          <div>
            ${year?`<span class="resume-item-date">${escapeHtml(year)}</span>`:''}
            ${gpa?`<div class="resume-item-duration">Grade: ${escapeHtml(gpa)}</div>`:''}
          </div>
        </div>
      </div>`;
    }
  });

  if(!has) return '';
  return `<div class="resume-section">
    <h2 class="resume-section-title"><i class="fas fa-graduation-cap"></i> Education</h2>
    ${out}
  </div>`;
}

function genProjects(){
  const items = document.querySelectorAll('#projectsContainer .repeatable-item');
  let out = '';
  let has = false;

  items.forEach(item=>{
    const i = item.id.split('-')[1];
    const name = (document.getElementById(`projName-${i}`)?.value||'').trim();
    const tech = (document.getElementById(`projTech-${i}`)?.value||'').trim();
    const url = (document.getElementById(`projUrl-${i}`)?.value||'').trim();
    const desc = (document.getElementById(`projDesc-${i}`)?.value||'').trim();

    if(name){
      has = true;
      out += `<div class="resume-item">
        <div class="resume-item-header">
          <div>
            <div class="resume-item-title">${escapeHtml(name)}</div>
            ${tech?`<div class="resume-item-subtitle">${escapeHtml(tech)}</div>`:''}
          </div>
          ${url?`<a class="resume-item-date" href="${escapeHtml(ensureHttp(url))}" target="_blank">View</a>`:''}
        </div>
        ${desc?`<p class="resume-item-description">${escapeHtml(desc)}</p>`:''}
      </div>`;
    }
  });

  if(!has) return '';
  return `<div class="resume-section">
    <h2 class="resume-section-title"><i class="fas fa-project-diagram"></i> Projects</h2>
    ${out}
  </div>`;
}

function genCerts(){
  const items = document.querySelectorAll('#certificationsContainer .repeatable-item');
  let out = '';
  let has = false;

  items.forEach(item=>{
    const i = item.id.split('-')[1];
    const name = (document.getElementById(`certName-${i}`)?.value||'').trim();
    const org = (document.getElementById(`certOrg-${i}`)?.value||'').trim();
    const date = document.getElementById(`certDate-${i}`)?.value || '';
    const cid = (document.getElementById(`certId-${i}`)?.value||'').trim();

    if(name){
      has = true;
      out += `<div class="resume-item">
        <div class="resume-item-header">
          <div>
            <div class="resume-item-title">${escapeHtml(name)}</div>
            ${org?`<div class="resume-item-subtitle">${escapeHtml(org)}</div>`:''}
          </div>
          <div>
            ${date?`<span class="resume-item-date">${escapeHtml(formatMonth(date))}</span>`:''}
            ${cid?`<div class="resume-item-duration">ID: ${escapeHtml(cid)}</div>`:''}
          </div>
        </div>
      </div>`;
    }
  });

  if(!has) return '';
  return `<div class="resume-section">
    <h2 class="resume-section-title"><i class="fas fa-certificate"></i> Certifications</h2>
    ${out}
  </div>`;
}

function genDeclaration(){
  const v = (document.getElementById('declaration').value||'').trim();
  if(!v) return '';
  return `<div class="resume-section">
    <h2 class="resume-section-title"><i class="fas fa-file-signature"></i> Declaration</h2>
    <p>${escapeHtml(v)}</p>
  </div>`;
}

/* date helpers */
function formatMonth(dateString){
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US',{month:'short',year:'numeric'});
}
function dateRange(start,end,isCurrent){
  if(!start) return '';
  const s = formatMonth(start);
  if(isCurrent) return `${s} - Present`;
  if(end) return `${s} - ${formatMonth(end)}`;
  return s;
}
function durationText(start,end,isCurrent){
  if(!start) return '';
  const s = new Date(start);
  const e = isCurrent ? new Date() : (end ? new Date(end) : null);
  if(!e) return '';
  const months = (e.getFullYear()-s.getFullYear())*12 + (e.getMonth()-s.getMonth());
  const y = Math.floor(months/12);
  const m = months%12;
  let t='';
  if(y>0) t += `${y} yr${y>1?'s':''}`;
  if(m>0){ if(y>0) t += ' '; t += `${m} mo${m>1?'s':''}`; }
  if(!t) t = '< 1 month';
  return t;
}

/* photo */
function handlePhotoUpload(event){
  const file = event.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ setError('photoInput','Please upload an image file.'); return; }
  if(file.size > 5*1024*1024){ setError('photoInput','Image must be less than 5MB.'); return; }
  setError('photoInput','');

  const reader = new FileReader();
  reader.onload = (e)=>{
    document.getElementById('photoPreview').innerHTML = `<img src="${e.target.result}" alt="Profile Photo">`;
    document.getElementById('removePhotoBtn').style.display = 'inline-flex';
    document.getElementById('resumePhoto').innerHTML = `<img src="${e.target.result}" alt="Profile Photo">`;
    updatePreview();
  };
  reader.readAsDataURL(file);
}
function removePhoto(){
  document.getElementById('photoInput').value = '';
  document.getElementById('photoPreview').innerHTML = '<i class="fas fa-user"></i>';
  document.getElementById('removePhotoBtn').style.display = 'none';
  document.getElementById('resumePhoto').innerHTML = '<div class="resume-photo-placeholder"><i class="fas fa-user"></i></div>';
  updatePreview();
}