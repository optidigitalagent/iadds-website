import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeRequest,parseWire,requestDigest,quoteRequest,buildReceipt,validateReceipt,canonicalJSON,NfcV2Error,normalizeGoogleURL,normalizeMenuURL,normalizeInstagramURL,errorEnvelope,validateErrorEnvelope,ERROR_STATUSES } from '../src/nfc-card/v2/contract.ts';
import { ACTIVE_ENTRIES, DRAFT_ENTRIES, LIMITS, MENU_VARIANTS, groupPrice, getEntry } from '../src/nfc-card/v2/registry.ts';
const specimens=JSON.parse(readFileSync(new URL('./fixtures/nfc-v35-requests.json',import.meta.url),'utf8'));
// Deliberately mutable invalid receipts exercise the parser's unknown boundary.
type MutatedReceipt={quote:{totalMinor:number;currency:string;pricingRevision:string;groups:{lineIds:string[]}[]};acceptedRequest:{lines:{configuration:{notes?:string}}[]};requestDigest:{sha256:string};durableSaved:boolean;notificationStatus:string;extra?:boolean};
const clone=<T>(x:T):T=>structuredClone(x);
const base=()=>clone(specimens.positive[0].wire);
function rejects(fn:()=>unknown,code?:string,status?:number){assert.throws(fn,(e:unknown)=>e instanceof NfcV2Error&&(!code||e.code===code)&&(!status||e.status===status));}
for(const e of specimens.positive)test('CF01 positive '+e.id,()=>{
 const before=JSON.stringify(e.wire),n=normalizeRequest(e.wire);assert.deepEqual(n,e.normalized);assert.deepEqual(parseWire(JSON.stringify(e.wire)),e.normalized);assert.equal(requestDigest(n),e.digestSha256);assert.equal(canonicalJSON(n),e.canonicalUtf8);
 assert.deepEqual(quoteRequest(n,{quoteId:e.receipt.quote.quoteId,pricingRevision:e.receipt.quote.pricingRevision}),e.receipt.quote);
 assert.deepEqual(buildReceipt(n,{requestId:e.receipt.requestId,acceptedAt:e.receipt.acceptedAt,quoteId:e.receipt.quote.quoteId,pricingRevision:e.receipt.quote.pricingRevision}),e.receipt);
 assert.equal(validateReceipt(n,e.receipt),true);assert.equal(JSON.stringify(e.wire),before);
});
for(const e of specimens.negative)test('CF01 negative '+e.id,()=>{rejects(()=>normalizeRequest(e.wire),e.expectedCode,e.expectedHttp);rejects(()=>parseWire(JSON.stringify(e.wire)),e.expectedCode,e.expectedHttp);});
for(const e of specimens.rawNegative)test('CF01 raw negative '+e.id,()=>{rejects(()=>parseWire(e.rawHex?Buffer.from(e.rawHex,'hex'):e.rawUtf8),e.expectedCode,e.expectedHttp);});
test('registry immutable, nine active, six variants, draft excluded',()=>{assert.equal(ACTIVE_ENTRIES.length,9);assert.equal(MENU_VARIANTS.length,6);for(const d of DRAFT_ENTRIES)assert.equal(getEntry(d),undefined);assert.throws(()=>{(ACTIVE_ENTRIES[0]as {offerId:string}).offerId='branded';},TypeError);});
test('all approved Menu tier boundaries and 3D unit arithmetic',()=>{for(const [q,ua,pl]of [[1,1000,89],[4,4000,356],[5,3750,345],[9,6750,621],[10,6000,550],[24,14400,1320],[25,12500,1125],[10000,5000000,450000]]){assert.equal(groupPrice('nfc-menu-card',q,'UA').amountMinor,ua*100);assert.equal(groupPrice('nfc-menu-card',q,'PL').amountMinor,pl*100);}assert.equal(groupPrice('review-card-3d',10000,'UA').amountMinor,4000000000);assert.equal(groupPrice('review-card-3d',10000,'PL').amountMinor,349000000);});
test('quote known partial/null, included once deposit, no online pay, source currency',()=>{
 for(const e of specimens.positive){const q=quoteRequest(normalizeRequest(e.wire));assert.equal(q.paymentRequired,false);assert.equal(q.dueNowMinor,null);if(q.completeness==='complete')assert.equal(q.depositPolicy.amountMinor,q.market==='PL'?2000:20000);else assert.equal(q.depositPolicy.amountMinor,null);if(q.completeness==='partial'||q.completeness==='quote_required')assert.equal(q.totalMinor,null);if(q.completeness==='consultation'){assert.deepEqual(q.groups,[]);assert.equal(q.physicalQuantity,null);assert.equal(q.knownSubtotalMinor,null);}if(q.market==='PL')assert.equal(q.delivery.amountMinor,null);}
});
test('bundle groups span locations but never merge fulfillment lines',()=>{const e=specimens.positive.find((x:{id:string})=>x.id==='uk_google_split_pack');const n=normalizeRequest(e.wire);assert.equal(quoteRequest(n).totalMinor,260000);assert.equal(n.lines.length,2);assert.notEqual(n.lines[0].configuration.googleLocationUrl,n.lines[1].configuration.googleLocationUrl);assert.equal(quoteRequest(n).groups[0].unitAmountMinor,null);});
test('scalar length, raw/normalized Unicode, LF/CRLF and optional empty normalization',()=>{
 const b=base();b.customerName=' '+ '😀'.repeat(98)+' ';assert.equal([...normalizeRequest(b).customerName].length,98);b.customerName='😀'.repeat(101);rejects(()=>normalizeRequest(b));
 const c=base();c.lines[0].configuration.notes=' e\u0301\r\nSecond\rThird ';c.serviceNotes='';c.utm={source:''};const n=normalizeRequest(c);assert.equal(n.lines[0].configuration.notes,'é\nSecond\nThird');assert.equal(n.serviceNotes,null);assert.deepEqual(n.utm,{});
 for(const bad of ['\ud800','\udfff','a\u202eb','a\u0000b','a\tb']){const d=base();d.customerName=bad;rejects(()=>normalizeRequest(d));}
});
test('optional contact/URL must be nonempty; forbidden Menu URL presence wins',()=>{
 for(const [k,v]of [['email',''],['phone',''],['telegram','']]){const b=base();b.contact[k]=v;rejects(()=>normalizeRequest(b));}
 const b=base();b.lines[0].configuration.googleLocationUrl='';rejects(()=>normalizeRequest(b));const m=clone(specimens.positive.find((x:{id:string})=>x.id==='uk_menu_development_physical').wire);m.lines[0].configuration.menuUrl='';rejects(()=>normalizeRequest(m),'invalid_configuration');
});
test('raw duplicate decoded keys at every depth, prohibited object keys',()=>{
 for(const s of ['{"x":1,"x":2}','{"x":{"q":1,"\\u0071":1}}','{"a":[{"b":1,"b":1}]}'])rejects(()=>parseWire(s),'duplicate_json_key',400);
 for(const s of ['{"__proto__":{}}','{"constructor":1}','{"x":{"prototype":1}}'])rejects(()=>parseWire(s),'invalid_payload',422);
});
test('numeric tokens reject exponent/fraction/negative/unsafe at parser boundary',()=>{
 for(const n of ['1e0','1E2','1.0','-0','-1','+1','01','NaN','Infinity','9007199254740992'])rejects(()=>parseWire('{"quantity":'+n+'}'),'invalid_number_token',400);
 for(const n of [-0,-1,1.5,NaN,Infinity,9007199254740992]){const b=base();b.lines[0].quantity=n;rejects(()=>normalizeRequest(b),'invalid_number_token',400);}
});
test('malformed strings, UTF8, BOM and trailing values reject',()=>{
 for(const s of ['','{','{"a":}','[1,]','{"a":1,}','"a\n"','{} {}','true false','{"a":"\\x41"}'])rejects(()=>parseWire(s),'malformed_json',400);
 for(const bytes of [Buffer.from([0xff]),Buffer.from([0xc0,0xaf]),Buffer.from([0xed,0xa0,0x80]),Buffer.from([0xef,0xbb,0xbf,0x7b,0x7d])])rejects(()=>parseWire(bytes),'invalid_encoding',400);
 rejects(()=>parseWire('{"x":"\\ud800"}'),'invalid_encoding',400);
});
test('raw exact UTF8 body limit inclusive and multibyte measured by bytes',()=>{
 const raw=JSON.stringify(base());const padded=raw+' '.repeat(LIMITS.requestBytes-Buffer.byteLength(raw));assert.deepEqual(parseWire(padded),normalizeRequest(base()));rejects(()=>parseWire(padded+' '),'request_too_large',413);
 const b=base();b.lines[0].configuration.notes='😀'.repeat(2000);assert.ok(Buffer.byteLength(JSON.stringify(b))<LIMITS.requestBytes);normalizeRequest(b);
 const many=base();many.lines=Array.from({length:20},(_,i)=>({...clone(many.lines[0]),lineId:`00000000-0000-4000-8000-${String(i).padStart(12,'0')}`,configuration:{notes:'😀'.repeat(2000)}}));rejects(()=>normalizeRequest(many),'request_too_large',413);
});
test('nesting depth is bounded prior to deep recursion',()=>{rejects(()=>parseWire('['.repeat(13)+'0'+']'.repeat(13)),'nesting_limit',413);const b=base();b.lines[0].configuration.notes={x:{x:{x:{x:{x:{x:{x:{x:{x:{x:{x:{x:1}}}}}}}}}}}};rejects(()=>normalizeRequest(b),'nesting_limit',413);});
test('source locale/path allowlist, canonical trailing slash, UTM strict',()=>{
 const b=base();b.sourcePage='/nfc-card-website/cart';assert.equal(normalizeRequest(b).sourcePage,'/nfc-card-website/cart/');for(const s of ['/nfc-card-website/en/cart/','/nfc-card-website/cart/?q=x','/nfc-card-website/cart/#x','/nfc-card-website/%63art/','/nfc-card-website/../cart/','/nfc-card-website\\cart','https://example.com/']){b.sourcePage=s;rejects(()=>normalizeRequest(b),'invalid_source_locale');}const u=base();u.utm={extra:'x'};rejects(()=>normalizeRequest(u));
});
test('URL grammars syntax only, raw default ports/private literals and reserved profiles',()=>{
 assert.equal(normalizeGoogleURL('https://g.page/synthetic'), 'https://g.page/synthetic');assert.equal(normalizeMenuURL('http://example.com/menu'),'http://example.com/menu');assert.equal(normalizeInstagramURL('https://instagram.com/Synthetic_Name'),'https://www.instagram.com/synthetic_name/');
 for(const s of ['https://google.com:443/maps','https://g.page:443/x','https://u:p@google.com/maps','https://google.com.evil.invalid/maps','https://google.com./x','https://google.com\\@example.com/','http://google.com/maps'])rejects(()=>normalizeGoogleURL(s),'invalid_configuration');
 for(const s of ['http://example.com:80/menu','https://example.com:443/menu','http://127.1/menu','http://2130706433/menu','http://0x7f000001/menu','http://10.0.0.1/menu','http://169.254.169.254/menu','http://100.64.0.1/menu','http://[::1]/menu','http://localhost/menu','http://service.internal/menu'])rejects(()=>normalizeMenuURL(s),'invalid_configuration');
 for(const s of ['https://instagram.com/reel/','https://instagram.com/p/','https://instagram.com/name..bad/','https://instagram.com/.bad/','https://instagram.com/name/?x=1','@synthetic'])rejects(()=>normalizeInstagramURL(s),'invalid_configuration');
});
test('every Branded service preserves full context, ready/draft do not inherit',()=>{
 for(const e of specimens.positive.filter((x:{id:string})=>x.id.includes('_design_'))){const n=normalizeRequest(e.wire);assert.equal(n.serviceContext?.entryId,e.normalized.serviceContext.entryId);assert.deepEqual(n.serviceContext?.configuration,e.normalized.serviceContext.configuration);assert.deepEqual(n.lines,[]);assert.equal(quoteRequest(n).totalMinor,null);}
 const b=clone(specimens.positive.find((x:{id:string})=>x.id==='uk_design_branded-beauty-review-card').wire);b.serviceContext.entryId='universal-branded-mini';rejects(()=>normalizeRequest(b),'offer_unavailable');b.serviceContext.entryId='beauty-review-card';b.serviceContext.offerId='ready';rejects(()=>normalizeRequest(b),'invalid_configuration');
});
test('consent is synthetic shape only and cannot be unlocked by a client test flag',()=>{const b=base();b.testMode=true;rejects(()=>normalizeRequest(b));delete b.testMode;b.consent.formVersion='NFC-CARD-FORM-V35';rejects(()=>normalizeRequest(b));b.consent.requestProcessing=false;rejects(()=>normalizeRequest(b));});
test('normalizer does not mutate frozen input and rejects getters/cycles/undefined/null',()=>{
 function freeze(o:unknown){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}normalizeRequest(freeze(base()));
 const b=base();Object.defineProperty(b,'customerName',{get(){throw Error('getter executed');},enumerable:true});rejects(()=>normalizeRequest(b));const c=base();c.utm=c;rejects(()=>normalizeRequest(c));const u=base();u.serviceNotes=undefined;rejects(()=>normalizeRequest(u));const n=base();n.serviceNotes=null;rejects(()=>normalizeRequest(n));
});
test('digest domain and semantic mutations; order/challenge/NFC equivalence',()=>{
 const e=specimens.positive.find((x:{id:string})=>x.id==='uk_google_split_pack');const b=clone(e.wire),hash=requestDigest(normalizeRequest(b));b.lines.reverse();b.challenge='DIFFERENT.'+'B'.repeat(43);assert.equal(requestDigest(normalizeRequest(b)),hash);
 const n=clone(e.normalized);n.lines[0].configuration.notes='Different';assert.notEqual(requestDigest(n),hash);const c=clone(e.normalized);c.contact.email='other@example.invalid';assert.notEqual(requestDigest(c),hash);
 const u=clone(specimens.positive.find((x:{id:string})=>x.id==='unicode_escape_vector').wire);const d=requestDigest(normalizeRequest(u));u.lines[0].configuration.brandInputs.styleNote='e\u0301';assert.equal(requestDigest(normalizeRequest(u)),d);
});
test('receipt rejects any config/money/revision/coverage/unknown-field mismatch',()=>{
 const e=specimens.positive[0],n=normalizeRequest(e.wire);
 for(const mutate of [(r:MutatedReceipt)=>r.quote.totalMinor++, (r:MutatedReceipt)=>r.quote.currency='PLN',(r:MutatedReceipt)=>r.quote.pricingRevision='UNAPPROVED',(r:MutatedReceipt)=>r.quote.groups[0].lineIds=[],(r:MutatedReceipt)=>r.acceptedRequest.lines[0].configuration.notes='Changed',(r:MutatedReceipt)=>r.requestDigest.sha256='0'.repeat(64),(r:MutatedReceipt)=>r.durableSaved=false,(r:MutatedReceipt)=>r.notificationStatus='sent',(r:MutatedReceipt)=>r.extra=true]){const r=clone(e.receipt);mutate(r);assert.equal(validateReceipt(n,r),false);}
 assert.equal(validateReceipt(n,null),false);assert.equal(validateReceipt(n,{}),false);
});
test('receipt construction copies accepted request and treats durability as a shape only',()=>{const e=specimens.positive[0],n=normalizeRequest(e.wire),r=buildReceipt(n,{requestId:e.receipt.requestId,acceptedAt:e.receipt.acceptedAt,quoteId:e.receipt.quote.quoteId,pricingRevision:e.receipt.quote.pricingRevision});n.customerName='Changed';assert.notEqual(r.acceptedRequest.customerName,n.customerName);rejects(()=>buildReceipt(normalizeRequest(e.wire),{requestId:'bad',acceptedAt:e.receipt.acceptedAt,quoteId:e.receipt.quote.quoteId,pricingRevision:e.receipt.quote.pricingRevision}));});
test('error envelope is bounded and never leaks exception detail',()=>{assert.deepEqual(errorEnvelope(Error('secret detail')),{ok:false,schemaVersion:2,code:'unavailable',retryable:true});assert.deepEqual(errorEnvelope(new NfcV2Error(409,'idempotency_conflict')),{ok:false,schemaVersion:2,code:'idempotency_conflict',retryable:false});});

