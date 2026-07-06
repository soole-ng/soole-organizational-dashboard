# Soole Operator Dashboard

A comprehensive fleet management and transportation operations dashboard for transport companies using the Soole platform.

## 🚀 Features

### Dashboard Home
- Real-time fleet metrics (trips today, bookings, revenue)
- Wallet balance and transaction overview
- Upcoming trips widget
- Quick statistics (drivers, vehicles, seats, ratings)

### Fleet Management
- **Drivers**: List, invite, detail view, update, suspend
- **Vehicles**: List, add, detail view, documents, maintenance history, fuel records

### Trip Management
- Create and schedule trips
- Track trip status (scheduled → boarding → in_progress → completed)
- Manage passengers (boarding, refunds)
- Real-time tracking with live map
- Trip comments and notes

### Money & Payouts
- Wallet balance and transaction history
- Instant withdrawal to bank accounts
- Payout history and weekly revenue charts
- Commission breakdown

### Team Management
- Invite team members via SMS OTP
- Manage team member roles (owner, admin, dispatcher, finance, manager)
- Remove team members with security confirmation
- View pending and active team members

### Organization Approval
- Track organization approval status (pending/approved/rejected)
- Awaiting admin review workflow
- Admin dashboard for approvals (Django admin)

### Settings & Configuration
- Business profile (name, logo, contact info)
- Bank account management
- Alert settings and speed limits
- Notification preferences
- Security settings with password and security questions

### Reports & Analytics
- Trip reports with filters
- Driver performance analytics
- Vehicle performance tracking
- Revenue reports and charts
- Route profitability analysis

### Live Tracking
- Real-time vehicle locations on map
- Trip tracking with ETA
- Speed and heading data
- WebSocket-based live updates

## 📋 API Endpoints

**Total: 59 endpoints**
- ✅ 51 fully implemented
- 🟡 8 in PR #98 (organization setup & team management)
- 🔲 2 queued (AI Assistant - Phase 2)

### Categories:
- Authentication (2 endpoints)
- Organization Signup (1 endpoint)
- Dashboard/Home (3 endpoints)
- Fleet - Drivers (5 endpoints)
- Fleet - Vehicles (7 endpoints)
- Trips (11 endpoints)
- Money & Payouts (5 endpoints)
- Settings & Organization (11 endpoints)
- Notifications & Alerts (4 endpoints)
- Reports & Analytics (5 endpoints)
- Live Tracking & Maps (3 endpoints + WebSocket)
- AI Assistant (2 endpoints - queued)

See `ENDPOINT_AUDIT_CHECKLIST.md` for complete mapping.

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API
- **Routing**: React Router
- **Maps**: Leaflet
- **Notifications**: React Hot Toast
- **Build**: Vite

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏃 Running the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app in your browser.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (TopBar, Sidebar, etc)
│   ├── ui/            # UI elements (buttons, inputs, etc)
│   └── auth/          # Authentication components
├── pages/             # Page components
│   ├── Home/          # Dashboard home
│   ├── Fleet/         # Drivers and vehicles
│   ├── Trips/         # Trip management
│   ├── Money/         # Finance
│   ├── Settings/      # Organization settings
│   ├── Reports/       # Analytics
│   ├── LiveMap/       # Real-time tracking
│   └── Auth/          # Authentication flows
├── lib/               # Utilities and contexts
│   ├── useMockData.ts # Mock data generator
│   └── OrgContext.tsx # Organization context
├── App.tsx            # Main app component
└── main.tsx           # Entry point
```

## 🔐 Security

- JWT Bearer token authentication
- Security questions for sensitive operations
- Password + OTP verification for withdrawal
- Role-based access control (RBAC)
- Secure team member removal with confirmation

## 📊 Data

The dashboard uses mock data generated via `useMockData()` hook for development. Replace with real API calls for production.

## 🧪 Testing

```bash
npm run test        # Run tests
npm run test:watch  # Watch mode
```

## 🚢 Deployment

The application is deployed on **Vercel**. 

```bash
npm run build
vercel deploy
```

## 📚 Backend Integration

### Available APIs:
- Organization signup: `POST /auth/signup-organization/`
- Team member invitations: `POST /organization/members/invite-with-otp/`
- Join organization: `POST /auth/join-organization/`
- Approval status: `GET /organization/approval-status/`
- Admin endpoints: `/admin/pending/`, `/organizations/{id}/approve/`, etc.

See `BACKEND_API_IMPLEMENTATION.md` for complete API specifications.

### Backend Repository:
- **Repo**: https://github.com/soole-ng/soole-backend
- **Status**: PR #98 in review (8 new endpoints)
- **Framework**: Django + Django Ninja

## 🔄 Contributing

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Make changes and test locally
3. Commit: `git commit -m "feat: description"`
4. Push: `git push origin feature/feature-name`
5. Create Pull Request on GitHub

## 📝 Git Guidelines

- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- Keep commits focused on a single feature/fix
- Write clear commit messages
- Push to feature branches, not main

## 🐛 Debugging

### Development Tools:
- React DevTools extension for Chrome/Firefox
- Redux DevTools (if using Redux)
- Network tab for API debugging
- Mock data can be toggled via `useMockData()` hook

### Common Issues:
- **Token not persisting**: Check localStorage in DevTools
- **API calls failing**: Verify backend is running and token is valid
- **Mock data showing instead of real data**: Check `useMockData()` in components

## 📞 Support

For issues or questions:
- Check existing GitHub issues
- Create a new issue with detailed reproduction steps
- Contact the development team on Slack

## 📄 License

© 2026 Soole. All rights reserved.

---

**Last Updated**: 2026-06-30  
**Dashboard Version**: 1.0.0  
**Backend API Version**: v1
