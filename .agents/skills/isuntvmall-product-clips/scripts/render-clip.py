#!/usr/bin/env python3
"""Render a bounded, private iSunTVMall portrait clip from a local recording."""

import argparse
from fractions import Fraction
import hashlib
import json
import math
from pathlib import Path
import subprocess


SIZE_LIMIT = 25 * 1024 * 1024


def run(program, *args):
    return subprocess.run(
        [program, *map(str, args)], check=True, stdout=subprocess.PIPE, text=True, timeout=180
    ).stdout


def ffmpeg(*args):
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", *args)


def probe(path):
    return json.loads(run("ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path))


def digest(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, help="New private directory")
    parser.add_argument("--start", type=float, required=True, help="Cut start in broadcast seconds")
    parser.add_argument("--end", type=float, required=True, help="Cut end in broadcast seconds")
    parser.add_argument("--source-offset", type=float, default=0, help="Broadcast time at source frame zero")
    parser.add_argument("--crop", metavar="W:H:X:Y")
    parser.add_argument("--poster-at", type=float, default=None, help="Seconds from the cut start")
    parser.add_argument("--keep-audio", action="store_true")
    args = parser.parse_args()
    duration = args.end - args.start
    local_start = args.start - args.source_offset
    if not all(math.isfinite(value) for value in (duration, local_start, args.source_offset)):
        parser.error("Times must be finite")
    if not 0 < duration < 60 or args.source_offset < 0 or local_start < 0:
        parser.error("Cut must be inside the source and strictly under 60 seconds")
    poster_at = min(4, duration / 3) if args.poster_at is None else args.poster_at
    if not 0 <= poster_at < duration:
        parser.error("Poster time must be inside the cut")
    if not args.source.is_file():
        parser.error("Source must be a local file")
    if args.source.resolve() == args.output.resolve() or args.output.exists():
        parser.error("Output must be a new directory")

    source_info = probe(args.source)
    source_video = next((stream for stream in source_info["streams"] if stream["codec_type"] == "video"), None)
    if source_video is None:
        parser.error("Source must contain a video stream")
    if local_start + duration > float(source_info["format"]["duration"]) + 0.04:
        parser.error("Cut end is outside the local recording")
    filters = ["scale=trunc(iw*sar/2)*2:ih", "setsar=1"]
    if args.crop is not None:
        try:
            w, h, x, y = (int(part) for part in args.crop.split(":"))
        except ValueError:
            parser.error("Crop must use W:H:X:Y")
        if min(w, h) <= 0 or min(x, y) < 0 or any(n % 2 for n in (w, h, x, y)):
            parser.error("Use even crop dimensions and nonnegative even offsets")
        if any(side.get("rotation", 0) for side in source_video.get("side_data_list", [])):
            parser.error("Normalize source rotation before specifying a crop")
        sar = source_video.get("sample_aspect_ratio", "N/A")
        pixel_ratio = Fraction(sar.replace(":", "/")) if sar not in {"N/A", "0:1"} else 1
        display_width = 2 * int(source_video["width"] * pixel_ratio / 2)
        if x + w > display_width or y + h > source_video["height"]:
            parser.error("Crop lies outside the square-pixel source frame")
        filters.append(f"crop={w}:{h}:{x}:{y}")
    filters.extend([
        "scale=432:768:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos",
        "pad=432:768:(ow-iw)/2:(oh-ih)/2:0xf2f0ea", "setsar=1",
    ])

    args.output.mkdir(mode=0o700)
    clip, poster = (args.output / filename for filename in ("clip.mp4", "poster.jpg"))
    audio = ["-map", "0:a:0?", "-c:a", "aac"] if args.keep_audio else ["-an"]
    ffmpeg("-ss", local_start, "-i", args.source, "-t", duration, "-map", "0:v:0",
           *audio, "-sn", "-dn", "-map_metadata", "-1", "-map_chapters", "-1",
           "-vf", ",".join(filters), "-c:v", "libx264", "-threads", 4, "-preset", "medium",
           "-crf", 21, "-pix_fmt", "yuv420p", "-movflags", "+faststart", clip)

    info = probe(clip)
    streams = info["streams"]
    video = streams[0]
    measured = float(info["format"]["duration"])
    if not (0 < measured < 60 and abs(measured - duration) < 0.15
            and video["codec_name"] == "h264" and video["display_aspect_ratio"] == "9:16"
            and video["sample_aspect_ratio"] == "1:1" and clip.stat().st_size <= SIZE_LIMIT
            and all(stream["codec_name"] == "aac" and args.keep_audio for stream in streams[1:])):
        raise SystemExit("Output failed clip checks. Review the files before retrying.")
    ffmpeg("-xerror", "-i", clip, "-f", "null", "-")
    ffmpeg("-ss", poster_at, "-i", clip, "-frames:v", 1, "-q:v", 2, poster)
    if not poster.is_file() or not poster.stat().st_size:
        raise SystemExit("No poster frame. Retry with an earlier poster time.")
    receipt = {
        "reviewState": "preview", "sourceStart": args.start, "sourceEnd": args.end,
        "sourceOffset": args.source_offset, "crop": args.crop, "posterAt": poster_at,
        "seconds": measured, "width": video["width"], "height": video["height"],
        "audio": len(streams) > 1, "bytes": clip.stat().st_size,
        "sourceSha256": digest(args.source), "sha256": digest(clip), "posterSha256": digest(poster),
    }
    (args.output / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(args.output / "receipt.json")


if __name__ == "__main__":
    main()
