# Source models

Inputs for `pnpm models` (`scripts/build-models.mjs`), which bakes them into
`public/models/vehicles.glb`, `buildings.glb` and `boats.glb`. Only the built
files ship; these stay in the repo so the build is reproducible.

| Folder              | Models used                                           | Source                                                                 | License |
| ------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| `kenney-car-kit/`   | sedan, taxi, hatchback-sports, suv, van, truck        | Kenney — Car Kit 3.1 (opengameart.org/content/car-kit, www.kenney.nl)  | CC0 1.0 (`License.txt`) |
| `kenney-city-kit-commercial/` | building-a…n, building-skyscraper-a…e      | Kenney — City Kit (Commercial) 2.1 (opengameart.org/content/city-kit-commercial) | CC0 1.0 (`License.txt`) |
| `kenney-watercraft-kit/` | boat-house-a/c, boat-fishing-small, boat-tug-a, boat-sail-a, boat-speed-d | Kenney — Watercraft Pack 2.0 (opengameart.org/content/watercraft-kit) | CC0 1.0 (`License.txt`) |

Crediting Kenney is not required by CC0 but appreciated.

## Swapping in other models

1. Put the `.glb` (and its textures) in a folder here.
2. Point an entry in `PACKS` in `scripts/build-models.mjs` at it, keeping
   the output name the scene uses (`sedan`, …, `pickup`, `building-a`, …,
   `river-cruise`, …). Vehicles and boats take a `length` in world units (a
   car is about 0.5); buildings keep their own units and are fitted to their
   lots. `lod` sets how much of the mesh the distant copy keeps.
3. Run `pnpm models` and check the printed sizes and LOD vertex counts.

Requirements: one material per model (a shared texture atlas is ideal),
forward along +Z in the source file (vehicles, boats), a few thousand
vertices at most — the city draws hundreds to thousands of each. City Kit
windows light up at night because they sample the atlas's blue swatches; a
different building kit needs that test updated in `createKitMaterial`.
