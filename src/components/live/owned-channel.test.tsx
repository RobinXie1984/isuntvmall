import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ChannelView } from "./owned-channel";
import { emptyChannel, selectChannel } from "@/lib/owned-channel/contracts";
import { ownedChannelCopy } from "@/lib/owned-channel/copy";

const video = { uid: "a".repeat(32), created: "2026-10-19T00:00:00Z", readyToStream: true };
const live = selectChannel({ success: true, result: [{ ...video, status: { state: "live-inprogress" } }] }, "example");
describe("owned channel presentation", () => {
  it("promotes an active stream prominently without autoplay", () => {
    const html = renderToStaticMarkup(<ChannelView value={live} locale="en" home />);
    expect(html).toContain("owned-channel-featured");
    expect(html).toContain("Live now");
    expect(html).toContain("<iframe");
    expect(html).toContain("autoplay=false");
    expect(html).toContain("Reload player");
    expect(html).toContain('href="/channel"');
  });
  it("keeps disabled setup out of the homepage", () => {
    expect(renderToStaticMarkup(<ChannelView value={emptyChannel("disabled")} locale="en" home />)).toBe("");
  });
  it("keeps replay compact on home and playable on the channel page", () => {
    const replay = { ...live, state: "replay" as const };
    const home = renderToStaticMarkup(<ChannelView value={replay} locale="en" home />);
    expect(home).toContain("Latest replay"); expect(home).not.toContain("<iframe");
    expect(renderToStaticMarkup(<ChannelView value={replay} locale="en" />)).toContain("<iframe");
  });
  it.each(["offline", "processing", "unavailable", "disabled"] as const)("shows a useful %s fallback without a broken player", state => {
    const html = renderToStaticMarkup(<ChannelView value={emptyChannel(state)} locale="en" />);
    expect(html).toContain(ownedChannelCopy("en")[state]);
    expect(html).toContain('href="/watch"'); expect(html).not.toContain("<iframe");
  });
  it.each(["zh-Hant", "zh-Hans", "ja"] as const)("keeps %s labels separate from English", locale => {
    const html = renderToStaticMarkup(<ChannelView value={live} locale={locale} />);
    expect(html).toContain(ownedChannelCopy(locale).title);
    expect(html).not.toContain("Live now"); expect(html).not.toContain("Reload player");
  });
});
