import { z } from "zod";
const base = { revision:z.number().int().positive(), requestId:z.string().uuid() };
export const orderActionSchema=z.discriminatedUnion("action",[
 z.object({...base,action:z.literal("assign"),data:z.object({userId:z.string().uuid(),support:z.boolean(),fulfillment:z.boolean()}).strict()}).strict(),
 z.object({...base,action:z.enum(["pack","deliver"]),data:z.object({}).strict()}).strict(),
 z.object({...base,action:z.literal("ship"),data:z.object({carrier:z.string().trim().min(1).max(80),trackingNumber:z.string().trim().min(1).max(160)}).strict()}).strict(),
 z.object({...base,action:z.literal("request_refund"),data:z.object({reason:z.string().trim().min(1).max(1000)}).strict()}).strict(),
 z.object({...base,action:z.literal("review_refund"),data:z.object({refundId:z.string().uuid(),decision:z.enum(["approved","rejected"]),note:z.string().trim().min(1).max(1000)}).strict()}).strict(),
]);
export type OperationalOrder={id:string;status:string;currency:string;subtotalAmount:number;totalAmount:number|null;createdAt:string;revision:number;fulfillmentStatus:string;carrier:string|null;trackingNumber:string|null;customerEmail:string|null;customerName:string|null;shippingAddress:Record<string,unknown>|null;fulfillmentOnHold:boolean;canFulfill:boolean;canRequestRefund:boolean;items:{sku:string;title:string;quantity:number;lineTotal:number}[];refundRequests:{id:string;reason:string;status:string;reviewNote:string|null}[]};
