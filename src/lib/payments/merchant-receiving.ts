import { z } from "zod";
import { requirePermission,type Staff } from "@/lib/staff/permissions";
const policies={asset:z.literal("USDT"),merchantReceivingAddress:z.string().max(64),networkFeePolicy:z.literal("not_agreed"),finalityPolicy:z.literal("not_approved"),refundPolicy:z.literal("not_approved")};
const chainSchema=z.discriminatedUnion("chain",[
 z.object({...policies,chain:z.literal("ethereum-mainnet"),capability:z.literal("controlled_collection_pilot")}).strict(),
 z.object({...policies,chain:z.literal("tron-mainnet"),capability:z.literal("observation_only")}).strict(),
 z.object({...policies,chain:z.literal("base-mainnet"),capability:z.literal("not_verified")}).strict(),
]).superRefine((value,context)=>{
 if(!value.merchantReceivingAddress)return;
 const valid=value.chain==="tron-mainnet"?/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value.merchantReceivingAddress):/^0x[0-9a-fA-F]{40}$/.test(value.merchantReceivingAddress)&&!/^0x0{40}$/i.test(value.merchantReceivingAddress);
 if(!valid)context.addIssue({code:"custom",path:["merchantReceivingAddress"],message:"RECEIVER_ADDRESS_FORMAT_INVALID"});
});
export const merchantReceivingSchema=z.object({schemaVersion:z.literal(1),purpose:z.literal("configuration-template-only"),activation:z.literal("disabled"),storeId:z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/),revision:z.number().int().positive(),changeAuthority:z.literal("super_admin"),merchantOwnershipAttested:z.boolean(),ownershipEvidenceReference:z.string().trim().min(1).max(200).nullable(),invoiceBinding:z.literal("not_implemented"),chains:z.array(chainSchema).length(3)}).strict().superRefine((value,context)=>{
 if(new Set(value.chains.map(chain=>chain.chain)).size!==3)context.addIssue({code:"custom",path:["chains"],message:"CHAIN_SET_INVALID"});
 if(value.merchantOwnershipAttested&&!value.ownershipEvidenceReference)context.addIssue({code:"custom",path:["ownershipEvidenceReference"],message:"OWNERSHIP_EVIDENCE_REQUIRED"});
});
export type MerchantReceivingConfiguration=z.infer<typeof merchantReceivingSchema>;
export function parseMerchantReceivingConfiguration(value:unknown,expectedStoreId:string){const config=merchantReceivingSchema.parse(value);if(config.storeId!==expectedStoreId)throw Error("RECEIVER_STORE_MISMATCH");return config;}
// An offline preparation helper, not a live payment API or a write into the wallet rail.
export function prepareMerchantReceivingChange(staff:Staff,previous:unknown,next:unknown,expectedStoreId:string,reason:string){
 requirePermission(staff,"team.manage");
 const oldConfig=parseMerchantReceivingConfiguration(previous,expectedStoreId);const newConfig=parseMerchantReceivingConfiguration(next,expectedStoreId);
 if(newConfig.revision!==oldConfig.revision+1)throw Error("RECEIVER_REVISION_CONFLICT");
 if(!reason.trim()||reason.length>1000)throw Error("RECEIVER_CHANGE_REASON_REQUIRED");
 return{config:newConfig,audit:{actorId:staff.id,storeId:expectedStoreId,fromRevision:oldConfig.revision,toRevision:newConfig.revision,reason:reason.trim(),activation:"disabled" as const,changedChains:newConfig.chains.filter(chain=>oldConfig.chains.find(old=>old.chain===chain.chain)?.merchantReceivingAddress!==chain.merchantReceivingAddress).map(chain=>chain.chain)}};
}
