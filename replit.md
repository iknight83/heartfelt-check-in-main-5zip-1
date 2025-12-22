# Heartfelt Check-In

## Overview

Heartfelt Check-In is a mood tracking and emotional wellness application built with React and TypeScript. The app helps users log daily emotional check-ins, track lifestyle factors that may influence their mood, and discover patterns in their emotional data over time. It features a guided onboarding flow, anonymous or email-based authentication via Supabase, and a subscription/trial system for premium insights.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: React Router v6 for client-side navigation
- **State Management**: React hooks with localStorage for persistence; React Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS custom properties for theming (dark mode by default)

### Data Persistence Strategy
- **Primary Storage**: localStorage with user-scoped keys (format: `{key}__{userId}`)
- **User Isolation**: All mood data, factor counts, and settings are keyed by user ID to support multi-user scenarios
- **Anonymous Users**: Generate a session-based anonymous ID stored locally; all data is intentionally cleared on sign-out
- **Data Migration**: On authentication, pending onboarding data is migrated from global keys to user-scoped keys

### Authentication Flow
- **Provider**: Supabase Auth (email/password and anonymous authentication)
- **Anonymous Mode**: Users can use the app without an account; data persists only for the current session
- **Onboarding Gate**: New users must complete a multi-step onboarding flow (emotions → duration → support → factors → auth → reminder → paywall) before accessing the main app
- **Completion Tracking**: `termsAcceptedAt` timestamp stored per-user indicates onboarding completion

### Key Data Models
- **MoodEntry**: Contains mood label, triggers, timestamp, notes, and unique ID
- **TrackedFactor**: User-selected lifestyle factors (caffeine, alcohol, exercise, etc.) with daily counts
- **DailyFactorCounts**: Nested object keyed by date and factor ID for tracking factor values per day

### Subscription System
- **Trial Period**: 7-day free trial from first visit
- **Plans**: Monthly (R49), Annual (R349), Lifetime (R999) subscription tiers
- **Payment Provider**: Ozow (South African payment gateway)
- **Feature Gating**: Confidence levels for insights are restricted based on subscription status

### Ozow Payment Integration (Dec 2025)
The app uses Ozow for South African payment processing with a secure server-side implementation:

1. **Security Model**:
   - Server generates all transaction references (no client-supplied identifiers)
   - Server controls pricing via PLAN_PRICES constant
   - Mandatory SHA512 hash verification on all Ozow callbacks
   - Rejects callbacks without valid signatures (403 response)
   - Rejects callbacks for unknown transactions (404 response)

2. **Database Tables** (PostgreSQL):
   - `payments`: transaction_reference (unique), user_id, plan, amount, status, ozow_transaction_id, verified_at
   - `subscriptions`: user_id (unique), plan, is_active, activated_at, payment_id

3. **Payment Flow**:
   - Client calls `/api/ozow/initiate` with userId and plan only
   - Server creates payment record with server-generated reference and pricing
   - Client redirects to Ozow via form POST
   - Ozow calls `/api/ozow/notify` with signed callback
   - Server verifies hash BEFORE any state changes
   - Server updates payment status and activates subscription
   - Client polls `/api/ozow/confirm-payment` with retry logic

4. **Environment Variables Required**:
   - `OZOW_SITE_CODE`: Merchant site code
   - `OZOW_API_KEY`: API key for authentication
   - `OZOW_PRIVATE_KEY`: Private key for hash verification

5. **API Endpoints**:
   - `POST /api/ozow/initiate` - Creates payment and returns Ozow form data
   - `POST /api/ozow/notify` - Receives Ozow callbacks (hash-verified)
   - `POST /api/ozow/confirm-payment` - Frontend polls for payment status
   - `GET /api/ozow/subscription/:userId` - Check user's active subscription
   - `GET /api/ozow/verify/:transactionReference` - Verify payment status

6. **Testing Ozow Payments**:
   - Enable test mode: `IsTest: true` in payment data (automatic in dev)
   - Use Ozow test credentials from your Ozow dashboard
   - Test flow: Paywall → Select plan → Ozow checkout → Success/Cancel/Error page
   - Verify subscription activated: Check `subscriptions` table in database
   - Test restore: Click "Restore purchases" on paywall to sync from server

### Data Persistence Implementation (Fixed Dec 2025)
The app now uses a robust data migration pattern:

1. **User-Isolated Storage**: All data uses keys in format `{key}__{userId}` for proper isolation
2. **Data Migration**: `migratePendingDataToUser()` migrates global keys to user-scoped keys on auth:
   - Runs in `onAuthStateChange` listener (for new sign-ins)
   - Runs in `getSession()` resolution (for returning users with existing sessions)
   - Runs in `signInAnonymously()` (for anonymous users after Supabase provides user ID)
3. **Anonymous Users**: Sign-out clears ALL data including termsAcceptedAt
4. **Email Users**: Sign-out preserves termsAcceptedAt so they skip onboarding on return
5. **Legacy Support**: Index.tsx checks both user-scoped and global termsAcceptedAt keys for backwards compatibility

## External Dependencies

### Authentication & Backend
- **Supabase**: Authentication (email, anonymous), with potential for database storage (currently localStorage-focused)

### Mobile Capabilities
- **Capacitor**: Native mobile app wrapper with local notifications plugin for reminder functionality

### UI Libraries
- **Radix UI**: Accessible, unstyled component primitives (dialog, popover, dropdown, tabs, etc.)
- **shadcn/ui**: Pre-built component configurations using Radix + Tailwind
- **Lucide React**: Icon library
- **date-fns**: Date manipulation and formatting
- **Embla Carousel**: Carousel/slider functionality

### Development Tools
- **Vite**: Build tool and dev server (port 5000)
- **TypeScript**: Type safety with relaxed strictness settings
- **ESLint**: Code linting with React hooks and refresh plugins
- **lovable-tagger**: Development component tagging (Lovable platform integration)