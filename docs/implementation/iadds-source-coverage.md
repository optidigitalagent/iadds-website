# iADDS — полный реестр использования источников

Все 125 файлов двух source packages учтены; оба ZIP распакованы отдельно. SHA-256 каждого источника повторно проверен после генерации и не изменился. Два документа handoff прочитаны полностью; FINAL MANDATORY OVERRIDE имеет приоритет.

## Handoff

| Документ | Строк | SHA-256 | Использование |
| --- | ---: | --- | --- |
| iADDS_Site_Agent_Implementation_Prompt_v3_FINAL.txt | 1697 | 6314d6cb28fa71324f49c725663d3d6c23b38df1dd2529da551f2e072e5405e7 | Прочитан до конца; финальный media override применён |
| iADDS_Media_Package_Integration_Addendum_v1.txt | 1222 | 249a24c60e051f427576bf7fa16dfe9970bcd6d6534f42f4ee2fe7eb34822a5b | Прочитан до конца; финальный media override применён |

## Каждая папка

| Папка | Файлов включая подпапки | Роль |
| --- | ---: | --- |
| AI_Content_Site_Package | 10 | Полностью прочитанные документы и источники; правила применены по приоритету v3 |
| AI_Content_Site_Package/assets | 7 | Полностью прочитанные документы и источники; правила применены по приоритету v3 |
| AI_Content_Site_Package/assets/founder | 7 | Семь утверждённых фото; responsive derivatives и защита личных идентификаторов |
| iADDS_Media_Package_v1 | 115 | Полностью прочитанные документы и источники; правила применены по приоритету v3 |
| iADDS_Media_Package_v1/01_primary_library | 41 | Каноническое приватное хранение; дедупликация по ID и SHA-256 |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos | 16 | Каноническое приватное хранение; дедупликация по ID и SHA-256 |
| iADDS_Media_Package_v1/01_primary_library/02_product_photos_videos | 12 | Каноническое приватное хранение; дедупликация по ID и SHA-256 |
| iADDS_Media_Package_v1/01_primary_library/03_virtual_models | 4 | Каноническое приватное хранение; дедупликация по ID и SHA-256 |
| iADDS_Media_Package_v1/01_primary_library/04_ugc_style_ads | 3 | Каноническое приватное хранение; дедупликация по ID и SHA-256 |
| iADDS_Media_Package_v1/01_primary_library/05_ai_presenters | 1 | Каноническое приватное хранение; дедупликация по ID и SHA-256 |
| iADDS_Media_Package_v1/01_primary_library/07_explainer_videos | 4 | Каноническое приватное хранение; дедупликация по ID и SHA-256 |
| iADDS_Media_Package_v1/01_primary_library/08_brand_characters | 1 | Каноническое приватное хранение; дедупликация по ID и SHA-256 |
| iADDS_Media_Package_v1/02_website_curated | 52 | Редакционный индекс ролей; копии сверены с canonical, повторные бинарники не импортируются |
| iADDS_Media_Package_v1/02_website_curated/01_advertising_videos | 5 | Редакционный индекс ролей; копии сверены с canonical, повторные бинарники не импортируются |
| iADDS_Media_Package_v1/02_website_curated/02_product_photos_videos | 5 | Редакционный индекс ролей; копии сверены с canonical, повторные бинарники не импортируются |
| iADDS_Media_Package_v1/02_website_curated/03_virtual_models | 4 | Редакционный индекс ролей; копии сверены с canonical, повторные бинарники не импортируются |
| iADDS_Media_Package_v1/02_website_curated/04_ugc_style_ads | 4 | Редакционный индекс ролей; копии сверены с canonical, повторные бинарники не импортируются |
| iADDS_Media_Package_v1/02_website_curated/05_ai_presenters | 2 | Редакционный индекс ролей; копии сверены с canonical, повторные бинарники не импортируются |
| iADDS_Media_Package_v1/02_website_curated/07_explainer_videos | 4 | Редакционный индекс ролей; копии сверены с canonical, повторные бинарники не импортируются |
| iADDS_Media_Package_v1/02_website_curated/08_brand_characters | 4 | Редакционный индекс ролей; копии сверены с canonical, повторные бинарники не импортируются |
| iADDS_Media_Package_v1/02_website_curated/09_ad_creative_variations | 6 | Редакционный индекс ролей; копии сверены с canonical, повторные бинарники не импортируются |
| iADDS_Media_Package_v1/02_website_curated/09_ad_creative_variations/01_PLIP_two_art_directions | 2 | Редакционный индекс ролей; копии сверены с canonical, повторные бинарники не импортируются |
| iADDS_Media_Package_v1/02_website_curated/09_ad_creative_variations/02_LUME_model_and_billboard | 2 | Редакционный индекс ролей; копии сверены с canonical, повторные бинарники не импортируются |
| iADDS_Media_Package_v1/02_website_curated/09_ad_creative_variations/03_STUDIO_HANDS_two_product_visuals | 2 | Редакционный индекс ролей; копии сверены с canonical, повторные бинарники не импортируются |
| iADDS_Media_Package_v1/02_website_curated/10_reserve | 18 | Редакционный индекс ролей; копии сверены с canonical, повторные бинарники не импортируются |
| iADDS_Media_Package_v1/03_visual_index | 8 | Визуальный аудит; все 7 contact sheets просмотрены, TSV сопоставлен |
| iADDS_Media_Package_v1/04_brand | 1 | Символ, wordmark, favicon, OG; исходная доска не используется в интерфейсе |
| iADDS_Media_Package_v1/05_founder_assets | 7 | Семь утверждённых фото; responsive derivatives и защита личных идентификаторов |

## Source package usage

Каждый файл; bytes и SHA-256 — в iadds-source-inventory.json.

