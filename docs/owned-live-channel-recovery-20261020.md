# Embedded playback and recovery follow-up — 20 October 2026

This supplements the earlier activation report. The same deployed Worker (`3a854ad5-e9ce-425b-824b-24738a5845c9`) was tested; no application change or redeployment was needed.

## Verified results

- **Actual embedded playback:** the Mall's Stream iframe played successfully in Safari on the iMac. The earlier blank Chrome iframe was reproduced only under Browser Use document interception. Using Safari's normal UI required no changes to authentication, TLS, browser security or extensions.
- **Physical phone:** Robin used an iPhone Air on Wi-Fi and explicitly confirmed a moving live UTC clock and audible test tone. This replaces the earlier viewport-only evidence. Phone browser version was not supplied.
- **Short interruption:** encoder stopped at 12:32:32.293 UTC and restarted at 12:32:42.297. The Mall kept the same video ID. At 12:32:50 the desktop frame showed 12:32:25; by 12:33:07 it showed 12:32:49, with no click or reload. Robin replied “recovered automatically” on the iPhone.
- **Long interruption and restarted source:** the second encoder stalled and hit its bounded timeout at 12:35:02. Two status requests also timed out; the underlying network/provider cause is UNKNOWN. This was not the clean planned 45-second stop. The source was restarted at 12:36:13.651, at least 71 seconds after the forced stop. A new video ID became public live by 12:36:26.853. Safari's existing page selected and played it without a click or reload; screenshot at 12:36:36.909 shows source clock 12:36:19.
- **Phone after the longer interruption:** Robin reported a tap was needed, the clock moved, and “Live now” was absent. His follow-up confirmed playback looked fine. The reply arrived after the final broadcast ended, so the exact live-versus-replay state he observed is UNKNOWN. Do not claim verified automatic live resumption on that phone after a long break. One-tap usable playback and final replay were confirmed.
- **Final replay:** source stopped normally at 12:38:13.849. Public state changed to processing at 12:38:35.492 and ready replay at 12:38:41.270 (27.4 seconds after stop). Safari's embedded 1:58 recording advanced from 11 to 19 seconds, then was paused by the agent. Robin confirmed the recording played after a tap. The SDK's automatic retry URL (`autoplay=true&muted=true`) was observed before the replay transition.
- **Delay:** embedded Safari measurements were approximately 18.4 seconds initially, 18.2 seconds after the short recovery and 17.9 seconds after the long restart. Source clock resolution is one second; these small samples are not an SLA.

The tested channel can be used for a first broadcast with a monitored encoder and the existing one-tap playback fallback. Full-screen mode, mobile-data networks, Android and every browser version were not tested. Do not promise gapless playback or that phones always resume without a gesture. No remaining phone action is needed for the confirmed picture/sound/short-recovery/replay checks.

## Credential incident and resolution

An agent-generated browser tool result accidentally included the existing RTMPS publishing key. It was not added to Git, website code or Studio evidence. Robin was informed and explicitly approved a temporary account-scoped Stream Write token for key rotation and immediate revocation.

At 12:38:21 UTC the official `rotate_keys` API succeeded. Readback confirmed changed credentials and the same live input ID; configuration and recordings were retained. The replacement key was never printed or written to a local file. The temporary token was deleted immediately after use; a subsequent authenticated request returned HTTP401, verifying revocation. Both local temporary credential files were removed. The existing Worker Stream Read secret was unchanged and public replay remained healthy.

The broadcaster must use the **current** RTMPS key from the owner's Cloudflare input page; the earlier key is revoked. No key is included in these instructions. The rotated key was read back but was not used for another live test, avoiding an unnecessary extra public broadcast.

Official reference: https://developers.cloudflare.com/stream/stream-live/start-stream-live/#rotate-broadcast-keys

## Operating notes

1. In OBS or the existing authorized encoder, use the current private input URL/key, H.264/AAC, 720p30 and two-second keyframes. Enable the encoder's automatic reconnect option; verify picture and sound on a second device before the programme.
2. Viewers open https://www.isuntvmall.com/channel and tap Play if shown. A short interruption recovered automatically on the tested iPhone. After a longer stop or new programme, a phone may need another tap. Automatic retries can resume muted; use the speaker button if necessary.
3. If the encoder hangs, the operator must restart it. The website cannot repair a stopped upstream encoder; it selects the new stream when it becomes available and provides processing/replay/fallback meanwhile.
4. Stop streaming to generate a replay. Keep the existing manual Reload player and Open video separately controls. Disabling `MALL_LIVE_ENABLED` hides the channel but does not stop upstream ingest.
5. Rotation is an incident-recovery action, not routine broadcasting. Keep the read-only Worker credential separate from broadcaster credentials. Do not export browser text from a secret-bearing view; use an allowlist of non-secret fields.

## Evidence

iMac control evidence: `work/live-recovery-20261020` under the task workspace. Canonical Studio archive: `/Users/headlessnick/RobinOS2/12_ventures/isuntvmall/evidence/owned-channel-recovery-20261020`. Files include timed encoder/status events, Safari screenshots, Robin's explicit observation summaries, sanitized rotation/revocation receipts, and separate QA/adversarial review. No credential or raw secret-bearing browser dump is archived.
