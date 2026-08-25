import { SPECIES } from './bonsai-model.js';
import { rand, randInt, pick, clamp, round1, uid, flattenBranches } from './utils.js';

function createSimpleBranch(species) {
  const [minA, maxA] = species.branchSpread;
  const side = Math.random() < 0.5 ? -1 : 1;
  return {
    id: uid('br'),
    angle: round1(side * rand(minA, maxA)),
    length: round1(rand(28, 45)),
    thickness: round1(rand(4, 7)),
    age: 0,
    alive: true,
    children: [],
  };
}

function createLeafCluster(species, branchId) {
  const baseCount = randInt(7, 12);
  const density = clamp(round1(species.leafDensityBase + rand(-0.15, 0.15), 2), 0.2, 1);
  const radius = species.leafBaseSize * rand(3.2, 5);
  const leaves = [];
  for (let i = 0; i < baseCount; i += 1) {
    leaves.push({
      dx: round1(rand(-radius, radius)),
      dy: round1(rand(-radius * 0.7, radius * 0.15)),
      size: round1(species.leafBaseSize * rand(0.7, 1.35)),
      rot: round1(rand(0, 360)),
      color: pick(species.leafColors),
    });
  }
  return { id: uid('lf'), branchId, size: round1(radius), density, leaves };
}

const EVENTS = [
  { type: 'trunkGrow', weight: 3 },
  { type: 'newBranch', weight: 2 },
  { type: 'branchGrow', weight: 3 },
  { type: 'leafIncrease', weight: 3 },
  { type: 'trunkThicken', weight: 2 },
  { type: 'branchBend', weight: 2 },
];

function pickWeighted() {
  const total = EVENTS.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of EVENTS) {
    if (r < e.weight) return e.type;
    r -= e.weight;
  }
  return EVENTS[0].type;
}

export function advanceTime(bonsai) {
  bonsai.age += 1;
  const species = SPECIES[bonsai.speciesKey] || SPECIES.kuromatsu;
  const type = pickWeighted();
  let desc = '';

  switch (type) {
    case 'trunkGrow': {
      const segs = bonsai.trunk.segments;
      const last = segs[segs.length - 1];
      last.length = round1(last.length + rand(4, 10));
      if (segs.length < 6 && Math.random() < 0.3) {
        segs.push({
          length: round1(rand(20, 34)),
          angle: round1(rand(-16, 16)),
          thickness: round1(last.thickness * rand(0.75, 0.88)),
        });
        desc = '幹が新しく伸び、高さを増しました。';
      } else {
        desc = '幹がわずかに伸びました。';
      }
      bonsai.trunk.height = round1(segs.reduce((s, x) => s + x.length, 0));
      break;
    }
    case 'newBranch': {
      if (bonsai.branches.length < 10) {
        const branch = createSimpleBranch(species);
        branch.segIndex = randInt(0, bonsai.trunk.segments.length - 1);
        branch.position = round1(rand(0.2, 0.95), 2);
        bonsai.branches.push(branch);
        bonsai.leaves.push(createLeafCluster(species, branch.id));
        desc = '新しい枝が芽吹きました。';
      } else {
        desc = '幹がわずかに伸びました。';
        const segs = bonsai.trunk.segments;
        segs[segs.length - 1].length = round1(segs[segs.length - 1].length + rand(2, 5));
      }
      break;
    }
    case 'branchGrow': {
      const all = flattenBranches(bonsai.branches);
      if (all.length) {
        const b = pick(all);
        b.length = round1(b.length + rand(5, 12));
        desc = '枝が少し伸びました。';
      } else {
        desc = '静かに時が流れました。';
      }
      break;
    }
    case 'leafIncrease': {
      if (bonsai.leaves.length) {
        const cluster = pick(bonsai.leaves);
        cluster.density = clamp(round1(cluster.density + 0.12, 2), 0.2, 1);
        desc = '葉が茂ってきました。';
      } else {
        desc = '静かに時が流れました。';
      }
      break;
    }
    case 'trunkThicken': {
      bonsai.trunk.segments.forEach((seg) => {
        seg.thickness = round1(seg.thickness * rand(1.02, 1.06));
      });
      desc = '幹が太くなりました。';
      break;
    }
    case 'branchBend': {
      const all = flattenBranches(bonsai.branches);
      if (all.length) {
        const b = pick(all);
        b.angle = round1(clamp(b.angle + rand(-9, 9), -85, 85));
        desc = '枝が自然に曲がりました。';
      } else {
        desc = '静かに時が流れました。';
      }
      break;
    }
    default:
      desc = '静かに時が流れました。';
  }

  bonsai.history.push({ age: bonsai.age, event: type, desc });
  return desc;
}