| Source file | How it was used | Destination files/routes | Validation performed | Remaining external dependency |
| --- | --- | --- | --- | --- |
| AI_Content_Site_Package/AI_Content_Master_Website_Content_v1.md | Все разделы 0–29: существующий типизированный контент UK/EN, 9 услуг, этап теста, процесс, цены, AI-системы, история компании и основателя, FAQ, контакты, консультация. Внутренние цены/условия и Moda Castle остаются draft. Название и размещение фото заменены по финальному override; детальная карта разделов: docs/ai-content-v1-implementation-map.md. | src/content/{uk,en}; src/content/site; src/content/internal/policy.ts; все существующие страницы | Все разделы 0–29; 100 public + 10 draft source paragraphs; 0 unmatched после обязательной смены бренда | Права/материалы/отзыв реального кейса, production receiver, legal texts |
| AI_Content_Site_Package/AI_Content_Site_Agent_Implementation_Prompt_v1.txt | Базовая реализация в существующем Next.js + TypeScript; сохранены маршруты, модель контента и пользовательские сценарии. Старое название и противоречащие правила размещения заменены v3. | docs/implementation/iadds-source-inventory.json; source audit | Полное чтение / просмотр; SHA-256 повторно совпал | Нет |
| AI_Content_Site_Package/assets/founder/01_founder_portrait_sea_cap.png | First-party editorial source; privacy crop and responsive derivatives | public/media/founder (28 derivatives); src/content/site/founder-media.ts; /uk/about, /en/about, home jetski | Визуальный просмотр, старое/новое имя по одинаковому SHA-256; crop/privacy/EXIF; browser decode | Нет |
| AI_Content_Site_Package/assets/founder/02_founder_hockey_team_action.png | First-party editorial source; privacy crop and responsive derivatives | public/media/founder (28 derivatives); src/content/site/founder-media.ts; /uk/about, /en/about, home jetski | Визуальный просмотр, старое/новое имя по одинаковому SHA-256; crop/privacy/EXIF; browser decode | Нет |
| AI_Content_Site_Package/assets/founder/03_founder_hockey_puck_action.png | First-party editorial source; privacy crop and responsive derivatives | public/media/founder (28 derivatives); src/content/site/founder-media.ts; /uk/about, /en/about, home jetski | Визуальный просмотр, старое/новое имя по одинаковому SHA-256; crop/privacy/EXIF; browser decode | Нет |
| AI_Content_Site_Package/assets/founder/04_founder_urban_event_source.png | First-party editorial source; privacy crop and responsive derivatives | public/media/founder (28 derivatives); src/content/site/founder-media.ts; /uk/about, /en/about, home jetski | Визуальный просмотр, старое/новое имя по одинаковому SHA-256; crop/privacy/EXIF; browser decode | Нет |
| AI_Content_Site_Package/assets/founder/05_founder_gopro_water.png | First-party editorial source; privacy crop and responsive derivatives | public/media/founder (28 derivatives); src/content/site/founder-media.ts; /uk/about, /en/about, home jetski | Визуальный просмотр, старое/новое имя по одинаковому SHA-256; crop/privacy/EXIF; browser decode | Нет |
| AI_Content_Site_Package/assets/founder/06_founder_boat.png | First-party editorial source; privacy crop and responsive derivatives | public/media/founder (28 derivatives); src/content/site/founder-media.ts; /uk/about, /en/about, home jetski | Визуальный просмотр, старое/новое имя по одинаковому SHA-256; crop/privacy/EXIF; browser decode | Нет |
| AI_Content_Site_Package/assets/founder/07_founder_jetski.jpg | First-party editorial source; privacy crop and responsive derivatives | public/media/founder (28 derivatives); src/content/site/founder-media.ts; /uk/about, /en/about, home jetski | Визуальный просмотр, старое/новое имя по одинаковому SHA-256; crop/privacy/EXIF; browser decode | Нет |
| AI_Content_Site_Package/FOUNDER_ASSET_MAP.md | Сопоставлены все 7 прежних имён с 7 новыми; SHA-256 идентичны. Финальный override определяет главный jetski, порядок About и полный рост city. | docs/implementation/iadds-source-inventory.json; source audit | Полное чтение / просмотр; SHA-256 повторно совпал | Нет |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/03_candle_brand_motion_ad.mp4 | ID 03; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/06_tomato_can_dynamic_ad.mp4 | ID 06; ai-video-ads: card, gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/08_blackberry_preserve_pop_art_ad.mp4 | ID 08; ai-video-ads: gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/11_gold_serum_product_motion.mp4 | ID 11; product-visuals: featured, gallery mapping; duplicate omitted. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/13_perfume_multi_scene_campaign.mp4 | ID 13; ai-video-ads: gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/14_rosehip_lifestyle_campaign.mp4 | ID 14; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/16_manuka_honey_macro_ad.mp4 | ID 16; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/18_gelato_tennis_surreal_ad.mp4 | ID 18; brand-characters: gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/23_lume_billboard_city_campaign.mp4 | ID 23; performance-creatives: pair lume. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/27_olive_oil_pop_art_ad.mp4 | ID 27; brand-characters: gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/30_plip_metallic_orange_ad.mp4 | ID 30; performance-creatives: card, pair plip. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/31_calendula_oil_bubbles_ad.mp4 | ID 31; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/33_plip_pop_art_green_ad.mp4 | ID 33; performance-creatives: card, pair plip. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/34_nami_shoe_wave_campaign.mp4 | ID 34; ai-video-ads: featured, gallery mapping; duplicate omitted. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/37_fizzy_poster_ad.mp4 | ID 37; brand-characters: gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/01_advertising_videos/39_chips_package_motion_ad.mp4 | ID 39; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/02_product_photos_videos/01_yellow_beverage_cans_grass.avif | ID 01; product-visuals: gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/02_product_photos_videos/02_limber_can_graphic_background.avif | ID 02; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/02_product_photos_videos/04_bobbin_tinted_lip_balm.avif | ID 04; product-visuals: gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/02_product_photos_videos/05_orova_body_oil_closeup.avif | ID 05; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/02_product_photos_videos/07_splash_cans_fridge.avif | ID 07; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/02_product_photos_videos/09_hesper_row_cream_jar.avif | ID 09; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/02_product_photos_videos/10_green_beverage_mint_water.avif | ID 10; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/02_product_photos_videos/12_cosmetic_tube_ice_berries.avif | ID 12; product-visuals: card, gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/02_product_photos_videos/22_studio_hands_balm_bag.avif | ID 22; performance-creatives: pair studio-hands. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/02_product_photos_videos/24_limetta_vitamins_lemons.avif | ID 24; product-visuals: gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/02_product_photos_videos/36_studio_hands_balm_set.avif | ID 36; performance-creatives: pair studio-hands. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/02_product_photos_videos/38_body_wash_marketplace_motion.mp4 | ID 38; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/03_virtual_models/17_model_holding_lume_product.avif | ID 17; virtual-models: gallery; performance-creatives: pair lume. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/03_virtual_models/21_model_holding_solv_product.avif | ID 21; virtual-models: gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/03_virtual_models/25_male_model_food_jar.avif | ID 25; virtual-models: gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/03_virtual_models/40_biojuss_model_campaign.mp4 | ID 40; ai-video-ads: gallery; virtual-models: card, featured, gallery mapping; duplicate omitted. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/04_ugc_style_ads/15_marshmallow_creator_ugc.mp4 | ID 15; ai-ugc: featured, gallery mapping; duplicate omitted; ai-spokesperson: gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/04_ugc_style_ads/26_jewelry_unboxing_hands_ugc.mp4 | ID 26; ai-ugc: gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/04_ugc_style_ads/41_handbag_creator_ugc.mp4 | ID 41; ai-ugc: card, gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/05_ai_presenters/19_beauty_device_presenter_demo.mp4 | ID 19; ai-ugc: gallery; ai-spokesperson: card, featured, gallery mapping; duplicate omitted. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/07_explainer_videos/20_wallet_feature_explainer.mp4 | ID 20; explainer-videos: gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/07_explainer_videos/28_typographic_brand_motion.mp4 | ID 28; explainer-videos: gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/07_explainer_videos/29_watch_engineering_explainer.mp4 | ID 29; explainer-videos: card, featured, gallery mapping; duplicate omitted. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/07_explainer_videos/35_brand_system_motion_explainer.mp4 | ID 35; explainer-videos: gallery. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/01_primary_library/08_brand_characters/32_nibbo_cartoon_brand_world.mp4 | ID 32; brand-characters: card, featured, gallery mapping; duplicate omitted. staging-only; rights=unverified; production: исключён.  | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/01_advertising_videos/01_source-06_tomato_can_dynamic_ad.mp4 | ID 06; ai-video-ads: card, gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/01_advertising_videos/02_source-08_blackberry_preserve_pop_art_ad.mp4 | ID 08; ai-video-ads: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/01_advertising_videos/03_source-13_perfume_multi_scene_campaign.mp4 | ID 13; ai-video-ads: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/01_advertising_videos/04_source-34_nami_shoe_wave_campaign.mp4 | ID 34; ai-video-ads: featured, gallery mapping; duplicate omitted. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/01_advertising_videos/05_source-40_biojuss_model_campaign.mp4 | ID 40; ai-video-ads: gallery; virtual-models: card, featured, gallery mapping; duplicate omitted. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/02_product_photos_videos/01_source-01_yellow_beverage_cans_grass.avif | ID 01; product-visuals: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/02_product_photos_videos/02_source-04_bobbin_tinted_lip_balm.avif | ID 04; product-visuals: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/02_product_photos_videos/03_source-11_gold_serum_product_motion.mp4 | ID 11; product-visuals: featured, gallery mapping; duplicate omitted. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/02_product_photos_videos/04_source-12_cosmetic_tube_ice_berries.avif | ID 12; product-visuals: card, gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/02_product_photos_videos/05_source-24_limetta_vitamins_lemons.avif | ID 24; product-visuals: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/03_virtual_models/01_source-17_model_holding_lume_product.avif | ID 17; virtual-models: gallery; performance-creatives: pair lume. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/03_virtual_models/02_source-21_model_holding_solv_product.avif | ID 21; virtual-models: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/03_virtual_models/03_source-25_male_model_food_jar.avif | ID 25; virtual-models: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/03_virtual_models/04_source-40_biojuss_model_campaign.mp4 | ID 40; ai-video-ads: gallery; virtual-models: card, featured, gallery mapping; duplicate omitted. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/04_ugc_style_ads/01_source-15_marshmallow_creator_ugc.mp4 | ID 15; ai-ugc: featured, gallery mapping; duplicate omitted; ai-spokesperson: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/04_ugc_style_ads/02_source-19_beauty_device_presenter_demo.mp4 | ID 19; ai-ugc: gallery; ai-spokesperson: card, featured, gallery mapping; duplicate omitted. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/04_ugc_style_ads/03_source-26_jewelry_unboxing_hands_ugc.mp4 | ID 26; ai-ugc: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/04_ugc_style_ads/04_source-41_handbag_creator_ugc.mp4 | ID 41; ai-ugc: card, gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/05_ai_presenters/01_source-19_beauty_device_presenter_demo.mp4 | ID 19; ai-ugc: gallery; ai-spokesperson: card, featured, gallery mapping; duplicate omitted. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/05_ai_presenters/02_source-15_marshmallow_creator_ugc.mp4 | ID 15; ai-ugc: featured, gallery mapping; duplicate omitted; ai-spokesperson: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/07_explainer_videos/01_source-20_wallet_feature_explainer.mp4 | ID 20; explainer-videos: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/07_explainer_videos/02_source-29_watch_engineering_explainer.mp4 | ID 29; explainer-videos: card, featured, gallery mapping; duplicate omitted. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/07_explainer_videos/03_source-35_brand_system_motion_explainer.mp4 | ID 35; explainer-videos: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/07_explainer_videos/04_source-28_typographic_brand_motion.mp4 | ID 28; explainer-videos: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/08_brand_characters/01_source-32_nibbo_cartoon_brand_world.mp4 | ID 32; brand-characters: card, featured, gallery mapping; duplicate omitted. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/08_brand_characters/02_source-27_olive_oil_pop_art_ad.mp4 | ID 27; brand-characters: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/08_brand_characters/03_source-18_gelato_tennis_surreal_ad.mp4 | ID 18; brand-characters: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/08_brand_characters/04_source-37_fizzy_poster_ad.mp4 | ID 37; brand-characters: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/09_ad_creative_variations/01_PLIP_two_art_directions/01_source-30_plip_metallic_orange_ad.mp4 | ID 30; performance-creatives: card, pair plip. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/09_ad_creative_variations/01_PLIP_two_art_directions/02_source-33_plip_pop_art_green_ad.mp4 | ID 33; performance-creatives: card, pair plip. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/09_ad_creative_variations/02_LUME_model_and_billboard/01_source-17_model_holding_lume_product.avif | ID 17; virtual-models: gallery; performance-creatives: pair lume. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/09_ad_creative_variations/02_LUME_model_and_billboard/02_source-23_lume_billboard_city_campaign.mp4 | ID 23; performance-creatives: pair lume. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/09_ad_creative_variations/03_STUDIO_HANDS_two_product_visuals/01_source-22_studio_hands_balm_bag.avif | ID 22; performance-creatives: pair studio-hands. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/09_ad_creative_variations/03_STUDIO_HANDS_two_product_visuals/02_source-36_studio_hands_balm_set.avif | ID 36; performance-creatives: pair studio-hands. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/02_limber_can_graphic_background.avif | ID 02; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/03_candle_brand_motion_ad.mp4 | ID 03; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/05_orova_body_oil_closeup.avif | ID 05; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/07_splash_cans_fridge.avif | ID 07; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/09_hesper_row_cream_jar.avif | ID 09; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/10_green_beverage_mint_water.avif | ID 10; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/14_rosehip_lifestyle_campaign.mp4 | ID 14; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/16_manuka_honey_macro_ad.mp4 | ID 16; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/18_gelato_tennis_surreal_ad.mp4 | ID 18; brand-characters: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/23_lume_billboard_city_campaign.mp4 | ID 23; performance-creatives: pair lume. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/27_olive_oil_pop_art_ad.mp4 | ID 27; brand-characters: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/30_plip_metallic_orange_ad.mp4 | ID 30; performance-creatives: card, pair plip. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/31_calendula_oil_bubbles_ad.mp4 | ID 31; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/33_plip_pop_art_green_ad.mp4 | ID 33; performance-creatives: card, pair plip. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/36_studio_hands_balm_set.avif | ID 36; performance-creatives: pair studio-hands. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/37_fizzy_poster_ad.mp4 | ID 37; brand-characters: gallery. staging-only; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; .data/iadds-media; /uk и /en; локальные /services и /services/[slug] | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/38_body_wash_marketplace_motion.mp4 | ID 38; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/02_website_curated/10_reserve/39_chips_package_motion_ad.mp4 | ID 39; Резерв — финальная редакционная подборка не использует. reserve; rights=unverified; production: исключён. Curated-копия: SHA совпадает с canonical; отдельный бинарник не создаётся. | src/content/internal/media-catalog.ts; приватный резерв | Полное декодирование, dimensions/duration/audio, JSON/CSV/TSV, SHA-256 canonical=curated, poster review для выбранного ID | Индивидуальное подтверждение прав перед production |
| iADDS_Media_Package_v1/03_visual_index/sheet_01.jpg | Contact sheet просмотрен визуально; все показанные ID сверены с первичными файлами; исключительно приватный QA, не компонент сайта. | Редакционная подборка src/content/site/service-media-map.ts | Полное чтение / просмотр; SHA-256 повторно совпал | Нет |
| iADDS_Media_Package_v1/03_visual_index/sheet_02.jpg | Contact sheet просмотрен визуально; все показанные ID сверены с первичными файлами; исключительно приватный QA, не компонент сайта. | Редакционная подборка src/content/site/service-media-map.ts | Полное чтение / просмотр; SHA-256 повторно совпал | Нет |
| iADDS_Media_Package_v1/03_visual_index/sheet_03.jpg | Contact sheet просмотрен визуально; все показанные ID сверены с первичными файлами; исключительно приватный QA, не компонент сайта. | Редакционная подборка src/content/site/service-media-map.ts | Полное чтение / просмотр; SHA-256 повторно совпал | Нет |
| iADDS_Media_Package_v1/03_visual_index/sheet_04.jpg | Contact sheet просмотрен визуально; все показанные ID сверены с первичными файлами; исключительно приватный QA, не компонент сайта. | Редакционная подборка src/content/site/service-media-map.ts | Полное чтение / просмотр; SHA-256 повторно совпал | Нет |
| iADDS_Media_Package_v1/03_visual_index/sheet_05.jpg | Contact sheet просмотрен визуально; все показанные ID сверены с первичными файлами; исключительно приватный QA, не компонент сайта. | Редакционная подборка src/content/site/service-media-map.ts | Полное чтение / просмотр; SHA-256 повторно совпал | Нет |
| iADDS_Media_Package_v1/03_visual_index/sheet_06.jpg | Contact sheet просмотрен визуально; все показанные ID сверены с первичными файлами; исключительно приватный QA, не компонент сайта. | Редакционная подборка src/content/site/service-media-map.ts | Полное чтение / просмотр; SHA-256 повторно совпал | Нет |
| iADDS_Media_Package_v1/03_visual_index/sheet_07.jpg | Contact sheet просмотрен визуально; все показанные ID сверены с первичными файлами; исключительно приватный QA, не компонент сайта. | Редакционная подборка src/content/site/service-media-map.ts | Полное чтение / просмотр; SHA-256 повторно совпал | Нет |
| iADDS_Media_Package_v1/03_visual_index/source_index.tsv | Все 41 позиции визуального индекса сопоставлены с ID и canonical-файлами; индекс не публикуется. | docs/implementation/iadds-source-inventory.json; source audit | Полное чтение / просмотр; SHA-256 повторно совпал | Нет |
| iADDS_Media_Package_v1/04_brand/iADDS_logo_source_black_square.png | First-party symbol source; derive transparent brand assets | public/media/brand (8 files); OG input bundle; header/footer/metadata | Исходник просмотрен; alpha/размеры/контраст; header/favicon/OG render | Настоящий vector master |
| iADDS_Media_Package_v1/05_founder_assets/founder_boat.png | First-party editorial source; privacy crop and responsive derivatives | public/media/founder (28 derivatives); src/content/site/founder-media.ts; /uk/about, /en/about, home jetski | Визуальный просмотр, старое/новое имя по одинаковому SHA-256; crop/privacy/EXIF; browser decode | Нет |
| iADDS_Media_Package_v1/05_founder_assets/founder_close_portrait.png | First-party editorial source; privacy crop and responsive derivatives | public/media/founder (28 derivatives); src/content/site/founder-media.ts; /uk/about, /en/about, home jetski | Визуальный просмотр, старое/новое имя по одинаковому SHA-256; crop/privacy/EXIF; browser decode | Нет |
| iADDS_Media_Package_v1/05_founder_assets/founder_fullbody_city.png | First-party editorial source; privacy crop and responsive derivatives | public/media/founder (28 derivatives); src/content/site/founder-media.ts; /uk/about, /en/about, home jetski | Визуальный просмотр, старое/новое имя по одинаковому SHA-256; crop/privacy/EXIF; browser decode | Нет |
| iADDS_Media_Package_v1/05_founder_assets/founder_gopro.png | First-party editorial source; privacy crop and responsive derivatives | public/media/founder (28 derivatives); src/content/site/founder-media.ts; /uk/about, /en/about, home jetski | Визуальный просмотр, старое/новое имя по одинаковому SHA-256; crop/privacy/EXIF; browser decode | Нет |
| iADDS_Media_Package_v1/05_founder_assets/founder_hockey_puck_action.png | First-party editorial source; privacy crop and responsive derivatives | public/media/founder (28 derivatives); src/content/site/founder-media.ts; /uk/about, /en/about, home jetski | Визуальный просмотр, старое/новое имя по одинаковому SHA-256; crop/privacy/EXIF; browser decode | Нет |
| iADDS_Media_Package_v1/05_founder_assets/founder_hockey_team_action.png | First-party editorial source; privacy crop and responsive derivatives | public/media/founder (28 derivatives); src/content/site/founder-media.ts; /uk/about, /en/about, home jetski | Визуальный просмотр, старое/новое имя по одинаковому SHA-256; crop/privacy/EXIF; browser decode | Нет |
| iADDS_Media_Package_v1/05_founder_assets/founder_main_jetski.jpg | First-party editorial source; privacy crop and responsive derivatives | public/media/founder (28 derivatives); src/content/site/founder-media.ts; /uk/about, /en/about, home jetski | Визуальный просмотр, старое/новое имя по одинаковому SHA-256; crop/privacy/EXIF; browser decode | Нет |
| iADDS_Media_Package_v1/CLASSIFICATION_AND_RECOMMENDATIONS.md | Прочитан полностью; классификация каждого источника сверена с JSON/CSV и визуальными листами; ошибочное приписывание localization, SaaS и recurring mascot не допускается. | docs/implementation/iadds-source-inventory.json; source audit | Полное чтение / просмотр; SHA-256 повторно совпал | Нет |
| iADDS_Media_Package_v1/material_manifest.csv | Все 41 записи независимо сопоставлены с JSON по именам, категориям, разрешениям и длительностям. | docs/implementation/iadds-source-inventory.json; source audit | Полное чтение / просмотр; SHA-256 повторно совпал | Нет |
| iADDS_Media_Package_v1/material_manifest.json | Все 41 записи импортированы и сверены с реально декодированными файлами; основа приватного typed catalog. | docs/implementation/iadds-source-inventory.json; source audit | Полное чтение / просмотр; SHA-256 повторно совпал | Нет |
| iADDS_Media_Package_v1/MISSING_MATERIALS_BRIEF.md | Прочитан полностью; превращён в docs/implementation/iadds-missing-materials.md с пятью списками материалов и полями будущего заполнения. | docs/implementation/iadds-missing-materials.md; coverageStatus/replacementRequired/localizationPairs | Полное чтение / просмотр; SHA-256 повторно совпал | Материалы для пяти неполных категорий |
| iADDS_Media_Package_v1/NEXT_FIX_BRIEF.md | Прочитан полностью; применены media-first карточки, реальные форматы и приоритет исправлений. Финальная таблица v3 имеет приоритет над рекомендациями. | docs/implementation/iadds-source-inventory.json; source audit | Полное чтение / просмотр; SHA-256 повторно совпал | Нет |
| iADDS_Media_Package_v1/README.md | Прочитан полностью: структура пакета, роли первичной и curated-библиотеки, индексов, founder и branding. Оригиналы остаются приватными. | docs/implementation/iadds-source-inventory.json; source audit | Полное чтение / просмотр; SHA-256 повторно совпал | Нет |

