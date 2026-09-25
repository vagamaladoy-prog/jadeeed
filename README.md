# Jadeeed — интернет-магазин футболок

Витрина (uz / ru) + админ-панель + Telegram-бот с Mini App. Один код, одна база, одна админка.

**Стек:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · next-intl · Prisma 7 + Supabase PostgreSQL · Supabase Storage · Motion · React Bits · Lenis · shadcn/ui (Radix) · vaul · Embla · React Hook Form + Zod · TanStack Table · Lucide. Все библиотеки бесплатные (MIT/ISC/Apache; React Bits — MIT + Commons Clause, т.е. бесплатно для использования в проекте).

- Дизайн-система: [`DESIGN.md`](DESIGN.md) (основа — Refero Styles «Intercom — Warm cream editorial spread», адаптирована под палитру Jadeeed, атлас и движение).
- Токены: `src/app/tokens.css` + `@theme` в `src/app/globals.css`. Стандартная палитра Tailwind отключена — в коде доступны только цвета бренда.

---

## Шрифты — почему Unbounded

- **Интерфейс — Onest.** Нейтральный гротеск, спроектирован сразу под кириллицу и латиницу; хорошо читается в мелких размерах; поддерживает узбекскую латиницу (oʻ gʻ ʼ).
- **Фразы бренда и крупные заголовки — Unbounded (300–500).** Широкий геометрический гротеск с характером. Он рифмуется с тяжёлой геометричной «J» логотипа. В светлом начертании (300) он звучит спокойно и уверенно, а не как «весёлый стритвир». Полная кириллица и Latin Extended. Контрастная антиква выглядела бы как «модный журнал», Tenor Sans — слишком нейтрально для фраз, которые должны запоминаться.

## Логотип

`assets/brand/logo-source.png` — оригинал. Скрипт `scripts/process-logo.mjs` вырезает его из фона **попиксельно, ничего не перерисовывая**. Лицо на букве J остаётся точно как в оригинале.

| Файл | Для чего |
|---|---|
| `public/brand/logo-light.svg` / `.png` | светлый фон: оригинальные пиксели на прозрачном фоне |
| `public/brand/logo-dark.svg` / `.png` | тёмный фон: портрет не инвертируется (не негатив), букву очерчивает тонкий белый контур, надпись «—Jadeeed» белая |
| `src/app/icon.png`, `apple-icon.png` | фавиконки |

SVG — это обёртка с оригинальным растром внутри (`<image>`), так мелкие детали лица не теряются. Если найдётся исходник в большем разрешении, положите его в `assets/brand/logo-source.png` и запустите `npm run assets`.

## Атлас (ikat)

Атлас — это фото настоящей ikat-ткани бренда (`assets/brand/atlas-source.webp`), ничего не нарисовано. `scripts/process-atlas.mjs` делает из него бесшовную плитку: фото отражается зеркально 2×2, стыки незаметны, потому что мотивы ikat симметричны. Плитка есть в обычном и retina-разрешении, плюс тонкая полоса-разделитель. Узор медленно «течёт» вниз (CSS-transform), на ПК слегка смещается за курсором, на телефоне — при скролле. Чтобы заменить ткань, положите новое фото в `assets/brand/atlas-source.webp` и запустите `npm run assets`.

---

## Фото и баннеры в демо-данных

Тестовый каталог (`npm run db:seed`) собран из реальной фотосессии Jadeeed: 4 модели, цвета с собственными фото (спереди, сзади, крупно). Баннеры (`public/seed/banners`) сделаны в стиле editorial: фото + надпись Unbounded, вшитая в картинку. Верхние ~18% баннера оставлены свободными — поверх лежит прозрачная шапка. В админке всё это заменяется своими фото.

## Локальный запуск

```bash
npm install
cp .env.example .env        # заполнить переменные (см. ниже)
npx prisma migrate deploy   # создать таблицы
npm run db:seed             # тестовые данные: 12 футболок, 2 баннера, 3 заказа
npm run dev                 # http://localhost:3000, админка — /admin
```

**Без Supabase и Docker** можно поднять локальный Postgres (PGlite): `npm run db:local` в отдельном терминале, а в `.env` указать
`DATABASE_URL` и `DIRECT_URL` = `postgresql://postgres:postgres@127.0.0.1:5433/postgres?sslmode=disable` и `DB_POOL_MAX="1"`.

Проверки: `npm run selftest` (цены, акции, маска телефона, фильтры, подпись Telegram initData, текст уведомления) и
`npm run test:order` (реальный заказ в БД: списание склада, акция −20%, отказ при нехватке, возврат склада при отмене).

> В локальном `.env` Next.js подставляет переменные вида `$VAR`. Если кладёте туда bcrypt-хеш пароля, экранируйте каждый `$` как `\$` — или используйте локально обычный пароль. В Vercel экранировать не нужно.

## Переменные окружения

| Переменная | Что это | Где взять |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | адрес сайта без `/` в конце | ваш домен или `https://<project>.vercel.app` |
| `DATABASE_URL` | Supabase, **pooler, порт 6543** (`?pgbouncer=true`) | Supabase → Project Settings → Database → Connection string → *Transaction pooler* |
| `DIRECT_URL` | Supabase, **порт 5432** (для миграций) | там же → *Session pooler* или *Direct connection* |
| `SUPABASE_URL` | адрес проекта | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | серверный ключ для загрузки фото (**никому не показывать**) | Project Settings → API → `service_role` |
| `ADMIN_LOGIN` | логин владельца | придумайте |
| `ADMIN_PASSWORD` | пароль или (лучше) bcrypt-хеш | `npm run admin:hash -- "пароль"` |
| `SESSION_SECRET` | ≥ 32 случайных символа для подписи сессии | `npm run secret` |
| `TELEGRAM_BOT_TOKEN` | токен бота | @BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | кому слать заказы (можно несколько через запятую) | см. ниже |
| `TELEGRAM_WEBHOOK_SECRET` | защищает `/api/telegram/webhook` | `npm run secret` |

