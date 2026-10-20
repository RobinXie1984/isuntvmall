# One owned live channel

Status: implementation pilot; real broadcast acceptance and paid service activation pending. This document is not evidence of a working production stream.

## Decision and architecture

Use Cloudflare Stream for one persistent Mall-owned live input. The existing Next/vinext Worker renders the channel; the managed Stream service receives RTMPS/SRT, encodes and delivers video, and creates recordings. The existing four-language MUJI storefront and MFA-protected staff console are reused. No multi-channel platform, new database, webhook queue or recurring job is required.

Owncast is open-source and supports RTMP ingest/HLS output, but requires an always-on ffmpeg host, public ingest/network/TLS setup, resource and egress sizing, updates and recording operations. No maintained Owncast instance was verified in the inspected project infrastructure. Its default documented latency is approximately 10 seconds, a vendor estimate rather than our measurement. For this existing Cloudflare-hosted shop, managed Stream has fewer services to operate.

The homepage polls `/api/channel` every 15 seconds while the tab is visible. The endpoint reads only the configured input's videos and caches a sanitized projection for 10 seconds. Concurrent requests coalesce in-process; Cloudflare Cache API shares public snapshots across isolates in each location. Status contains no encoder key, API token, provider metadata or user data. Provider failure replaces a stale live claim with `unavailable`; the cache never intentionally serves a stale live result. Requests time out after five seconds; oversized/malformed responses fail closed.

`live-inprogress` selects the live video, `ready` plus `readyToStream` selects the latest recording, unfinished encoding displays a preparation message, and no usable record displays a quiet fallback to `/watch`. A new stream automatically replaces a prior replay. The homepage puts live video before the introduction; between broadcasts it uses a compact channel link. `/channel` provides the player/replay/fallback. `/watch` retains the existing YouTube/Facebook library. The channel is separate from editorial broadcast status and cannot be made LIVE by a catalogue editor.

The official Stream player handles playback; the SDK provides a three-attempt, 15-second error/stall recovery budget per video. Recovery stops on unmount and in hidden tabs; renewed playback cancels a pending retry. Viewer-started playback may resume muted after a reload. Initial playback never auto-starts with sound. A manual reload and separate-player link remain available. Actual behavior during encoder disconnects must be accepted on the owned live input before enabling the homepage.

## One-time setup

1. Activate Stream in the store owner's Cloudflare account. The Workers subscription alone is insufficient. Do not activate a paid tier without owner approval.
2. Create exactly one named live input, `iSunTVMall owned channel`. Set recording to automatic, `timeoutSeconds: 30`, and recording retention to 30 days. Restrict allowed origins to the production Mall domains and any explicitly approved acceptance origin. Do not use a shared third-party or unrelated brand input.
3. Privately give the encoder ingest URL/key to the authorized broadcaster. Use OBS or an existing encoder: H.264/AAC, 720p30, two-second keyframes, roughly 2.5–3 Mbps. Do not put the key in Git, the Mall admin, screenshots, analytics or a public URL. The input key grants publishing authority independently of Mall staff roles. The owner controls who receives it and disables the input or rotates the key when access is revoked.
4. Create an account-scoped Stream Read API token. Store it as `CF_STREAM_READ_TOKEN` in the existing Mall Worker, never as `NEXT_PUBLIC_*`. Keep write/admin tokens and encoder keys out of the app runtime. Configure non-secret `CF_STREAM_ACCOUNT_ID`, `CF_STREAM_INPUT_ID`, `CF_STREAM_CUSTOMER_CODE` as Worker variables.
5. Keep `MALL_LIVE_ENABLED=false` until the acceptance broadcast below passes. Set it true to enable automatic public presentation. Missing or malformed config fails closed. The readonly status console is `/admin/channel`, accessible through Broadcasts with the existing `live.publish` permission and privileged MFA enforcement. Configuration is an installation task, not routine broadcaster work.
6. One encoder at a time. Start streaming to appear; stop streaming to finish. No routine Mall admin action, code change or redeployment per broadcast. Manage retention/usage in the owner’s Stream account.

## Costs (USD; official rates checked 20 October 2026)

Cloudflare: $5/month per 1,000 minutes of stored video capacity; $1 per 1,000 viewer-minutes delivered. Ingest and encoding included. Replays and buffering also consume delivery. Example: one 60-minute programme watched for the full hour by 100 people = 6,000 viewer-minutes = $6 delivery, plus storage subscription. Four such programmes = $24 delivery + $5 storage if the retained archive remains under 1,000 minutes. This excludes taxes and existing site/Worker costs. Thirty-day automatic retention limits archive growth but does not cap viewer delivery spend. Review provider billing/usage before increasing audience or duration.

Owncast software is free; hosting, electricity, bandwidth/CDN and maintenance are not. At 3 Mbps, 100 viewers for an hour consume roughly 135 GB of video egress, before overhead. No host quote or tested audience capacity exists for this project, so a dollar hosting estimate is UNKNOWN.

## Reproducible broadcast acceptance

- Confirm the input belongs to the merchant and is idle. Record the Worker version, input settings and encoder parameters without secrets.
- Use an original test card marked “Pilot test”, a moving counter and visible UTC time. No customer/person footage or copyrighted programme is required.
- Start a real encoder for at least two minutes. Observe `/api/channel` and the existing open homepage; verify automatic promotion without reloading. Open `/channel`, start playback and compare visible source UTC to synchronized observer UTC. Record at least five samples for desktop and mobile, reporting median/range and whether mobile is a real device or only a viewport.
- Interrupt the encoder for 10 seconds, reconnect, and verify playback recovers. Then interrupt for longer than the 30-second recording grace, reconnect, and verify a new provider video is selected automatically. Record event-to-status and playable-frame recovery delays separately from glass-to-glass delay.
- Stop finally; verify processing fallback and then ready replay, with no manual editorial status change. Reload as a new visitor to prove replay does not depend on local browser memory. Confirm the same recording is selected in all four languages.
- Verify API failure/timeout does not leave a LIVE label; no secret appears in public HTML/JSON/client bundle; unauthorized visitors cannot access `/admin/channel`.
- Record actual delivered/stored minutes from Stream. A short two-viewer test should be inexpensive, but no billing amount is measured until the provider reports it.

## Release and rollback

Build/test in an isolated Studio candidate, hash-verify the portable bundle on the iMac, deploy using existing authorized Wrangler credentials with `--keep-vars`, then verify the new Worker version and public routes. A successful asset upload alone is not deployment. Keep prior Worker version/source manifest. Disable the channel with `MALL_LIVE_ENABLED=false` or roll back the Worker; no DB migration is involved. Disable the Stream input separately to stop unauthorized ingest or ongoing recording. Do not delete recordings as part of rollback.

## Sources

- https://developers.cloudflare.com/stream/pricing/
- https://developers.cloudflare.com/stream/stream-live/start-stream-live/
- https://developers.cloudflare.com/stream/stream-live/watch-live-stream/
- https://developers.cloudflare.com/stream/viewing-videos/using-the-stream-player/using-the-player-api/
- https://owncast.online/docs/getting-started/install/manual/
- https://owncast.online/docs/latency/
- https://owncast.online/docs/video-performance
