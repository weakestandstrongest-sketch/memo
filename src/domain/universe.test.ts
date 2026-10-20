import { describe, expect, it } from 'vitest';
import { MIN_STAR_DISTANCE } from './layout';
import { createSampleUniverse } from './sampleData';
import {
  addNote,
  buildNote,
  checkConnection,
  connectNotes,
  deleteNote,
  disconnect,
  emptyUniverse,
  linkedNotes,
  matchesQuery,
  moveNote,
  normalizeForSearch,
  settleNote,
  updateNote,
  validateDraft,
} from './universe';

const make = (title: string, body = '') => buildNote({ title, body, category: 'ideas' });

describe('notes', () => {
  it('adds a note with a star position', () => {
    const note = make('First');
    const data = addNote(emptyUniverse(), note, { x: 0, y: 0 });
    expect(data.notes).toHaveLength(1);
    expect(data.layout[note.id]).toBeDefined();
    expect(note.createdAt).toBe(note.updatedAt);
  });

  it('places new stars without overlapping', () => {
    let data = emptyUniverse();
    for (let i = 0; i < 30; i++) data = addNote(data, make(`n${i}`), { x: 0, y: 0 });
    const points = Object.values(data.layout);
    for (let i = 0; i < points.length; i++)
      for (let j = i + 1; j < points.length; j++) {
        const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
        expect(d).toBeGreaterThanOrEqual(MIN_STAR_DISTANCE - 0.2);
      }
  });

  it('edits title, body and category', () => {
    const note = make('Old');
    let data = addNote(emptyUniverse(), note, { x: 0, y: 0 });
    data = updateNote(data, note.id, { title: '  New  ', body: 'text', category: 'goals' }, new Date('2030-01-01'));
    expect(data.notes[0]).toMatchObject({ title: 'New', body: 'text', category: 'goals' });
    expect(data.notes[0].updatedAt).toBe('2030-01-01T00:00:00.000Z');
    expect(data.notes[0].createdAt).toBe(note.createdAt);
  });

  it('deletes a note with its position and connections', () => {
    const a = make('A');
    const b = make('B');
    let data = addNote(addNote(emptyUniverse(), a, { x: 0, y: 0 }), b, { x: 0, y: 0 });
    data = connectNotes(data, a.id, b.id);
    data = deleteNote(data, a.id);
    expect(data.notes.map((n) => n.id)).toEqual([b.id]);
    expect(data.layout[a.id]).toBeUndefined();
    expect(data.connections).toHaveLength(0);
  });

  it('validates required fields', () => {
    expect(validateDraft({ title: ' ', body: '', category: null, groupId: null })).toEqual({
      title: 'required',
      category: 'required',
    });
    expect(validateDraft({ title: 'x'.repeat(121), body: '', category: 'ideas', groupId: null }).title).toBe('tooLong');
    expect(validateDraft({ title: 'ok', body: 'x'.repeat(10001), category: 'ideas', groupId: null }).body).toBe('tooLong');
    expect(validateDraft({ title: 'Fine', body: '', category: 'other', groupId: null })).toEqual({});
  });
});

describe('connections', () => {
  const a = make('A');
  const b = make('B');
  const base = addNote(addNote(emptyUniverse(), a, { x: 0, y: 0 }), b, { x: 0, y: 0 });

  it('connects two stars', () => {
    const data = connectNotes(base, a.id, b.id);
    expect(data.connections).toHaveLength(1);
    expect(linkedNotes(data, a.id).map((l) => l.note.id)).toEqual([b.id]);
    expect(linkedNotes(data, b.id).map((l) => l.note.id)).toEqual([a.id]);
  });

  it('prevents self connections', () => {
    expect(checkConnection(base, a.id, a.id)).toEqual({ ok: false, reason: 'self' });
    expect(connectNotes(base, a.id, a.id)).toBe(base);
  });

  it('prevents duplicates in either direction', () => {
    const data = connectNotes(base, a.id, b.id);
    expect(checkConnection(data, b.id, a.id)).toEqual({ ok: false, reason: 'duplicate' });
    expect(connectNotes(data, b.id, a.id).connections).toHaveLength(1);
  });

  it('rejects unknown stars', () => {
    expect(checkConnection(base, a.id, 'nope')).toEqual({ ok: false, reason: 'missing' });
  });

  it('removes a connection', () => {
    const data = connectNotes(base, a.id, b.id);
    expect(disconnect(data, data.connections[0].id).connections).toHaveLength(0);
  });
});

describe('positions', () => {
  it('moves a star and pushes it off another star when dropped on top', () => {
    const a = make('A');
    const b = make('B');
    let data = addNote(addNote(emptyUniverse(), a, { x: 0, y: 0 }), b, { x: 0, y: 0 });
    data = moveNote(data, b.id, { ...data.layout[a.id] });
    data = settleNote(data, b.id);
    const pa = data.layout[a.id];
    const pb = data.layout[b.id];
    expect(Math.hypot(pa.x - pb.x, pa.y - pb.y)).toBeGreaterThanOrEqual(MIN_STAR_DISTANCE - 0.2);
  });
});

describe('search', () => {
  it('matches title and body, case-insensitively', () => {
    const n = make('Semiconductor notes', 'Transistors and P-N junctions');
    expect(matchesQuery(n, 'SEMI')).toBe(true);
    expect(matchesQuery(n, 'junction')).toBe(true);
    expect(matchesQuery(n, 'marathon')).toBe(false);
    expect(matchesQuery(n, '  ')).toBe(true);
  });

  it('handles Japanese: hiragana/katakana and full/half-width are treated alike', () => {
    const n = make('ハーフマラソンを走る', '週３回トレーニング。ＴｙｐｅＳｃｒｉｐｔ も勉強');
    expect(matchesQuery(n, 'はーふまらそん')).toBe(true); // hiragana finds katakana
    expect(matchesQuery(n, 'ﾏﾗｿﾝ')).toBe(true); // half-width katakana
    expect(matchesQuery(n, '週3回')).toBe(true); // half-width digit finds full-width
    expect(matchesQuery(n, 'typescript')).toBe(true); // full-width latin letters
    expect(matchesQuery(n, '水泳')).toBe(false);
    expect(normalizeForSearch('ＡＢＣ　カナ')).toBe('abc かな');
  });
});

describe('sample universe', () => {
  it('is internally consistent', () => {
    const data = createSampleUniverse();
    const ids = new Set(data.notes.map((n) => n.id));
    expect(data.notes.length).toBeGreaterThan(3);
    for (const id of ids) expect(data.layout[id]).toBeDefined();
    for (const c of data.connections) {
      expect(ids.has(c.sourceId) && ids.has(c.targetId)).toBe(true);
    }
  });
});
