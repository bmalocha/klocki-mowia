# Implementation Plan - Screen 3: Recognition (Inference)

## Goal Description
Implement the **Recognition** screen to load the trained model and perform real-time classification on the live camera feed.

## User Review Required
None.

## Proposed Changes

### Core Structure
#### [MODIFY] [index.html](file:///Users/admin/Projects/KlockiMowia/index.html)
- Add container for "Screen 3".
- **UI Elements**:
  - Model Inputs: `<input type="file" id="input-model-files" multiple>` (accepts json and bin).
  - Video Preview: Fullscreen or large container.
  - Camera Toggle: `#btn-toggle-camera-s3`.
  - Overlay: `#results-overlay`.

### Logic & Behavior
#### [NEW] [js/screen3_recognition.js](file:///Users/admin/Projects/KlockiMowia/js/screen3_recognition.js)
- **Model Loading**:
  - Handle file upload of `.json` and `.bin`.
  - Use `ml5.featureExtractor` (or `classifier` loaded from it) to load the files.
    - *Syntax check*: `featureExtractor.load(filesOrPath, cb)`. ml5 often requires URLs or paths. For local file objects, we might need `URL.createObjectURL` or handle the `files` array if ml5 supports it (ml5 usually supports passing the file objects directly in recent versions, or we use a FileReader workaround).
- **Inference Loop**:
  - Start Video (reuse p5 video or new instance).
  - `classifier.classify(video, gotResults)`.
  - `gotResults` callback:
    - Receive `results` array.
    - Sort (usually already sorted) and slice top 3.
    - Update DOM Overlay.
    - Loop safely (requestAnimationFrame logic handling inside ml5 mostly).
- **Camera Handling**:
  - Same toggle logic as Screen 1.

### Dependencies
- **ml5.js**.
- **p5.js**.

## Verification Plan

### Manual Verification
1.  **Load Model**:
    - Select the `model.json` and `model.weights.bin` from Screen 2.
    - Verify console logs "Model Loaded".
2.  **Inference**:
    - Point camera at object (e.g., "Batman").
    - Verify Overlay shows "Batman" with high confidence (>80%).
    - Point at other object.
    - Verify label changes.
3.  **Performance**:
    - Ensure UI is responsive (no freezing).
