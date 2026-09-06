# PeerSphere - Frontend API Integration Guide

## Overview

This guide documents the frontend-backend integration for PeerSphere. The project is a **unified Next.js 16 app** (no separate `frontend/` or `backend/` directories) — API routes live under `app/api/v1/`, business logic in `lib/services/`, and the frontend talks to them via relative paths (`/api/v1/...`).

> **Note:** This guide was originally written during the migration from a separate Express backend. The hook/library examples below remain valid; the file paths have since been unified — see [MIGRATION_STATUS.md](./MIGRATION_STATUS.md) for the current layout and [UNIFIED_MIGRATION_COMPLETE.md](./UNIFIED_MIGRATION_COMPLETE.md) for the endpoint inventory.

## What Was Implemented

### 1. API Client (`frontend/src/lib/api-client.ts`)

A configured Axios instance with:
- Base URL configuration (reads from `NEXT_PUBLIC_API_URL` or defaults to `http://localhost:4000/api/v1`)
- Automatic token injection in request headers
- Automatic token refresh on 401 errors
- Request queuing during refresh to prevent race conditions
- Error handling utilities

**Key Features:**
- `apiClient`: The main Axios instance
- `clearAuth()`: Clears all auth tokens from localStorage
- `getAccessToken()`: Retrieves the access token
- `getRefreshToken()`: Retrieves the refresh token
- `getStoredUser()`: Retrieves stored user data
- `isApiError()`: Type guard for API errors
- `getErrorMessage()`: Extracts user-friendly error messages

### 2. Auth Utilities (`frontend/src/lib/auth.ts`)

Authentication functions that use the API client:

**Functions:**
- `login(email, password)`: Authenticates user and stores tokens
- `logout()`: Clears all auth data
- `refreshToken()`: Refreshes the access token
- `getCurrentUser()`: Gets the currently authenticated user
- `isAuthenticated()`: Checks if user is authenticated
- `initializeAuth()`: Initializes auth state on app load
- `getUserRole()`: Gets the user's role
- `hasRole(role)`: Checks if user has specific role
- `hasAnyRole(...roles)`: Checks if user has any of the specified roles

**Types:**
- `User`: { id: string; email: string; role: 'STUDENT' | 'PLACEMENT_ADMIN' }
- `LoginResponse`: { accessToken: string; refreshToken: string; user: User }
- `AuthState`: { user: User | null; isAuthenticated: boolean; isLoading: boolean; error: string | null }

### 3. AuthContext (`frontend/src/context/AuthContext.tsx`)

React Context for managing authentication state across the application:

**Provider:**
```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

**Hook:**
```tsx
const { user, isAuthenticated, isLoading, error, login, logout, clearError } = useAuth();
```

**Features:**
- Persists auth state across page navigation
- Automatically initializes auth state on app load
- Handles token storage in localStorage
- Provides login/logout methods
- Redirects to appropriate dashboard based on role

### 4. Custom Hooks (`frontend/src/hooks/`)

#### `useAuth.ts`
- `useAuth()`: Access the full auth context
- `useHasRole(role)`: Check if user has a specific role
- `useHasAnyRole(...roles)`: Check if user has any of the specified roles
- `useRequireAuth(redirectTo?)`: Redirect if not authenticated
- `useRequireUnauth(redirectTo?)`: Redirect if authenticated

#### `useApi.ts`
- `useApi<T>(url, options?)`: Generic API request hook with loading/error/data states
- `useGet<T>(url, params?)`: Hook for GET requests
- `usePost<T>(url)`: Hook for POST requests
- `usePut<T>(url)`: Hook for PUT requests
- `usePatch<T>(url)`: Hook for PATCH requests
- `useDelete<T>(url)`: Hook for DELETE requests
- `usePaginatedGet<T>(url, params?)`: Hook for paginated GET requests
- `useFetchOnMount<T>(url, options?)`: Automatically fetches data on mount

**Features:**
- Automatic request cancellation when unmounted
- Type-safe responses
- Loading and error state management
- Pagination support

### 5. ProtectedRoute Components (`frontend/src/components/auth/`)

Route protection components:

**`ProtectedRoute`**: Wraps children and only renders them if authenticated
```tsx
<ProtectedRoute redirectTo="/auth">
  <Dashboard />
