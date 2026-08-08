import {
  buildChordSymbol,
  formatNoteName,
  formatKeyName,
  invertChordNotes,
  noteFromStaffPosition,
  parseChordSymbol,
  rankChordCandidates,
} from './music-theory.js?v=10';
import {
  pointerYInSvg,
  renderGrandStaff,
  renderNoteReadingStaff,
  staffPositionFromY,
} from './staff-renderer.js?v=10';

const chordForm = document.querySelector('#chord-form');
const chordRoot = document.querySelector('#chord-root');
const chordQuality = document.querySelector('#chord-quality');
const chordBass = document.querySelector('#chord-bass');
const selectedChordSymbol = document.querySelector('#selected-chord-symbol');
const chordError = document.querySelector('#chord-error');
const chordStaff = document.querySelector('#chord-staff');
const displayedChord = document.querySelector('#displayed-chord');
const toneSummary = document.querySelector('#tone-summary');
const invertDownButton = document.querySelector('#invert-down');
const invertUpButton = document.querySelector('#invert-up');
const resetInversionButton = document.querySelector('#reset-inversion');
const inversionAction = document.querySelector('#inversion-action');
const inversionLabel = document.querySelector('#inversion-label');
const noteNamingButtons = document.querySelectorAll('[data-note-naming]');
const noteReadingStaff = document.querySelector('#note-reading-staff');
const inputStaff = document.querySelector('#input-staff');
const selectedNotesElement = document.querySelector('#selected-notes');
const staffInvertDownButton = document.querySelector('#staff-invert-down');
const staffInvertUpButton = document.querySelector('#staff-invert-up');
const staffResetInversionButton = document.querySelector('#staff-reset-inversion');
const staffInversionAction = document.querySelector('#staff-inversion-action');
const staffInversionLabel = document.querySelector('#staff-inversion-label');
const candidateList = document.querySelector('#candidate-list');
const candidateCount = document.querySelector('#candidate-count');
const candidatePreview = document.querySelector('#candidate-preview');
const candidatePreviewName = document.querySelector('#candidate-preview-name');
const candidatePreviewStaff = document.querySelector('#candidate-preview-staff');
const candidatePreviewDetail = document.querySelector('#candidate-preview-detail');
const keyRoot = document.querySelector('#key-root');
const keyMode = document.querySelector('#key-mode');
const undoButton = document.querySelector('#undo-note');
const clearButton = document.querySelector('#clear-notes');

let activeAccidental = '';
let placedNotes = [];
let staffBaseNotes = [];
let staffInversionSteps = 0;
let currentCandidates = [];
let currentChord = null;
let inversionSteps = 0;
let noteNaming = 'letter';

try {
  const savedNoteNaming = localStorage.getItem('chord-staff-lab-note-naming');
  if (savedNoteNaming === 'solfege') noteNaming = savedNoteNaming;
} catch {
  // The preference still works for this visit when storage is unavailable.
}

function displayedNoteName(note) {
  return formatNoteName(note, noteNaming);
}

function getSelectedChordSymbol() {
  return buildChordSymbol(chordRoot.value, chordQuality.value, chordBass.value);
}

function updateChordSelection({ render = true } = {}) {
  const symbol = getSelectedChordSymbol();
  selectedChordSymbol.textContent = symbol.replaceAll('#', '♯').replaceAll('b', '♭');
  if (render) renderChord(symbol);
}

