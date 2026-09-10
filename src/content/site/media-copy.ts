import {resolveBrandText} from './brand-text';
import type {Locale} from '@/types/content';
export const mediaCopy={
 uk:{previewQuality:'Прев’ю на сайті стиснене й оптимізоване для швидкого завантаження. Фінальні матеріали передаються у повній якості.',label:'Приклад формату',title:'Як може виглядати ваш формат',body:'Добірка візуальних підходів до цієї задачі. Це приклади форматів, а не клієнтські кейси {{product}}.',play:'Переглянути відео',pause:'Зупинити відео',unavailable:'Відео тимчасово недоступне. Перегляньте постер.',productionTitle:'Покажемо підхід до вашої задачі',productionBody:'Розкажіть про продукт і ціль. На консультації обговоримо візуальний напрям та відповідний формат.',localizationTitle:'Порівняння оригіналу та локалізації — незабаром',localizationBody:'Готуємо парні приклади, у яких можна оцінити переклад, голос, субтитри, графіку та синхронізацію губ. Обговоримо потрібні мови й адаптацію вашого відео на консультації.',original:'Оригінал',localized:'Локалізована версія',variations:'Один продукт. Різні подачі.',variationsBody:'Порівняйте, як змінюються ракурс, формат і візуальний напрям для того самого продукту.',motion:'Приклад motion-дизайну',brandWorld:'Приклад візуального світу бренду'},
 en:{previewQuality:'Website previews are compressed and optimized for fast loading. Final files are delivered in full quality.',label:'Format example',title:'What your format could look like',body:'A selection of visual approaches to this task. These are format examples, not {{product}} client cases.',play:'Play video',pause:'Pause video',unavailable:'The video is temporarily unavailable. You can still view its poster.',productionTitle:'Explore an approach to your project',productionBody:'Tell us about your product and objective. During a consultation, we will discuss a visual direction and a suitable format.',localizationTitle:'Original and localized comparisons — coming soon',localizationBody:'We are preparing paired examples that show translation, voice, captions, graphics and lip sync. We can discuss the languages and adaptations your video needs during a consultation.',original:'Original',localized:'Localized version',variations:'One product. Different expressions.',variationsBody:'Compare how the angle, format and visual direction change for the same product.',motion:'Motion-design example',brandWorld:'Visual brand-world example'},
} as const;
const descriptions:Record<number,[string,string]>={
 1:['Жовті банки напою серед трави у товарній композиції.','Yellow beverage cans arranged in grass for a lifestyle product visual.'],
 4:['Відкритий бальзам для губ у чистій студійній композиції.','An open lip balm compact in a clean studio composition.'],
 6:['Вертикальний рекламний формат із динамічним перетворенням упаковки продукту.','Vertical advertising format with a dynamic product-packaging transformation.'],
 8:['Яскравий попарт-ролик із банкою ягідного продукту.','A vivid pop-art video featuring a jar of berry preserve.'],
 11:['Предметний ролик із флаконом сироватки в золотому середовищі.','Product motion featuring a serum bottle in a gold setting.'],
 12:['Косметичний тюбик на льоду з ягодами.','A cosmetic tube on ice blocks with berries.'],
 13:['Реклама парфумів зі зміною візуальних світів і колажною графікою.','A fragrance advertising format with changing visual worlds and collage graphics.'],
 15:['Приклад creator-відео з презентацією солодощів у кадрі.','A creator-style format presenting a confectionery product to camera.'],
 17:['Модель презентує косметичний продукт у рекламному портреті.','A commercial portrait of a model presenting a beauty product.'],
 18:['Сюрреалістичний рекламний світ морозива з тенісною тематикою.','A surreal gelato advertising world with a tennis theme.'],
 19:['Презентація косметичного пристрою ведучою в кадрі.','An on-camera presenter demonstrating a beauty device.'],
 20:['Відеопояснення конструкції та характеристик гаманця.','A video explanation of wallet construction and features.'],
 21:['Комерційний портрет моделі з продуктом у руках.','A commercial model portrait with a handheld product.'],
 22:['Бальзам для рук у повсякденній композиції з сумкою.','Hand balm in a lifestyle setting with a handbag.'],
 23:['Рекламна композиція з білбордом у стилізованому місті.','A billboard advertising composition in a stylized city.'],
 24:['Вітаміни з лимонами у студійній товарній композиції.','Vitamins with lemons in a studio product composition.'],
 25:['Чоловіча модель презентує упакований харчовий продукт.','A male commercial model presenting a packaged food product.'],
 26:['Руки розпаковують і демонструють прикраси.','Hands unboxing and demonstrating jewelry.'],
 27:['Продукт і мальовані елементи в яскравому попарт-світі.','A product with illustrated elements in a vivid pop-art world.'],
 28:['Типографічна анімація як приклад motion-дизайну.','Animated typography as a motion-design format example.'],
 29:['Технічне відеопояснення годинника з розібраним механізмом.','A technical watch explainer with an exploded mechanism.'],
 30:['Металева помаранчева артдирекція для товарної реклами.','Metallic orange art direction for a product advertising format.'],
 32:['Мальовані персонажі навколо продукту у впізнаваному візуальному світі.','Illustrated characters surrounding a product in a distinctive visual world.'],
 33:['Зелено-рожева попарт-варіація реклами того самого продукту.','A green and pink pop-art advertising variation for the same product.'],
 34:['Реклама кросівок у стилізованому світі хвиль.','A sneaker advertising format in a stylized world of waves.'],
 35:['Абстрактна графіка сигналу та реакції як motion-приклад.','Abstract signal-and-response graphics as a motion-design example.'],
 36:['Продукти для рук у кольоровому студійному середовищі.','Hand-care products in a colorful studio setting.'],
 37:['Компактний анімований рекламний постер напою.','A compact animated beverage advertising poster.'],
 40:['Компактний beauty-ролик із продуктом та комерційними моделями.','A compact beauty format featuring a product and commercial models.'],
 41:['Creator-відео з демонстрацією сумки та її вмісту.','A creator-style format demonstrating a handbag and its contents.'],
};
export function exampleAlt(id:number,locale:Locale){const pair=descriptions[id];if(!pair)throw Error(`Missing localized example alt: ${id}`);return pair[locale==='uk'?0:1];}

export function getMediaCopy(locale:Locale){return resolveBrandText(mediaCopy[locale],locale);}
