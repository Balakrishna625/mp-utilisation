# Quick Start: Adding Users to the System

## For Demo/Development Environment

### Step 1: Edit the User Database

Open `/types/auth.ts` and add users to the `MOCK_USERS` array.

### Step 2: Add an Individual Employee

```typescript
{
  id: 'emp-X', // Unique ID
  name: 'Employee Full Name', // Display name
  email: 'employee@company.com', // Login email
  role: 'individual',
  employeeName: 'Employee Full Name', // MUST match CSV data exactly
}
```

### Step 3: Add a Manager

```typescript
{
  id: 'mgr-X', // Unique ID
  name: 'Manager Full Name',
  email: 'manager@company.com',
  role: 'manager',
  // No employeeName needed for managers
}
```

## Critical: Name Matching

The `employeeName` field for individual users **MUST EXACTLY MATCH** the name in your utilization CSV file, including:
- Capitalization
- Spacing
- Middle names/initials
- Special characters

### Example Matching:
```typescript
// CSV Data
"Azeemushan Ali",Lead Engineer,528,544...

// Auth Config (✅ CORRECT)
employeeName: 'Azeemushan Ali'

// Auth Config (❌ WRONG - won't find data)
employeeName: 'azeemushan ali'
employeeName: 'Azeemushan  Ali' // extra space
employeeName: 'Ali, Azeemushan' // different format
```

## Quick Copy Template

```typescript
// Manager Template
{
  id: 'mgr-1',
  name: 'Your Name',
  email: 'you@company.com',
  role: 'manager',
},

// Individual Template
{
  id: 'emp-1',
  name: 'Your Name',
  email: 'you@company.com',
  role: 'individual',
  employeeName: 'Your Name', // Must match CSV exactly
},
```

## Testing Your Setup

1. Upload your utilization CSV data
2. Login with the employee's email
3. Check if their data appears on the individual dashboard
4. If no data shows, verify the name matching

## Future: SSO Integration

Once SSO is configured:
- Users will login with corporate credentials
- Names will be automatically synced from Active Directory
- No manual user addition needed
- See `/docs/SSO_INTEGRATION_GUIDE.md` for implementation

---

Need help? Check `/docs/RBAC_IMPLEMENTATION_GUIDE.md` for detailed documentation.
