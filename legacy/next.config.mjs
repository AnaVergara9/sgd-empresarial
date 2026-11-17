/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Ícono de Google usado en los botones de inicio de sesión (login, unirse, registro-empresa)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "/favicon.ico",
      },
    ],
  },
};

export default nextConfig;
