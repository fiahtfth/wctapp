# Setup Instructions for Admin Login Fix

This document provides instructions for fixing the admin login functionality in the application.

## Issue Summary

The admin login functionality was not working due to several issues:

1. Database tables were not properly initialized
2. The login API route had a mismatch between the field names (`password` vs `password_hash`)
3. Authentication token handling was inconsistent
4. The frontend was not properly using the access token for authentication

## Setup Steps

### 1. Set up the Database Tables

You have two options for setting up the database tables:

#### Option A: Using the SQL Script (Recommended)

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy the contents of `scripts/supabase-setup.sql` and paste it into the SQL Editor
4. Run the SQL script to create all the necessary tables

#### Option B: Using the Node.js Script

If you prefer to use the Node.js script:

```bash
# Make sure the script is executable
chmod +x scripts/setup-supabase-tables.js

# Run the script
npm run setup-db
```

### 2. Create the Admin User

After setting up the tables, create the admin user:

```bash
# Make sure the script is executable
chmod +x scripts/create-admin-user.js

# Run the script
npm run create-admin
```

This will create an admin user with the following credentials:
- Email: admin@nextias.com
- Password: admin123

### 3. Verify the Environment Variables

Make sure your `.env.local` file contains the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
```

### 4. Restart the Application

Restart your application to apply all the changes:

```bash
npm run dev
```

## Troubleshooting

### Authentication Issues

1. **Continuous Page Refreshes After Login**: If you experience the login page refreshing continuously after attempting to log in:
   - Clear your browser cache and cookies
   - Check browser console for any errors
   - Ensure the Next.js application is running properly
   - Verify that the `redirectCount` in session storage is being reset properly

2. **Login Not Working**: If you're unable to log in:
   - Ensure you're using the correct credentials (default admin: admin@nextias.com / password)
   - Check that the database is properly set up with the admin user

3. **Not Being Redirected to the Correct Page**: If you're not being redirected to the appropriate page after login:
   - Ensure protected routes are using the correct HOCs (`withAuth` for authenticated users, `withAdminAuth` for admin users)
   - Check that the user role is being correctly determined from the token
   - Verify that the `redirectAfterLogin` value in localStorage is being set and cleared properly
   - If using Next.js router navigation isn't working, try using direct navigation with `window.location.href` instead of `router.push()`
   - Check the browser console for any navigation errors or redirection loops

4. **Token Issues**: If you're experiencing issues with authentication tokens:
   - The access token is stored in localStorage under the key `accessToken`
   - Tokens expire after 24 hours by default
   - If a token becomes invalid, you'll be automatically redirected to the login page
   - You can manually clear tokens by running `localStorage.removeItem('accessToken')` in the browser console
   - Ensure all components are using the same key (`accessToken`) to retrieve the token, not `token` or other variations
   - If you're still experiencing token-related issues, try clearing all localStorage items and logging in again

## Additional Notes

- The authentication system uses JWT tokens for authentication
- Access tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Passwords are securely hashed using bcrypt
- The frontend now properly uses the access token for authentication

For any further assistance, please contact the development team. 