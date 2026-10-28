/** Actual gateway composition. No migrations, sender, environment changes or new listener. */
import type { Pool } from 'pg';
import { createNfcV2Handler } from './handler.ts';
import { readV2Config,type V2RuntimeConfig } from './config.ts';
export const V2_MIGRATION_SHA256='03665a013882e511c2456583f0cebb19dcd94c4246fd24430bcf4dbf864cadb6';
export async function v2SchemaReady(pool:Pool):Promise<boolean> {
 try {
  const result=await pool.query(`SELECT checksum FROM nfc_card.schema_migrations WHERE version=$1`,['012_v35_enquiries']);
  if(result.rows.length!==1||result.rows[0].checksum!==V2_MIGRATION_SHA256)return false;
  const tables=await pool.query(`SELECT to_regclass('nfc_card.v2_requests') IS NOT NULL
   AND to_regclass('nfc_card.v2_identity_keys') IS NOT NULL AND to_regclass('nfc_card.v2_publications') IS NOT NULL
   AND to_regclass('nfc_card.v2_publication_counter') IS NOT NULL AND to_regclass('nfc_card.v2_notification_outbox') IS NOT NULL AS ready`);
  return tables.rows[0]?.ready===true;
 }catch{return false;}
}
export function composeNfcHandlers(pool:Pool|undefined,legacy:((request:Request)=>Promise<Response|undefined>)|undefined,config:V2RuntimeConfig=readV2Config()) {
 if(config.mode!=='disabled'&&!pool)throw new Error('nfc_v2_database_required');
 const v2=createNfcV2Handler(pool as Pool,config,{ready:async()=>!!pool&&await v2SchemaReady(pool)});
 return async(request:Request):Promise<Response|undefined> => (await v2(request))??await legacy?.(request);
}
