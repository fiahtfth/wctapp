This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# WCT App

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Vercel Account

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`

## Production Deployment

### Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Deploy to Vercel: `vercel`
4. For production deployment: `vercel --prod`

### Environment Variables

Set the following environment variables in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `JWT_SECRET`: Secret key for JWT token generation
- `NEXT_PUBLIC_SITE_URL`: Your production site URL (e.g., `https://wctapp.vercel.app`)
- `NODE_ENV`: `production` for production environment

## Progressive Web App (PWA)

### PWA Features
- Offline Support
- Installable on Desktop and Mobile
- Cached Assets for Faster Loading

### Installation
1. On Mobile: Open the app in browser, tap "Add to Home Screen"
2. On Desktop: Click "Install" in browser menu

### Offline Capabilities
- Core app functionality available without internet
- Cached questions and resources
- Automatic background sync when connection restored

## Performance Optimization

- Optimize images
- Use server-side rendering
- Implement caching strategies

## Security

- Always keep dependencies updated
- Use environment variables for sensitive information
- Implement proper authentication and authorization

## Database Setup

The application requires several tables to be created in your Supabase database. Follow the setup instructions in SETUP-INSTRUCTIONS.md to set up the database properly.

## Environment Variables

Make sure the following environment variables are set in your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
```
