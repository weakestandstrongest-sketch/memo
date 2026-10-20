import { describe, expect, it } from 'vitest';
import {
  addGroup,
  buildGroup,
  deleteGroup,
  galaxyCircles,
  groupCenter,
  setPinned,
  updateGroup,
  validateGroupName,
} from './groups';
import { MIN_STAR_DISTANCE } from './layout';
import { addNote, buildNote, emptyUniverse, updateNote } from './universe';

function universeWithGroup() {
  const group = buildGroup('研究テーマ', '#8fa8ff');
  let data = addGroup(emptyUniverse(), group);
  const a = buildNote({ title: 'A', body: '', category: 'ideas', groupId: group.id });
  const b = buildNote({ title: 'B', body: '', category: 'ideas', groupId: group.id });
  const loose = buildNote({ title: 'Loose', body: '', category: 'other' });
  data = addNote(data, a, { x: 0, y: 0 });
  data = addNote(data, b, { x: 0, y: 0 });
  data = addNote(data, loose, { x: 2000, y: 2000 });
  return { data, group, a, b, loose };
}

describe('groups', () => {
  it('validates names', () => {
    expect(validateGroupName('  ')).toBe('required');
    expect(validateGroupName('x'.repeat(41))).toBe('tooLong');
    expect(validateGroupName('研究')).toBeNull();
  });

  it('creates, renames and recolors a group', () => {
    const { data, group } = universeWithGroup();
    const next = updateGroup(data, group.id, { name: ' 新しい名前 ', color: '#ff9ecf' });
    expect(next.groups[0]).toMatchObject({ name: '新しい名前', color: '#ff9ecf' });
  });

  it('deleting a group keeps its notes (they become ungrouped)', () => {
    const { data, group } = universeWithGroup();
    const next = deleteGroup(data, group.id);
    expect(next.groups).toHaveLength(0);
    expect(next.notes).toHaveLength(3);
    expect(next.notes.every((n) => n.groupId === undefined)).toBe(true);
  });

  it('new notes in a group are placed inside its galaxy', () => {
    const { data, group, loose } = universeWithGroup();
    const center = groupCenter(data, group.id)!;
    const c = buildNote({ title: 'C', body: '', category: 'goals', groupId: group.id });
    const next = addNote(data, c, { x: 5000, y: 5000 }); // "near" is ignored for grouped notes
    const p = next.layout[c.id];
    expect(Math.hypot(p.x - center.x, p.y - center.y)).toBeLessThan(MIN_STAR_DISTANCE * 3);
    expect(next.layout[loose.id]).toEqual(data.layout[loose.id]);
  });

  it('moving a note into a group flies its star to that galaxy', () => {
    const { data, group, loose } = universeWithGroup();
    const center = groupCenter(data, group.id)!;
    const next = updateNote(data, loose.id, { groupId: group.id });
    const p = next.layout[loose.id];
    expect(next.notes.find((n) => n.id === loose.id)!.groupId).toBe(group.id);
    expect(Math.hypot(p.x - center.x, p.y - center.y)).toBeLessThan(MIN_STAR_DISTANCE * 3);
    // removing it from the group keeps it where it is
    const removed = updateNote(next, loose.id, { groupId: null });
    expect(removed.notes.find((n) => n.id === loose.id)!.groupId).toBeUndefined();
    expect(removed.layout[loose.id]).toEqual(p);
  });

  it('galaxy circles enclose all member stars', () => {
    const { data, group } = universeWithGroup();
    const circles = galaxyCircles(data);
    expect(circles).toHaveLength(1);
    const c = circles[0];
    expect(c.group.id).toBe(group.id);
    expect(c.count).toBe(2);
    for (const n of data.notes.filter((n) => n.groupId === group.id)) {
      const p = data.layout[n.id];
      expect(Math.hypot(p.x - c.cx, p.y - c.cy)).toBeLessThan(c.r);
    }
  });

  it('empty groups have no galaxy', () => {
    const data = addGroup(emptyUniverse(), buildGroup('空', '#8fa8ff'));
    expect(galaxyCircles(data)).toEqual([]);
  });
});

describe('pinning', () => {
  it('pins and unpins a note', () => {
    const { data, a } = universeWithGroup();
    const pinned = setPinned(data, a.id, true);
    expect(pinned.notes.find((n) => n.id === a.id)!.pinned).toBe(true);
    const unpinned = setPinned(pinned, a.id, false);
    expect(unpinned.notes.find((n) => n.id === a.id)!.pinned).toBeUndefined();
    expect(setPinned(unpinned, a.id, false)).toBe(unpinned); // no change → same object
  });
});
