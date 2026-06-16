import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // pdfjs-dist usa worker/APIs de browser — não pode ser bundlado pelo webpack server-side
  serverExternalPackages: ["pdfjs-dist"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https:",
              "font-src 'self'",
              // *.sentry.io necessário para envio de eventos de erro
              "connect-src 'self' https://*.sentry.io",
              "frame-ancestors 'none'",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false
    if (isServer) {
      // pdfjs-dist não pode ser bundlado server-side — usa APIs de browser
      const existing = Array.isArray(config.externals) ? config.externals : []
      config.externals = [...existing, "pdfjs-dist"]
    }
    return config
  },
}

export default withSentryConfig(nextConfig, {
  // Desabilita upload de source maps se SENTRY_AUTH_TOKEN não estiver configurado
  silent: !process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  automaticVercelMonitors: false,
})
