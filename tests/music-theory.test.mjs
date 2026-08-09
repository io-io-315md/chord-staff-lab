import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChordSymbol, formatKeyName, formatNoteName, frequencyForMidi, invertChordNotes, noteFromMidi, parseChordSymbol, rankChordCandidates } from '../src/music-theory.js';
import { accidentalColumns, ledgerLineBounds } from '../src/staff-renderer.js';

const displays = (symbol) => parseChordSymbol(symbol).notes.filter((note) => note.role !== 'bass').map((note) => note.display);
const inputNote = (display, pitchClass, midi) => ({ display, pitchClass, midi });

test('major seventh chord is parsed and spelled', () => {
  const chord = parseChordSymbol('Cmaj7');
  assert.equal(chord.symbol, 'Cmaj7');
  assert.deepEqual(displays('Cmaj7'), ['C', 'E', 'G', 'B']);
  assert.deepEqual(chord.type.tones.map((item) => item.label), ['1', '3', '5', '7']);
});

test('minor and dominant seventh chords are supported', () => {
  assert.deepEqual(displays('Am7'), ['A', 'C', 'E', 'G']);
  assert.deepEqual(displays('D7'), ['D', 'F♯', 'A', 'C']);
});

test('accidentals and half-diminished chords are spelled correctly', () => {
  const chord = parseChordSymbol('F#m7b5');
  assert.equal(chord.symbol, 'F♯m7♭5');
  assert.deepEqual(displays('F#m7b5'), ['F♯', 'A', 'C', 'E']);
});

test('flat roots and ninth extensions are preserved', () => {
  assert.deepEqual(displays('Bbmaj9'), ['B♭', 'D', 'F', 'A', 'C']);
});

test('altered dominant tensions are parsed and spelled by degree', () => {
  assert.deepEqual(displays('G7b9'), ['G', 'B', 'D', 'F', 'A♭']);
  assert.deepEqual(displays('G7#9'), ['G', 'B', 'D', 'F', 'A♯']);
  assert.deepEqual(displays('G7#11'), ['G', 'B', 'D', 'F', 'C♯']);
  assert.deepEqual(displays('G7b13'), ['G', 'B', 'D', 'F', 'E♭']);
});

test('combined altered tensions use canonical symbols and omit the natural fifth', () => {
  const chord = parseChordSymbol('G7(b9,b13)');
  assert.equal(chord.symbol, 'G7(♭9,♭13)');
  assert.deepEqual(displays('G7(b9,b13)'), ['G', 'B', 'F', 'A♭', 'E♭']);
  assert.deepEqual(chord.type.tones.map((item) => item.label), ['1', '3', '♭7', '♭9', '♭13']);
});

test('altered dominant chords work with slash bass selection', () => {
  const symbol = buildChordSymbol('G', '7b9', 'B');
  assert.equal(symbol, 'G7b9/B');
  assert.equal(parseChordSymbol(symbol).symbol, 'G7(♭9)/B');
});

test('slash chord places the requested bass below the chord', () => {
  const chord = parseChordSymbol('C/E');
  assert.equal(chord.symbol, 'C/E');
  assert.equal(chord.notes[0].display, 'E');
  assert.ok(chord.notes[0].midi < chord.notes[1].midi);
});

test('6/9 is recognized as a chord quality, not a slash bass', () => {
  const chord = parseChordSymbol('C6/9');
  assert.equal(chord.symbol, 'C6/9');
  assert.equal(chord.bass, null);
  assert.deepEqual(displays('C6/9'), ['C', 'E', 'G', 'A', 'D']);
});

test('selection builder supports slash chords and compound qualities', () => {
  assert.equal(buildChordSymbol('C', '', 'E'), 'C/E');
  assert.equal(buildChordSymbol('C', '6/9', 'E'), 'C6/9/E');
  assert.equal(parseChordSymbol(buildChordSymbol('C', '6/9', 'E')).symbol, 'C6/9/E');
});

test('selection builder omits an enharmonic duplicate bass', () => {
  assert.equal(buildChordSymbol('C#', 'm7', 'Db'), 'C#m7');
});

test('upward inversion moves the lowest chord tone up an octave', () => {
  const notes = parseChordSymbol('Cmaj7').notes;
  const inverted = invertChordNotes(notes, 1);
  assert.deepEqual(inverted.map((note) => `${note.display}${note.octave}`), ['E4', 'G4', 'B4', 'C5']);
  assert.deepEqual(notes.map((note) => `${note.display}${note.octave}`), ['C4', 'E4', 'G4', 'B4']);
});

test('downward inversion moves the highest chord tone down an octave', () => {
  const notes = parseChordSymbol('Cmaj7').notes;
  const inverted = invertChordNotes(notes, -1);
  assert.deepEqual(inverted.map((note) => `${note.display}${note.octave}`), ['B3', 'C4', 'E4', 'G4']);
});

test('note names can switch to Japanese solfege without changing chord symbols', () => {
  assert.equal(formatNoteName('C', 'solfege'), 'ド');
  assert.equal(formatNoteName('F♯', 'solfege'), 'ファ♯');
  assert.equal(formatNoteName('B♭', 'solfege'), 'シ♭');
  assert.equal(formatNoteName('C', 'letter'), 'C');
  assert.equal(parseChordSymbol('Cmaj7').symbol, 'Cmaj7');
});

test('piano keyboard MIDI notes retain pitch and octave', () => {
  const middleC = noteFromMidi(60);
  const flatKey = noteFromMidi(61, true);
  assert.equal(`${middleC.display}${middleC.octave}`, 'C4');
  assert.equal(`${flatKey.display}${flatKey.octave}`, 'D♭4');
  assert.equal(frequencyForMidi(69), 440);
});

