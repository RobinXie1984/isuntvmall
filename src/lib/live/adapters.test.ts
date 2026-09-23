import { describe, expect, it } from "vitest";
import { buildLiveEmbed, extractYouTubeId } from "@/lib/live/adapters";

describe("livestream adapters", () => {
  it.each([
    ["abc_DEF-12", "abc_DEF-12"],
    ["https://youtu.be/abc_DEF-12", "abc_DEF-12"],
    ["https://www.youtube.com/watch?v=abc_DEF-12", "abc_DEF-12"],
    ["https://www.youtube.com/live/abc_DEF-12", "abc_DEF-12"],
  ])("extracts a YouTube ID from %s", (input, expected) => {
    expect(extractYouTubeId(input)).toBe(expected);
  });

  it("uses YouTube's privacy-enhanced host", () => {
    const result = buildLiveEmbed("youtube", "https://youtube.com/watch?v=abc_DEF-12", null);
    expect(result).toMatchObject({ kind: "iframe", src: "https://www.youtube-nocookie.com/embed/abc_DEF-12?rel=0" });
  });

  it("embeds a numeric TikTok replay ID", () => {
    const result = buildLiveEmbed("tiktok", "https://www.tiktok.com/@sun/video/6718335390845095173", "6718335390845095173");
    expect(result.kind).toBe("iframe");
  });

  it("links out when a platform cannot be safely embedded", () => {
    const result = buildLiveEmbed("external", "https://stream.example.com/live", null);
    expect(result).toEqual({ kind: "link", href: "https://stream.example.com/live", reason: "此平台不允许安全嵌入，请前往原平台观看" });
  });

  it("rejects misleading Instagram hosts",()=>{expect(buildLiveEmbed("instagram","https://example.com/",null)).toMatchObject({kind:"link",href:"#"});});
  it("keeps Instagram as an explicit outbound adapter",()=>{expect(buildLiveEmbed("instagram","https://www.instagram.com/example/live/",null).kind).toBe("link");});

  it("does not accept a lookalike YouTube hostname",()=>{expect(extractYouTubeId("https://evilyoutube.com/watch?v=abc_DEF-12")).toBe(null);});

  it("does not emit an unsafe iframe or URL", () => {
    expect(buildLiveEmbed("external", "javascript:alert(1)", null)).toEqual({ kind: "link", href: "#", reason: "直播链接无效" });
  });
});
