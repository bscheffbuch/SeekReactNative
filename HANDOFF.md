# Handoff — Seek redesign branch (`claude/repo-redesign-review-cq6a33`)

Everything below is aimed at running/debugging this branch quickly on a Mac
(hardware-accelerated emulator or a USB-connected phone). The cloud session this
was written from has no KVM, so the Android emulator there runs at ~1/50 speed —
the two open issues below are much faster to close on real hardware.

## State of the branch

- Base: `origin/full-redesign` (bottom tabs, dark mode, camera settings sheet,
  observation queue) with all still-relevant fixes re-applied on top.
- Toolchain green: `npm ci`, `npx tsc` (0 errors), `npx eslint .` (0 errors),
  `npx jest` (31/31 suites, 85/85 tests).
- CI: every push to this branch builds a standalone arm64 debug APK and
  publishes it as a GitHub Release (`debug-apk-N`), via
  `.github/workflows/build-debug-apk.yml`.

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

**Root cause found (third pass, fixed in the branch — verify with
`debug-apk-7` or newer):** the redesign made the vision-camera `video`
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

- ML model files are gitignored; `node scripts/add-example-model.js` fetches
  the public example model into `android/app/src/main/assets/camera/`.
- Google Maps views are blank in debug builds (placeholder API key).
- The debug app installs as `org.inaturalist.seek.debug` alongside any
  production Seek install.
