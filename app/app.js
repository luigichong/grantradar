/* GrantRadar beta app. Matching runs entirely in the browser. */

/* ---------- Settings for the team ---------- */
const CONFIG = {
  // Google Form where owners request a draft. Leave '' until the form exists.
  // To pre-fill fields, open the form > ⋮ > "Get pre-filled link", fill the
  // two fields with any text, copy the link, and paste the entry IDs below.
  requestFormUrl: '',            // e.g. 'https://docs.google.com/forms/d/e/XXXX/viewform'
  formFields: {
    program: '',                 // e.g. 'entry.1234567890'
    profile: ''                  // e.g. 'entry.2345678901'
  },
  betaOffer: 'Beta offer: your first draft is free while we test GrantRadar with our first 20 businesses. In return, we ask for honest feedback.',
  replyTime: 'We reply within 2 business days.'
};

/* ---------- Helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => '$' + n.toLocaleString('en-CA');
const STORE_KEY = 'grantradar-beta-profile-v1';

const LABELS = {
  industry: {
    food_service: 'Café, restaurant or catering', food_maker: 'Makes food or drinks to sell (bakery, brewery, packaged foods)',
    retail: 'Retail shop', trades: 'Trades or construction', tech: 'Tech or software', manufacturing: 'Manufacturing',
    services: 'Professional or personal services', other: 'Something else'
  },
  revenue: { lt30k: 'Under $30,000', '30k_300k': '$30,000 to $300,000', '300k_1m': '$300,000 to $1 million', '1m_plus': 'Over $1 million' },
  years: { prelaunch: "Haven't launched yet", lt2: 'Under 2 years', '2to5': '2 to 5 years', '5plus': 'Over 5 years' },
  incorporated: { yes: 'Incorporated', no: 'Not incorporated (sole proprietor or partnership)', unsure: 'Not sure if incorporated' },
  utilities: { bchydro: 'BC Hydro electricity', fortis_elec: 'FortisBC electricity', fortis_gas: 'FortisBC natural gas', unsure: 'Not sure' }
};

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function daysUntil(iso) {
  const ms = new Date(iso + 'T23:59:59') - new Date();
  return Math.ceil(ms / 86400000);
}
function fmtDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
}

/* ---------- Questionnaire ---------- */
function buildGoals() {
  $('#goals').innerHTML = GOALS.map((g) => `
    <label class="check"><input type="checkbox" name="goals" value="${g.id}"><span>${esc(g.label)}</span></label>`).join('');
}

function readProfile() {
  const f = $('#profile');
  const val = (n) => (f.elements[n] && f.elements[n].value) || '';
  const checked = (n) => $$(`input[name="${n}"]:checked`, f).map((i) => i.value);
  return {
    inBC: val('inBC'),
    industry: val('industry'),
    ftEmployees: Math.max(0, parseInt(val('ftEmployees'), 10) || 0),
    revenue: val('revenue'),
    years: val('years'),
    incorporated: val('incorporated'),
    youngOwner: val('youngOwner'),
    utilities: checked('utilities'),
    goals: checked('goals')
  };
}

function fillProfile(p) {
  const f = $('#profile');
  for (const k of ['inBC', 'industry', 'ftEmployees', 'revenue', 'years', 'incorporated', 'youngOwner']) {
    if (p[k] === undefined || p[k] === '') continue;
    const el = f.elements[k];
    if (!el) continue;
    if (el instanceof RadioNodeList) { for (const r of el) r.checked = r.value === String(p[k]); }
    else el.value = p[k];
  }
  for (const n of ['utilities', 'goals']) {
    $$(`input[name="${n}"]`, f).forEach((i) => { i.checked = (p[n] || []).includes(i.value); });
  }
}

function saveProfile(p) { try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) { /* storage blocked: fine */ } }
function loadProfile() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; } }
function clearProfile() { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ } }

