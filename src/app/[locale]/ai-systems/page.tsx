import { getCommercialNotes, getDictionary, getExperience, getFaq } from '@/lib/content';
import { routeLocale, type LocaleParams } from '@/lib/route-locale';
import { consultationHref, localizedPath } from '@/lib/urls';
import { pageMetadata } from '@/lib/seo';
import { BulletList, Button, DetailGrid, FAQAccordion, Section, SectionHeading, TextLink } from '@/components/ui/primitives';
import { PageHero, ProcessPreview } from '@/components/sections/sections';
export async function generateMetadata({params}:{params:LocaleParams}) { const locale=await routeLocale(params); return pageMetadata(getDictionary(locale).metadata.aiSystems,'/ai-systems',locale); }
export default async function AISystems({params}:{params:LocaleParams}) {
  const locale=await routeLocale(params), c=getDictionary(locale), e=getExperience(locale), s=e.systems;
  const href=consultationHref(locale,{model:'system',sourcePage:localizedPath(locale,'/ai-systems')});
  return <><PageHero eyebrow={s.eyebrow} title={s.title} body={s.paragraphs[0]}><div className="page-actions"><Button href={href} location="ai-system-hero">{s.cta}</Button></div></PageHero><Section><SectionHeading title={s.benefitsTitle} body={s.paragraphs[1]} /><BulletList items={s.benefits} /></Section><Section><SectionHeading title={s.formatsTitle} /><div className="format-options">{s.formats.map((format,i)=><div key={format} data-reveal><span>0{i+1}</span><h3>{format}</h3></div>)}</div><div className="page-actions"><Button href={href} location="ai-system-benefits">{s.cta}</Button></div></Section><ProcessPreview locale={locale} /><Section><SectionHeading title={e.pricing.scopeTitle} body={e.pricing.scopeBody} /><TextLink href={localizedPath(locale,'/pricing')}>{e.pricing.link}</TextLink><div className="page-actions"><DetailGrid items={getCommercialNotes(locale)} /></div></Section><Section><SectionHeading eyebrow="FAQ" title={c.ui.faq} /><FAQAccordion items={getFaq(locale).filter((_,i)=>[0,1,8,9,11,12].includes(i))} /></Section><Section><SectionHeading title={s.cta} body={e.pricing.items[2]} /><Button href={href} location="ai-system-final">{s.cta}</Button></Section></>;
}
