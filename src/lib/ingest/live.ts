import { z } from "zod";

export const liveSessionInputSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(5000).default(""),
  kolId: z.uuid(),
  hostName: z.string().trim().min(1).max(120).default("SunTV"),
  platform: z.enum(["youtube", "facebook", "tiktok", "instagram", "external"]),
  externalUrl: z.url().refine((value) => value.startsWith("https://"), "Use an HTTPS URL"),
  embedId: z.string().trim().max(200).nullable().optional(),
  status: z.enum(["scheduled", "live", "ended", "preview"]),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }).nullable().optional(),
  posterUrl: z.string().trim().max(2048).nullable().optional(),
  productIds: z.array(z.uuid()).max(30).default([]),
});

export type LiveSessionInput = z.infer<typeof liveSessionInputSchema>;