function validate(p) {
  const missing = [];
  if (!p.inBC) missing.push('whether your business is in B.C.');
  if (!p.industry) missing.push('your industry');
  if (!p.revenue) missing.push('your yearly revenue');
  if (!p.years) missing.push('how long you\'ve been running');
  if (!p.incorporated) missing.push('whether you\'re incorporated');
  if (!p.goals.length) missing.push('at least one plan for this year');
  return missing;
}

/* ---------- Matching ---------- */
function effectiveStatus(prog) {
  if (prog.status === 'open' && prog.closes && todayISO() > prog.closes) return 'closed';
  return prog.status;
}

function evaluate(prog, p) {
  const out = { yes: [], no: [], maybe: [] };
  const goalHits = prog.goals.filter((g) => p.goals.includes(g));
  prog.check(p, {
    yes: (r) => out.yes.push(r),
    no: (r) => out.no.push(r),
    maybe: (r) => out.maybe.push(r)
  });
  const status = effectiveStatus(prog);
  let group;
  if (!goalHits.length) group = 'irrelevant';
  else if (out.no.length) group = 'ineligible';
  else if (status === 'closed') group = 'watch';
  else if (status === 'upcoming') group = 'watch';
  else if (out.maybe.length) group = 'possible';
  else group = 'strong';
  const goalText = goalHits.map((g) => GOALS.find((x) => x.id === g).label.toLowerCase());
  return { prog, group, status, goalText, ...out };
}

function rankKey(r) {
  // Deadlines first (soonest), then by how much is confirmed.
  const d = r.prog.status === 'open' && r.prog.closes ? daysUntil(r.prog.closes) : (r.prog.deadline ? daysUntil(r.prog.deadline) + 30 : 9999);
  return d * 10 - r.yes.length + r.maybe.length * 2;
}

/* ---------- Results ---------- */
function statusBadge(r) {
  const p = r.prog;
  if (r.status === 'open' && p.closes) {
    const n = daysUntil(p.closes);
    const cls = n <= 21 ? 'urgent' : 'open';
    return `<span class="badge ${cls}">${n <= 0 ? 'Closes today' : `${n} day${n === 1 ? '' : 's'} left`}</span>`;
  }
  if (r.status === 'rolling') return '<span class="badge open">Open</span>';
  if (r.status === 'upcoming') return '<span class="badge soon">Opening soon</span>';
  return '<span class="badge closed">Closed for now</span>';
}

