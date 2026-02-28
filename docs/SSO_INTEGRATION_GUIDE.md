# SSO Integration Guide for MP Utilization Portal

This document outlines the steps and considerations for integrating Single Sign-On (SSO) into the MP Utilization Portal application.

## Current Architecture

The application currently uses a mock authentication system with:
- Local storage-based session management
- Role-based access control (Manager & Individual roles)
- Protected routes with automatic redirection
- Context-based authentication state

## SSO Integration Options

### Option 1: Microsoft Entra ID (Azure AD) - Recommended for Enterprise

**Why Choose This:**
- Native integration with Microsoft ecosystem
- Enterprise-grade security
- Common in corporate environments
- Built-in MFA support

**Implementation Steps:**

1. **Install Required Packages**
```bash
npm install @azure/msal-browser @azure/msal-react
```

2. **Register Application in Azure Portal**
   - Go to Azure Portal → Azure Active Directory → App Registrations
   - Click "New Registration"
   - Set redirect URI: `http://localhost:3000/auth/callback` (dev) and production URL
   - Note the Application (client) ID and Directory (tenant) ID

3. **Configure MSAL**

Create `/lib/msalConfig.ts`:
```typescript
import { Configuration, PublicClientApplication } from '@azure/msal-browser'

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}`,
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
}

export const msalInstance = new PublicClientApplication(msalConfig)

export const loginRequest = {
  scopes: ['User.Read', 'email', 'profile'],
}
```

4. **Update AuthContext**

Modify `/contexts/AuthContext.tsx`:
```typescript
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '@/lib/msalConfig'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { instance, accounts } = useMsal()
  const [user, setUser] = useState<User | null>(null)

  const loginWithSSO = async () => {
    try {
      const response = await instance.loginPopup(loginRequest)
      const userInfo = await fetchUserInfo(response.account)
      setUser(userInfo)
    } catch (error) {
      console.error('SSO login failed:', error)
      throw error
    }
  }

  // ... rest of implementation
}
```

5. **Environment Variables (.env.local)**
```env
NEXT_PUBLIC_AZURE_CLIENT_ID=your-client-id
NEXT_PUBLIC_AZURE_TENANT_ID=your-tenant-id
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/auth/callback
```

---

### Option 2: Okta

**Why Choose This:**
- Popular enterprise SSO provider
- Easy integration
- Good documentation and support

**Implementation Steps:**

1. **Install Okta SDK**
```bash
npm install @okta/okta-auth-js @okta/okta-react
```

2. **Configure Okta Application**
   - Sign in to Okta Admin Console
   - Create new Web Application
   - Note the Client ID and Issuer URL
   - Configure redirect URIs

3. **Create Okta Config**

Create `/lib/oktaConfig.ts`:
```typescript
export const oktaConfig = {
  clientId: process.env.NEXT_PUBLIC_OKTA_CLIENT_ID!,
  issuer: process.env.NEXT_PUBLIC_OKTA_ISSUER!,
  redirectUri: `${window.location.origin}/auth/callback`,
  scopes: ['openid', 'profile', 'email'],
}
```

4. **Wrap App with OktaAuth**

Update `/app/layout.tsx`:
```typescript
import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js'
import { Security } from '@okta/okta-react'

const oktaAuth = new OktaAuth(oktaConfig)

export default function RootLayout({ children }) {
  return (
    <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </Security>
  )
}
```

---

### Option 3: Auth0

**Why Choose This:**
- Developer-friendly
- Supports multiple identity providers
- Generous free tier

**Implementation Steps:**

1. **Install Auth0 SDK**
```bash
npm install @auth0/auth0-react
```

2. **Configure Auth0 Application**
   - Create application in Auth0 Dashboard
   - Configure allowed callback URLs
   - Note Domain and Client ID

3. **Wrap App with Auth0Provider**

Update `/app/layout.tsx`:
```typescript
import { Auth0Provider } from '@auth0/auth0-react'

export default function RootLayout({ children }) {
  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : '',
      }}
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </Auth0Provider>
  )
}
```

---

## User Role Mapping Strategy

After successful SSO authentication, you need to map users to roles:

### Option A: Azure AD Groups/Roles
```typescript
async function mapUserFromAzureAD(account: AccountInfo): Promise<User> {
  const roles = account.idTokenClaims?.roles || []
  
  return {
    id: account.localAccountId,
    name: account.name || '',
    email: account.username,
    role: roles.includes('Manager') ? 'manager' : 'individual',
    employeeName: account.name,
  }
}
```

### Option B: Database Lookup
```typescript
async function mapUserFromDatabase(email: string): Promise<User> {
  const response = await fetch(`/api/users/${email}`)
  const userData = await response.json()
  
  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    employeeName: userData.employeeName,
  }
}
```

### Option C: Azure AD Custom Claims
Configure custom claims in Azure AD to include role information directly in the token.

---

## API Protection

Update API routes to validate SSO tokens:

### For Microsoft Entra ID:
```typescript
// /lib/validateToken.ts
import { Client } from '@microsoft/microsoft-graph-client'

