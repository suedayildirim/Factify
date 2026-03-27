/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Prevent Next from inferring monorepo root incorrectly (multiple lockfiles).
    root: __dirname,
  },
};

module.exports = nextConfig;

