# OAuth Provider Setup Guide

This guide walks you through setting up OAuth authentication providers for OpenJournal.

## Prerequisites

- Your application must be deployed or accessible via a public URL (for production)
- For local development, you can use `http://localhost:3000`

## OAuth Callback URLs

All OAuth providers require a callback URL. The format is:

```
http://localhost:3000/api/auth/callback/{provider}
```

For production, replace `localhost:3000` with your domain.

**Provider-specific callback URLs:**

- Google: `http://localhost:3000/api/auth/callback/google`
- GitHub: `http://localhost:3000/api/auth/callback/github`

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "OpenJournal") and click "Create"

### 2. Enable Google+ API

1. In the sidebar, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type and click "Create"
3. Fill in the required fields:
   - **App name**: OpenJournal
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click "Save and Continue"
5. On the "Scopes" page, click "Add or Remove Scopes"
6. Select these scopes:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
7. Click "Update" and "Save and Continue"
8. Add test users if needed (for development)
9. Click "Save and Continue" and "Back to Dashboard"

### 4. Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Configure:
   - **Name**: OpenJournal Web Client
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

### 5. Add to Environment Variables

Add these to your `.env.local` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## GitHub OAuth Setup

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in the application details:
   - **Application name**: OpenJournal
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
   - **Application description**: (optional) Your journaling app description
4. Click "Register application"

### 2. Generate Client Secret

1. On the OAuth App page, click "Generate a new client secret"
2. Copy the **Client ID** (shown at the top)
3. Copy the **Client Secret** (shown after generation - save it immediately!)

### 3. Add to Environment Variables

Add these to your `.env.local` file:

```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
```

## Microsoft OAuth Setup (Optional)

### 1. Register an Application in Azure

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Fill in:
   - **Name**: OpenJournal
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: Web → `http://localhost:3000/api/auth/callback/microsoft`
5. Click "Register"

### 2. Create Client Secret

1. In your app registration, go to "Certificates & secrets"
2. Click "New client secret"
3. Add a description and select expiration
4. Click "Add"
5. **Copy the secret value immediately** (it won't be shown again)
6. Copy the **Application (client) ID** from the Overview page

### 3. Configure API Permissions

1. Go to "API permissions"
2. Click "Add a permission" → "Microsoft Graph"
3. Select "Delegated permissions"
4. Add these permissions:
   - `openid`
   - `profile`
   - `email`
   - `User.Read`
5. Click "Add permissions"

### 4. Add Microsoft Provider to Code

First, install the Microsoft provider:

```bash
pnpm add @auth/microsoft-provider
```

Update `lib/auth.ts`:

```typescript
import Microsoft from "next-auth/providers/microsoft";

// Add to providers array:
Microsoft({
  clientId: process.env.MICROSOFT_CLIENT_ID!,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: "openid profile email User.Read",
    },
  },
}),
```

### 5. Add to Environment Variables

Add these to your `.env.local` file:

```env
MICROSOFT_CLIENT_ID=your_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
```

## Production Deployment

When deploying to production:

1. **Update Callback URLs**: Change all `http://localhost:3000` URLs to your production domain
2. **Update Environment Variables**: Set production credentials in your hosting platform
3. **Verify OAuth Consent Screens**: Make sure production URLs are whitelisted
4. **Test Thoroughly**: Test each OAuth provider after deployment

### Production Callback URLs

Replace `http://localhost:3000` with `https://yourdomain.com`:

- Google: `https://yourdomain.com/api/auth/callback/google`
- GitHub: `https://yourdomain.com/api/auth/callback/github`
- Microsoft: `https://yourdomain.com/api/auth/callback/microsoft`

## Troubleshooting

### "Redirect URI Mismatch" Error

- Verify the callback URL in your OAuth provider settings matches exactly (including protocol and trailing slashes)
- Check that NEXTAUTH_URL environment variable is set correctly

### "Invalid Client" Error

- Verify CLIENT_ID and CLIENT_SECRET are correct
- Check that credentials are from the correct environment (development vs production)

### OAuth Provider Not Showing on Sign-in Page

- Verify environment variables are set in `.env.local`
- Restart your development server after adding variables
- Check for typos in variable names

### Google OAuth Shows "This app isn't verified"

- This is normal for development apps
- Click "Advanced" → "Go to OpenJournal (unsafe)" during testing
- For production, submit your app for verification

## Testing OAuth Integration

1. Start your development server: `pnpm dev`
2. Navigate to `http://localhost:3000/auth/signin`
3. Click on an OAuth provider button
4. Complete the OAuth flow
5. Verify you're redirected back and logged in
6. Check the database to see the user and account records

## Security Best Practices

1. **Never commit secrets**: Keep `.env.local` in `.gitignore`
2. **Rotate secrets regularly**: Especially after any potential exposure
3. **Use different credentials**: Separate credentials for development and production
4. **Restrict redirect URIs**: Only whitelist necessary callback URLs
5. **Monitor OAuth usage**: Check provider dashboards for suspicious activity

## Support

For provider-specific issues:

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)

For NextAuth.js issues:

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [NextAuth.js OAuth Providers](https://next-auth.js.org/providers/)
