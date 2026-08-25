import { uid } from './utils.js';

const KEY = 'bonsai_gallery_v1';

export function loadAll() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveRecord(bonsai, council, name) {
  const record = {
    id: uid('rec'),
    name: name && name.trim() ? name.trim() : '無銘',
    speciesKey: bonsai.speciesKey,
    species: bonsai.species,
    age: bonsai.age,
    completedAt: bonsai.completedAt,
    bonsaiData: bonsai,
    council,
  };
  const all = loadAll();
  all.unshift(record);
  localStorage.setItem(KEY, JSON.stringify(all));
  return record;
}
