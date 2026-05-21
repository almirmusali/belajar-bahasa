# Belajar Bahasa

Платформа для изучения индонезийского языка (Bahasa Indonesia).

## Стек

- **Next.js 15** (App Router, RSC)
- **TypeScript**
- **Tailwind CSS** + CSS-переменные (тема под shadcn/ui)
- **shadcn/ui** (заготовка `components.json`, алиасы `@/components`, `@/lib`)
- **lucide-react** для иконок

Проект подготовлен под добавление компонентов из [v0.app](https://v0.app) — копируйте компоненты прямо в `components/ui/`.

## Локальный запуск

```bash
npm install
npm run dev
```

Сайт откроется на http://localhost:3000.

## Деплой

Авто-деплой на [Vercel](https://vercel.com): каждый push в `main` уходит в продакшн.
