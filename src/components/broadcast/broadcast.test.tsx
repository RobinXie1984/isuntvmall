import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Broadcast } from "@/lib/broadcasts/contracts";
import { BroadcastPlayer } from "./broadcast-player";
import { BroadcastCard } from "./broadcast-card";

const broadcast: Broadcast = {
  id: "11111111-1111-4111-8111-111111111111", kind: "broadcast", revision: 0,
  title: "A recorded selection", titleZh: "精選回放", titleHans: "精选回放", titleJa: "セレクションの配信",
  url: "https://youtu.be/7CL0PxKA5iE", thumbnailUrl: "", position: 1, visible: true,
  status: "recorded", productIds: [],
};
describe("official broadcast player and fallback", () => {
  it("keeps an obvious platform link alongside a YouTube iframe without autoplay", () => {
    const html = renderToStaticMarkup(<BroadcastPlayer broadcast={broadcast} locale="en" />);
    expect(html).toContain("youtube-nocookie.com/embed/7CL0PxKA5iE?rel=0");
    expect(html).toContain('href="https://www.youtube.com/watch?v=7CL0PxKA5iE"');
    expect(html).toContain("Watch on YouTube");
    expect(html).not.toContain("autoplay=1");
  });
  it("keeps a Facebook fallback even when an official video embed is present", () => {
    const html = renderToStaticMarkup(<BroadcastPlayer broadcast={{ ...broadcast, url: "https://www.facebook.com/share/v/1HmZq19pUq/?mibextid=wwXIfr" }} locale="en" />);
    expect(html).toContain("www.facebook.com/plugins/video.php");
    expect(html).toContain("Watch on Facebook");
    expect(html).toContain('target="_blank"');
    expect(html).not.toContain("mibextid");
  });
  it.each(["https://www.facebook.com/share/p/1bFAWQmsx8/", "https://www.facebook.com/share/1F68N2tf7u/"])("does not treat unconfirmed post/share %s as a video", url => {
    const html = renderToStaticMarkup(<BroadcastPlayer broadcast={{ ...broadcast, url }} locale="en" />);
    expect(html).not.toContain("<iframe");
    expect(html).toContain("Watch on Facebook");
    expect(html).toContain("This broadcast opens on its original platform.");
  });
  it.each([
    ["zh-Hant", "前往 YouTube 觀看", "精選回放"],
    ["zh-Hans", "前往 YouTube 观看", "精选回放"],
    ["ja", "YouTubeで見る", "セレクションの配信"],
  ] as const)("localizes the %s player title and fallback", (locale, fallback, title) => {
    const html = renderToStaticMarkup(<BroadcastPlayer broadcast={broadcast} locale={locale} />);
    expect(html).toContain(fallback);
    expect(html).toContain(`title="${title}"`);
    expect(html).not.toContain("Watch on YouTube");
  });
  it("renders a neutral thumbnail and replay label without requiring a product", () => {
    const html = renderToStaticMarkup(<BroadcastCard broadcast={broadcast} locale="en" />);
    expect(html).toContain("broadcast-neutral");
    expect(html).toContain("Replay");
    expect(html).not.toContain("broadcast-status-live");
    expect(html).toContain(`/watch/${broadcast.id}`);
  });
});
