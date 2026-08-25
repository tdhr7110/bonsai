export function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function round1(v) {
  return Math.round(v * 10) / 10;
}

let counter = 0;
export function uid(prefix = 'id') {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}_${Math.random().toString(36).slice(2, 7)}`;
}

export function flattenBranches(branches) {
  const out = [];
  function walk(list) {
    list.forEach((b) => {
      out.push(b);
      if (b.children && b.children.length) walk(b.children);
    });
  }
  walk(branches);
  return out;
}

export function findBranch(branches, id) {
  for (const b of branches) {
    if (b.id === id) return b;
    if (b.children && b.children.length) {
      const found = findBranch(b.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function removeBranch(branches, id) {
  const idx = branches.findIndex((b) => b.id === id);
  if (idx !== -1) {
    return branches.splice(idx, 1)[0];
  }
  for (const b of branches) {
    if (b.children && b.children.length) {
      const removed = removeBranch(b.children, id);
      if (removed) return removed;
    }
  }
  return null;
}

export function collectBranchIds(branch, out = []) {
  out.push(branch.id);
  (branch.children || []).forEach((c) => collectBranchIds(c, out));
  return out;
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
