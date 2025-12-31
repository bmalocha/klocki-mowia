// Screen 3: Recognition Logic

let s3_classifier;
let s3_video;
let s3_p5_instance;
let s3_facingMode = "environment";
let s3_isModelLoaded = false;
let s3_lastResult = [];

// Audio State
let s3_isAudioPlaying = false;
let s3_lastPlayedClass = "";

// UI Elements
const inputModelFiles = document.getElementById('input-model-files');
const modelStatus = document.getElementById('model-status');
const resultsOverlay = document.getElementById('results-overlay');
const highConfDisplay = document.getElementById('high-confidence-display');
const btnToggleCamS3 = document.getElementById('btn-toggle-camera-s3');

// Initialize ml5 Feature Extractor
// ... (previous initialization code) ...
async function s3_initAndLoadModel() {
    console.log("Initializing Model Screen 3...");
    try {
        modelStatus.innerText = "Checking model configuration...";

        // Anti-caching timestamp
        const cacheBuster = '?t=' + new Date().getTime();

        // 1. Fetch model.json to find class count
        const response = await fetch('./model/model.json' + cacheBuster);
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

            s3_classifier.load('./model/model.json' + cacheBuster, () => {
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
    // 1. Audio Lock: If audio is playing, ignore new results
    if (s3_isAudioPlaying) {
        return;
    }

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

    // Check for high confidence (>= 85%)
    if (results.length > 0) {
        const topResult = results[0];
        const confidence = topResult.confidence * 100;

        if (confidence >= 85) {
            highConfDisplay.innerText = `${topResult.label} (${confidence.toFixed(1)}%)`;
            highConfDisplay.style.color = '#22c55e'; // success green

            // 2. Trigger Audio if Class Changes
            if (topResult.label !== s3_lastPlayedClass) {
                console.log(`Class changed: ${s3_lastPlayedClass} -> ${topResult.label} (Conf: ${confidence.toFixed(1)}%)`);
                s3_lastPlayedClass = topResult.label;
                s3_playAudio(topResult.label);
            }
        } else {
            highConfDisplay.innerText = '';
            // If confidence drops below threshold, we MIGHT want to reset lastPlayedClass
            // so if they show it again it plays again?
            // Spec says: "If detection changes... audio is played."
            // "Cow -> Cow -> Cow ... plays once."
            // "Cow -> Noise/LowConf -> Cow" ... ?
            // Usually simpler to NOT reset on noise, only on different valid class.
            // But if user puts object down and picks it up again, they might expect sound.
            // For now, adhering strictly to "Trigger on Class Change".
            // If we want re-trigger after silence, we'd clear s3_lastPlayedClass here.
        }
    }
}

// Audio Playback Logic
function s3_playAudio(className) {
    if (s3_isAudioPlaying) return;

    s3_isAudioPlaying = true;
    console.log(`[Audio] Attempting to play sound for: ${className}`);

    // Session Storage Key for Round Robin
    const storageKey = `s3_audio_index_${className}`;
    let currentIndex = parseInt(sessionStorage.getItem(storageKey)) || 1;

    // Construct filename: {class}{index}.mp3
    // E.g. cow1.mp3
    // Note: User files might be just "cow.mp3" if they haven't followed the new spec yet.
    // We'll try the indexed version first.

    // Create Audio Object
    // We need to handle the case where file doesn't exist.
    // HTML5 Audio doesn't throw on creation, but on play() or error event.

    let audioSrc = `./media/${className}${currentIndex}.mp3`;
    let audio = new Audio(audioSrc);

    // Error Handling / Fallback / Round Robin Loop
    audio.onerror = () => {
        console.warn(`[Audio] File not found or error: ${audioSrc}`);

        // Strategy:
        // 1. If index > 1, it means we ran out of files in the sequence. Reset to 1 and try again.
        // 2. If index == 1, maybe the user didn't use numbers. Try without number.

        if (currentIndex > 1) {
            console.log("[Audio] End of sequence reached? Resetting to 1.");
            currentIndex = 1;
            sessionStorage.setItem(storageKey, currentIndex);
            // Recursively try again with index 1 (prevent infinite loop with safeguards?)
            // A simple way is to just define a new source and try once more.
            audioSrc = `./media/${className}1.mp3`;
            audio = new Audio(audioSrc);

            // Re-attach error handler for the retry
            audio.onerror = () => {
                // Try fallback: plain filename
                console.log("[Audio] Index 1 failed. Trying plain filename...");
                audioSrc = `./media/${className}.mp3`;
                audio = new Audio(audioSrc);
                audio.play().catch(e => {
                    console.error("[Audio] All attempts failed.", e);
                    s3_isAudioPlaying = false; // Release lock
                });
                // Attach success handler to the fallback
                audio.onended = () => s3_handleAudioEnd(className, currentIndex);
            }

            // Try playing the reset index
            audio.play().catch(e => {
                console.error("[Audio] Retry play failed", e);
                s3_isAudioPlaying = false;
            });
            audio.onended = () => s3_handleAudioEnd(className, currentIndex);

        } else {
            // Index is 1 and failed. Try plain filename.
            console.log("[Audio] Index 1 missing. Trying plain filename...");
            audioSrc = `./media/${className}.mp3`;
            audio = new Audio(audioSrc);

            audio.onerror = (e) => {
                console.error("[Audio] Plain filename also failed. No audio for this class.", e);
                s3_isAudioPlaying = false; // Release lock
            }

            audio.play().catch(e => {
                console.error("[Audio] Play failed", e);
                s3_isAudioPlaying = false;
            });
            audio.onended = () => s3_handleAudioEnd(className, currentIndex);
        }
    };

    audio.onended = () => s3_handleAudioEnd(className, currentIndex);

    // Start
    audio.play().catch(e => {
        console.error("[Audio] Playback interrupted or failed", e);
        // Ensure lock is released if play fails immediately
        // (e.g. browser policy blocking autoplay)
        s3_isAudioPlaying = false;
    });
}

function s3_handleAudioEnd(className, playedIndex) {
    console.log("[Audio] Playback finished.");
    s3_isAudioPlaying = false; // Unlock

    // Increment index for next time
    // We assume the file played successfully if we got here.
    // If we played a fallback (no number), incrementing implies we might look for #2 next time?
    // If we played #1, next is #2.
    // If we played #Max, next will be #Max+1, which will fail next time and reset to #1.
    // This implements the loop implicitly.

    // Note: If we played the "plain" file because #1 was missing, 
    // we should probably NOT increment, or maybe assume only 1 file exists.
    // But keeping it simple: just increment.

    const storageKey = `s3_audio_index_${className}`;
    const nextIndex = playedIndex + 1;
    sessionStorage.setItem(storageKey, nextIndex);
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
