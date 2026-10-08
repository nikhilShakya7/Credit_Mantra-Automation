export const users = {
  borrower: {
    label: 'Borrower',
    email: process.env.BORROWER_EMAIL ?? '',
    password: process.env.BORROWER_PASSWORD ?? '',
  },
  officer: {
    label: 'Credit Officer',
    email: process.env.CREDIT_OFFICER_EMAIL ?? '',
    password: process.env.CREDIT_OFFICER_PASSWORD ?? '',
  },
  developer: {
    label: 'Developer',
    email: process.env.DEVELOPER_EMAIL ?? '',
    password: process.env.DEVELOPER_PASSWORD ?? '',
  },
};

export const invalidUsers = {
  notFound: { email: 'notfound.e2e@example.com', password: 'WrongPass123!' },
  wrongPassword: (email: string) => ({ email, password: 'TotallyWrong123!' }),
  invalidEmail: { email: 'not-an-email', password: 'ValidPass123!' },
  shortPassword: { email: 'regtest.e2e@example.com', password: '123' },
};

export const registration = {
  default: (suffix: string) => ({
    email: `e2e.user.${suffix}@example.com`,
    password: 'E2ETestPass123!',
    confirm: 'E2ETestPass123!',
    role: 'BORROWER',
  }),
};