## Каждый уникальный service asset и производный файл

Все строки ниже имеют rightsStatus=unverified. Статус staging-only означает только локальный loopback review; любой Sites URL считается production. Ни один из перечисленных бинарников не публикуется до индивидуального подтверждения прав.

### ID 01 — 01_yellow_beverage_cans_grass.avif

- Оригинальное имя: 0e94fe86-e661-5bb7-bfc1-1fc42b107fcc.avif; canonical: 01_primary_library/02_product_photos_videos/01_yellow_beverage_cans_grass.avif.
- image; 1080×1609; — с; исходный звук: нет.
- Категория: Product Photos & Videos; Lifestyle product still: yellow beverage cans in grass and crate.
- Роль: product-visuals: gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: исходное изображение / отсутствует в резерве.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-01-desktop.avif | desktop | 960×1430 | 117427 | — / — |
| example-01-desktop.webp | desktop | 960×1430 | 268802 | — / — |
| example-01-mobile.avif | mobile | 480×715 | 47301 | — / — |
| example-01-mobile.webp | mobile | 480×715 | 104916 | — / — |

### ID 02 — 02_limber_can_graphic_background.avif

- Оригинальное имя: 0ede1f77-36e5-5ccb-bd21-eac35fdab8a9.avif; canonical: 01_primary_library/02_product_photos_videos/02_limber_can_graphic_background.avif.
- image; 1080×1080; — с; исходный звук: нет.
- Категория: Product Photos & Videos; Graphic product still: blue Limber can on yellow/pink set.
- Роль: Резерв — финальная редакционная подборка не использует.
- Решение: reserve. Not in final editorial selection; retained privately to avoid repetitive galleries.
- Poster frame: исходное изображение / отсутствует в резерве.

