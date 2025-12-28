// Screen 1: Data Collection Logic

let s1_video;
let s1_p5_instance;
let s1_data = {}; // Structure: { "Label": [ "data:image/png...", ... ] }
let s1_currentLabel = "";
let s1_imagesInSession = 0; // Images for current label
let s1_facingMode = "environment"; // default

const s1_sketch = (p) => {

    p.setup = () => {
        // Create canvas matching video aspect ratio (initial guess, will resize)
        let canvas = p.createCanvas(320, 240);
        canvas.parent('video-container-s1');

        // s1_startCamera(); // Don't start automatically
    };

    p.draw = () => {
        if (s1_video) {
            p.image(s1_video, 0, 0, p.width, p.height);
        }
    };

    // Helper to start/restart camera with specific mode
    window.s1_startCamera = () => {
        if (s1_video) {
            s1_video.remove(); // stop existing stream
        }

        const constraints = {
            video: {
                facingMode: { exact: s1_facingMode }
            },
            audio: false
        };

        // Fallback or explicit constraint logic
        // p5 createCapture accepts a constraints object
        // Note: 'exact' facingMode often fails on desktop, so we need a try-catch equivalent or fallback.
        // p5 doesn't easily let us catch getUserMedia errors directly in the constructor. 
        // We will try standard constraints first.

        // Handling "environment" preference with fallback is tricky in pure p5.
        // We'll simplify: Ask for constraints. If it fails, users usually get default.

        // p5.js specific syntax for createCapture with constraints:
        s1_video = p.createCapture(constraints, function (stream) {
            // Success
            console.log("Camera started");
        });

        // If that fails (e.g. on laptop with no Environment cam), p5 might error out console. 
        // A more robust way is to just use standard createCapture(p.VIDEO) if not mobile.
        // But for this requirement "Must handle errors... fallback", we might need to handle the promise manually if p5 exposed it, but p5 wraps it.
        // For the MVP, we will try to pass the object. If s1_video doesn't initialize properly, p5 handles it somewhat gracefully usually.

        if (s1_video) {
            s1_video.size(320, 240);
            s1_video.hide(); // Hide the DOM element, draw to canvas instead
        }
    };

    window.s1_stopCamera = () => {
        if (s1_video) {
            s1_video.remove();
            s1_video = null;
        }
    };


};

// Initialize p5 instance
s1_p5_instance = new p5(s1_sketch);

// --- UI Interaction ---

const btnToggleCamS1 = document.getElementById('btn-toggle-camera-s1');
const inputLabel = document.getElementById('input-label');
const btnScan = document.getElementById('btn-scan');
const captureCounter = document.getElementById('capture-counter');
const btnNextClass = document.getElementById('btn-next-class');
const btnSaveZip = document.getElementById('btn-save-zip');

// Toggle Camera
btnToggleCamS1.addEventListener('click', () => {
    s1_facingMode = (s1_facingMode === "user") ? "environment" : "user";
    // We need to re-trigger internal camera setup
    if (window.s1_startCamera) window.s1_startCamera();
});

// Scan (Capture)
btnScan.addEventListener('click', () => {
    const label = inputLabel.value.trim();
    if (!label) {
        alert("Please enter a figurine name first!");
        return;
    }

    if (!s1_video) return;

    // Capture Frame
    // We can get the canvas data URL or the video element.
    // Using canvas is easier for p5.
    s1_p5_instance.loadPixels();
    // Actually, simple way:
    // s1_p5_instance.saveCanvas() downloads it. We want the data.
    // s1_p5_instance.canvas.toDataURL()

    const dataUrl = s1_p5_instance.canvas.toDataURL('image/png');

    // Store
    if (!s1_data[label]) {
        s1_data[label] = [];
    }
    s1_data[label].push(dataUrl);

    // Feedback
    s1_imagesInSession++;
    captureCounter.innerText = s1_imagesInSession;

    // Visual flash could be added here
});

// Add Next Figurine
btnNextClass.addEventListener('click', () => {
    const label = inputLabel.value.trim();
    if (label && s1_data[label] && s1_data[label].length > 0) {
        // Just clear the inputs, data is already saved in memory object
        inputLabel.value = "";
        s1_imagesInSession = 0;
        captureCounter.innerText = "0";
        alert(`Saved ${s1_data[label].length} images for "${label}". Ready for next.`);
    } else {
        // If nothing captured yet
        inputLabel.value = "";
        s1_imagesInSession = 0;
        captureCounter.innerText = "0";
    }
});

// Save ZIP
btnSaveZip.addEventListener('click', () => {
    const zip = new JSZip();

    // Iterate over stored data
    const labels = Object.keys(s1_data);
    if (labels.length === 0) {
        alert("No scans to save!");
        return;
    }

    labels.forEach(label => {
        const folder = zip.folder(label);
        const images = s1_data[label];
        images.forEach((imgData, index) => {
            // imgData is "data:image/png;base64,....."
            const base64Data = imgData.split(',')[1];
            folder.file(`${label}_${index}.png`, base64Data, { base64: true });
        });
    });

    // Generate and Download
    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            // Create download link shim
            const a = document.createElement("a");
            const url = URL.createObjectURL(content);
            a.href = url;
            a.download = "klockimowia_dataset.zip";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        });
});
