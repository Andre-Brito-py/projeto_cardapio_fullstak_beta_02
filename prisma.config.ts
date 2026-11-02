import { defineConfig } from "prisma/config";

// Com prisma.config.ts o Prisma não carrega o .env sozinho.
try {
  process.loadEnvFile(".env");
} catch {
  // Sem .env: usa as variáveis já definidas no ambiente (ex.: produção).
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
