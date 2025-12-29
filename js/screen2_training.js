// Screen 2: Model Training Logic

let s2_featureExtractor;
let s2_classifier;
let s2_isModelReady = false;
let s2_loss = 0;

// Elements
const inputDataset = document.getElementById('input-dataset');
const trainingStatusPanel = document.getElementById('training-status-panel');
const btnTrain = document.getElementById('btn-train');
const btnSaveModel = document.getElementById('btn-save-model');
const progressEl = document.getElementById('training-progress');
const lossDisplay = document.getElementById('loss-display');

// Initialize ml5 Feature Extractor
// Initialize ml5 Feature Extractor
function s2_initModel(numLabels = 2) {
    return new Promise((resolve) => {
        // using MobileNet without default regression (we want classification)
        // ml5 syntax: featureExtractor('MobileNet', options, callback)
        const options = { numLabels: numLabels };
        s2_featureExtractor = ml5.featureExtractor('MobileNet', options, () => {
            console.log(`MobileNet Loaded with ${numLabels} labels`);
            s2_isModelReady = true;
            resolve();
        });

        // Explicitly set numClasses as suggested by user
        s2_featureExtractor.numClasses = numLabels;

        // Create a classifier from the extractor
        s2_classifier = s2_featureExtractor.classification();
    });
}

// Load Dataset
inputDataset.addEventListener('change', async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Reset
    // Reset
    // We will re-init model later after counting labels
    s2_classifier = null;
    s2_isModelReady = false;
    trainingStatusPanel.innerHTML = '<p>Loading images...</p>';
    btnTrain.disabled = true;
    btnSaveModel.disabled = true;
    progressEl.style.width = '0%';

    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    const dataByLabel = {};

    // Group by label first
    fileArray.forEach(file => {
        // webkitRelativePath: "Label/Image.png"
        const parts = file.webkitRelativePath.split('/');
        // Assuming min depth 2: Parent/Label/Image.png or just Label/Image.png
        // If uploaded root "MyDataset", and inside are "Cat", "Dog".
        // Path: "MyDataset/Cat/img.png" -> Label "Cat" (2nd to last)

        let label = "Unknown";
        if (parts.length >= 2) {
            label = parts[parts.length - 2];
        }

        if (!dataByLabel[label]) dataByLabel[label] = [];
        dataByLabel[label].push(file);
    });

    // Determine number of classes and Re-init Model
    const labels = Object.keys(dataByLabel);
    const numClasses = labels.length;

    trainingStatusPanel.innerHTML = '<p>Initializing model matrix...</p>';
    await s2_initModel(numClasses);

    // UI Update
    trainingStatusPanel.innerHTML = '';
    labels.forEach(l => {
        const div = document.createElement('div');
        div.className = 'class-item';
        div.innerHTML = `<span>${l}</span><span>${dataByLabel[l].length} imgs</span>`;
        trainingStatusPanel.appendChild(div);
    });

    // Process Images Sequentially to avoid memory spikes or race conditions
    console.log(`Loading ${fileArray.length} images...`);

    let loadedCount = 0;

    // Helper to load image and add to classifier
    const addImageToClassifier = (file, label) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                s2_classifier.addImage(img, label, () => {
                    // Added callback
                    resolve();
                });
            };
            img.src = URL.createObjectURL(file);
        });
    };

    // Sequential loading
    for (const label of labels) {
        for (const file of dataByLabel[label]) {
            await addImageToClassifier(file, label);
            loadedCount++;
            progressEl.style.width = `${(loadedCount / fileArray.length) * 100}%`;
        }
    }

    console.log("All images loaded");
    btnTrain.disabled = false;
    btnTrain.innerText = "Train Model";
});

// Train
btnTrain.addEventListener('click', () => {
    if (!s2_classifier) return;

    btnTrain.disabled = true;
    btnTrain.innerText = "Training...";

    // ml5 train(callback, whileTraining)
    s2_classifier.train((lossValue) => {
        // While training
        if (lossValue) {
            if (typeof lossValue === 'number') {
                s2_loss = lossValue;
                lossDisplay.innerText = `Loss: ${s2_loss.toFixed(6)}`;
            } else {
                console.log('Loss:', lossValue); // Debug check
            }
            // Visual feedback could be a graph or just text
        } else {
            // Finished (lossValue is null)
            lossDisplay.innerText = 'Training Complete';
            btnSaveModel.disabled = false;
            btnTrain.innerText = "Model Trained";
        }
    });
});

// Save
btnSaveModel.addEventListener('click', () => {
    if (s2_classifier) {
        s2_classifier.save();
    }
});

// Init on load
s2_initModel();
