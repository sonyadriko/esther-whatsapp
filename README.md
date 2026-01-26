# Esther WhatsApp Bot

WhatsApp automation bot using **Go + Whatsmeow** for backend, **Next.js** for admin dashboard, and **Supabase** for database.

## 🏗️ Project Structure

```
esther-whatsapp/
├── backend/                    # Go Backend
│   ├── cmd/main.go            # Entry point
│   ├── internal/
│   │   ├── config/            # Environment config
│   │   ├── whatsapp/          # Whatsmeow client
│   │   ├── rules/             # Anti-ban validation
│   │   ├── queue/             # Job queue
│   │   ├── api/               # REST API
│   │   └── store/             # Supabase client
│   └── .env                   # Backend config
│
├── frontend/                   # Next.js Frontend
│   ├── app/                   # Pages
│   ├── components/            # React components
│   ├── lib/                   # API & Supabase client
│   └── .env.local             # Frontend config
│
└── schema.sql                 # Supabase database schema
```

## 🚀 Quick Start

### 1. Setup Supabase

1. Go to your Supabase project
2. Open **SQL Editor**
3. Run the contents of `schema.sql`

### 2. Start Backend

```bash
cd backend

# Install dependencies
go mod tidy

# Run the server
go run cmd/main.go
```

The backend will start on `http://localhost:8080`

### 3. Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

The frontend will start on `http://localhost:3000`

### 4. Connect WhatsApp

1. Open `http://localhost:3000/login`
2. Scan the QR code with WhatsApp
3. Done! Bot is now connected

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/status` | WhatsApp connection status |
| GET | `/api/qr` | WebSocket for QR code |
| GET | `/api/messages` | List messages |
| GET | `/api/users` | List users |
| POST | `/api/send` | Send a message |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/validate` | Validate if message can be sent |

## 🛡️ Anti-Ban Rules

| Type | Rule |
|------|------|
| Reply | ✅ Always allowed (user initiated) |
| System Notification | Max 1 per user per 24 hours |
| Operating Hours | 08:00 - 20:00 only |
| Delay | Random 3-10 seconds |
| Promo/Broadcast | 🚫 PROHIBITED |

## 💬 Default Keywords

| Keyword | Response |
|---------|----------|
| `info` | Welcome message |
| `jadwal` | Operating hours |
| `bantuan` | CS contact |
| `stop` | Opt-out from notifications |
| `start` | Opt-in to notifications |

## 🔧 Environment Variables

### Backend (`.env`)

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-api-key
PORT=8080
MAX_SYSTEM_MSG_PER_DAY=1
OPERATING_HOUR_START=8
OPERATING_HOUR_END=20
MIN_DELAY_SECONDS=3
MAX_DELAY_SECONDS=10
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 📊 Flow Diagrams

### User Chat → Bot Reply

```
User → WhatsApp → Bot → Handler → Validator → Sender → Reply
```

### System Notification

```
Event → Queue → Validator → (check opt-in, rate limit, hours) → Sender → WhatsApp
```

## ⚠️ Important Notes

1. **Session Storage**: WhatsApp session is stored in `wa_session.db`
2. **One Session Only**: Only one device can be connected at a time
3. **No Broadcasting**: Never send bulk messages to avoid ban
4. **Natural Behavior**: Always use delays to mimic human behavior

## 📝 License

MIT
# esther-whatsapp
# esther-whatsapp
