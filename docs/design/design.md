# Design & Architecture Document

## 1. Architecture Overview

- **Style:** Layered MVC (Model-View-Controller) with Repository pattern and Domain-Driven Design (DDD) elements
- **Runtime view:** 
  - **Frontend:** Single-page application (SPA) running in browser, communicates with backend via REST API
  - **Backend API:** Express.js server handling HTTP requests, business logic in services, data access via repositories
  - **Database:** MySQL 8.4 database storing all persistent data
  - **AI Service:** Google Gemini API called asynchronously for recommendations and advice
  - **Payment Processor:** Mock payment processor (can be swapped for real payment gateway)
- **Deployment view:** 
  - Docker Compose orchestrates two containers:
    - **API container:** Node.js backend (port 3000)
    - **DB container:** MySQL 8.4 (port 3306, mapped to 3307 externally)
  - Frontend runs separately via Vite dev server (port 5173) or can be built for static hosting
  - Environment variables configure database connection, JWT secrets, API keys
- **Key Data Flows:** 
  1. **User Registration/Login:** Frontend → `POST /api/auth/register|login` → AuthController → AuthService → UserRepo → DB → JWT tokens returned
  2. **Event Browsing:** Frontend → `GET /api/events?category=X` → EventsController → EventService → EventRepo → DB → Events returned
  3. **Ticket Purchase:** Frontend → `POST /api/cart/checkout` → CartController → TicketingService → (CartService, PaymentService, MockPaymentProcessor) → DB transaction → Tickets minted
  4. **AI Recommendations:** Frontend → `POST /api/recommend-event` → Advice routes → recommend.service → EventRepo → Gemini API → Event returned

## 2. Module & Responsibility Map

- **Module/Folder:** `backend/src/controllers/` — HTTP request handling, input validation, response formatting
  - **Services:** AuthController, EventsController, UsersController, CartController, PaymentsController, TicketsController, NotificationController
  - **Responsibilities:** Parse HTTP requests, delegate to services, format JSON responses, handle errors

- **Module/Folder:** `backend/src/services/` — Business logic and orchestration
  - **Services:** AuthService, EventService, CartService, TicketingService, PaymentService, NotificationService, MockPaymentProcessor
  - **Responsibilities:** Implement business rules, coordinate between repositories, handle transactions, call external services (Gemini API, payment processor)

- **Module/Folder:** `backend/src/repositories/` — Data access layer
  - **Repositories:** UserRepo, EventRepo, CartRepo, TicketInfoRepo, PaymentRepo, PaymentInfoRepo, NotificationRepo, RefreshTokenRepo, UserCardRepo, PaymentAccountRepo
  - **Responsibilities:** Encapsulate all database queries (Knex.js), return domain objects, handle data mapping

- **Module/Folder:** `backend/src/domain/` — Domain models (rich objects)
  - **Models:** User, Event, Cart, Ticket, TicketInfo, Payment, PaymentInfo, Category, Notification
  - **Responsibilities:** Represent business entities with behavior (e.g., `Event.isActive()`, `Event.purchasable()`), hold object references instead of raw IDs

- **Module/Folder:** `backend/src/middleware/` — Cross-cutting concerns
  - **Middleware:** `auth.js` (requireAuth), `requireAuth.js` (JWT verification)
  - **Responsibilities:** Authentication/authorization, request logging (Morgan), error handling

- **Module/Folder:** `backend/src/routes/` — Route definitions
  - **Routes:** `index.js` (main API routes), `advice.routes.cjs` (AI advice), `notifications.routes.js`, `payout.routes.cjs`
  - **Responsibilities:** Map HTTP methods and paths to controller methods, apply middleware

- **Module/Folder:** `backend/src/utils/` — Utility functions
  - **Utilities:** `errors.js` (AppError class, errorMiddleware), `handler.js` (asyncHandler), `jwt.js` (token generation/verification)
  - **Responsibilities:** Reusable error handling, async wrapper, JWT operations

