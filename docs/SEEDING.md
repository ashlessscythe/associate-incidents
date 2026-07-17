# Seeding the Database

Seeding is implemented in `prisma/seed.mjs`. A working `DATABASE_URL` and all committed migrations are required before seeding.

## Default seed

For either local PGlite or a regular PostgreSQL server:

```bash
npm run prisma:migrate
npm run prisma:seed
```

When using `DATABASE_URL="file:./.data/local"`, stop the development server first so only one PGlite process owns the database directory.

## Local PGlite seed flags

Run the seed script through the local database wrapper when passing flags:

```bash
node scripts/with-local-db.mjs -- node prisma/seed.mjs --use-faker --count 25
```

Common examples:

```bash
# Add generated associates without re-seeding reference data
node scripts/with-local-db.mjs -- node prisma/seed.mjs --associates-only --use-faker --count 25

# Add associates from prisma/associates.csv
node scripts/with-local-db.mjs -- node prisma/seed.mjs --associates-only

# Clear existing data and perform a fresh generated seed
node scripts/with-local-db.mjs -- node prisma/seed.mjs --clear --use-faker --count 25

# Seed only selected data
node scripts/with-local-db.mjs -- node prisma/seed.mjs --occurrences-only
node scripts/with-local-db.mjs -- node prisma/seed.mjs --rules-only
node scripts/with-local-db.mjs -- node prisma/seed.mjs --users-only

# Show every available flag
node scripts/with-local-db.mjs -- node prisma/seed.mjs --help
```

Do not combine `--clear` with `--associates-only`. Clearing removes the reference data that associates-only mode expects.

## PostgreSQL seed flags

Against a regular PostgreSQL URL, flags can be passed through Prisma using `--` after `db seed`:

```bash
npx prisma db seed -- --associates-only --use-faker --count 10
```

The local wrapper also works with regular PostgreSQL URLs, so the PGlite command form can be used consistently in both environments.

## Available flags

| Flag | Purpose |
| --- | --- |
| `--clear` | Clear all data before seeding |
| `--clear-files` | Clear stored files |
| `--associates-only` | Add associates without re-seeding reference data |
| `--occurrences-only` | Seed only occurrences |
| `--rules-only` | Seed only rules |
| `--users-only` | Seed only users |
| `--ca-only` | Seed only corrective actions |
| `--notifications-only` | Seed only notifications |
| `--files-only` | Seed only files |
| `--use-faker` | Generate seed records with Faker |
| `--count <number>` | Set the generated record count; defaults to 10 |
| `--occurrence-multiplier <number>` | Set generated occurrences per base record |
| `--ca-multiplier <number>` | Set generated corrective-action volume |
| `--notification-multiplier <number>` | Set generated notification volume |

## Reference definitions

Reference data includes notification levels, rules, occurrence types, locations, and departments.

- `prisma/definitions.js` is used when present. It is gitignored for environment-specific data.
- `prisma/definitions-sample.js` is used automatically when the custom file is absent.

To customize the definitions:

```bash
cp prisma/definitions-sample.js prisma/definitions.js
```

The file must export the same shape as the sample: `notificationLevels`, `rules`, `occurrenceTypes`, `locations`, and `departments`.

## Associates

Without `--use-faker`, a full seed reads associates from `prisma/associates.csv`. If the file is missing or empty, CSV associate creation is skipped.

To start from the tracked sample:

```bash
cp prisma/associates-sample.csv prisma/associates.csv
```

With `--associates-only`, the seed skips occurrence types, locations, departments, notification levels, and rules. Faker-generated associates use locations and departments already in the database; associates are still created without those links if none exist.

## Occurrences

A full non-faker seed reads `prisma/occurrences.csv`. Its columns must match `prisma/occurrences-sample.csv`:

```csv
SSO,name,date,code,comment
332333244,Bob Jones,2024-01-01,c02,Some Reason for the c02
```

Occurrence codes must match occurrence types already loaded from definitions or a prior seed.

## Admin user

Admin user and role seeding is separate:

```bash
npm run prisma:seed-admin
```

See [Authentication](../AUTHENTICATION.md) for defaults and production security guidance.
