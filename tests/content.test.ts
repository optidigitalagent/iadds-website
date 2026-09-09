import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {getExperience,getAllServices,getDictionary,getNavigation,getPublishedCases,getRelatedServices,getSiteConfig,getContactDetails,shouldShowCasesInNavigation,isPublishedCase,isVerifiedMetric} from '../src/lib/content';
import {validateContent,validateLocaleParity} from '../src/lib/content/validate';
import type {CaseStudy} from '../src/types/content';
import sitemap from '../src/app/sitemap';
import {consultationHref,getLocaleAlternates,safeExternalUrl,safeSourcePage,switchLocalePath,validModel} from '../src/lib/urls';
import {organizationData,pageMetadata} from '../src/lib/seo';
const services=getAllServices('en');
const dictionaries={en:getDictionary('en'),uk:getDictionary('uk')};
const translations={en:services,uk:getAllServices('uk')};
const fixture:CaseStudy={id:'test-fixture',slug:'test-fixture',status:'draft',clientName:'Test fixture — never published',sector:'Test',projectTitle:'Non-public fixture',summary:'Test data only',challenge:'Test challenge',idea:'Test idea',responsibilities:['Testing'],process:[{title:'Test',body:'Test only'}],deliverables:['Fixture'],services:['ai-video-ads'],media:[0,1].map(i=>({...services[i].cardMedia,status:'client' as const,publicationApproved:true,sourceStatus:'approved' as const,illustrative:false})),metrics:[],publicUrl:'https://example.com/test-publication',testimonial:{quote:'Synthetic test fixture only',author:'Test fixture',role:'Test role',company:'Test company',publicationApproved:true,verified:true,approvalSource:'synthetic unit test'},approvals:{clientPublication:false},seo:{title:'Test fixture',description:'Never published'},translations:{uk:{sector:'Тест',projectTitle:'Непублічний приклад',summary:'Лише тестові дані',challenge:'Тестова задача',idea:'Тестова ідея',responsibilities:['Перевірка'],process:[{title:'Тест',body:'Лише тест'}],deliverables:['Приклад'],media:[0,1].map(i=>({...getAllServices('uk')[i].cardMedia,status:'client' as const,publicationApproved:true,sourceStatus:'approved' as const,illustrative:false})),metrics:[],testimonial:{quote:'Синтетичний тестовий приклад',author:'Тест',role:'Тестова роль',company:'Тестова компанія',publicationApproved:true,verified:true,approvalSource:'synthetic unit test'},seo:{title:'Тестовий приклад',description:'Не публікується'}}}};
test('both locales have nine complete services and matching dictionaries',()=>{validateLocaleParity(dictionaries,translations);for(const locale of ['uk','en'] as const) assert.equal(validateContent(getAllServices(locale),[],getNavigation(locale)).services,9);});
test('missing translation keys, service objects, FAQ and metadata fail parity',()=>{
 const missing=structuredClone(dictionaries);delete (missing.uk.ui as Partial<typeof missing.uk.ui>).menu;assert.throws(()=>validateLocaleParity(missing,translations),/parity|translation/);
 assert.throws(()=>validateLocaleParity(dictionaries,{...translations,uk:translations.uk.slice(1)}),/service translation/);
 for(const section of ['faq','seo'] as const){const broken=structuredClone(translations);if(section==='faq')broken.uk[0].faq=[];else broken.uk[0].seo.title='';assert.throws(()=>validateLocaleParity(dictionaries,broken),/parity|translation/);}
});
test('brand facts and contacts are centrally configured without misspellings',()=>{
 const config=getSiteConfig();assert.equal(config.brand.name,'Antonov Digital');assert.equal(config.brand.productLabel,config.brand.productName+' — By '+config.brand.name);assert.equal(config.defaultLocale,'uk');assert.equal(config.brand.teamSize,2);assert.equal(config.brand.portfolioProjects,30);
 const forbidden=new RegExp('Anton'+'off','i');const visit=(dir:string)=>{for(const entry of readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())visit(file);else if(/\.(ts|tsx|json)$/.test(file))assert.equal(forbidden.test(readFileSync(file,'utf8')),false,file);}};visit(path.join(process.cwd(),'src/content'));
 for(const locale of ['uk','en'] as const){assert.equal(getDictionary(locale).brand.productLabel,config.brand.productLabel);assert.ok(getExperience(locale).behind.paragraphs.join(' ').includes(String(config.brand.portfolioProjects)));}
});
test('service identity, unique slugs and related references are validated',()=>{
 assert.throws(()=>validateContent([...services,services[0]],[],getNavigation('en')),/Duplicate/);
 const broken=structuredClone(services);broken[0].professionalLabel='';assert.throws(()=>validateContent(broken,[],getNavigation('en')),/identity/);
 broken[0].relatedSlugs[0]='missing';assert.throws(()=>validateContent(broken,[],getNavigation('en')),/Broken related/);
 for(const locale of ['uk','en'] as const)for(const service of getAllServices(locale)){assert.equal(getRelatedServices(locale,service.slug).length,3);assert.ok(getRelatedServices(locale,service.slug).every(item=>item.slug!==service.slug));}
});
test('media cannot impersonate client work and must have accessible semantics',()=>{
 const broken=structuredClone(services);broken[0].cardMedia.status='client';assert.throws(()=>validateContent(broken,[],getNavigation('en')),/Unapproved client/);
 broken[0].cardMedia.alt='';assert.throws(()=>validateContent(broken,[],getNavigation('en')),/Invalid alt/);
});
test('published approved translated cases alone activate navigation',()=>{
 assert.equal(shouldShowCasesInNavigation(),false);assert.equal(getNavigation('uk').some(item=>item.href.endsWith('/cases')),false);assert.equal(isPublishedCase(fixture),false);
 const approved={...fixture,status:'published' as const,approvals:{clientPublication:true,clientNameVerified:true,approvedAt:'2026-09-08'}};
 assert.equal(shouldShowCasesInNavigation([approved]),true);assert.equal(getPublishedCases('uk',[approved])[0].projectTitle,fixture.translations!.uk.projectTitle);
 assert.doesNotThrow(()=>validateContent(services,[approved],getNavigation('en')));
 assert.throws(()=>validateContent(services,[{...approved,translations:undefined}],getNavigation('en')),/case translation/);
 assert.throws(()=>validateContent(services,[{...fixture,status:'published'}],getNavigation('en')),/Unapproved case/);
 assert.equal(isPublishedCase({...approved,status:'review'}),false);
 assert.equal(isPublishedCase({...approved,contextMedia:{}}),false);
 const contextMedia={interface:{...approved.media[0],type:'video' as const,poster:approved.media[0].src},input:approved.media[1]};
 assert.equal(isPublishedCase({...approved,contextMedia,translations:{uk:{...approved.translations!.uk,contextMedia}}}),true);
 assert.equal(isPublishedCase({...approved,contextMedia:{...contextMedia,input:{...contextMedia.input,publicationApproved:false}}}),false);
});
test('unverified metrics and unapproved testimonials cannot be published',()=>{
 const approved={...fixture,status:'published' as const,approvals:{clientPublication:true,clientNameVerified:true,approvedAt:'2026-09-08'}};
 assert.throws(()=>validateContent(services,[{...approved,metrics:[{label:'Fixture',value:'1',verified:false,source:'',approvedAt:''}]}],getNavigation('en')),/Unverified metric/);
 assert.throws(()=>validateContent(services,[{...approved,testimonial:{quote:'Fixture',author:'Fixture',role:'Test',company:'Test',publicationApproved:false}}],getNavigation('en')),/Unapproved testimonial/);
 assert.equal(isVerifiedMetric({label:'Test',value:'1',verified:true,source:'',approvedAt:'2026-09-08'}),false);
});
test('contacts have approved destinations and safe link types',()=>{
 const c=getContactDetails(),config=getSiteConfig().contacts;assert.equal(c.emailHref,'mailto:'+config.email);assert.equal(c.phoneHref,'tel:'+config.phone.replace(/[^+\d]/g,''));assert.equal(new URL(c.telegram).hostname,'t.me');assert.equal(new URL(c.instagram).search,'');assert.deepEqual(c.socialLinks.map(item=>item.label),['Telegram','Instagram']);assert.equal(safeExternalUrl('javascript:alert(1)'),undefined);assert.equal(safeExternalUrl('https://user:secret@example.com'),undefined);
});
test('locale switching preserves the service, every query and the hash',()=>{
 assert.equal(switchLocalePath('/uk/services/video-localization?campaign=test#formats','en'),'/en/services/video-localization?campaign=test#formats');
 assert.equal(switchLocalePath('/uk/consultation?service=ai-video-ads&model=production&from=%2Fuk','en'),'/en/consultation?service=ai-video-ads&model=production&from=%2Fuk');
 assert.equal(switchLocalePath('/uk/missing','en'),'/en/missing');assert.equal(getLocaleAlternates('/en/services/ai-ugc')['x-default'],'/uk/services/ai-ugc');
});
test('consultation context only accepts recognized routes, models and services',()=>{
 assert.equal(validModel('system'),'system');assert.equal(validModel(['system']),'');assert.equal(safeSourcePage('//evil.example','uk'),'/uk');assert.equal(safeSourcePage('/en?email=private','en'),'/en');assert.equal(safeSourcePage('/uk/services/ai-ugc','en'),'/uk/services/ai-ugc');
 const link=new URL(consultationHref('uk',{service:'ai-ugc',model:'production',sourcePage:'/uk/services/ai-ugc'}),'https://example.test');assert.equal(link.searchParams.get('service'),'ai-ugc');assert.equal(link.searchParams.get('from'),'/uk/services/ai-ugc');assert.equal(consultationHref('en',{service:'unknown'}),'/en/consultation');
});
test('sitemap, canonical, alternates and schema represent both locales without false proof',()=>{
 const map=sitemap();assert.equal(map.length,34);assert.equal(map.some(item=>item.url.includes('/cases')),false);assert.ok(map.every(item=>item.alternates?.languages?.uk&&item.alternates?.languages?.en));
 for(const locale of ['uk','en'] as const){const metadata=pageMetadata(getDictionary(locale).metadata.home,'',locale);assert.ok(String(metadata.alternates?.canonical).endsWith('/'+locale));assert.ok(metadata.alternates?.languages?.['x-default']);const schema=organizationData(locale);assert.equal('address' in schema,false);assert.equal('aggregateRating' in schema,false);assert.equal(schema.name,getSiteConfig().brand.name);assert.equal(schema.email,getContactDetails().email);}
});