</ProtectedRoute>
```

**`ProtectedRouteWithRole`**: Only renders if authenticated AND has the required role
```tsx
<ProtectedRouteWithRole role="PLACEMENT_ADMIN">
  <AdminPanel />
</ProtectedRouteWithRole>
```

**`GuestRoute`**: Only renders if NOT authenticated
```tsx
<GuestRoute redirectTo="/dashboard">
  <LoginPage />
</GuestRoute>
```

### 6. Updated Layouts

- **Root layout** (`app/layout.tsx`): Added AuthProvider wrapper
- **Student layout** (`app/(student)/layout.tsx`): Added role-based protection
- **Placement layout** (`app/(placement)/layout.tsx`): Added role-based protection

### 7. Updated Auth Page

The auth page (`app/auth/page.tsx`) now:
- Uses the real `login()` function from useAuth
- Redirects automatically if already authenticated
- Shows loading states properly
- Displays real API error messages
- Maintains the same beautiful UI but with real functionality

## Usage Examples

### Basic Auth Usage

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { GlassButton } from '@/components/ui/GlassButton';

export default function ProfileButton() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user.email}</p>
        <GlassButton onClick={logout}>Logout</GlassButton>
      </div>
    );
  }

  return <GlassButton onClick={() => login('email', 'password')}>Login</GlassButton>;
}
```

### API Request Example

```tsx
'use client';

import { useGet } from '@/hooks/useApi';
import { Job } from '@/types';

export default function JobList() {
  const { data: jobs, loading, error } = useGet<Job[]>('/jobs');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {jobs?.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
```

### Protected Page Example

```tsx
'use client';

import { useRequireAuth } from '@/hooks/useAuth';

export default function StudentDashboard() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      {/* Dashboard content */}
    </div>
  );
}
```

### Role-Based Protection

```tsx
'use client';

import { useHasRole } from '@/hooks/useAuth';
import { GlassCard } from '@/components/ui/GlassCard';

export default function AdminOnlyContent() {
  const isAdmin = useHasRole('PLACEMENT_ADMIN');

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <GlassCard>
      <h2>Admin Dashboard</h2>
      {/* Admin content */}
    </GlassCard>
  );
}
```

### Paginated Request Example

```tsx
'use client';

import { usePaginatedGet } from '@/hooks/useApi';
import { Job } from '@/types';

export default function JobListWithPagination() {
  const { data: jobs, loading, error, pagination, request } = usePaginatedGet<Job>('/jobs');

  const handlePageChange = (page: number) => {
    request({ page, pageSize: 10 });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {jobs?.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
      
      <div className="flex justify-center gap-2 mt-4">
        <button
          onClick={() => handlePageChange(pagination?.page - 1 || 1)}
          disabled={pagination?.page === 1}
        >
          Previous
        </button>
        <span>Page {pagination?.page}</span>
        <button
          onClick={() => handlePageChange(pagination?.page + 1 || 1)}
          disabled={!pagination?.hasNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

## File Structure (current)

```
src/
├── lib/
│   ├── api-client.ts      # Axios instance with interceptors (relative /api/v1 base)
│   ├── auth.ts            # Auth utility functions
│   └── theme-context.tsx  # Theme context (light/dark)
├── services/
│   ├── student-api.ts     # Student-facing API functions
│   └── placement-api.ts   # Placement-admin API functions
├── context/
│   └── AuthContext.tsx    # Auth state context
├── hooks/
│   ├── index.ts          # Re-exports all hooks
│   ├── useApi.ts          # API request hooks
│   └── useAuth.ts         # Auth-related hooks
├── components/
│   ├── auth/              # Route protection components
│   ├── ui/                # GlassButton, GlassCard, GlassInput, GlassDialog, ...
│   ├── product/           # JobCard, CandidateCard, MatchScore, SkillChip, ...
│   └── layout/            # AppShell, Navigation, ThemeSwitcher
├── app/
│   ├── api/v1/...         # API routes (auth, students, jobs, applications, ...)
│   ├── layout.tsx         # Root layout with AuthProvider + ToastProvider
│   ├── (student)/layout.tsx   # Student layout with role check
│   ├── (placement)/layout.tsx # Placement layout with role check
│   └── auth/page.tsx      # Login page with real API calls
└── package.json           # axios, next, react, prisma, zod, ...
```

## Environment Variables

The unified app reads the following from `.env` (project root):

```
DATABASE_URL=postgresql://peersphere:peersphere@127.0.0.1:5432/peersphere_dev
JWT_SECRET=...
JWT_REFRESH_SECRET=...
NEXT_PUBLIC_API_URL=/api/v1
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=5
```

`NEXT_PUBLIC_API_URL` defaults to `/api/v1` (same-origin, no CORS).

## Dependencies Added

- `axios` (^1.7.7) - HTTP client for API requests

## Next Steps — ✅ COMPLETE (2026-08-17)

The integration is complete and verified. To run the unified app:

1. **Start PostgreSQL** (portable instance):
   ```bash
   schtasks.exe /run /tn "PeerSpherePostgres"
   ```

2. **Seed the database** (idempotent):
   ```bash
   npm run db:seed        # tsx prisma/seed.ts
   ```

3. **Run the app**:
   ```bash
   npm install
   npm run dev            # http://localhost:3000
   ```

4. **Verify**: `npm run lint`, `npx tsc --noEmit`, then log in with the demo credentials below.

## Backend API Reference

The backend provides the following authenticated endpoints:

### Auth
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/refresh` - Refresh access token