Производные не создавались: резерв сохранён в распакованном приватном source package.

### ID 03 — 03_candle_brand_motion_ad.mp4

- Оригинальное имя: 10549795-1814-4ad4-b992-511f475a0e4a.mp4; canonical: 01_primary_library/01_advertising_videos/03_candle_brand_motion_ad.mp4.
- video; 600×1066; 7.296 с; исходный звук: да.
- Категория: Advertising Videos; Candle product ad with editorial typography and brand frames.
- Роль: Резерв — финальная редакционная подборка не использует.
- Решение: reserve. Not in final editorial selection; retained privately to avoid repetitive galleries.
- Poster frame: 1.2.

Производные не создавались: резерв сохранён в распакованном приватном source package.

### ID 04 — 04_bobbin_tinted_lip_balm.avif

- Оригинальное имя: 12970b70-6064-5ba4-a3f2-57f5425f70e2.avif; canonical: 01_primary_library/02_product_photos_videos/04_bobbin_tinted_lip_balm.avif.
- image; 1080×1609; — с; исходный звук: нет.
- Категория: Product Photos & Videos; Cosmetics product still: Bobbin tinted lip balm compact.
- Роль: product-visuals: gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: исходное изображение / отсутствует в резерве.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-04-desktop.avif | desktop | 960×1430 | 13509 | — / — |
| example-04-desktop.webp | desktop | 960×1430 | 23300 | — / — |
| example-04-mobile.avif | mobile | 480×715 | 5396 | — / — |
| example-04-mobile.webp | mobile | 480×715 | 9240 | — / — |

### ID 05 — 05_orova_body_oil_closeup.avif

