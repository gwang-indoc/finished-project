import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // isomorphic-dompurify has a server-side branch that requires jsdom at
  // runtime. Bun installs the nested jsdom@28 (required by isomorphic-dompurify
  // ^2.36) under a hashed name (e.g. jsdom-<hash>), and Turbopack bakes that
  // hashed name into its chunked output — which then fails to resolve because
  // hashed names aren't real packages. Marking the package as external lets
  // Node's require pick up the nested copy at runtime via normal resolution.
  serverExternalPackages: ['isomorphic-dompurify'],
};

export default nextConfig;
