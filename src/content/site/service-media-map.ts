import type { ServiceMediaMapping, LocalizationPair } from '@/types/service-media';
/** Final mandatory override, source IDs shared between locales. Featured is excluded from the gallery at render time. */
export const serviceMediaMap: Record<string,ServiceMediaMapping> = {
 'ai-video-ads':{card:[6],featured:34,gallery:[6,8,13,34,40],coverageStatus:'strong',replacementRequired:false,requiredExampleType:null},
 'product-visuals':{card:[12],featured:11,gallery:[1,4,11,12,24],coverageStatus:'strong',replacementRequired:false,requiredExampleType:null},
 'virtual-models':{card:[40],featured:40,gallery:[17,21,25,40],coverageStatus:'temporary',replacementRequired:true,requiredExampleType:'Three fashion-specific examples: garments, full or three-quarter model views.',note:{uk:'Приклади комерційного контенту з моделями. Окремі fashion-приклади з одягом готуємо до публікації.',en:'Model-led commercial format examples. Dedicated fashion examples featuring garments are being prepared for publication.'}},
 'ai-ugc':{card:[41],featured:15,gallery:[15,19,26,41],coverageStatus:'strong',replacementRequired:false,requiredExampleType:null},
 'ai-spokesperson':{card:[19],featured:19,gallery:[19,15],coverageStatus:'temporary',replacementRequired:true,requiredExampleType:'Business presenter, branded avatar, and the same presenter in two languages.',note:{uk:'Приклади подачі в кадрі. Вони демонструють формат презентації, а не готового персонального AI-аватара.',en:'Examples of on-camera presentation formats. They demonstrate the delivery style, rather than a ready-made custom AI avatar.'}},
 'video-localization':{card:[],featured:null,gallery:[],coverageStatus:'missing',replacementRequired:true,requiredExampleType:'Three to five original/localized pairs: Ukrainian, English, lip sync, voice, captions and graphics.'},
 'explainer-videos':{card:[29],featured:29,gallery:[20,29,35,28],coverageStatus:'temporary',replacementRequired:true,requiredExampleType:'Two to three SaaS, service or workflow explainers.',note:{uk:'Пояснення фізичних продуктів і приклади motion-дизайну. Приклади для сервісів, SaaS та бізнес-процесів доповнимо окремо.',en:'Physical-product explanations and motion-design examples. Service, SaaS and business-process examples will be added separately.'}},
 'brand-characters':{card:[32],featured:32,gallery:[32,27,18,37],coverageStatus:'temporary',replacementRequired:true,requiredExampleType:'Two to three recurring character systems, consistent across campaign scenes.',note:{uk:'Персонажі та візуальний світ бренду. Допоміжні приклади показують артдирекцію; вони не є готовими системами повторюваних маскотів.',en:'Characters and a visual brand world. Supporting examples show art direction; they are not complete recurring mascot systems.'}},
 'performance-creatives':{card:[30,33],featured:null,gallery:[],coverageStatus:'paired',replacementRequired:false,requiredExampleType:null,variationSets:[
  {id:'plip',ids:[30,33],label:{uk:'Один продукт — дві артдирекції',en:'One product — two art directions'}},
  {id:'lume',ids:[17,23],label:{uk:'Один продукт — модель і рекламне середовище',en:'One product — model visual and campaign setting'}},
  {id:'studio-hands',ids:[22,36],label:{uk:'Один продукт — два візуальні контексти',en:'One product — two visual settings'}},
 ]},
};
/** Populate only with reviewed before/after pairs; the UI is driven by this data. */
export const localizationPairs: LocalizationPair[] = [];