- Оригинальное имя: 1ca5e4aa-bcff-5be8-9ccc-b97094c713a6.avif; canonical: 01_primary_library/02_product_photos_videos/05_orova_body_oil_closeup.avif.
- image; 1080×1340; — с; исходный звук: нет.
- Категория: Product Photos & Videos; Premium body oil close-up in warm light.
- Роль: Резерв — финальная редакционная подборка не использует.
- Решение: reserve. Not in final editorial selection; retained privately to avoid repetitive galleries.
- Poster frame: исходное изображение / отсутствует в резерве.

Производные не создавались: резерв сохранён в распакованном приватном source package.

### ID 06 — 06_tomato_can_dynamic_ad.mp4

- Оригинальное имя: 1cc0289d-074e-4eff-b273-4d430e416c61.mp4; canonical: 01_primary_library/01_advertising_videos/06_tomato_can_dynamic_ad.mp4.
- video; 600×1066; 7.296 с; исходный звук: да.
- Категория: Advertising Videos; Dynamic canned tomato advertising video with product transformation.
- Роль: ai-video-ads: card, gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 3.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-06-preview.mp4 | preview | 400×710 | 262744 | 4.291667 / нет |
| example-06-detail.mp4 | detail | 600×1066 | 2356217 | 7.296 / да |
| example-06-desktop.avif | desktop | 600×1066 | 33064 | — / — |
| example-06-desktop.webp | desktop | 600×1066 | 54396 | — / — |
| example-06-mobile.avif | mobile | 480×853 | 24093 | — / — |
| example-06-mobile.webp | mobile | 480×853 | 41110 | — / — |

### ID 07 — 07_splash_cans_fridge.avif

- Оригинальное имя: 255c248c-529d-5d32-89a6-b5da9bc83d50.avif; canonical: 01_primary_library/02_product_photos_videos/07_splash_cans_fridge.avif.
- image; 1080×1340; — с; исходный звук: нет.
- Категория: Product Photos & Videos; Beverage cans arranged in a refrigerator.
- Роль: Резерв — финальная редакционная подборка не использует.
- Решение: reserve. Not in final editorial selection; retained privately to avoid repetitive galleries.
- Poster frame: исходное изображение / отсутствует в резерве.

Производные не создавались: резерв сохранён в распакованном приватном source package.

### ID 08 — 08_blackberry_preserve_pop_art_ad.mp4

- Оригинальное имя: 30ff2469-cd60-4b50-9cc3-3001670b8a56.mp4; canonical: 01_primary_library/01_advertising_videos/08_blackberry_preserve_pop_art_ad.mp4.
- video; 600×1066; 15.104 с; исходный звук: да.
- Категория: Advertising Videos; Pop-art campaign video for blackberry preserve jar.
- Роль: ai-video-ads: gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.2.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-08-preview.mp4 | preview | 400×710 | 433368 | 4.5 / нет |
| example-08-detail.mp4 | detail | 600×1066 | 4581459 | 15.104 / да |
| example-08-desktop.avif | desktop | 600×1066 | 31417 | — / — |
| example-08-desktop.webp | desktop | 600×1066 | 62514 | — / — |
| example-08-mobile.avif | mobile | 480×853 | 23517 | — / — |
| example-08-mobile.webp | mobile | 480×853 | 47472 | — / — |

### ID 09 — 09_hesper_row_cream_jar.avif

- Оригинальное имя: 36052145-6b41-51f2-95c1-7a0f0393a112.avif; canonical: 01_primary_library/02_product_photos_videos/09_hesper_row_cream_jar.avif.
- image; 1080×1446; — с; исходный звук: нет.
- Категория: Product Photos & Videos; Cream jar lifestyle close-up.
- Роль: Резерв — финальная редакционная подборка не использует.
- Решение: reserve. Not in final editorial selection; retained privately to avoid repetitive galleries.
- Poster frame: исходное изображение / отсутствует в резерве.

Производные не создавались: резерв сохранён в распакованном приватном source package.

### ID 10 — 10_green_beverage_mint_water.avif

- Оригинальное имя: 3adb2415-e7d8-50e5-b745-f69ab47bad89.avif; canonical: 01_primary_library/02_product_photos_videos/10_green_beverage_mint_water.avif.
- image; 1080×1446; — с; исходный звук: нет.
- Категория: Product Photos & Videos; Green beverage package with mint and water macro scene.
- Роль: Резерв — финальная редакционная подборка не использует.
- Решение: reserve. Not in final editorial selection; retained privately to avoid repetitive galleries.
- Poster frame: исходное изображение / отсутствует в резерве.

Производные не создавались: резерв сохранён в распакованном приватном source package.

### ID 11 — 11_gold_serum_product_motion.mp4

- Оригинальное имя: 44059e81-8722-4e77-9eb9-08973d03e163.mp4; canonical: 01_primary_library/01_advertising_videos/11_gold_serum_product_motion.mp4.
- video; 600×1066; 15.104 с; исходный звук: да.
- Категория: Advertising Videos; Luxury serum/oil product motion in gold environment.
- Роль: product-visuals: featured, gallery mapping; duplicate omitted.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-11-preview.mp4 | preview | 400×710 | 103923 | 4.5 / нет |
| example-11-detail.mp4 | detail | 600×1066 | 1422849 | 15.104 / да |
| example-11-desktop.avif | desktop | 600×1066 | 17561 | — / — |
| example-11-desktop.webp | desktop | 600×1066 | 28192 | — / — |
| example-11-mobile.avif | mobile | 480×853 | 13280 | — / — |
| example-11-mobile.webp | mobile | 480×853 | 21302 | — / — |

### ID 12 — 12_cosmetic_tube_ice_berries.avif

- Оригинальное имя: 4b69fc5c-74ad-5745-886b-3ede4df9b69e.avif; canonical: 01_primary_library/02_product_photos_videos/12_cosmetic_tube_ice_berries.avif.
- image; 1080×1340; — с; исходный звук: нет.
- Категория: Product Photos & Videos; Cosmetic tube on ice blocks with berries.
- Роль: product-visuals: card, gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: исходное изображение / отсутствует в резерве.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-12-desktop.avif | desktop | 960×1191 | 39710 | — / — |
| example-12-desktop.webp | desktop | 960×1191 | 70646 | — / — |
| example-12-mobile.avif | mobile | 480×596 | 13162 | — / — |
| example-12-mobile.webp | mobile | 480×596 | 23028 | — / — |

### ID 13 — 13_perfume_multi_scene_campaign.mp4

- Оригинальное имя: 4f850ef0-78aa-4df9-bb60-cb32e12c6672.mp4; canonical: 01_primary_library/01_advertising_videos/13_perfume_multi_scene_campaign.mp4.
- video; 600×1066; 15.104 с; исходный звук: да.
- Категория: Advertising Videos; Fragrance campaign with multiple visual worlds and collage styling.
- Роль: ai-video-ads: gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.2.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-13-preview.mp4 | preview | 400×710 | 224730 | 4.5 / нет |
| example-13-detail.mp4 | detail | 600×1066 | 2687607 | 15.104 / да |
| example-13-desktop.avif | desktop | 600×1066 | 33770 | — / — |
| example-13-desktop.webp | desktop | 600×1066 | 57814 | — / — |
| example-13-mobile.avif | mobile | 480×853 | 21858 | — / — |
| example-13-mobile.webp | mobile | 480×853 | 43278 | — / — |

### ID 14 — 14_rosehip_lifestyle_campaign.mp4

- Оригинальное имя: 593b1f6d-1967-4dce-ac20-2d5df33e94b0.mp4; canonical: 01_primary_library/01_advertising_videos/14_rosehip_lifestyle_campaign.mp4.
- video; 600×1066; 15.104 с; исходный звук: да.
- Категория: Advertising Videos; Rosehip product lifestyle campaign across sunny scenes.
- Роль: Резерв — финальная редакционная подборка не использует.
- Решение: reserve. Not in final editorial selection; retained privately to avoid repetitive galleries.
- Poster frame: 1.2.

Производные не создавались: резерв сохранён в распакованном приватном source package.

### ID 15 — 15_marshmallow_creator_ugc.mp4

