import type { CaseStudy } from '@/types/content';
// Working brand spelling. Unpublished until every publication requirement is verified.
// Required assets: bot interface clip, source clothing photo, 2–3 final videos,
// public client post and an attributed, verified review. Never supply invented proof.
export const cases: CaseStudy[] = [
  {
    "id": "moda-castle-system",
    "slug": "moda-castle",
    "status": "draft",
    "collaborationModel": "system",
    "contextMedia": {},
    "clientName": "Moda Castle",
    "sector": "Apparel store",
    "projectTitle": "Built a virtual model and Telegram bot for an apparel store’s advertising videos",
    "summary": "The apparel store regularly needs new photos and videos featuring a model in suits, dresses and other products. A traditional workflow would require organising the model, location, filming and editing for every new item.",
    "challenge": "The apparel store regularly needs new photos and videos featuring a model in suits, dresses and other products. A traditional workflow would require organising the model, location, filming and editing for every new item.",
    "idea": "A consistent virtual model was defined for the project—female or male depending on the use case. The client could review and approve the model before committing to full development.",
    "responsibilities": [
      "A consistent virtual model",
      "Telegram bot design",
      "Clothing, accessory and location parameters"
    ],
    "process": [
      {
        "title": "Production interface",
        "body": "A Telegram bot was then designed. The client uploads a product image, adds optional accessories such as jewellery, a watch, glasses or a cap, and selects a location. The setting can be chosen from predefined options or described freely—from a city or forest to Paris, the Moon or a supplied reference image."
      },
      {
        "title": "Repeatable output",
        "body": "After the parameters are confirmed, the system produces an advertising video of approximately 10, 15 or 20 seconds. The result turns manual one-off production into a repeatable workflow that the client can operate independently."
      }
    ],
    "deliverables": [
      "Agreed virtual model",
      "Telegram bot",
      "Advertising videos of approximately 10, 15 or 20 seconds"
    ],
    "media": [],
    "metrics": [],
    "seo": {
      "title": "Built a virtual model and Telegram bot for an apparel store’s advertising videos | Antonov Digital",
      "description": "The apparel store regularly needs new photos and videos featuring a model in suits, dresses and other products. A traditional workflow would require organising the model, location, filming and editing for every new item."
    },
    "services": [
      "virtual-models",
      "ai-video-ads"
    ],
    "approvals": {
      "clientPublication": false,
      "clientNameVerified": false
    },
    "translations": {
      "uk": {
        "contextMedia": {},
        "sector": "Магазин одягу",
        "projectTitle": "Створили віртуальну модель і Telegram-бот для виробництва рекламних відео магазину одягу",
        "summary": "Магазину одягу регулярно потрібні нові фото й відео, у яких модель демонструє костюми, сукні та інші товари. Класичний процес вимагає щоразу організовувати модель, локацію, зйомку й монтаж.",
        "challenge": "Магазину одягу регулярно потрібні нові фото й відео, у яких модель демонструє костюми, сукні та інші товари. Класичний процес вимагає щоразу організовувати модель, локацію, зйомку й монтаж.",
        "idea": "Для проєкту була погоджена постійна віртуальна модель — жіноча або чоловіча залежно від задачі. Її зовнішність клієнт побачив і погодив до оплати повної розробки.",
        "responsibilities": [
          "Постійна віртуальна модель",
          "Проєктування Telegram-бота",
          "Параметри одягу, аксесуарів і локації"
        ],
        "process": [
          {
            "title": "Інтерфейс виробництва",
            "body": "Далі був спроєктований Telegram-бот. Клієнт завантажує фотографію одягу, за потреби додає аксесуари — прикраси, годинник, окуляри, кепку — і обирає локацію. Це може бути один із запропонованих варіантів або власна ідея: місто, ліс, поле, Париж, фантастична сцена чи референсне фото."
          },
          {
            "title": "Повторюваний результат",
            "body": "Після підтвердження параметрів система створює рекламне відео тривалістю приблизно 10, 15 або 20 секунд. Такий підхід перетворює ручне разове виробництво на повторюваний процес, яким клієнт може користуватися самостійно."
          }
        ],
        "deliverables": [
          "Погоджена віртуальна модель",
          "Telegram-бот",
          "Рекламні відео приблизно 10, 15 або 20 секунд"
        ],
        "media": [],
        "metrics": [],
        "seo": {
          "title": "Створили віртуальну модель і Telegram-бот для виробництва рекламних відео магазину одягу | Antonov Digital",
          "description": "Магазину одягу регулярно потрібні нові фото й відео, у яких модель демонструє костюми, сукні та інші товари. Класичний процес вимагає щоразу організовувати модель, локацію, зйомку й монтаж."
        }
      }
    }
  }
];
