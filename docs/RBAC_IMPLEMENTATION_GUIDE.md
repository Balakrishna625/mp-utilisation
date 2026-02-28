# Role-Based Access Control Implementation Guide

## Overview

The MP Utilization Portal now supports role-based access control with two user types:
- **Manager**: Full access to all employees, reports, and admin features
- **Individual**: Access only to their own data and their mentees' information

## Features Implemented

### 1. Authentication System
- Login page with email/password authentication
- Persistent session using localStorage
- Automatic session restoration on page reload
- Secure logout functionality

### 2. Role-Based Dashboards

#### Manager Dashboard (/)
- View all employees' utilization data
- Access mentor-mentee mappings
- Upload and manage data
- View reports and analytics
- Full CRUD operations

#### Individual Dashboard (/individual)
- Personal utilization metrics
- List of assigned mentees
- Read-only view of own data
- Mentee performance tracking

### 3. Protected Routes
- Automatic redirection based on user role
- Unauthorized access prevention
- Login requirement for all pages (except login page)

### 4. Navigation
- Role-based sidebar menu items
- Dynamic user profile display
- Logout functionality

## User Configuration

### Adding New Users

Edit `/types/auth.ts` to add users to the `MOCK_USERS` array:

```typescript
export const MOCK_USERS: User[] = [
  // Manager Users
  {
    id: 'mgr-1',
    name: 'Manager User',
    email: 'manager@company.com',
    role: 'manager',
  },
  
  // Individual Users
  {
    id: 'emp-1',
    name: 'Azeemushan Ali', // Must match name in utilization data
    email: 'azeem@company.com',
    role: 'individual',
    employeeName: 'Azeemushan Ali', // Used for data filtering
  },
  {
    id: 'emp-2',
    name: 'Gokula Krishnan K S',
    email: 'gokul@company.com',
    role: 'individual',
    employeeName: 'Gokula Krishnan K S',
  },
  // Add more users...
]
```

**Important**: For individual users, the `employeeName` field must exactly match the employee's name in your utilization CSV data.

### Demo Credentials

For testing purposes, any password works with these emails:
- Manager: `manager@company.com`
- Individual: `azeem@company.com` or `gokul@company.com`

## Data Filtering Logic

### Individual User Data Access

When an individual user logs in, they can only see:

1. **Their Own Data**
   - Matched by: `employee.name === user.employeeName`
   - Shows: All personal utilization metrics

2. **Their Mentees' Data**
   - Matched by: `employee.mentor === user.employeeName`
   - Shows: List of mentees with their utilization data

### Manager User Data Access

Managers have unrestricted access to:
- All employee utilization data
- All mentor-mentee relationships
- Upload and management features
- Reports and analytics

## File Structure

```
/app
  /login - Login page
  /individual - Individual dashboard
  /page.tsx - Manager dashboard (with redirect logic)
  
/components
  /ProtectedRoute.tsx - Route protection wrapper
  /Sidebar.tsx - Role-based navigation
  /AppLayout.tsx - Conditional layout wrapper
  
/contexts
  /AuthContext.tsx - Authentication state management
  
/lib
  /auth.ts - Authentication service
  
/types
  /auth.ts - User and auth type definitions
```

## Flow Diagrams

### Login Flow
```
User visits app
  ↓
Not authenticated?
  ↓
Redirect to /login
  ↓
Enter credentials
  ↓
Validate user
  ↓
Set session (localStorage)
  ↓
Redirect based on role:
  - Manager → /
  - Individual → /individual
```

### Data Access Flow (Individual)
```
Individual user authenticated
  ↓
Load utilization data from storage
  ↓
Filter data:
  1. Find own record (name match)
  2. Find mentees (mentor field match)
  ↓
Display filtered data only
```

## Security Considerations

### Current Implementation (Mock Auth)
- ⚠️ For development/demo purposes only
- Uses localStorage for session persistence
- No password validation
- No token-based authentication

### Production Recommendations
- Replace mock auth with SSO (see SSO_INTEGRATION_GUIDE.md)
- Implement proper password hashing
- Use httpOnly cookies for session tokens
- Add CSRF protection
- Implement rate limiting
- Add audit logging

## API Protection (Future Enhancement)

When moving to production, protect API routes:

```typescript
// Example protected API route
import { authService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = request.cookies.get('session')
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const user = await authService.validateSession(session.value)
  
  if (user.role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Process request...
}
```

## Testing Checklist

### Manager Role Testing
- [ ] Can access main dashboard
- [ ] Can see all employees
- [ ] Can upload data
- [ ] Can access all menu items
- [ ] Can view mentor-mentee page
- [ ] Can logout successfully

### Individual Role Testing
- [ ] Can access individual dashboard
- [ ] Can see own utilization data
- [ ] Can see assigned mentees
- [ ] Cannot access manager-only pages
- [ ] Cannot see other employees' data
- [ ] Sidebar shows only allowed menu items
- [ ] Can logout successfully

### Authentication Testing
- [ ] Login with valid credentials works
- [ ] Invalid credentials show error
- [ ] Session persists on page reload
- [ ] Logout clears session
- [ ] Unauthenticated users redirect to login
- [ ] Role-based redirects work correctly

## Common Issues & Solutions

### Issue 1: Individual user sees no data
**Cause**: Employee name mismatch between auth config and CSV data
**Solution**: Ensure `employeeName` in auth config exactly matches name in CSV

### Issue 2: Infinite redirect loop
**Cause**: User role not matching any route
**Solution**: Check user role is either 'manager' or 'individual'

### Issue 3: Sidebar not showing correct items
**Cause**: Role filtering not working
**Solution**: Verify user object is properly loaded in Sidebar component

## Next Steps

1. **Short-term**:
   - Add all employee users to MOCK_USERS array
   - Test with real employee data
   - Gather user feedback

2. **Medium-term**:
   - Implement user management UI for admins
   - Add user profile editing
   - Implement password reset flow

3. **Long-term**:
   - Integrate with corporate SSO (see SSO_INTEGRATION_GUIDE.md)
   - Move user data to database
   - Implement advanced permission system

## Support

For questions or issues:
1. Check this documentation
2. Review the SSO Integration Guide for production setup
3. Contact the development team

---

Last Updated: February 2026
