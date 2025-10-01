import type { NextConfig } from "next";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";

const nextConfig: NextConfig = {
  /* config options here */
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
    domains: ['hebbkx1anhila5yf.public.blob.vercel-storage.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer"),
        process: require.resolve("process/browser"),
      };

      config.plugins.push(new NodePolyfillPlugin());
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    esmExternals: true
  }
};

export default nextConfig;
