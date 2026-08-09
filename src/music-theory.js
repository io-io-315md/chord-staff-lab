const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL_PITCH_CLASS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

const tone = (semitones, degree, label) => ({ semitones, degree, label });

export const CHORD_TYPES = [
  { suffix: '7(♭9,♭13)', aliases: ['7b9b13', '7(b9,b13)'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(10, 7, '♭7'), tone(13, 9, '♭9'), tone(20, 13, '♭13')], complexity: 5 },
  { suffix: '7(♯9,♭13)', aliases: ['7#9b13', '7(#9,b13)'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(10, 7, '♭7'), tone(15, 9, '♯9'), tone(20, 13, '♭13')], complexity: 5 },
  { suffix: '7(♭9,♯11)', aliases: ['7b9#11', '7(b9,#11)'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(10, 7, '♭7'), tone(13, 9, '♭9'), tone(18, 11, '♯11')], complexity: 5 },
  { suffix: '7(♯9,♯11)', aliases: ['7#9#11', '7(#9,#11)'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(10, 7, '♭7'), tone(15, 9, '♯9'), tone(18, 11, '♯11')], complexity: 5 },
  { suffix: '7(♭9)', aliases: ['7b9', '7(b9)'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5'), tone(10, 7, '♭7'), tone(13, 9, '♭9')], complexity: 4 },
  { suffix: '7(♯9)', aliases: ['7#9', '7(#9)'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5'), tone(10, 7, '♭7'), tone(15, 9, '♯9')], complexity: 4 },
  { suffix: '7(♯11)', aliases: ['7#11', '7(#11)'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5'), tone(10, 7, '♭7'), tone(18, 11, '♯11')], complexity: 4 },
  { suffix: '7(♭13)', aliases: ['7b13', '7(b13)'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5'), tone(10, 7, '♭7'), tone(20, 13, '♭13')], complexity: 4 },
  { suffix: 'maj13', aliases: ['maj13', 'M13', 'Δ13'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5'), tone(11, 7, '7'), tone(14, 9, '9'), tone(21, 13, '13')], complexity: 5 },
  { suffix: 'm13', aliases: ['m13', 'min13'], tones: [tone(0, 1, '1'), tone(3, 3, '♭3'), tone(7, 5, '5'), tone(10, 7, '♭7'), tone(14, 9, '9'), tone(21, 13, '13')], complexity: 5 },
  { suffix: '13', aliases: ['13'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5'), tone(10, 7, '♭7'), tone(14, 9, '9'), tone(21, 13, '13')], complexity: 5 },
  { suffix: 'maj11', aliases: ['maj11', 'M11', 'Δ11'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5'), tone(11, 7, '7'), tone(14, 9, '9'), tone(17, 11, '11')], complexity: 5 },
  { suffix: 'm11', aliases: ['m11', 'min11'], tones: [tone(0, 1, '1'), tone(3, 3, '♭3'), tone(7, 5, '5'), tone(10, 7, '♭7'), tone(14, 9, '9'), tone(17, 11, '11')], complexity: 5 },
  { suffix: '11', aliases: ['11'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5'), tone(10, 7, '♭7'), tone(14, 9, '9'), tone(17, 11, '11')], complexity: 5 },
  { suffix: 'maj9', aliases: ['maj9', 'M9', 'Δ9'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5'), tone(11, 7, '7'), tone(14, 9, '9')], complexity: 4 },
  { suffix: 'm9', aliases: ['m9', 'min9'], tones: [tone(0, 1, '1'), tone(3, 3, '♭3'), tone(7, 5, '5'), tone(10, 7, '♭7'), tone(14, 9, '9')], complexity: 4 },
  { suffix: '9', aliases: ['9'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5'), tone(10, 7, '♭7'), tone(14, 9, '9')], complexity: 4 },
  { suffix: '6/9', aliases: ['6/9', '69'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5'), tone(9, 6, '6'), tone(14, 9, '9')], complexity: 4 },
  { suffix: 'm6/9', aliases: ['m6/9', 'm69', 'min6/9'], tones: [tone(0, 1, '1'), tone(3, 3, '♭3'), tone(7, 5, '5'), tone(9, 6, '6'), tone(14, 9, '9')], complexity: 4 },
  { suffix: 'mMaj7', aliases: ['mMaj7', 'mM7', 'minMaj7'], tones: [tone(0, 1, '1'), tone(3, 3, '♭3'), tone(7, 5, '5'), tone(11, 7, '7')], complexity: 3 },
  { suffix: 'maj7', aliases: ['maj7', 'M7', 'Δ7'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5'), tone(11, 7, '7')], complexity: 2 },
  { suffix: 'm7♭5', aliases: ['m7b5', 'm7♭5', 'ø', 'ø7', 'half-dim'], tones: [tone(0, 1, '1'), tone(3, 3, '♭3'), tone(6, 5, '♭5'), tone(10, 7, '♭7')], complexity: 3 },
  { suffix: 'dim7', aliases: ['dim7', '°7', 'o7'], tones: [tone(0, 1, '1'), tone(3, 3, '♭3'), tone(6, 5, '♭5'), tone(9, 7, '𝄫7')], complexity: 3 },
  { suffix: '7sus4', aliases: ['7sus4', '7sus'], tones: [tone(0, 1, '1'), tone(5, 4, '4'), tone(7, 5, '5'), tone(10, 7, '♭7')], complexity: 3 },
  { suffix: '7', aliases: ['7'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5'), tone(10, 7, '♭7')], complexity: 2 },
  { suffix: 'm7', aliases: ['m7', 'min7', '-7'], tones: [tone(0, 1, '1'), tone(3, 3, '♭3'), tone(7, 5, '5'), tone(10, 7, '♭7')], complexity: 2 },
  { suffix: 'add9', aliases: ['add9'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5'), tone(14, 9, '9')], complexity: 3 },
  { suffix: 'm(add9)', aliases: ['madd9', 'm(add9)', 'minadd9'], tones: [tone(0, 1, '1'), tone(3, 3, '♭3'), tone(7, 5, '5'), tone(14, 9, '9')], complexity: 3 },
  { suffix: '6', aliases: ['6', 'maj6'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5'), tone(9, 6, '6')], complexity: 2 },
  { suffix: 'm6', aliases: ['m6', 'min6'], tones: [tone(0, 1, '1'), tone(3, 3, '♭3'), tone(7, 5, '5'), tone(9, 6, '6')], complexity: 2 },
  { suffix: 'sus2', aliases: ['sus2'], tones: [tone(0, 1, '1'), tone(2, 2, '2'), tone(7, 5, '5')], complexity: 2 },
  { suffix: 'sus4', aliases: ['sus4', 'sus'], tones: [tone(0, 1, '1'), tone(5, 4, '4'), tone(7, 5, '5')], complexity: 2 },
  { suffix: 'aug', aliases: ['aug', '+'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(8, 5, '♯5')], complexity: 2 },
  { suffix: 'dim', aliases: ['dim', '°', 'o'], tones: [tone(0, 1, '1'), tone(3, 3, '♭3'), tone(6, 5, '♭5')], complexity: 2 },
  { suffix: 'm', aliases: ['m', 'min', '-'], tones: [tone(0, 1, '1'), tone(3, 3, '♭3'), tone(7, 5, '5')], complexity: 1 },
  { suffix: '5', aliases: ['5'], tones: [tone(0, 1, '1'), tone(7, 5, '5')], complexity: 1 },
  { suffix: '', aliases: ['', 'maj', 'M'], tones: [tone(0, 1, '1'), tone(4, 3, '3'), tone(7, 5, '5')], complexity: 1 },
];

const mod = (value, divisor = 12) => ((value % divisor) + divisor) % divisor;

function accidentalOffset(accidental = '') {
  return [...accidental].reduce((sum, char) => sum + (char === '#' || char === '♯' ? 1 : char === 'b' || char === '♭' ? -1 : 0), 0);
}

export function parseNoteName(value) {
  const match = String(value).trim().replaceAll('♯', '#').replaceAll('♭', 'b').match(/^([A-Ga-g])([#b]{0,2})$/);
  if (!match) throw new Error(`音名「${value}」を読み取れません。`);
  const letter = match[1].toUpperCase();
  const accidental = match[2];
  return {
    letter,
    accidental,
    pitchClass: mod(NATURAL_PITCH_CLASS[letter] + accidentalOffset(accidental)),
    display: `${letter}${accidental.replaceAll('#', '♯').replaceAll('b', '♭')}`,
  };
}

export function buildChordSymbol(root, quality = '', bass = '') {
  const rootNote = parseNoteName(root);
  if (!bass) return `${root}${quality}`;
  const bassNote = parseNoteName(bass);
  const slashBass = bassNote.pitchClass === rootNote.pitchClass ? '' : `/${bass}`;
  return `${root}${quality}${slashBass}`;
}

export function invertChordNotes(notes, steps = 0) {
  const result = notes.map((note) => ({ ...note }));
  const direction = Math.sign(steps);

  for (let index = 0; index < Math.abs(steps); index += 1) {
    result.sort((a, b) => a.midi - b.midi);
    const note = direction > 0 ? result[0] : result[result.length - 1];
    note.midi += direction * 12;
    note.octave += direction;
  }

  return result.sort((a, b) => a.midi - b.midi);
}

const SOLFEGE_NAMES = {
  C: 'ド',
  D: 'レ',
  E: 'ミ',
  F: 'ファ',
  G: 'ソ',
  A: 'ラ',
  B: 'シ',
};

export function formatNoteName(note, naming = 'letter') {
  const display = typeof note === 'string' ? note : note.display;
  if (naming !== 'solfege') return display;
  return display.replace(/^([A-G])/, (_, letter) => SOLFEGE_NAMES[letter]);
}

function findChordType(quality) {
  const normalized = quality.replaceAll('♭', 'b').replaceAll('♯', '#');
  const exact = CHORD_TYPES.find((type) => type.aliases.some((alias) => alias === normalized));
  if (exact) return exact;
  return CHORD_TYPES.find((type) => type.aliases.some((alias) => !/^M(?:\d|$)/.test(alias) && alias.toLowerCase() === normalized.toLowerCase()));
}

function spellTone(root, toneInfo) {
  const rootIndex = LETTERS.indexOf(root.letter);
  const targetIndex = rootIndex + toneInfo.degree - 1;
  const letter = LETTERS[mod(targetIndex, 7)];
  const targetPitchClass = mod(root.pitchClass + toneInfo.semitones);
  let delta = mod(targetPitchClass - NATURAL_PITCH_CLASS[letter]);
  if (delta > 6) delta -= 12;
  const accidental = delta === 0 ? '' : delta === 1 ? '♯' : delta === -1 ? '♭' : delta === 2 ? '𝄪' : delta === -2 ? '𝄫' : '';
  return { letter, accidental, pitchClass: targetPitchClass, display: `${letter}${accidental}` };
}

function chooseRootOctave(rootPitchClass) {
  let midi = 48 + rootPitchClass;
  while (midi < 53) midi += 12;
  while (midi > 64) midi -= 12;
  return Math.floor(midi / 12) - 1;
}

function midiForSpelledTone(root, rootOctave, toneInfo) {
  return (rootOctave + 1) * 12 + root.pitchClass + toneInfo.semitones;
}

export function parseChordSymbol(input) {
  const normalized = String(input).trim().replace(/\s+/g, '').replaceAll('−', 'm');
  if (!normalized) throw new Error('コード名を入力してください。');

  const rootMatch = normalized.match(/^([A-Ga-g])([#b♯♭]{0,2})(.*)$/);
  if (!rootMatch) throw new Error('Cmaj7 のようにルート音から入力してください。');

  const root = parseNoteName(`${rootMatch[1]}${rootMatch[2]}`);
  let quality = rootMatch[3];
  let bass = null;
  const slashMatch = quality.match(/^(.*)\/([A-Ga-g][#b♯♭]{0,2})$/);
  if (slashMatch && slashMatch[1] !== '6') {
    quality = slashMatch[1];
    bass = parseNoteName(slashMatch[2]);
  }
  const type = findChordType(quality);
  if (!type) {
    throw new Error(`「${quality || 'major'}」はまだ対応していません。例: maj7, m7, 7, m7b5, 6/9`);
  }

  const rootOctave = chooseRootOctave(root.pitchClass);
  const notes = type.tones.map((toneInfo) => {
    const spelling = spellTone(root, toneInfo);
    return {
      ...spelling,
      octave: rootOctave + Math.floor((LETTERS.indexOf(root.letter) + toneInfo.degree - 1) / 7),
      midi: midiForSpelledTone(root, rootOctave, toneInfo),
      degree: toneInfo.label,
      role: toneInfo.degree === 1 ? 'root' : 'chord',
    };
  });

  if (bass) {
    let bassMidi = 36 + bass.pitchClass;
    while (bassMidi < 40) bassMidi += 12;
    while (bassMidi >= notes[0].midi) bassMidi -= 12;
    const bassOctave = Math.floor(bassMidi / 12) - 1;
    if (!notes.some((note) => note.midi === bassMidi)) {
      notes.unshift({ ...bass, octave: bassOctave, midi: bassMidi, degree: 'Bass', role: 'bass' });
    }
  }

  const canonical = `${root.display}${type.suffix}${bass ? `/${bass.display}` : ''}`;
  return { input, symbol: canonical, root, bass, type, notes };
}

function preferredPitchName(pitchClass, preferFlats = false) {
  return (preferFlats ? FLAT_NAMES : SHARP_NAMES)[mod(pitchClass)];
}

function keyScalePitchClasses(key) {
  const root = Number(key?.root ?? 0);
  const pattern = key?.mode === 'minor' ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  return new Set(pattern.map((interval) => mod(root + interval)));
}

function setEquals(a, b) {
  return a.size === b.size && [...a].every((value) => b.has(value));
}

function bassDisplay(notes, preferFlats) {
  const bass = [...notes].sort((a, b) => a.midi - b.midi)[0];
  return bass?.display?.replace(/\d+$/, '') || preferredPitchName(bass?.pitchClass ?? 0, preferFlats);
}

export function rankChordCandidates(inputNotes, key = null) {
  if (!inputNotes?.length) return [];
  const uniquePitchClasses = new Set(inputNotes.map((note) => mod(note.pitchClass)));
  if (uniquePitchClasses.size < 2) return [];

  const bassClefNotes = inputNotes.filter((note) => note.midi < 60);
  const explicitBass = [...bassClefNotes].sort((a, b) => a.midi - b.midi)[0] || null;
  const hasKeyCenter = key?.root !== '' && key?.root !== null && key?.root !== undefined;
  const keyRoot = hasKeyCenter ? Number(key.root) : null;
  const keyScale = hasKeyCenter ? keyScalePitchClasses(key) : null;
  const preferFlats = Boolean(key?.preferFlats) || (hasKeyCenter && [1, 3, 5, 8, 10].includes(keyRoot));
  const selectedBassName = explicitBass ? bassDisplay(bassClefNotes, preferFlats) : '';
  const results = [];

  for (let rootPitchClass = 0; rootPitchClass < 12; rootPitchClass += 1) {
    for (const type of CHORD_TYPES) {
      if (type.tones.length < 3 || type.tones.length > 6) continue;
      const chordSet = new Set(type.tones.map((item) => mod(rootPitchClass + item.semitones)));
      const intersection = [...uniquePitchClasses].filter((pc) => chordSet.has(pc)).length;
      if (intersection < Math.min(3, uniquePitchClasses.size)) continue;

      const exact = setEquals(uniquePitchClasses, chordSet);
      const missing = chordSet.size - intersection;
      const extra = uniquePitchClasses.size - intersection;
      const rootPresent = uniquePitchClasses.has(rootPitchClass);
      const bassIsChordTone = explicitBass ? chordSet.has(explicitBass.pitchClass) : false;

      let score = exact ? 100 : 44 * (intersection / uniquePitchClasses.size) + 38 * (intersection / chordSet.size) - missing * 7 - extra * 9;
      score += rootPresent ? 3 : -8;
      if (explicitBass) {
        score += explicitBass.pitchClass === rootPitchClass ? 8 : bassIsChordTone ? 3 : -9;
      }
      score -= type.complexity * 0.35;

      const rootInKey = hasKeyCenter && keyScale.has(rootPitchClass);
      if (hasKeyCenter) {
        const chordInKeyCount = [...chordSet].filter((pc) => keyScale.has(pc)).length;
        score += rootInKey ? 3 : -2;
        score += (chordInKeyCount / chordSet.size) * 4;
        if (rootPitchClass === keyRoot) score += 10;
      }

      const rootName = preferredPitchName(rootPitchClass, preferFlats);
      const spelledRoot = parseNoteName(rootName);
      const slash = explicitBass && explicitBass.pitchClass !== rootPitchClass ? `/${selectedBassName}` : '';
      const symbol = `${rootName}${type.suffix}${slash}`;
      const missingNoteNames = type.tones
        .filter((toneInfo) => !uniquePitchClasses.has(mod(rootPitchClass + toneInfo.semitones)))
        .map((toneInfo) => spellTone(spelledRoot, toneInfo).display)
        .filter((display, index, names) => names.indexOf(display) === index);
      const extraNoteNames = [...uniquePitchClasses]
        .filter((pitchClass) => !chordSet.has(pitchClass))
        .map((pitchClass) => preferredPitchName(pitchClass, preferFlats));
      const notes = type.tones.map((toneInfo) => ({
        ...spellTone(spelledRoot, toneInfo),
        degree: toneInfo.label,
      }));

      const reasons = [exact ? '構成音が完全一致' : `構成音 ${intersection}/${uniquePitchClasses.size} 音が一致`];
      if (explicitBass) reasons.push(`ヘ音記号の最低音 ${selectedBassName} をベースとして考慮`);
      if (hasKeyCenter && rootPitchClass === keyRoot) reasons.push('Key center のトニック');
      else if (hasKeyCenter && rootInKey) reasons.push('Key center 内のルート');

      results.push({ symbol, rootPitchClass, type, notes, exact, score, reasons, missing, extra, missingNoteNames, extraNoteNames });
    }
  }

  return results
    .sort((a, b) => Number(b.exact) - Number(a.exact) || b.score - a.score || a.type.complexity - b.type.complexity)
    .filter((candidate, index, list) => list.findIndex((item) => item.symbol === candidate.symbol) === index)
    .slice(0, 8)
    .map((candidate) => ({ ...candidate, confidence: Math.max(1, Math.min(100, Math.round(candidate.score))) }));
}

export function noteFromStaffPosition(letter, octave, accidental = '') {
  const parsed = parseNoteName(`${letter}${accidental}`);
  return {
    ...parsed,
    accidental: accidental.replaceAll('#', '♯').replaceAll('b', '♭'),
    octave,
    midi: (octave + 1) * 12 + parsed.pitchClass,
    id: `${letter}${accidental}${octave}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };
}

export function noteFromMidi(midi, preferFlats = false) {
  const numericMidi = Number(midi);
  if (!Number.isInteger(numericMidi) || numericMidi < 0 || numericMidi > 127) {
    throw new Error('MIDIノート番号は0〜127の整数で指定してください。');
  }
  const parsed = parseNoteName(preferredPitchName(numericMidi, preferFlats));
  return {
    ...parsed,
    octave: Math.floor(numericMidi / 12) - 1,
    midi: numericMidi,
    id: `piano-${numericMidi}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };
}

export function frequencyForMidi(midi) {
  return 440 * (2 ** ((Number(midi) - 69) / 12));
}

export function formatKeyName(key) {
  if (key?.root === '' || key?.root === null || key?.root === undefined) return 'Key center 指定なし';
  return `${preferredPitchName(Number(key.root), Boolean(key.preferFlats))} ${key.mode === 'minor' ? 'Minor' : 'Major'}`;
}

export function pitchNameForClass(pitchClass, preferFlats = false) {
  return preferredPitchName(pitchClass, preferFlats);
}
