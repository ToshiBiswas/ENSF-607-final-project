# Requirements Document

## 1. Project Overview

- **System name:** Event Planner (MindPlanner)
- **Tech stack:** 
  - Backend: Node.js, Express.js, Knex.js, MySQL 8.4, JWT authentication
  - Frontend: React 19, TypeScript, Vite, Tailwind CSS 4, React Router
  - AI Integration: Google Gemini API
  - Deployment: Docker, Docker Compose
  - Testing: Jest, Supertest
- **High-level goal:** A web-based event planning marketplace where organizers can create and manage events with ticket sales, and attendees can browse events, purchase tickets, receive AI-powered event recommendations and outfit advice, and manage their account information.
- **Primary user roles:** 
  - **User/Attendee:** Browse events, purchase tickets, manage profile and payment methods, view tickets and transaction history, receive AI recommendations
  - **Organizer:** Create and manage events, validate tickets at entry
  - **Admin:** System administration (role exists in schema but limited implementation)
- **Source evidence:** 
  - `backend/src/app.js` (lines 1-104): Main application setup
  - `backend/migrations/0001_create_users_table.js`: User roles enum ('user', 'admin')
  - `frontend/src/App.tsx`: Route definitions showing user flows
  - `backend/src/routes/index.js`: API endpoint definitions

## 2. Functional Requirements (≥10)

- **FR-01:** Users must be able to register and authenticate with email and password
  - Rationale: Core security and user management functionality
  - Evidence: 
    - `backend/src/controllers/AuthController.js`: `register`, `login` methods
    - `backend/src/services/AuthService.js`: Registration and login logic
    - `frontend/src/pages/Register.tsx`, `frontend/src/pages/Login.tsx`: UI components
    - `POST /api/auth/register`, `POST /api/auth/login` endpoints

- **FR-02:** Users must be able to browse events filtered by category
  - Rationale: Core discovery functionality for attendees
  - Evidence:
    - `backend/src/controllers/EventsController.js`: `listByCategory` method
    - `frontend/src/pages/Events.tsx`: Event browsing UI
    - `frontend/src/components/EventBrowser.tsx`: Category filtering component
    - `GET /api/events?category=Music` endpoint

- **FR-03:** Organizers must be able to create events with title, description, location, date/time, categories, and ticket types
  - Rationale: Core functionality for event creation
  - Evidence:
    - `backend/src/services/EventService.js`: `createEvent` method (lines 64-200+)
    - `backend/src/controllers/EventsController.js`: `create` method
    - `POST /api/events` endpoint (requires auth)
    - `backend/migrations/0004_create_events_table.js`: Event schema

- **FR-04:** Users must be able to add tickets to a shopping cart
  - Rationale: Standard e-commerce cart functionality
  - Evidence:
    - `backend/src/services/CartService.js`: Cart operations
    - `backend/src/controllers/CartController.js`: `add` method
    - `frontend/src/components/Cart.tsx`: Cart UI component
    - `POST /api/cart/items` endpoint
    - `backend/migrations/0012_create_carts_and_items_tables.js`: Cart schema

- **FR-05:** Users must be able to checkout and purchase tickets using saved or new payment methods
  - Rationale: Core transaction functionality
  - Evidence:
    - `backend/src/services/TicketingService.js`: `checkout` method (lines 70-390)
    - `backend/src/controllers/CartController.js`: `checkout` method
    - `frontend/src/components/Checkout.tsx`: Checkout UI
    - `POST /api/cart/checkout` endpoint
    - `backend/src/services/MockPaymentProcessor.js`: Payment processing

- **FR-06:** Users must be able to save and manage payment methods (credit cards)
  - Rationale: Convenience for repeat purchases
  - Evidence:
    - `backend/src/controllers/PaymentsController.js`: `verifyCard` method
    - `backend/src/controllers/UsersController.js`: `paymentMethods` method
    - `frontend/src/pages/MyPaymentInfo.tsx`: Payment management UI
    - `POST /api/payments/verify-card`, `GET /api/me/payment-methods` endpoints
    - `backend/migrations/0002_create_paymentinfo_table.js`: Payment info schema