test('nearby accidentals are staggered into separate notation columns', () => {
  const notes = [
    { letter: 'C', accidental: '♯', octave: 4 },
    { letter: 'D', accidental: '♭', octave: 4 },
    { letter: 'E', accidental: '♭', octave: 4 },
    { letter: 'A', accidental: '♭', octave: 4 },
  ];
  assert.deepEqual(accidentalColumns(notes), [2, 1, 0, 0]);
});

test('ledger lines extend clearly past both sides of a note head', () => {
  assert.deepEqual(ledgerLineBounds(390), { x1: 366, x2: 414 });
});

test('exact triad is ranked first', () => {
  const notes = [inputNote('C', 0, 48), inputNote('E', 4, 52), inputNote('G', 7, 55)];
  const [candidate] = rankChordCandidates(notes, { root: 0, mode: 'major' });
  assert.equal(candidate.symbol, 'C');
  assert.equal(candidate.exact, true);
});

test('altered dominant input is ranked as an exact chord', () => {
  const notes = [
    inputNote('G', 7, 67),
    inputNote('B', 11, 71),
    inputNote('D', 2, 74),
    inputNote('F', 5, 77),
    inputNote('A♭', 8, 80),
  ];
  const [candidate] = rankChordCandidates(notes, null);
  assert.equal(candidate.symbol, 'G7(♭9)');
  assert.equal(candidate.exact, true);
});

test('altered candidate reports missing tensions with harmonic spelling', () => {
  const notes = [
    inputNote('G', 7, 67),
    inputNote('B', 11, 71),
    inputNote('D', 2, 74),
    inputNote('F', 5, 77),
  ];
  const candidates = rankChordCandidates(notes, null);
  const flatNine = candidates.find((candidate) => candidate.symbol === 'G7(♭9)');
  assert.ok(flatNine);
  assert.deepEqual(flatNine.missingNoteNames, ['A♭']);
});

test('lowest treble-clef note is treated as an inversion, not a slash bass', () => {
  const notes = [inputNote('E', 4, 64), inputNote('G', 7, 67), inputNote('C', 0, 72)];
  const [candidate] = rankChordCandidates(notes, { root: 0, mode: 'major' });
  assert.equal(candidate.symbol, 'C');
  assert.equal(candidate.exact, true);
});

test('lowest bass-clef note creates a slash-chord name when it differs from the root', () => {
  const notes = [inputNote('E', 4, 52), inputNote('G', 7, 67), inputNote('C', 0, 72)];
  const [candidate] = rankChordCandidates(notes, { root: 0, mode: 'major' });
  assert.equal(candidate.symbol, 'C/E');
  assert.equal(candidate.exact, true);
});

test('D G B in the treble clef is ranked as G major without a slash', () => {
  const notes = [inputNote('D', 2, 62), inputNote('G', 7, 67), inputNote('B', 11, 71)];
  const [candidate] = rankChordCandidates(notes, { root: 7, mode: 'major' });
  assert.equal(candidate.symbol, 'G');
  assert.equal(candidate.exact, true);
});

test('D in the bass clef with G major chord tones is named G over D', () => {
  const notes = [inputNote('D', 2, 50), inputNote('G', 7, 67), inputNote('B', 11, 71)];
  const [candidate] = rankChordCandidates(notes, { root: 7, mode: 'major' });
  assert.equal(candidate.symbol, 'G/D');
  assert.equal(candidate.exact, true);
});

test('key center changes the preferred interpretation of an ambiguous set', () => {
  const notes = [inputNote('C', 0, 48), inputNote('E', 4, 52), inputNote('G', 7, 55), inputNote('A', 9, 57)];
  const [inCMajor] = rankChordCandidates(notes, { root: 0, mode: 'major' });
  const [inAMinor] = rankChordCandidates(notes, { root: 9, mode: 'minor' });
  assert.equal(inCMajor.symbol, 'C6');
  assert.equal(inAMinor.symbol, 'Am7/C');
});

test('key center is optional and adds no key-based reasons when omitted', () => {
  const notes = [inputNote('C', 0, 48), inputNote('E', 4, 52), inputNote('G', 7, 55)];
  const candidates = rankChordCandidates(notes, null);
  assert.ok(candidates.length > 0);
  assert.ok(candidates.every((candidate) => candidate.reasons.every((reason) => !reason.includes('Key center'))));
  assert.equal(formatKeyName(null), 'Key center 指定なし');
});

test('near matches are returned when no exact chord exists', () => {
  const notes = [inputNote('C', 0, 48), inputNote('E', 4, 52), inputNote('G', 7, 55), inputNote('B♭', 10, 58), inputNote('F♯', 6, 66)];
  const candidates = rankChordCandidates(notes, { root: 0, mode: 'major' });
  assert.ok(candidates.length > 0);
  assert.ok(candidates.some((candidate) => !candidate.exact));
  assert.ok(candidates.every((candidate) => Array.isArray(candidate.missingNoteNames)));
  assert.ok(candidates.every((candidate) => Array.isArray(candidate.extraNoteNames)));
});

test('candidate comparison reports missing and extra note names', () => {
  const notes = [inputNote('C', 0, 60), inputNote('E', 4, 64), inputNote('B', 11, 71)];
  const candidates = rankChordCandidates(notes, { root: 0, mode: 'major' });
  const cMajorSeven = candidates.find((candidate) => candidate.symbol === 'Cmaj7');
  assert.ok(cMajorSeven);
  assert.deepEqual(cMajorSeven.missingNoteNames, ['G']);
  assert.deepEqual(cMajorSeven.extraNoteNames, []);
});
