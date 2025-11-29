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
   ```

3. Create `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
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
   PAYMENT_API_BASE_URL=http://localhost:4000
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

## 📚 Documentation

### Frontend Documentation
- **[Frontend README](./frontend/README.md)**: Complete frontend setup, structure, and usage guide

### Backend Documentation
- **[Backend README](./backend/README.md)**: Backend setup, architecture, and development guide
- **[API Documentation](./backend/API_DOCUMENTATION.md)**: Complete API reference with all endpoints

### Project Documentation
- **[Requirements Document](./docs/requirements/requirements.md)**: Functional and non-functional requirements
- **[Design Document](./docs/design/design.md)**: Architecture and design patterns
- **[UML Diagrams](./docs/design/)**: Class and sequence diagrams

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
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Frontend Tests

Frontend testing is not currently set up. Consider adding Vitest and React Testing Library for component testing.

## 🐳 Docker Deployment

### Development

```bash
cd backend
docker-compose up -d
```

### Production

Create a `docker-compose.prod.yml` file with production configurations and:

```bash
docker-compose -f docker-compose.prod.yml up -d
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

See [API Documentation](./backend/API_DOCUMENTATION.md) for complete endpoint reference.

## 🚧 Development Roadmap

### Completed
- ✅ User authentication and authorization
- ✅ Event CRUD operations
- ✅ Shopping cart and checkout
- ✅ Payment processing
- ✅ Ticket generation and validation
- ✅ AI recommendations and advice
- ✅ Notification system

### Future Enhancements
- [ ] Email notifications
- [ ] Real-time chat support
- [ ] Advanced analytics for organizers
- [ ] Mobile app
- [ ] Social media integration
- [ ] Event reviews and ratings
- [ ] Multi-currency support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Code Style

- **Backend**: CommonJS modules, ES6+ syntax
- **Frontend**: TypeScript with strict mode
- **Linting**: ESLint configured for both frontend and backend
- **Formatting**: Consider adding Prettier for consistent formatting

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists
- Check network connectivity

### Frontend Not Connecting to Backend
- Verify backend is running on port 3000
- Check `VITE_API_BASE_URL` in frontend `.env`
- Verify CORS settings in backend

### JWT Token Issues
- Verify `JWT_SECRET` is set in backend `.env`
- Check token expiration settings
- Ensure tokens are sent in `Authorization` header

## 📄 License

See LICENSE file for details.

## 👥 Authors

- Development Team

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- Express.js and React communities
- All contributors and testers

## 📞 Support

For issues, questions, or contributions, please:
1. Check the documentation in `docs/`
2. Review existing issues
3. Create a new issue with detailed information

---

