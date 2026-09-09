# AI Content by Antonov Digital — Package v1

9 сентября 2026. Обновлено существующее приложение `apps/antonov-digital` на Next.js + TypeScript. Изменения соседних проектов не затрагивались. Публикация на внешнем хостинге не выполнялась.

## Реализованный результат

- UK по умолчанию, полноценная EN-версия, сохранение маршрута и контекста при переключении языка.
- Главная начинается с компактного вступления и девяти услуг в четырёх группах. Далее: нестандартная задача → бесплатный тест → условный реальный кейс → две модели → семь этапов → Why now → pricing → единая глава компании/основателя → 13 FAQ → консультация → контакты.
- Добавлены `/uk/ai-systems`, `/en/ai-systems`, `/uk/pricing`, `/en/pricing`. AI Systems не входит в девять карточек. Pricing доступен из контента и footer, без нового пункта в header.
- Все девять страниц услуг используют единый шаблон, утверждённые названия, паспорта результатов/форматов/входных материалов, условия теста и ценовые ориентиры. Четыре контекстных CTA, последний перед related services.
- About содержит биографию, обучение, восемь пунктов timeline, шесть компетенций, шесть принципов, ответственность основателя, философию, хоккей/Sokol, водную историю и девять направлений экосистемы.
- Команда — Artem Antonov и нераскрывающий имя партнёр-разработчик. `Artem Antonov — Founder & CEO of Antonov Digital` используется дословно. `30+` проектов и около `50` дополнительных тестов остаются отдельными фактами. Цель примерно в 100 клиентов обозначена как будущее видение.
- Бесплатный тест: 1–2 полноценных рекламных видео, полное качество без watermark, обычно 1–2 рабочих дня после материалов, без оплаты до согласования полного проекта. Специальные тесты отдельных услуг сохранены по их паспортам. Права использования теста согласуются письменно для конкретной задачи.
- Публичная цена от $5 относится к простым статичным вариациям; короткие видео — от $15; сложные задачи оцениваются отдельно. Внутренние диапазоны разработки и инфраструктуры не публикуются. Карта/USDT находятся во вторичном контексте Pricing/FAQ.

## Source package usage

Весь канонический пакет был распакован и прочитан до основной реализации. Implementation coverage matrix создана до изменений приложения. Повторно приложенные копии ZIP/v2/addendum имеют совпадающие SHA-256 и не импортировались повторно. Оригиналы находятся вне `public`; исходные документы не загружаются в клиентский код.

| Source file | Использование | Назначение | Проверка | Внешняя зависимость |
| --- | --- | --- | --- | --- |
| `AI_Content_Site_Package_v1 (1).zip` | Каноническая распаковка трёх документов и семи фотографий | Временная входная папка; в приложении только структурированные данные и производные изображения | Состав, точные имена, SHA-256 | Нет |
| `AI_Content_Site_Agent_Implementation_Prompt_v2.txt` | Актуальный execution checklist и включённый addendum | Маршруты, шаблоны, локализация, QA | Сопоставление с матрицей Master 0–29 | Реальный provider и материалы кейса |
| `AI_Content_Package_Usage_Addendum.txt` | Полнота использования, source precedence, приватность, публикация и формат отчёта | Матрица, manifests, guards, этот отчёт | Полное чтение; финальный source audit | Нет |
| `AI_Content_Site_Agent_Implementation_Prompt_v1.txt` | Checklist внутри ZIP | Проверка объёма реализации | Полное чтение; факты определяет Master | Нет |
| `AI_Content_Master_Website_Content_v1.md` | Источник публичного copy и внутренних ограничений | `src/content/[locale]`, `src/content/site`, internal policy, cases, page templates | Все разделы 0–29 классифицированы; 100 публичных и 10 draft-абзацев найдены дословно | Условия публикации Moda Castle |
| `FOUNDER_ASSET_MAP.md` | Порядок, роли и обработка семи реальных фотографий | FounderStory, home preview, генератор и media manifest | Визуальный осмотр, метаданные, responsive decode | Нет |