- **Module/Folder:** `frontend/src/api/` — API client layer
  - **API Classes:** `client.ts` (ApiClient with token refresh), `auth.ts`, `users.ts`, `events.ts`, `payments.ts`, `notifications.ts`, `advice.ts`, `categories.ts`
  - **Responsibilities:** Centralized HTTP client, automatic token refresh, type-safe API calls

- **Module/Folder:** `frontend/src/pages/` — Page components (views)
  - **Pages:** Login, Register, Events, EventPage, MyAccount, MyTickets, MyInfo, MyPaymentInfo, TransactionHistory, AdvicePage, Notifications, MyEventsPage, ValidateTicketPage
  - **Responsibilities:** UI rendering, user interaction, call API classes

- **Module/Folder:** `frontend/src/components/` — Reusable UI components
  - **Components:** Navbar, Cart, Checkout, EventBrowser, AIAdvice, PaymentInfo, Logo, SearchInput, Alert
  - **Responsibilities:** Reusable UI elements, composition

- **Module/Folder:** `frontend/src/context/` — React Context providers
  - **Context:** `AuthContext.tsx` (authentication state)
  - **Responsibilities:** Global state management for authentication

- **Module/Folder:** `frontend/src/hooks/` — Custom React hooks
  - **Hooks:** `useNotifications.ts` (notification polling)
  - **Responsibilities:** Encapsulate side effects and stateful logic

## 3. UML Diagram(s)

See `docs/design/class-diagram.puml` and `docs/design/sequence-diagram.puml` for detailed diagrams.

### 3.1 Class Diagram Summary

The class diagram shows:
- **Domain Models:** User, Event, Cart, Ticket, Payment, PaymentInfo, Category, Notification
- **Services:** AuthService, EventService, CartService, TicketingService, PaymentService, NotificationService
- **Repositories:** UserRepo, EventRepo, CartRepo, PaymentRepo, TicketInfoRepo, etc.
- **Controllers:** AuthController, EventsController, UsersController, CartController, PaymentsController, TicketsController
- **Relationships:** Services depend on Repositories, Controllers depend on Services, Repositories return Domain objects

### 3.2 Sequence Diagram Summary

The sequence diagram illustrates the ticket purchase flow:
1. User adds items to cart
2. User proceeds to checkout
3. System validates cart and stock
4. System processes payment via MockPaymentProcessor
5. System mints tickets in database transaction
6. System creates payment record
7. System clears cart
8. System sends notifications

## 4. Design Patterns Identified

### 4.1 MVC (Model-View-Controller)

**Where it appears:** 
- **Model:** `backend/src/domain/` (domain models), `backend/src/repositories/` (data access)
- **View:** `frontend/src/pages/` and `frontend/src/components/` (React components)
- **Controller:** `backend/src/controllers/` (HTTP request handlers)

**Evidence:**
- `backend/src/controllers/EventsController.js`: Handles HTTP requests, delegates to EventService
- `backend/src/services/EventService.js`: Business logic layer
- `backend/src/repositories/EventRepo.js`: Data access layer
- `frontend/src/pages/Events.tsx`: View layer

**Why appropriate:** Clear separation of concerns: controllers handle HTTP, services handle business logic, repositories handle data, views handle presentation. This makes the system maintainable and testable.

**Consequences:** 
- **Pros:** Easy to test each layer independently, clear responsibilities, scalable
- **Cons:** Some boilerplate code, potential for over-engineering simple features

**Alternatives:** Could use a more minimal approach (e.g., route handlers directly calling repositories), but MVC provides better structure for a complex application.

### 4.2 Repository Pattern

**Where it appears:** `backend/src/repositories/` directory

**Evidence:**
- `backend/src/repositories/UserRepo.js`: Encapsulates all user-related database queries
- `backend/src/repositories/EventRepo.js`: Encapsulates event queries and returns domain objects
- `backend/src/services/EventService.js`: Uses EventRepo instead of direct Knex calls (line 5)

**Why appropriate:** Isolates data access logic, makes it easy to swap databases or add caching, returns domain objects instead of raw rows.