export async function validateAzureToken(token: string) {
  try {
    const client = Client.init({
      authProvider: (done) => {
        done(null, token)
      },
    })
    
    const user = await client.api('/me').get()
    return user
  } catch (error) {
    throw new Error('Invalid token')
  }
}
```

### Example Protected API Route:
```typescript
// /app/api/data/route.ts
import { validateAzureToken } from '@/lib/validateToken'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const user = await validateAzureToken(token)
    // Process request...
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
```

---

## Migration Path from Mock to SSO

Follow these steps for a smooth transition:

### Phase 1: Preparation
1. ✅ Implement role-based authentication (Current state)
2. ✅ Create AuthContext and protected routes
3. Set up SSO provider account and configuration

### Phase 2: Implementation
1. Install SSO SDK packages
2. Configure SSO provider settings
3. Update AuthContext to support SSO login
4. Add SSO login button to login page
5. Implement token validation

### Phase 3: Dual Authentication (Transition Period)
```typescript
// Support both mock and SSO login
export function AuthProvider({ children }: { children: ReactNode }) {
  const loginWithMock = async (email: string, password: string) => {
    // Existing mock login
  }
  
  const loginWithSSO = async () => {
    // New SSO login
  }
  
  return (
    <AuthContext.Provider value={{ loginWithMock, loginWithSSO, ...other }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Phase 4: Full SSO Migration
1. Remove mock authentication code
2. Update all API routes with token validation
3. Sync user data from SSO provider
4. Test thoroughly

---

## Security Considerations

1. **Token Storage**: Use httpOnly cookies for production instead of localStorage
2. **Token Refresh**: Implement automatic token refresh logic
3. **Logout**: Ensure proper cleanup of tokens and session data
4. **CORS**: Configure proper CORS policies for API routes
5. **HTTPS**: Always use HTTPS in production
6. **Rate Limiting**: Implement rate limiting on authentication endpoints

---

## Testing SSO Integration

### Local Development
1. Use localhost redirect URIs
2. Test with test users from SSO provider
3. Verify role mapping works correctly

### Production
1. Use production redirect URIs
2. Test with real corporate accounts
3. Monitor authentication logs
4. Have fallback authentication mechanism

---

## Recommended Approach for Your Application

Given your requirement for corporate use, **Microsoft Entra ID (Azure AD)** is recommended because:

1. ✅ Likely already used in your organization
2. ✅ Seamless integration with corporate directory
3. ✅ No additional user database needed
4. ✅ Built-in role and group management
5. ✅ Enterprise security compliance

### Quick Start with Azure AD

```typescript
// Update /contexts/AuthContext.tsx
import { MsalProvider, useMsal } from '@azure/msal-react'

const loginWithSSO = async () => {
  const { instance } = useMsal()
  try {
    const response = await instance.loginPopup({
      scopes: ['User.Read', 'email', 'profile'],
    })
    
    // Map Azure AD user to your app user
    const appUser: User = {
      id: response.account.localAccountId,
      name: response.account.name || '',
      email: response.account.username,
      role: determineRole(response.account), // Based on AD groups
      employeeName: response.account.name,
    }
    
    authService.setCurrentUser(appUser)
  } catch (error) {
    console.error('SSO login failed:', error)
  }
}
```

---

## Next Steps

1. **Immediate**: Test current mock authentication system
2. **Short-term**: Choose SSO provider (recommend Azure AD)
3. **Medium-term**: Set up SSO provider configuration
4. **Long-term**: Implement and test SSO integration
5. **Final**: Migrate all users to SSO

---

## Support Resources

- **Azure AD**: https://docs.microsoft.com/en-us/azure/active-directory/
- **MSAL.js**: https://github.com/AzureAD/microsoft-authentication-library-for-js
- **Okta React**: https://developer.okta.com/code/react/
- **Auth0 React**: https://auth0.com/docs/quickstart/spa/react

---

## Contact

For questions about SSO integration, consult your IT security team or SSO administrator.
