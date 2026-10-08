import path from 'path';

/** Where the reusable authenticated sessions are written/read from (git-ignored). */
export const STORAGE_STATE_DIR = path.join(__dirname, '..', '.auth');

export const storageState = {
  borrower: path.join(STORAGE_STATE_DIR, 'borrower.json'),
  officer: path.join(STORAGE_STATE_DIR, 'officer.json'),
  developer: path.join(STORAGE_STATE_DIR, 'developer.json'),
} as const;
