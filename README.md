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

### Quick Deployment

For a simplified deployment process, use the provided deploy script:

```bash
npm run deploy
```

This script will:
1. Install dependencies
2. Run linting
3. Build the application
4. Initialize the database if needed
5. Deploy to Vercel production environment

### Manual Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Deploy to Vercel: `vercel`
4. For production deployment: `vercel --prod`

### Environment Variables

Set the following environment variables in Vercel:

- `DATABASE_URL`: `file:./wct.db` (SQLite database connection string)
- `DATABASE_PATH`: `./wct.db` (Path to the SQLite database file)
- `JWT_SECRET`: Secret key for JWT token generation
- `NEXT_PUBLIC_SITE_URL`: Your production site URL (e.g., `https://wctapp.vercel.app`)
- `NODE_ENV`: `production` for production environment

### Database Deployment

The application uses SQLite for data storage. For Vercel deployment:

1. The database file (`wct.db`) will be copied to a temporary location during build
2. API routes will access this database file
3. Note that changes to the database in production will not persist between deployments
4. For production, consider using a persistent database service

## Progressive Web App (PWA)

### PWA Features
- Offline Support
- Installable on Desktop and Mobile
- Cached Assets for Faster Loading

### PWA Build and Deployment
- Build PWA: `npm run pwa:build`
- Start PWA: `npm run pwa:start`

### Installation
1. On Mobile: Open the app in browser, tap "Add to Home Screen"
2. On Desktop: Click "Install" in browser menu

### Offline Capabilities
- Core app functionality available without internet
- Cached questions and resources
- Automatic background sync when connection restored

## Testing

- Run tests: `npm test`
- Run test coverage: `npm run test:coverage`

## Performance Optimization

- Optimize images
- Use server-side rendering
- Implement caching strategies

## Security

- Always keep dependencies updated
- Use environment variables for sensitive information
- Implement proper authentication and authorization