- **FR-07:** Users must be able to view their purchased tickets with unique 15-digit codes
  - Rationale: Ticket access and validation
  - Evidence:
    - `backend/src/controllers/TicketsController.js`: `getMyTickets` method
    - `frontend/src/pages/MyTicketPage.tsx`: Ticket viewing UI
    - `GET /api/me/tickets` endpoint
    - `backend/src/services/TicketingService.js`: `generateTicketCode` function (lines 26-33)

- **FR-08:** Organizers must be able to validate ticket codes for their events
  - Rationale: Entry verification at events
  - Evidence:
    - `backend/src/services/TicketingService.js`: `validateTicket` method (lines 78-120)
    - `backend/src/controllers/TicketsController.js`: `validateForEvent` method
    - `frontend/src/pages/ValidateTicketPage.tsx`: Validation UI
    - `GET /api/events/:eventId/tickets/validate?code=...` endpoint

- **FR-09:** Users must be able to receive AI-powered event recommendations based on preferences
  - Rationale: Enhanced user experience and discovery
  - Evidence:
    - `backend/src/services/gemini.service.cjs`: `getEventAdvice` function
    - `backend/src/services/recommend.service.cjs`: Event recommendation logic
    - `frontend/src/pages/AdvicePage.tsx`: Recommendation UI
    - `POST /api/advice`, `POST /api/recommend-event` endpoints

- **FR-10:** Users must be able to receive AI-powered outfit advice for events they have tickets for
  - Rationale: Value-added service for attendees
  - Evidence:
    - `backend/src/services/gemini.service.cjs`: `getOutfitAdvice` function
    - `frontend/src/pages/AdvicePage.tsx`: Outfit advice UI with chatbox
    - `POST /api/advice/style` endpoint

- **FR-11:** Users must be able to engage in conversational follow-up questions about outfit advice
  - Rationale: Enhanced AI interaction
  - Evidence:
    - `backend/src/services/gemini.service.cjs`: `getOutfitAdviceChat` function
    - `backend/src/routes/advice.routes.cjs`: `POST /api/advice/style/chat` endpoint
    - `frontend/src/pages/AdvicePage.tsx`: Chatbox UI component

- **FR-12:** Users must be able to view their transaction history with payment details
  - Rationale: Financial transparency and record-keeping
  - Evidence:
    - `backend/src/repositories/PaymentRepo.js`: `findByUserId` method
    - `backend/src/controllers/PaymentsController.js`: `listMyPayments` method
    - `frontend/src/pages/TransactionHistory.tsx`: Transaction history UI
    - `GET /api/payments` endpoint

- **FR-13:** Organizers must be able to view all events they have created
  - Rationale: Event management dashboard
  - Evidence:
    - `backend/src/services/EventService.js`: `listMine` method (lines 57-63)
    - `backend/src/controllers/EventsController.js`: `listMine` method
    - `frontend/src/pages/MyEventsPage.tsx`: My Events UI
    - `GET /api/user/events` endpoint

- **FR-14:** Users must be able to update their profile information (name, email)
  - Rationale: Account management
  - Evidence:
    - `backend/src/controllers/UsersController.js`: `updateProfile` method
    - `frontend/src/pages/MyInfo.tsx`: Profile editing UI
    - `PATCH /api/me` endpoint

- **FR-15:** The system must automatically delete expired events after their end time
  - Rationale: Data cleanup and system maintenance
  - Evidence:
    - `backend/src/app.js`: `startExpiredEventCleanupScheduler` function (lines 82-101)
    - `backend/src/services/EventService.js`: `settleAndDeleteExpiredEvents` method
    - Scheduled interval based on `INTERVAL_MS` environment variable

