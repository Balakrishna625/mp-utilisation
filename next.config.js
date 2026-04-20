/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next.js from bundling these server-only packages.
  // pg, prisma, and their adapters use native bindings/dynamic requires
  // that must remain external (not bundled by webpack).
  experimental: {
    serverComponentsExternalPackages: ['pg', '@prisma/client', '@prisma/adapter-pg', 'prisma'],
  },
}

module.exports = nextConfig
