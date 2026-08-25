import { createBonsai, SPECIES } from './bonsai-model.js';
import { renderBonsai } from './render.js';
import { advanceTime } from './growth.js';
import { pruneBranch, bendBranch, thinLeaves } from './actions.js';
import { generateCouncilReport } from './council.js';
import { loadAll, saveRecord } from './storage.js';
import { formatDate, pick } from './utils.js';

const screens = {};
document.querySelectorAll('.screen').forEach((s) => {
  screens[s.id] = s;
});

function showScreen(id) {
  Object.values(screens).forEach((s) => s.classList.remove('active'));
  screens[`screen-${id}`].classList.add('active');
}

const $ = (id) => document.getElementById(id);

let currentBonsai = null;
let mode = null;
let selectedBranchId = null;
let pendingCouncil = null;
let toastTimer = null;

/* ---------- Modal ---------- */
const modalOverlay = $('modal-overlay');
const modalText = $('modal-text');
const modalConfirm = $('modal-confirm');
const modalCancel = $('modal-cancel');

function showConfirm(text, confirmLabel, onConfirm) {
  modalText.textContent = text;
  modalConfirm.textContent = confirmLabel;
  modalOverlay.classList.add('open');
  function cleanup() {
    modalOverlay.classList.remove('open');
    modalConfirm.removeEventListener('click', onConfirmHandler);
    modalCancel.removeEventListener('click', onCancelHandler);
  }
  function onConfirmHandler() {
    cleanup();
    onConfirm();
  }
  function onCancelHandler() {
    cleanup();
  }
  modalConfirm.addEventListener('click', onConfirmHandler);
  modalCancel.addEventListener('click', onCancelHandler);
}

/* ---------- Title screen ---------- */
function renderTitlePreview() {
  const stage = $('title-stage');
  const keys = Object.keys(SPECIES);
  const preview = createBonsai(pick(keys));
  renderBonsai(stage, preview, { interactive: false });
}

$('btn-start').addEventListener('click', () => {
  $('title-menu').style.display = 'none';
  $('species-picker').classList.add('open');
});

$('btn-species-cancel').addEventListener('click', () => {
  $('species-picker').classList.remove('open');
  $('title-menu').style.display = '';
});

document.querySelectorAll('#species-picker [data-species]').forEach((btn) => {
  btn.addEventListener('click', () => {
    startNewBonsai(btn.dataset.species);
  });
});

$('btn-gallery-from-title').addEventListener('click', () => {
  showScreen('gallery');
  renderGalleryList();
});

/* ---------- Grow screen ---------- */
function startNewBonsai(speciesKey) {
  currentBonsai = createBonsai(speciesKey);
  mode = null;
  selectedBranchId = null;
  $('species-picker').classList.remove('open');
  $('title-menu').style.display = '';
  showScreen('grow');
  renderGrow();
}

function setMode(m) {
  mode = mode === m ? null : m;
  selectedBranchId = null;
  renderGrow();
}

function updateToolbarState() {
  $('mode-prune').classList.toggle('active-mode', mode === 'prune');
  $('mode-bend').classList.toggle('active-mode', mode === 'bend');
  $('mode-leaf').classList.toggle('active-mode', mode === 'leaf');
  $('bend-controls').classList.toggle('open', mode === 'bend' && !!selectedBranchId);
}

function handleSelectBranch(id) {
  if (mode === 'prune') {
    showConfirm('この枝を剪定しますか？', '剪定する', () => {
      pruneBranch(currentBonsai, id);
      selectedBranchId = null;
      renderGrow();
    });
  } else if (mode === 'bend') {
    selectedBranchId = id;
    renderGrow();
  }
}

function handleSelectLeaf(id) {
  if (mode === 'leaf') {
    thinLeaves(currentBonsai, id);
    renderGrow();
  }
}

function renderGrow() {
  $('grow-species').textContent = currentBonsai.species;
  $('grow-age').textContent = `樹齢 ${currentBonsai.age} 年`;
  renderBonsai($('grow-stage'), currentBonsai, {
    interactive: true,
    mode,
    selectedId: selectedBranchId,
    onSelectBranch: handleSelectBranch,
    onSelectLeaf: handleSelectLeaf,
  });
  updateToolbarState();
}