- **FR-16:** Users must be able to receive notifications for events
  - Rationale: User engagement and reminders
  - Evidence:
    - `backend/src/services/NotificationService.js`: Notification queueing
    - `backend/src/controllers/NotificationController.js`: Notification endpoints
    - `frontend/src/pages/Notifications.tsx`: Notifications UI
    - `frontend/src/hooks/useNotifications.ts`: Notification polling hook
    - `GET /api/notifications/due` endpoint

## 3. Non-Functional Requirements (≥5)

- **NFR-01 (Performance):** API responses should complete within reasonable timeframes; pagination is implemented for large datasets
  - Evidence: 
    - `backend/src/controllers/TicketsController.js`: Pagination parameters (`page`, `pageSize`)
    - `frontend/src/api/users.ts`: `getTickets` method with pagination params
    - `backend/src/app.js`: Database connection pooling (`pool: { min: 0, max: 10 }` in knexfile.js)
    - `backend/knexfile.js`: Connection pool configuration

- **NFR-02 (Security):** All sensitive operations require JWT authentication; passwords are hashed using bcrypt; refresh tokens stored in HttpOnly cookies
  - Evidence:
    - `backend/src/middleware/auth.js`: `requireAuth` middleware
    - `backend/src/utils/jwt.js`: JWT token generation and verification (lines 95-248)
    - `backend/src/services/AuthService.js`: Password hashing with bcrypt (line 20)
    - `backend/src/utils/jwt.js`: `setRefreshCookie` function with HttpOnly flag (lines 164-174)
    - `backend/src/routes/index.js`: Protected routes use `requireAuth` middleware

- **NFR-03 (Scalability/Availability):** System uses stateless JWT authentication; database transactions ensure data consistency; Docker containerization enables horizontal scaling
  - Evidence:
    - `backend/src/utils/jwt.js`: Stateless JWT tokens (no server-side session storage)
    - `backend/src/services/TicketingService.js`: Database transactions for checkout (uses `knex.transaction`)
    - `backend/docker-compose.yml`: Multi-container setup (API + DB)
    - `backend/Dockerfile`: Containerized backend application

- **NFR-04 (Reliability/Observability):** Error handling middleware centralizes error responses; health check endpoint available; logging via Morgan
  - Evidence:
    - `backend/src/utils/errors.js`: `errorMiddleware` and `AppError` class
    - `backend/src/app.js`: Health check endpoint `GET /health` (line 58)
    - `backend/src/app.js`: Morgan request logging middleware (line 55)
    - `backend/src/utils/handler.js`: `asyncHandler` wrapper for error catching

- **NFR-05 (Maintainability):** Code follows MVC architecture with clear separation of concerns; Repository pattern isolates data access; comprehensive test suite
  - Evidence:
    - `backend/src/`: Directory structure (controllers/, services/, repositories/, domain/)
    - `backend/src/repositories/UserRepo.js`: Repository pattern example
    - `__tests__/`: Test directory with service, controller, repository tests
    - `backend/jest.config.js`: Test configuration
    - `backend/src/app.js`: Architecture comments (lines 15-26)

- **NFR-06 (Data Integrity):** Database migrations ensure schema versioning; foreign key constraints enforce referential integrity; unique constraints prevent duplicates
  - Evidence:
    - `backend/migrations/`: Migration files for all tables
    - `backend/migrations/0004_create_events_table.js`: Foreign key to users table (line 6)
    - `backend/migrations/0001_create_users_table.js`: Unique constraint on email (line 6)
    - `backend/knexfile.js`: Migration configuration

## 4. User Stories

### 4.1 User Stories

- **US-01:** As an attendee, I want to register an account with my email and password so that I can access the platform and purchase tickets.
  - Acceptance Criteria:
    - Given I am on the registration page, when I enter a valid name, email, and password (≥6 characters), then my account is created and I am logged in.
    - Given I enter an email that already exists, when I submit the form, then I receive an error message.
  - Evidence: 
    - `frontend/src/pages/Register.tsx`
    - `backend/src/controllers/AuthController.js`: `register` method
    - `POST /api/auth/register`

