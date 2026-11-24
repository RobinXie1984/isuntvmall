---
name: isuntvmall-product-clips
description: Source authorized iSunTVMall Facebook or YouTube broadcasts, find product demos, and prepare clean under-60-second portrait clips for MALOVE, HONAYIN, or another verified shop brand. Use for Mall clip research, editing, preview, or approved publication.
---

# iSunTVMall product clips

## Find and acquire the source

1. Confirm the source and permission to reuse it. Record the canonical video URL, video ID, brand, and any confirmed product or SKU. Match the brand to the actual demo. Put originals, samples and receipts in a task-owned private directory outside the public assets.
2. Prefer the original recording. For your own YouTube uploads, try **YouTube Studio → Content → video menu → Download**. If needed, use a videos-only [Google Takeout](https://support.google.com/accounts/answer/3024190) export under the correct Brand Account. Check available space and use the export index to locate the right archive part before downloading. For Facebook, use the Page owner's [official live replay download or export](https://about.fb.com/news/2025/02/updating-our-facebook-live-video-storage-policy/) when available.
3. For a publicly playable, authorized source where this acquisition is permitted, resolve a Facebook share URL to the actual video or reel permalink. Use an individual YouTube watch URL, not a channel or playlist. [yt-dlp](https://github.com/yt-dlp/yt-dlp) is the optional, free acquisition CLI. Reuse an existing verified binary or install the official package in a task-local environment. Record its version. Use a short source range around a known moment, with lead-in and tail for frame-accurate editing. Record the actual source offset and confirm it against the replay before cutting.

```sh
yt-dlp --ignore-config --no-plugin-dirs --no-playlist --no-overwrites \
  --socket-timeout 20 --retries 0 --fragment-retries 0 \
  -f 'bv*[height<=1280][vcodec^=avc1]/bv*[height<=1280]/b' \
  --download-sections "*${start_seconds}-${end_seconds}" --force-keyframes-at-cuts \
  --merge-output-format mp4 -o "$work/source-window.%(ext)s" -- "$source_url"
```

For YouTube, consult the official yt-dlp dependencies if the extractor reports a missing JavaScript runtime. Use a verified CA bundle if local Python's trust store fails. If the link is unavailable, login-gated or the stream cannot be decoded, request the original or an owner export and continue with other sources. Avoid copying browser credentials or using login workarounds. A public URL alone does not establish reuse rights.

**Verified example.** For the Nov 19 MALOVE replay, the Takeout index and YouTube Studio identified `PBURulmFhu4`. A bounded public section supplied the footage. The final 26-second clip used source seconds 2193–2219. For Facebook, the public HONAYIN and MALOVE permalink tests produced playable 12-second windows. Those technical samples had burned-in promotions and needed a fresh editorial cut.

## Choose, render and preview

- Scrub the source or sample frames every few seconds to find try-ons and demonstrations. Review the whole chosen interval in motion. Keep the shoes, clothes or bag intact throughout and prefer a clean, warm-toned source frame for the poster. If text is burned in, crop only where the merchandise stays intact, or choose a different moment. Keep original colour and proportions. Add no text, subtitles or creator names. Mute clips unless the original audio is useful and cleared.
- Run the local helper with absolute broadcast times in seconds. For a full recording, omit `--source-offset`. Supply a verified `W:H:X:Y` crop only when useful. The helper creates a new private directory with H.264 MP4, a real-frame JPEG poster and a SHA-256 receipt marked `preview`. It checks a complete decode, 9:16 and a final duration strictly below 60 seconds. Inspect the whole output visually for framing, overlays and colour.

```sh
python3 .agents/skills/isuntvmall-product-clips/scripts/render-clip.py \
  "$work/source-window.mp4" "$work/malove-preview" \
  --start 2193 --end 2219 --source-offset 2180 \
  --crop 468:832:232:316 --poster-at 4
```

The example offset is illustrative. Use the actual time corresponding to frame zero of the downloaded window. Show the finished MP4 previews grouped under their real brands for approval. An inaccessible or unsuitable source stays on hold with its reason and the original requested.

## Publish an approved edit

- Reuse `public/brand-clips/`, `src/lib/broadcasts/product-films.json` and the existing approved-film delivery route. Follow the manifest schema in `product-films.ts`. A clip tied to a replay must match its visible broadcast ID and canonical source URL. Follow the existing standalone convention for an independently approved cut.
- Install only the approved MP4 and its poster. Keep the private source and work files outside Git. In the storefront, use the actual brand name and the existing portrait gallery.
- After authorized release, confirm that the clip renders under the correct brand, its poster loads, and the production MP4 endpoint supports byte ranges. Play it on desktop and mobile size. Record source, cut, crop, approved asset hashes and the live verification result.

[YouTube Studio download guidance](https://support.google.com/youtube/answer/56100) · [FFmpeg filtering](https://ffmpeg.org/ffmpeg-filters.html) · [ffprobe reference](https://ffmpeg.org/ffprobe.html)
