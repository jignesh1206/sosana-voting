const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/vote',
        permanent: true,
      },
    ];
  },
  images: {
    domains: ['sosana-voting.aiyug.us'],
  },
  typescript: {
    
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    customKey: 'NEXT_PUBLIC_BACKEND_URL',
  },
} as any;

export default nextConfig;