**Consequences:**
- **Pros:** Testable (can mock repositories), database-agnostic business logic, consistent data mapping
- **Cons:** Additional abstraction layer, more files to maintain

**Alternatives:** Direct Knex calls in services, but this would couple business logic to database implementation.

### 4.3 Factory Pattern (Implicit)

**Where it appears:** Domain model constructors, service static methods

**Evidence:**
- `backend/src/domain/User.js`: `new User({ userId, name, email, role })` constructor
- `backend/src/repositories/UserRepo.js`: `new User(...)` instantiation (line 14)
- `backend/src/services/AuthService.js`: Static methods like `AuthService.register()`

**Why appropriate:** Centralizes object creation, ensures consistent object state, allows for future extension (e.g., different user types).

**Consequences:**
- **Pros:** Consistent object creation, easy to add validation
- **Cons:** Not a full factory pattern (no factory classes), but serves similar purpose

**Alternatives:** Could use a dedicated Factory class, but constructors are sufficient for current needs.

### 4.4 Strategy Pattern (Payment Processing)

**Where it appears:** `backend/src/services/MockPaymentProcessor.js` can be swapped for real payment gateway

**Evidence:**
- `backend/src/services/TicketingService.js`: Calls `MockPaymentProcessor.purchase()` (line 21)
- `backend/src/services/MockPaymentProcessor.js`: Implements payment processing interface (verifyCard, purchase, refund)

**Why appropriate:** Allows swapping payment processors without changing checkout logic. The TicketingService doesn't care about the implementation details.

**Consequences:**
- **Pros:** Easy to integrate real payment gateways (Stripe, PayPal), testable with mocks
- **Cons:** Current implementation is tightly coupled to MockPaymentProcessor (no interface/abstraction)

**Alternatives:** Could define a PaymentProcessor interface/abstract class, but current approach works for the mock scenario.

### 4.5 Singleton Pattern (Implicit - Database Connection)

**Where it appears:** Knex database connection

**Evidence:**
- `backend/src/config/db.js`: Exports a single Knex instance
- `backend/src/repositories/UserRepo.js`: `const { knex } = require('../config/db')` - shared instance

**Why appropriate:** Database connections should be shared across the application to use connection pooling efficiently.

**Consequences:**
- **Pros:** Efficient resource usage, connection pooling works correctly
- **Cons:** Global state, but necessary for database connections

**Alternatives:** Could create new connections per request, but this would be inefficient and break connection pooling.

### 4.6 Observer Pattern (Notifications)

**Where it appears:** Notification system queues notifications for later delivery

**Evidence:**
- `backend/src/services/NotificationService.js`: `queue()` method stores notifications
- `frontend/src/hooks/useNotifications.ts`: Polls for notifications (observer-like behavior)

**Why appropriate:** Decouples notification creation from delivery, allows for async processing.

**Consequences:**
- **Pros:** Non-blocking, scalable
- **Cons:** Current implementation uses polling (not true observer), but works for the use case

**Alternatives:** Could use WebSockets or Server-Sent Events for real-time notifications, but polling is simpler to implement.

## 5. SOLID Analysis

### 5.1 Single Responsibility Principle (S)

**Compliance Examples:**
- `backend/src/repositories/UserRepo.js`: Only responsible for user data access
- `backend/src/services/AuthService.js`: Only handles authentication logic (register, login)
- `backend/src/controllers/EventsController.js`: Only handles HTTP request/response for events
- `frontend/src/api/client.ts`: Only responsible for HTTP communication and token management

**Violation Examples:**
- `backend/src/services/EventService.js`: Handles multiple responsibilities (event creation, listing, deletion, expired event cleanup). Could be split into EventCreationService, EventListingService, EventCleanupService, but current size is manageable.
- `backend/src/services/TicketingService.js`: Handles cart operations, checkout, ticket minting, validation. This is acceptable as these are closely related responsibilities in the ticketing domain.

**Overall Assessment:** Generally good adherence. Some services are larger but responsibilities are related within a domain boundary.