- **US-02:** As an attendee, I want to browse events by category so that I can find events I'm interested in.
  - Acceptance Criteria:
    - Given I am on the events page, when I select a category from the filter, then I see only events in that category.
    - Given no category is selected, when I view the events page, then I see all available events.
  - Evidence:
    - `frontend/src/pages/Events.tsx`
    - `frontend/src/components/EventBrowser.tsx`
    - `GET /api/events?category=Music`

- **US-03:** As an organizer, I want to create an event with ticket types and pricing so that attendees can purchase tickets.
  - Acceptance Criteria:
    - Given I am logged in as an organizer, when I fill out the event creation form with title, description, location, dates, categories, and ticket types, then the event is created and visible to attendees.
    - Given I create an event with a duplicate title, when I submit, then I receive an error message.
  - Evidence:
    - `backend/src/services/EventService.js`: `createEvent` method
    - `POST /api/events` (requires auth)

- **US-04:** As an attendee, I want to add tickets to my cart so that I can purchase multiple tickets in one transaction.
  - Acceptance Criteria:
    - Given I am viewing an event with available tickets, when I select a ticket type and quantity and click "Add to Cart", then the tickets are added to my cart.
    - Given I try to add more tickets than are available, when I submit, then I receive an error message.
  - Evidence:
    - `frontend/src/pages/EventPage.tsx`: Add to cart functionality
    - `backend/src/services/CartService.js`
    - `POST /api/cart/items`

- **US-05:** As an attendee, I want to checkout and purchase tickets using a saved payment method so that I can complete my purchase quickly.
  - Acceptance Criteria:
    - Given I have items in my cart and a saved payment method, when I proceed to checkout and select my saved card, then my payment is processed and tickets are issued.
    - Given my payment method has insufficient funds, when I attempt checkout, then the transaction is declined.
  - Evidence:
    - `frontend/src/components/Checkout.tsx`
    - `backend/src/services/TicketingService.js`: `checkout` method
    - `backend/src/services/MockPaymentProcessor.js`: `purchase` method (balance check)

- **US-06:** As an attendee, I want to save my payment methods so that I don't have to re-enter card details for future purchases.
  - Acceptance Criteria:
    - Given I am on the payment methods page, when I enter valid card details (number, name, CCV, expiry), then the card is verified and saved to my account.
    - Given I enter an invalid cardholder name (with numbers), when I submit, then I receive a validation error.
  - Evidence:
    - `frontend/src/pages/MyPaymentInfo.tsx`: Card validation (name, expiry month/year)
    - `POST /api/payments/verify-card`
    - `GET /api/me/payment-methods`

- **US-07:** As an attendee, I want to view my purchased tickets with their unique codes so that I can access events.
  - Acceptance Criteria:
    - Given I have purchased tickets, when I navigate to "My Tickets", then I see a list of all my tickets with their 15-digit codes and event details.
    - Given I filter by event, when I select an event from the dropdown, then I see only tickets for that event.
  - Evidence:
    - `frontend/src/pages/MyTicketPage.tsx`
    - `GET /api/me/tickets` (with pagination and filters)

- **US-08:** As an organizer, I want to validate ticket codes at event entry so that I can verify attendee tickets.
  - Acceptance Criteria:
    - Given I am the organizer of an event, when I enter a 15-digit ticket code in the validation page, then I see whether the ticket is valid and its details (type, price, event info).
    - Given I enter an invalid code, when I submit, then I receive an "invalid ticket" message.
  - Evidence:
    - `frontend/src/pages/ValidateTicketPage.tsx`
    - `backend/src/services/TicketingService.js`: `validateTicket` method
    - `GET /api/events/:eventId/tickets/validate?code=...`

- **US-09:** As an attendee, I want to receive AI-powered event recommendations based on my preferences so that I can discover relevant events.
  - Acceptance Criteria:
    - Given I am on the advice page, when I describe the type of events I'm interested in, then the AI suggests a matching event from the database.
    - Given no matching event is found, when I submit my preferences, then I receive a message indicating no match was found.
  - Evidence:
    - `frontend/src/pages/AdvicePage.tsx`: Event recommendation flow
    - `POST /api/recommend-event`
    - `backend/src/services/recommend.service.cjs`

