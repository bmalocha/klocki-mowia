// Screen 3: Recognition Logic

let s3_classifier;
let s3_video;
let s3_p5_instance;
let s3_facingMode = "environment";
let s3_isModelLoaded = false;
let s3_lastResult = [];

// UI Elements
const inputModelFiles = document.getElementById('input-model-files');
const modelStatus = document.getElementById('model-status');
const resultsOverlay = document.getElementById('results-overlay');
const btnToggleCamS3 = document.getElementById('btn-toggle-camera-s3');

// Initialize ml5 Feature Extractor
// Initialize ml5 Feature Extractor
async function s3_initAndLoadModel() {
    console.log("Ala ma kota");
    try {
        modelStatus.innerText = "Checking model configuration...";

        // 1. Fetch model.json to find class count
        const response = await fetch('./model/model.json');
        if (!response.ok) throw new Error('Could not load model.json');

        const modelJson = await response.json();
        let numLabels = 2; // Default

        if (modelJson.ml5Specs && modelJson.ml5Specs.mapStringToIndex) {
            numLabels = modelJson.ml5Specs.mapStringToIndex.length;
            console.log(`Found ${numLabels} classes in model metadata:`, modelJson.ml5Specs.mapStringToIndex);
        } else {
            console.warn("No ml5Specs found in model.json, defaulting to 2 classes.");
        }

        // 2. Initialize Extractor with correct numLabels
        // ml5 syntax: featureExtractor('MobileNet', options, callback)
        s3_featureExtractor = ml5.featureExtractor('MobileNet', { numLabels: numLabels }, () => {
            console.log(`MobileNet (S3) Loaded with ${numLabels} labels`);

            // 3. Load Custom Model
            s3_classifier = s3_featureExtractor.classification();
            modelStatus.innerText = "Loading custom model weights...";

            // Explicitly set numClasses key if needed
            s3_featureExtractor.numClasses = numLabels;

            s3_classifier.load('./model/model.json', () => {
                console.log('Custom Model Loaded');
                modelStatus.innerText = "Model Loaded!";
                s3_isModelLoaded = true;
                s3_classify();
            });
        });

    } catch (err) {
        console.error("Error init model s3:", err);
        modelStatus.innerText = "Error loading model: " + err.message;
    }
}

// Start Init
s3_initAndLoadModel();

// Handle File Upload - REMOVED
// inputModelFiles.addEventListener('change', ...);

// Classification Loop
function s3_classify() {
    if (!s3_isModelLoaded || !s3_video) return;

    // s3_video is a p5 element.
    s3_classifier.classify(s3_video, (err, results) => {
        if (err) {
            console.error(err);
            return;
        }

        s3_lastResult = results;
        s3_updateOverlay(results);

        // Loop
        s3_classify();
    });
}

function s3_updateOverlay(results) {
    if (!results || results.length === 0) return;

    // Sort just in case (ml5 usually returns sorted)
    // results is array of {label, confidence}

    let html = '';
    // Take top 3
    const top3 = results.slice(0, 3);

    top3.forEach((res, index) => {
        const conf = (res.confidence * 100).toFixed(1);
        const style = index === 0 ? 'font-weight:bold; color:#4ade80;' : '';
        html += `<div class="result-item" style="${style}">${res.label}: ${conf}%</div>`;
    });

    resultsOverlay.innerHTML = html;
}

// Camera Setup (p5 instance)
const s3_sketch = (p) => {

    p.setup = () => {
        let canvas = p.createCanvas(320, 240);
        canvas.parent('video-container-s3');
        // Delay start or start immediately? 
        // We'll start immediately for simplicity, 
        // but user might need to toggle if it fails.
        // s3_startCamera(); // Don't start automatically
    };

    p.draw = () => {
        if (s3_video) {
            p.image(s3_video, 0, 0, p.width, p.height);
        }
    };

    // Improved Camera Start with Fallback for Screen 3
    window.s3_startCamera = () => {
        if (s3_video) {
            s3_video.remove();
            s3_video = null;
        }

        const strictConstraints = {
            video: { facingMode: { exact: s3_facingMode } },
            audio: false
        };

        const looseConstraints = {
            video: { facingMode: s3_facingMode },
            audio: false
        };

        const defaultConstraints = {
            video: true,
            audio: false
        };

        const launchP5Video = (validConstraints) => {
            s3_video = p.createCapture(validConstraints, function (stream) {
                console.log("S3 Camera Started with constraints:", validConstraints);
                if (s3_isModelLoaded) {
                    s3_classify();
                }
            });
            s3_video.size(320, 240);
            s3_video.hide();
        };

        navigator.mediaDevices.getUserMedia(strictConstraints.video)
            .then(stream => {
                stream.getTracks().forEach(t => t.stop());
                launchP5Video(strictConstraints);
            })
            .catch(err => {
                console.warn("S3 Strict constraints failed, trying loose...", err);
                navigator.mediaDevices.getUserMedia(looseConstraints.video)
                    .then(stream => {
                        stream.getTracks().forEach(t => t.stop());
                        launchP5Video(looseConstraints);
                    })
                    .catch(err2 => {
                        console.warn("S3 Loose constraints failed, falling back to default...", err2);
                        launchP5Video(defaultConstraints);
                    });
            });
    };

    window.s3_stopCamera = () => {
        if (s3_video) {
            s3_video.remove();
            s3_video = null;
        }
    };
};

// Start p5
s3_p5_instance = new p5(s3_sketch);

// UI Events
btnToggleCamS3.addEventListener('click', () => {
    s3_facingMode = (s3_facingMode === "user") ? "environment" : "user";
    if (window.s3_startCamera) window.s3_startCamera();
});