function renderCurrentChord() {
  if (!currentChord) return;

  const renderedNotes = invertChordNotes(currentChord.notes, inversionSteps);
  const maxInversions = Math.max(1, currentChord.notes.length - 1);
  displayedChord.textContent = currentChord.symbol;
  renderGrandStaff(chordStaff, renderedNotes, { noteLabelFormatter: displayedNoteName });
  const isBasicVoicing = inversionSteps === 0;
  inversionAction.textContent = isBasicVoicing ? 'VOICING' : 'RESET';
  inversionLabel.textContent = isBasicVoicing ? '基本配置' : '元に戻す';
  resetInversionButton.setAttribute('aria-label', isBasicVoicing ? '基本配置' : '基本配置に戻す');
  invertUpButton.disabled = inversionSteps >= maxInversions;
  invertDownButton.disabled = inversionSteps <= -maxInversions;
  resetInversionButton.disabled = inversionSteps === 0;

  toneSummary.style.setProperty('--tone-count', currentChord.type.tones.length);
  toneSummary.innerHTML = `
    <div class="tone-root">
      <small>ROOT</small>
      <strong>${currentChord.root.display}</strong>
    </div>
    <div class="tone-table">
      ${currentChord.notes
        .filter((note) => note.role !== 'bass')
        .map((note) => `<div class="tone-cell"><span>${note.degree}</span><strong>${displayedNoteName(note)}</strong></div>`)
        .join('')}
    </div>`;
}

function renderChord(value, { resetInversion = true } = {}) {
  try {
    currentChord = parseChordSymbol(value);
    if (resetInversion) inversionSteps = 0;
    chordError.hidden = true;
    renderCurrentChord();
    return true;
  } catch (error) {
    chordError.textContent = error.message;
    chordError.hidden = false;
    return false;
  }
}

invertDownButton.addEventListener('click', () => {
  const maxInversions = Math.max(1, currentChord.notes.length - 1);
  if (inversionSteps > -maxInversions) {
    inversionSteps -= 1;
    renderCurrentChord();
  }
});

invertUpButton.addEventListener('click', () => {
  const maxInversions = Math.max(1, currentChord.notes.length - 1);
  if (inversionSteps < maxInversions) {
    inversionSteps += 1;
    renderCurrentChord();
  }
});

resetInversionButton.addEventListener('click', () => {
  inversionSteps = 0;
  renderCurrentChord();
});

chordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  updateChordSelection();
});

[chordRoot, chordQuality, chordBass].forEach((select) => {
  select.addEventListener('change', () => updateChordSelection());
});

document.querySelectorAll('.mode-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mode-tab').forEach((item) => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
    });
    document.querySelector('#panel-chord').hidden = tab.dataset.mode !== 'chord';
    document.querySelector('#panel-staff').hidden = tab.dataset.mode !== 'staff';
    if (tab.dataset.mode === 'staff') renderStaffAnalysis();
  });
});

function getKeyContext() {
  const selectedOption = keyRoot.options[keyRoot.selectedIndex];
  if (!keyRoot.value) return null;
  return {
    root: Number(keyRoot.value),
    mode: keyMode.value,
    preferFlats: selectedOption.textContent.includes('♭'),
  };
}

function emptyCandidateMarkup(message = '2音以上を置くと<br />候補を表示します。') {
  return `<div class="empty-candidates"><span aria-hidden="true">♪</span><p>${message}</p></div>`;
}

function clearCandidatePreview() {
  candidatePreview.classList.add('is-empty');
  candidatePreviewName.textContent = '候補を選択';
  candidatePreviewStaff.replaceChildren();
  candidatePreviewDetail.textContent = '右の候補にカーソルを合わせるか、タップすると音符を表示します。';
  candidateList.querySelectorAll('.candidate-card').forEach((card) => card.classList.remove('is-previewing'));
}

function candidateNoteList(notes) {
  return notes.length ? notes.map((note) => displayedNoteName(note)).join('・') : 'なし';
}

