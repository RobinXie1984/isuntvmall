import { z } from "zod";
export const stockAdjustmentSchema = z.object({productId:z.string().uuid(),revision:z.number().int().positive(),requestId:z.string().uuid(),stockQty:z.number().int().min(0).max(100000000),reason:z.string().trim().min(1).max(1000)}).strict();
export type StockItem={id:string;sku:string;title:string;stockQty:number;revision:number;status:string;reservedQty:number;availableQty:number;isDemo:boolean};
export type StockPage={items:StockItem[];count:number;page:number};