| Founder source | Реальное размещение | Производные файлы (width × height) | Проверка / зависимость |
| --- | --- | --- | --- |
| 01_founder_portrait_sea_cap.png | About introduction; home founder preview | [portrait-desktop.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/portrait-desktop.avif>) (651 × 864)<br>[portrait-desktop.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/portrait-desktop.webp>) (651 × 864)<br>[portrait-mobile.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/portrait-mobile.avif>) (607 × 806)<br>[portrait-mobile.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/portrait-mobile.webp>) (607 × 806) | SHA-256 unchanged; metadata/crop/decode checked. Нет отсутствующего asset. |
| 02_founder_hockey_team_action.png | About hockey — teamwork | [hockey-team-desktop.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-team-desktop.avif>) (1075 × 711)<br>[hockey-team-desktop.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-team-desktop.webp>) (1075 × 711)<br>[hockey-team-mobile.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-team-mobile.avif>) (602 × 762)<br>[hockey-team-mobile.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-team-mobile.webp>) (602 × 762) | SHA-256 unchanged; metadata/crop/decode checked. Нет отсутствующего asset. |
| 03_founder_hockey_puck_action.png | About hockey — concentration | [hockey-puck-desktop.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-puck-desktop.avif>) (896 × 758)<br>[hockey-puck-desktop.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-puck-desktop.webp>) (896 × 758)<br>[hockey-puck-mobile.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-puck-mobile.avif>) (640 × 767)<br>[hockey-puck-mobile.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-puck-mobile.webp>) (640 × 767) | SHA-256 unchanged; metadata/crop/decode checked. Нет отсутствующего asset. |
| 04_founder_urban_event_source.png | About small lifestyle transition | [urban-desktop.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/urban-desktop.avif>) (230 × 262)<br>[urban-desktop.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/urban-desktop.webp>) (230 × 262)<br>[urban-mobile.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/urban-mobile.avif>) (192 × 230)<br>[urban-mobile.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/urban-mobile.webp>) (192 × 230) | SHA-256 unchanged; metadata/crop/decode checked. Нет отсутствующего asset. |
| 05_founder_gopro_water.png | About technology and filming | [gopro-desktop.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/gopro-desktop.avif>) (902 × 902)<br>[gopro-desktop.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/gopro-desktop.webp>) (902 × 902)<br>[gopro-mobile.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/gopro-mobile.avif>) (640 × 719)<br>[gopro-mobile.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/gopro-mobile.webp>) (640 × 719) | SHA-256 unchanged; metadata/crop/decode checked. Нет отсутствующего asset. |
| 06_founder_boat.png | About cinematic water chapter | [boat-desktop.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/boat-desktop.avif>) (960 × 640)<br>[boat-desktop.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/boat-desktop.webp>) (960 × 640)<br>[boat-mobile.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/boat-mobile.avif>) (547 × 717)<br>[boat-mobile.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/boat-mobile.webp>) (547 × 717) | SHA-256 unchanged; metadata/crop/decode checked. Нет отсутствующего asset. |
| 07_founder_jetski.jpg | About philosophy and final CTA | [jetski-desktop.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/jetski-desktop.avif>) (640 × 602)<br>[jetski-desktop.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/jetski-desktop.webp>) (640 × 602)<br>[jetski-mobile.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/jetski-mobile.avif>) (480 × 602)<br>[jetski-mobile.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/jetski-mobile.webp>) (480 × 602) | SHA-256 unchanged; metadata/crop/decode checked. Нет отсутствующего asset. |

Все 28 производных файлов вместе занимают **855843 байт**. Оригинальные SHA-256 совпадают с начальным manifest. Метаданные EXIF/XMP/IPTC удалены. У каждой фотографии есть UK/EN alt, явные размеры, desktop/mobile crop и AVIF/WebP; ниже первого экрана применяется lazy loading. Полный городской кадр не публикуется: объект, похожий на оружие, и посторонние исключены из crop. Регистрация лодки исключена кадрированием, номер водного мотоцикла размыт. Логотипы команды и техники не выдаются за партнёрства.

## Проверки и доказательства

