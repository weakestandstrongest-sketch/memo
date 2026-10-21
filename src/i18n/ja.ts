/**
 * All user-facing text (Japanese).
 *
 * To change any wording in the app, edit it here. Code, comments and
 * identifiers stay in English; only the strings shown to the user live in this file.
 * Text the user types (memo titles and bodies) is never translated.
 */
import type { StarShape } from '../domain/stars';

export const ja = {
  app: {
    name: 'Asterism',
    tagline: 'メモをつないで、あなたの星図に。',
    universeLabel: 'あなたの星図。ひとつひとつの星がメモです。',
  },

  /** Names of the star shapes (for screen readers and the shape picker). */
  stars: {
    sparkle: 'きらめき',
    star: '星',
    burst: '光',
    twinkle: 'またたき',
    star6: '六芒星',
    snow: '雪の結晶',
    diamond: 'ひし形',
    gem: '宝石',
    orb: 'まる',
    ring: 'わっか',
    planet: '惑星',
    crescent: '三日月',
    sun: '太陽',
    comet: '彗星',
    heart: 'ハート',
    flower: '花',
  } satisfies Record<StarShape, string>,

  common: {
    close: '閉じる',
    cancel: 'キャンセル',
    clear: 'クリア',
  },

  tabs: {
    label: 'メインメニュー',
    notes: 'メモ',
    map: '星図',
    create: '新しいメモ',
    history: '歴史',
    settings: '設定',
  },

  /** Home: the list of memos. */
  notes: {
    heading: 'メモ',
    count: (n: number) => `${n}件`,
    moreOptions: 'メニュー',
    heroSub: '思いついたことを、星にしよう',
    countUnit: '件のメモ',
    heroLinks: (n: number) => `つながり ${n}本`,
    showMap: '星図を見る',
    continue: 'つづきを書く',
    reveal: 'メモのメニュー',
    listLabel: 'メモの一覧',
    back: 'もどる',
    /** The black menu that appears when the home is swiped up. */
    actions: {
      label: 'メモのメニュー',
      title: 'メモ',
      search: 'メモを検索する',
      create: '新しいメモを書く',
      list: 'メモの一覧を見る',
      groups: 'グループごとに見る',
      map: '星図を見る',
      close: '閉じる',
    },
    viewLabel: '並べ方',
    viewRecent: '新しい順',
    viewGroups: 'グループ',
    pinned: 'ピン留め',
    buckets: { today: '今日', yesterday: '昨日', week: '今週', earlier: 'それ以前' },
    ungrouped: 'グループなし',
    newGroup: '新しいグループ',
    showGroupInMap: (name: string) => `「${name}」を星図で見る`,
    editGroup: (name: string) => `「${name}」を編集`,
    emptyGroup: 'まだメモがありません。メモの「グループ」から選べます。',
    links: (n: number) => `つながり ${n}`,
    empty: 'まだメモがありません。',
    emptyAction: '最初のメモを書く',
    noMatch: (q: string) => `「${q}」に一致するメモはありません。`,
    noMatchFiltered: '条件に合うメモはありません。',
    pickHint: 'メモを選ぶか、＋で新しく書きはじめましょう。',
    open: (title: string) => `メモを開く：${title}`,
  },

  /** One memo, as a page (Notion-like). */
  note: {
    untitled: '無題',
    ariaLabel: (title: string) => `メモ：${title}`,
    titlePlaceholder: '無題',
    titleLabel: 'タイトル',
    bodyPlaceholder: 'メモを書く…',
    bodyLabel: 'メモの本文',
    back: 'メモ一覧に戻る',
    close: '閉じる',
    sheetExpand: '大きく表示',
    sheetCollapse: '小さく表示',
    shape: '星の形',
    shapeChange: '星の形を変える',
    shapeDone: '星の形の選択を閉じる',
    group: 'グループ',
    noGroup: 'なし',
    newGroupOption: '＋ 新しいグループ…',
    created: '作成',
    updated: '更新',
    sample: 'サンプル',
    showInMap: '星図で見る',
    pin: 'ピン留めする',
    unpin: 'ピン留めを外す',
    deleteAria: 'このメモを削除',
    autosave: '自動で保存されます',
    doneEditing: '完了',
    linksHeading: 'つながり',
    connect: 'つなぐ',
    connectAria: 'ほかのメモとつなぐ',
    noLinks: 'まだどのメモともつながっていません。関係のあるメモとつなげてみましょう。',
    removeLink: (title: string) => `「${title}」とのつながりを外す`,
    removeLinkTooltip: 'つながりを外す',
    showLinkedMemo: (title: string) => `「${title}」の本文を表示`,
    hideLinkedMemo: (title: string) => `「${title}」の本文を閉じる`,
    linkedEmptyBody: '本文はありません。',
    openLinked: 'このメモを開く',
  },

  /** The map ("星図") view. */
  map: {
    heading: '星図',
    count: (notes: number, links: number) => `メモ ${notes}・つながり ${links}`,
  },

  search: {
    placeholder: 'メモを検索',
    ariaLabel: 'タイトルや本文でメモを検索',
    clear: '検索をクリア',
    resultsLabel: '見つかったメモ',
    noMatch: (q: string) => `「${q}」に一致するメモはありません。`,
    more: (n: number) => `ほか${n}件`,
  },

  filter: {
    heading: 'グループ',
    groupLabel: 'グループで絞り込む',
    all: 'すべて',
    none: 'グループなし',
    status: (matched: number, total: number) => `${total}件中 ${matched}件が一致`,
  },

  connectBanner: {
    before: 'つなぐ星をタップ：「',
    after: '」',
  },

  connect: {
    title: 'メモをつなぐ',
    introBefore: '「',
    introAfter: '」とつなぐメモを選んでください。',
    needAnother: 'つなぐには、もうひとつメモを書いてください。',
    searchPlaceholder: 'メモを探す…',
    searchAria: 'つなぐメモを探す',
    pickInUniverse: '星図の中でタップして選ぶ',
    listLabel: 'つなげられるメモ',
    alreadyConnected: 'つながり済み',
    noMatch: (q: string) => `「${q}」に一致するメモはありません。`,
    errors: {
      self: 'そのメモ自身とはつなげません。別のメモを選んでください。',
      duplicate: 'この2つのメモはすでにつながっています。',
      missing: 'そのメモはもう存在しません。',
    },
  },

  toast: {
    deleted: 'メモを削除しました。',
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
    title: 'このメモを削除しますか？',
    message: (title: string, links: number) =>
      links > 0
        ? `「${title}」と、そのつながり${links}本が削除されます。この操作は取り消せません。`
        : `「${title}」が削除されます。この操作は取り消せません。`,
    confirm: '削除する',
  },

  importDialog: {
    title: 'バックアップを読み込みますか？',
    message: (current: number, notes: number, links: number) =>
      `いまのメモ（${current}件）を、バックアップの内容（メモ${notes}件・つながり${links}本）で置き換えます。` +
      'いまの内容は消えるので、必要なら先に「バックアップを書き出す」で保存してください。',
    confirm: '置き換える',
  },

  groupDialog: {
    createTitle: '新しいグループ',
    editTitle: 'グループを編集',
    nameLabel: 'グループ名',
    namePlaceholder: '例：研究テーマ',
    create: '作成する',
    save: '保存する',
    delete: 'このグループを削除',
    note: 'グループのメモは、星図の中で円に囲まれてまとまります。',
    errors: {
      required: 'グループ名を入力してください。',
      tooLong: (max: number) => `グループ名は${max}文字以内にしてください。`,
    },
  },

  deleteGroupDialog: {
    title: 'グループを削除しますか？',
    message: (name: string, count: number) =>
      count > 0
        ? `グループ「${name}」を削除します。中のメモ${count}件は削除されず、「グループなし」になります。`
        : `グループ「${name}」を削除します。`,
    confirm: '削除する',
  },

  lock: {
    title: 'パスコードを入力',
    screenLabel: 'Asterism はロックされています',
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
      'パスコードはどこにも送信していないため、再発行できません。ロックを解除するには、この端末のこのブラウザに保存された Asterism のデータ（メモ・グループ・設定）をすべて消す必要があります。',
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
    focusModeText: '星図でメモを選ぶと、つながっているメモがそのまわりに集まります（表示だけで、位置は保存されません）。',
    splash: '開いたときのアニメーション',
    splashText: 'アプリを開くと、星が生まれて「Asterism」の文字が浮かびます。画面をタップすると飛ばせます。',
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
    open: '星図の歴史',
    label: '星図の歴史',
    play: '再生',
    pause: '一時停止',
    close: '星図の歴史を閉じる',
    slider: '表示する日時',
    stars: (n: number) => `メモ ${n}件`,
    born: (title: string, date: string) => `「${title}」は ${date} に書かれました`,
    notEnough: 'メモが2つ以上になると、星図の歴史を再生できます。',
  },

  hint: {
    touch: 'タップで開く・長押しで移動・ピンチで拡大縮小',
    mouse: 'クリックで開く・ドラッグで移動・ホイールで拡大縮小',
    dismiss: 'ヒントを閉じる',
  },

  view: {
    zoomIn: '拡大',
    zoomOut: '縮小',
    fitAll: '星図全体を表示',
  },

  menu: {
    fitAll: '星図全体を表示',
    help: '使い方',
    export: 'バックアップを書き出す（.json）',
    import: 'バックアップを読み込む…',
    note: 'データはこの端末のこのブラウザにだけ保存されています。',
    settings: '設定',
    lockNow: '今すぐロック',
    history: '星図の歴史を再生',
  },

  help: {
    title: '使い方',
    ok: 'わかった',
    touch: [
      ['下の黒い ＋ ボタン', '新しいメモを書く'],
      ['メモの本文をタップ', 'そのまま書く（自動で保存）'],
      ['メモの「つなぐ」', 'ほかのメモとつなぐ'],
      ['下の「星図」', 'メモのつながりを星図で見る'],
      ['星図で星をタップ', 'メモを開く'],
      ['星を長押しして、別の星に重ねる', '2つのメモをつなぐ'],
      ['星図の何もない所を長押し', 'その場所にメモをつくる'],
      ['1本指でドラッグ・2本指でピンチ', '星図を移動・拡大縮小'],
    ],
    mouse: [
      ['下の黒い ＋ ボタン・「N」キー', '新しいメモを書く'],
      ['メモの本文をクリック', 'そのまま書く（自動で保存）'],
      ['「/」キー', '検索'],
      ['メモの「つなぐ」', 'ほかのメモとつなぐ'],
      ['星図で星をクリック', 'メモを開く'],
      ['星をドラッグして、別の星に重ねる', '2つのメモをつなぐ'],
      ['星図の何もない所をダブルクリック', 'その場所にメモをつくる'],
      ['ドラッグ・マウスホイール', '星図を移動・拡大縮小'],
    ],
    shapesHeading: '星の形',
    shapesText: '星の形はメモごとに自由に選べます（メモのページの「星の形」）。新しいメモには、いずれかの形がランダムにつきます。',
    dataHeading: 'データの保存について',
    dataText:
      'メモはこの端末のこのブラウザの中にだけ保存されます。PC と iPhone のデータは自動では同期されません。' +
      'データを移すときは、メニューの「バックアップを書き出す」でファイルを保存し、もう一方の端末で「バックアップを読み込む」を使ってください。',
  },

  storageNotice: {
    repaired: '保存データの一部が壊れていたため、修復しました。',
    corrupt:
      '保存データを読み込めませんでした。元のデータはこのブラウザ内にバックアップとして残し、サンプルのメモを表示しています。',
    unavailable:
      'このブラウザではデータを保存できない設定になっています（プライベートブラウズなど）。ページを閉じると変更は失われます。',
    saveFailed: '最新の変更を保存できませんでした。ブラウザの保存容量がいっぱいかもしれません。',
  },

  backup: {
    shareTitle: 'Asterism のバックアップ',
    errors: {
      tooLarge: 'ファイルが大きすぎます。Asterism のバックアップではないようです。',
      notJson: 'このファイルは JSON 形式ではありません。',
      notBackup: 'Asterism のバックアップファイルではないようです。',
      readFailed: 'ファイルを読み込めませんでした。',
      exportFailed: 'バックアップを書き出せませんでした。',
    },
  },

  star: {
    dropToConnect: 'ここで離すとつなぐ',
    ariaLabel: (title: string, shape: string) => `${title}（${shape}）`,
  },

  crash: {
    title: '問題が発生しました。',
    text: 'メモはこのブラウザに保存されたままです。ページを再読み込みすると、たいてい直ります。',
    reload: '再読み込み',
  },
};
