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

    // Improved Camera Start with Fallback
    window.s1_startCamera = () => {
        if (s1_video) {
            s1_video.remove();
            s1_video = null;
        }

        const strictConstraints = {
            video: { facingMode: { exact: s1_facingMode } },
            audio: false
        };

        const looseConstraints = {
            video: { facingMode: s1_facingMode },
            audio: false
        };

        // Final fallback (e.g. for desktop webcam)
        const defaultConstraints = {
            video: true,
            audio: false
        };

        // Helper to launch p5 capture
        const launchP5Video = (validConstraints) => {
            s1_video = p.createCapture(validConstraints, function (stream) {
                console.log("Camera started with constraints:", validConstraints);
            });
            s1_video.size(320, 240);
            s1_video.hide();
        };

        // Check constraints via raw API to handle errors gracefully before p5
        navigator.mediaDevices.getUserMedia(strictConstraints)
            .then(stream => {
                // Strict works, stop this test stream and let p5 take over
                stream.getTracks().forEach(t => t.stop());
                launchP5Video(strictConstraints);
            })
            .catch(err => {
                console.warn("Strict constraints failed, trying loose...", err);
                navigator.mediaDevices.getUserMedia(looseConstraints)
                    .then(stream => {
                        stream.getTracks().forEach(t => t.stop());
                        launchP5Video(looseConstraints);
                    })
                    .catch(err2 => {
                        console.warn("Loose constraints failed, falling back to default...", err2);
                        launchP5Video(defaultConstraints);
                    });
            });
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

// Helper to get formatted timestamp YYYYMMDD-HHMMSS
function getTimestamp() {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const y = now.getFullYear();
    const m = pad(now.getMonth() + 1);
    const d = pad(now.getDate());
    const h = pad(now.getHours());
    const min = pad(now.getMinutes());
    const s = pad(now.getSeconds());
    return `${y}${m}${d}-${h}${min}${s}`;
}

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

    const timestamp = getTimestamp();

    labels.forEach(label => {
        const folder = zip.folder(label);
        const images = s1_data[label];
        images.forEach((imgData, index) => {
            // imgData is "data:image/png;base64,....."
            const base64Data = imgData.split(',')[1];
            folder.file(`${timestamp}_${label}_${index}.png`, base64Data, { base64: true });
        });
    });

    // Generate and Download
    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            // Create download link shim
            const a = document.createElement("a");
            const url = URL.createObjectURL(content);
            a.href = url;
            a.download = `${timestamp}_klockimowia_dataset.zip`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        });
});
