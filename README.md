# Birthday Studio V2

Standalone browser-based 3D birthday loop generator. This new repository does **not** reuse the Canvas 2D engine from AnimeLoopMaker.

## What you can do now
1. Open the static website and enter a song title and artist.
2. Select **Generate new scene**. The scene, candles, materials, balloons, lighting and typography are chosen automatically.
3. Preview a moving 3D scene and click **Download loop** to record a 10-second silent, 1920×1080 video in WebM (or MP4 when supported by the browser).
4. Generate again for another layout. A browser-local record of the last 3,000 structural fingerprints helps reduce repetition.

The phrase **Happy Birthday** is prioritized on the first line, with the remainder of the title on a smaller second line. The 3D text is mounted inside the scene and the artist is displayed on the cake stand.

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

Video encoding uses `HTMLCanvasElement.captureStream` + `MediaRecorder` on the user's device. Output is silent (add the song in your video editor). For maximum recording stability keep the tab visible and do not put the computer to sleep. Recording is real-time and browser-paced: frame rate and exact encoded duration depend on the device. The animation positions match at loop phase 0 and 1, but the browser encoder itself does not guarantee a mathematically perfect frame seam.

## Architecture

- `src/core.js` — scene presets, deterministic randomizer, two-line titles, anti-repeat, file names
- `src/objects.js` — shared 3D cake, candles, decorations, balloons, gifts, world geometry
- `src/type.js` — physical extruded 3D title and stand-mounted artist label
- `src/scene.js` — lifecycle, lighting, camera, renderer, GPU disposal
- `src/export.js` — browser recording, cancellation, progress, download
- `src/app.js` — one-click user interface
- `tests/` — deterministic generation and contract tests
- `docs/` — asset pipeline and product acceptance criteria

See [Product specification](docs/PRODUCT_SPEC.md) for what is implemented and what remains to reach a fully professional production pipeline.
