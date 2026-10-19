import { describe, expect, it } from 'vitest';
import { createSampleUniverse } from '../domain/sampleData';
import { createLocalStorageAdapter, STORAGE_KEY, type KeyValueStore } from './localStorageAdapter';
import { sanitizeUniverse } from './validate';

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { items: Record<string, string> } {
  const items = { ...initial };
  return {
    items,
    getItem: (k) => (k in items ? items[k] : null),
    setItem: (k, v) => {
      items[k] = v;
    },
  };
}

describe('localStorage adapter', () => {
  it('round-trips data', () => {
    const store = memoryStore();
    const storage = createLocalStorageAdapter(store);
    expect(storage.load()).toEqual({ status: 'empty' });
    const data = createSampleUniverse();
    expect(storage.save(data)).toBe(true);
    const loaded = storage.load();
    expect(loaded.status).toBe('ok');
    if (loaded.status === 'ok') {
      expect(loaded.data).toEqual(data);
      expect(loaded.repaired).toBe(false);
    }
  });

  it('reports corrupt JSON and keeps a backup', () => {
    const store = memoryStore({ [STORAGE_KEY]: '{not json' });
    expect(createLocalStorageAdapter(store).load()).toEqual({ status: 'corrupt' });
    createLocalStorageAdapter(store).load(); // loading twice must not create a second copy
    expect(Object.keys(store.items).filter((k) => k.startsWith('my-universe:backup:'))).toHaveLength(1);
  });

  it('reports wrong-shaped data as corrupt', () => {
    const store = memoryStore({ [STORAGE_KEY]: '"hello"' });
    expect(createLocalStorageAdapter(store).load()).toEqual({ status: 'corrupt' });
  });

  it('handles storage that throws', () => {
    const broken: KeyValueStore = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    const storage = createLocalStorageAdapter(broken);
    expect(storage.load()).toEqual({ status: 'unavailable' });
    expect(storage.save(createSampleUniverse())).toBe(false);
  });
});

describe('sanitizeUniverse', () => {
  it('repairs and drops invalid entries', () => {
    const result = sanitizeUniverse({
      notes: [
        { id: 'a', title: 'A', body: 'x', category: 'ideas', createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 'b', title: 'B', category: 'not-a-category', createdAt: 'yesterday' },
        { id: 'a', title: 'Duplicate id' },
        { id: 'c', title: '   ' },
        null,
        'garbage',
      ],
      connections: [
        { id: 'c1', sourceId: 'a', targetId: 'b' },
        { id: 'c2', sourceId: 'b', targetId: 'a' }, // duplicate pair
        { id: 'c3', sourceId: 'a', targetId: 'a' }, // self
        { id: 'c4', sourceId: 'a', targetId: 'missing' },
      ],
      layout: { a: { x: 10, y: 20 }, b: { x: 'oops', y: 0 } },
    });
    expect(result).not.toBeNull();
    const data = result!.data;
    expect(data.notes.map((n) => n.id)).toEqual(['a', 'b']);
    expect(data.notes[1].category).toBe('other');
    expect(data.notes[1].body).toBe('');
    expect(Number.isNaN(Date.parse(data.notes[1].createdAt))).toBe(false);
    expect(data.connections.map((c) => c.id)).toEqual(['c1']);
    expect(data.layout.a).toEqual({ x: 10, y: 20 });
    expect(Number.isFinite(data.layout.b.x)).toBe(true);
    expect(result!.repairs).toBeGreaterThan(0);
  });

  it('rejects non-universe values', () => {
    expect(sanitizeUniverse(null)).toBeNull();
    expect(sanitizeUniverse([])).toBeNull();
    expect(sanitizeUniverse({ notes: 'nope' })).toBeNull();
  });
});
