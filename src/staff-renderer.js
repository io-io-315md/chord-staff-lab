const SVG_NS = 'http://www.w3.org/2000/svg';
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const STEP = 7;
const STAFF_X_START = 76;
const STAFF_X_END = 704;
const NOTE_X = 390;
const DIATONIC_Y_CONSTANT = 468;

function svgElement(name, attributes = {}, text = '') {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  if (text) element.textContent = text;
  return element;
}

export function diatonicNumber(note) {
  return note.octave * 7 + LETTERS.indexOf(note.letter);
}

export function yForNote(note) {
  return DIATONIC_Y_CONSTANT - diatonicNumber(note) * STEP;
}

export function staffPositionFromY(y) {
  const number = Math.max(14, Math.min(42, Math.round((DIATONIC_Y_CONSTANT - y) / STEP)));
  return {
    letter: LETTERS[((number % 7) + 7) % 7],
    octave: Math.floor(number / 7),
    number,
  };
}

function drawStaffLines(svg, yValues) {
  yValues.forEach((y) => {
    svg.append(svgElement('line', { x1: STAFF_X_START, y1: y, x2: STAFF_X_END, y2: y, class: 'staff-line' }));
  });
}

function ledgerNumbersForNote(note) {
  const number = diatonicNumber(note);
  const isTreble = note.midi >= 60;
  const ledgers = [];
  if (isTreble) {
    for (let current = 28; current >= number; current -= 2) ledgers.push(current);
    for (let current = 40; current <= number; current += 2) ledgers.push(current);
  } else {
    for (let current = 16; current >= number; current -= 2) ledgers.push(current);
    for (let current = 28; current <= number; current += 2) ledgers.push(current);
  }
  return ledgers;
}

function accidentalGlyph(accidental) {
  return accidental || '';
}

function noteXOffsets(notes) {
  const sorted = notes
    .map((note, index) => ({ note, index, number: diatonicNumber(note) }))
    .sort((a, b) => a.number - b.number);
  const offsets = Array(notes.length).fill(0);
  sorted.forEach((entry, index) => {
    const previous = sorted[index - 1];
    if (previous && entry.number - previous.number === 1) offsets[entry.index] = offsets[previous.index] === 0 ? 13 : 0;
  });
  return offsets;
}

function renderNote(svg, note, xOffset, interactive, noteLabelFormatter) {
  const y = yForNote(note);
  const x = NOTE_X + xOffset;
  const group = svgElement('g', {
    class: `staff-note${interactive ? ' staff-note--interactive' : ''}`,
    role: interactive ? 'button' : 'img',
    tabindex: interactive ? '0' : '-1',
    'aria-label': `${noteLabelFormatter(note)}${note.octave}${interactive ? ' を削除' : ''}`,
    'data-note-id': note.id || '',
  });

  ledgerNumbersForNote(note).forEach((number) => {
    group.append(svgElement('line', {
      x1: x - 17,
      y1: DIATONIC_Y_CONSTANT - number * STEP,
      x2: x + 18,
      y2: DIATONIC_Y_CONSTANT - number * STEP,
      class: 'ledger-line',
    }));
  });

  if (note.accidental) {
    group.append(svgElement('text', { x: x - 23, y: y + 6, class: 'accidental' }, accidentalGlyph(note.accidental)));
  }
  group.append(svgElement('ellipse', { cx: x, cy: y, rx: 9.5, ry: 6.6, transform: `rotate(-18 ${x} ${y})`, class: 'note-head' }));
  if (interactive) {
    group.append(svgElement('line', { x1: x + 8, y1: y - 1, x2: x + 8, y2: y - 36, class: 'note-stem' }));
  }
  return group;
}

export function renderGrandStaff(svg, notes = [], {
  interactive = false,
  emptyMessage = '',
  noteLabelFormatter = (note) => note.display,
} = {}) {
  svg.replaceChildren();
  svg.setAttribute('viewBox', '0 140 780 248');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.toggle('grand-staff--interactive', interactive);

  const background = svgElement('rect', { x: 10, y: 142, width: 760, height: 242, rx: 20, class: 'staff-background' });
  svg.append(background);
  drawStaffLines(svg, [202, 216, 230, 244, 258]);
  drawStaffLines(svg, [286, 300, 314, 328, 342]);
  svg.append(svgElement('line', { x1: STAFF_X_START, y1: 202, x2: STAFF_X_START, y2: 342, class: 'staff-bar' }));
  svg.append(svgElement('line', { x1: STAFF_X_END, y1: 202, x2: STAFF_X_END, y2: 342, class: 'staff-bar staff-bar--end' }));
  svg.append(svgElement('text', { x: 86, y: 252, class: 'clef clef--treble' }, '𝄞'));
  svg.append(svgElement('text', { x: 91, y: 336, class: 'clef clef--bass' }, '𝄢'));

  if (interactive) {
    for (let number = 14; number <= 42; number += 1) {
      const y = DIATONIC_Y_CONSTANT - number * STEP;
      svg.append(svgElement('rect', { x: 150, y: y - STEP / 2, width: 535, height: STEP, class: 'pitch-hit-zone', 'data-diatonic': number }));
    }
  }

  if (!notes.length && emptyMessage) {
    svg.append(svgElement('text', { x: 420, y: 273, class: 'staff-empty', 'text-anchor': 'middle' }, emptyMessage));
  }

  const offsets = noteXOffsets(notes);
  if (notes.length && !interactive) {
    const noteYs = notes.map(yForNote);
    svg.append(svgElement('line', {
      x1: NOTE_X + 8,
      y1: Math.max(...noteYs) - 1,
      x2: NOTE_X + 8,
      y2: Math.min(...noteYs) - 36,
      class: 'note-stem note-stem--shared',
    }));
  }
  notes.forEach((note, index) => svg.append(renderNote(svg, note, offsets[index], interactive, noteLabelFormatter)));
}

export function pointerYInSvg(svg, event) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  return point.matrixTransform(matrix.inverse()).y;
}
