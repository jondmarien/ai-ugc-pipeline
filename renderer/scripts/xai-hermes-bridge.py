#!/usr/bin/env python3
"""
Hermes xAI OAuth bridge for image/video generation.
Uses the configured xai provider (OAuth) from Hermes.
"""

import sys
import json
from hermes_cli.config import load_config

try:
    from hermes_cli.tools.image import generate_image
    from hermes_cli.tools.video import generate_video
except ImportError:
    # Fallback if direct imports are not available
    generate_image = None
    generate_video = None


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: bridge.py image|video <prompt> [image_url]"}))
        sys.exit(1)

    mode = sys.argv[1]
    prompt = sys.argv[2] if len(sys.argv) > 2 else ""
    image_url = sys.argv[3] if len(sys.argv) > 3 else None

    cfg = load_config()
    image_cfg = cfg.get("image_gen", {})
    video_cfg = cfg.get("video_gen", {})

    if mode == "image":
        if generate_image is None:
            print(json.dumps({"error": "Hermes image generation not available"}))
            sys.exit(1)

        result = generate_image(
            prompt=prompt,
            provider=image_cfg.get("provider", "xai"),
            model=image_cfg.get("model", "grok-imagine-image"),
            use_gateway=image_cfg.get("use_gateway", False),
        )
        print(json.dumps({"url": result.get("url") or result.get("data", [{}])[0].get("url")}))

    elif mode == "video":
        if generate_video is None:
            print(json.dumps({"error": "Hermes video generation not available"}))
            sys.exit(1)

        result = generate_video(
            prompt=prompt,
            image_url=image_url,
            provider=video_cfg.get("provider", "xai"),
            model=video_cfg.get("model", "grok-imagine-video-1.5-preview"),
            use_gateway=video_cfg.get("use_gateway", False),
        )
        print(json.dumps({"url": result.get("url") or result.get("video", {}).get("url")}))

    else:
        print(json.dumps({"error": f"Unknown mode: {mode}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()