/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose non-secret env vars to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Enable React strict mode for better dev-time warnings
  reactStrictMode: true,

  // Optimize images from Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
