# Birthday Studio V2.1 — Cinematic Pass

Standalone browser-based 3D birthday loop generator. This new repository does **not** reuse the Canvas 2D engine from AnimeLoopMaker.

## What you can do now
1. Open the static website and enter a song title and artist.
2. Select **Generate new scene**. The scene, candles, materials, balloons, lighting and typography are chosen automatically.
3. Preview a moving 3D scene and click **Download loop** to record a 10-second silent, 1920×1080 video in WebM with verified matching first and last encoded keyframes.
4. Generate again for another layout. A browser-local record of the last 3,000 structural fingerprints helps reduce repetition.

The phrase **Happy Birthday** is prioritized on the first line, with the remainder of the title on a smaller second line. The 3D text is mounted inside the scene and the artist is displayed on the cake stand.

## Cinematic V2.1 lighting and depth

The studio now uses six curated, scene-matched low-key lighting schemes and deterministic fixed-camera compositions (front hero, slight three-quarter angles, grand). A layered procedural set introduces material velvet curtains, distant and foreground bokeh, subtle light shafts, soft pools of light and coordinated stage reflections. The birthday cake receives frosting sheen and fine metallic trim; lettering has distinct face and bevel materials and the artist name sits on a shaped inset plaque.

All animated atmospheric elements use seeded, periodic motion; **no camera animation** is introduced. The 10-second, 300-frame video still uses the identical-keyframe seam contract, validated in CI by decoding first and last RGB images with FFmpeg.

These features improve the procedural rendering foundation but **do not replace hand-authored Blender models or studio HDRI lighting**. The six scene presets remain recognizable variations of a shared procedural set, not six unrelated film-quality environments.

## Six procedural 3D scene families

- Golden Atelier: cream-and-gold boutique birthday
- Strawberry Daydream: pastel and sweet decoration
- Moonlight Wishes: starry midnight celebration
- Little Music Box: nostalgic miniature stage
- Secret Birthday Garden: botanical pastel
- Midnight Party Lights: colored club illumination

Scenes use Three.js meshes and physically based materials with cast shadows, distinct lighting, ornament geometry, cake piping, candles and periodic animation. The camera remains fixed.

**Important quality distinction:** this is an end-to-end **procedural 3D foundation**, not yet a professionally authored Blender/GLB asset library. To reach cinematic studio-grade quality, curated geometry, textures, materials and optimized animations must still be authored and integrated. See [3D asset guide](docs/ASSET_PIPELINE.md).

## Deployment

This is a no-build static website (index.html, CSS, ES modules). Deploy the repository root directly on Cloudflare Pages, GitHub Pages, or any static host.

- Cloudflare Pages framework preset: **None**
- Build command: **(leave empty)**
- Output directory: **.** or **/** as your host allows
- Production branch: **main**

Three.js and the sample Latin 3D font load from version-pinned jsDelivr URLs. An internet connection and WebGL2-compatible browser are required. A scene-mounted text texture is used when the remote font cannot load or when the title uses glyphs outside the Latin sample font. Browser-local generations do not upload song information.

## Local development

Use a local HTTP server (ES modules don't run reliably from `file://`):

```sh
npx http-server -p 8080 -c-1 .
```

Visit http://localhost:8080.

Run all offline tests with Node.js 22 or later:

```sh
npm run validate
```

## Recording limitations

**Loop contract:** A 10-second, 30-fps file contains exactly 300 frame slots. Slots 0–298 are encoded with WebCodecs and explicit timestamps. Slot 299 holds a **byte-identical copy of the first compressed keyframe**, not a second lossy re-encode, guaranteeing identical first/last decoded pixels with a conforming VP8/VP9 decoder. A repeated loop intentionally holds that exact boundary image for one frame interval (33 ms). Repeat the ten-second clip 18 times on a 30-fps editing timeline to cover three minutes.

The downloaded file is a **silent WebM**; add the original song using your video editor. There is no realtime MediaRecorder fallback because dropped frames can break the requested exact loop guarantee. Use a current desktop Chrome/Edge with WebCodecs encoding; slower devices may take much longer than 10 seconds to render. Re-encoding or frame-rate conversion in an editor may introduce artifacts. Preserve 30 fps and avoid transitions/speed changes if you need the source seam unchanged.

## Architecture

- `src/core.js` — scene presets, deterministic randomizer, two-line titles, anti-repeat, file names
- `src/objects.js` — shared 3D cake, candles, decorations, balloons, gifts, world geometry
- `src/type.js` — physical extruded 3D title and stand-mounted artist label
- `src/scene.js` — lifecycle, lighting, camera, renderer, GPU disposal
- `src/export.js` — browser recording, cancellation, progress, download
- `src/webm.js` — timestamp-preserving WebM muxer for WebCodecs video chunks
- `src/loop.js` — exact-frame-count timing and first/last keyframe cloning contract
- `src/app.js` — one-click user interface
- `tests/` — deterministic generation and contract tests
- `docs/` — asset pipeline and product acceptance criteria

See [Product specification](docs/PRODUCT_SPEC.md) for what is implemented and what remains to reach a fully professional production pipeline.
