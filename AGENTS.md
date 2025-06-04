# AGENT Instructions

This repository is a TypeScript monorepo using Prisma for a SQLite database and a React front-end built with Vite. The source code follows a feature-sliced folder structure under `src/` (`app`, `entities`, `features`, `widgets`, `processes`, `pages`, `shared`).

Все ответы агента должны быть на русском языке.

## Development

- Install dependencies with `npm install`.
- To start the dev server run `npm run dev`.
- Build for production with `npm run build` and preview with `npm run preview`.
- Run database migrations via `npm run prisma:migrate` and generate the Prisma client via `npm run prisma:generate`.
- Seed the database with `npm run seed`.

## Code style

- All code is written in TypeScript.
- Use React functional components with hooks.
- Import paths use the alias `@/` which maps to `src/` as defined in `tsconfig.json`.
- Each source file begins with a comment of the form `// src/…` indicating its relative path. Keep this when creating new files.
- Indentation is two spaces and imports use double quotes.

## Linting and tests

- Run `npm run lint` before committing changes.
- Automated tests are located in `api.test.ts`. Run them with `npx tsx api.test.ts`.

