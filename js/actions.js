import { clamp, round1, findBranch, removeBranch, collectBranchIds } from './utils.js';

export function pruneBranch(bonsai, branchId) {
  const target = findBranch(bonsai.branches, branchId);
  if (!target) return false;
  const idsToRemove = collectBranchIds(target);
  removeBranch(bonsai.branches, branchId);
  bonsai.leaves = bonsai.leaves.filter((cluster) => !idsToRemove.includes(cluster.branchId));
  return true;
}

export function bendBranch(bonsai, branchId, direction) {
  const branch = findBranch(bonsai.branches, branchId);
  if (!branch) return false;
  const delta = direction * 10;
  branch.angle = round1(clamp(branch.angle + delta, -85, 85));
  return true;
}

export function thinLeaves(bonsai, clusterId) {
  const cluster = bonsai.leaves.find((c) => c.id === clusterId);
  if (!cluster) return false;
  cluster.density = round1(clamp(cluster.density - 0.2, 0.1, 1), 2);
  return true;
}
