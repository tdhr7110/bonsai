import { rand, randInt, pick, clamp, round1, uid } from './utils.js';

export const SPECIES = {
  kuromatsu: {
    key: 'kuromatsu',
    name: '黒松',
    trunkColor: '#d6d2c6',
    trunkColorDark: '#a8a396',
    leafColors: ['#8f8f86', '#75756c', '#5c5c54', '#666660'],
    leafShape: 'needle',
    leafBaseSize: 5,
    leafDensityBase: 0.8,
    branchSpread: [22, 58],
    potColors: ['#242422', '#1c1c1a', '#2a2a28'],
  },
  kaede: {
    key: 'kaede',
    name: '楓',
    trunkColor: '#e6e0d2',
    trunkColorDark: '#b8b2a0',
    leafColors: ['#d8d2c0', '#c2bcaa', '#a8a294', '#bcb6a4'],
    leafShape: 'round',
    leafBaseSize: 7,
    leafDensityBase: 0.65,
    branchSpread: [26, 65],
    potColors: ['#242422', '#2c2c2a', '#1c1c1a'],
  },
  ume: {
    key: 'ume',
    name: '梅',
    trunkColor: '#ece6d8',
    trunkColorDark: '#c4bdae',
    leafColors: ['#f7f4ec', '#efe9dd', '#e2dbcc', '#eae3d4'],
    leafShape: 'round',
    leafBaseSize: 4,
    leafDensityBase: 0.5,
    branchSpread: [32, 72],
    potColors: ['#242422', '#1c1c1a', '#302f2c'],
  },
};

const POT_TYPES = ['oval', 'rect'];

function createTrunk() {
  const segCount = randInt(3, 5);
  const segments = [];
  let thickness = rand(7, 11);
  const leanBias = pick([-1, -1, 0, 0, 0, 1, 1]) * rand(4, 11);
  for (let i = 0; i < segCount; i += 1) {
    const length = rand(30, 50) * (1 - i * 0.06);
    const angle = i === 0 ? rand(-6, 6) : round1(leanBias / segCount + rand(-15, 15));
    segments.push({
      length: round1(length),
      angle: round1(angle),
      thickness: round1(thickness),
    });
    thickness *= rand(0.78, 0.9);
  }
  return {
    height: round1(segments.reduce((s, x) => s + x.length, 0)),
    thickness: segments[0].thickness,
    lean: round1(leanBias),
    segments,
  };
}

function createBranch(species, depth = 0) {
  const [minA, maxA] = species.branchSpread;
  const side = Math.random() < 0.5 ? -1 : 1;
  const angle = side * rand(minA, maxA);
  const length = rand(32, 62) * (depth === 0 ? 1 : 0.6);
  const branch = {
    id: uid('br'),
    angle: round1(angle),
    length: round1(length),
    thickness: round1(rand(2, 4) * (depth === 0 ? 1 : 0.6)),
    age: 0,
    alive: true,
    children: [],
  };
  if (depth === 0 && Math.random() < 0.4) {
    branch.children.push(createBranch(species, depth + 1));
  }
  return branch;
}

function attachBranches(species, trunk) {
  const count = randInt(2, 6);
  const branches = [];
  for (let i = 0; i < count; i += 1) {
    const branch = createBranch(species, 0);
    branch.segIndex = randInt(0, trunk.segments.length - 1);
    branch.position = round1(rand(0.25, 0.95), 2);
    branches.push(branch);
  }
  return branches;
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
  return {
    id: uid('lf'),
    branchId,
    size: round1(radius),
    density,
    leaves,
  };
}

function collectLeafClusters(species, branches) {
  const clusters = [];
  function walk(list) {
    list.forEach((b) => {
      clusters.push(createLeafCluster(species, b.id));
      if (b.children && b.children.length) walk(b.children);
    });
  }
  walk(branches);
  return clusters;
}

export function createBonsai(speciesKey) {
  const species = SPECIES[speciesKey] || SPECIES.kuromatsu;
  const trunk = createTrunk();
  const branches = attachBranches(species, trunk);
  const leaves = collectLeafClusters(species, branches);
  const potType = pick(POT_TYPES);
  return {
    id: uid('bonsai'),
    species: species.name,
    speciesKey: species.key,
    age: randInt(1, 3),
    trunk,
    branches,
    leaves,
    pot: {
      type: potType,
      width: potType === 'oval' ? round1(rand(120, 160)) : round1(rand(115, 150)),
      height: round1(rand(26, 36)),
      color: pick(species.potColors),
    },
    history: [],
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}
