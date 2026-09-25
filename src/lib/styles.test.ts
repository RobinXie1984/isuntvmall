import { describe, expect, it } from "vitest";
import { DEFAULT_STYLE, getStylePreset, stylePresets } from "./styles";
it("keeps muji active and rejects an unknown style", () => { expect(DEFAULT_STYLE).toBe("muji"); expect(getStylePreset("unknown")).toBeUndefined(); });
describe("six independent style recipes", () => {
  it("supplies all six unique bounded image profiles and complete locale descriptions", () => {
    expect(stylePresets).toHaveLength(6); expect(new Set(stylePresets.map(s => s.id)).size).toBe(6);
    for (const style of stylePresets) {
      expect(style.image.background).toMatch(/^#[a-f0-9]{6}$/i); expect(style.image.size).toBe(1600); expect(style.image.padding).toBeGreaterThanOrEqual(0); expect(style.image.padding).toBeLessThanOrEqual(.3);
      expect(style.description.en).not.toMatch(/[\u3400-\u9fff]/); expect(style.description.zh).toMatch(/[\u3400-\u9fff]/);
    }
  });
});
