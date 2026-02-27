const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const outputBox = document.getElementById('output-box');
const statusText = document.getElementById('status');
const sosBtn = document.getElementById('sos-btn');

// --- AUDIO SYSTEM ---
const synth = window.speechSynthesis;
const sosAudio = new Audio('emergency.mp3'); 
sosAudio.loop = true;

let lastSpoken = "";
let isSirenPlaying = false;
const gestureBuffer = [];
const BUFFER_SIZE = 6; 

function toggleSiren(forceState) {
    if (forceState === "off" || (isSirenPlaying && forceState !== "on")) {
        sosAudio.pause();
        sosAudio.currentTime = 0;
        isSirenPlaying = false;
        sosBtn.innerText = "🚨 SOS ALARM";
        sosBtn.classList.remove('siren-active');
        outputBox.classList.remove('emergency-mode');
    } else {
        sosAudio.play().catch(e => console.log("Audio requires user click first."));
        isSirenPlaying = true;
        sosBtn.innerText = "🛑 STOP ALARM";
        sosBtn.classList.add('siren-active');
    }
}

sosBtn.addEventListener('click', () => toggleSiren());

function speak(text) {
    if (synth.speaking || text === lastSpoken) return;
    
    lastSpoken = text;
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (text === "HELP") {
        outputBox.classList.add('emergency-mode');
        if (!isSirenPlaying) toggleSiren("on");
    } else {
        outputBox.classList.remove('emergency-mode');
        outputBox.style.color = "#00ffcc";
    }

    synth.speak(utterance);
    outputBox.innerText = text;

    setTimeout(() => { 
        lastSpoken = ""; 
        if (text !== "HELP") outputBox.style.color = "white";
    }, 2000);
}

function getDist(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function analyzeGesture(lm) {
    // Finger States (Extended vs Folded)
    const indexUp  = getDist(lm[8], lm[0])  > getDist(lm[6], lm[0]);
    const middleUp = getDist(lm[12], lm[0]) > getDist(lm[10], lm[0]);
    const ringUp   = getDist(lm[16], lm[0]) > getDist(lm[14], lm[0]);
    const pinkyUp  = getDist(lm[20], lm[0]) > getDist(lm[18], lm[0]);
    
    // 1. STOP (Show Palm - All fingers up)
    if (indexUp && middleUp && ringUp && pinkyUp) return "STOP";

    // 2. WATER (Index, Middle, Ring up TOGETHER)
    if (indexUp && middleUp && ringUp && !pinkyUp) return "WATER";

    // 3. RESTROOM (Only Pinky Up)
    if (!indexUp && !middleUp && !ringUp && pinkyUp) return "RESTROOM";

    // 4. HELP (Thumbs Down)
    // Thumb tip (4) is below thumb base (2) and other fingers are folded
    const thumbExtended = getDist(lm[4], lm[2]) > 0.1;
    const thumbDown = lm[4].y > lm[2].y;
    if (!indexUp && !middleUp && !ringUp && !pinkyUp && thumbExtended && thumbDown) {
        return "HELP";
    }

    return null;
}



function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        statusText.innerText = "System Active";
        const landmarks = results.multiHandLandmarks[0];
        
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00ffcc', lineWidth: 2});
        drawLandmarks(canvasCtx, landmarks, {color: '#ff0077', radius: 2});

        const currentGesture = analyzeGesture(landmarks);
        gestureBuffer.push(currentGesture);
        if (gestureBuffer.length > BUFFER_SIZE) gestureBuffer.shift();

        if (gestureBuffer.length === BUFFER_SIZE && gestureBuffer.every(v => v === currentGesture) && currentGesture !== null) {
            speak(currentGesture);
        }
    } else {
        statusText.innerText = "Waiting for hand...";
    }
    canvasCtx.restore();
}

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0, // Lite for speed
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 640,
    height: 480
});
camera.start();