| Проверка | Результат текущей итерации |
| --- | --- |
| Content validation | 9 услуг × 2 языка, 0 опубликованных кейсов, обязательные структуры и parity пройдены |
| Source copy audit | 100 публичных + 10 draft-абзацев, 0 несовпадений среди проверяемых standalone-абзацев длиннее 65 символов |
| Rendered copy audit | Все 148 полей новой experience-модели каждой локали присутствуют в готовом HTML без script/style |
| Unit/integration | 32/32, включая submission, idempotency, guards, locale parity, media metadata |
| ESLint | Полная проверка с zero warnings пройдена; изменённые после неё accessibility-компоненты перепроверены отдельно |
| TypeScript | `next typegen && tsc --noEmit` пройден; итоговый build также прошёл проверку типов |
| Production build | Next 16.3.4, Webpack, 41/41 статических результатов, exit 0 |
| Chromium E2E | 36/36, 0 skipped/flaky/unexpected, 4,2 минуты |
| Финальная проверка после accessibility-правок | 6 passed; 0 unexpected; 0 skipped |
| Axe | 0 нарушений на 10 типах страниц × 2 локали |
| Навигация/HTTP/SEO | 18 service URLs, новые страницы, locale/query/hash, canonical/hreflang, 34 sitemap URLs, два OG PNG, настоящие 404 |
| Mobile | Главная/услуга/форма: 320, 360, 375, 390, 430, 768, 1024, 1440, 1920; AI Systems/Pricing/About: 320, 360, 375, 390, 430, 768, 1440; остальные типы также проверены при 375 |
| Keyboard/motion | Dialog focus trap, Escape и возврат фокуса, FAQ, sticky CTA, reduced motion, poster-first, no-JavaScript form |
| Media | 7 исходников без изменений, 28 файлов; правильный AVIF crop декодирован при 390/1440 для обоих языков |
| Приватность сборки | В `.next/static` и готовом HTML нет внутренних маркеров, внутренних диапазонов и draft-истории; исходного ZIP/документов/полных фото нет в public |

Автоматическая сверка длинных абзацев нормализует только пробелы, типографику апострофов и тире. Короткие заголовки, списки, внутренние правила и размещение контента проверены отдельно по матрице; число 110 не выдаётся за весь набор требований.

Форма проверена с реальным route handler и локальным provider на 3101: synthetic-заявки записаны в `.data/e2e/<referenceId>.json`, затем прочитаны обратно. Проверены service, model, текущая локаль, предпочитаемый язык, allowlisted sourcePage, серверный timestamp и reference ID. Production на 3100 возвращает 503 без настроенного receiver, сохраняет ввод и не показывает фиктивное подтверждение. Нет выдуманных calendar slots или Google Meet booking.

После полного E2E исправлены доступные названия языков и семантика логотипа по дополнительному предупреждению Lighthouse. Также уточнена сетка будущего кейса для одного ряда из двух/трёх результатов. Итоговая сборка и соответствующие браузерные проверки выполнены повторно; публикация кейса не включалась.

## Lighthouse

| Страница | Performance | Accessibility | Best practices | SEO | LCP | TBT |
| --- | --- | --- | --- | --- | --- | --- |
| uk-home | 87 | 100 | 100 | 100 | 2.2 s | 470 ms |
| uk-service | 92 | 100 | 100 | 100 | 2.4 s | 270 ms |
| uk-consultation | 90 | 100 | 100 | 100 | 1.9 s | 400 ms |
| en-home | 93 | 100 | 100 | 100 | 2.8 s | 190 ms |

Это локальные лабораторные замеры на production build с обычным simulated mobile throttling Lighthouse. CLS и остальные фактические показатели доступны в JSON-отчётах. Значения производительности приведены без подмены прежними результатами; локальная нагрузка и ограниченные ресурсы влияют на повторяемость. Реальная статистика Core Web Vitals после публикации пока отсутствует.

## Артефакты