- **US-10:** As an attendee, I want to receive outfit advice for events I have tickets for so that I know what to wear.
  - Acceptance Criteria:
    - Given I have purchased tickets for an event, when I select that event and request outfit advice, then I receive AI-generated outfit recommendations with accessories, colors, and tips.
    - Given I ask a follow-up question about the advice, when I submit my question, then I receive a conversational response from the AI.
  - Evidence:
    - `frontend/src/pages/AdvicePage.tsx`: Outfit advice and chatbox
    - `POST /api/advice/style`
    - `POST /api/advice/style/chat`
    - `backend/src/services/gemini.service.cjs`: `getOutfitAdvice` and `getOutfitAdviceChat`

- **US-11:** As an attendee, I want to view my transaction history so that I can track my purchases and payments.
  - Acceptance Criteria:
    - Given I have made purchases, when I navigate to "Transaction History", then I see a list of all my transactions with amounts, dates, and event names.
    - Given I purchased tickets for multiple events in one transaction, when I view that transaction, then I see all event names listed.
  - Evidence:
    - `frontend/src/pages/TransactionHistory.tsx`
    - `backend/src/repositories/PaymentRepo.js`: `findByUserId` method (returns multiple events per payment)
    - `GET /api/payments`

- **US-12:** As an organizer, I want to view all events I have created so that I can manage them.
  - Acceptance Criteria:
    - Given I am logged in as an organizer, when I navigate to "My Events", then I see a list of all events I have created with their details.
    - Given I click on an event, when I select it, then I am taken to the event details page.
  - Evidence:
    - `frontend/src/pages/MyEventsPage.tsx`
    - `GET /api/user/events`
    - `backend/src/services/EventService.js`: `listMine` method

## 5. Open Questions / TBD

- **TBD-01:** What is the exact role-based access control (RBAC) implementation for organizers vs. regular users?
  - Why TBD: The database schema includes 'user' and 'admin' roles, but the codebase shows organizer functionality without explicit role checking in some places. Need to verify if organizers are a separate role or if any user can create events.
  - Evidence searched: 
    - `backend/migrations/0001_create_users_table.js`: Role enum shows 'user', 'admin'
    - `backend/src/domain/User.js`: Role type includes 'organizer' in JSDoc
    - `backend/src/controllers/EventsController.js`: `create` method doesn't explicitly check for organizer role

- **TBD-02:** What are the exact performance benchmarks (response time SLAs) for API endpoints?
  - Why TBD: No explicit performance requirements or benchmarks found in code or documentation.
  - Evidence searched: 
    - `backend/src/app.js`: No performance monitoring setup
    - `backend/README.md`: No performance specifications

- **TBD-03:** What is the maximum number of concurrent users the system is designed to support?
  - Why TBD: No load testing documentation or scalability targets found.
  - Evidence searched:
    - `backend/docker-compose.yml`: No scaling configuration
    - `backend/knexfile.js`: Connection pool max is 10, but no overall system capacity documented

## 6. Traceability Matrix (FR ↔ Stories/Use Cases)

| FR ID | Covered by (US IDs) |
|-------|---------------------|
| FR-01 | US-01               |
| FR-02 | US-02               |
| FR-03 | US-03               |
| FR-04 | US-04               |
| FR-05 | US-05               |
| FR-06 | US-06               |
| FR-07 | US-07               |
| FR-08 | US-08               |
| FR-09 | US-09               |
| FR-10 | US-10               |
| FR-11 | US-10               |
| FR-12 | US-11               |
| FR-13 | US-12               |
| FR-14 | (Implicit in account management) |
| FR-15 | (System-level, no direct user story) |
| FR-16 | (Notifications functionality exists but not covered in detailed user stories) |


