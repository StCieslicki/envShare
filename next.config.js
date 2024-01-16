/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ["twitter.com", "pbs.twimg.com"],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/share',
        permanent: false,
      }
    ]
  }
};

module.exports = nextConfig;
