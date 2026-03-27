/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Prevent Next from inferring monorepo root incorrectly (multiple lockfiles).
    root: __dirname,
  },
  // Allow development access from local network IP shown by Next dev server.
  allowedDevOrigins: ['192.168.56.1'],
};

module.exports = nextConfig;

