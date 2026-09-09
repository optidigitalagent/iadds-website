# iADDS package implementation report

Дата: 2026-09-09. Изменено существующее приложение apps/antonov-digital, Next.js + TypeScript. Родительское Vite-приложение сохранено.

## 1. Полный аудит и приоритет источников

Прочитаны оба документа handoff до конца (основной — 1697 строк); отдельный addendum входит в него дословно. Приоритет: FINAL MANDATORY OVERRIDE → v3 → совместимые положения обоих source packages → прежняя реализация. Оба архива распакованы; 125 файлов повторно проверены SHA-256 после обработки. 41 уникальный service asset (27 MP4, 14 AVIF), 52 curated-копии, 7 founder-фото, 1 исходник логотипа, 7 contact sheets. Повреждённых или отсутствующих файлов: 0. Все видео полностью декодированы FFmpeg, AVIF — Sharp; метаданные JSON/CSV/TSV сверены.

Полный пофайловый и попапочный реестр: [iadds-source-coverage.md](../docs/implementation/iadds-source-coverage.md). Машинные данные: [source inventory](../docs/implementation/iadds-source-inventory.json), [source integrity](iadds-v3/source-integrity.json). Старый Master полностью сохранён по содержанию с финальными заменами названия/фото; карта всех разделов 0–29: [implementation map](../docs/ai-content-v1-implementation-map.md).

### Source package usage

