import { pick, flattenBranches } from './utils.js';

const REVIEWERS = [
  { key: 'traditional', name: '宗玄', title: '伝統派の盆栽師', focus: ['oldAge', 'highHeight', 'lowHeight', 'fewBranches', 'trunkForm'] },
  { key: 'free', name: '千景', title: '自由な樹形を好む盆栽師', focus: ['asymmetric', 'leanStrong', 'manyBranches', 'individual'] },
  { key: 'composition', name: '景山', title: '全体構成を見る盆栽師', focus: ['fewBranches', 'manyBranches', 'balance', 'lowHeight', 'highHeight'] },
];

const CONDITIONS = {
  leanStrong: {
    test: (m) => Math.abs(m.leanMagnitude) > 10,
    lines: ['大胆な流れがありますな。', '風を受け続けた樹のような生命力を感じます。'],
  },
  fewBranches: {
    test: (m) => m.branchCount <= 2,
    lines: ['枝を抑えたことで、幹そのものの美しさが際立っています。', '余白を大胆に残した構成ですね。'],
  },
  manyBranches: {
    test: (m) => m.branchCount >= 6,
    lines: ['非常に生命力を感じる一本です。', '葉と枝が作る密度に若々しい力があります。'],
  },
  asymmetric: {
    test: (m) => m.asymmetryScore > 0.35,
    lines: ['均整ではなく、自然の流れを選びましたな。', 'この不均衡が不思議な緊張感を生んでいます。'],
  },
  lowHeight: {
    test: (m) => m.heightTotal < 130,
    lines: ['低く構えた姿に落ち着きを感じます。'],
  },
  highHeight: {
    test: (m) => m.heightTotal > 210,
    lines: ['天へ伸びる姿が印象的です。'],
  },
  oldAge: {
    test: (m) => m.ageValue >= 12,
    lines: ['長い年月を感じさせる風格があります。'],
  },
  trunkForm: {
    test: (m) => Math.abs(m.leanMagnitude) <= 10 && m.branchCount > 2 && m.branchCount < 6,
    lines: ['幹の運びに素直な力強さがありますね。', '一本の芯が通った、良い姿です。'],
  },
  individual: {
    test: (m) => m.branchCount >= 4 || Math.abs(m.leanMagnitude) > 8,
    lines: ['この樹にしかない個性が息づいています。', '誰かの真似ではない、独自の樹形ですな。'],
  },
  balance: {
    test: (m) => m.leafDensityAvg >= 0.35 && m.leafDensityAvg <= 0.9,
    lines: ['鉢との調和が見事です。', '全体のまとまりに品がありますね。'],
  },
};

const FALLBACK_LINES = [
  '静かな気品を纏った一本です。',
  '眺めるほどに味わいが増しますね。',
  'この樹には確かな個性が宿っています。',
  '手をかけた時間がよく伝わってきます。',
];

const FINAL_LINES = [
  '非常に静かな時間を感じる一本となりました。',
  'この樹は、この形だからこそ完成したのでしょう。',
  '長く記憶に残る盆栽になりそうです。',
  '飾らぬ姿に、かえって心惹かれます。',
];

function computeMetrics(bonsai) {
  const allBranches = flattenBranches(bonsai.branches);
  const topLevel = bonsai.branches;
  let left = 0;
  let right = 0;
  topLevel.forEach((b) => {
    if (b.angle < 0) left += 1;
    else if (b.angle > 0) right += 1;
  });
  const total = left + right;
  const asymmetryScore = total ? Math.abs(left - right) / total : 0;
  const leafDensityAvg = bonsai.leaves.length
    ? bonsai.leaves.reduce((s, c) => s + c.density, 0) / bonsai.leaves.length
    : 0.5;

  return {
    leanMagnitude: bonsai.trunk.lean,
    branchCount: allBranches.length,
    asymmetryScore,
    heightTotal: bonsai.trunk.height,
    ageValue: bonsai.age,
    leafDensityAvg,
  };
}

function pickLinesFor(reviewer, metrics, used) {
  const matched = reviewer.focus.filter((key) => CONDITIONS[key] && CONDITIONS[key].test(metrics));
  const lines = [];
  matched.forEach((key) => {
    const pool = CONDITIONS[key].lines.filter((l) => !used.has(l));
    if (pool.length && lines.length < 2) {
      const line = pick(pool);
      lines.push(line);
      used.add(line);
    }
  });
  if (!lines.length) {
    const pool = FALLBACK_LINES.filter((l) => !used.has(l));
    const line = pick(pool.length ? pool : FALLBACK_LINES);
    lines.push(line);
    used.add(line);
  }
  return lines.join('');
}

export function generateCouncilReport(bonsai) {
  const metrics = computeMetrics(bonsai);
  const used = new Set();
  const reviewers = REVIEWERS.map((r) => ({
    name: r.name,
    title: r.title,
    comment: pickLinesFor(r, metrics, used),
  }));
  const final = pick(FINAL_LINES);
  return { reviewers, final };
}
