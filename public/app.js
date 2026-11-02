'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const views = ['home', 'persona', 'memorize', 'flashcards', 'practice', 'exam'];
const viewTitles = { home: 'PicPay interview', persona: 'Persona', memorize: 'Memorize', flashcards: 'Flashcards', practice: 'Practice', exam: 'Interview' };
let questions = [];
let known = new Set();
let activeView = null;
let flashOrder = [];
let flashIndex = 0;
let flipped = false;
let practiceId = 1;
let exam = null;
let examTimer = null;
let recognition = null;
let listening = false;
let speechRate = 0.9;
const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const announce = message => { $('#app-status').textContent = message; };
const questionById = id => questions.find(question => question.id === Number(id));
const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

document.documentElement.classList.add('js');

const icons = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  'panel-left': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
  'file-text': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  lightbulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/>',
  user: '<path d="M19 21v-2a7 7 0 0 0-14 0v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 16c1 .7 2 1 3 1 2 0 3-2 5-2s3 2 5 2c1 0 2-.3 3-1M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"/>',
  'trending-down': '<path d="m22 17-8.5-8.5-5 5L2 7M16 17h6v-6"/>',
  'list-checks': '<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6 2.4-.5 4.9-2 5.9-3"/>',
  'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
  'book-open': '<path d="M12 5v16M3 3h4a5 5 0 0 1 5 2 5 5 0 0 1 5-2h4v16h-4a7 7 0 0 0-5 2 7 7 0 0 0-5-2H3z"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8zM2 12l10 5 10-5M2 16l10 5 10-5"/>',
  pencil: '<path d="m16 3 5 5-12 12-6 1 1-6zM14 5l5 5"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',
  'graduation-cap': '<path d="m2 9 10-5 10 5-10 5zM6 11v6c4 3 8 3 12 0v-6M22 9v7"/>',
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12a20 20 0 0 0 18 0M12 11v4"/>',
  trophy: '<path d="M8 3h8v6a4 4 0 0 1-8 0zM8 5H4v3a4 4 0 0 0 4 4M16 5h4v3a4 4 0 0 1-4 4M12 13v5M8 21h8M10 18h4v3"/>',
  languages: '<path d="M3 5h12M9 3v2M5 5c0 6 4 9 8 11M13 5c0 6-4 9-9 12M13 21l5-12 5 12M15 17h6"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  waves: '<path d="M2 6c3-4 5 4 10 0s7 4 10 0M2 12c3-4 5 4 10 0s7 4 10 0M2 18c3-4 5 4 10 0s7 4 10 0"/>',
  'volume-2': '<path d="m11 5-6 4H2v6h3l6 4zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
  square: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  shuffle: '<path d="M3 6h3c5 0 7 12 12 12h3M18 15l3 3-3 3M3 18h3c2 0 3-2 4-4M14 8c1-1 2-2 4-2h3M18 3l3 3-3 3"/>',
  'rotate-ccw': '<path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  x: '<path d="m6 6 12 12M6 18 18 6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  play: '<path d="m8 4 13 8-13 8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  moon: '<path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13z"/>'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ''}</svg>`;

// Memory cues are written as "step → step"; render them as a quiet sequence.
const cueMarkup = cue => `<span class="cue">${icon('lightbulb')}<span class="sr-only">Memory cue: </span><span class="cue-steps">${cue.split('→').map(step => `<span>${escapeHTML(step.trim())}</span>`).join(`<span class="cue-sep" aria-hidden="true">${icon('chevron-right')}</span>`)}</span></span>`;

function setupTheme() {
  document.querySelectorAll('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
  const button = $('#theme-toggle');
  const sync = animate => {
    const dark = document.documentElement.dataset.theme === 'dark';
    const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
    button.setAttribute('aria-label', label);
    button.title = label;
    const glyph = $('.theme-icon', button);
    glyph.innerHTML = icon(dark ? 'sun' : 'moon');
    if (animate && !reducedMotion.matches) glyph.animate([{ transform: 'translateY(10px) rotate(-60deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 240, easing: 'cubic-bezier(.2,.7,.2,1)' });
    $('meta[name="theme-color"]').content = dark ? '#0d0f13' : '#ffffff';
  };
  sync(false);
  button.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('lc-theme', theme); } catch { /* Theme remains available for this session. */ }
    sync(true);
  });
}

function setupSidebar() {
  const root = document.documentElement;
  const button = $('#sidebar-toggle');
  const sync = () => {
    const collapsed = root.dataset.sidebar === 'collapsed';
    const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('aria-label', label);
    button.title = label;
    // Icon-only rail: hovering an item shows its name.
    document.querySelectorAll('.nav a').forEach(link => {
      if (collapsed) link.title = link.getAttribute('aria-label') || link.textContent.trim();
      else link.removeAttribute('title');
    });
    if (collapsed) $('.progress').title = `Memorized ${$('#header-known').textContent}`;
    else $('.progress').removeAttribute('title');
  };
  button.addEventListener('click', () => {
    root.dataset.sidebar = root.dataset.sidebar === 'collapsed' ? 'expanded' : 'collapsed';
    try { localStorage.setItem('lc-sidebar', root.dataset.sidebar); } catch { /* Layout choice remains for this session. */ }
    sync();
  });
  sync();
}

// Below-the-fold home sections rise in once as they scroll into view.
function setupReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { items.forEach(item => item.classList.add('in')); return; }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -60px 0px' });
  items.forEach(item => observer.observe(item));
}

function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

let speakingButton = null;
let currentUtterance = null;

// Swaps an answer's speaker button between play and stop states.
function setSpeakingButton(button) {
  if (speakingButton) {
    speakingButton.classList.remove('speaking');
    speakingButton.innerHTML = icon('volume-2');
    speakingButton.setAttribute('aria-label', `Listen to answer ${speakingButton.dataset.speak}`);
    speakingButton.title = 'Listen';
    speakingButton.setAttribute('aria-pressed', 'false');
  }
  speakingButton = button;
  if (button) {
    button.classList.add('speaking');
    button.innerHTML = icon('stop');
    button.setAttribute('aria-label', `Stop answer ${button.dataset.speak}`);
    button.title = 'Stop';
    button.setAttribute('aria-pressed', 'true');
  }
}

function stopSpeech() {
  currentUtterance = null;
  if (canSpeak) window.speechSynthesis.cancel();
  setSpeakingButton(null);
}

function speak(text, button = null) {
  if (!canSpeak) { announce('Text-to-speech is not supported in this browser.'); return; }
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = speechRate;
  const voices = speechSynthesis.getVoices();
  const voice = voices.find(item => item.lang === 'en-US') || voices.find(item => item.lang.startsWith('en'));
  if (voice) utterance.voice = voice;
  // Cancelled utterances report late; only the current one may reset the button.
  const finish = () => { if (currentUtterance === utterance) { currentUtterance = null; setSpeakingButton(null); } };
  utterance.onend = finish;
  utterance.onerror = event => {
    finish();
    if (!['canceled', 'interrupted'].includes(event.error)) announce('Audio could not play. You can still read and practice the text.');
  };
  currentUtterance = utterance;
  speechSynthesis.speak(utterance);
  if (button) setSpeakingButton(button);
}

function loadKnown() {
  try {
    const saved = JSON.parse(localStorage.getItem('lc-known') || '[]');
    if (Array.isArray(saved)) known = new Set(saved.map(Number).filter(id => questions.some(q => q.id === id)));
  } catch { announce('Progress storage is unavailable. You can still practice in this session.'); }
}

function updateProgress(save = false) {
  const total = questions.length;
  $('#header-known').textContent = `${known.size} / ${total}`;
  const bar = $('#header-progress');
  bar.setAttribute('aria-valuemax', String(total));
  bar.setAttribute('aria-valuenow', String(known.size));
  bar.style.setProperty('--p', total ? (known.size / total * 100).toFixed(2) : 0);
  if ($('.progress').title) $('.progress').title = `Memorized ${known.size} / ${total}`;
  $('#flash-known').textContent = `${known.size}/${total} known`;
  $('#flash-celebration').hidden = known.size !== total || !total;
  document.querySelectorAll('#practice-picker [data-q]').forEach(button => button.classList.toggle('known', known.has(Number(button.dataset.q))));
  if (save) {
    try { localStorage.setItem('lc-known', JSON.stringify([...known])); }
    catch { announce('Your browser could not save progress. Your current session is still available.'); }
  }
}

function renderPersona(persona) {
  const animal = `${persona.animal}${persona.animal === 'Dolphin' ? ' 🐬' : ''}`;
  const facts = [['graduation-cap', 'Education', persona.education], ['briefcase', 'Previous job', persona.previousJob], ['trophy', 'Proudest achievement', persona.achievement], ['languages', 'Languages', persona.languages], ['heart', 'Outside of work', persona.hobbies], ['waves', 'If I were an animal', animal]];
  const stats = [['cake', 'Age', persona.age], ['graduation-cap', 'School', 'FEA-USP'], ['briefcase', 'Last job', 'Itaú · 1.5 y'], ['trending-down', 'Win', '−20% response time'], ['waves', 'Animal', animal], ['heart', 'Hobbies', 'Soccer · Running · Cooking']];
  const traitIcons = { organized: 'list-checks', 'calm under pressure': 'leaf', 'good communicator': 'message-circle', 'team player': 'users' };
  const entry = ([symbol, label, value]) => `<dt><span class="chip" aria-hidden="true">${icon(symbol)}</span><span class="stat-label">${escapeHTML(label)}</span></dt><dd>${escapeHTML(value)}</dd>`;
  $('#view-persona').innerHTML = `<header class="page-head"><h1 id="persona-heading">Persona</h1></header>
  <article class="profile card"><div class="profile-main"><div class="profile-photo"><span class="portrait-fallback" role="img" aria-label="Lucas Costa initials">LC</span><img id="portrait" src="./lucas.png" alt="Portrait of Lucas Costa" onerror="this.hidden=true"></div><div class="profile-body"><h2 class="profile-name">${escapeHTML(persona.name)}</h2><p class="profile-role">${escapeHTML(persona.position)} · <b class="company">${escapeHTML(persona.company)}</b></p><p class="profile-meta">${escapeHTML(persona.age)} · ${escapeHTML(persona.city)}</p><blockquote class="profile-quote">“${escapeHTML(persona.tagline)}”</blockquote><ul class="traits" aria-label="Personality traits">${persona.traits.map(trait => `<li class="trait">${icon(traitIcons[trait.trim().toLowerCase()] || 'check')}${escapeHTML(trait)}</li>`).join('')}</ul></div></div></article>
  <section class="block" aria-labelledby="facts-title"><h2 class="block-title" id="facts-title">Quick facts</h2><dl class="stats">${stats.map(item => `<div class="stat">${entry(item)}</div>`).join('')}</dl></section>
  <section class="block" aria-labelledby="background-title"><h2 class="block-title" id="background-title">Background</h2><dl class="facts card">${facts.map(item => `<div class="fact">${entry(item)}</div>`).join('')}</dl></section>`;
}

function firstLetters(text) {
  return text.replace(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu, word => [...word][0]);
}

function answerMarkup(answer, mode) {
  if (mode === 'hidden') return '<button type="button" class="answer-hidden">Answer hidden. Tap to reveal.</button>';
  if (mode === 'first') return escapeHTML(firstLetters(answer));
  if (mode === 'cloze') {
    let wordIndex = 0;
    return answer.split(/(\s+)/).map(part => {
      if (!part.trim()) return part;
      const hide = wordIndex++ % 2 === 1;
      if (!hide) return escapeHTML(part);
      const masked = part.replace(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu, word => '_'.repeat([...word].length));
      return `<button type="button" class="cloze-word" data-word="${escapeHTML(part)}" aria-label="Reveal missing word">${escapeHTML(masked)}</button>`;
    }).join('');
  }
  return escapeHTML(answer);
}

function renderMemorize() {
  stopSpeech();
  const mode = $('input[name="memory-mode"]:checked').value;
  $('#question-list').innerHTML = questions.map(question => `<article class="question-card card" data-question="${question.id}"><div class="question-top"><span class="q-number">${String(question.id).padStart(2, '0')}</span><h2>${escapeHTML(question.q)}${question.duplicateOf ? `<span class="badge">Same answer as #${question.duplicateOf}</span>` : ''}</h2><button type="button" class="btn btn-ghost btn-icon" data-speak="${question.id}" aria-label="Listen to answer ${question.id}" title="Listen" aria-pressed="false" ${canSpeak ? '' : 'disabled'}>${icon('volume-2')}</button></div><div class="answer" ${mode === 'first' ? 'aria-label="First-letter memory prompt"' : ''}>${answerMarkup(question.a, mode)}</div><div class="question-bottom">${cueMarkup(question.cue)}<button type="button" class="btn btn-ghost translation-toggle" aria-expanded="false" aria-controls="translation-${question.id}">${icon('languages')}Show Portuguese</button></div><p lang="pt-BR" class="translation" id="translation-${question.id}" hidden>${escapeHTML(question.pt)}</p></article>`).join('');
}

let renderedFlashId = null;
function renderFlashcard() {
  const question = questionById(flashOrder[flashIndex]);
  if (!question) return;
  const card = $('#flash-card');
  // A new card snaps back to its question side instead of spinning through the next answer.
  const instant = renderedFlashId !== question.id;
  renderedFlashId = question.id;
  if (instant) card.classList.add('no-anim');
  $('#flash-position').textContent = `Card ${flashIndex + 1} / ${flashOrder.length} · Q${question.id}${known.has(question.id) ? ' · Known\u00a0✓' : ''}`;
  $('#flash-q').textContent = question.q;
  $('#flash-a').textContent = question.a;
  $('#flash-cue').innerHTML = cueMarkup(question.cue);
  card.classList.toggle('flipped', flipped);
  card.setAttribute('aria-label', `${flipped ? 'Answer' : 'Question'} ${question.id}. ${flipped ? question.a : question.q}. Tap to flip.`);
  if (instant) { void card.offsetWidth; card.classList.remove('no-anim'); }
}

function moveFlashcard(direction) {
  flashIndex = (flashIndex + direction + flashOrder.length) % flashOrder.length;
  flipped = false;
  renderFlashcard();
}

function markFlashcard(isKnown) {
  const id = flashOrder[flashIndex];
  if (isKnown) known.add(id); else known.delete(id);
  updateProgress(true);
  // Keep a missed card circulating after the other cards in this deck.
  if (!isKnown && flashOrder.length > 1) {
    flashOrder.splice(flashIndex, 1);
    flashOrder.push(id);
    if (flashIndex >= flashOrder.length - 1) flashIndex = 0;
    flipped = false;
    renderFlashcard();
  } else moveFlashcard(1);
  announce(isKnown ? `Question ${id} marked known.` : `Question ${id} returned to the learning pile.`);
}

function selectPractice(id) {
  if (recognition && listening) recognition.abort();
  practiceId = id;
  const question = questionById(id);
  document.querySelectorAll('#practice-picker [data-q]').forEach(button => {
    const selected = Number(button.dataset.q) === id;
    button.setAttribute('aria-pressed', String(selected));
    if (selected && activeView === 'practice') button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
  $('#practice-number').textContent = `Question ${id} of ${questions.length}`;
  $('#practice-question').textContent = question.q;
  $('#practice-input').value = '';
  $('#practice-result').hidden = true;
  $('#dictation-status').textContent = '';
}

const normalized = word => word.toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]/gu, '');
function wordTokens(text) {
  return text.trim().split(/\s+/).filter(Boolean).map(text => ({ text, key: normalized(text) })).filter(word => word.key);
}

function checkAnswer() {
  const question = questionById(practiceId);
  const expected = wordTokens(question.a);
  const actual = wordTokens($('#practice-input').value);
  // Longest common subsequence preserves word order and shows insertions/deletions.
  const table = Array.from({ length: expected.length + 1 }, () => new Uint16Array(actual.length + 1));
  for (let i = expected.length - 1; i >= 0; i--) {
    for (let j = actual.length - 1; j >= 0; j--) {
      table[i][j] = expected[i].key === actual[j].key ? 1 + table[i + 1][j + 1] : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  let i = 0, j = 0;
  const pieces = [];
  while (i < expected.length || j < actual.length) {
    if (i < expected.length && j < actual.length && expected[i].key === actual[j].key) {
      pieces.push(`<span class="diff-correct" title="Correct">${escapeHTML(expected[i].text)}</span>`); i++; j++;
    } else if (i < expected.length && (j >= actual.length || table[i + 1][j] >= table[i][j + 1])) {
      pieces.push(`<span class="diff-missing" title="Missing from your answer">${escapeHTML(expected[i].text)}</span>`); i++;
    } else {
      pieces.push(`<span class="diff-extra" title="Extra in your answer">${escapeHTML(actual[j].text)}</span>`); j++;
    }
  }
  const accuracy = Math.round(table[0][0] / Math.max(expected.length, actual.length, 1) * 100);
  $('#practice-result').innerHTML = `<div class="result-top"><span class="accuracy">${accuracy}%</span><div><h3>${accuracy === 100 ? 'Word-perfect' : 'Accuracy'}</h3><span class="helper">${table[0][0]} matching words · case and punctuation ignored</span></div></div><div class="diff">${pieces.join(' ')}</div><div class="diff-legend"><span class="diff-correct">Correct</span><span class="diff-missing">Missing</span><span class="diff-extra">Extra</span></div>${cueMarkup(question.cue)}`;
  $('#practice-result').hidden = false;
  announce(`Your answer is ${accuracy} percent accurate.`);
}

function setupDictation() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return;
  recognition = new Recognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;
  const button = $('#dictate');
  button.hidden = false;
  button.addEventListener('click', () => {
    if (listening) { recognition.stop(); return; }
    stopSpeech();
    try { recognition.start(); }
    catch { $('#dictation-status').textContent = 'Microphone could not start. Try again or type your answer.'; }
  });
  recognition.onstart = () => { listening = true; button.innerHTML = `${icon('square')}Stop listening`; $('#dictation-status').textContent = 'Listening…'; };
  recognition.onresult = event => {
    const transcript = [...event.results].map(result => result[0].transcript).join(' ');
    const input = $('#practice-input');
    input.value = `${input.value.trim()} ${transcript}`.trim();
    $('#practice-result').hidden = true;
    $('#dictation-status').textContent = 'Transcript added. Check it before comparing.';
  };
  recognition.onerror = event => {
    $('#dictation-status').textContent = event.error === 'not-allowed' ? 'Microphone permission is blocked. Allow it in browser settings or type instead.' : event.error === 'aborted' ? '' : 'No transcript received. Try again or type your answer. Speech recognition may need internet access.';
  };
  recognition.onend = () => { listening = false; button.innerHTML = `${icon('mic')}Speak answer`; if ($('#dictation-status').textContent === 'Listening…') $('#dictation-status').textContent = 'No speech captured. Try again or type your answer.'; };
}

function clearExamTimer() { clearInterval(examTimer); examTimer = null; }

function renderExamStart() {
  clearExamTimer();
  exam = null;
  $('#exam-content').innerHTML = `<div class="exam-intro"><div><p class="eyebrow">${questions.length} questions · shuffled</p><h2>Mock interview</h2><p>Hear each question, answer out loud, then reveal Lucas’s answer and grade yourself.</p><div class="exam-options"><label class="field"><span class="field-label">Time per answer</span><select id="exam-duration"><option value="30">30 seconds</option><option value="45">45 seconds</option><option value="60">60 seconds</option></select></label><button type="button" class="btn btn-primary" data-exam="start">${icon('play')}Start interview</button></div>${canSpeak ? '' : '<p class="helper">This browser cannot speak questions. Read each question on screen instead.</p>'}</div><ol class="steps"><li><span class="chip" aria-hidden="true">${icon('volume-2')}</span><strong>Listen</strong><span>Each question is read aloud.</span></li><li><span class="chip" aria-hidden="true">${icon('mic')}</span><strong>Answer out loud</strong><span>Speak before the timer runs out.</span></li><li><span class="chip" aria-hidden="true">${icon('check')}</span><strong>Grade yourself</strong><span>Reveal the answer and mark it.</span></li></ol></div>`;
}

function examHeader(question) {
  const ratio = exam.remaining / exam.duration;
  return `<div class="exam-bar"><p class="eyebrow">Question ${exam.index + 1} / ${exam.order.length} · Q${question.id}</p><div class="exam-progress" aria-hidden="true"><span style="--p:${(exam.index / exam.order.length * 100).toFixed(2)}"></span></div><div class="timer${exam.remaining <= 5 ? ' low' : ''}" role="timer" aria-label="Time remaining" style="--t:${ratio}"><svg viewBox="0 0 22 22" aria-hidden="true"><circle class="ring-track" cx="11" cy="11" r="9" fill="none" stroke-width="2.5"/><circle class="ring" cx="11" cy="11" r="9" fill="none" stroke-width="2.5" stroke-linecap="round"/></svg><span id="exam-seconds">${formatTime(exam.remaining)}</span></div></div><h2 class="exam-q">${escapeHTML(question.q)}</h2>`;
}

function renderExamQuestion() {
  clearExamTimer();
  const question = questionById(exam.order[exam.index]);
  exam.revealed = false;
  exam.remaining = exam.duration;
  $('#exam-content').innerHTML = `${examHeader(question)}<div class="exam-actions"><button type="button" class="btn btn-primary" data-exam="reveal">${icon('book-open')}Reveal answer</button><button class="btn btn-secondary" type="button" data-exam="listen" ${canSpeak ? '' : 'disabled'}>${icon('volume-2')}Hear again</button><button type="button" class="btn btn-ghost end" data-exam="end">${icon('square')}End interview</button></div>`;
  speak(question.q);
  examTimer = setInterval(() => {
    if (!exam || exam.revealed) { clearExamTimer(); return; }
    exam.remaining--;
    const counter = $('#exam-seconds');
    if (counter) {
      counter.textContent = formatTime(exam.remaining);
      const timer = counter.parentElement;
      timer.style.setProperty('--t', exam.remaining / exam.duration);
      timer.classList.toggle('low', exam.remaining <= 5);
    }
    if (exam.remaining <= 0) revealExamAnswer();
  }, 1000);
}

function revealExamAnswer() {
  if (!exam || exam.revealed) return;
  clearExamTimer(); stopSpeech(); exam.revealed = true;
  const question = questionById(exam.order[exam.index]);
  $('#exam-content').innerHTML = `${examHeader(question)}<div class="exam-answer">${escapeHTML(question.a)}${cueMarkup(question.cue)}</div><div class="exam-grade"><p>Did you remember it word for word?</p><button type="button" class="btn btn-secondary" data-exam="missed">${icon('x')}Needs work</button><button type="button" class="btn btn-primary" data-exam="correct">${icon('check')}Got it</button><button type="button" class="btn btn-ghost" data-exam="end">${icon('square')}End interview</button></div>`;
  announce('Answer revealed. Compare your answer and give yourself a score.');
}

function renderExamSummary() {
  clearExamTimer(); stopSpeech();
  const results = [...exam.results];
  const correct = results.filter(result => result.correct).length;
  $('#exam-content').innerHTML = `<div class="exam-summary"><p class="eyebrow">${results.length} of ${questions.length} questions answered</p><h2>${results.length ? 'Interview complete' : 'No answers graded'}</h2><div class="exam-score">${correct}<span>/ ${results.length} remembered</span></div><p>${results.length && correct === results.length ? 'Every answer word for word.' : results.length ? 'Practice the ones marked below, then try again.' : 'Start a new interview to grade your answers.'}</p><button type="button" class="btn btn-primary" data-exam="restart">${icon('rotate-ccw')}New interview</button>${results.length ? `<ol class="exam-review" aria-label="Your answers">${results.map(result => `<li><span class="${result.correct ? 'ok' : 'miss'}" aria-label="${result.correct ? 'Got it' : 'Needs work'}">${icon(result.correct ? 'check' : 'x')}</span><span>Q${result.id} · ${escapeHTML(questionById(result.id).q)}</span></li>`).join('')}</ol>` : ''}</div>`;
  exam = null;
}

function navigate() {
  const requested = location.hash.slice(1);
  // The old "About the work" page now lives on the home page.
  if (requested === 'work') history.replaceState(null, '', '#home');
  // In-page anchors (the skip link) are not routes.
  else if (requested && !views.includes(requested) && document.getElementById(requested)) return;
  const nextView = views.includes(requested) ? requested : 'home';
  if (nextView !== activeView) {
    stopSpeech();
    if (recognition && listening) recognition.abort();
    if (activeView === 'exam') renderExamStart();
  }
  const changed = nextView !== activeView;
  activeView = nextView;
  for (const view of views) $(`#view-${view}`).hidden = view !== activeView;
  if (changed) window.scrollTo(0, 0);
  document.querySelectorAll('[data-tab]').forEach(link => {
    if (link.dataset.tab === activeView) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const nav = $('.nav');
  nav.style.setProperty('--i', views.indexOf(activeView));
  // Enable the indicator slide only after its first placement, so the page never animates in from tab 0.
  if (!nav.classList.contains('nav-ready')) requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.add('nav-ready')));
  document.title = `${viewTitles[activeView]} · Lucas Costa`;
}

