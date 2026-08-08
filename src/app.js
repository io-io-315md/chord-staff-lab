import {
  buildChordSymbol,
  formatNoteName,
  formatKeyName,
  invertChordNotes,
  noteFromStaffPosition,
  parseChordSymbol,
  rankChordCandidates,
} from './music-theory.js?v=5';
import {
  pointerYInSvg,
  renderGrandStaff,
  staffPositionFromY,
} from './staff-renderer.js?v=5';

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
const inputStaff = document.querySelector('#input-staff');
const selectedNotesElement = document.querySelector('#selected-notes');
const candidateList = document.querySelector('#candidate-list');
const candidateCount = document.querySelector('#candidate-count');
const keyRoot = document.querySelector('#key-root');
const keyMode = document.querySelector('#key-mode');
const undoButton = document.querySelector('#undo-note');
const clearButton = document.querySelector('#clear-notes');

let activeAccidental = '';
let placedNotes = [];
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
  return {
    root: Number(keyRoot.value),
    mode: keyMode.value,
    preferFlats: selectedOption.textContent.includes('♭'),
  };
}

function emptyCandidateMarkup(message = '2音以上を置くと<br />候補を表示します。') {
  return `<div class="empty-candidates"><span aria-hidden="true">♪</span><p>${message}</p></div>`;
}

function renderCandidates() {
  const key = getKeyContext();
  const candidates = rankChordCandidates(placedNotes, key);
  candidateCount.textContent = candidates.length;
  candidateCount.title = `${formatKeyName(key)} で解析`;

  if (placedNotes.length < 2) {
    candidateList.innerHTML = emptyCandidateMarkup();
    return;
  }
  if (!candidates.length) {
    candidateList.innerHTML = emptyCandidateMarkup('一致する候補がありません。<br />音を追加してみてください。');
    return;
  }

  candidateList.innerHTML = candidates
    .map((candidate, index) => `
      <article class="candidate-card">
        <div class="candidate-top">
          <div><span class="candidate-rank">${String(index + 1).padStart(2, '0')}</span><strong class="candidate-name">${candidate.symbol}</strong></div>
          <span class="match-badge${candidate.exact ? ' match-badge--exact' : ''}">${candidate.exact ? '完全一致' : `${candidate.confidence}%`}</span>
        </div>
        <p class="candidate-notes">${candidate.reasons.join(' · ')}</p>
      </article>`)
    .join('');
}

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
  renderCandidates();
}

function removeNote(id) {
  placedNotes = placedNotes.filter((note) => note.id !== id);
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
  placedNotes.pop();
  renderStaffAnalysis();
});

clearButton.addEventListener('click', () => {
  placedNotes = [];
  renderStaffAnalysis();
});

keyRoot.addEventListener('change', renderCandidates);
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
  renderCurrentChord();
  renderStaffAnalysis();
}

noteNamingButtons.forEach((button) => {
  button.addEventListener('click', () => applyNoteNaming(button.dataset.noteNaming));
});

applyNoteNaming(noteNaming);
updateChordSelection();
