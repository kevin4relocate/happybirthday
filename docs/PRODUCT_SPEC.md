# Birthday Studio V2 — manager's release checklist

## User contract

Only two inputs (song title and artist), **Generate**, autoplay 3D preview, **Download loop**, and an export Cancel affordance. No scene/font/effect settings exposed. The target audience is creators assembling up to 1,000 videos with an external music editor.

## Implemented (static-source implementation)

- [x] Dedicated new repository independent of AnimeLoopMaker.
- [x] Consistent one-click 16:9 interface with preview at the top on mobile.
- [x] Six distinct procedural 3D theme families, seeded visual variations and scene-matched colors.
- [x] Candle flames, balloons and decorative particles with periodic deterministic movement.
- [x] Two-line headline splitting, text as an object in the world and pedestal artist badge.
- [x] Browser-local history keeping 3,000 structural fingerprints; seed alone does not count as difference.
- [x] Frame-by-frame, timestamped WebCodecs export with a byte-identical first/last compressed keyframe; progress, cancellation and cleanup. No unreliable realtime fallback.
- [x] Pure Node.js tests and CI workflow.

## Release blockers for a truly cinematic / large-scale product

- [ ] Hand-authored premium Blender/GLB scene library and asset licensing checks.
- [ ] Browser screenshots and visual QA across Chrome, Edge and Safari on representative GPUs.
- [ ] Actual 1080p recording validation on real user hardware; CI covers 10-second, 30-fps reduced-resolution file decoding and first/last pixel equality.
- [ ] Content visual similarity checks: fingerprint uniqueness alone cannot ensure 1,000 visually different videos.
- [ ] Visual legibility tests for extremely long/multilingual song titles.
- [ ] Optional background batch export with an offline/worker or server-side video encoder to handle hundreds of videos reliably.
- [ ] Optional hosted assets and vendored Three.js dependencies to remove public-CDN runtime reliance.
- [ ] GPU memory profiling and performance monitoring for weak mobile devices.

## Acceptance criteria for the next milestone

1. Ten curated 3D hero scenes with good screenshots judged at full 1920×1080.
2. Three consecutive scene generations should look different without requiring settings changes.
3. Test 100 actual browser exports across a selection of devices; no zero-byte outputs or hanging recorders.
4. Verify the last frame / first frame visual transition and encoded timing, not just mathematical animation phase.
5. Review 1,000 generated thumbnails for composition and content diversity before claiming scale readiness.
