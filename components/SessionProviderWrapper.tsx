// components/SessionProviderWrapper.tsx
// This component is necessary because SessionProvider needs to be a client component
'use client';

import { SessionProvider } from 'next-auth/react';

export default function SessionProviderWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    // You could potentially pass a base path or refetch interval here if needed
    return <SessionProvider>{children}</SessionProvider>;
}