# Handoff — Seek redesign branch (`claude/repo-redesign-review-cq6a33`)

Everything below is aimed at running/debugging this branch quickly on a Mac
(hardware-accelerated emulator or a USB-connected phone). The cloud session this
was written from has no KVM, so the Android emulator there runs at ~1/50 speed —
the open issue below is much faster to close on real hardware.

## State of the branch (tip: `b1bf283`)

- Base: `origin/full-redesign` (bottom tabs, dark mode, camera settings sheet,
  observation queue) with all still-relevant fixes re-applied on top.
- Toolchain green: `npm ci`, `npx tsc --noEmit` (0 errors), `npx eslint .`
  (0 errors), `npx jest tests/unit` (31/31 suites, 94/94 tests).
  `tsc` needs a `config.js` (gitignored): `cp config.example.js config.js`.
- CI: every push to this branch builds a standalone arm64 debug APK and
  publishes it as a GitHub Release (`debug-apk-N`), via
  `.github/workflows/build-debug-apk.yml`. Latest: **`debug-apk-9`**
  (camera preview fix + full dark-mode pass).
- Recent commits on top of the build-6 state:
  - `82d1a50` — camera preview sizing fix (the real inversion root cause,
    see open issue 2).
  - `539d405` — dark mode, central fixes: NavigationContainer gets the app
    theme (kills white flashes between screens); `StyledText` remaps legacy
    baked colors in dark mode (ink/black → text, legacy grays → muted,
    legacy greens → primary).
  - `cb3e804` — dark mode, per-screen pass 1: PostToiNat flow, Home upload
    banner + species-nearby location picker/map, challenge details, match.
  - `b1bf283` — dark mode, per-screen pass 2: SideMenu, InputField, modals,
    toasts, species error cards, donation, range-map legend, onboarding
    swiper, gallery error, debug email, signup spinner.

## Dark-mode pass — what was done, what to eyeball

The pattern everywhere: append a theme-token override *after* the static
legacy style, e.g. `style={[viewStyles.container, { backgroundColor:
theme.colors.canvas }]}` with `const { theme } = useTheme( )` from
`components/Providers/ThemeProvider`. Tokens live in `styles/theme.ts`.

Deliberately untouched: the camera overlay (intentionally dark in both
themes), white spinners/text on fixed brand-green or photo-black surfaces,
the always-green onboarding gradient, and `components/Social/` (legacy,
deletion candidate per the TODO in `RootStack.tsx`).

The light-mode quirks noted here earlier (`TapToLoad` / `ModalWithGradient`
white text on the light `primaryContainer`) are fixed — see the polish pass
below.

To verify on device: Settings → appearance → dark, then walk Post-to-iNat
(form, species/location pickers, notes), Home, a challenge detail, a match
screen, side menu, and the modals — everything should sit on the dark
canvas with readable text and no white flashes during navigation.

## Polish pass (branch `ccr-2f8f05b6-osmvws`)

- **Home** no longer shows placeholder content. The hero is the user's real
  level (badge, name, progress bar, "observe N more" caption) and taps
  through to Achievements; the "Your collection" cards show live species /
  in-progress challenge / badge counts. Data comes from
  `components/Achievements/hooks/useProgressSummary.ts`, which re-reads
  realm on every focus (so counts update after returning from the camera).
- **More**: level card replaces the hardcoded "Field Notebook" card;
  Notifications moved into the main list (it was alone under "Help" with a
  help icon); Help now holds Camera help + About. Camera help uses
  `goBack` so it works from either entry point.
- **i18n**: ~40 hardcoded English strings in the camera overlay/settings
  sheet and camera settings moved to `camera.*` / `settings.*` keys in
  `translations/en.json` (other locales fall back to English until Crowdin
  picks them up). The "Animals" camera filter is now "Non-plants" — it is
  the non-plant filter and includes fungi.
- **Invisible controls in light mode** fixed: white bitmap close/back icons
  on the light canvas (Donation, Wikipedia/announcement web views, location
  pickers, Post species search, Home upload card) replaced with themed
  stroke icons + a11y labels. `FullWebView` is now themed for dark mode.
  Camera help had a hardcoded light text panel in dark mode — removed.
- `GreenHeader` is gone; the last two users (Species landscape, gallery
  error) use `AppHeader`.
- `components/Social/` is **unreachable**: `MatchModals` handles
  `navPath === "Social"`, but nothing ever sets that path. Safe to delete
  (screen, styles, route, `socialHelpers`) once product confirms.

To eyeball on device: Home (light + dark, fresh install vs. a few
observations), More, the camera settings sheet, Wikipedia from a species
page, Donate from Settings, and Home → Species nearby → location picker.

## BioCLIP 2 readiness, performance and accessibility (this branch)

