const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const outputBox = document.getElementById('output-box');
const outputText = document.getElementById('output-text');
const statusText = document.getElementById('status');
const logMsg = document.getElementById('log-msg');
const confidenceBar = document.getElementById('confidence-bar');
const sosBtn = document.getElementById('sos-btn');

const synth = window.speechSynthesis;
const sosAudio = new Audio('emergency.mp3'); 
sosAudio.loop = true;

let lastSpoken = "";
let isSirenPlaying = false;
let buffer = [];
const BUFFER_SIZE = 5;

// Audio Toggle
function toggleSiren(force) {
    if (force === "off" || (isSirenPlaying && force !== "on")) {
        sosAudio.pause(); isSirenPlaying = false;
        outputBox.classList.remove('emergency-active');
        sosBtn.innerText = "SOS OVERRIDE";
    } else {
        sosAudio.play().catch(e => logMsg.innerText = "ACTION_REQUIRED: CLICK SCREEN");
        isSirenPlaying = true;
        sosBtn.innerText = "TERMINATE ALARM";
    }
}
sosBtn.addEventListener('click', () => toggleSiren());

function speak(text) {
    if (synth.speaking || text === lastSpoken) return;
    lastSpoken = text;
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (text === "HELP") {
        outputBox.classList.add('emergency-active');
        if (!isSirenPlaying) toggleSiren("on");
    } else {
        outputBox.classList.remove('emergency-active');
    }

    synth.speak(utterance);
    outputText.innerText = text;
    logMsg.innerText = `TRANSLATION_CONFIRMED: ${text}`;
    setTimeout(() => { lastSpoken = ""; }, 3000);
}

function getDist(p1, p2) { return Math.hypot(p1.x - p2.x, p1.y - p2.y); }

function analyzeGesture(lm) {
    const indexUp  = getDist(lm[8], lm[0])  > getDist(lm[6], lm[0]);
    const middleUp = getDist(lm[12], lm[0]) > getDist(lm[10], lm[0]);
    const ringUp   = getDist(lm[16], lm[0]) > getDist(lm[14], lm[0]);
    const pinkyUp  = getDist(lm[20], lm[0]) > getDist(lm[18], lm[0]);
    
    // Logic Mapping
    if (indexUp && middleUp && ringUp && pinkyUp) return "STOP";
    if (indexUp && middleUp && ringUp && !pinkyUp) return "WATER";
    if (!indexUp && !middleUp && !ringUp && pinkyUp) return "RESTROOM";

    const thumbDown = lm[4].y > lm[2].y && getDist(lm[4], lm[2]) > 0.12;
    if (!indexUp && !middleUp && !ringUp && !pinkyUp && thumbDown) return "HELP";

    return null;
}

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        statusText.innerText = "NEURAL_LINK_ESTABLISHED";
        const lm = results.multiHandLandmarks[0];
        
        // Advanced HUD Drawing
        drawConnectors(canvasCtx, lm, HAND_CONNECTIONS, {color: '#00ffff', lineWidth: 1});
        drawLandmarks(canvasCtx, lm, {color: '#ff00ff', radius: (data) => data.index === 4 || data.index === 8 ? 4 : 1});

        const gesture = analyzeGesture(lm);
        buffer.push(gesture);
        if (buffer.length > BUFFER_SIZE) buffer.shift();

        // Update Confidence Bar
        const matches = buffer.filter(v => v === gesture && v !== null).length;
        confidenceBar.style.width = `${(matches / BUFFER_SIZE) * 100}%`;

        if (matches === BUFFER_SIZE) speak(gesture);
    } else {
        statusText.innerText = "SCANNING_FOR_TARGET...";
        confidenceBar.style.width = "0%";
    }
    canvasCtx.restore();
}

const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.6 });
hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        canvasElement.width = window.innerWidth;
        canvasElement.height = window.innerHeight;
        await hands.send({image: videoElement});
    }
});
camera.start();