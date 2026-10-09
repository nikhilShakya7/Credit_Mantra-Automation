import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable "${name}". Copy .env.example to .env and fill in real values.`,
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export const env = {
  baseURL: (() => {
    const value = process.env.BASE_URL?.trim();
    if (!value) {
      throw new Error(
        'Missing environment variable "BASE_URL". Copy .env.example to .env and set the app URL before running Playwright tests.',
      );
    }
    return value;
  })(),

  borrower: {
    email: () => required("BORROWER_EMAIL"),
    password: () => required("BORROWER_PASSWORD"),
  },
  creditOfficer: {
    email: () => required("CREDIT_OFFICER_EMAIL"),
    password: () => required("CREDIT_OFFICER_PASSWORD"),
  },
  developer: {
    email: () => required("DEVELOPER_EMAIL"),
    password: () => required("DEVELOPER_PASSWORD"),
  },

  /** Optional - when absent the API key is read from the portal UI at runtime. */
  apiKey: () => optional("CREDIT_API_KEY"),
};