test('strict error validators cover every frozen code and retry disposition',()=>{for(const [code,status]of Object.entries(ERROR_STATUSES)){const envelope=errorEnvelope(new NfcV2Error(status,code));assert.equal(validateErrorEnvelope(envelope),true);}assert.equal(validateErrorEnvelope({...errorEnvelope(new NfcV2Error(409,'idempotency_conflict')),retryable:true}),false);assert.equal(validateErrorEnvelope({ok:false,schemaVersion:2,code:'secret-or-unknown',retryable:false}),false);assert.equal(validateErrorEnvelope({...errorEnvelope(new NfcV2Error(422,'invalid_payload')),errors:[{path:'lines[0].quantity',code:'quantity_limit'}]}),true);assert.equal(validateErrorEnvelope({...errorEnvelope(new NfcV2Error(422,'invalid_payload')),errors:[{path:'x'.repeat(201),code:'bad'}]}),false);assert.deepEqual(errorEnvelope(new NfcV2Error(418,'secret unknown detail')),{ok:false,schemaVersion:2,code:'unavailable',retryable:true});});
test('canonical CJSON uses exact control escape profile and normalized inputs reject accessors',()=>{assert.equal(canonicalJSON('\b\f\r\t\n'),String.raw`"\u0008\u000c\u000d\u0009\n"`);const n=normalizeRequest(base());Object.defineProperty(n,'lines',{get(){throw Error('getter executed');},enumerable:true});rejects(()=>requestDigest(n));});

test('enum fields reject arrays, objects, booleans and null without coercion',()=>{
 const menu=clone(specimens.positive.find((x:{id:string})=>x.id==='uk_nfc-menu-card').wire);
 const service=clone(specimens.positive.find((x:{id:string})=>x.id==='uk_quantity_advice').wire);
 for(const bad of [['quantity_advice'],{toString:'quantity_advice'},true,null]){const b=clone(service);b.kind=bad;rejects(()=>normalizeRequest(b));}
 for(const bad of [['pl'],{toString:'pl'},false,null]){const b=base();b.language=bad;b.sourcePage='/nfc-card-website/pl/cart/';rejects(()=>normalizeRequest(b));}
 for(const bad of [['email'],{toString:'email'},true,null]){const b=base();b.contact.preferredMethod=bad;rejects(()=>normalizeRequest(b));}
 for(const bad of [['existing'],{toString:'existing'},false,null]){const b=clone(menu);b.lines[0].configuration.menuStatus=bad;delete b.lines[0].configuration.menuUrl;rejects(()=>normalizeRequest(b));}
 for(const bad of [['square_100_black'],{toString:'square_100_black'},true,null]){const b=clone(menu);b.lines[0].variantId=bad;rejects(()=>normalizeRequest(b));}
});