## Supabase

1. Создайте проект на supabase.com.
2. **Storage → New bucket → `products`, Public: ON.** Сюда админка загружает фото и баннеры.
3. Скопируйте строки подключения в `DATABASE_URL` (6543) и `DIRECT_URL` (5432).

## Логин и пароль админки

1. `npm run admin:hash -- "ваш-надёжный-пароль"` — выведет хеш вида `$2b$12$...`.
2. В Vercel: `ADMIN_LOGIN` = логин, `ADMIN_PASSWORD` = этот хеш, `SESSION_SECRET` = результат `npm run secret`.
3. Вход: `https://ваш-сайт/admin`. После 5 неверных попыток вход с этого IP блокируется на 15 минут. Сессия хранится в httpOnly-cookie 7 дней. Сменили `ADMIN_LOGIN` — все старые сессии завершаются.

## Telegram-бот

### Создать бота
1. Откройте **@BotFather** → `/newbot` → имя (например, *Jadeeed*) → username (например, `jadeeed_bot`).
2. Скопируйте токен в `TELEGRAM_BOT_TOKEN`.
3. (Необязательно) `/setuserpic` — загрузите `public/brand/logo-light.png`.

### Узнать свой chat ID
Напишите боту **@userinfobot** — он ответит вашим ID. Впишите его в `TELEGRAM_ADMIN_CHAT_ID`; несколько админов — через запятую. **Каждый админ должен один раз нажать /start в вашем боте**, иначе Telegram не даст боту написать ему первым.

### Что делает бот
- Шлёт админам сообщение о каждом новом заказе (с сайта и из Mini App). Если Telegram не ответил, заказ всё равно сохраняется, клиент видит «Спасибо», ошибка пишется в лог Vercel.
- На `/start` отвечает приветствием «Siz o'shami?» и кнопками «Do'konni ochish» (Mini App), «Qo'llab-quvvatlash», «Kanal». Другие сообщения игнорирует.
- Кнопка меню «Do'kon» открывает витрину прямо в Telegram (Mini App).

### Mini App
Это тот же сайт. Внутри Telegram он сам определяет режим Mini App по `initData`. В этом режиме:
- SDK Telegram подключается только внутри Telegram;
- системная кнопка «Назад» работает, на корзине и оформлении действие берёт на себя MainButton;
- есть вибрация, учитываются безопасные зоны;
- имя подставляется из профиля, телефон можно отправить кнопкой «Поделиться номером»;
- прелоадер, Lenis и parallax баннера отключены.

Сервер проверяет подпись `initData` токеном бота. У заказа сохраняются источник, Telegram ID и @username.

## GitHub → Vercel (автодеплой)

1. Создайте пустой репозиторий на GitHub и отправьте код:
   ```bash
   git remote add origin https://github.com/<you>/jadeeed.git
   git push -u origin main
   ```
2. vercel.com → **Add New… → Project → Import** этот репозиторий. Framework определится сам (Next.js).
3. **Settings → Environment Variables** — добавьте все переменные из таблицы (Production + Preview).
4. Deploy. Сборка запускает `vercel-build`: `prisma generate` → `prisma migrate deploy` → `next build`. Таблицы в базе создаются/обновляются автоматически.
5. Дальше каждый `git push` в `main` обновляет сайт, а у каждого pull request появляется своя preview-ссылка.
6. Первый раз заполните базу тестовыми данными (по желанию): локально с `DIRECT_URL` от Supabase выполните `npm run db:seed`.

### После первого деплоя — `npm run telegram:setup`
Локально, с заполненными `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` и **боевым** `NEXT_PUBLIC_SITE_URL` (https) в `.env`:
```bash
npm run telegram:setup
```
Скрипт регистрирует webhook `/api/telegram/webhook` с секретом и ставит кнопку меню «Do'kon». Запустите его снова, если поменяется домен.

## Что меняется из админки (без программиста)

Заказы и статусы · товары (uz/ru, цвета, фото с перетаскиванием, остатки по размерам XS–XXXL, состав, плотность, флаги) · акции (% или сумма, на товары или категорию, даты) · баннеры (ПК 2400×1000 и телефон 1080×1350, alt-текст uz/ru, ссылка, превью) · фразы бренда и где они показываются · категории · размерные сетки · контакты и соцсети · тексты «О бренде» и «Доставка» · тестовое сообщение в Telegram.

## Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` / `build` / `start` | разработка / сборка / запуск |
| `npm run db:migrate` | новая миграция после изменения `schema.prisma` (локально) |
| `npm run db:deploy` | применить миграции |
| `npm run db:seed` | тестовые данные (**стирает каталог и заказы**) |
| `npm run telegram:setup` | webhook + кнопка меню бота |
| `npm run admin:hash -- "пароль"` | bcrypt-хеш для `ADMIN_PASSWORD` |
| `npm run secret` | случайная строка для секретов |
| `npm run assets` | пересобрать атлас (из фото ткани) и логотип |
| `npm run photos -- <папка>` | подготовить фотосессию (3.jpg…17.jpg) в `public/photos`: WebP, кадр 4:5 для карточек |

## Правила движения (коротко)
Hover 150–200 мс, появления 400–600 мс, крупные сцены ≤ 1,2 с. Easing `[0.22, 1, 0.36, 1]`, для интерактива spring `{ stiffness: 300, damping: 30 }`. Анимируются только `transform` и `opacity`, каждое появление — один раз. При `prefers-reduced-motion` всё выключено, на тач-устройствах нет эффектов курсора.
