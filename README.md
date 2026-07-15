# CampusConnect Backend

Private social networking platform for colleges — production-ready Node.js API.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js + TypeScript
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (Access + Refresh tokens) + bcryptjs
- **Real-time:** Socket.IO
- **Media:** Cloudinary + Multer
- **Security:** Helmet, CORS, Rate Limiting, Express Validator
- **Docs:** Swagger UI

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 7+ (or Docker)

### Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start MongoDB (if using Docker)
docker compose up mongo -d

# Seed demo data
npm run seed

# Start dev server
npm run dev
```

API: `http://localhost:5000/api/v1`  
Swagger Docs: `http://localhost:5000/api-docs`

### Docker (Full Stack)

```bash
cp .env.example .env
# Edit .env with your secrets

docker compose up --build
```

## Project Structure

```
src/
├── config/          # App, DB, Cloudinary, Swagger config
├── models/          # Mongoose schemas
├── repositories/    # Data access layer
├── services/        # Business logic
├── controllers/     # Request handlers
├── routes/          # API routes
├── middlewares/     # Auth, validation, error handling
├── validators/      # Express-validator rules
├── sockets/         # Socket.IO handlers
├── utils/           # Helpers (JWT, password, cloudinary)
├── types/           # TypeScript types
├── scripts/         # Seed script
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## API Modules

| Module | Endpoints |
|--------|-----------|
| **Auth** | Register, Login, Refresh, Logout, Forgot/Reset/Change Password |
| **Users** | Search, Filter, Profile Update |
| **Posts** | CRUD, Feed, Like/Unlike, Trending |
| **Comments** | Add, Delete, List |
| **Connections** | Send/Accept/Reject/Cancel/Remove, List |
| **Opportunities** | CRUD, Search, Filter |
| **Events** | CRUD, RSVP (Interested/Going) |
| **Messages** | Conversations, Send, Read receipts |
| **Notifications** | List, Mark read |
| **Feed** | Unified feed (posts + opportunities + events) |
| **Developer** | User management, Analytics |

## Demo Credentials

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| Developer | prakharsaxena5125@gmail.com | Developer@12345 |
| HOD | romasaxena1234@gmail.com | Teacher@123 |
| Teacher | michael.chen@campusconnect.edu | Teacher@123 |
| Student | alice.williams@student.campusconnect.edu | Student@123 |
| Alumni | carol.davis@alumni.campusconnect.edu | Alumni@123 |

## Socket.IO Events

Connect with JWT token in auth:

```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_ACCESS_TOKEN' }
});
```

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_conversation` | Client → Server | Join a conversation room |
| `send_message` | Client → Server | Send real-time message |
| `new_message` | Server → Client | Receive new message |
| `typing_start` / `typing_stop` | Client → Server | Typing indicators |
| `user_typing` | Server → Client | Typing status broadcast |
| `mark_read` | Client → Server | Mark messages as read |
| `messages_read` | Server → Client | Read receipt broadcast |
| `online_users` | Server → Client | List of online user IDs |

## Scripts

```bash
npm run dev        # Development with hot reload
npm run build      # Compile TypeScript
npm start          # Production server
npm run seed       # Seed demo data
npm run typecheck  # TypeScript check
```

## Environment Variables

See `.env.example` for all configuration options.

## License

MIT
