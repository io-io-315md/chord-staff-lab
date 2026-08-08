import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChordSymbol, parseChordSymbol, rankChordCandidates } from '../src/music-theory.js';

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

test('exact triad is ranked first', () => {
  const notes = [inputNote('C', 0, 48), inputNote('E', 4, 52), inputNote('G', 7, 55)];
  const [candidate] = rankChordCandidates(notes, { root: 0, mode: 'major' });
  assert.equal(candidate.symbol, 'C');
  assert.equal(candidate.exact, true);
});

test('lowest note creates an inversion or slash-chord name', () => {
  const notes = [inputNote('E', 4, 52), inputNote('G', 7, 55), inputNote('C', 0, 60)];
  const [candidate] = rankChordCandidates(notes, { root: 0, mode: 'major' });
  assert.equal(candidate.symbol, 'C/E');
  assert.equal(candidate.exact, true);
});

test('key center changes the preferred interpretation of an ambiguous set', () => {
  const notes = [inputNote('C', 0, 48), inputNote('E', 4, 52), inputNote('G', 7, 55), inputNote('A', 9, 57)];
  const [inCMajor] = rankChordCandidates(notes, { root: 0, mode: 'major' });
  const [inAMinor] = rankChordCandidates(notes, { root: 9, mode: 'minor' });
  assert.equal(inCMajor.symbol, 'C6');
  assert.equal(inAMinor.symbol, 'Am7/C');
});

test('near matches are returned when no exact chord exists', () => {
  const notes = [inputNote('C', 0, 48), inputNote('E', 4, 52), inputNote('G', 7, 55), inputNote('B♭', 10, 58), inputNote('F♯', 6, 66)];
  const candidates = rankChordCandidates(notes, { root: 0, mode: 'major' });
  assert.ok(candidates.length > 0);
  assert.ok(candidates.some((candidate) => !candidate.exact));
});
