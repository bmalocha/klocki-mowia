# Implementation Plan - Screen 1: Data Collection

## Goal Description
Implement the **Data Collection** screen as described in the PRD. This screen is responsible for capturing images from the camera, labeling them, and exporting them as a ZIP file for training.

## User Review Required
> [!IMPORTANT]
> - Confirm if the application handles "environment" camera correctly on desktop devices (usually defaults to webcam).
> - confirm `webkitdirectory` support for future Screen 2 (Screen 1 only does download, which is fine universally).

## Proposed Changes

### Core Structure
#### [NEW] [index.html](file:///Users/admin/Projects/KlockiMowia/index.html)
- Add a container for "Screen 1" (hidden/shown based on navigation).
- **UI Elements**:
  - Video Preview container (`#video-container`).
  - Toggle Camera Button (`#btn-toggle-camera`).
  - Figurine Name Input (`#input-label`).
  - Scan Button (`#btn-scan`).
  - Add Next Figurine Button (`#btn-next-class`).
  - Save Scans Button (`#btn-save-zip`).
  - Counter/Feedback display (`#capture-counter`).

### Logic & Behavior
#### [NEW] [js/screen1_collection.js](file:///Users/admin/Projects/KlockiMowia/js/screen1_collection.js)
- **Camera Setup**:
  - Use `p5.js` `createCapture(VIDEO)`.
  - Implement switching between `user` and `environment` modes.
- **Capture Logic**:
  - On "Scan": Capture frame from p5 video element.
  - Resize/Process if necessary (though PRD implies raw capture for basic dataset, Screen 3 mentions 224x224, keeping high res for dataset is usually better, but consistency helps. Will capture raw canvas).
  - Store image data (Blob/Base64) in an object/array structure: `data = { "Label": [img1, img2...], ... }`.
- **Session Management**:
  - "Add Next Figurine": specific logic to lock the previous label's data and clear input for new label.
- **Export**:
  - "Save Scans": Iterate through `data`.
  - Use `JSZip` to create folders based on labels.
  - Add images to folders (as `.png` or `.jpg` files).
  - Trigger download of `.zip`.

#### [NEW] [js/app.js](file:///Users/admin/Projects/KlockiMowia/js/app.js)
- Global state management (which screen is active).
- Navigation logic.

### Dependencies
- **p5.js** (CDN or local).
- **JSZip** (CDN or local).

## Verification Plan

### Automated Tests
- None for UI/Camera interaction (hard to automate in headless).

### Manual Verification
1.  **Camera Permissions**:
    - Open app, verify browser asks for camera permission.
    - Verify video feed is visible.
2.  **Toggle Camera**:
    - Click toggle, verify stream switches (on mobile).
3.  **Data Capture**:
    - Enter label "TestA".
    - Click Scan 5 times.
    - Verify counter says 5.
    - Click "Add Next Figurine".
    - Enter label "TestB".
    - Click Scan 3 times.
4.  **Download**:
    - Click "Save Scans".
    - Verify `scans.zip` is downloaded.
    - Unzip and check structure:
      - `/TestA/` (5 images).
      - `/TestB/` (3 images).
