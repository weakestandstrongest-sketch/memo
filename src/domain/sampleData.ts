import type { Connection, Note, UniverseData } from './types';

/**
 * A few demo stars shown on first launch, so the universe isn't empty.
 * They are ordinary notes (marked `sample: true`) and can be edited or deleted.
 */
export function createSampleUniverse(now = new Date()): UniverseData {
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();

  const raw: Array<Omit<Note, 'createdAt' | 'updatedAt' | 'sample'> & { age: number; x: number; y: number }> = [
    {
      id: 'sample-welcome',
      title: 'Welcome to My Universe',
      body:
        'Every note you write becomes a star.\n\n' +
        '• Tap or click a star to read it.\n' +
        '• Drag a star to move it (on a phone: press and hold, then drag).\n' +
        '• Drag empty space to fly around; scroll or pinch to zoom.\n' +
        '• Use “Connect star” to link related ideas.\n\n' +
        'These sample stars are yours to edit or delete.',
      category: 'other',
      age: 60 * 24 * 3,
      x: 0,
      y: 0,
    },
    {
      id: 'sample-semiconductors',
      title: 'How semiconductors work',
      body:
        'Silicon becomes useful when it is "doped" with other atoms, creating n-type and p-type regions. ' +
        'Where they meet (a p-n junction), current flows in only one direction — the basis of diodes and transistors.',
      category: 'learning',
      age: 60 * 24 * 2,
      x: 250,
      y: -150,
    },
    {
      id: 'sample-research-goal',
      title: 'Research goal: next-generation chip materials',
      body: 'Explore materials beyond silicon (e.g. gallium nitride, 2D materials) for my future research.',
      category: 'goals',
      age: 60 * 30,
      x: 430,
      y: -10,
    },
    {
      id: 'sample-map-idea',
      title: 'Idea: a map of my thoughts',
      body: 'What if notes were places you could visit instead of files in folders?',
      category: 'ideas',
      age: 60 * 26,
      x: -230,
      y: -170,
    },
    {
      id: 'sample-typescript',
      title: 'Learn TypeScript basics',
      body: 'Types, interfaces, and how the compiler catches mistakes before the code runs.',
      category: 'learning',
      age: 60 * 20,
      x: -330,
      y: 70,
    },
    {
      id: 'sample-walk',
      title: 'Morning walk reflections',
      body: 'Clear sky today. I think best when I am moving — maybe I should plan big decisions on walks.',
      category: 'journal',
      age: 60 * 5,
      x: 120,
      y: 230,
    },
    {
      id: 'sample-marathon',
      title: 'Run a half marathon',
      body: 'Train three times a week. Target: next spring.',
      category: 'goals',
      age: 60 * 3,
      x: 330,
      y: 300,
    },
    {
      id: 'sample-weekly-review',
      title: 'Idea: weekly review ritual',
      body: 'Every Sunday, look at the stars I added this week and connect the related ones.',
      category: 'ideas',
      age: 45,
      x: -130,
      y: 250,
    },
  ];

  const notes: Note[] = raw.map(({ age, x: _x, y: _y, ...n }) => ({
    ...n,
    createdAt: minutesAgo(age),
    updatedAt: minutesAgo(age),
    sample: true,
  }));

  const layout = Object.fromEntries(raw.map((n) => [n.id, { x: n.x, y: n.y }]));

  const links: Array<[string, string]> = [
    ['sample-semiconductors', 'sample-research-goal'],
    ['sample-welcome', 'sample-map-idea'],
    ['sample-map-idea', 'sample-typescript'],
    ['sample-walk', 'sample-marathon'],
    ['sample-walk', 'sample-weekly-review'],
    ['sample-weekly-review', 'sample-welcome'],
  ];

  const connections: Connection[] = links.map(([a, b], i) => ({
    id: `sample-link-${i + 1}`,
    sourceId: a,
    targetId: b,
    createdAt: minutesAgo(30),
    origin: 'user',
  }));

  return { version: 1, notes, connections, layout };
}
