import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgresql://hydra:hydra_dev_password@localhost:5433/hydra_dev',
  },
  verbose: true,
  strict: true,
});