function renderCandidatePreview(candidate, index) {
  if (!candidate) {
    clearCandidatePreview();
    return;
  }

  const inputPitchClasses = new Set(placedNotes.map((note) => note.pitchClass));
  const previewChord = parseChordSymbol(candidate.symbol);
  candidatePreview.classList.remove('is-empty');
  candidatePreviewName.textContent = candidate.symbol;
  renderGrandStaff(candidatePreviewStaff, previewChord.notes, {
    noteLabelFormatter: displayedNoteName,
    noteClassResolver: (note) => inputPitchClasses.has(note.pitchClass) ? 'staff-note--matched' : 'staff-note--missing',
  });
  const matchedCount = candidate.type.tones.length - candidate.missingNoteNames.length;
  const missingText = candidateNoteList(candidate.missingNoteNames);
  const extraText = candidateNoteList(candidate.extraNoteNames);
  candidatePreviewDetail.textContent = `一致 ${matchedCount}/${candidate.type.tones.length}音　不足: ${missingText}　余分: ${extraText}`;
  candidateList.querySelectorAll('.candidate-card').forEach((card) => {
    card.classList.toggle('is-previewing', Number(card.dataset.candidateIndex) === index);
  });
}

function renderCandidates() {
  const key = getKeyContext();
  const candidates = rankChordCandidates(placedNotes, key);
  currentCandidates = candidates;
  candidateCount.textContent = candidates.length;
  candidateCount.title = `${formatKeyName(key)} で解析`;

  if (placedNotes.length < 2) {
    candidateList.innerHTML = emptyCandidateMarkup();
    clearCandidatePreview();
    return;
  }
  if (!candidates.length) {
    candidateList.innerHTML = emptyCandidateMarkup('一致する候補がありません。<br />音を追加してみてください。');
    clearCandidatePreview();
    return;
  }

  candidateList.innerHTML = candidates
    .map((candidate, index) => `
      <article class="candidate-card" data-candidate-index="${index}" tabindex="0" role="button" aria-label="${candidate.symbol}の五線譜と一致内容を表示">
        <div class="candidate-top">
          <div><span class="candidate-rank">${String(index + 1).padStart(2, '0')}</span><strong class="candidate-name">${candidate.symbol}</strong></div>
          <span class="match-badge${candidate.exact ? ' match-badge--exact' : ''}">${candidate.exact ? '完全一致' : `${candidate.confidence}%`}</span>
        </div>
        <p class="candidate-notes">${candidate.reasons.join(' · ')}</p>
        <p class="candidate-comparison">不足: ${candidateNoteList(candidate.missingNoteNames)}　余分: ${candidateNoteList(candidate.extraNoteNames)}</p>
      </article>`)
    .join('');
  candidateList.querySelectorAll('.candidate-card').forEach((card) => {
    card.addEventListener('pointerenter', previewCandidateFromEvent);
    card.addEventListener('mouseenter', previewCandidateFromEvent);
  });
  clearCandidatePreview();
}

function previewCandidateFromEvent(event) {
  const card = event.target.closest?.('[data-candidate-index]');
  if (!card) return;
  const index = Number(card.dataset.candidateIndex);
  renderCandidatePreview(currentCandidates[index], index);
}

candidateList.addEventListener('focusin', previewCandidateFromEvent);
candidateList.addEventListener('click', previewCandidateFromEvent);

function renderPlacedNotes() {
  const sorted = [...placedNotes].sort((a, b) => a.midi - b.midi);
  selectedNotesElement.innerHTML = sorted.length
    ? sorted.map((note) => `<span class="note-chip">${displayedNoteName(note)}${note.octave}<button type="button" data-remove-note="${note.id}" aria-label="${displayedNoteName(note)}${note.octave} を削除">×</button></span>`).join('')
    : '<span class="field-hint">配置した音がここに並びます。</span>';
  undoButton.disabled = placedNotes.length === 0;
  clearButton.disabled = placedNotes.length === 0;
}

function renderStaffAnalysis() {
  renderGrandStaff(inputStaff, placedNotes, {
    interactive: true,
    emptyMessage: placedNotes.length ? '' : 'タップして音符を置く',
    noteLabelFormatter: displayedNoteName,
  });
  renderPlacedNotes();
  renderStaffInversionControls();
  renderCandidates();
}

function commitStaffBaseNotes() {
  staffBaseNotes = placedNotes.map((note) => ({ ...note }));
  staffInversionSteps = 0;
}

