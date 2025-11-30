# Event Planner Backend API

A robust REST API for the Event Planner (MindPlanner) marketplace built with Node.js, Express.js, and MySQL. Implements a layered MVC architecture with Repository pattern and Domain-Driven Design principles.

## 🚀 Features

- **User Authentication**: JWT-based authentication with refresh tokens
- **Event Management**: Create, read, update, and delete events with ticket types
- **Shopping Cart**: Server-side cart management with stock validation
- **Payment Processing**: Integration with external payment processor (currently mocked)
- **Ticketing System**: Unique ticket code generation and validation
- **AI Integration**: Google Gemini API for event recommendations and outfit advice
- **Notifications**: Webhook-based notification system
- **User Management**: Profile management, payment methods, preferences
- **Real-time Features**: Server-Sent Events (SSE) for real-time updates

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **MySQL**: 8.4 or higher
- **npm**: v9 or higher

## 🛠️ Tech Stack

- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **Knex.js**: SQL query builder and migrations
- **MySQL 8.4**: Database
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing
- **Google Gemini API**: AI-powered recommendations
- **Jest**: Testing framework
- **Docker**: Containerization

## 📦 Installation

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the backend directory:
   ```env
   # Server
   PORT=3000
   NODE_ENV=development

   # Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=event_planner
   # Or use DATABASE_URL=mysql://user:password@host:port/database

   # JWT
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # Payment Processor
   PAYMENT_API_BASE_URL=http://localhost:4000

   # Notifications
   NOTIFY_WEBHOOK_URL=http://localhost:5000/webhooks
   NOTIFY_WEBHOOK_SECRET=optional_hmac_secret

   # AI (Google Gemini)
   GEMINI_API_KEY=your_gemini_api_key

   # Frontend
   FRONTEND_URL=http://localhost:5173

   # Scheduler
   INTERVAL_MS=60000
   ```

4. **Set up the database**:
   ```bash
   # Run migrations
   npx knex migrate:latest

   # (Optional) Run seeds
   npx knex seed:run
   ```

## 🏃 Development

### Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

### Start Production Server

```bash
npm start
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:int

# Run tests with coverage
npm run test:coverage
```

### Database Migrations

