/**
 * All user-facing text (Japanese).
 *
 * To change any wording in the app, edit it here. Code, comments and
 * identifiers stay in English; only the strings shown to the user live in this file.
 * Text the user types (note titles and bodies) is never translated.
 */
import type { CategoryId } from '../domain/types';

export const ja = {
  app: {
    name: 'My Universe',
    tagline: 'あなたのアイデアで、あなただけの宇宙を。',
    universeLabel: 'あなたの宇宙。ひとつひとつの星がメモです。',
  },

  categories: {
    ideas: { label: 'アイデア', shapeName: 'きらめき', description: 'ひらめき・考え・「もしも」' },
    learning: { label: '学び', shapeName: '輪のある惑星', description: '学んだこと・発見したこと' },
    goals: { label: '目標', shapeName: '星', description: 'これから目指したいこと' },
    journal: { label: '日記', shapeName: '三日月', description: '出来事・気持ち・ふり返り' },
    other: { label: 'その他', shapeName: 'ひし形', description: 'どれにも当てはまらないもの' },
  } satisfies Record<CategoryId, { label: string; shapeName: string; description: string }>,

  common: {
    close: '閉じる',
    cancel: 'キャンセル',
    clear: 'クリア',
  },

  topbar: {
    /** Greeting shown above the wordmark, by time of day. */
    greeting: (hour: number) => (hour >= 5 && hour < 11 ? 'おはようございます' : hour >= 11 && hour < 17 ? 'こんにちは' : 'こんばんは'),
    starsUnit: '個の星',
    links: (n: number) => `つながり ${n}`,
    filterButton: (active: number) =>
      active > 0 ? `カテゴリで絞り込む（${active}件選択中）` : 'カテゴリで絞り込む',
    moreOptions: 'メニュー',
  },

  search: {
    placeholder: '宇宙を検索',
    ariaLabel: 'タイトルや本文でメモを検索',
    clear: '検索をクリア',
    resultsLabel: '見つかった星',
    noMatch: (q: string) => `「${q}」に一致する星はありません。`,
    more: (n: number) => `ほか${n}件は宇宙の中で光っています`,
  },

  filter: {
    heading: 'カテゴリ',
    groupLabel: 'カテゴリで絞り込む',
    all: 'すべての星',
    allShort: 'すべて',
    status: (matched: number, total: number) => `${total}個中 ${matched}個が一致`,
  },

  connectBanner: {
    before: '星をタップすると「',
    after: '」とつなぎます',
  },

  detail: {
    ariaLabel: (title: string) => `星の詳細：${title}`,
    sample: 'サンプル',
    close: '詳細を閉じる',
    created: (date: string) => `作成：${date}`,
    edited: (date: string) => `編集：${date}`,
    emptyBody: 'まだ本文はありません。',
    linksHeading: 'つながっている星',
    noLinks: 'まだどの星ともつながっていません。関連するアイデアとつなげてみましょう。',
    removeLink: (title: string) => `「${title}」とのつながりを外す`,
    removeLinkTooltip: 'つながりを外す',
    connect: '星をつなぐ',
    edit: '編集',
    delete: '削除',
    deleteAria: 'この星を削除',
    sheetExpand: '大きく表示',
    sheetCollapse: '小さく表示',
    pin: 'ピン留めする',
    unpin: 'ピン留めを外す',
    showLinkedMemo: (title: string) => `「${title}」のメモを表示`,
    hideLinkedMemo: (title: string) => `「${title}」のメモを閉じる`,
    linkedEmptyBody: '本文はありません。',
    openStar: 'この星を開く',
  },

  form: {
    newTitle: '新しい星をうむ',
    editTitle: '星を編集',
    create: '星をうむ',
    save: '保存する',
    titleLabel: 'タイトル',
    titlePlaceholder: 'どんな星ですか？',
    categoryLabel: 'カテゴリ',
    bodyLabel: 'メモ',
    bodyPlaceholder: '思いついたことを書きとめましょう…',
    groupLabel: 'グループ',
    noGroup: 'グループなし',
    newGroupOption: '＋ 新しいグループをつくる…',
    required: '必須',
    optional: '任意',
    errors: {
      titleRequired: 'タイトルを入力してください。',
      titleTooLong: (max: number) => `タイトルは${max}文字以内にしてください。`,
      bodyTooLong: (max: number) => `本文が長すぎます（${max}文字まで）。`,
      categoryRequired: 'カテゴリを選んでください。',
    },
  },

  connect: {
    title: '星をつなぐ',
    introBefore: '「',
    introAfter: '」とつなぐ星を選んでください。',
    needAnother: 'つなぐには、もうひとつ星をつくってください。',
    searchPlaceholder: '星を探す…',
    searchAria: 'つなぐ星を探す',
    pickInUniverse: '宇宙の中で星をタップして選ぶ',
    listLabel: 'つなげられる星',
    alreadyConnected: 'つながり済み',
    noMatch: (q: string) => `「${q}」に一致する星はありません。`,
    errors: {
      self: 'その星自身とはつなげません。別の星を選んでください。',
      duplicate: 'この2つの星はすでにつながっています。',
      missing: 'その星はもう存在しません。',
    },
  },

  toast: {
    created: '新しい星が生まれました ✦',
    saved: '変更を保存しました。',
    deleted: '星を削除しました。',
    connected: (a: string, b: string) => `「${a}」と「${b}」をつなぎました`,
    linkRemoved: 'つながりを外しました。',
    exported: 'バックアップファイルを書き出しました。',
    shared: 'バックアップファイルを共有しました。',
    imported: 'バックアップを読み込みました。',
    pinned: 'ピン留めしました。',
    unpinned: 'ピン留めを外しました。',
    groupCreated: (name: string) => `グループ「${name}」をつくりました。`,
    groupSaved: 'グループを保存しました。',
    groupDeleted: 'グループを削除しました。',
    lockEnabled: 'パスコードロックをオンにしました。',
    lockDisabled: 'パスコードロックをオフにしました。',
    passcodeChanged: 'パスコードを変更しました。',
    reminderSnoozed: 'あした、またお知らせします。',
  },

  deleteDialog: {
    title: 'この星を削除しますか？',
    message: (title: string, links: number) =>
      links > 0
        ? `「${title}」と、そのつながり${links}本が削除されます。この操作は取り消せません。`
        : `「${title}」が削除されます。この操作は取り消せません。`,
    confirm: '削除する',
  },

  importDialog: {
    title: 'バックアップを読み込みますか？',
    message: (current: number, notes: number, links: number) =>
      `いまの宇宙（星${current}個）を、バックアップの内容（星${notes}個・つながり${links}本）で置き換えます。` +
      'いまの内容は消えるので、必要なら先に「バックアップを書き出す」で保存してください。',
    confirm: '置き換える',
  },

  sidebar: {
    title: '星の一覧',
    open: '星の一覧を開く',
    close: '星の一覧を閉じる',
    searchPlaceholder: '一覧から探す…',
    searchAria: '星の一覧を絞り込む',
    pinnedHeading: 'ピン留め',
    ungroupedHeading: 'グループなし',
    newGroup: '新しいグループ',
    focusGroup: (name: string) => `「${name}」を宇宙で表示`,
    editGroup: (name: string) => `「${name}」を編集`,
    collapse: (name: string) => `「${name}」をたたむ`,
    expand: (name: string) => `「${name}」を開く`,
    empty: 'まだ星がありません。',
    noMatch: (q: string) => `「${q}」に一致する星はありません。`,
    emptyGroup: 'まだ星がありません。星の「編集」からこのグループを選べます。',
    pin: (title: string) => `「${title}」をピン留めする`,
    unpin: (title: string) => `「${title}」のピン留めを外す`,
    swipeHint: '画面の左端から右へスワイプしても開けます。',
  },

  groupDialog: {
    createTitle: '新しいグループ',
    editTitle: 'グループを編集',
    nameLabel: 'グループ名',
    namePlaceholder: '例：研究テーマ',
    colorLabel: '銀河の色',
    colorNames: ['青', 'ピンク', 'ターコイズ', 'オレンジ', '紫', '緑'],
    create: '作成する',
    save: '保存する',
    delete: 'このグループを削除',
    note: 'グループは、宇宙の中で星をまとめて囲む「銀河」として表示されます。',
    errors: {
      required: 'グループ名を入力してください。',
      tooLong: (max: number) => `グループ名は${max}文字以内にしてください。`,
    },
  },

  deleteGroupDialog: {
    title: 'グループを削除しますか？',
    message: (name: string, count: number) =>
      count > 0
        ? `グループ「${name}」を削除します。中の星${count}個は削除されず、「グループなし」になります。`
        : `グループ「${name}」を削除します。`,
    confirm: '削除する',
  },

  lock: {
    title: 'パスコードを入力',
    screenLabel: 'My Universe はロックされています',
    wrong: 'パスコードが違います',
    cooldown: (seconds: number) => `間違いが続いたため、${seconds}秒後にもう一度入力できます。`,
    forgot: 'パスコードを忘れた',
    backspace: '1文字消す',
    keyboardHint: 'キーボードの数字キーでも入力できます。',
  },

  passcodeSetup: {
    setTitle: 'パスコードを設定',
    changeTitle: 'パスコードを変更',
    disableTitle: 'ロックをオフにする',
    enterCurrent: '今のパスコードを入力してください',
    enterNew: (min: number, max: number) => `新しいパスコード（${min}〜${max}桁の数字）`,
    confirm: '確認のため、もう一度入力してください',
    next: '次へ',
    mismatch: 'パスコードが一致しません。最初から入力してください。',
    tooShort: (min: number) => `${min}桁以上で入力してください。`,
    wrongCurrent: 'パスコードが違います。',
    note:
      'パスコードはこの端末のこのブラウザにだけ保存されます。忘れると、この端末のデータを消さない限り開けなくなるため、先にバックアップをとっておくと安心です。',
  },

  forgotDialog: {
    title: 'パスコードを忘れたとき',
    text:
      'パスコードはどこにも送信していないため、再発行できません。ロックを解除するには、この端末のこのブラウザに保存された My Universe のデータ（星・グループ・設定）をすべて消す必要があります。',
    backupText: 'バックアップファイルがあれば、初期化したあとに「バックアップを読み込む」で元に戻せます。',
    typeLabel: '確認のため「削除」と入力してください',
    confirmWord: '削除',
    confirm: 'データを消して初期化',
  },

  settings: {
    title: '設定',
    lockHeading: 'パスコードロック',
    on: 'オン',
    off: 'オフ',
    lockOnText: 'アプリを開くときにパスコードが必要です。',
    lockOffText: 'パスコードを設定すると、アプリを開くときに入力が必要になります。',
    setPasscode: 'パスコードを設定する',
    changePasscode: 'パスコードを変更',
    disableLock: 'ロックをオフにする',
    autoLockLabel: 'ほかのアプリから戻ったときにロックするまで',
    autoLockOption: (minutes: number) => (minutes === 0 ? 'すぐに' : minutes === 60 ? '1時間' : `${minutes}分`),
    lockLimitNote:
      'ロックは、ほかの人に端末を触られたときにメモを見られにくくするためのものです。データ自体は暗号化されません。',
    backupHeading: 'バックアップの通知',
    backupLabel: '通知する間隔',
    backupOption: (days: number) =>
      days === 0
        ? '通知しない'
        : days === 1
          ? '毎日'
          : days === 7
            ? '1週間ごと'
            : days === 14
              ? '2週間ごと'
              : days === 30
                ? '1か月ごと'
                : `${days}日ごと`,
    lastBackup: (date: string | null) => (date ? `最後のバックアップ：${date}` : 'まだバックアップしていません。'),
    exportNow: '今すぐ書き出す',
    backupNote: 'アプリを開いたときに、画面の中にお知らせを表示します（スマホのプッシュ通知ではありません）。',
    displayHeading: '表示',
    focusMode: 'フォーカスモード',
    focusModeText: '星を選ぶと、つながっている星がそのまわりに集まります（表示だけで、位置は保存されません）。',
    timeSky: '時間帯で空の色を変える',
    timeSkyText: '夜明け・昼・夕方・夜で、宇宙の色が少しずつ変わります。',
    splash: '開いたときのアニメーション',
    splashText: 'アプリを開くと、星が生まれて「My Universe」の文字が浮かびます。画面をタップすると飛ばせます。',
    deviceNote: 'これらの設定は、この端末のこのブラウザにだけ保存されます（PC と iPhone で別々です）。',
    saveFailed: '設定を保存できませんでした。プライベートブラウズでは保存できません。',
  },

  reminder: {
    label: 'バックアップのお知らせ',
    never: 'まだバックアップをとっていません。',
    due: (days: number) => `前回のバックアップから${days}日たっています。`,
    text: 'データはこの端末にしか保存されていないので、ときどき書き出しておきましょう。',
    exportNow: '今すぐ書き出す',
    later: 'あとで',
  },

  history: {
    open: '宇宙の歴史',
    label: '宇宙の歴史',
    play: '再生',
    pause: '一時停止',
    close: '宇宙の歴史を閉じる',
    slider: '表示する日時',
    stars: (n: number) => `星 ${n}個`,
    born: (title: string, date: string) => `「${title}」は ${date} に生まれました`,
    notEnough: '星が2つ以上になると、宇宙の歴史を再生できます。',
  },

  hint: {
    touch: 'タップで開く・長押しで移動・ピンチで拡大縮小',
    mouse: 'クリックで開く・ドラッグで移動・ホイールで拡大縮小',
    dismiss: 'ヒントを閉じる',
  },

  view: {
    zoomIn: '拡大',
    zoomOut: '縮小',
    fitAll: '宇宙全体を表示',
  },

  fab: '星をつくる',

  dock: {
    label: 'メインメニュー',
    universe: '宇宙全体を表示',
    list: '星の一覧',
    settings: '設定',
  },

  /** Small note above the dock when stars were born today. */
  today: (n: number) => `きょう、新しい星が${n < 10 ? `${n}つ` : `${n}個`}生まれました`,

  empty: {
    title: 'あなたの宇宙は、最初の星を待っています。',
    button: '最初の星をつくる',
  },

  menu: {
    fitAll: '宇宙全体を表示',
    help: '使い方',
    export: 'バックアップを書き出す（.json）',
    import: 'バックアップを読み込む…',
    note: 'データはこの端末のこのブラウザにだけ保存されています。',
    settings: '設定',
    lockNow: '今すぐロック',
    history: '宇宙の歴史を再生',
  },

  help: {
    title: '使い方',
    ok: 'わかった',
    touch: [
      ['星をタップ', 'メモを開く'],
      ['星を長押ししてドラッグ', '星を動かす'],
      ['1本指でドラッグ', '宇宙を移動'],
      ['2本指でピンチ', '拡大・縮小'],
      ['左端から右へスワイプ', '星の一覧（ピン留め・グループ）'],
      ['星を長押しして、別の星に重ねる', '2つの星をつなぐ'],
      ['何もない所を長押し', 'その場所に星をつくる'],
      ['左下の 🕘 ボタン', '宇宙の歴史を再生'],
    ],
    mouse: [
      ['星をクリック', 'メモを開く'],
      ['星をドラッグ', '星を動かす'],
      ['何もない所をドラッグ', '宇宙を移動'],
      ['マウスホイール', '拡大・縮小'],
      ['「/」キー・「N」キー', '検索・新しい星'],
      ['左上の ☰ ボタン', '星の一覧（ピン留め・グループ）'],
      ['星をドラッグして、別の星に重ねる', '2つの星をつなぐ'],
      ['何もない所をダブルクリック', 'その場所に星をつくる'],
      ['左下の 🕘 ボタン', '宇宙の歴史を再生'],
    ],
    shapesHeading: '星の形',
    dataHeading: 'データの保存について',
    dataText:
      'メモはこの端末のこのブラウザの中にだけ保存されます。PC と iPhone のデータは自動では同期されません。' +
      'データを移すときは、メニューの「バックアップを書き出す」でファイルを保存し、もう一方の端末で「バックアップを読み込む」を使ってください。',
  },

  storageNotice: {
    repaired: '保存データの一部が壊れていたため、修復しました。',
    corrupt:
      '保存データを読み込めませんでした。元のデータはこのブラウザ内にバックアップとして残し、サンプルの星を表示しています。',
    unavailable:
      'このブラウザではデータを保存できない設定になっています（プライベートブラウズなど）。ページを閉じると変更は失われます。',
    saveFailed: '最新の変更を保存できませんでした。ブラウザの保存容量がいっぱいかもしれません。',
  },

  backup: {
    shareTitle: 'My Universe のバックアップ',
    errors: {
      tooLarge: 'ファイルが大きすぎます。My Universe のバックアップではないようです。',
      notJson: 'このファイルは JSON 形式ではありません。',
      notBackup: 'My Universe のバックアップファイルではないようです。',
      readFailed: 'ファイルを読み込めませんでした。',
      exportFailed: 'バックアップを書き出せませんでした。',
    },
  },

  star: {
    dropToConnect: 'ここで離すとつなぐ',
    ariaLabel: (title: string, category: string, shape: string) => `${title}（${category}・${shape}）`,
  },

  crash: {
    title: '問題が発生しました。',
    text: '星はこのブラウザに保存されたままです。ページを再読み込みすると、たいてい直ります。',
    reload: '再読み込み',
  },
};
