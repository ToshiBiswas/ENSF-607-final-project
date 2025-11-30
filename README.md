# Event Planner (MindPlanner)

A full-stack web application for event planning and ticket management. This marketplace connects event organizers with attendees, providing a seamless experience for creating, discovering, and managing events with integrated ticket sales, AI-powered recommendations, and payment processing.

## 🎯 Project Overview

**Event Planner (MindPlanner)** is a comprehensive event management platform that enables:

- **Event Organizers**: Create and manage events with multiple ticket types, validate tickets at entry, and track sales
- **Attendees**: Browse events, purchase tickets, receive AI-powered recommendations, get outfit advice, and manage their account
- **AI Features**: Personalized event recommendations and outfit suggestions powered by Google Gemini API

## 🏗️ Architecture

The project follows a **layered MVC architecture** with:

- **Frontend**: React 19 SPA with TypeScript, Vite, and Tailwind CSS
- **Backend**: Node.js REST API with Express.js, MySQL, and Knex.js
- **Database**: MySQL 8.4 with migrations and seeds
- **AI Integration**: Google Gemini API for recommendations and advice
- **Authentication**: JWT-based authentication with refresh tokens
- **Deployment**: Docker and Docker Compose support

## 📁 Project Structure

```
ENSF-607-final-project/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── api/          # API client layer
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components (routes)
│   │   ├── context/      # React Context providers
│   │   └── hooks/        # Custom React hooks
│   ├── package.json
│   └── README.md
├── backend/              # Node.js backend API
│   ├── src/
│   │   ├── controllers/ # HTTP request handlers
│   │   ├── services/    # Business logic layer
│   │   ├── repositories/# Data access layer
│   │   ├── domain/      # Domain models
│   │   ├── routes/      # Route definitions
│   │   └── middleware/  # Express middleware
│   ├── migrations/      # Database migrations
│   ├── seeds/           # Database seeds
│   ├── package.json
│   ├── README.md
│   └── API_DOCUMENTATION.md
├── docs/                 # Project documentation
│   ├── requirements/    # Requirements document
│   ├── design/          # Design and architecture docs
│   └── diagrams/        # UML and other diagrams
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18 or higher
- **MySQL**: 8.4 or higher
- **npm**: v9 or higher
- **Docker** (optional): For containerized deployment

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   npm install -D vite @vitejs/plugin-react
   npm install -D tailwindcss @tailwindcss/postcss postcss
   
   ```
3. Create `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

   Frontend will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=event_planner
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   GEMINI_API_KEY=your_gemini_api_key
   FRONTEND_URL=http://localhost:5173
   ```

4. Set up the database:
   ```bash
   # Run migrations
   npx knex migrate:latest

   # (Optional) Run seeds
   npx knex seed:run
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

   Backend API will be available at `http://localhost:3000`

### Docker Setup (Alternative)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Start services:
   ```bash
   docker-compose up -d
   ```

   This will start both the API and MySQL database containers.

## 🛠️ Tech Stack

### Frontend
- **React**: 19.1.1
- **TypeScript**: ~5.9.3
- **Vite**: ^7.1.7
- **React Router**: ^7.9.5
- **Tailwind CSS**: ^4.1.17

### Backend
- **Node.js**: v18+
- **Express.js**: ^4.21.2
- **Knex.js**: ^3.1.0
- **MySQL**: 8.4
- **JWT**: jsonwebtoken ^9.0.2
- **bcrypt**: ^5.1.1

### AI & External Services
- **Google Gemini API**: For AI recommendations and advice
- **Mock Payment Processor**: For payment processing (can be replaced with real gateway)

### Development Tools
- **Jest**: Testing framework
- **ESLint**: Code linting
- **Docker**: Containerization

## 🔑 Key Features

### User Features
- ✅ User registration and authentication (JWT)
- ✅ Browse events with category filtering and search
- ✅ Shopping cart functionality
- ✅ Secure checkout with saved or new payment methods
- ✅ View purchased tickets with unique codes
- ✅ Manage profile and payment methods
- ✅ View transaction history
- ✅ AI-powered event recommendations
- ✅ AI-powered outfit advice

### Organizer Features
- ✅ Create and manage events
- ✅ Multiple ticket types per event
- ✅ Track ticket sales
- ✅ Validate tickets at event entry
- ✅ Request payout summaries

### System Features
- ✅ Real-time notifications (webhook-based)
- ✅ Automatic refunds on event cancellation
- ✅ Expired event cleanup scheduler
- ✅ Server-side cart management
- ✅ Stock validation and atomic operations

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:unit

# Run all integration tests
npm run test:int
```

### Frontend Tests

Frontend testing is not currently set up. Consider adding Vitest and React Testing Library for component testing.

## 🐳 Docker Deployment

### Development

```bash
cd backend
docker-compose up -d --build
```

## 🔒 Security

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **CORS**: Configured for frontend origin
- **Input Validation**: Zod schemas for request validation
- **SQL Injection Prevention**: Parameterized queries via Knex
- **Webhook Security**: Optional HMAC signatures

## 📊 Database Schema

The database includes tables for:
- Users and authentication
- Events and categories
- Ticket types and tickets
- Shopping carts and cart items
- Payments and payment methods
- Notifications
- Refresh tokens

See `backend/migrations/` for the complete schema.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Events
- `GET /api/events` - List events (with filters)
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Cart & Checkout
- `GET /api/cart` - Get cart
- `POST /api/cart/items` - Add to cart
- `PATCH /api/cart/items/:id` - Update cart item
- `POST /api/cart/checkout` - Checkout

### Tickets
- `GET /api/me/tickets` - Get user's tickets
- `GET /api/events/:eventId/tickets/validate` - Validate ticket

### AI & Advice
- `POST /api/advice` - General event planning advice
- `POST /api/advice/style` - Outfit advice
- `POST /api/recommend-event` - Event recommendations