function bindEvents() {
  window.addEventListener('hashchange', navigate);
  window.addEventListener('pagehide', () => { stopSpeech(); clearExamTimer(); if (recognition && listening) recognition.abort(); });
  $('#memory-mode').addEventListener('change', renderMemorize);
  $('#speech-rate').addEventListener('input', event => { speechRate = Number(event.target.value); $('#rate-value').value = `${speechRate.toFixed(1)}×`; });
  $('#question-list').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.speak) {
      if (button === speakingButton) stopSpeech();
      else speak(questionById(button.dataset.speak).a, button);
    }
    if (button.classList.contains('cloze-word')) {
      button.replaceWith(document.createTextNode(button.dataset.word));
    }
    if (button.classList.contains('answer-hidden')) {
      button.parentElement.textContent = questionById(button.closest('[data-question]').dataset.question).a;
    }
    if (button.classList.contains('translation-toggle')) {
      const translation = document.getElementById(button.getAttribute('aria-controls'));
      translation.hidden = !translation.hidden;
      button.setAttribute('aria-expanded', String(!translation.hidden));
      button.innerHTML = `${icon('languages')}${translation.hidden ? 'Show Portuguese' : 'Hide Portuguese'}`;
    }
  });
  $('#flash-card').addEventListener('click', () => { flipped = !flipped; renderFlashcard(); });
  $('#flash-prev').addEventListener('click', () => moveFlashcard(-1));
  $('#flash-next').addEventListener('click', () => moveFlashcard(1));
  $('#again').addEventListener('click', () => markFlashcard(false));
  $('#got-it').addEventListener('click', () => markFlashcard(true));
  $('#shuffle').addEventListener('click', () => { flashOrder = shuffled(flashOrder); flashIndex = 0; flipped = false; renderFlashcard(); });
  $('#reset-known').addEventListener('click', () => {
    if (window.confirm('Reset all memorized answers? This cannot be undone.')) { known.clear(); updateProgress(true); renderFlashcard(); announce('Memorization progress reset.'); }
  });
  document.addEventListener('keydown', event => {
    if (activeView !== 'flashcards' || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); moveFlashcard(event.key === 'ArrowLeft' ? -1 : 1); }
    if (event.code === 'Space' && event.target.tagName !== 'BUTTON' && event.target.tagName !== 'A') { event.preventDefault(); flipped = !flipped; renderFlashcard(); }
  });
  let touchStart = null;
  let swiped = false;
  $('#flash-card').addEventListener('touchstart', event => { touchStart = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }; swiped = false; }, { passive: true });
  $('#flash-card').addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { swiped = true; moveFlashcard(dx < 0 ? 1 : -1); }
    touchStart = null;
  }, { passive: true });
  $('#flash-card').addEventListener('click', event => { if (swiped) { event.stopImmediatePropagation(); event.preventDefault(); swiped = false; } }, true);
  $('#practice-picker').addEventListener('click', event => {
    const button = event.target.closest('[data-q]');
    if (button) selectPractice(Number(button.dataset.q));
  });
  $('#practice-random').addEventListener('click', () => {
    const alternatives = questions.filter(q => q.id !== practiceId);
    selectPractice(alternatives[Math.floor(Math.random() * alternatives.length)].id);
  });
  $('#practice-input').addEventListener('input', () => { $('#practice-result').hidden = true; });
  $('#check-answer').addEventListener('click', checkAnswer);
  $('#exam-content').addEventListener('click', event => {
    const action = event.target.closest('[data-exam]')?.dataset.exam;
    if (!action) return;
    if (action === 'start') { exam = { order: shuffled(questions.map(q => q.id)), index: 0, duration: Number($('#exam-duration').value), results: [] }; renderExamQuestion(); }
    else if (action === 'restart') renderExamStart();
    else if (action === 'listen' && exam) speak(questionById(exam.order[exam.index]).q);
    else if (action === 'reveal') revealExamAnswer();
    else if (action === 'end' && exam) renderExamSummary();
    else if (['correct', 'missed'].includes(action) && exam?.revealed) {
      exam.results.push({ id: exam.order[exam.index], correct: action === 'correct' });
      exam.index++;
      if (exam.index >= exam.order.length) renderExamSummary(); else renderExamQuestion();
    }
  });
}

async function initialize() {
  try {
    const response = await fetch('./content.json');
    if (!response.ok) throw new Error(`Content request failed (${response.status})`);
    const content = await response.json();
    questions = content.questions;
    loadKnown();
    renderPersona(content.persona);
    renderMemorize();
    flashOrder = questions.map(question => question.id);
    renderFlashcard();
    $('#practice-picker').innerHTML = questions.map(question => `<button type="button" data-q="${question.id}" aria-pressed="false" title="${escapeHTML(question.q)}" aria-label="Question ${question.id}: ${escapeHTML(question.q)}">${question.id}</button>`).join('');
    updateProgress();
    selectPractice(questions[0].id);
    renderExamStart();
    setupDictation();
    bindEvents();
    if (!canSpeak) { $('#speech-note').textContent = 'Text-to-speech is not available in this browser. Read the answers out loud to practice.'; $('#speech-note').hidden = false; }
    $('#loading').hidden = true;
    navigate();
  } catch (error) {
    $('#loading').textContent = 'The workbook could not load. Serve this folder with a static web server (rather than opening a file:// URL), check that content.json is beside index.html, then reload.';
    $('#loading').setAttribute('role', 'alert');
  }
}

setupTheme();
setupSidebar();
setupReveal();
initialize();
