import fs from 'node:fs/promises';
import {mediaCatalog} from '../src/content/internal/media-catalog';
import approvals from '../src/content/internal/media-approvals.json';
import {publicationApproved} from '../src/lib/media/policy';
import type {MediaApproval} from '../src/types/service-media';
/** Only individual, evidenced approvals can promote derivatives into public storage. */
await fs.mkdir('public/media/examples',{recursive:true});let count=0;
for(const a of mediaCatalog){const approval=approvals[String(a.id) as keyof typeof approvals] as MediaApproval;if(!publicationApproved(approval))continue;if(!a.derivatives.length)throw Error(`Source ${a.id} needs selected derivatives first.`);for(const d of a.derivatives){await fs.copyFile('.data/iadds-media/'+d.file,'public/media/examples/'+d.file);count++;}}
console.log(`${count} individually approved derivatives promoted. Unverified assets remain private.`);