### Students
- `GET /api/v1/students/me` - Get current student profile
- `PATCH /api/v1/students/me` - Update student profile
- `GET /api/v1/students/me/skills` - List student skills
- `POST /api/v1/students/me/skills` - Add a skill
- `DELETE /api/v1/students/me/skills/:id` - Remove a skill

### Jobs
- `GET /api/v1/jobs` - List all jobs
- `GET /api/v1/jobs/:id` - Get a specific job
- `POST /api/v1/jobs` - Create a job (PLACEMENT_ADMIN only)
- `PATCH /api/v1/jobs/:id` - Update a job (PLACEMENT_ADMIN only)
- `POST /api/v1/jobs/:id/publish` - Publish a job (PLACEMENT_ADMIN only)
- `POST /api/v1/jobs/:id/close` - Close a job (PLACEMENT_ADMIN only)

### Resumes
- `GET /api/v1/students/me/resumes` - List student resumes
- `POST /api/v1/students/me/resumes` - Upload a resume
- `DELETE /api/v1/students/me/resumes/:id` - Delete a resume
- `GET /api/v1/students/me/resumes/:id/download` - Download a resume

### Applications
- `GET /api/v1/students/me/applications` - List student applications
- `POST /api/v1/jobs/:id/apply` - Apply to a job
- `GET /api/v1/jobs/:id/applications` - List applications for a job (PLACEMENT_ADMIN only)
- `PATCH /api/v1/applications/:id` - Update application status (PLACEMENT_ADMIN only)

### Evaluations
- `POST /api/v1/evaluations/queue` - Queue an evaluation
- `GET /api/v1/evaluations/:id` - Get evaluation results
- `GET /api/v1/students/me/evaluations` - List student evaluations
- `GET /api/v1/jobs/:id/evaluations` - List evaluations for a job (PLACEMENT_ADMIN only)

### Overrides
- `POST /api/v1/evaluations/:id/override` - Create override (PLACEMENT_ADMIN only)
- `GET /api/v1/evaluations/:id/overrides` - List overrides for an evaluation (PLACEMENT_ADMIN only)

### Analytics
- `GET /api/v1/analytics/skill-gaps` - Get skill gap analysis (PLACEMENT_ADMIN only)
- `GET /api/v1/analytics/placement-stats` - Get placement statistics (PLACEMENT_ADMIN only)
- `GET /api/v1/reports` - List available reports (PLACEMENT_ADMIN only)
- `GET /api/v1/audit-log` - Get audit log (PLACEMENT_ADMIN only)

## Testing the Integration

Use the following demo credentials to test the login:

**Student:**
- Email: `arjun.sharma@college.edu`
- Password: `student123`

**Placement Admin:**
- Email: `placement@college.edu`
- Password: `admin123`

These credentials are created by the database seed script and match the backend's hashed passwords.

## Notes

- All API requests automatically include the Authorization header with the JWT token
- The token is automatically refreshed when it expires (401 responses)
- Auth state is persisted in localStorage for session persistence
- API routes are authenticated by `middleware.ts` (Web Crypto JWT verification); only `/api/v1/auth*` and the `/api/v1/jobs` list are public
- All business logic lives in `lib/services/` and is exercised by the seed script (`prisma/seed.ts`)