- Оригинальное имя: 5d920c0b-523d-443f-b122-a09de57d66f7-7421d168255a357a.mp4; canonical: 01_primary_library/04_ugc_style_ads/15_marshmallow_creator_ugc.mp4.
- video; 506×900; 12.050998 с; исходный звук: да.
- Категория: UGC-Style Video Ads; Direct-to-camera creator tasting and showing a marshmallow product.
- Роль: ai-ugc: featured, gallery mapping; duplicate omitted; ai-spokesperson: gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.2.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-15-preview.mp4 | preview | 400×712 | 252571 | 4.5 / нет |
| example-15-detail.mp4 | detail | 506×900 | 1743693 | 12.050998 / да |
| example-15-desktop.avif | desktop | 506×900 | 19926 | — / — |
| example-15-desktop.webp | desktop | 506×900 | 37074 | — / — |
| example-15-mobile.avif | mobile | 480×854 | 18349 | — / — |
| example-15-mobile.webp | mobile | 480×854 | 33998 | — / — |

### ID 16 — 16_manuka_honey_macro_ad.mp4

- Оригинальное имя: 685a6465-c7cc-4b55-a05f-357ecc3ee7f7.mp4; canonical: 01_primary_library/01_advertising_videos/16_manuka_honey_macro_ad.mp4.
- video; 600×1066; 8 с; исходный звук: да.
- Категория: Advertising Videos; Manuka honey product animation with macro ingredient/letter visuals.
- Роль: Резерв — финальная редакционная подборка не использует.
- Решение: reserve. Not in final editorial selection; retained privately to avoid repetitive galleries.
- Poster frame: 1.2.

Производные не создавались: резерв сохранён в распакованном приватном source package.

### ID 17 — 17_model_holding_lume_product.avif

- Оригинальное имя: 711ecf09-1b4a-4441-adb5-b0856f756f7b.avif; canonical: 01_primary_library/03_virtual_models/17_model_holding_lume_product.avif.
- image; 1080×1443; — с; исходный звук: нет.
- Категория: Virtual Models; Commercial model holding a beauty product.
- Роль: virtual-models: gallery; performance-creatives: pair lume.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: исходное изображение / отсутствует в резерве.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-17-desktop.avif | desktop | 960×1283 | 40639 | — / — |
| example-17-desktop.webp | desktop | 960×1283 | 77198 | — / — |
| example-17-mobile.avif | mobile | 480×641 | 14360 | — / — |
| example-17-mobile.webp | mobile | 480×641 | 26236 | — / — |

### ID 18 — 18_gelato_tennis_surreal_ad.mp4

- Оригинальное имя: 742a9540-c728-4f89-921e-bed6bc6079ca.mp4; canonical: 01_primary_library/01_advertising_videos/18_gelato_tennis_surreal_ad.mp4.
- video; 600×1066; 15.104 с; исходный звук: да.
- Категория: Advertising Videos; Surreal sports-themed gelato product campaign.
- Роль: brand-characters: gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.2.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-18-preview.mp4 | preview | 400×710 | 243838 | 4.5 / нет |
| example-18-detail.mp4 | detail | 600×1066 | 2612779 | 15.104 / да |
| example-18-desktop.avif | desktop | 600×1066 | 32950 | — / — |
| example-18-desktop.webp | desktop | 600×1066 | 60934 | — / — |
| example-18-mobile.avif | mobile | 480×853 | 23242 | — / — |
| example-18-mobile.webp | mobile | 480×853 | 46110 | — / — |

### ID 19 — 19_beauty_device_presenter_demo.mp4

- Оригинальное имя: 775ac6dc-a83d-4c4e-a11a-69d9f8cd43d5-3aa4479f2fdb479b.mp4; canonical: 01_primary_library/05_ai_presenters/19_beauty_device_presenter_demo.mp4.
- video; 676×900; 14.070998 с; исходный звук: да.
- Категория: AI Presenters & Avatars; Direct-to-camera presenter demonstrating a beauty device.
- Роль: ai-ugc: gallery; ai-spokesperson: card, featured, gallery mapping; duplicate omitted.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-19-preview.mp4 | preview | 400×532 | 122262 | 4.5 / нет |
| example-19-detail.mp4 | detail | 676×900 | 1411995 | 14.070998 / да |
| example-19-desktop.avif | desktop | 676×900 | 17659 | — / — |
| example-19-desktop.webp | desktop | 676×900 | 28156 | — / — |
| example-19-mobile.avif | mobile | 480×639 | 11523 | — / — |
| example-19-mobile.webp | mobile | 480×639 | 18756 | — / — |

### ID 20 — 20_wallet_feature_explainer.mp4

- Оригинальное имя: 82772c0a-9518-472c-9825-3d84b74f3ee0.mp4; canonical: 01_primary_library/07_explainer_videos/20_wallet_feature_explainer.mp4.
- video; 600×1066; 5.666667 с; исходный звук: да.
- Категория: Explainer Videos; Product feature explainer for a wallet: weight, materials, construction.
- Роль: explainer-videos: gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-20-preview.mp4 | preview | 400×710 | 246909 | 4.5 / нет |
| example-20-detail.mp4 | detail | 600×1066 | 979796 | 5.666667 / да |
| example-20-desktop.avif | desktop | 600×1066 | 18147 | — / — |
| example-20-desktop.webp | desktop | 600×1066 | 31108 | — / — |
| example-20-mobile.avif | mobile | 480×853 | 12755 | — / — |
| example-20-mobile.webp | mobile | 480×853 | 21818 | — / — |

### ID 21 — 21_model_holding_solv_product.avif

- Оригинальное имя: 862de749-aa5c-4816-b028-7e254d969759.avif; canonical: 01_primary_library/03_virtual_models/21_model_holding_solv_product.avif.
- image; 1080×1443; — с; исходный звук: нет.
- Категория: Virtual Models; Commercial model portrait holding a wellness/beauty product.
- Роль: virtual-models: gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: исходное изображение / отсутствует в резерве.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-21-desktop.avif | desktop | 960×1283 | 35346 | — / — |
| example-21-desktop.webp | desktop | 960×1283 | 65716 | — / — |
| example-21-mobile.avif | mobile | 480×641 | 11952 | — / — |
| example-21-mobile.webp | mobile | 480×641 | 21516 | — / — |

### ID 22 — 22_studio_hands_balm_bag.avif

- Оригинальное имя: 90030962-0830-5ccb-b0d2-d6d2b00af47f.avif; canonical: 01_primary_library/02_product_photos_videos/22_studio_hands_balm_bag.avif.
- image; 1080×1446; — с; исходный звук: нет.
- Категория: Product Photos & Videos; Hand balm product placed inside a handbag.
- Роль: performance-creatives: pair studio-hands.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: исходное изображение / отсутствует в резерве.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-22-desktop.avif | desktop | 960×1285 | 47405 | — / — |
| example-22-desktop.webp | desktop | 960×1285 | 104274 | — / — |
| example-22-mobile.avif | mobile | 480×643 | 18472 | — / — |
| example-22-mobile.webp | mobile | 480×643 | 39960 | — / — |

### ID 23 — 23_lume_billboard_city_campaign.mp4

- Оригинальное имя: 912e3fb0-ec08-4963-b833-c258bfe32e6a.mp4; canonical: 01_primary_library/01_advertising_videos/23_lume_billboard_city_campaign.mp4.
- video; 600×1066; 15.104 с; исходный звук: да.
- Категория: Advertising Videos; Lume outdoor/billboard campaign in a stylized miniature city.
- Роль: performance-creatives: pair lume.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.5.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-23-preview.mp4 | preview | 400×710 | 122850 | 4.5 / нет |
| example-23-detail.mp4 | detail | 600×1066 | 1580516 | 15.104 / да |
| example-23-desktop.avif | desktop | 600×1066 | 21120 | — / — |
| example-23-desktop.webp | desktop | 600×1066 | 38518 | — / — |
| example-23-mobile.avif | mobile | 480×853 | 14904 | — / — |
| example-23-mobile.webp | mobile | 480×853 | 28922 | — / — |

### ID 24 — 24_limetta_vitamins_lemons.avif

