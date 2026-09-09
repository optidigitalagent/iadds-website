import type { Locale, Media, Service } from '@/types/content';
import * as en from '../en/process';
import * as uk from '../uk/process';
import { siteConfig } from './settings';
import { serviceGroups } from './service-groups';

export type ServiceInput = Pick<Service, 'slug' | 'professionalLabel' | 'title' | 'shortPromise' | 'overview' | 'whatItIs' | 'problems' | 'bestFor' | 'deliverables' | 'formats' | 'clientInputs' | 'relatedSlugs' | 'accent' | 'cardSpan'> & { alt: string; starterAnswer: string; specialQuestion: string; specialAnswer: string; ethicalNote?: string };
export function defineService(locale: Locale, input: ServiceInput): Service {
  const { alt, starterAnswer, specialQuestion, specialAnswer, ...fields } = input;
  const group = serviceGroups(locale).find(item => item.slugs.includes(input.slug));
  if (!group) throw new Error(`Missing service group: ${input.slug}`);
  const process = locale === 'uk' ? uk : en;
  const asset: Media = { type: 'image', src: `/media/${input.slug}.webp`, mobileSrc: `/media/${input.slug}-mobile.webp`, width: 960, height: 640, alt,
    decorative: false, illustrative: true, focalPoint: '50% 50%', loadingStrategy: 'lazy', sourceStatus: 'original' };
  return { ...fields, group: group.id, category: group.title, id: input.slug, enabled: true, contentStatus: 'approved',
    cardMedia: asset, heroMedia: { ...asset, loadingStrategy: 'eager' }, exampleMedia: [asset],
    processSteps: process.processSteps, commercialNotes: process.commercialNotes,
    faq: [{ question: locale === 'uk' ? 'Що потрібно для початку роботи?' : 'What do you need from us to start?', answer: starterAnswer }, ...process.globalFaq.slice(0, 5), { question: specialQuestion, answer: specialAnswer }],
    seo: { title: `${input.title} | ${siteConfig.brand.metadataName}`, description: input.shortPromise },
  };
}
