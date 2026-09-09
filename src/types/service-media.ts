import type { Locale } from './content';
export type RightsStatus = 'unverified' | 'owned' | 'licensed' | 'approved-for-publication';
export type PublicationScope = 'internal' | 'local' | 'staging' | 'production';
export type MediaEnvironment = 'local' | 'production';
export interface MediaApproval { rightsStatus: RightsStatus; publicationScope: PublicationScope; reviewStatus: 'pending' | 'approved' | 'rejected'; approvedBy: string | null; approvedAt: string | null; evidence: string | null }
export interface Derivative { file: string; role: 'preview' | 'detail' | 'desktop' | 'mobile'; format: 'mp4' | 'avif' | 'webp'; width: number; height: number; bytes: number; duration?: number; hasAudio?: boolean }
export interface CatalogAsset { id: number; kind: 'image' | 'video'; sourceFilename: string; sourcePath: string; sourceSha256: string; width: number; height: number; duration: number | null; category: string; description: string; tags: string[]; smallOnly: boolean; disposition: 'staging-only' | 'reserve'; focalPoint: { desktop: string; mobile: string }; derivatives: Derivative[] }
/** Minimal browser view. No original paths, third-party brand names or approval evidence. */
export interface ExampleMedia { id: number; kind: 'image' | 'video'; width: number; height: number; poster: string; posterAvif: string; mobilePoster: string; mobileAvif: string; preview?: string; detail?: string; duration?: number; alt: string; focalPoint: { desktop: string; mobile: string }; smallOnly: boolean; formatExample: true }
export type CoverageStatus = 'strong' | 'temporary' | 'missing' | 'paired';
export interface ServiceMediaMapping { card: number[]; featured: number | null; gallery: number[]; variationSets?: { id: string; ids: [number, number]; label: Record<Locale,string> }[]; coverageStatus: CoverageStatus; replacementRequired: boolean; requiredExampleType: string | null; note?: Record<Locale,string> }
export interface LocalizationPair { id: string; original: { assetId: number; language: string }; localized: { assetId: number; language: string }; changes: { voice: boolean; captions: boolean; graphics: boolean; lipSync: boolean }; rightsStatus: RightsStatus; reviewStatus: 'pending' | 'approved'; approvedBy: string | null; approvedAt: string | null }