- [docs/ai-content-v1-implementation-map.md](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/docs/ai-content-v1-implementation-map.md>)
- [docs/founder-media-manifest.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/docs/founder-media-manifest.json>)
- [qa/package-v1-source-audit.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-source-audit.json>)
- [qa/package-v1-source-hashes.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-source-hashes.json>)
- [qa/package-v1-rendered-copy.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-rendered-copy.json>)
- [qa/package-v1-browser.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-browser.json>)
- [qa/package-v1-followup.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-followup.json>)
- [qa/package-v1-unit.log](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-unit.log>)
- [qa/package-v1-lint.log](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-lint.log>)
- [qa/package-v1-typecheck.log](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-typecheck.log>)
- [qa/package-v1-build.log](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-build.log>)
- [qa/package-v1-content.log](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-content.log>)
- [qa/package-v1-lighthouse.log](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-lighthouse.log>)
- [qa/screenshots/home-uk-1440.png](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/home-uk-1440.png>)
- [qa/screenshots/home-uk-390.png](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/home-uk-390.png>)
- [qa/screenshots/home-en-1440.png](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/home-en-1440.png>)
- [qa/screenshots/service-uk-1440.png](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/service-uk-1440.png>)
- [qa/screenshots/service-uk-375.png](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/service-uk-375.png>)
- [qa/screenshots/package-v1/ai-systems-uk-1440.png](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/package-v1/ai-systems-uk-1440.png>)
- [qa/screenshots/package-v1/ai-systems-uk-390.png](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/package-v1/ai-systems-uk-390.png>)
- [qa/screenshots/package-v1/pricing-uk-1440.png](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/package-v1/pricing-uk-1440.png>)
- [qa/screenshots/package-v1/pricing-uk-390.png](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/package-v1/pricing-uk-390.png>)
- [qa/screenshots/package-v1/about-uk-1440.png](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/package-v1/about-uk-1440.png>)
- [qa/screenshots/package-v1/about-uk-390.png](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/package-v1/about-uk-390.png>)
- [qa/screenshots/consultation-uk-1440.png](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/consultation-uk-1440.png>)
- [qa/screenshots/form-validation-uk-375.png](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/form-validation-uk-375.png>)
- [qa/screenshots/form-success-uk-375.png](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/form-success-uk-375.png>)
- [qa/screenshots/cases-empty-uk-1440.png](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/cases-empty-uk-1440.png>)
- [qa/screenshots/package-v1/mobile-review-sheet.jpg](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/screenshots/package-v1/mobile-review-sheet.jpg>)
- [qa/lighthouse-uk-home.report.html](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/lighthouse-uk-home.report.html>)
- [qa/lighthouse-uk-home.report.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/lighthouse-uk-home.report.json>)
- [qa/lighthouse-uk-service.report.html](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/lighthouse-uk-service.report.html>)
- [qa/lighthouse-uk-service.report.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/lighthouse-uk-service.report.json>)
- [qa/lighthouse-uk-consultation.report.html](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/lighthouse-uk-consultation.report.html>)
- [qa/lighthouse-uk-consultation.report.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/lighthouse-uk-consultation.report.json>)
- [qa/lighthouse-en-home.report.html](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/lighthouse-en-home.report.html>)
- [qa/lighthouse-en-home.report.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/lighthouse-en-home.report.json>)
- [qa/changed-files.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/changed-files.json>)

Скриншоты включают UK home 1440/390, EN home 1440, UK service 1440/375, обе локали AI Systems/Pricing/About 1440/390, форму по умолчанию, validation, honest error и реальный local success, мобильное меню и truthful empty cases. Полные страницы About и мобильный обзор просмотрены визуально. Артефакты скриншотов и Lighthouse игнорируются Git, но сохранены в рабочей папке.

## Скрытое содержимое и публикация кейсов

`src/content/cases/index.ts` хранит Moda Castle как draft с утверждённой историей UK/EN. `isPublishedCase`, `getPublishedCases`, `getCaseBySlug` и `shouldShowCasesInNavigation` управляют публикацией и навигацией. Черновой URL возвращает 404, отсутствует в sitemap и case schema; пустая Cases page — noindex и без пункта в основной навигации.

