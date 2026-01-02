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
- `pnpm db:migrate` - Führt Migrationen aus (Development)
- `pnpm db:migrate:deploy` - Führt Migrationen aus (Production)
- `pnpm db:studio` - Öffnet Prisma Studio zur Datenbank-Verwaltung

## Deployment

### Umgebungsvariablen für Production

Stelle sicher, dass folgende Umgebungsvariablen in deiner Deployment-Plattform gesetzt sind:

- `DATABASE_URL` - PostgreSQL Connection String von Neon.com
- `NEXTAUTH_SECRET` - Ein sicherer, zufälliger String (z.B. generiert mit `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Die öffentliche URL deiner Anwendung mit Protokoll (z.B. `https://vio.bruegger.io`)

### Automatische Migrationen

Die Datenbank-Migrationen werden **automatisch** bei jedem Build ausgeführt. Das Build-Script führt `prisma migrate deploy` aus, bevor die Next.js App gebaut wird. Dies bedeutet:

- ✅ Keine manuellen Schritte nötig
- ✅ Migrationen werden bei jedem Deployment automatisch angewendet
- ✅ `prisma migrate deploy` ist idempotent - bereits angewendete Migrationen werden übersprungen
- ✅ Neue Migrationen werden automatisch erkannt und angewendet

**Hinweis:** Stelle sicher, dass `DATABASE_URL` in deinen Vercel Environment Variables gesetzt ist, damit die Migrationen während des Builds ausgeführt werden können.

### Vercel Deployment Checkliste

- [ ] `DATABASE_URL` in Vercel Environment Variables gesetzt
- [ ] `NEXTAUTH_SECRET` in Vercel Environment Variables gesetzt
- [ ] `NEXTAUTH_URL` in Vercel Environment Variables gesetzt (z.B. `https://vio.bruegger.io`) - **optional**, da `trustHost: true` gesetzt ist
- [ ] Erste Deployment durchgeführt (Migrationen laufen automatisch)
- [ ] Datenbank-Tabellen erstellt und verifiziert (überprüfe in Neon.com Dashboard)
