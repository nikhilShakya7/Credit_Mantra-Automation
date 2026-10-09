import path from 'path';

/** Where the reusable authenticated sessions are written/read from (git-ignored). */
export const STORAGE_STATE_DIR = path.join(__dirname, '..', '.auth');

export const storageState = {
  borrower: path.join(STORAGE_STATE_DIR, 'borrower.json'),
  officer: path.join(STORAGE_STATE_DIR, 'officer.json'),
  developer: path.join(STORAGE_STATE_DIR, 'developer.json'),
} as const;

export type Role = keyof typeof storageState;

/**
 * A page only a logged-in member of that role can see. Used to verify that a
 * saved session is still accepted, so we never log in twice in one run and
 * never re-log in on a subsequent run while the session cookie is valid.
 */
export const roleProbeUrl: Record<Role, string> = {
  borrower: '/sme/dashboard/',
  officer: '/underwriter/dashboard/',
  developer: '/api/portal/',
};
