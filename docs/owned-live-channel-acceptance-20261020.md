# Owned live channel: activation and bounded real-broadcast evidence

20 October 2026. Operational pilot deployed; complete production acceptance remains **UNKNOWN** at the embedded playback/physical-device boundary.

## Delivered

Cloudflare Stream is activated in Tidenet Ltd. following Robin's bounded spend approval and personal legal acceptance. One input, `iSunTVMall owned channel`, supplies the existing Worker. Automatic recording and 30-day deletion are enabled, low-latency beta is off. A Stream Read token is stored only as an encrypted Worker secret. The encoder publishing key is not in source, browser code, Mall admin, or Studio archives.

- Homepage: https://www.isuntvmall.com/
- Channel and latest replay: https://www.isuntvmall.com/channel
- Existing broadcast library: https://www.isuntvmall.com/watch
- Staff status console: https://www.isuntvmall.com/admin/channel
- Public sanitized status: https://www.isuntvmall.com/api/channel
- Worker release: `3a854ad5-e9ce-425b-824b-24738a5845c9`.
- Build archive SHA-256: `a4f639d36b795ca8d9935117cc3eb42757e642da1c024dc03a558aa2049d4e9b`.

Cloudflare Stream was selected over Owncast because it reuses the existing platform without a new always-on server, ingest firewall, ffmpeg service, CDN, or recording-maintenance process. No Owncast server was deployed. See `owned-live-channel.md` for the comparison, costs and operating instructions.

## Real broadcast

An original neutral test card with visible UTC clock was streamed using FFmpeg 9.0.2, H.264 720p30 / AAC, two-second keyframes and about 2.5 Mbps, through the actual RTMPS input. No customer footage was used.

| Event (UTC) | Observation |
| --- | --- |
| 09:54:19.964 start | Public API live by 09:54:22.504, approximately 2.5 seconds |
| 09:57:20.137 stop; 09:57:30.144 restart | 10-second gap retained the same video ID and live status |
| 09:59:30.312 stop | Processing by 09:59:55.291; replay by 10:00:02.538 |
| 10:00:15.318 restart | New video live by 10:00:20.115; existing homepage selected it without reload |
| 10:02:15.547 final stop | Processing by 10:02:37.052; replay by 10:02:54.377, approximately 38.8 seconds |

These are polling observations, not exact provider transition times. The homepage was observed with the new video ID and later with a compact replay state without reload. The official player played the live video on desktop and at a 390×844 mobile viewport. A fresh replay load showed a 1:58 recording; clicking Play advanced the recorded UTC clock and video playback position.

### Measured viewing delay

| Surface | Observer UTC | Visible source UTC | Delay |
| --- | --- | --- | --- |
| Desktop, initial | 09:57:18.604 | 09:56:49 | 29.6 s |
| Desktop, settled | 09:57:28.126 | 09:57:09 | 19.1 s |
| Mobile viewport | 10:01:28.628 | 10:01:10 | 18.6 s |
| Mobile viewport | 10:01:41.529 | 10:01:23 | 18.5 s |
| Mobile viewport | 10:02:09.039 | 10:01:50 | 19.0 s |

Four settled samples: median 18.8 seconds, range 18.5–19.1. Initial observed buffering raised delay to 29.6 seconds. Source clock has one-second resolution; observer and encoder ran on the same iMac. This small pilot sample is not an SLA. Mobile means responsive Chrome viewport, not a physical phone or mobile network.

## Limits and unresolved evidence

- Browser Use paused embedded documents. Both the existing YouTube iframe and the new Stream iframe appeared as `about:blank`, while the same Stream player worked as a top-level page. A documented read-only frame-tree request was denied with “Raw CDP is unavailable while Browser Use is resolving a paused document response.” No protection was bypassed. **In-Mall embedded playback and SDK recovery remain UNKNOWN.** A normal browser session outside that tool pause is needed for the last acceptance check.
- The official standalone player stalled during the short disconnect. At 09:58:03 it still showed 09:57:13 with a spinner. Later playback progressed, but continuous live recovery timing was not captured; do not claim seamless short-gap recovery. The Mall's bounded SDK retry path is unit-tested, but real iframe recovery cannot be inferred from those tests.
- No physical-phone test was performed. Real iOS/Android playback remains UNKNOWN.
- Dashboard setup did not expose allowed origins or timeoutSeconds. No explicit timeout was set; origins are unrestricted for this public pilot. Do not claim a 30-second configured grace.
- Provider usage is delayed: the dashboard showed 8 video records and 0 stored minutes despite playable recordings, plus small delivery graph counts. Final delivered minutes and billed pilot cost remain UNKNOWN. Agent playback and encoders were stopped; expected test delivery is only cents, not a measured invoice. The US$1 approval is a working budget, not a provider-enforced billing cap.
- Merchant transactions and the earlier MFA-dependent admin editing acceptance are outside this live-channel release; this pilot does not certify them.

## Repairs and verification

Real integration exposed two runtime issues and both were fixed: Workers rejects Fetch's `redirect: error`, so provider requests now use `manual` and fail on non-2xx without forwarding authorization; browser polling timers now bind to window to avoid an illegal-invocation error. No provider response bodies or tokens are logged. Redirect rejection has regression coverage.

447 tests passed, lint passed, typecheck passed and the production vinext build passed. Public status contains only state/check time/video ID/player URL. The release preserves all 122 catalogue products and existing four-language MUJI design. This is a scoped channel change with no database migration, payment change or staff-permission expansion.

## Routine broadcasting and rollback

1. An authorized broadcaster obtains the one input's RTMPS URL/key privately from the owner's Cloudflare Stream page. No new Mall staff account is needed for the encoder; possession of this key grants broadcast authority. Do not share it in chat or repository files.
2. In OBS choose custom streaming, H.264/AAC, 720p30, two-second keyframes and 2.5–3 Mbps. Only one encoder uses the input at a time.
3. Start streaming. The Mall detects it automatically; stop to generate the replay. Existing library broadcasts remain available during unavailable/processing states. Use the manual reload/separate-player fallback if playback stalls.
4. Review Stream usage before increasing audience. Storage is US$5/month for 1,000 stored minutes; delivery is US$1/1,000 viewer-minutes. A 60-minute show watched by 100 people costs about US$6 delivery, plus storage. Retention is not a delivery spend cap.
5. Set `MALL_LIVE_ENABLED=false` to withdraw the channel, or roll back Worker `12d6373b-2889-40af-9bb9-03e8cea6fc32` for the pre-pilot release. Preserve other Worker variables (`--keep-vars` when deploying). Stopping display does not stop ingest: stop the encoder or disable the input separately. Do not delete recordings as part of rollback.

Canonical evidence is under Studio `12_ventures/isuntvmall/evidence/owned-channel-acceptance-20261020`; the iMac control copy is `work/live-channel-20261020/activation`. Evidence includes timed state logs, original screenshots, final sanitized checks and manifests. Failed encoder attempts remain recorded as failures, not working paths. Temporary ingest credential files are excluded from archives and removed after the test.
