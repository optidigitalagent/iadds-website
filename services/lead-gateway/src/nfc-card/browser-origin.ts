/** One additional exact origin for public NFC routes only. Existing origins remain caller-owned. */
export const NFC_CUSTOM_DOMAIN_ORIGIN='https://nfc-by-ad.shop';
export function nfcBrowserOriginAllowed(origin:string|null,existingOrigin:string,allowCustomDomain:boolean):origin is string {
 return origin!==null&&(origin===existingOrigin||(allowCustomDomain&&origin===NFC_CUSTOM_DOMAIN_ORIGIN));
}
