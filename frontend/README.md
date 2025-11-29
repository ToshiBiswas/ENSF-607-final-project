# Event Planner Frontend

A modern, responsive React application for the Event Planner (MindPlanner) marketplace. Built with React 19, TypeScript, Vite, and Tailwind CSS 4.

## 🚀 Features

- **User Authentication**: Secure login and registration with JWT token management
- **Event Browsing**: Browse events with category filtering and search
- **Shopping Cart**: Add tickets to cart and manage quantities
- **Checkout**: Secure checkout with saved or new payment methods
- **Account Management**: 
  - View and manage profile information
  - Manage saved payment methods
  - View purchased tickets
  - View transaction history
  - Manage created events (for organizers)
- **AI Features**:
  - AI-powered event recommendations
  - Outfit advice for events
- **Ticket Validation**: Organizers can validate tickets at event entry
- **Real-time Notifications**: Polling-based notification system

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher (or yarn/pnpm)

## 🛠️ Tech Stack

- **React**: 19.1.1
- **TypeScript**: ~5.9.3
- **Vite**: ^7.1.7 (Build tool and dev server)
- **React Router**: ^7.9.5 (Client-side routing)
- **Tailwind CSS**: ^4.1.17 (Utility-first CSS framework)
- **ESLint**: ^9.36.0 (Code linting)

## 📦 Installation

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## 🏃 Development

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

### Build for Production

```bash
npm run build
```

This will:
- Type-check the codebase (`tsc -b`)
- Build optimized production assets (`vite build`)
- Output files to the `dist/` directory

### Preview Production Build

```bash
npm run preview
```

### Lint Code

```bash
npm run lint
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/              # API client layer
│   │   ├── client.ts     # Base API client with token refresh
│   │   ├── auth.ts       # Authentication API calls
│   │   ├── users.ts      # User profile API calls
│   │   ├── events.ts     # Events API calls
│   │   ├── payments.ts   # Payment API calls
│   │   ├── notifications.ts  # Notifications API calls
│   │   ├── advice.ts     # AI advice API calls
│   │   └── categories.ts # Categories API calls
│   ├── components/       # Reusable UI components
│   │   ├── Navbar.tsx    # Navigation bar
│   │   ├── Cart.tsx      # Shopping cart component
│   │   ├── Checkout.tsx  # Checkout flow
│   │   ├── EventBrowser.tsx  # Event browsing with filters
│   │   ├── AIAdvice.tsx  # AI advice component
│   │   ├── PaymentInfo.tsx   # Payment info management
│   │   └── common/       # Common UI components (Alert, etc.)
│   ├── pages/            # Page components (routes)
│   │   ├── Login.tsx     # Login page
│   │   ├── Register.tsx  # Registration page
│   │   ├── Events.tsx    # Events listing page
│   │   ├── EventPage.tsx # Individual event details
│   │   ├── MyAccount.tsx # Account dashboard
│   │   ├── MyTickets.tsx # User's purchased tickets
│   │   ├── MyInfo.tsx    # Profile management
│   │   ├── MyPaymentInfo.tsx  # Payment methods
│   │   ├── TransactionHistory.tsx  # Purchase history
│   │   ├── AdvicePage.tsx  # AI recommendations
│   │   ├── ValidateTicketPage.tsx  # Ticket validation (organizers)
│   │   └── MyEventsPage.tsx  # Organizer's events
│   ├── context/          # React Context providers
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── hooks/            # Custom React hooks
│   │   └── useNotifications.ts  # Notification polling hook
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main app component with routing
│   └── main.tsx          # Application entry point
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── package.json          # Dependencies and scripts
```

## 🔌 API Integration

The frontend communicates with the backend API through a centralized API client (`src/api/client.ts`). The client handles:

- **Automatic token refresh**: Refreshes JWT tokens when they expire
- **Request/response interceptors**: Adds authentication headers
- **Error handling**: Centralized error handling for API calls

### API Client Usage