[Полная таблица всех 125 source files](../docs/implementation/iadds-source-coverage.md#source-package-usage) содержит how used, destination files/routes, validation и remaining external dependency для каждого файла. Она является приложением к этому отчёту.

## 2. Бренд iADDS

Единая настройка src/content/site/settings.ts: iADDS; endorsement By Antonov Digital; компания Antonov Digital; Founder & CEO of Antonov Digital. Обновлены header/footer/menu, title/description, schema Brand, Open Graph, favicon, Apple icon links, project label в webhook и analytics properties. Контакты и подтверждённые факты не выдуманы.

Исходник: iADDS_logo_source_black_square.png, SHA-256 d0923f90312fbb8134be06b983e592929c069fc2e5dec6ec7416ea1e95da9488. Вырезан только реальный символ, чёрный фон переведён в alpha; wordmark — читаемый HTML. Белая версия ограничивает glow. SVG lockup содержит растровый символ и векторный текст: это не заявляется настоящим векторным мастер-файлом; needsVectorMaster=true.

- public/media/brand/iadds-favicon-32.png
- public/media/brand/iadds-favicon-48.png
- public/media/brand/iadds-symbol-128.png
- public/media/brand/iadds-symbol-256.png
- public/media/brand/iadds-symbol-white-128.png
- public/media/brand/iadds-app-180.png
- public/media/brand/iadds-horizontal.svg
- public/media/brand/iadds-endorsed.svg

## 3. Все девять услуг

| Slug | Card ID | Featured ID | Нижняя галерея / пары | Coverage |
| --- | --- | --- | --- | --- |
| ai-video-ads | 6 | 34 | 6, 8, 13, 40 | strong |
| product-visuals | 12 | 11 | 1, 4, 12, 24 | strong |
| virtual-models | 40 | 40 | 17, 21, 25 | temporary |
| ai-ugc | 41 | 15 | 19, 26, 41 | strong |
| ai-spokesperson | 19 | 19 | 15 | temporary |
| video-localization | fallback | — | честное пустое состояние | missing |
| explainer-videos | 29 | 29 | 20, 35, 28 | temporary |
| brand-characters | 32 | 32 | 27, 18, 37 | temporary |
| performance-creatives | 30+33 | — | 30+33; 17+23; 22+36 | paired |

Product Visuals использует разрешённый финальным override still ID 12 в карточке для экономии initial transfer и снижения количества видео-превью; motion ID 11 остаётся featured. Для AI Video Ads выбран featured 34 за выразительную композицию, отличный от card 06. На homepage и /services используются те же карты. Featured исключён из нижней галереи; максимум 5. Virtual Models и Spokesperson явно обозначены как временные форматы. Video Localization не содержит чужих примеров; предусмотрены типизированные original/localized pairs. Performance Creatives — три сравнения одного продукта. 28/35 обозначены motion-дизайном, 18/27/37 — поддерживающим визуальным миром бренда. Все подборки совпадают между UK/EN.

## 4. Обработка медиа, права и производительность

30 выбранных источников → 162 приватных производных: 4 AVIF/WebP poster/image варианта каждого источника и 2 MP4 каждого выбранного видео. Видео preview — без звука, H.264, до 400 px, 24 fps, до 4.5 с, faststart; detail — родное разрешение, H.264, исходная длительность, AAC при наличии звука. У источников 06/40 poster выбран на 3 с, 30 — на 2 с. Все конкретные размеры, байты, длительности, аудиофлаги и пути приведены в полном реестре.

Постеры идут первыми; MP4 src подключается только при разрешённом действии. Один активный плеер, остановка при уходе из viewport/маршрута/вкладки. Touch, Save-Data и reduced-motion используют poster. Детальный просмотр запускается кнопкой с native controls. Соотношения сторон сохранены, 500×376 не растягиваются в полноширинный hero. Ошибка видео возвращает poster.

Все 41 approval records остаются unverified; автоматического разрешения прав нет. Production-фильтр и publish helper требуют evidence, reviewer, date, approved review и production scope по каждому ID. Приватные файлы находятся в .data/iadds-media, production — только в public/media/examples после individual approval. Каталог с исходными именами, hash, tags и путями не сериализуется в client props. Подробнее: [architecture](../docs/implementation/iadds-media-architecture.md).

## 5. Все семь фото основателя

Главная: один jetski, мини-GoPro и его декоративная обёртка удалены. About: портрет → timeline → хоккейная пара → GoPro/вода → лодка → полный рост city и философия. 28 адаптивных AVIF/WebP, EXIF/XMP/IPTC удалены, оригиналы неизменны.

### founder_close_portrait.png

- ID / назначение: portrait; About introduction only.
- Alt keys: founder.portrait.uk; founder.portrait.en.
- UK alt: Артем Антонов у кепці біля моря.
- EN alt: Artem Antonov wearing a cap by the sea.
- Privacy: Reviewed clothing, equipment and background; no readable sensitive personal identifiers. Equipment/team marks are incidental personal-history context.
- SHA-256: 085c1f3a59f1e498427f8073c4c87f9a97e559a6a7ce5c7190470b6bdc7f804c.

| Публичный файл | Размер | Байт | Crop исходника |
| --- | --- | ---: | --- |
| public/media/founder/portrait-desktop.avif | 680×986 | 19588 | {"left":43,"top":294,"width":680,"height":986} |
| public/media/founder/portrait-desktop.webp | 680×986 | 36660 | {"left":43,"top":294,"width":680,"height":986} |
| public/media/founder/portrait-mobile.avif | 640×920 | 17819 | {"left":29,"top":282,"width":694,"height":998} |
| public/media/founder/portrait-mobile.webp | 640×920 | 33132 | {"left":29,"top":282,"width":694,"height":998} |

### founder_hockey_team_action.png

- ID / назначение: hockey-team; About hockey — teamwork.
- Alt keys: founder.hockey-team.uk; founder.hockey-team.en.
- UK alt: Артем під час хокейного матчу поруч з іншим гравцем.
- EN alt: Artem in a hockey match alongside another player.
- Privacy: Reviewed clothing, equipment and background; no readable sensitive personal identifiers. Equipment/team marks are incidental personal-history context.
- SHA-256: 7f717c45ccb71f9350cd280f533a4e1456ba464d46daf71089cc2180d0a5710e.

| Публичный файл | Размер | Байт | Crop исходника |
| --- | --- | ---: | --- |
| public/media/founder/hockey-team-desktop.avif | 1075×711 | 34997 | {"left":77,"top":59,"width":1075,"height":711} |
| public/media/founder/hockey-team-desktop.webp | 1075×711 | 73894 | {"left":77,"top":59,"width":1075,"height":711} |
| public/media/founder/hockey-team-mobile.avif | 640×606 | 21509 | {"left":282,"top":42,"width":832,"height":788} |
| public/media/founder/hockey-team-mobile.webp | 640×606 | 45366 | {"left":282,"top":42,"width":832,"height":788} |

### founder_hockey_puck_action.png

- ID / назначение: hockey-puck; About hockey — concentration.
- Alt keys: founder.hockey-puck.uk; founder.hockey-puck.en.
- UK alt: Артем веде шайбу під час хокейного матчу.
- EN alt: Artem guiding the puck during a hockey match.
- Privacy: Reviewed clothing, equipment and background; no readable sensitive personal identifiers. Equipment/team marks are incidental personal-history context.
- SHA-256: fbed41c5b3445561fe847f7fffb03fbac49f12e94a83a955541c5259835ff9b2.

| Публичный файл | Размер | Байт | Crop исходника |
| --- | --- | ---: | --- |
| public/media/founder/hockey-puck-desktop.avif | 896×758 | 23949 | {"left":192,"top":34,"width":896,"height":758} |
| public/media/founder/hockey-puck-desktop.webp | 896×758 | 47084 | {"left":192,"top":34,"width":896,"height":758} |
| public/media/founder/hockey-puck-mobile.avif | 640×635 | 16562 | {"left":346,"top":34,"width":781,"height":775} |
| public/media/founder/hockey-puck-mobile.webp | 640×635 | 30978 | {"left":346,"top":34,"width":781,"height":775} |

### founder_fullbody_city.png

- ID / назначение: urban; About philosophy transition — contained full figure, maximum 300px wide.
- Alt keys: founder.urban.uk; founder.urban.en.
- UK alt: Артем на міській прогулянці, кадр на повний зріст.
- EN alt: Full-length photograph of Artem at an urban event.
- Privacy: Final override: contained full image in a small 300px editorial frame preserves full figure. No weapon-related copy, emphasis or aggressive cover crop. Public derivative is resized and metadata-stripped.
- SHA-256: 47b76929316b8c00a56204f3f3473af25d8ec033d207ca39c518115cee49bfc1.

| Публичный файл | Размер | Байт | Crop исходника |
| --- | --- | ---: | --- |
| public/media/founder/urban-desktop.avif | 600×800 | 43447 | {"left":0,"top":0,"width":960,"height":1280} |
| public/media/founder/urban-desktop.webp | 600×800 | 102768 | {"left":0,"top":0,"width":960,"height":1280} |
| public/media/founder/urban-mobile.avif | 480×640 | 28389 | {"left":0,"top":0,"width":960,"height":1280} |
| public/media/founder/urban-mobile.webp | 480×640 | 67138 | {"left":0,"top":0,"width":960,"height":1280} |

### founder_gopro.png

- ID / назначение: gopro; About technology and filming.
- Alt keys: founder.gopro.uk; founder.gopro.en.
- UK alt: Артем показує GoPro біля води.
- EN alt: Artem holding a GoPro by the water.
- Privacy: Reviewed clothing, equipment and background; no readable sensitive personal identifiers. Equipment/team marks are incidental personal-history context.
- SHA-256: 178d7c49a285999cd30dbbe7478384f35921c6be395860c8f8be26d38b010b73.

| Публичный файл | Размер | Байт | Crop исходника |
| --- | --- | ---: | --- |
| public/media/founder/gopro-desktop.avif | 902×902 | 40859 | {"left":58,"top":282,"width":902,"height":902} |
| public/media/founder/gopro-desktop.webp | 902×902 | 84354 | {"left":58,"top":282,"width":902,"height":902} |
| public/media/founder/gopro-mobile.avif | 640×719 | 29400 | {"left":163,"top":320,"width":797,"height":896} |
| public/media/founder/gopro-mobile.webp | 640×719 | 60134 | {"left":163,"top":320,"width":797,"height":896} |

### founder_boat.png

- ID / назначение: boat; About cinematic water chapter.
- Alt keys: founder.boat.uk; founder.boat.en.
- UK alt: Артем на човні під відкритим небом.
- EN alt: Artem on a boat under the open sky.
- Privacy: Lower hull and registration completely excluded from both crops.
- SHA-256: 161da207ee43897c1a962b737484c6c0e9081f048c4cae1469f2f55e9ecc2921.

| Публичный файл | Размер | Байт | Crop исходника |
| --- | --- | ---: | --- |
| public/media/founder/boat-desktop.avif | 960×640 | 19282 | {"left":0,"top":256,"width":960,"height":640} |
| public/media/founder/boat-desktop.webp | 960×640 | 35556 | {"left":0,"top":256,"width":960,"height":640} |
| public/media/founder/boat-mobile.avif | 547×717 | 16294 | {"left":355,"top":230,"width":547,"height":717} |
| public/media/founder/boat-mobile.webp | 547×717 | 32514 | {"left":355,"top":230,"width":547,"height":717} |

### founder_main_jetski.jpg

- ID / назначение: jetski; Homepage main founder visual; About water context.
- Alt keys: founder.jetski.uk; founder.jetski.en.
- UK alt: Артем на водному мотоциклі біля берега.
- EN alt: Artem on a jet ski near the shore.
- Privacy: Readable hull registration blurred before both crops.
- SHA-256: 0870b0ab32c1b1b1db50a79673aa67548654b8e3ddab5956442b76678eeddf71.

| Публичный файл | Размер | Байт | Crop исходника |
| --- | --- | ---: | --- |
| public/media/founder/jetski-desktop.avif | 640×499 | 15123 | {"left":0,"top":0,"width":640,"height":499} |
| public/media/founder/jetski-desktop.webp | 640×499 | 31910 | {"left":0,"top":0,"width":640,"height":499} |
| public/media/founder/jetski-mobile.avif | 538×525 | 14223 | {"left":51,"top":0,"width":538,"height":525} |
| public/media/founder/jetski-mobile.webp | 538×525 | 29136 | {"left":51,"top":0,"width":538,"height":525} |

City сохранён в полный рост, frame 3:4 максимум 300 px desktop / 240 px mobile, contain; предмет в кадре не акцентирован, нет оружейной подписи. Это явное применение нового override вместо прежнего крупного head crop. Регистрационная надпись jetski размыта с мягкой границей; нижняя часть корпуса лодки с регистрацией исключена crop.

## 6. Добавлено, изменено, удалено, скрыто и резерв

ADD: typed catalog, approvals, service maps, example/featured/variation components, private review endpoint, poster-first derivatives, brand assets, runtime validation, source reports. CHANGE: бренд, карточки и детали 9 услуг, founder sequence/crops, компактный footer, OG/schema, webhook/analytics label. REMOVE: прежний favicon.svg, home mini-GoPro/его wrapper и ненужные стили. KEEP: Next architecture, все slugs, существующий контент UK/EN и рабочая форма с честной ошибкой провайдера. HIDE: неподтверждённые примеры в production, внутренние документы/ценовые оценки, Moda Castle. RESERVE: 02,03,05,07,09,10,14,16,31,38,39 — исключены финальной редакционной подборкой, оригиналы доступны в приватном пакете.

Мобильный footer: бренд → одна CTA → 5 основных ссылок → 4 контакта → языки → только реально заданные legal links → copyright. Несуществующие legal страницы не созданы. Минимальная высота цели 44 px; для узких экранов одна колонка. Header использует container queries для доступной ширины при zoom.

## 7. Недостающие материалы и ограничения

Нужны подтверждения прав на 41 сервисный источник; настоящий vector master логотипа; 3 fashion-примера; business presenter/branded avatar/один presenter на двух языках; 3–5 localization before/after pairs; 2–3 SaaS/service/workflow explainer; 2–3 последовательных mascot systems. Поля замены и критерии: [missing materials](../docs/implementation/iadds-missing-materials.md).

Production submission provider остаётся не настроен: форма валидирует данные и честно сообщает невозможность отправки; тест реального сохранения выполняется на локальном test provider, внешние сообщения не отправлялись. Не выдуманы booking, legal entity, отзывы, права или клиентские результаты. Analytics adapter подготовлен, реальный провайдер не подключён.

## 8. Клиентские кейсы

Moda Castle остаётся draft; нет публичного кейса, навигации, sitemap, schema/rating. service examples не повышают статус до client work. Guard отклоняет review/format-media URL как доказательство опубликованного кейса. Будущая публикация требует реальных материалов и отдельных подтверждений.

## 9. Проверки и фактические результаты

Local browser review: **passed**. 9 ширин, 18 проверок Axe. JavaScript errors: 0. Initial transfer: 413669 bytes; initial media: 203121 bytes; initial MP4 requests: 0.

[Подробные browser results](iadds-v3/browser-review.json); screenshots: qa/screenshots/iadds-v3. Увеличение до 200% проверено CSS zoom; это не имитирует все особенности системного browser zoom.

Финальные проверки и публикация:

```json
{
  "status": "completed",
  "lint": "passed",
  "typecheck": "passed",
  "unit": {
    "passed": 37,
    "failed": 0
  },
  "e2e": {
    "startTime": "2026-09-09T20:59:14.668Z",
    "duration": 193462.633,
    "expected": 36,
    "skipped": 0,
    "unexpected": 0,
    "flaky": 0
  },
  "localReview": "passed",
  "slowNetwork": "passed",
  "productionWorker": "passed",
  "productionArtifact": "passed",
  "productionNextBuild": "passed",
  "optimizedReviewBuild": "passed",
  "openNextAndWorkerBuild": "passed",
  "dependencies": {
    "info": 0,
    "low": 0,
    "moderate": 0,
    "high": 0,
    "critical": 0,
    "total": 0
  },
  "lighthouse": [
    {
      "page": "uk-home",
      "performance": 85,
      "accessibility": 100,
      "seo": 100,
      "bestPractices": 100,
      "lcpMs": 3384.448,
      "cls": 0,
      "tbtMs": 291.36799999999994
    },
    {
      "page": "uk-service",
      "performance": 89,
      "accessibility": 100,
      "seo": 100,
      "bestPractices": 100,
      "lcpMs": 3110.092,
      "cls": 0,
      "tbtMs": 242
    },
    {
      "page": "uk-consultation",
      "performance": 90,
      "accessibility": 100,
      "seo": 100,
      "bestPractices": 100,
      "lcpMs": 2894.8319500000002,
      "cls": 0.003715723068540195,
      "tbtMs": 254.19467499999973
    },
    {
      "page": "en-home",
      "performance": 84,
      "accessibility": 100,
      "seo": 100,
      "bestPractices": 100,
      "lcpMs": 3146.2864999999993,
      "cls": 0.0005934073970477441,
      "tbtMs": 380
    }
  ],
  "performanceLimit": "Simulated mobile lab measurements on this constrained PC, not field Core Web Vitals; other validation was running concurrently.",
  "externalDependencies": [
    "41 per-asset rights confirmations",
    "actual vector master",
    "missing category examples",
    "persistent production consultation receiver",
    "client case evidence and permissions",
    "real legal texts / analytics provider"
  ],
  "sites": {
    "url": "https://iadds-by-antonov-digital.funckj.chatgpt.site",
    "audience": "owner-only",
    "status": "succeeded",
    "version": 1,
    "environmentRevision": 1,
    "sourceCommit": "8c682f38eec6036d5faa22e8883c2d23c56e5bdf",
    "browserHandoff": "Existing tab navigation was blocked by Browser Use URL policy because that tab contained a data: connection-error page from stopped localhost. Deployment itself succeeded; use the returned Sites URL."
  },
  "archive": {
    "status": "passed",
    "fileCount": 126,
    "sha256": "db3fc5ee2c8e875bf84d722127d34d4c1b8bd92366243d6f94d9363bfce747f2",
    "bytes": 4803677,
    "symlinks": 0,
    "matchesValidatedArtifact": true
  },
  "screenshotValidation": {
    "uk": "passed",
    "en": "passed"
  }
}
```

## 10. Где вносить будущие изменения

| Изменение | Точное место |
| --- | --- |
| Имя, endorsement, founder role, контакты | src/content/site/settings.ts |
| Logo files / генератор | public/media/brand; scripts/generate-iadds-brand.mjs |
| Card/featured/gallery/paired IDs | src/content/site/service-media-map.ts |
| Локализованные alt/coverage/empty labels | src/content/site/media-copy.ts |
| Индивидуальные права | src/content/internal/media-approvals.json |
| Каталог/новые derivatives | scripts/generate-iadds-media.mjs → src/content/internal/media-catalog.ts |
| Storage/CDN и минимальные client props | src/lib/media/service-media.ts |
| Production gate | src/lib/media/policy.ts; scripts/validate-iadds-media.ts; scripts/publish-approved-media.ts |
| Playback/gallery UI | src/components/services/format-media.tsx; service-examples.tsx; format-media.module.css |
| Founder crops, privacy и alt | scripts/generate-founder-media.mjs; src/content/site/founder-media.ts |
| About/home founder order | src/components/sections/experience-sections.tsx |
| Footer | src/components/layout/site-layout.tsx; layout.module.css |
| Case publication | src/lib/content/index.ts; src/content/cases/index.ts |
| Submission provider | src/lib/consultation/provider.ts; production env CONSULTATION_WEBHOOK_URL / SECRET |
| Review build/run | npm run build:review; npm run preview:review (127.0.0.1:3100) |
| Production build / adapter | scripts/build-production.mjs; open-next.config.ts; scripts/stage-sites.mjs |

Полный список изменений относительно начала этой реализации: [changed-files.json](iadds-v3/changed-files.json).


Публичные маршруты этой итерации сохранены; добавлен только служебный локальный GET /api/format-media/[filename]. Ранее добавленные /ai-systems и /pricing сохранены. Основные тексты услуг, цены, FAQ, timeline и founder story: src/content/{uk,en}/{services,experience,process,site}.ts; коммерческие поля: src/content/site/service-commercial.ts.

Хостинг сохраняет Next.js через официальный OpenNext adapter: [OpenNext guide](https://opennext.js.org/cloudflare/get-started), [Cloudflare framework guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/). Локальная Windows-обёртка Sites build-site.mjs ошиблась при поиске npm-cli; тот же package build успешно выполнен напрямую. Для упаковки используется штатный Sites helper через установленный Git Bash. Это ограничение локального инструмента, а не отключённая проверка приложения.


Публикация завершена: https://iadds-by-antonov-digital.funckj.chatgpt.site (приватно, версия 1). Локальная дата завершения: 10 сентября 2026, Asia/Hebron. Все 126 файлов архива побайтно совпали с проверенным production artifact; неподтверждённых бинарников — 0. Полный checksum архивов: qa/iadds-v3/source-archives.json.

После полного E2E-прогона переносимость OG была исправлена отдельно; оба PNG и все 20 основных маршрутов повторно проверены уже на точном Worker из публикационного архива. Lighthouse отражает лабораторный мобильный запуск на этом ПК, а не измерение реальных посетителей.

Техническое ограничение передачи вкладки: Browser Use URL policy остановила переход из старой data: страницы ошибки localhost. Sites подтвердил успешную публикацию; сайт доступен владельцу по ссылке выше. Ошибка переключения вкладки не меняет статус публикации.
