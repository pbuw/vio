# Vio - Versicherungsleistungen verwalten

Vio ist eine Web-Anwendung zur Verwaltung von Zusatzversicherungsleistungen, Ausgaben und Budgets.

## Setup

### 1. Datenbank einrichten (Neon.com)

1. Erstelle ein Konto auf [Neon.com](https://neon.tech)
2. Erstelle ein neues Projekt
3. Kopiere die Connection String aus dem Dashboard

### 2. Umgebungsvariablen

Erstelle eine `.env` Datei im Root-Verzeichnis:

```env
# Database (Neon.com PostgreSQL)
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Installation

```bash
pnpm install
```

### 4. Datenbank-Migrationen

```bash
# Generiere Prisma Client
pnpm db:generate

# Führe Migrationen aus
pnpm db:migrate
```

### 5. Entwicklungsserver starten

```bash
pnpm dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## Datenbank

Die Anwendung verwendet PostgreSQL über Neon.com. Das Prisma Schema ist in `prisma/schema.prisma` definiert.

### Nützliche Befehle

- `pnpm db:generate` - Generiert Prisma Client
- `pnpm db:migrate` - Führt Migrationen aus
- `pnpm db:studio` - Öffnet Prisma Studio zur Datenbank-Verwaltung
