# Local Development

This guide covers database configuration and the commands used to run the application locally.

## Prerequisites

- Node.js
- npm
- Either file-backed PGlite (included with the project) or a PostgreSQL server

## Install dependencies

```bash
npm install
```

Copy `.env-example` to `.env` and replace the placeholder secrets before starting the application.

## Database options

### File-backed PGlite

PGlite is the simplest local option and does not require a PostgreSQL server:

```env
DATABASE_URL="file:./.data/local"
```

The database is stored in `.data/local`, which is gitignored. The project npm scripts start a local PGlite socket and provide Prisma with a temporary PostgreSQL connection URL.

Only one process can own a PGlite data directory. Stop a running development server before running standalone migration, seed, or Studio commands.

If the project is in a OneDrive or network-synchronized directory and database locking or corruption occurs, use a path on a normal local disk instead:

```env
# Windows
DATABASE_URL="file:C:/local-data/associate-incidents"

# macOS / Linux
DATABASE_URL="file:/var/tmp/associate-incidents"

# Paths with spaces work when the value is quoted (or percent-encoded)
DATABASE_URL="file:./.data/my local db"
DATABASE_URL="file:./.data/my%20local%20db"
```

### PostgreSQL server

To use an existing PostgreSQL server:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
```

Switching between PGlite and PostgreSQL only requires changing `DATABASE_URL`.

## Initialize the database

Apply all committed Prisma migrations:

```bash
npm run prisma:migrate
```

Load the sample data:

```bash
npm run prisma:seed
```

See [Seeding](SEEDING.md) for custom definitions, CSV input, faker data, and seed flags.

## Start development

```bash
npm run dev
```

This starts the Vite frontend and Express backend together. The same command works on Windows, macOS, and Linux.

For production-style local runs (migrate, then serve the built app):

```bash
npm run build
npm start
```

## Database commands

| Command | Purpose |
| --- | --- |
| `npm run prisma:migrate` | Apply committed migrations |
| `npm run prisma:seed` | Run the default seed |
| `npm run prisma:seed-admin` | Create or update the admin user and roles |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:generate` | Regenerate Prisma Client |

These scripts support both `file:` PGlite URLs and regular PostgreSQL URLs.

When developing a new migration against a PostgreSQL server, you can use `npx prisma migrate dev`. For PGlite, use the committed migrations through `npm run prisma:migrate`.

## Related guides

- [Seeding](SEEDING.md)
- [Authentication](../AUTHENTICATION.md)
- [Email setup](EMAIL_SETUP.md)
- [Backup and restore](BACKUP_RESTORE.md)
