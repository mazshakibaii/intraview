/** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
})

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,
})