- Оригинальное имя: 97dae601-98ff-5efb-be81-fb2068305452.avif; canonical: 01_primary_library/02_product_photos_videos/24_limetta_vitamins_lemons.avif.
- image; 1080×1080; — с; исходный звук: нет.
- Категория: Product Photos & Videos; Women’s multivitamin bottle with lemon product staging.
- Роль: product-visuals: gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: исходное изображение / отсутствует в резерве.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-24-desktop.avif | desktop | 960×960 | 19165 | — / — |
| example-24-desktop.webp | desktop | 960×960 | 34922 | — / — |
| example-24-mobile.avif | mobile | 480×480 | 7383 | — / — |
| example-24-mobile.webp | mobile | 480×480 | 12906 | — / — |

### ID 25 — 25_male_model_food_jar.avif

- Оригинальное имя: 987c5b31-e651-4c84-b93a-20106b0c9f93.avif; canonical: 01_primary_library/03_virtual_models/25_male_model_food_jar.avif.
- image; 1080×1620; — с; исходный звук: нет.
- Категория: Virtual Models; Male commercial model presenting a packaged food product.
- Роль: virtual-models: gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: исходное изображение / отсутствует в резерве.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-25-desktop.avif | desktop | 960×1440 | 41370 | — / — |
| example-25-desktop.webp | desktop | 960×1440 | 89392 | — / — |
| example-25-mobile.avif | mobile | 480×720 | 13934 | — / — |
| example-25-mobile.webp | mobile | 480×720 | 26752 | — / — |

### ID 26 — 26_jewelry_unboxing_hands_ugc.mp4

- Оригинальное имя: 9f8bc173-e29a-4fa9-8809-4f6ba0475974-74d89c050f6fa165.mp4; canonical: 01_primary_library/04_ugc_style_ads/26_jewelry_unboxing_hands_ugc.mp4.
- video; 676×900; 15.069002 с; исходный звук: да.
- Категория: UGC-Style Video Ads; Hands-only unboxing and demonstration of jewelry packaging.
- Роль: ai-ugc: gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-26-preview.mp4 | preview | 400×532 | 145685 | 4.5 / нет |
| example-26-detail.mp4 | detail | 676×900 | 1859380 | 15.069002 / да |
| example-26-desktop.avif | desktop | 676×900 | 18029 | — / — |
| example-26-desktop.webp | desktop | 676×900 | 30586 | — / — |
| example-26-mobile.avif | mobile | 480×639 | 11307 | — / — |
| example-26-mobile.webp | mobile | 480×639 | 19552 | — / — |

### ID 27 — 27_olive_oil_pop_art_ad.mp4

- Оригинальное имя: a9c8bc31-ff80-4f43-8e64-293671999d67.mp4; canonical: 01_primary_library/01_advertising_videos/27_olive_oil_pop_art_ad.mp4.
- video; 600×1066; 15.104 с; исходный звук: да.
- Категория: Advertising Videos; Colorful pop-art olive oil product video.
- Роль: brand-characters: gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.2.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-27-preview.mp4 | preview | 400×710 | 299426 | 4.5 / нет |
| example-27-detail.mp4 | detail | 600×1066 | 2850480 | 15.104 / да |
| example-27-desktop.avif | desktop | 600×1066 | 22965 | — / — |
| example-27-desktop.webp | desktop | 600×1066 | 42096 | — / — |
| example-27-mobile.avif | mobile | 480×853 | 16586 | — / — |
| example-27-mobile.webp | mobile | 480×853 | 32852 | — / — |

### ID 28 — 28_typographic_brand_motion.mp4

- Оригинальное имя: aeb9239a-f83b-4958-825f-f95c3a197896.mp4; canonical: 01_primary_library/07_explainer_videos/28_typographic_brand_motion.mp4.
- video; 600×450; 12.256 с; исходный звук: да.
- Категория: Explainer Videos; Typographic brand/message motion piece; useful as a motion-design placeholder, not a full explainer.
- Роль: explainer-videos: gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.8.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-28-preview.mp4 | preview | 400×300 | 40127 | 4.5 / нет |
| example-28-detail.mp4 | detail | 600×450 | 454697 | 12.256 / да |
| example-28-desktop.avif | desktop | 600×450 | 2275 | — / — |
| example-28-desktop.webp | desktop | 600×450 | 3036 | — / — |
| example-28-mobile.avif | mobile | 480×360 | 2182 | — / — |
| example-28-mobile.webp | mobile | 480×360 | 2356 | — / — |

### ID 29 — 29_watch_engineering_explainer.mp4

- Оригинальное имя: aef59e19-f388-4dcc-b55a-e43a5c48c835.mp4; canonical: 01_primary_library/07_explainer_videos/29_watch_engineering_explainer.mp4.
- video; 600×1066; 15.104 с; исходный звук: да.
- Категория: Explainer Videos; Technical watch explainer with exploded parts and specifications.
- Роль: explainer-videos: card, featured, gallery mapping; duplicate omitted.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.2.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-29-preview.mp4 | preview | 400×710 | 249019 | 4.5 / нет |
| example-29-detail.mp4 | detail | 600×1066 | 2503707 | 15.104 / да |
| example-29-desktop.avif | desktop | 600×1066 | 11524 | — / — |
| example-29-desktop.webp | desktop | 600×1066 | 20148 | — / — |
| example-29-mobile.avif | mobile | 480×853 | 8889 | — / — |
| example-29-mobile.webp | mobile | 480×853 | 15386 | — / — |

### ID 30 — 30_plip_metallic_orange_ad.mp4

- Оригинальное имя: af2f10cf-8cf4-4f8c-a8ad-9e19aaf9ea1c.mp4; canonical: 01_primary_library/01_advertising_videos/30_plip_metallic_orange_ad.mp4.
- video; 600×1066; 15.104 с; исходный звук: да.
- Категория: Advertising Videos; Metallic orange PLIP product campaign.
- Роль: performance-creatives: card, pair plip.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 2.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-30-preview.mp4 | preview | 400×710 | 288058 | 4.5 / нет |
| example-30-detail.mp4 | detail | 600×1066 | 2854743 | 15.104 / да |
| example-30-desktop.avif | desktop | 600×1066 | 15352 | — / — |
| example-30-desktop.webp | desktop | 600×1066 | 28068 | — / — |
| example-30-mobile.avif | mobile | 480×853 | 11403 | — / — |
| example-30-mobile.webp | mobile | 480×853 | 21650 | — / — |

### ID 31 — 31_calendula_oil_bubbles_ad.mp4

- Оригинальное имя: b2d7f46d-2650-43d2-93ac-407728c5fedd.mp4; canonical: 01_primary_library/01_advertising_videos/31_calendula_oil_bubbles_ad.mp4.
- video; 600×1066; 5.184 с; исходный звук: да.
- Категория: Advertising Videos; Calendula oil product video with floating bubbles.
- Роль: Резерв — финальная редакционная подборка не использует.
- Решение: reserve. Not in final editorial selection; retained privately to avoid repetitive galleries.
- Poster frame: 1.2.

Производные не создавались: резерв сохранён в распакованном приватном source package.

### ID 32 — 32_nibbo_cartoon_brand_world.mp4

- Оригинальное имя: db4f2714-5085-4759-84f4-0e1596ed8d7e.mp4; canonical: 01_primary_library/08_brand_characters/32_nibbo_cartoon_brand_world.mp4.
- video; 600×1066; 15.104 с; исходный звук: да.
- Категория: Brand Characters & Mascots; Product campaign built around illustrated almond/ingredient characters.
- Роль: brand-characters: card, featured, gallery mapping; duplicate omitted.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.2.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-32-preview.mp4 | preview | 400×710 | 374065 | 4.5 / нет |
| example-32-detail.mp4 | detail | 600×1066 | 3040638 | 15.104 / да |
| example-32-desktop.avif | desktop | 600×1066 | 36243 | — / — |
| example-32-desktop.webp | desktop | 600×1066 | 56668 | — / — |
| example-32-mobile.avif | mobile | 480×853 | 24418 | — / — |
| example-32-mobile.webp | mobile | 480×853 | 43944 | — / — |

### ID 33 — 33_plip_pop_art_green_ad.mp4

