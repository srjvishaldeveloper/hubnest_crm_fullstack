'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';

// Always render the provider so GoogleLogin components are never outside context.
// A dummy value is fine when GOOGLE_CLIENT_ID isn't set — the button simply won't work.
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'not-configured';

export default function GoogleProvider({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}