Для публикации нужны подтверждённое официальное написание бренда, разрешение/дата, запись интерфейса бота, исходное фото одежды, 2–3 реальных согласованных результата, внешняя ссылка на публикацию клиента и проверенный отзыв. `contextMedia.interface` и `contextMedia.input` предусмотрены в обеих локалях и идут перед рядом результатов. У media требуются client/approved status, permission, размеры и alt; видео требует poster. Отзыв содержит настоящее имя, роль, бизнес, текст, verification и источник согласования. Аватар публикуется только с разрешением, рейтинг — только при реально полученной оценке. Изменение одного `status` не активирует кейс. После заполнения данных выставляются `approvals.clientNameVerified`, `approvals.clientPublication`, `approvals.approvedAt` и `status: 'published'`, затем выполняются validation/tests/build.

## Что удалено и где редактировать

Удалены устаревшие утверждения о четырёх людях, старый founder placeholder, отдельные дублирующие team/founder/benefits-секции, их неиспользуемые словари и CSS. Большой hero перед каталогом отсутствует. Рабочие primitives, форма, architectural artwork и реальные контакты сохранены. Реальные клиентские видео/отзывы не заменялись фиктивными материалами.

| Изменение | Точное место |
| --- | --- |
| Название проекта/компании, founder role, команда, факты | [src/content/site/settings.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/site/settings.ts>) |
| Контакты | [src/content/site/settings.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/site/settings.ts>) |
| Навигация, metadata, consultation, form labels, модели | [src/content/en/site.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/en/site.ts>)<br>[src/content/uk/site.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/uk/site.ts>) |
| 9 услуг | [src/content/en/services.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/en/services.ts>)<br>[src/content/uk/services.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/uk/services.ts>) |
| Паспорта услуг: test/price/result/formats/inputs | [src/content/site/service-commercial.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/site/service-commercial.ts>) |
| Pricing, AI Systems, founder story/timeline, competencies, principles, ecosystem | [src/content/en/experience.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/en/experience.ts>)<br>[src/content/uk/experience.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/uk/experience.ts>) |
| FAQ, 7 шагов, commitments/revisions/privacy | [src/content/en/process.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/en/process.ts>)<br>[src/content/uk/process.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/uk/process.ts>) |
| Founder media paths и локализованные alts | [src/content/site/founder-media.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/site/founder-media.ts>) |
| Генерация desktop/mobile AVIF/WebP | [scripts/generate-founder-media.mjs](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/scripts/generate-founder-media.mjs>) |
| Source audit: node --import tsx scripts/audit-package-source.mjs ABSOLUTE_MASTER_PATH | [scripts/audit-package-source.mjs](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/scripts/audit-package-source.mjs>) |
| Draft кейс / publication guards | [src/content/cases/index.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/cases/index.ts>)<br>[src/lib/content/index.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/lib/content/index.ts>) |
| Internal policy | [src/content/internal/policy.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/internal/policy.ts>) |
| Реальный POST / production provider | [src/app/api/consultation/route.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/app/api/consultation/route.ts>)<br>[src/lib/consultation/provider.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/lib/consultation/provider.ts>) |
| Инструкции для следующей итерации | [README.md](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/README.md>) |

## Реальные внешние зависимости

- Для production-приёма заявок требуется HTTPS `CONSULTATION_WEBHOOK_URL` и при необходимости `CONSULTATION_WEBHOOK_SECRET`. Пока используйте опубликованные email/Telegram/телефон; сайт честно показывает недоступность отправки.
- Для Moda Castle нужны перечисленные реальные материалы, разрешения, публикация и отзыв. Рабочее написание имени пока не подтверждено.
- Окончательный project name, домен/доменная почта, юридические сведения, финальные price units, booking/CRM/analytics и реальные видео карточек добавляются после предоставления. Никаких фиктивных юридических утверждений или интеграций не создано.
- Права использования каждого бесплатного теста и изменения объёма согласуются отдельно.