```typescript
import { apiClient } from './api/client';

// Make authenticated requests
const response = await apiClient.get('/api/me');
```

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## 🎨 Styling

The project uses **Tailwind CSS 4** for styling. Tailwind is configured via `tailwind.config.js` and integrated with Vite.

### Customization

- Modify `tailwind.config.js` to customize theme, colors, and utilities
- Global styles are in `src/index.css`
- Component-specific styles can be added as CSS modules or inline with Tailwind classes

## 🧭 Routing

Routes are defined in `src/App.tsx` using React Router:

- `/` - Events listing (default)
- `/login` - Login page
- `/register` - Registration page
- `/events` - Events listing
- `/events/:id` - Event details
- `/cart` - Shopping cart
- `/checkout` - Checkout flow
- `/MyAccount` - Account dashboard (nested routes)
  - `/MyAccount/MyTickets` - User's tickets
  - `/MyAccount/MyInfo` - Profile management
  - `/MyAccount/MyPaymentInfo` - Payment methods
  - `/MyAccount/TransactionHistory` - Purchase history
  - `/MyAccount/MyEvents` - Organizer's events
- `/advice` - AI recommendations
- `/events/:eventId/validate` - Ticket validation (organizers)

## 🔐 Authentication

Authentication is managed through `AuthContext` which provides:

- `user`: Current user object
- `token`: JWT access token
- `login(email, password)`: Login function
- `register(name, email, password)`: Registration function
- `logout()`: Logout function
- `isAuthenticated`: Boolean indicating auth status

### Protected Routes

Routes that require authentication are protected by checking `isAuthenticated` in the `AuthContext`.

## 📱 Features in Detail

### Event Browsing
- Filter events by category
- Search events by title/description
- View event details including ticket types and pricing
- Pagination support

### Shopping Cart
- Add/remove ticket types
- Update quantities
- View cart total
- Persistent cart (server-side)

### Checkout
- Use saved payment methods
- Add new payment method
- Secure card verification
- Automatic ticket generation upon successful payment

### Account Management
- Update profile information (name, email)
- Manage payment methods (add, delete, set primary)
- View all purchased tickets with unique codes
- View transaction history
- For organizers: create, update, and manage events

### AI Features
- **Event Recommendations**: Get personalized event recommendations based on preferences
- **Outfit Advice**: Receive AI-powered outfit suggestions for events

### Notifications
- Real-time notification polling
- Mark notifications as read
- Display notifications in the UI

## 🧪 Testing

Currently, the frontend does not include automated tests. To add testing:

1. Install testing dependencies (e.g., Vitest, React Testing Library)
2. Create test files alongside components
3. Add test scripts to `package.json`

## 🐛 Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically try the next available port. You can also specify a port:

```bash
npm run dev -- --port 3001
```

### Build Errors

If you encounter TypeScript errors during build:

1. Check `tsconfig.json` configuration
2. Ensure all types are properly imported
3. Run `npm run lint` to identify issues

### API Connection Issues

1. Ensure the backend server is running on `http://localhost:3000`
2. Check `VITE_API_BASE_URL` in `.env` file
3. Verify CORS settings in the backend

## 📝 Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with React and TypeScript rules
- **Formatting**: Consider adding Prettier for consistent code formatting

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The `dist/` directory contains the production-ready static files.

### Deployment Options

- **Static Hosting**: Deploy `dist/` to services like:
  - Vercel
  - Netlify
  - AWS S3 + CloudFront
  - GitHub Pages
- **Docker**: Create a Dockerfile to serve the static files with nginx

### Environment Variables

Ensure production environment variables are set:
- `VITE_API_BASE_URL`: Backend API URL

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Router Documentation](https://reactrouter.com)

## 🤝 Contributing

1. Follow the existing code style
2. Ensure TypeScript types are properly defined
3. Test your changes thoroughly
4. Update documentation as needed

## 📄 License

See the project root LICENSE file for details.