function renderStaffInversionControls() {
  const maxInversions = Math.max(0, staffBaseNotes.length - 1);
  const canInvert = maxInversions > 0;
  const isOriginal = staffInversionSteps === 0;
  staffInversionAction.textContent = isOriginal ? 'VOICING' : 'RESET';
  staffInversionLabel.textContent = isOriginal ? '入力時の配置' : '元に戻す';
  staffResetInversionButton.setAttribute('aria-label', isOriginal ? '入力時の配置' : '入力時の配置に戻す');
  staffInvertUpButton.disabled = !canInvert || staffInversionSteps >= maxInversions;
  staffInvertDownButton.disabled = !canInvert || staffInversionSteps <= -maxInversions;
  staffResetInversionButton.disabled = isOriginal;
}

function applyStaffInversion(nextSteps) {
  const maxInversions = Math.max(0, staffBaseNotes.length - 1);
  staffInversionSteps = Math.max(-maxInversions, Math.min(maxInversions, nextSteps));
  placedNotes = invertChordNotes(staffBaseNotes, staffInversionSteps);
  renderStaffAnalysis();
}

staffInvertDownButton.addEventListener('click', () => applyStaffInversion(staffInversionSteps - 1));
staffInvertUpButton.addEventListener('click', () => applyStaffInversion(staffInversionSteps + 1));
staffResetInversionButton.addEventListener('click', () => applyStaffInversion(0));

function removeNote(id) {
  placedNotes = placedNotes.filter((note) => note.id !== id);
  commitStaffBaseNotes();
  renderStaffAnalysis();
}

function placeNoteAtEvent(event) {
  const noteGroup = event.target.closest?.('[data-note-id]');
  if (noteGroup?.dataset.noteId) {
    removeNote(noteGroup.dataset.noteId);
    return;
  }
  const y = pointerYInSvg(inputStaff, event);
  if (y === null || y < 165 || y > 374) return;
  const position = staffPositionFromY(y);
  const note = noteFromStaffPosition(position.letter, position.octave, activeAccidental);
  placedNotes = placedNotes.filter((item) => !(item.letter === note.letter && item.octave === note.octave));
  placedNotes.push(note);
  commitStaffBaseNotes();
  renderStaffAnalysis();
}

inputStaff.addEventListener('pointerup', placeNoteAtEvent);
inputStaff.addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.dataset.noteId) {
    event.preventDefault();
    removeNote(event.target.dataset.noteId);
  }
});

selectedNotesElement.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-note]');
  if (button) removeNote(button.dataset.removeNote);
});

document.querySelector('#accidental-control').addEventListener('click', (event) => {
  const button = event.target.closest('[data-accidental]');
  if (!button) return;
  activeAccidental = button.dataset.accidental;
  document.querySelectorAll('#accidental-control button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
});

undoButton.addEventListener('click', () => {
  const lastAddedId = staffBaseNotes.at(-1)?.id;
  placedNotes = placedNotes.filter((note) => note.id !== lastAddedId);
  commitStaffBaseNotes();
  renderStaffAnalysis();
});

clearButton.addEventListener('click', () => {
  placedNotes = [];
  commitStaffBaseNotes();
  renderStaffAnalysis();
});

keyRoot.addEventListener('change', () => {
  keyMode.disabled = !keyRoot.value;
  renderCandidates();
});
keyMode.addEventListener('change', renderCandidates);

function applyNoteNaming(naming) {
  noteNaming = naming;
  document.documentElement.dataset.noteNaming = naming;
  noteNamingButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.noteNaming === naming));
  });
  try {
    localStorage.setItem('chord-staff-lab-note-naming', naming);
  } catch {
    // Ignore storage restrictions; the current page still updates.
  }
  renderNoteReadingStaff(noteReadingStaff, displayedNoteName);
  renderCurrentChord();
  renderStaffAnalysis();
}

noteNamingButtons.forEach((button) => {
  button.addEventListener('click', () => applyNoteNaming(button.dataset.noteNaming));
});

applyNoteNaming(noteNaming);
updateChordSelection();
