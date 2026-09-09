import { getAllServices,getDictionary,getFaq } from '@/lib/content';
import { routeLocale,type LocaleParams } from '@/lib/route-locale';
import { pageMetadata } from '@/lib/seo';
import { Container,FAQAccordion,Section,SectionHeading } from '@/components/ui/primitives';
import { GroupedServiceCatalog } from '@/components/services/service-grid';
import { CatalogIntro,CollaborationModels,ConsultationCTA,HomeContact,ProcessPreview } from '@/components/sections/sections';
import { CustomTaskCTA,TestStage,PublishedCasePreview,WhyNow,PricingPreview,WhoBehind } from '@/components/sections/experience-sections';
export async function generateMetadata({params}:{params:LocaleParams}) {const locale=await routeLocale(params);return pageMetadata(getDictionary(locale).metadata.home,'',locale);}
export default async function Home({params}:{params:LocaleParams}) {const locale=await routeLocale(params),c=getDictionary(locale);return <><CatalogIntro locale={locale} /><Container><div id="services"><GroupedServiceCatalog services={getAllServices(locale)} locale={locale} /></div></Container><CustomTaskCTA locale={locale} sourcePage={'/'+locale} /><TestStage locale={locale} /><PublishedCasePreview locale={locale} /><CollaborationModels locale={locale} /><ProcessPreview locale={locale} /><WhyNow locale={locale} /><PricingPreview locale={locale} /><WhoBehind locale={locale} /><Section id="faq"><SectionHeading eyebrow={c.ui.faqEyebrow} title={c.ui.faq} /><FAQAccordion items={getFaq(locale)} /></Section><ConsultationCTA locale={locale} sourcePage={'/'+locale} /><HomeContact locale={locale} /></>;}
