import type { Connection, Group, Note, UniverseData } from './types';

/**
 * A few demo stars shown on first launch, so the universe isn't empty.
 * They are ordinary notes (marked `sample: true`) and can be edited or deleted.
 */
export function createSampleUniverse(now = new Date()): UniverseData {
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();

  const raw: Array<Omit<Note, 'createdAt' | 'updatedAt' | 'sample'> & { age: number; x: number; y: number }> = [
    {
      id: 'sample-welcome',
      title: 'Asterism へようこそ',
      body:
        'Asterism は、思いついたことを気軽に書きとめるメモ帳です。書いたメモは「星図」の中で星になり、関係のあるメモ同士を線でつなげられます。\n\n' +
        '・下の黒い ＋ ボタンで、すぐに新しいメモを書けます（タイトルはあとからでも大丈夫）。\n' +
        '・本文をタップすれば、そのまま書き足せます。書いた内容は自動で保存されます。\n' +
        '・メモの「つなぐ」で、関係のあるメモ同士を結べます。\n' +
        '・下の「星図」で、メモのつながりを星座のように眺められます。\n\n' +
        'サンプルのメモは、自由に編集・削除してかまいません。',
      category: 'other',
      age: 60 * 24 * 3,
      x: 0,
      y: 0,
    },
    {
      id: 'sample-semiconductors',
      title: '半導体のしくみ',
      body:
        'シリコンに別の原子を少し混ぜる（ドーピング）と、n型とp型の領域ができる。' +
        '両者が接する部分（pn接合）では電流が一方向にしか流れない。これがダイオードやトランジスタの基本。',
      category: 'learning',
      age: 60 * 24 * 2,
      x: 250,
      y: -150,
    },
    {
      id: 'sample-research-goal',
      title: '研究目標：次世代の半導体材料',
      body: 'シリコンの次に来る材料（窒化ガリウム、2次元材料など）を、将来の研究テーマとして調べる。',
      category: 'goals',
      age: 60 * 30,
      x: 430,
      y: -10,
    },
    {
      id: 'sample-map-idea',
      title: 'アイデア：考えの地図',
      body: 'メモをフォルダの中のファイルではなく、「訪れる場所」として扱えたらどうだろう？',
      category: 'ideas',
      age: 60 * 26,
      x: -230,
      y: -170,
    },
    {
      id: 'sample-typescript',
      title: 'TypeScript の基本を学ぶ',
      body: '型・インターフェース、そして実行前にコンパイラがミスを見つけてくれるしくみ。',
      category: 'learning',
      age: 60 * 20,
      x: -330,
      y: 70,
    },
    {
      id: 'sample-walk',
      title: '朝の散歩で考えたこと',
      body: '今日は快晴。歩いているときがいちばん考えがまとまる。大事なことは散歩しながら決めるといいかもしれない。',
      category: 'journal',
      age: 60 * 5,
      x: 120,
      y: 230,
    },
    {
      id: 'sample-marathon',
      title: 'ハーフマラソンを走る',
      body: '週3回トレーニングする。目標は来年の春。',
      category: 'goals',
      age: 60 * 3,
      x: 330,
      y: 300,
    },
    {
      // An untitled quick memo: shown by its first line.
      id: 'sample-quick',
      title: '',
      body: '牛乳・卵・コーヒー豆を買う\n帰りに本屋にも寄る',
      category: 'other',
      age: 20,
      x: -40,
      y: 400,
    },
    {
      id: 'sample-weekly-review',
      title: 'アイデア：週に一度のふり返り',
      body: '毎週日曜日に、その週に書いたメモを見返して、関係のあるメモ同士をつなぐ。',
      category: 'ideas',
      age: 45,
      x: -130,
      y: 250,
    },
  ];

  // One sample galaxy, so the group feature is visible on first launch.
  const groups: Group[] = [
    { id: 'sample-group-research', name: '研究テーマ', color: '#c9b8ff', createdAt: minutesAgo(60 * 24) },
  ];
  const groupOf: Record<string, string> = {
    'sample-semiconductors': 'sample-group-research',
    'sample-research-goal': 'sample-group-research',
  };

  const notes: Note[] = raw.map(({ age, x: _x, y: _y, ...n }) => ({
    ...n,
    createdAt: minutesAgo(age),
    updatedAt: minutesAgo(age),
    sample: true,
    ...(n.id === 'sample-welcome' ? { pinned: true } : {}),
    ...(groupOf[n.id] ? { groupId: groupOf[n.id] } : {}),
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

  return { version: 1, notes, connections, layout, groups };
}
