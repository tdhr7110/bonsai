import { SPECIES } from './bonsai-model.js';

function el(tag, className) {
  const e = document.createElement('div');
  if (className) e.className = className;
  return e;
}

function renderLeafCluster(cluster, parentEl) {
  const anchor = el('div', 'leaf-anchor');
  anchor.dataset.clusterId = cluster.id;
  const visibleCount = Math.max(1, Math.round(cluster.leaves.length * cluster.density));
  const shown = cluster.leaves.slice(0, visibleCount);
  shown.forEach((leaf, i) => {
    const leafEl = el('div', 'leaf');
    leafEl.style.width = `${leaf.size}px`;
    leafEl.style.height = `${leaf.size * 0.8}px`;
    leafEl.style.left = `${leaf.dx}px`;
    leafEl.style.top = `${leaf.dy}px`;
    leafEl.style.background = leaf.color;
    leafEl.style.transform = `translate(-50%, -50%) rotate(${leaf.rot}deg)`;
    leafEl.style.animationDelay = `${(i % 6) * 0.35}s`;
    anchor.appendChild(leafEl);
  });
  anchor.classList.add('hit-area');
  parentEl.appendChild(anchor);
  return anchor;
}

function renderBranch(branch, parentEl, leavesByBranch, ctx) {
  const anchor = el('div', 'branch-anchor');
  const branchEl = el('div', 'branch');
  branchEl.dataset.branchId = branch.id;
  branchEl.style.height = `${branch.length}px`;
  branchEl.style.width = `${branch.thickness}px`;
  branchEl.style.background = ctx.species.trunkColor;
  branchEl.style.transform = `translateX(-50%) rotate(${branch.angle}deg)`;
  if (ctx.selectedId === branch.id) branchEl.classList.add('selected');
  if (ctx.interactive && (ctx.mode === 'prune' || ctx.mode === 'bend')) {
    branchEl.classList.add('clickable');
    branchEl.addEventListener('click', (evt) => {
      evt.stopPropagation();
      ctx.onSelectBranch && ctx.onSelectBranch(branch.id);
    });
  }
  anchor.appendChild(branchEl);

  const cluster = leavesByBranch.get(branch.id);
  if (cluster) {
    const leafAnchor = renderLeafCluster(cluster, branchEl);
    if (ctx.interactive && ctx.mode === 'leaf') {
      leafAnchor.classList.add('clickable');
      leafAnchor.addEventListener('click', (evt) => {
        evt.stopPropagation();
        ctx.onSelectLeaf && ctx.onSelectLeaf(cluster.id);
      });
    }
  }

  (branch.children || []).forEach((child) => {
    renderBranch(child, branchEl, leavesByBranch, ctx);
  });

  parentEl.appendChild(anchor);
}

function renderTrunkSegment(segments, index, parentEl, branchesBySeg, leavesByBranch, ctx) {
  if (index >= segments.length) return;
  const seg = segments[index];
  const segEl = el('div', 'trunk-segment');
  segEl.style.height = `${seg.length}px`;
  segEl.style.width = `${seg.thickness}px`;
  segEl.style.background = ctx.species.trunkColor;
  segEl.style.transform = `translateX(-50%) rotate(${seg.angle}deg)`;
  parentEl.appendChild(segEl);

  const branchesHere = branchesBySeg.get(index) || [];
  branchesHere.forEach((branch) => {
    const anchor = el('div', 'trunk-branch-anchor');
    anchor.style.bottom = `${branch.position * 100}%`;
    segEl.appendChild(anchor);
    renderBranch(branch, anchor, leavesByBranch, ctx);
  });

  renderTrunkSegment(segments, index + 1, segEl, branchesBySeg, leavesByBranch, ctx);
}

export function renderBonsai(container, bonsai, options = {}) {
  const ctx = {
    interactive: !!options.interactive,
    mode: options.mode || null,
    selectedId: options.selectedId || null,
    onSelectBranch: options.onSelectBranch,
    onSelectLeaf: options.onSelectLeaf,
    species: SPECIES[bonsai.speciesKey] || SPECIES.kuromatsu,
  };
  container.innerHTML = '';
  container.className = 'bonsai-stage';
  container.dataset.speciesKey = bonsai.speciesKey;

  const potEl = el('div', `pot pot-${bonsai.pot.type}`);
  potEl.style.width = `${bonsai.pot.width}px`;
  potEl.style.height = `${bonsai.pot.height}px`;
  potEl.style.borderColor = bonsai.pot.color;
  container.appendChild(potEl);

  const trunkRoot = el('div', 'trunk-root');
  trunkRoot.style.bottom = `${10 + bonsai.pot.height * 0.55}px`;
  container.appendChild(trunkRoot);

  const branchesBySeg = new Map();
  bonsai.branches.forEach((b) => {
    const list = branchesBySeg.get(b.segIndex) || [];
    list.push(b);
    branchesBySeg.set(b.segIndex, list);
  });

  const leavesByBranch = new Map();
  bonsai.leaves.forEach((cluster) => {
    leavesByBranch.set(cluster.branchId, cluster);
  });

  renderTrunkSegment(bonsai.trunk.segments, 0, trunkRoot, branchesBySeg, leavesByBranch, ctx);
}
