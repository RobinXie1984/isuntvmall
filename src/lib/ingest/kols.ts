import { z } from "zod";
export const kolInputSchema = z.object({
 slug:z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
 displayName:z.string().trim().min(1).max(120),
 bio:z.string().trim().max(1500).default(""),
 status:z.enum(["active","inactive"]),
}).strict();
