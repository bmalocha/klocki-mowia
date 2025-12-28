# Implementation Plan - Screen 2: Model Training

## Goal Description
Implement the **Model Training** screen where users upload their collected datasets, train the MobileNet-based Feature Extractor, and export the trained model.

## User Review Required
> [!NOTE]
> `webkitdirectory` is non-standard but widely supported in Chrome/Edge/Firefox. Safari support is partial/recent. Fallback might be needed if Safari Desktop is a target (selecting multiple files instead of folder). PRD specifies `webkitdirectory`.

## Proposed Changes

### Core Structure
#### [MODIFY] [index.html](file:///Users/admin/Projects/KlockiMowia/index.html)
- Add container for "Screen 2".
- **UI Elements**:
  - Folder Input: `<input type="file" id="input-dataset" webkitdirectory directory multiple>`.
  - Status Panel: `#training-status-panel` (list of classes).
  - Train Button: `#btn-train`.
  - Progress Bar/Text: `#training-progress`.
  - Save Model Button: `#btn-save-model` (disabled initially).

### Logic & Behavior
#### [NEW] [js/screen2_training.js](file:///Users/admin/Projects/KlockiMowia/js/screen2_training.js)
- **File Handling**:
  - Listen to `change` event on file input.
  - Parse `files` list.
  - Extract directory name from `webkitRelativePath` (e.g., `Label/image.png` -> Label).
  - Group files by Label.
- **ml5.js Integration**:
  - Initialize `featureExtractor = ml5.featureExtractor('MobileNet', options)`.
  - Iterate through loaded images and call `featureExtractor.addImage(imgElement, label)`.
    - *Note*: Need to create temporary `<img>` elements or p5 images from the uploaded Files to pass to ml5.
- **Training**:
  - On "Train" click: call `featureExtractor.train(whileTrainingCallback)`.
  - Update UI with loss value.
  - On complete: enable "Save Model".
- **Export**:
  - On "Save Model" click: call `featureExtractor.save()`.

### Dependencies
- **ml5.js** (CDN or local).

## Verification Plan

### Manual Verification
1.  **Data Loading**:
    - Upload the ZIP/Folder created in Screen 1 steps.
    - Verify Status Panel lists correct classes and counts.
2.  **Training**:
    - Click "Train".
    - Watch loss values decrease.
    - Wait for "Training Complete".
3.  **Export**:
    - Click "Save Model".
    - Verify `model.json` and `model.weights.bin` are downloaded.