**Model packs** (`utility/modelPacks.ts`, Android). The app can now run models
other than the built-in one. A pack is a folder with `manifest.json`, a TFLite
model, the plugin's taxonomy CSV and optional geomodel and common names. Packs
are found in the app's files dir and its external files dir, so this installs
one on a test phone:

```sh
adb push packs/bioclip2-100k /sdcard/Android/data/org.inaturalist.seek.debug/files/models/
```

Then Settings → Seek Camera → Identification model. The live camera and gallery
switch without a restart (the plugin patch now reloads its classifier when the
model files change). Pack common names load in the background, chunked, only
for taxa that have no name yet in the current locale.

Building a BioCLIP 2 pack: `scripts/bioclip2/README.md` (GPU recommended). The
pack's model takes the plugin's input unchanged; its built-in preprocessing was
checked against BioCLIP 2's own on 200 benchmark photos (same accuracy). The
TFLite conversion and on-device speed have **not** been run yet. Packs have no
location model yet, so location scoring is off when one is selected.

**Performance**
- Vision plugin patch: the per-frame taxonomy rollup skips branches below the
  rollup cutoff. On a real 99,988-species taxonomy: 80.7 → 17.5 ms per frame
  (desktop JVM), identical predictions; also 4–6× faster at 20k species and
  slightly faster for today's 507-species model. Verified with a side-by-side
  harness against the original code, including filters, geo scores and
  common-ancestor mode.
- Android stops re-copying the model out of the APK on every launch (copies
  only when missing or a different size).
- Splash waits at least 600 ms instead of a fixed 2 s after startup work.
- Common-name lookups: `CommonNamesRealm.taxon_id` is indexed (schema 47), and
  lookups are cached per locale in memory.
- `styles/themedStyles.ts` (`makeThemedStyles`): styles built once per theme
  for the shared primitives, list cells, Home and More.

**Accessibility**: about 40 touchables gained `accessibilityRole="button"`;
icon-only controls gained labels.

To check on device: switch models in Settings (with a pack pushed), confirm
the camera keeps classifying, and run TalkBack over Home, More, Observations
and a species page.

## Open issue 1 — crash on opening the camera (`debug-apk-2`)

Symptom (from a phone screenshot of the error boundary):

```
TypeError: undefined is not a function
    at FrameProcessorCamera (address at index.android.bundle:1:4968520)
    at RCTView (<anonymous>)
    at View_withRef (address at index.android.bundle:1:204251)
```

What is known so far:

- `1:4968520` symbolicates to the `FrameProcessorCamera` component function
  itself (`components/Camera/ARCamera/FrameProcessorCamera.tsx:356`, the props
  destructure) — i.e. these are component-stack frames, so **something called
  during that component's render is `undefined`**, but the boundary did not
  capture the throwing frame's own address.
- Static analysis ruled out the obvious candidates — all of these exist in the
  exact `node_modules` tree the bundle was built from:
  - `Worklets.createRunOnJS`, `Worklets.defaultContext.createRunAsync`,
    `useSharedValue` (react-native-worklets-core 1.6.3)
  - `InatVision.getCellLocation` → `h3-js@4.4.0` `latLngToCell` (v4 API, present)
  - No `"Worklets"` TurboModule/JSI-global name collision with Reanimated 4's
    `react-native-worklets` (it registers as `"WorkletsModule"` and does not set
    `global.Worklets`).
- Remaining suspects are **runtime/device conditions**, most likely one of:
  1. `react-native-worklets-core`'s JSI install failing on-device under
     RN 0.83 bridgeless (its `NativeWorklets.js` only `console.error`s on
     failure and then exports whatever `global.Worklets` is).
  2. Something inside a `useMemo` that only runs with real device state
     (location coords present → `InatVision.getCellLocation`).

### Fastest way to close it on the Mac

1. Build + install a debug APK on an emulator (or phone via USB):

   ```sh
   npm ci
   node scripts/add-example-model.js   # fetches the example ML model + taxonomy (gitignored)
   cd android
   ./gradlew :app:assembleDebug -PseekBundleDebugJs=true
   #   phone:            add -PreactNativeArchitectures=arm64-v8a
   #   Apple-Silicon AVD: add -PreactNativeArchitectures=arm64-v8a
   #   Intel AVD:         add -PreactNativeArchitectures=x86_64
   adb install -g app/build/outputs/apk/debug/org.inaturalist.seek-*-debug.apk
   ```

   `-PseekBundleDebugJs=true` embeds the JS bundle, so no Metro needed — the
   same configuration the released `debug-apk-2` uses.

2. Reproduce with logcat attached:

   ```sh
   adb logcat -c && adb logcat -s ReactNativeJS:* ReactNative:E AndroidRuntime:E
   ```

   Open the app → tap the center Scan tab. The full JS stack (with
   `address at index.android.bundle:1:NNNN` frames, including the real throwing
   frame that the error-boundary screenshot cut off) appears in logcat.
   Also check for a `Native Worklets Module cannot be found!` or
   `failed to correctly install JSI Bindings` error line right before it —
   that would confirm suspect (1).