```bash
# Run pending migrations
npm run migrate

# Rollback last migration
npm run rollback

# Run seeds
npm run seed
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start services (API + Database)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Build Docker Image

```bash
docker build -t event-planner-api .
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js              # Express app setup
│   ├── server.js           # Server entry point
│   ├── config/             # Configuration files
│   │   └── db.js           # Database configuration
│   ├── controllers/        # HTTP request handlers
│   │   ├── AuthController.js
│   │   ├── EventsController.js
│   │   ├── UsersController.js
│   │   ├── CartController.js
│   │   ├── PaymentsController.js
│   │   ├── TicketsController.js
│   │   ├── NotificationController.js
│   │   └── CategoryController.js
│   ├── services/           # Business logic layer
│   │   ├── AuthService.js
│   │   ├── EventService.js
│   │   ├── CartService.js
│   │   ├── TicketingService.js
│   │   ├── PaymentService.js
│   │   ├── NotificationService.js
│   │   ├── gemini.service.cjs
│   │   ├── recommend.service.cjs
│   │   └── MockPaymentProcessor.js
│   ├── repositories/       # Data access layer
│   │   ├── UserRepo.js
│   │   ├── EventRepo.js
│   │   ├── CartRepo.js
│   │   ├── TicketRepo.js
│   │   ├── PaymentRepo.js
│   │   └── ...
│   ├── domain/             # Domain models
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Cart.js
│   │   ├── Ticket.js
│   │   └── ...
│   ├── routes/             # Route definitions
│   │   ├── index.js        # Main API routes
│   │   ├── advice.routes.cjs
│   │   └── payout.routes.cjs
│   ├── middleware/         # Express middleware
│   │   ├── auth.js
│   │   └── requireAuth.js
│   ├── utils/              # Utility functions
│   │   ├── jwt.js
│   │   ├── errors.js
│   │   └── handler.js
│   └── db/                 # Database connection
│       └── knex.js
├── migrations/             # Database migrations
├── seeds/                  # Database seeds
├── __tests__/              # Test files
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Docker image definition
├── knexfile.js             # Knex configuration
└── package.json            # Dependencies and scripts
```

## 🏗️ Architecture

### Layered MVC Pattern

The backend follows a layered architecture:

1. **Controllers**: Handle HTTP requests/responses, input validation
2. **Services**: Implement business logic, orchestrate operations
3. **Repositories**: Encapsulate database queries
4. **Domain Models**: Rich domain objects with business logic

### Key Design Patterns

- **Repository Pattern**: Abstracts data access
- **Service Layer**: Encapsulates business logic
- **Domain-Driven Design**: Rich domain models
- **Dependency Injection**: Loose coupling between layers

## 🔌 API Endpoints

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API documentation.

### Quick Reference

- **Authentication**: `/api/auth/*`
- **Users**: `/api/me/*`
- **Events**: `/api/events/*`
- **Cart**: `/api/cart/*`
- **Payments**: `/api/payments/*`
- **Tickets**: `/api/tickets/*`, `/api/me/tickets`
- **Categories**: `/api/categories`
- **AI Advice**: `/api/advice/*`, `/api/recommend-event`
- **Notifications**: `/api/notifications/*`
- **Payouts**: `/api/events/:eventId/request-payout`

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login**: Get access token and refresh token
2. **Protected Routes**: Include `Authorization: Bearer <token>` header
3. **Token Refresh**: Use refresh token to get new access token
4. **Logout**: Invalidate refresh tokens

### Example Request

```bash
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer <your_jwt_token>"
```

## 🗄️ Database

### Migrations

Database schema is managed through Knex migrations:

```bash
# Create a new migration
npx knex migrate:make migration_name

# Run migrations
npx knex migrate:latest

# Rollback
npx knex migrate:rollback
```

### Seeds

Seed files populate the database with test data:

```bash
# Run all seeds
npx knex seed:run

# Run specific seed
npx knex seed:run --specific=000_test_seed.js
```


## 🤖 AI Integration

### Google Gemini API

The backend integrates with Google Gemini API for:

- **Event Recommendations**: Personalized event suggestions
- **Outfit Advice**: AI-powered outfit recommendations
- **Event Planning Advice**: General event planning guidance

Set `GEMINI_API_KEY` in your `.env` file.

## 🧪 Testing

### Test Structure

- **Unit Tests**: Test individual functions/services
- **Integration Tests**: Test API endpoints with database
- **Test Setup**: `__tests__/setup/jest.setup.js`

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 🔒 Security

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Signed with secret keys
- **CORS**: Configured for frontend origin
- **Input Validation**: Zod schemas for request validation
- **SQL Injection**: Prevented via Knex parameterized queries
- **Webhook Security**: Optional HMAC signatures

## 📊 Business Rules

- **Event Stock**: Cannot reduce ticket stock, only increase
- **Ticket Purchase**: Events must be active and have available stock
- **Ticket Codes**: Unique 6-digit codes generated for each ticket
- **Event Deletion**: Automatically refunds all payments and sends notifications
- **Payment Methods**: Only non-sensitive data stored (last4, expiry, etc.)

## 🐛 Troubleshooting

### Database Connection Issues

1. Verify MySQL is running
2. Check database credentials in `.env`
3. Ensure database exists
4. Check network connectivity

### JWT Token Issues

1. Verify `JWT_SECRET` is set
2. Check token expiration settings
3. Ensure tokens are sent in `Authorization` header

### Payment Processor Issues

1. Verify `PAYMENT_API_BASE_URL` is correct
2. Check payment processor is running (if using mock)
3. Review payment logs

## 📝 Environment Variables

See the Installation section for required environment variables. All sensitive values should be kept secure and never committed to version control.

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Configure production database
- [ ] Set up proper CORS origins
- [ ] Configure webhook URLs
- [ ] Set up monitoring and logging
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up database backups

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com)
- [Knex.js Documentation](https://knexjs.org)
- [JWT Documentation](https://jwt.io)
- [MySQL Documentation](https://dev.mysql.com/doc)

## 🤝 Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Update documentation
4. Follow the coding standards

## 📄 License

See the project root LICENSE file for details.
