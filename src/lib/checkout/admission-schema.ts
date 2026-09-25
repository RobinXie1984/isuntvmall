import {z} from "zod";
export const admissionPolicyInput=z.object({enabled:z.boolean(),maxRecent:z.number().int().min(1).max(100),maxClientActive:z.number().int().min(1).max(20),maxStoreActive:z.number().int().min(1).max(10000)}).strict().refine(data=>data.maxClientActive<=data.maxStoreActive,{message:"Client limit cannot exceed store limit"});
export type AdmissionPolicy={enabled:boolean;max_recent_attempts:number;max_client_active:number;max_store_active:number;window_seconds:number;reservation_seconds:number;updated_at:string};
