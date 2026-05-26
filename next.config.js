/** @type {import('next').NextConfig} */
const nextConfig = {
  // Modo standalone: cria uma versão independente do app para rodar no servidor
  output: 'standalone',

  // Domínios permitidos para carregar imagens externas
  images: {
    domains: [
      'app.avantere.com.br',
      'avantere.com.br',
      'localhost',
    ],
  },

  // Headers de segurança (proteção extra)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
