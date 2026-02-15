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
- **Onboarding Gate**: New users complete a multi-step onboarding flow (emotions → duration → support → factors → **auth → paywall** → reminder) before accessing the main app
- **Auth Before Payment**: Users must authenticate BEFORE selecting a payment plan (simplified Dec 2025)
- **Completion Tracking**: `termsAcceptedAt` timestamp stored per-user indicates onboarding completion

### Payment Flow (Updated Dec 2025)
All payments require authenticated users - no anonymous payments:

1. **Auth-First Payment**:
   - User completes onboarding steps up to authentication
   - User signs in/up with email or anonymously (gets real Supabase user ID)
   - User then selects a subscription plan on paywall
   - Backend requires authenticated userId for all payment initiation
   - No claim logic needed - subscription is directly linked to real user ID

### Key Data Models
- **MoodEntry**: Contains mood label, triggers, timestamp, notes, and unique ID
- **TrackedFactor**: User-selected lifestyle factors (caffeine, alcohol, exercise, etc.) with daily counts
- **DailyFactorCounts**: Nested object keyed by date and factor ID for tracking factor values per day

### Subscription System
- **Trial Period**: 7-day free trial from first visit
- **Plans**: Monthly (R49), Annual (R349), Lifetime (R999) subscription tiers
- **Payment Provider**: Paystack (South African payment gateway)
- **Feature Gating**: Confidence levels for insights are restricted based on subscription status

### Paystack Payment Integration (Dec 2025)
The app uses Paystack for South African payment processing with a secure server-side implementation:

1. **Security Model**:
   - Server generates all transaction references (format: HFCHK-<timestamp>-<random>)
   - Server controls pricing via PLAN_PRICES constant (stored in kobo: 100 kobo = R1)
   - Mandatory HMAC SHA512 signature verification on all Paystack webhooks
   - Rejects webhooks without valid signatures (400 response)

2. **Database Tables** (PostgreSQL):
   - `payments`: transaction_reference (unique), user_id, plan, amount, status, verified_at
   - `subscriptions`: user_id (unique), plan, is_active, activated_at, expires_at, payment_id
   - `trials`: user_id (unique), started_at, expires_at (started_at + 7 days), is_active

3. **Subscription Expiry Logic** (Dec 2025):
   - Lifetime subscriptions: expires_at = null (never expire)
   - Annual subscriptions: expires_at = activation date + 365 days
   - Monthly subscriptions: expires_at = activation date + 30 days
   - Backend auto-expires subscriptions when checking access (sets is_active=false if expired)

4. **Payment Flow**:
   - Client calls `/api/paystack/initiate` with userId and plan only
   - Server creates payment record and calls Paystack API to initialize transaction
   - Client redirects to Paystack's authorization_url (simple redirect, no form POST)
   - Paystack calls `/api/paystack/webhook` with signed callback
   - Server verifies HMAC signature BEFORE any state changes
   - Server updates payment status and activates subscription
   - Client returns to callback_url and verifies payment via `/api/paystack/verify`

5. **Environment Variables Required**:
   - `PAYSTACK_SECRET_KEY`: Secret key from Paystack dashboard (starts with sk_)

6. **API Endpoints**:
   - `POST /api/paystack/initiate` - Creates payment and returns Paystack authorization URL
   - `POST /api/paystack/webhook` - Receives Paystack webhooks (signature-verified)
   - `POST /api/paystack/verify` - Verifies payment status with Paystack API
   - `GET /api/paystack/subscription/:userId` - Check user's active subscription and trial status
   - `POST /api/paystack/trial/start` - Start a 7-day free trial for a user

7. **Testing Paystack Payments**:
   - Use Paystack test secret key (starts with sk_test_)
   - Test cards available in Paystack documentation
   - Test flow: Paywall → Select plan → Paystack checkout → Success page
   - Verify subscription activated: Check `subscriptions` table in database
   - Test restore: Click "Restore purchases" on paywall to sync from server

8. **Subscription Sync on Login** (Dec 2025):
   - Every login triggers `syncSubscriptionFromBackend()` to check backend status
   - Runs on `SIGNED_IN` and `TOKEN_REFRESHED` auth events
   - Also runs on `getSession()` for returning users with existing sessions
   - Prevents reliance on potentially stale localStorage cache
   - Ensures expired subscriptions are immediately reflected on the frontend

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

### Onboarding Skip Logic (Fixed Dec 2025)
Existing users with active subscriptions or trials skip onboarding automatically:

1. **Access Check on Index**: Index.tsx checks both `termsAcceptedAt` AND subscription/trial status
2. **Subscription Hook Reactivity**: `useSubscription` accepts userId parameter and refreshes subscription status
3. **Backend as Source of Truth**: Subscription/trial check calls backend `/api/paystack/subscription/:userId`
4. **Trial = Active Access**: Users on active free trial are treated as having access (backend returns `hasActiveAccess=true`)
5. **No Auto-Trial Creation**: Trials are only created when user explicitly starts one via paywall; no client-side fallback
6. **Auto-Complete Onboarding**: If user has active access but no termsAcceptedAt, it's set automatically
7. **Redirect to Journal**: Users with active subscription OR active trial go directly to /home

### Free Trial Visibility Logic (Fixed Dec 2025)
The Free Trial option on the Paywall follows strict eligibility rules:

1. **Eligibility States**: `hasEverUsedTrial` is a tri-state: `null` (unknown), `false` (eligible), `true` (ineligible)
2. **No User ID**: When no user ID exists (pre-auth), all subscription state is reset and hasEverUsedTrial=false → Free Trial VISIBLE
3. **User ID Changes**: When user ID changes, hasEverUsedTrial resets to null → Free Trial HIDDEN until backend confirms
4. **Backend Confirmation**: After backend check, hasEverUsedTrial is set based on `hasTrial` response
5. **Show Free Trial**: Only when `!isSubscribed && hasEverUsedTrial === false`
6. **Hide Free Trial**: When hasEverUsedTrial is null (loading/unknown) or true (trial already used)
7. **Trial Start**: When user clicks Free Trial, frontend calls `/api/paystack/trial/start` to create trial record
8. **Error Handling**: Network failures default to hiding trial (safe) and show error if user tries to start expired trial

## External Dependencies

### Authentication & Backend
- **Supabase**: Authentication (email, anonymous), with potential for database storage (currently localStorage-focused)

### Mobile Capabilities (iOS via Capacitor - Jan 2026)
- **Capacitor**: Native mobile app wrapper for iOS distribution
  - **App ID**: `com.knightleeron.state`
  - **App Name**: `STATE`
  - **Web Dir**: `dist` (Vite production build output)
  - **Config**: `capacitor.config.ts` in project root
  - **iOS Project**: `ios/` folder with Xcode project
  - **Build & Sync Flow** (on macOS):
    1. `npm install`
    2. `npm run build`
    3. `npx cap sync`
    4. `npx cap open ios` (opens Xcode)
    5. Set signing team and bundle ID in Xcode
    6. Archive and upload to App Store Connect

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