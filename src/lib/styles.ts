import muji from "../../style/muji/tokens.json";
import apple from "../../style/apple/tokens.json";
import amazon from "../../style/amazon/tokens.json";
import openai from "../../style/openai/tokens.json";
import daksBurberry from "../../style/daks-burberry/tokens.json";
import hermesValentino from "../../style/hermes-valentino/tokens.json";

export const DEFAULT_STYLE = "muji";
export type StyleId = "muji" | "apple" | "amazon" | "openai" | "daks-burberry" | "hermes-valentino";
export interface StylePreset {
  id: StyleId;
  name: string;
  description: { en: string; zh: string };
  colors: { background: string; surface: string; text: string; muted: string; accent: string; border: string };
  radius: number;
  typography: { heading: string; body: string };
  image: { background: string; padding: number; size: number; format: "webp"; quality: number };
}

export const stylePresets = [muji, apple, amazon, openai, daksBurberry, hermesValentino] as StylePreset[];

/** Unknown presets are rejected; callers must explicitly select the default. */
export function getStylePreset(id: string): StylePreset | undefined {
  return stylePresets.find(preset => preset.id === id);
}