- Оригинальное имя: e4e200ac-d0e6-44c8-b12c-b755ed1c39b9.mp4; canonical: 01_primary_library/01_advertising_videos/33_plip_pop_art_green_ad.mp4.
- video; 600×338; 15.104 с; исходный звук: да.
- Категория: Advertising Videos; Green/pink pop-art PLIP product execution.
- Роль: performance-creatives: card, pair plip.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-33-preview.mp4 | preview | 400×226 | 58878 | 4.5 / нет |
| example-33-detail.mp4 | detail | 600×338 | 919885 | 15.104 / да |
| example-33-desktop.avif | desktop | 600×338 | 6320 | — / — |
| example-33-desktop.webp | desktop | 600×338 | 9602 | — / — |
| example-33-mobile.avif | mobile | 480×270 | 4573 | — / — |
| example-33-mobile.webp | mobile | 480×270 | 7528 | — / — |

### ID 34 — 34_nami_shoe_wave_campaign.mp4

- Оригинальное имя: e5cbf89c-209b-4045-8471-407c20ddd700.mp4; canonical: 01_primary_library/01_advertising_videos/34_nami_shoe_wave_campaign.mp4.
- video; 600×1066; 12.256 с; исходный звук: да.
- Категория: Advertising Videos; Sneaker campaign with stylized wave world.
- Роль: ai-video-ads: featured, gallery mapping; duplicate omitted.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.2.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-34-preview.mp4 | preview | 400×710 | 377465 | 4.5 / нет |
| example-34-detail.mp4 | detail | 600×1066 | 2818887 | 12.256 / да |
| example-34-desktop.avif | desktop | 600×1066 | 21874 | — / — |
| example-34-desktop.webp | desktop | 600×1066 | 39634 | — / — |
| example-34-mobile.avif | mobile | 480×853 | 15996 | — / — |
| example-34-mobile.webp | mobile | 480×853 | 31172 | — / — |

### ID 35 — 35_brand_system_motion_explainer.mp4

- Оригинальное имя: f0899b11-b706-43d5-850f-9d71c44e5db1.mp4; canonical: 01_primary_library/07_explainer_videos/35_brand_system_motion_explainer.mp4.
- video; 600×1066; 10.144 с; исходный звук: да.
- Категория: Explainer Videos; Abstract brand-system motion explaining a signal/response idea; not a conventional product explainer.
- Роль: explainer-videos: gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.5.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-35-preview.mp4 | preview | 400×710 | 346826 | 4.5 / нет |
| example-35-detail.mp4 | detail | 600×1066 | 1482641 | 10.144 / да |
| example-35-desktop.avif | desktop | 600×1066 | 17672 | — / — |
| example-35-desktop.webp | desktop | 600×1066 | 34512 | — / — |
| example-35-mobile.avif | mobile | 480×853 | 12381 | — / — |
| example-35-mobile.webp | mobile | 480×853 | 26280 | — / — |

### ID 36 — 36_studio_hands_balm_set.avif

- Оригинальное имя: fa989118-0ecd-5ed9-8ff4-fb2cfde7643a.avif; canonical: 01_primary_library/02_product_photos_videos/36_studio_hands_balm_set.avif.
- image; 1080×1340; — с; исходный звук: нет.
- Категория: Product Photos & Videos; Studio Hands Balm products in a colorful campaign set.
- Роль: performance-creatives: pair studio-hands.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: исходное изображение / отсутствует в резерве.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-36-desktop.avif | desktop | 960×1191 | 39838 | — / — |
| example-36-desktop.webp | desktop | 960×1191 | 71856 | — / — |
| example-36-mobile.avif | mobile | 480×596 | 17709 | — / — |
| example-36-mobile.webp | mobile | 480×596 | 30822 | — / — |

### ID 37 — 37_fizzy_poster_ad.mp4

- Оригинальное имя: marketing-studio-slider-poster-Ads.mp4; canonical: 01_primary_library/01_advertising_videos/37_fizzy_poster_ad.mp4.
- video; 500×376; 5.041667 с; исходный звук: нет.
- Категория: Advertising Videos; Poster-style beverage ad with CTA.
- Роль: brand-characters: gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-37-preview.mp4 | preview | 400×300 | 81143 | 4.5 / нет |
| example-37-detail.mp4 | detail | 500×376 | 223784 | 5.041667 / нет |
| example-37-desktop.avif | desktop | 500×376 | 11807 | — / — |
| example-37-desktop.webp | desktop | 500×376 | 19676 | — / — |
| example-37-mobile.avif | mobile | 480×361 | 10654 | — / — |
| example-37-mobile.webp | mobile | 480×361 | 18174 | — / — |

### ID 38 — 38_body_wash_marketplace_motion.mp4

- Оригинальное имя: marketing-studio-slider-poster-Marketplace.mp4; canonical: 01_primary_library/02_product_photos_videos/38_body_wash_marketplace_motion.mp4.
- video; 500×376; 5.166667 с; исходный звук: нет.
- Категория: Product Photos & Videos; Compact marketplace/product-card motion for body wash.
- Роль: Резерв — финальная редакционная подборка не использует.
- Решение: reserve. Not in final editorial selection; retained privately to avoid repetitive galleries.
- Poster frame: 1.2.

Производные не создавались: резерв сохранён в распакованном приватном source package.

### ID 39 — 39_chips_package_motion_ad.mp4

- Оригинальное имя: marketing-studio-slider-poster-Motion.mp4; canonical: 01_primary_library/01_advertising_videos/39_chips_package_motion_ad.mp4.
- video; 500×376; 10.125 с; исходный звук: нет.
- Категория: Advertising Videos; Motion-design ad for chips packaging.
- Роль: Резерв — финальная редакционная подборка не использует.
- Решение: reserve. Not in final editorial selection; retained privately to avoid repetitive galleries.
- Poster frame: 1.2.

Производные не создавались: резерв сохранён в распакованном приватном source package.

### ID 40 — 40_biojuss_model_campaign.mp4

- Оригинальное имя: marketing-studio-slider-poster-Product.mp4; canonical: 01_primary_library/03_virtual_models/40_biojuss_model_campaign.mp4.
- video; 500×376; 7.08 с; исходный звук: нет.
- Категория: Virtual Models; Polished beauty product campaign featuring commercial models.
- Роль: ai-video-ads: gallery; virtual-models: card, featured, gallery mapping; duplicate omitted.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 3.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-40-preview.mp4 | preview | 400×300 | 101760 | 4.083333 / нет |
| example-40-detail.mp4 | detail | 500×376 | 490417 | 7.08 / нет |
| example-40-desktop.avif | desktop | 500×376 | 8722 | — / — |
| example-40-desktop.webp | desktop | 500×376 | 13768 | — / — |
| example-40-mobile.avif | mobile | 480×361 | 8352 | — / — |
| example-40-mobile.webp | mobile | 480×361 | 13126 | — / — |

### ID 41 — 41_handbag_creator_ugc.mp4

- Оригинальное имя: marketing-studio-slider-poster-UGC.mp4; canonical: 01_primary_library/04_ugc_style_ads/41_handbag_creator_ugc.mp4.
- video; 500×376; 12.04 с; исходный звук: нет.
- Категория: UGC-Style Video Ads; Creator-style handbag demonstration and contents reveal.
- Роль: ai-ugc: card, gallery.
- Решение: staging-only. Selected by final editorial mapping; production blocked until per-asset approval.
- Poster frame: 1.2.

| Приватный derivative (.data/iadds-media/) | Роль | Размер | Байт | Длительность / звук |
| --- | --- | --- | ---: | --- |
| example-41-preview.mp4 | preview | 400×300 | 103399 | 4.5 / нет |
| example-41-detail.mp4 | detail | 500×376 | 604158 | 12.04 / нет |
| example-41-desktop.avif | desktop | 500×376 | 8759 | — / — |
| example-41-desktop.webp | desktop | 500×376 | 14528 | — / — |
| example-41-mobile.avif | mobile | 480×361 | 8130 | — / — |
| example-41-mobile.webp | mobile | 480×361 | 13326 | — / — |

