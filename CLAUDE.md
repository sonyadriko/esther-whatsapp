# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Esther WhatsApp Bot is a WhatsApp automation system with anti-ban protection, built with:

- **Backend**: Go + Gin + Whatsmeow (WhatsApp client library)
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS + Radix UI
- **Database**: Supabase (PostgreSQL)
- **Orchestration**: Docker Compose + Traefik

## Development Commands

### Backend (Go)

```bash
cd backend
go run cmd/main.go          # Start backend server on port 8080
go test ./...               # Run tests
go mod tidy                 # Clean dependencies
```

### Frontend (Next.js)

```bash
cd frontend
npm run dev                 # Start dev server on port 3000
npm run build               # Build for production
npm run lint                # Run ESLint
```

### Docker

```bash
docker-compose up --build   # Build and start all services
```

## Architecture

### Backend Structure

- `cmd/main.go`: Entry point, initializes all subsystems in order
- `internal/config`: Environment-based config (`config.go`) + runtime settings (`settings.go`)
- `internal/whatsapp`: Multi-account WhatsApp client management with Whatsmeow
- `internal/rules`: Anti-ban validation logic
- `internal/queue`: Job queue for scheduled/delayed messaging
- `internal/scheduler`: Cron-based scheduled message execution
- `internal/store`: Supabase client wrapper
- `internal/api`: REST API + WebSocket endpoints
- `internal/broadcast`: Bulk message handling

Key flow: `User Message → WhatsApp → Handler → Validator → Sender → Reply`
System flow: `Event → Queue → Validator → Sender → WhatsApp`

### Frontend Structure

- `app/`: Next.js App Router pages
- `components/`: React components, including `ui/` directory with Radix UI primitives
- `lib/api.ts`: Backend API client
- `lib/supabase.ts`: Supabase client initialization

## Important Implementation Details

### Multi-Account System

The backend supports multiple WhatsApp accounts via `internal/whatsapp/manager.go`:
- Each account has its own WhatsApp client and SQLite session store (`wa_session_{id}.db`)
- AccountManager is a singleton managing all accounts
- QR code login flows through WebSocket endpoints per account

### Anti-Ban Protection

Located in `internal/rules/validator.go`:
- Reply messages: Always allowed (user-initiated)
- System messages: Max 1 per user per 24h, within operating hours only
- Promo/broadcast: **PROHIBITED**
- Operating hours: Configurable, default 08:00-20:00
- Random delays: 3-10 seconds between messages

### Runtime Settings

`internal/config/settings.go` manages runtime configuration:
- Auto-reply on/off
- Away message with outside-hours logic
- Operating hours (closed on Sundays)
- Rate limits (min/max delay, daily per-user limit)

### Session Persistence

WhatsApp sessions stored in `backend/wa_session_*.db` files (SQLite). **Do not commit these to git**.

## Environment Variables

Backend (`.env`):
- `SUPABASE_URL`, `SUPABASE_KEY`
- `PORT=8080`
- `MAX_SYSTEM_MSG_PER_DAY=1`
- `OPERATING_HOUR_START=8`, `OPERATING_HOUR_END=20`
- `MIN_DELAY_SECONDS=3`, `MAX_DELAY_SECONDS=10`

Frontend (`.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL=http://localhost:8080`

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/status` - WhatsApp connection status
- `GET /api/qr` - WebSocket for QR code (legacy single account)
- `GET /api/accounts` - Multi-account management
- `POST /api/send` - Send message
- `GET /api/messages` - List messages
- `GET /api/users` - User management
- `GET /api/settings` - Runtime settings
