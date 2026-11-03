# BioCLIP 2 model pack for Seek

Builds an identification model pack the app can load in place of the built-in
model (Settings → Seek Camera → Identification model, Android). The pack format
is documented in `utility/modelPacks.ts`.

## What's in a pack

| File | What it is |
|---|---|
| `model.tflite` | BioCLIP 2's image encoder (ViT-L/14, MIT license) plus a final layer scoring every species. It takes the vision plugin's input unchanged (`[1, 299, 299, 3]`, raw 0–255, column-major) and returns probabilities `[1, N]`. |
| `taxonomy.csv` | The plugin's taxonomy format with each species' full iNat lineage, so predictions carry real iNat taxon and ancestor ids. |
| `common_names.json` | `[{ i, l, n }]` rows, loaded into the app's names table for the current language. |
| `manifest.json` | Id, name, plugin version string, revision and file names. |

The final layer is BioCLIP 2's text embedding of each species
("a photo of <lineage> <epithet> with common name <name>.") times 100, plus a
popularity prior `gamma · log(Research Grade observations)`. `gamma = 0.1` was the
best setting in the benchmark's cross-validation.

## Build

A GPU is strongly recommended (100k text prompts and the TFLite conversion).

```sh
python -m venv .venv && . .venv/bin/activate
pip install torch open_clip_torch litert-torch ai-edge-quantizer ai-edge-litert requests pillow numpy

python fetch_species.py --n 100000           # species.json (~40 min at iNat's 1 request/second)
python build_pack.py --out packs/bioclip2-100k
python verify_pack.py packs/bioclip2-100k some_photo.jpg another.jpg
```

Useful options:

- `--species 30000`: a smaller pack (fewer look-alike mix-ups, smaller head).
- `fetch_species.py --place-id 97391`: species for one iNat place (Europe here), for a regional pack.
- `--precision int8-dynamic` (default: dynamic-range int8, ~4x smaller than fp32, and XNNPACK runs the int8 weights as they are), `int8-weights` (weight-only: same size, but XNNPACK unpacks the weights to fp32 at load, measured 3.3 GB resident vs 0.8 GB for int8-dynamic) or `fp32`; `--keep-fp32` keeps the unquantized file for `verify_pack.py`. On 400 benchmark photos int8-dynamic gave the same top-1 as fp32 for 96.5% of photos and 74.3% vs 73.3% accuracy.
- `--locales en,de,fr`: common names in more languages (about an hour per extra language).
- `--skip-model`: taxonomy, names and manifest only, in seconds.

Expect roughly 400 MB with int8 weights for 100k species.

## Install on a phone (debug build)

```sh
adb push packs/bioclip2-100k /sdcard/Android/data/org.inaturalist.seek.debug/files/models/
```

(For a release build the package is `org.inaturalist.seek`.) Then open
Settings → Seek Camera → Identification model and pick BioCLIP 2. The camera
switches models without a restart, and the pack's common names load in the
background.

## Not included yet

- A location model. Packs without `geomodel` run image-only, with location
  scoring turned off. The benchmark showed nearby-species priors add a lot, so a
  geomodel-shaped prior (same `[1, 5] → [1, N]` contract as iNat's) is the next
  piece.
- iOS. The iOS plugin uses Core ML; packs are Android-only for now.

## Checked so far

- The model's built-in preprocessing (undoing the plugin's transpose, then resizing
  299 → 224 bilinear) matches BioCLIP 2's own preprocessing on 200 benchmark photos:
  the same species-level accuracy (64.0% vs 64.0%), and the same top species on 87.5%
  of photos.
- The generated `taxonomy.csv` (99,988 species, 148,619 nodes) loads in the patched
  plugin. Per-frame taxonomy rollup takes 17.5 ms instead of 80.7 ms (desktop JVM),
  with identical results.
- Not yet run: the TFLite conversion itself and on-device speed.
