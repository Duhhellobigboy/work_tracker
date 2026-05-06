import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  debug: false,
});
