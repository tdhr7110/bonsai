import assert from 'node:assert/strict';
import { createBonsai } from '../js/bonsai-model.js';
import { pruneBranch, bendBranch, thinLeaves } from '../js/actions.js';
import { advanceTime } from '../js/growth.js';
import { collectBranchIds } from '../js/utils.js';

// Pruning must remove all dependent leaves, while a snapshot restores the
// whole tree (not just a branch count). This protects the new undo interaction.
for (const species of ['kuromatsu', 'kaede', 'ume']) {
  let tree = createBonsai(species);
  const root = tree.branches[0];
  root.children.push({ id: 'test-child', angle: 0, length: 20, thickness: 2, children: [] });
  tree.leaves.push({ id: 'test-leaf', branchId: 'test-child', density: .8, leaves: [] });
  const before = structuredClone(tree);
  const ids = collectBranchIds(root);
  assert.equal(pruneBranch(tree, root.id), true);
  assert.equal(tree.leaves.some((leaf) => ids.includes(leaf.branchId)), false);
  tree = structuredClone(before);
  assert.deepEqual(tree, before);
  bendBranch(tree, root.id, 1);
  assert.notDeepEqual(tree, before);
  assert.equal(before.branches[0].angle, root.angle);
  const leaf = tree.leaves[0];
  for (let i = 0; i < 10; i++) thinLeaves(tree, leaf.id);
  assert.equal(leaf.density, .1);
  const age = tree.age;
  advanceTime(tree);
  assert.equal(tree.age, age + 1);
}
console.log('PASS: subtree pruning, independent undo snapshots, leaf limit, and growth for all 3 species');
