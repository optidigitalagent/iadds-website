import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { cases } from '../src/content/cases';
import { getAllServices,getDictionary,getNavigation,getExperience,getProcessSteps,getFaq,getSiteConfig } from '../src/lib/content';
import { getServiceCommercial } from '../src/content/site/service-commercial';
import { validateContent,validateLocaleParity } from '../src/lib/content/validate';
import { locales } from '../src/lib/urls';
const publicGraph = (locale: 'uk'|'en') => ({ dictionary:getDictionary(locale),experience:getExperience(locale),process:getProcessSteps(locale),faq:getFaq(locale),commercial:getAllServices(locale).map(s=>getServiceCommercial(s.slug,locale)) });
validateLocaleParity({uk:publicGraph('uk'),en:publicGraph('en')},{uk:getAllServices('uk'),en:getAllServices('en')});
const brand=getSiteConfig().brand;
if(brand.teamSize!==2||brand.team.length!==2||brand.portfolioProjects!==30||brand.additionalExperiments!==50) throw new Error('Unapproved team/portfolio facts');
const manifest=JSON.parse(readFileSync('docs/founder-media-manifest.json','utf8')) as {outputs:{file:string}[]}[];
if(manifest.length!==7) throw new Error('Expected all seven founder sources');
for(const item of manifest) { if(item.outputs.length!==4) throw new Error('Expected desktop/mobile AVIF/WebP'); for(const output of item.outputs) if(!existsSync(path.join('public',output.file))) throw new Error('Missing founder derivative: '+output.file); }
for(const locale of locales) {
 const services=getAllServices(locale); const result=validateContent(services,cases,getNavigation(locale));
 const e=getExperience(locale);
 if(getProcessSteps(locale).length!==7||getFaq(locale).length!==13||e.test.facts.length!==5||e.pricing.items.length!==3||e.founder.timeline.length!==8||e.company.items.length!==9||e.founder.competencies.length!==6) throw new Error('Incomplete package content: '+locale);
 for(const service of services) for(const media of [service.cardMedia,service.heroMedia,...service.exampleMedia]) for(const source of [media.src,media.mobileSrc,media.poster].filter(Boolean) as string[]) {
  if(!existsSync(path.join(process.cwd(),'public',source))) throw new Error('Missing asset: '+source);
 }
 process.stdout.write(locale+': '+result.services+' services, '+result.publishedCases+' published cases; locale parity passed.\n');
}