Во время работы среда испытывала нехватку памяти и места на C:. Первые Turbopack/build/browser попытки завершались resource errors; они не засчитаны как успешные проверки. Итоговый build выполнен командой `node node_modules/next/dist/bin/next build --webpack` с `NODE_OPTIONS=--max-old-space-size=512`, `experimental.cpus=1` и `webpackMemoryOptimizations=true`. Попытка удалить только собственный cache была отклонена автоматической проверкой без указания причины; cache сохранён, дальнейшая проверка выполнена без удаления пользовательских данных. Фоновый production preview запущен на 127.0.0.1:3100; это не внешнее размещение и не системная служба автозапуска.

## Точный список изменений этой итерации

Сравнение SHA-256 с **129 файлами** снимка перед новым пакетом, а не с более ранней фазой. Всё приложение уже находилось в untracked subtree корневого Git, поэтому обычный `git diff` не отражал границу итерации. Генерируемые `.next`, `.data`, скриншоты, логи и Lighthouse перечислены как QA-артефакты отдельно.

Added: 50; modified: 43; removed files: 0.

### Added

- [docs/ai-content-v1-implementation-map.md](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/docs/ai-content-v1-implementation-map.md>)
- [docs/founder-media-manifest.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/docs/founder-media-manifest.json>)
- [public/media/founder/boat-desktop.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/boat-desktop.avif>)
- [public/media/founder/boat-desktop.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/boat-desktop.webp>)
- [public/media/founder/boat-mobile.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/boat-mobile.avif>)
- [public/media/founder/boat-mobile.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/boat-mobile.webp>)
- [public/media/founder/gopro-desktop.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/gopro-desktop.avif>)
- [public/media/founder/gopro-desktop.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/gopro-desktop.webp>)
- [public/media/founder/gopro-mobile.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/gopro-mobile.avif>)
- [public/media/founder/gopro-mobile.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/gopro-mobile.webp>)
- [public/media/founder/hockey-puck-desktop.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-puck-desktop.avif>)
- [public/media/founder/hockey-puck-desktop.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-puck-desktop.webp>)
- [public/media/founder/hockey-puck-mobile.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-puck-mobile.avif>)
- [public/media/founder/hockey-puck-mobile.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-puck-mobile.webp>)
- [public/media/founder/hockey-team-desktop.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-team-desktop.avif>)
- [public/media/founder/hockey-team-desktop.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-team-desktop.webp>)
- [public/media/founder/hockey-team-mobile.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-team-mobile.avif>)
- [public/media/founder/hockey-team-mobile.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/hockey-team-mobile.webp>)
- [public/media/founder/jetski-desktop.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/jetski-desktop.avif>)
- [public/media/founder/jetski-desktop.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/jetski-desktop.webp>)
- [public/media/founder/jetski-mobile.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/jetski-mobile.avif>)
- [public/media/founder/jetski-mobile.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/jetski-mobile.webp>)
- [public/media/founder/portrait-desktop.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/portrait-desktop.avif>)
- [public/media/founder/portrait-desktop.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/portrait-desktop.webp>)
- [public/media/founder/portrait-mobile.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/portrait-mobile.avif>)
- [public/media/founder/portrait-mobile.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/portrait-mobile.webp>)
- [public/media/founder/urban-desktop.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/urban-desktop.avif>)
- [public/media/founder/urban-desktop.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/urban-desktop.webp>)
- [public/media/founder/urban-mobile.avif](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/urban-mobile.avif>)
- [public/media/founder/urban-mobile.webp](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/public/media/founder/urban-mobile.webp>)
- [qa/PACKAGE-V1-REPORT.md](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/PACKAGE-V1-REPORT.md>)
- [qa/package-v1-browser.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-browser.json>)
- [qa/package-v1-followup.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-followup.json>)
- [qa/package-v1-rendered-copy.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-rendered-copy.json>)
- [qa/package-v1-source-audit.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-source-audit.json>)
- [qa/package-v1-source-hashes.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/package-v1-source-hashes.json>)
- [scripts/audit-package-source.mjs](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/scripts/audit-package-source.mjs>)
- [scripts/generate-founder-media.mjs](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/scripts/generate-founder-media.mjs>)
- [src/app/[locale]/ai-systems/page.tsx](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/app/[locale]/ai-systems/page.tsx>)
- [src/app/[locale]/pricing/page.tsx](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/app/[locale]/pricing/page.tsx>)
- [src/components/sections/experience-sections.tsx](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/sections/experience-sections.tsx>)
- [src/components/sections/experience.module.css](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/sections/experience.module.css>)
- [src/content/en/experience.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/en/experience.ts>)
- [src/content/internal/policy.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/internal/policy.ts>)
- [src/content/site/founder-media.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/site/founder-media.ts>)
- [src/content/site/service-commercial.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/site/service-commercial.ts>)
- [src/content/uk/experience.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/uk/experience.ts>)
- [tests/e2e/package.spec.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/tests/e2e/package.spec.ts>)
- [tests/package.test.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/tests/package.test.ts>)
- [tests/support/local-submission-server.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/tests/support/local-submission-server.ts>)

