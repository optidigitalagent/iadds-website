import type { CollaborationModel, Locale } from '@/types/content';
import { siteConfig } from '@/content/site/settings';
export const eventNames = ['locale_switch','navigation_click','service_card_open','collaboration_model_select','test_stage_cta_click','consultation_cta_click','consultation_form_start','consultation_service_preselected','consultation_submit_success','consultation_submit_error','contact_email_click','contact_phone_click','contact_telegram_click','contact_instagram_click'] as const;
export interface AnalyticsProperties { locale?: Locale; sourcePage?: string; serviceSlug?: string; collaborationModel?: CollaborationModel; destination?: string; componentLocation?: string; errorType?: string; projectName?: string; projectLabel?: string }
export type AnalyticsEvent = { name: typeof eventNames[number]; properties?: AnalyticsProperties };
type Adapter = (event: AnalyticsEvent) => void;
let adapter: Adapter = () => undefined;
export function configureAnalytics(next: Adapter) { adapter = next; }
export function track(event: AnalyticsEvent) { try { adapter({ ...event, properties: { ...event.properties, projectName: siteConfig.brand.productName, projectLabel: siteConfig.brand.productLabel } }); } catch { /* Analytics cannot interrupt a user action. */ } }