### 5.2 Open/Closed Principle (O)

**Extension Points:**
- **Payment Processing:** `MockPaymentProcessor` can be replaced with real payment gateway without changing `TicketingService` (open for extension via strategy pattern)
- **AI Service:** `gemini.service.cjs` can be extended with new AI functions without modifying existing code
- **Repository Pattern:** New repositories can be added without modifying services (e.g., adding a CachedEventRepo wrapper)

**Evidence:**
- `backend/src/services/TicketingService.js`: Uses `MockPaymentProcessor` but doesn't depend on its implementation details (line 21)
- `backend/src/services/gemini.service.cjs`: New functions like `getOutfitAdviceChat` added without modifying existing functions

**Violations:**
- Some controllers directly instantiate services (e.g., `EventService.createEvent()`), but this is acceptable as services are stateless.

**Overall Assessment:** Good adherence. System is open for extension (new payment processors, AI functions) and closed for modification (existing code doesn't need changes).

### 5.3 Liskov Substitution Principle (L)

**Application:** Limited use of inheritance in this codebase (mostly composition). Domain models use composition (Event has User organizer, not inheritance).

**Evidence:**
- `backend/src/domain/Event.js`: Uses composition (`this.organizer = organizer` where organizer is a User instance)
- No class hierarchies that would require Liskov substitution

**Overall Assessment:** Not directly applicable (no inheritance hierarchies), but composition is used correctly.

### 5.4 Interface Segregation Principle (I)

**Application:** JavaScript doesn't have explicit interfaces, but the principle applies to function signatures and API contracts.

**Compliance Examples:**
- **Repository Methods:** Each repository has focused methods (e.g., `UserRepo.findById()`, `UserRepo.findByEmail()`) rather than a single `UserRepo.query()` method that does everything
- **API Endpoints:** RESTful endpoints are focused (e.g., `GET /api/me/tickets` vs a generic `GET /api/query?type=tickets`)

**Violations:**
- Some service methods take large option objects (e.g., `EventService.createEvent()` takes a payload with many optional fields), but this is acceptable for flexibility.

**Overall Assessment:** Good adherence. Methods and endpoints are focused and don't force clients to depend on unused functionality.

### 5.5 Dependency Inversion Principle (D)

**Compliance Examples:**
- **Services depend on Repository abstractions:** `EventService` depends on `EventRepo`, not direct database calls
- **Controllers depend on Service abstractions:** `EventsController` depends on `EventService`, not repositories
- **Frontend API classes depend on ApiClient abstraction:** All API classes use `apiClient` from `client.ts`

**Evidence:**
- `backend/src/services/EventService.js`: `const { EventRepo } = require('../repositories/EventRepo')` - depends on abstraction
- `backend/src/controllers/EventsController.js`: `const { EventService } = require('../services/EventService')` - depends on service, not repository
- `frontend/src/api/users.ts`: `import { apiClient } from './client'` - depends on client abstraction

**Violations:**
- Some services directly require specific repository implementations (e.g., `require('../repositories/UserRepo')`), but in JavaScript without interfaces, this is acceptable. The repository pattern itself provides the abstraction.

**Overall Assessment:** Good adherence. High-level modules (controllers, services) depend on abstractions (services, repositories), not concrete implementations.

## 6. Key Quality Attributes & Tactics

### 6.1 Performance

**Tactics Implemented:**
- **Database Connection Pooling:** `backend/knexfile.js` configures pool with min: 0, max: 10 connections
- **Pagination:** Ticket and event listings support pagination (`page`, `pageSize` parameters)
- **Async Operations:** AI API calls are asynchronous, don't block other requests
- **Database Indexes:** Foreign keys and unique constraints create indexes automatically

**Evidence:**
- `backend/knexfile.js`: `pool: { min: 0, max: 10 }`
- `backend/src/controllers/TicketsController.js`: Pagination parameters
- `backend/src/services/gemini.service.cjs`: Async/await for AI calls

**Gaps:**
- No caching layer (Redis, in-memory cache)
- No database query optimization visible (no EXPLAIN plans)
- No CDN for frontend assets mentioned

### 6.2 Security

**Tactics Implemented:**
- **Password Hashing:** bcrypt with salt rounds (10) - `backend/src/services/AuthService.js` line 20
- **JWT Authentication:** Short-lived access tokens (15 minutes default) + long-lived refresh tokens (30 days) in HttpOnly cookies
- **Input Validation:** Zod schemas for advice endpoints, manual validation in controllers
- **SQL Injection Prevention:** Knex.js parameterized queries (not raw SQL concatenation)
- **CORS Configuration:** Restricted to frontend origin - `backend/src/app.js` line 45-48
- **Error Message Sanitization:** `errorMiddleware` doesn't leak stack traces in production

**Evidence:**
- `backend/src/services/AuthService.js`: `bcrypt.hash(password, 10)`
- `backend/src/utils/jwt.js`: Access token TTL (lines 40-43), refresh token in HttpOnly cookie (lines 164-174)
- `backend/src/routes/advice.routes.cjs`: Zod schema validation
- `backend/src/utils/errors.js`: Error middleware

**Gaps:**
- No rate limiting visible
- No input sanitization library (e.g., DOMPurify for XSS)
- JWT secrets have weak defaults ('changeme') - should be enforced in production

### 6.3 Scalability

**Tactics Implemented:**
- **Stateless Authentication:** JWT tokens allow horizontal scaling (no server-side sessions)
- **Database Transactions:** Ensure data consistency under load
- **Docker Containerization:** Enables easy horizontal scaling of API containers
- **Connection Pooling:** Prevents database connection exhaustion

**Evidence:**
- `backend/src/utils/jwt.js`: Stateless JWT tokens
- `backend/src/services/TicketingService.js`: Database transactions for checkout
- `backend/docker-compose.yml`: Containerized services
- `backend/knexfile.js`: Connection pooling

**Gaps:**
- No load balancer configuration
- No message queue for async processing (notifications could use a queue)
- Single database instance (no read replicas)

### 6.4 Observability

**Tactics Implemented:**
- **Request Logging:** Morgan middleware logs all HTTP requests - `backend/src/app.js` line 55
- **Error Logging:** Error middleware logs errors before sending response
- **Health Check Endpoint:** `GET /health` for monitoring - `backend/src/app.js` line 58
- **Console Logging:** Strategic console.log statements (e.g., expired event cleanup)

**Evidence:**
- `backend/src/app.js`: Morgan middleware, health endpoint
- `backend/src/utils/errors.js`: Error logging in middleware

**Gaps:**
- No structured logging (e.g., Winston, Pino)
- No metrics collection (Prometheus, Datadog)
- No distributed tracing
- No log aggregation

### 6.5 Maintainability

**Tactics Implemented:**
- **Modular Architecture:** Clear separation into controllers, services, repositories, domain
- **Consistent Naming:** Files and classes follow conventions (Controller, Service, Repo suffixes)
- **Comprehensive Tests:** Test directory with unit and integration tests
- **Code Comments:** Inline comments explain complex logic
- **TypeScript (Frontend):** Type safety reduces bugs
- **Migration System:** Database schema versioning via Knex migrations

**Evidence:**
- `backend/src/`: Clear directory structure
- `__tests__/`: Test files for services, controllers, repositories
- `backend/migrations/`: Schema versioning
- `frontend/src/`: TypeScript files with type definitions

**Gaps:**
- No API documentation (Swagger/OpenAPI)
- Comment style inconsistencies (some files have detailed comments, others minimal)
- No code coverage requirements visible

## 7. Risks, Gaps, and Recommendations

### Risk-01: Payment Processing Security
**Description:** MockPaymentProcessor doesn't actually process payments, but in production, payment data handling must be PCI-DSS compliant.
**Impact:** High - Financial and legal risk
**Probability:** Medium (only if deployed to production without real payment gateway)
**Mitigation:** Replace MockPaymentProcessor with PCI-DSS compliant payment gateway (Stripe, PayPal) before production. Never store full card numbers, only last4 and tokens.

### Risk-02: JWT Secret Weakness
**Description:** Default JWT secrets are weak ('changeme'), and code doesn't enforce strong secrets in production.
**Impact:** High - Security breach if weak secrets are used
**Probability:** Medium (if environment variables not set properly)
**Mitigation:** Add startup validation that enforces strong JWT secrets in production. Use environment variable validation library.

### Risk-03: Database Connection Exhaustion
**Description:** Connection pool max is 10, which may be insufficient under high load.
**Impact:** Medium - Service degradation
**Probability:** Medium (depends on traffic)
**Mitigation:** Monitor connection pool usage, increase max connections based on load testing. Consider connection pool monitoring.

### Gap-01: Missing API Documentation
**Description:** No Swagger/OpenAPI documentation for API endpoints.
**Impact:** Low-Medium - Developer experience
**Recommendation:** Add Swagger/OpenAPI documentation using `swagger-jsdoc` and `swagger-ui-express`. Document all endpoints, request/response schemas, authentication requirements.

### Gap-02: No Rate Limiting
**Description:** API endpoints don't have rate limiting, vulnerable to abuse and DoS.
**Impact:** Medium - Service availability
**Recommendation:** Add rate limiting middleware (e.g., `express-rate-limit`) to all endpoints, especially authentication and AI endpoints (which may have API costs).

### Gap-03: Limited Error Handling in Frontend
**Description:** Some frontend components may not handle all error cases gracefully.
**Impact:** Low-Medium - User experience
**Recommendation:** Add global error boundary in React, consistent error handling in API client, user-friendly error messages.

### Gap-04: No Caching Strategy
**Description:** No caching for frequently accessed data (events, categories).
**Impact:** Medium - Performance under load
**Recommendation:** Add Redis cache for event listings and categories. Implement cache invalidation on event updates.

### Gap-05: Polling for Notifications
**Description:** Frontend polls for notifications every 30 seconds, inefficient.
**Impact:** Low - Resource usage
**Recommendation:** Implement WebSockets or Server-Sent Events for real-time notifications, reducing server load and improving user experience.

## 8. Evidence Index

- **Architecture Style:** `backend/src/app.js` (lines 15-26), `backend/src/routes/index.js`, `backend/src/controllers/`, `backend/src/services/`, `backend/src/repositories/`
- **MVC Pattern:** `backend/src/controllers/EventsController.js`, `backend/src/services/EventService.js`, `backend/src/repositories/EventRepo.js`, `frontend/src/pages/Events.tsx`
- **Repository Pattern:** `backend/src/repositories/UserRepo.js`, `backend/src/repositories/EventRepo.js`, `backend/src/services/EventService.js` (line 5)
- **Domain Models:** `backend/src/domain/User.js`, `backend/src/domain/Event.js`
- **JWT Authentication:** `backend/src/utils/jwt.js`, `backend/src/middleware/auth.js`
- **Password Hashing:** `backend/src/services/AuthService.js` (line 20)
- **Database Transactions:** `backend/src/services/TicketingService.js` (uses `knex.transaction`)
- **Connection Pooling:** `backend/knexfile.js`
- **Docker Deployment:** `backend/docker-compose.yml`, `backend/Dockerfile`
- **AI Integration:** `backend/src/services/gemini.service.cjs`, `backend/src/routes/advice.routes.cjs`
- **Payment Processing:** `backend/src/services/MockPaymentProcessor.js`, `backend/src/services/TicketingService.js` (line 21)
- **Frontend API Client:** `frontend/src/api/client.ts`, `frontend/src/api/users.ts`
- **React Context:** `frontend/src/context/AuthContext.tsx`
- **Error Handling:** `backend/src/utils/errors.js`, `backend/src/utils/handler.js`
- **Health Check:** `backend/src/app.js` (line 58)
- **Logging:** `backend/src/app.js` (line 55 - Morgan middleware)


