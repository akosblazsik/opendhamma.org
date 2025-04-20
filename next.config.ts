// next.config.ts
import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true, // Recommended for development

  // Configure image domains for next/image
  images: {
    remotePatterns: [
      {
        protocol: 'https', // Protocol used by GitHub avatars
        hostname: 'avatars.githubusercontent.com', // The domain for GitHub avatars
        // Optional: You can specify port and pathname if needed, but usually not for avatars
        // port: '',
        // pathname: '/u/**', // Example: Allow only paths starting with /u/
      },
      // Add other allowed domains here if you plan to use images from other sources
      // {
      //   protocol: 'https',
      //   hostname: 'example.com',
      // },
    ],
  },

  // Optional: Add experimental features if needed
  // experimental: {
  //   serverActions: true, // Enable Server Actions if you plan to use them
  // },

  // Optional: Add webpack configuration adjustments if needed
  // webpack: (config, { isServer }) => {
  //   // Example: Add custom aliases or loaders
  //   return config;
  // },
};

export default nextConfig;