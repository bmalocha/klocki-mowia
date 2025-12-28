# Product Requirements Document (PRD) – KlockiMowia

| **Project Name** | KlockiMowia |
| :--- | :--- |
| **Version** | 1.0 |
| **Date** | December 28, 2025 |
| **Status** | Draft |
| **Technology Stack** | ml5.js (Feature Extractor), p5.js, HTML5, JSZip |

## 1. Introduction and Objective
A Single Page Application (SPA) designed for creating custom image recognition models, specifically tailored for identifying figurines (e.g., LEGO DUPLO). The application allows users to collect datasets, train a model directly in the browser, and utilize the trained model for real-time object classification.

## 2. Architecture and Technical Stack
*   **Graphics & Camera Engine:** p5.js (canvas management, access to `createCapture` and video streams).
*   **Machine Learning Engine:** ml5.js (Feature Extractor based on MobileNet).
*   **File Management:**
    *   *Downloading Data:* **JSZip** library (packaging images into structured folders).
    *   *Uploading Data:* HTML Input with `webkitdirectory` attribute (uploading entire directories with images).
*   **Platform:** Web Browser (Chrome/Edge/Safari on mobile and desktop).

***

## 3. Functional Requirements – Screen Breakdown

The application consists of 3 main views (Screens) that the user can navigate between (e.g., via a top/bottom navigation bar).

### Screen 1: Data Collection
Dedicated to creating training datasets.

**Interface Elements:**
1.  **Video Preview:** p5.js canvas displaying the live camera stream.
2.  **Camera Toggle:** Button or switch "Front / Rear".
    *   *Logic:* Toggles the `facingMode` constraint between `user` and `environment`.
3.  **"Figurine Name" Text Input:**
    *   *Function:* Defines the label for the captured images. This will serve as the directory name in the ZIP file.
4.  **"Scan" Button (Capture):**
    *   *Action:* Captures the current video frame, converts it to Blob/Base64, and stores it in temporary memory assigned to the current "Figurine Name".
    *   *Feedback:* Screen flash or a counter update (e.g., "Captured: 15").
5.  **"Add Next Figurine" Button:**
    *   *Action:* Clears the "Figurine Name" field and resets the session counter, but **does not delete** the images of the previous figurine from memory (prepares for collecting a new class).
6.  **"Save Scans" Button (Download):**
    *   *Action:* Uses the JSZip library to package all images collected in the session.
    *   *ZIP Structure:* A main ZIP file containing subdirectories named after the inputs in the "Figurine Name" field, containing `.png` or `.jpg` files.

### Screen 2: Model Training
Dedicated to training the neural network to recognize the collected classes.

**Interface Elements:**
1.  **Data Loading Area:** Button/Area "Select Image Folder".
    *   *Technical:* `<input type="file" webkitdirectory directory multiple>`.
    *   *Logic:* Script iterates through uploaded files. The parent directory name of each file becomes the label for `featureExtractor.addImage(img, label)`.
2.  **Status Panel:** List of loaded classes and image counts (e.g., "Policeman: 20 imgs", "Cow: 15 imgs").
3.  **"Train" Button:**
    *   *Action:* Triggers `featureExtractor.train()`.
    *   *Feedback:* Progress bar (Loss value) updated in real-time via the `whileTraining` callback.
4.  **"Save Model" Button:**
    *   *Availability:* Active only after training is complete.
    *   *Action:* Triggers `classifier.save()`. Downloads two files: `model.json` and `model.weights.bin`.

### Screen 3: Recognition (Inference)
The "production" mode where the trained model identifies objects.

**Interface Elements:**
1.  **Model Loading Area:** Two file inputs (or one multiselect) to upload `model.json` and `model.weights.bin`.
2.  **Video Preview:** p5.js canvas (fullscreen on mobile).
3.  **Camera Toggle:** Same functionality as in Screen 1 (Front/Rear).
4.  **Results Overlay:**
    *   Displays real-time recognition results.
    *   **Format:** Top-3 results list.
    *   **Data Layout:**
        1.  `Class Name 1: XX%` (Highest confidence)
        2.  `Class Name 2: YY%`
        3.  `Class Name 3: ZZ%`
    *   *Logic:* Retrieves the `results` array from ml5.js, sorts descending by confidence, and displays the top 3 items. The `confidence` value (0.0 - 1.0) is multiplied by 100 and rounded.

***

## 4. Technical Requirements and Limitations

### 4.1. Camera Handling
*   The application must enforce the use of the rear camera when "Rear" is selected using:
    ```javascript
    video: {
      facingMode: { exact: "environment" }
    }
    ```
*   Must handle errors if the rear camera is missing (fallback to `facingMode: "user"`).

### 4.2. Performance
*   Image processing (classification) in Screen 3 should not block the main UI thread.
*   Video resolution should be optimized for MobileNet (typically 224x224 px for the model, but display resolution for the user can be higher).

### 4.3. Security and Files
*   The application must run over **HTTPS** (required for camera access).
*   Image processing occurs **locally** (Client-side) – no images are sent to an external server.

## 5. User Flow Example

1.  **User enters Screen 1.**
2.  Types "Batman", clicks "Scan" 20 times while rotating the figurine.
3.  Clicks "Add Next Figurine".
4.  Types "Joker", clicks "Scan" 20 times.
5.  Clicks "Save Scans" -> Downloads `scans.zip`.
6.  Unzips the file on their device (creating `/Batman` and `/Joker` folders).
7.  **Navigates to Screen 2.**
8.  Clicks "Select Folder" and selects the unzipped directories.
9.  Clicks "Train". After a moment, sees "Training Complete".
10. Clicks "Save Model" -> Downloads model files.
11. **Navigates to Screen 3.**
12. Uploads the downloaded model files.
13. Points the camera at the Batman figurine.
14. Sees the overlay: "Batman: 98%".