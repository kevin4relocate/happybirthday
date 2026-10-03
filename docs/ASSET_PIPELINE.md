# Cinematic 3D Asset Pipeline

The current V2 generates all objects procedurally using Three.js. **There are no handcrafted Blender GLB models in this revision.** The next graphics milestone is a curated collection of consistent, licensed assets.

## Recommended Blender pipeline

1. Model an art-directed hero cake for every scene family, including tiers, piped frosting, edible decorations, plates, candle fixtures, bows and intentional negative space above the cake.
2. Use a consistent scale: one Three.js world unit = roughly one meter. Place the cake around the origin, with a stable pedestal height.
3. Bake and export PBR base-color, normal, roughness and metallic textures; pack material channels where useful.
4. Author loop-safe flame, ribbon, glitter and balloon animations. The first and last transforms must agree; avoid translating particles linearly through a visible seam.
5. Export each scene as a compressed glTF/GLB with appropriate mesh naming and LODs; run visual comparison at 1920×1080 before publishing.
6. Add a manifest of curated GLB variants keyed by `scene`; wire scene loading to use GLB when available and the procedural builder as fallback.
7. Verify topology, texture sizes, licensed provenance and performance on midrange GPUs. The budget target is fewer than ~150k visible triangles per scene and GPU memory under ~512MB before video recording.

## Naming suggestions

`assets/models/atelier-cake-a.glb`, `assets/models/pastel-cake-a.glb`, etc.

Do not upload unlicensed commercial 3D models, and do not label the procedural prototype a finished premium model pack.
