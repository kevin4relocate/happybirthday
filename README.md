# Midnight Gala — Birthday Loop Studio

This repository was deliberately rebuilt as a **single flagship scene**. The old six procedural 3D scenes, toy-like balloons, stage engine, asset-import experiments and the earlier gallery have been removed from the main code tree.

## What this first flagship actually is

A licensed **real cake photograph** with art-directed dark negative space, metallic editorial typography, softly moving light pools and floating bokeh. It is a **cinematic photo-motion composition**, **not** a native 3D cake model or a real moving candle-flame simulation. The camera stays fixed and there is no zoom in/out.

Photo: **Rakesh Sitnoor**, [Unsplash](https://unsplash.com/photos/brown-and-white-cake-on-white-ceramic-plate-wvQk48s--zw). [Unsplash License](https://unsplash.com/license). The local source image and its checksum live in `assets/`.

The entire app has only two inputs, **Generate**, a 16:9 live preview, and **Download seamless loop**. Generate alters restrained lighting/bokeh variations of this one designed composition. **Do not represent these as hundreds of completely different premium scenes.**

## Video contract

WebCodecs creates exactly **300 frames at 30 fps**, with 10 seconds of silent 1920×1080 WebM output on a supported machine. The first frame's encoded keyframe is cloned byte-for-byte into frame 300. Chromium CI verifies that the first/last decoded RGB frames have zero pixel difference **and** that the middle image has genuinely changed; it rejects all-black/still exports. Repeating the clip 18 times in a 30-fps video editor covers a 3-minute song. No music is embedded.

The browser requires desktop Chrome/Edge or another implementation of VP8/VP9 WebCodecs. On unsupported browsers, export fails clearly rather than silently generating dropped-frame loops.

## Architecture

- `src/scene.js` — one layered photographic hero scene; cached full-resolution stills; periodic native Canvas2D motion
- `src/core.js` — seeded lighting variations, two-line title handling, output settings
- `src/app.js` — minimal UI and preview lifecycle
- `src/export.js`, `src/loop.js`, `src/webm.js` — retained and proven seam-safe WebCodecs video pipeline
- `assets/` — locally stored, license-documented key photography
- `tests/` — Node contract tests and real Chromium + FFmpeg full-seam verification

## Cloudflare Pages

Deploy the repository root as a static site. Preset: **None**. Build command: **empty**. Output directory: **.**.

## Product honesty

The photographic image is static: only candlelight-style illumination and dust/bokeh animate. For a fully 3D cinematic ballroom, original modeled high-end 3D assets and studio lighting are still required. This reset is intended to validate a **beautiful, restrained flagship composition first**, rather than promising a complete film-quality 3D scene engine prematurely.

Previous designs remain available in Git history and merged PRs. A separate unmerged scanned-cake experiment exists on PR #5; it is **not** part of this clean reset.