3. Symbolicate every address (the build writes the composed Hermes sourcemap):

   ```sh
   echo "index.android.bundle:1:NNNN" | \
     npx metro-symbolicate android/app/build/generated/sourcemaps/react/debug/index.android.bundle.map
   ```

   Hermes compilation is deterministic, so a locally built bundle from the same
   commit symbolicates addresses from the released APK too.

4. If suspect (1) confirms: the fix direction is to stop relying on
   `react-native-worklets-core` for the JS-thread callbacks in
   `FrameProcessorCamera.tsx` / `utility/visionCameraPatches.js` (guard the
   import and fall back, or migrate those call sites to Reanimated 4's
   `react-native-worklets` `runOnJS`/`runOnUI`, which is known-good on
   RN 0.83 bridgeless).

## Open issue 2 — inverted camera preview colors ("non-stabilized camera")

**Root cause found (third pass, fixed in `82d1a50` — verify with
`debug-apk-9`, stabilization OFF):** the redesign made the vision-camera `video`
output conditional on the stabilization toggle
(`video={digitalStabilizationEnabled && ...}` in `FrameProcessorCamera.tsx`;
on `main` it was always on). In stock vision-camera, when the video output
is disabled the Preview use case is sized to `format.photoSize` — the
**maximum photo resolution** (the app requests `photoResolution: "max"`) —
instead of the screen-matched `format.videoSize`. A preview-rate PRIV
stream at full photo resolution is outside the guaranteed CameraX/HAL
stream combinations on many devices and corrupts preview colors. That is
why the corruption appears exactly and only with stabilization off, and
why the emulator (software HAL, any size fine) never reproduced it. The
patch (`CameraSession+Configuration.kt`, `configureOutputs`) now sizes the
preview to `format.videoSize` regardless of whether video is enabled, so
both toggle states use the same preview stream configuration.

Two earlier candidate causes were also eliminated (kept below for
history; both are real non-stock behaviors worth keeping fixed):

- Candidate A (fixed earlier): the **first** test build (`debug-apk-1`,
  pre-rebase) had `USE_NATIVE_FOCUS_PEAKING = Platform.OS === "android"`,
  which attached a custom OpenGL preview shader (`FocusPeakingPreviewEffect`)
  to the CameraX preview whenever the camera ran — even with peaking
  inactive. On some devices that shader's YUV→RGB pass renders wrong colors.
  The branch hardcodes `USE_NATIVE_FOCUS_PEAKING = false` in
  `components/Camera/ARCamera/FrameProcessorCamera.tsx` (peaking draws as a
  JS overlay), so the shader never attaches in apk-2 and later.
- Candidate B (fixed in this commit): the vision-camera patch wrote vendor
  stabilization keys (`org.codeaurora.qcamera3.sessionParameters.EISMode`,
  `samsung.android.control.swVideoStabilization`,
  `samsung.android.lens.opticalStabilizationOperationMode`) as **0** into
  session parameters and runtime capture-request options whenever
  stabilization was off, and forced `LENS_OPTICAL_STABILIZATION_MODE_ON`
  unconditionally. Stock camera apps leave these untouched; writing disable
  values into vendor session parameters can put the vendor ISP pipeline into
  a bad state (wrong/inverted preview colors) — and it happens exactly and
  only in the stabilization-off configuration, matching the symptom. The
  patch (`patches/react-native-vision-camera+4.7.3.patch`,
  `CameraSession+Configuration.kt`) now writes only the documented
  `CONTROL_VIDEO_STABILIZATION_MODE_OFF` when stabilization is off: vendor
  keys are written only when enabling, OIS is only forced when stabilization
  is requested, and the runtime path clears leftover vendor/OIS options on
  disable instead of overwriting them with 0.

## Screenshots of the redesign (nice-to-have)

The cloud session could not capture them (software-emulated AVD too slow).
On the Mac: boot any AVD, install the APK as above, then

```sh
adb exec-out screencap -p > home.png
```

for Home (tabs), Observations, Settings (incl. dark mode), and the camera.

## Misc

- The camera fixes live in `patches/react-native-vision-camera+4.7.3.patch`
  (applied by patch-package on `npm ci`). If you edit files under
  `node_modules/react-native-vision-camera` and regenerate the patch, first
  `rm -rf node_modules/react-native-vision-camera/android/build
  node_modules/react-native-vision-camera/android/.cxx` or the build
  artifacts get baked into the patch.
- ML model files are gitignored; `node scripts/add-example-model.js` fetches
  the public example model into `android/app/src/main/assets/camera/`.
- Google Maps views are blank in debug builds (placeholder API key).
- The debug app installs as `org.inaturalist.seek.debug` alongside any
  production Seek install.
