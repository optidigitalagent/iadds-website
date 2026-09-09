import { NextResponse, type NextRequest } from 'next/server';
import { getCaseBySlug, getServiceBySlug } from '@/lib/content';
import { isLocale } from '@/lib/urls';
import { siteConfig } from '@/content/site/settings';
function destinationUrl(request: NextRequest) {
  const url = request.nextUrl.clone();
  // Preserve the browser origin when Next normalizes a loopback request to localhost.
  const host = request.headers.get('host'); if (host) url.host = host;
  return url;
}
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const cookie = request.cookies.get(siteConfig.localeCookie)?.value;
  const preferred = isLocale(cookie) ? cookie : siteConfig.defaultLocale;
  const parts = path.split('/').filter(Boolean);
  if (!parts.length || ['services','about','ai-systems','pricing','process','contact','consultation','cases'].includes(parts[0])) {
    const target=destinationUrl(request); target.pathname='/' + preferred + (path==='/'?'':path);
    const response=NextResponse.redirect(target,307); response.headers.set('Cache-Control','private, no-store'); response.headers.set('Vary','Cookie'); return response;
  }
  const locale = isLocale(parts[0]) ? parts[0] : siteConfig.defaultLocale;
  const tail = parts.slice(1);
  const valid = isLocale(parts[0]) && (tail.length===0 || (tail.length===1 && ['services','about','ai-systems','pricing','process','contact','consultation','cases','opengraph-image','missing'].includes(tail[0])) || (tail.length===2 && ((tail[0]==='services' && getServiceBySlug(locale,tail[1])) || (tail[0]==='cases' && getCaseBySlug(locale,tail[1])))));
  if (valid) return NextResponse.next();
  const missing=destinationUrl(request); missing.pathname='/' + locale + '/missing';
  return NextResponse.rewrite(missing,{status:404});
}
export const config = { matcher: ['/((?!api(?:/|$)|_next/|media/|fonts/|favicon\\.svg|robots\\.txt|sitemap\\.xml|media-manifest\\.json).*)'] };
