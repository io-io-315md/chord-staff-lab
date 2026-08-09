const SVG_NS = 'http://www.w3.org/2000/svg';
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const STEP = 7;
const STAFF_X_START = 76;
const STAFF_X_END = 704;
const NOTE_X = 390;
const DIATONIC_Y_CONSTANT = 468;
const LEDGER_LINE_HALF_WIDTH = 24;

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

export function ledgerLineBounds(x) {
  return {
    x1: x - LEDGER_LINE_HALF_WIDTH,
    x2: x + LEDGER_LINE_HALF_WIDTH,
  };
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

export function accidentalColumns(notes) {
  const assignments = Array(notes.length).fill(null);
  const columnYs = [];
  notes
    .map((note, index) => ({ note, index, y: yForNote(note) }))
    .filter(({ note }) => Boolean(note.accidental))
    .sort((a, b) => a.y - b.y)
    .forEach(({ index, y }) => {
      let column = columnYs.findIndex((usedYs) => usedYs.every((usedY) => Math.abs(usedY - y) >= 21));
      if (column === -1) {
        column = columnYs.length;
        columnYs.push([]);
      }
      columnYs[column].push(y);
      assignments[index] = column;
    });
  return assignments;
}

function renderNote(svg, note, xOffset, accidentalColumn, interactive, noteLabelFormatter, noteClass) {
  const y = yForNote(note);
  const x = NOTE_X + xOffset;
  const group = svgElement('g', {
    class: `staff-note${interactive ? ' staff-note--interactive' : ''}${noteClass ? ` ${noteClass}` : ''}`,
    role: interactive ? 'button' : 'img',
    tabindex: interactive ? '0' : '-1',
    'aria-label': `${noteLabelFormatter(note)}${note.octave}${interactive ? ' を削除' : ''}`,
    'data-note-id': note.id || '',
  });

  ledgerNumbersForNote(note).forEach((number) => {
    const { x1, x2 } = ledgerLineBounds(x);
    group.append(svgElement('line', {
      x1,
      y1: DIATONIC_Y_CONSTANT - number * STEP,
      x2,
      y2: DIATONIC_Y_CONSTANT - number * STEP,
      class: 'ledger-line',
    }));
  });

  if (note.accidental) {
    const accidentalX = NOTE_X - 35 - (accidentalColumn || 0) * 24;
    group.append(svgElement('text', {
      x: accidentalX,
      y: y + 7,
      class: 'accidental',
      'text-anchor': 'middle',
    }, accidentalGlyph(note.accidental)));
  }
  group.append(svgElement('ellipse', { cx: x, cy: y, rx: 9.5, ry: 6.6, transform: `rotate(-18 ${x} ${y})`, class: 'note-head' }));
  return group;
}

export function renderGrandStaff(svg, notes = [], {
  interactive = false,
  emptyMessage = '',
  noteLabelFormatter = (note) => note.display,
  noteClassResolver = () => '',
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
  svg.append(svgElement('text', { x: 84, y: 326, class: 'clef clef--bass' }, '𝄢'));

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
  const accidentalColumnByNote = accidentalColumns(notes);
  if (notes.length) {
    const noteYs = notes.map(yForNote);
    svg.append(svgElement('line', {
      x1: NOTE_X + 8,
      y1: Math.max(...noteYs) - 1,
      x2: NOTE_X + 8,
      y2: Math.min(...noteYs) - 36,
      class: 'note-stem note-stem--shared',
    }));
  }
  notes.forEach((note, index) => svg.append(renderNote(
    svg,
    note,
    offsets[index],
    accidentalColumnByNote[index],
    interactive,
    noteLabelFormatter,
    noteClassResolver(note),
  )));
}

export function renderNoteReadingStaff(svg, noteLabelFormatter = (note) => note.display) {
  const scaleNotes = [
    { display: 'C', octave: 4, y: 98 },
    { display: 'D', octave: 4, y: 91 },
    { display: 'E', octave: 4, y: 84 },
    { display: 'F', octave: 4, y: 77 },
    { display: 'G', octave: 4, y: 70 },
    { display: 'A', octave: 4, y: 63 },
    { display: 'B', octave: 4, y: 56 },
  ];

  svg.replaceChildren();
  svg.setAttribute('viewBox', '0 0 700 126');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-label', `五線譜上の ${scaleNotes.map((note) => noteLabelFormatter(note)).join('、')}`);

  [28, 42, 56, 70, 84].forEach((y) => {
    svg.append(svgElement('line', { x1: 0, y1: y, x2: 700, y2: y, class: 'reading-staff-line' }));
  });
  svg.append(svgElement('text', { x: 4, y: 84, class: 'reading-clef' }, '𝄞'));

  scaleNotes.forEach((note, index) => {
    const x = 50 + index * 100;
    if (index === 0) {
      svg.append(svgElement('line', { x1: x - 14, y1: 98, x2: x + 15, y2: 98, class: 'reading-ledger-line' }));
    }
    svg.append(svgElement('line', { x1: x + 7, y1: note.y - 1, x2: x + 7, y2: note.y - 30, class: 'reading-note-stem' }));
    svg.append(svgElement('ellipse', { cx: x, cy: note.y, rx: 8.5, ry: 5.8, transform: `rotate(-18 ${x} ${note.y})`, class: 'reading-note-head' }));
  });
}

export function pointerYInSvg(svg, event) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  return point.matrixTransform(matrix.inverse()).y;
}
