export type Locale = 'en' | 'uk';
export type ContentStatus = 'provisional' | 'approved';
interface MediaBase {
  src: string; mobileSrc?: string; avifSrc?: string; mobileAvifSrc?: string; sizes?: string; fit?: 'cover' | 'contain';
  width: number; height: number; alt: string; decorative: boolean;
  illustrative: boolean; caption?: string; focalPoint: string;
  loadingStrategy: 'eager' | 'lazy'; sourceStatus: 'original' | 'approved';
  status?: 'concept' | 'client'; publicationApproved?: boolean;
}
export type Media = MediaBase & ({ type: 'image'; poster?: never } | { type: 'video'; poster: string; duration?: number });
export type ServiceGroupId = 'advertising' | 'products' | 'communication' | 'brand';
export interface ServiceGroup { id: ServiceGroupId; title: string; slugs: string[] }
export type CollaborationModel = 'production' | 'system';
export interface Step { title: string; body: string }
export interface FAQ { question: string; answer: string }
export interface Service {
  id: string; slug: string; enabled: boolean; contentStatus: ContentStatus;
  category: string; group: ServiceGroupId; professionalLabel: string; title: string; shortPromise: string; overview: string; whatItIs: string;
  problems: string[]; bestFor: string[]; deliverables: string[]; formats: string[];
  clientInputs: string[]; processSteps: Step[]; commercialNotes: Step[];
  faq: FAQ[]; relatedSlugs: string[]; accent: 'hot' | 'acid'; cardSpan: 4 | 6 | 8;
  cardMedia: Media; heroMedia: Media; exampleMedia: Media[];
  ethicalNote?: string; seo: { title: string; description: string };
}
export interface Metric { label: string; value: string; verified: boolean; source: string; approvedAt: string }
export interface Testimonial { quote: string; author: string; role: string; company: string; publicationApproved: boolean; verified?: boolean; approvalSource?: string; sourceUrl?: string; rating?: { value: number; max: number }; avatar?: Media }
export interface CaseStudy {
  id: string; slug: string; status: 'draft' | 'review' | 'published';
  clientName: string; sector: string; projectTitle: string; summary: string;
  challenge: string; idea: string; responsibilities: string[]; process: Step[];
  deliverables: string[]; services: string[]; media: Media[]; publicUrl?: string;
  contextMedia?: { interface?: Media; input?: Media }; collaborationModel?: CollaborationModel;
  metrics: Metric[]; testimonial?: Testimonial;
  approvals: { clientPublication: boolean; clientNameVerified?: boolean; approvedAt?: string };
  seo: { title: string; description: string };
  translations?: { uk: Pick<CaseStudy, 'sector' | 'projectTitle' | 'summary' | 'challenge' | 'idea' | 'responsibilities' | 'process' | 'deliverables' | 'media' | 'metrics' | 'seo'> & { testimonial?: Testimonial; contextMedia?: CaseStudy['contextMedia'] } };
}
export interface ExternalLink { label: string; url: string }
export type DeepPartial<T> = { [P in keyof T]?: T[P] extends readonly unknown[] ? T[P] : T[P] extends object ? DeepPartial<T[P]> : T[P] };
