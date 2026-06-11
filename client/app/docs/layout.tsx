import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';
// Force reload triggers layout rebuild (modified to trigger compile cache reload)
import { source } from '../../lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootProvider theme={{ enabled: false }}>
      <DocsLayout tree={source.pageTree} nav={{ title: 'HubNest Docs' }}>
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
