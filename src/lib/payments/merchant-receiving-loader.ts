import "server-only";
import { parseMerchantReceivingConfiguration } from "./merchant-receiving";
// Explicit input only: no environment fallback, file discovery, or wallet-service access.
// No checkout or fund-movement path consumes this template loader.
export function loadMerchantReceivingConfiguration(serialized:string|undefined,expectedStoreId:string){
 if(serialized===undefined)return null;
 if(new TextEncoder().encode(serialized).length>16384)throw Error("RECEIVER_CONFIG_TOO_LARGE");
 return parseMerchantReceivingConfiguration(JSON.parse(serialized),expectedStoreId);
}
