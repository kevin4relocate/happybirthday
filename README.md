# Birthday Studio V4 — Cinematic Scene Library

An internal tool with only **Song title**, **Artist name**, **Generate**, **Preview** and **Download**. No advanced sliders or public-facing marketing copy.

## Three editorial birthday scenes

The application now contains three genuinely different locally hosted photographic layouts:

| Scene | Photographic source | Art direction |
|---|---|---|
| **Midnight Gala** | Original cake photo by Rakesh Sitnoor | Dark editorial cake on the right; gold-and-ivory text left; warm flicker |
| **Rose Garden** | [Pink floral birthday cake](https://www.pexels.com/photo/elegant-pink-birthday-cake-with-flowers-34263114/) by Maria | Light rose/ivory palette; cake on the **left**, text on the **right**, gentle petals |
| **Golden Ballroom** | [White cake on gold stand](https://www.pexels.com/photo/layer-cake-and-flower-decorations-on-a-table-at-a-party-15937640/) by Jonathan Borba; [luxury ballroom](https://www.pexels.com/photo/luxurious-wedding-banquet-hall-with-chandeliers-33852468/) by Raj | Golden hall photography with a blended cake portrait on the right and champagne typography |

All new images are Pexels License photos, downloaded once and served from this repository. Attribution and checksums are recorded in [assets/SCENE_CREDITS.json](assets/SCENE_CREDITS.json); original Midnight Gala credit remains in [assets/ART_CREDIT.json](assets/ART_CREDIT.json).

**Content precision:** Golden Ballroom combines two independent photographs. It is an editorial composite, not a single photograph of a staged birthday celebration. The static photographs remain still; the tool animates lighting, particles and occasionally tiny petal-like accents.

## Automatic scene selection

- A fresh browser starts at Midnight Gala. Generate automatically switches to another **master scene**.
- Up to 60 recent selections are recorded locally, and the next scene avoids the previous **two** scene IDs. With three masters, this means it cycles through all three before revisiting one.
- Each master has four restrained lighting moods, chosen automatically. This produces variations of **three** curated compositions, not hundreds of unique photos. More masters require more licensed image assets.
- No additional settings, menus, sliders or user decisions.

## Exact 10-second loop contract

The existing WebCodecs encoder is intentionally unchanged. A supported browser exports **10 seconds at 1920×1080 and 30fps** (300 video frames). Frame 300 is a byte-for-byte clone of the first compressed keyframe. The Chrome/FFmpeg smoke test verifies identical first/last decoded RGB pixels, that the video is non-black, and that motion exists at the middle frame.

Repeat the 10-second video 18 times in a 30fps editor to cover a three-minute song. Output is **silent WebM**; add your soundtrack in the video editor. The source seam guarantee does not necessarily survive an editor's frame-rate conversion or lossy transcode.

## Architecture

- `src/scene-registry.js`: immutable scene metadata, local photo paths, and non-repeating scene picker
- `src/core.js`: scene history, seeded moods, two-line title, 10-second output settings
- `src/scene.js`: three individual art-directed photographic compositions; phase-periodic motion
- `src/app.js`: minimal two-field UI, Generate history, preview/export lifecycle
- `src/export.js`, `src/loop.js`, `src/webm.js`: unchanged strict seam-safe encoder
- `assets/`: licensed local source photographs and provenance
- `tests/`: Node checks + Chrome browser screenshots for **all three** scenes + a full 300-frame decoded seam check

## Deployment

Static root. Cloudflare Pages: **None** framework, blank build command, output `.`.

## Limitations

This is a **cinematic photo-motion** template library, not a native Blender room or moving 3D cake. Each photographic master is distinct, but random mood settings do not magically produce a unique photo or 1,000 truly different cinematic worlds. Full-resolution GPU/browser export must still be tested on the target device. New master scenes should be reviewed visually and tracked for usage rights before being added.
