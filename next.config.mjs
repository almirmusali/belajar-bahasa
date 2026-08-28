/** @type {import('next').NextConfig} */
const nextConfig = {
  // hasStudioAudio (lib/reading.ts) проверяет наличие MP3 через fs, и трейсер
  // Vercel из-за этого утаскивал все 380 МБ public/audio внутрь serverless-
  // функции — деплой падал по лимиту 250 МБ. В рантайме эти файлы функции не
  // нужны: страницы читалки статические (dynamicParams = false), а озвучка
  // отдаётся как обычная статика.
  outputFileTracingExcludes: {
    "*": ["./public/audio/**", "./public/reading/**", "./public/skazki/**"],
  },
};

export default nextConfig;
