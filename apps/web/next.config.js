/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@bpmn-modeler/core',
    '@bpmn-modeler/properties',
    '@bpmn-modeler/deployment',
    '@bpmn-modeler/storage'
  ],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
}

module.exports = nextConfig