function card(r) {
  const p = r.prog;
  const statusLine = r.status === 'open' && p.closes ? (p.closesNote || `Closes ${fmtDate(p.closes)}`) : (p.statusNote || '');
  const deadlineExtra = p.deadline && daysUntil(p.deadline) > 0
    ? `<span class="pill amber">${esc(p.deadlineLabel)} in ${daysUntil(p.deadline)} days</span>` : '';
  const why = [`You plan to ${r.goalText.join(' and ')}.`, ...r.yes];
  const helpBlock = p.help === 'draft'
    ? `<div class="help">
         <div><span class="k">Want us to write it?</span><p>A grant advisor drafts it from your answers. You review it and submit it yourself. Our usual flat fee for this program is <b>${money(p.fee)}</b>, and you keep 100% of what you win.</p></div>
         <button class="btn primary" data-request="${p.id}" type="button">Get help applying</button>
       </div>`
    : `<div class="help muted"><span class="k">How you get it</span><p>${esc(p.help)}</p></div>`;
  return `
  <article class="card ${r.group}" id="prog-${p.id}">
    <header>
      <div class="meta"><span class="pill">${esc(p.level)}</span><span class="pill">${esc(p.type)}</span>${statusBadge(r)}${deadlineExtra}</div>
      <h3>${esc(p.name)}</h3>
      <p class="funder">${esc(p.funder)}</p>
    </header>
    <p class="amount">${esc(p.amount)}</p>
    ${p.amountNote ? `<p class="amount-note">${esc(p.amountNote)}</p>` : ''}
    <p class="status-line">${esc(statusLine)}</p>
    <div class="cols">
      <div><h4>Why it fits</h4><ul class="ok">${why.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>
      ${r.maybe.length ? `<div><h4>Confirm first</h4><ul class="q">${r.maybe.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
    </div>
    <details><summary>Rules to know</summary><ul>${p.caveats.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></details>
    ${helpBlock}
    <p class="source"><a href="${esc(p.source)}" target="_blank" rel="noopener">Official program page ↗</a> · Last checked by GrantRadar ${fmtDate(p.checked)}</p>
  </article>`;
}

function profileSummary(p) {
  const goals = p.goals.map((g) => '- ' + GOALS.find((x) => x.id === g).label).join('\n');
  return [
    `Industry: ${LABELS.industry[p.industry] || '-'}`,
    `Full-time employees: ${p.ftEmployees}`,
    `Yearly revenue: ${LABELS.revenue[p.revenue] || '-'}`,
    `Running for: ${LABELS.years[p.years] || '-'}`,
    `Structure: ${LABELS.incorporated[p.incorporated] || '-'}`,
    `In B.C.: ${p.inBC === 'yes' ? 'Yes' : 'No'}`,
    `Plans this year:\n${goals}`
  ].join('\n');
}

let lastProfile = null;

function render(p) {
  const results = PROGRAMS.map((prog) => evaluate(prog, p));
  const by = (g) => results.filter((r) => r.group === g).sort((a, b) => rankKey(a) - rankKey(b));
  const strong = by('strong'), possible = by('possible'), watch = by('watch'), ineligible = by('ineligible');
  const drafts = [...strong, ...possible].filter((r) => r.prog.help === 'draft').length;

  const intro = p.inBC !== 'yes'
    ? `<div class="notice">GrantRadar's beta covers B.C. businesses. Federal programs below may still apply, but we haven't added your province's own programs yet.</div>` : '';

  const section = (title, sub, list) => list.length ? `
    <section class="group"><div class="group-head"><h2>${title}</h2><p>${sub}</p></div>${list.map(card).join('')}</section>` : '';

  $('#results').innerHTML = `
    <div class="summary">
      <span class="k">Your matches</span>
      <h2 class="big">${strong.length + possible.length} program${strong.length + possible.length === 1 ? '' : 's'} to look at${strong.length ? `, ${strong.length} strong fit${strong.length === 1 ? '' : 's'}` : ''}.</h2>
      <p>Based on your answers. ${drafts ? `We can write the application for ${drafts} of them.` : ''} Strong fits meet every rule we can check. Possible fits need you to confirm something first.</p>
      <div class="summary-actions">
        <button class="btn ghost" type="button" id="edit">Change my answers</button>
        <button class="btn ghost" type="button" id="print">Save or print</button>
      </div>
    </div>
    ${intro}
    ${section('Strong fits', 'You meet every rule we can check from your answers.', strong)}
    ${section('Possible fits', 'Worth a look, but check the "Confirm first" points.', possible)}
    ${section('Coming up, or closed for now', 'These match your plans but aren\'t taking applications today. Note the date and check back.', watch)}
    ${!strong.length && !possible.length && !watch.length ? `<div class="notice">We didn't find a match in our beta list for these plans yet. Try adding more plans, or search the government's <a href="${MORE_PROGRAMS_URL}" target="_blank" rel="noopener">Business Benefits Finder</a>.</div>` : ''}
    ${ineligible.length ? `<details class="ineligible"><summary>Programs you don't qualify for (${ineligible.length})</summary>
      <ul>${ineligible.map((r) => `<li><b>${esc(r.prog.name)}</b>: ${esc(r.no[0])}</li>`).join('')}</ul></details>` : ''}
    <div class="more">
      <h3>What we cover</h3>
      <p>Our beta list has ${PROGRAMS.length} hand-checked federal, B.C. and utility programs for small businesses, and we're adding more every week. For everything else, try the government's <a href="${MORE_PROGRAMS_URL}" target="_blank" rel="noopener">Business Benefits Finder</a>.</p>
      <p class="fine">Matches are a guide, not a promise. The funder decides who qualifies, so always read the official page before you apply.</p>
    </div>`;

  $('#edit').addEventListener('click', showForm);
  $('#print').addEventListener('click', () => window.print());
  $$('[data-request]').forEach((b) => b.addEventListener('click', () => openRequest(b.dataset.request)));
}

/* ---------- Request a draft ---------- */
function openRequest(id) {
  const prog = PROGRAMS.find((x) => x.id === id);
  const summary = `Program: ${prog.name}\n${profileSummary(lastProfile)}`;
  const ready = !!CONFIG.requestFormUrl;
  let formUrl = CONFIG.requestFormUrl;
  if (ready && (CONFIG.formFields.program || CONFIG.formFields.profile)) {
    const u = new URL(formUrl);
    u.searchParams.set('usp', 'pp_url');
    if (CONFIG.formFields.program) u.searchParams.set(CONFIG.formFields.program, prog.name);
    if (CONFIG.formFields.profile) u.searchParams.set(CONFIG.formFields.profile, profileSummary(lastProfile));
    formUrl = u.toString();
  }
  $('#modal-body').innerHTML = `
    <span class="k">Get help applying</span>
    <h2 id="modal-title">${esc(prog.name)}</h2>
    <ol class="steps">
      <li><b>Send us a request.</b> It takes 2 minutes: your contact details and a few lines about your plan.</li>
      <li><b>We check the fit and write your draft.</b> A grant advisor drafts it from your answers. Nothing is made up. If we need a fact, we ask you.</li>
      <li><b>You review and submit it yourself</b> on the funder's own site, so the application stays yours.</li>
    </ol>
    <div class="offer">${esc(CONFIG.betaOffer)} <span class="fine">Usual flat fee for this program: ${money(prog.fee)}.</span></div>
    <label class="k" for="summary">Your details to include</label>
    <textarea id="summary" readonly rows="7">${esc(summary)}</textarea>
    <div class="modal-actions">
      <button class="btn ghost" type="button" id="copy">Copy my details</button>
      ${ready
        ? `<a class="btn primary" href="${esc(formUrl)}" target="_blank" rel="noopener">Open the request form ↗</a>`
        : `<span class="fine">Requests open soon. Our request form is being set up.</span>`}
    </div>
    <p class="fine">${esc(CONFIG.replyTime)} Your answers only leave this page if you send them in the form.</p>`;
  $('#copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(summary); $('#copy').textContent = 'Copied'; }
    catch (e) { $('#summary').select(); $('#copy').textContent = 'Press Ctrl+C to copy'; }
  });
  const m = $('#modal');
  if (typeof m.showModal === 'function') m.showModal(); else m.setAttribute('open', '');
}

/* ---------- Views ---------- */
function showForm() {
  $('#results').hidden = true;
  $('#form-wrap').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function showResults(p) {
  lastProfile = p;
  render(p);
  $('#form-wrap').hidden = true;
  $('#results').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
  buildGoals();
  $('#count').textContent = PROGRAMS.length;
  const saved = loadProfile();
  if (saved) { fillProfile(saved); $('#saved-note').hidden = false; }

  $('#profile').addEventListener('submit', (e) => {
    e.preventDefault();
    const p = readProfile();
    const missing = validate(p);
    if (missing.length) {
      $('#form-error').textContent = 'Please answer: ' + missing.join(', ') + '.';
      $('#form-error').hidden = false;
      $('#form-error').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    $('#form-error').hidden = true;
    if ($('#remember').checked) saveProfile(p); else clearProfile();
    showResults(p);
  });

  $('#forget').addEventListener('click', () => {
    clearProfile();
    $('#profile').reset();
    $('#saved-note').hidden = true;
  });

  $('#modal-close').addEventListener('click', () => $('#modal').close());
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') e.target.close(); });
});
