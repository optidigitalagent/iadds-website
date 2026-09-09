import type { Locale } from '@/types/content';

/** Master §14: service-specific test scope takes precedence over the general video offer. */
const commercial = {
  'ai-video-ads': {
    uk: { test: 'Одне повне тестове рекламне відео.', price: 'Короткі ролики — від $15. Складні багатосценові відео оцінюємо індивідуально.', formats: '9:16, 1:1, 16:9; короткі та багатосценові відео.', result: 'Ролик або серія, сценарій, візуальний напрям, монтаж, звук і адаптації.', inputs: 'Продукт, сайт або соцмережі, офер, доступні фото й відео, референси.' },
    en: { test: 'One complete advertising test video.', price: 'Short videos start from $15. Complex multi-scene videos are estimated individually.', formats: '9:16, 1:1, 16:9; short and multi-scene videos.', result: 'A video or series, script, visual direction, editing, sound and adaptations.', inputs: 'Product, website or social channels, offer, available photos and videos, references.' },
  },
  'product-visuals': {
    uk: { test: 'Тестовий візуал або короткий ролик за погодженням.', price: 'Прості матеріали — $5–30 за одиницю. Відео — від $15.', formats: 'Статичні матеріали, lifestyle-сцени, короткі циклічні відео й рекламні ролики.', result: 'Візуали товарів, lifestyle-сцени, короткі циклічні та рекламні відео для косметики, їжі, напоїв, електроніки, пакування й інших товарів.', inputs: 'Якісні фото товару, логотип, пакування та референси.' },
    en: { test: 'A test visual or short video, as agreed.', price: 'Simple assets: $5–30 per asset. Videos start from $15.', formats: 'Static assets, lifestyle scenes, short loops and advertising videos.', result: 'Product visuals, lifestyle scenes, short loops and advertising videos for cosmetics, food, drinks, electronics, packaging and other products.', inputs: 'High-quality product photos, logo, packaging and references.' },
  },
  'virtual-models': {
    uk: { test: 'Перша модель і тестовий ролик до рішення про повний проєкт.', price: 'Простий візуал — від $10. Коротке відео — від $20. AI-системи оцінюємо індивідуально.', formats: 'Lookbook, Reels/TikTok, картки товарів, контент кампаній.', result: 'Погоджена віртуальна модель, фото, образи та відео для регулярної демонстрації одягу й аксесуарів.', inputs: 'Фото одягу, розміри й деталі, бренд-референси.' },
    en: { test: 'An initial model and test video before deciding on the full project.', price: 'Simple visuals start from $10. Short videos start from $20. AI systems are estimated individually.', formats: 'Lookbooks, Reels/TikTok, product cards and campaign content.', result: 'An agreed virtual model, photos, looks and videos for regularly presenting clothing and accessories.', inputs: 'Clothing photos, sizes and details, brand references.' },
  },
  'ai-ugc': {
    uk: { test: 'Один повний UGC-style ролик.', price: 'UGC-style відео — $15–50; оцінка залежить від погодженого формату.', formats: 'Переважно 9:16, 10–30 секунд.', result: 'Реклама у стилі відгуку, розпакування, демонстрації, talking-head або рекомендації продукту.', inputs: 'Продукт, офер, ключові переваги та обмеження бренду.' },
    en: { test: 'One complete UGC-style video.', price: 'UGC-style videos: $15–50, depending on the agreed format.', formats: 'Primarily 9:16, 10–30 seconds.', result: 'Review, unboxing, demonstration, talking-head or recommendation-style advertising.', inputs: 'Product, offer, key benefits and brand restrictions.' },
  },
  'ai-spokesperson': {
    uk: { test: 'Короткий повний ролик з AI-ведучим.', price: 'Відео з AI-ведучим — $15–50. Індивідуальний постійний аватар — окрема оцінка.', formats: 'Відео за сценарієм, субтитри, графіка та адаптації форматів.', result: 'Цифровий ведучий пояснює продукт, функцію, пропозицію або інструкцію за погодженим сценарієм.', inputs: 'Текст або тези, брендбук і бажаний тип ведучого.' },
    en: { test: 'A short, complete AI presenter video.', price: 'AI presenter videos: $15–50. A custom recurring avatar is estimated separately.', formats: 'Scripted video, subtitles, graphics and format adaptations.', result: 'A digital presenter explains a product, feature, offer or instruction using an agreed script.', inputs: 'A script or key points, brand guidelines and the desired presenter type.' },
  },
  'video-localization': {
    uk: { test: 'Короткий локалізований фрагмент або ролик.', price: 'Коротка адаптація — $10–30. Серії оцінюємо індивідуально.', formats: 'Нові мови й ринки; субтитри, озвучка та графіка.', result: 'Переклад, озвучка, lip-sync за потреби, субтитри та адаптація графіки.', inputs: 'Вихідне відео, оригінальний текст, мова та цільовий ринок.' },
    en: { test: 'A short localised excerpt or video.', price: 'Short adaptations: $10–30. Series are estimated individually.', formats: 'New languages and markets; subtitles, voice-over and graphics.', result: 'Translation, voice-over, lip-sync when needed, subtitles and adapted graphics.', inputs: 'The source video, original script, language and target market.' },
  },
  'explainer-videos': {
    uk: { test: 'Одна завершена сцена або короткий ролик.', price: 'Індивідуальна оцінка після визначення сценарію.', formats: 'Short explainer, product demo, onboarding, презентаційне відео.', result: 'Структура повідомлення, сценарій, візуальна історія, озвучка й монтаж для пояснення сервісу, SaaS, процесу, освітнього або фінансового продукту.', inputs: 'Опис продукту, інтерфейс або матеріали, ключова аудиторія.' },
    en: { test: 'One finished scene or a short video.', price: 'Estimated individually after the script is defined.', formats: 'Short explainers, product demos, onboarding and presentation videos.', result: 'Message structure, script, visual story, voice-over and editing to explain a service, SaaS, process, educational or financial product.', inputs: 'Product description, interface or source materials, core audience.' },
  },
  'brand-characters': {
    uk: { test: 'Один–два концепти персонажа.', price: 'Індивідуальна оцінка задачі.', formats: 'Реклама, соціальні мережі та подальші сцени з персонажем.', result: 'Концепція, зовнішність, варіанти, сцени й подальший контент із повторюваним героєм бренду.', inputs: 'Цінності бренду, аудиторія, tone of voice і референси.' },
    en: { test: 'One or two character concepts.', price: 'Estimated individually for the objective.', formats: 'Advertising, social media and subsequent character scenes.', result: 'Concept, appearance, variations, scenes and future content with a recurring brand character.', inputs: 'Brand values, audience, tone of voice and references.' },
  },
  'performance-creatives': {
    uk: { test: 'Мінісерія або два варіанти за погодженою гіпотезою.', price: 'Прості варіації — $5–30 за одиницю. Великі серії оцінюємо індивідуально.', formats: 'Різні перші кадри, тривалості, офери та пропорції.', result: 'Серії hooks, оферів, перших кадрів, візуалів, тривалостей і форматів для перевірки різних гіпотез.', inputs: 'Поточна реклама, офер, продукт, аудиторії та доступні дані.' },
    en: { test: 'A mini-series or two variations based on an agreed hypothesis.', price: 'Simple variations: $5–30 per asset. Large series are estimated individually.', formats: 'Different opening frames, durations, offers and aspect ratios.', result: 'Series of hooks, offers, opening frames, visuals, durations and formats for testing different hypotheses.', inputs: 'Current advertising, offer, product, audiences and available data.' },
  },
};
export function getServiceCommercial(slug: string, locale: Locale) {
  const entry = commercial[slug as keyof typeof commercial];
  if (!entry) throw new Error(`Missing approved service scope: ${slug}`);
  return entry[locale];
}