function showToast(text) {
  const toast = $('grow-toast');
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

$('mode-prune').addEventListener('click', () => setMode('prune'));
$('mode-bend').addEventListener('click', () => setMode('bend'));
$('mode-leaf').addEventListener('click', () => setMode('leaf'));

$('btn-advance').addEventListener('click', () => {
  if (!currentBonsai) return;
  const desc = advanceTime(currentBonsai);
  showToast(desc);
  renderGrow();
});

$('btn-bend-left').addEventListener('click', () => {
  if (selectedBranchId) {
    bendBranch(currentBonsai, selectedBranchId, -1);
    renderGrow();
  }
});

$('btn-bend-right').addEventListener('click', () => {
  if (selectedBranchId) {
    bendBranch(currentBonsai, selectedBranchId, 1);
    renderGrow();
  }
});

$('btn-complete').addEventListener('click', () => {
  if (!currentBonsai) return;
  showConfirm('この盆栽を完成させますか？\n完成後は編集できません。', '完成させる', () => {
    currentBonsai.completed = true;
    currentBonsai.completedAt = new Date().toISOString();
    pendingCouncil = generateCouncilReport(currentBonsai);
    showScreen('council');
    renderCouncil();
  });
});

/* ---------- Council screen ---------- */
function buildReviewerCard(reviewer) {
  const card = document.createElement('div');
  card.className = 'reviewer-card';
  const name = document.createElement('div');
  name.className = 'reviewer-name';
  name.textContent = reviewer.name;
  const title = document.createElement('div');
  title.className = 'reviewer-title';
  title.textContent = reviewer.title;
  const comment = document.createElement('div');
  comment.className = 'reviewer-comment';
  comment.textContent = reviewer.comment;
  card.appendChild(name);
  card.appendChild(title);
  card.appendChild(comment);
  return card;
}

function renderCouncil() {
  renderBonsai($('council-stage'), currentBonsai, { interactive: false });

  const reviewersEl = $('reviewers');
  reviewersEl.innerHTML = '';
  pendingCouncil.reviewers.forEach((r, i) => {
    const card = buildReviewerCard(r);
    reviewersEl.appendChild(card);
    setTimeout(() => card.classList.add('visible'), 400 + i * 550);
  });

  const finalEl = $('council-final');
  finalEl.textContent = pendingCouncil.final;
  finalEl.classList.remove('visible');
  const namingArea = $('naming-area');
  namingArea.classList.remove('visible');
  $('bonsai-name-input').value = '';

  const finalDelay = 400 + pendingCouncil.reviewers.length * 550 + 400;
  setTimeout(() => finalEl.classList.add('visible'), finalDelay);
  setTimeout(() => namingArea.classList.add('visible'), finalDelay + 500);
}

$('btn-save-gallery').addEventListener('click', () => {
  const name = $('bonsai-name-input').value;
  saveRecord(currentBonsai, pendingCouncil, name);
  currentBonsai = null;
  pendingCouncil = null;
  showScreen('gallery');
  renderGalleryList();
});

/* ---------- Gallery screen ---------- */
function renderGalleryList() {
  $('gallery-list-wrap').style.display = 'flex';
  $('gallery-detail').classList.remove('open');

  const list = $('gallery-list');
  list.innerHTML = '';
  const all = loadAll();
  if (!all.length) {
    const empty = document.createElement('div');
    empty.className = 'gallery-empty';
    empty.textContent = 'まだ完成した盆栽がありません。';
    list.appendChild(empty);
    return;
  }
  all.forEach((record) => {
    const card = document.createElement('div');
    card.className = 'gallery-card';

    const stageWrap = document.createElement('div');
    stageWrap.className = 'gallery-card-stage';
    const stage = document.createElement('div');
    stage.className = 'bonsai-stage mini';
    stageWrap.appendChild(stage);

    const nameEl = document.createElement('div');
    nameEl.className = 'gallery-card-name';
    nameEl.textContent = record.name;

    const metaEl = document.createElement('div');
    metaEl.className = 'gallery-card-meta';
    metaEl.textContent = `${record.species} ・ 樹齢${record.age}年 ・ ${formatDate(record.completedAt)}`;

    card.appendChild(stageWrap);
    card.appendChild(nameEl);
    card.appendChild(metaEl);
    card.addEventListener('click', () => openDetail(record));
    list.appendChild(card);

    renderBonsai(stage, record.bonsaiData, { interactive: false });
  });
}

function openDetail(record) {
  $('gallery-list-wrap').style.display = 'none';
  $('gallery-detail').classList.add('open');

  renderBonsai($('detail-stage'), record.bonsaiData, { interactive: false });

  const meta = $('detail-meta');
  meta.innerHTML = '';
  const h3 = document.createElement('h3');
  h3.textContent = record.name;
  const sub = document.createElement('div');
  sub.className = 'detail-sub';
  sub.textContent = `${record.species} ・ 樹齢${record.age}年 ・ 完成日 ${formatDate(record.completedAt)}`;
  meta.appendChild(h3);
  meta.appendChild(sub);

  const reviewersEl = $('detail-reviewers');
  reviewersEl.innerHTML = '';
  record.council.reviewers.forEach((r) => {
    const card = buildReviewerCard(r);
    card.classList.add('visible');
    reviewersEl.appendChild(card);
  });

  $('detail-final').textContent = record.council.final;
}

$('btn-detail-back').addEventListener('click', () => {
  $('gallery-detail').classList.remove('open');
  $('gallery-list-wrap').style.display = 'flex';
});

$('btn-back-title').addEventListener('click', () => {
  showScreen('title');
  renderTitlePreview();
});

/* ---------- Init ---------- */
renderTitlePreview();