### Modified

- [README.md](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/README.md>)
- [next-env.d.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/next-env.d.ts>)
- [next.config.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/next.config.ts>)
- [playwright.config.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/playwright.config.ts>)
- [qa/IMPLEMENTATION-UPDATE.md](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/IMPLEMENTATION-UPDATE.md>)
- [qa/REPORT.md](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/REPORT.md>)
- [qa/changed-files.json](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/qa/changed-files.json>)
- [scripts/validate-content.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/scripts/validate-content.ts>)
- [src/app/[locale]/about/page.tsx](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/app/[locale]/about/page.tsx>)
- [src/app/[locale]/layout.tsx](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/app/[locale]/layout.tsx>)
- [src/app/[locale]/page.tsx](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/app/[locale]/page.tsx>)
- [src/app/[locale]/services/page.tsx](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/app/[locale]/services/page.tsx>)
- [src/app/sitemap.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/app/sitemap.ts>)
- [src/components/cases/cases.module.css](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/cases/cases.module.css>)
- [src/components/cases/cases.tsx](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/cases/cases.tsx>)
- [src/components/consultation/form.module.css](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/consultation/form.module.css>)
- [src/components/layout/consultation-dock.tsx](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/layout/consultation-dock.tsx>)
- [src/components/layout/language-switcher.tsx](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/layout/language-switcher.tsx>)
- [src/components/layout/layout.module.css](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/layout/layout.module.css>)
- [src/components/layout/site-layout.tsx](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/layout/site-layout.tsx>)
- [src/components/sections/sections.module.css](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/sections/sections.module.css>)
- [src/components/sections/sections.tsx](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/sections/sections.tsx>)
- [src/components/services/service-grid.tsx](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/services/service-grid.tsx>)
- [src/components/services/service-template.tsx](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/services/service-template.tsx>)
- [src/components/services/services.module.css](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/services/services.module.css>)
- [src/components/ui/primitives.tsx](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/ui/primitives.tsx>)
- [src/components/ui/ui.module.css](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/components/ui/ui.module.css>)
- [src/content/cases/index.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/cases/index.ts>)
- [src/content/en/process.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/en/process.ts>)
- [src/content/en/site.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/en/site.ts>)
- [src/content/site/brand-text.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/site/brand-text.ts>)
- [src/content/site/settings.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/site/settings.ts>)
- [src/content/uk/process.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/uk/process.ts>)
- [src/content/uk/services.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/uk/services.ts>)
- [src/content/uk/site.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/content/uk/site.ts>)
- [src/lib/content/index.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/lib/content/index.ts>)
- [src/lib/content/validate.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/lib/content/validate.ts>)
- [src/lib/urls.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/lib/urls.ts>)
- [src/proxy.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/proxy.ts>)
- [src/styles/globals.css](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/styles/globals.css>)
- [src/types/content.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/src/types/content.ts>)
- [tests/content.test.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/tests/content.test.ts>)
- [tests/e2e/site.spec.ts](<C:/Users/Admin/OneDrive/Documents/ChatGPT/siteagent/apps/antonov-digital/tests/e2e/site.spec.ts>)
