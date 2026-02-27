# 🌉 SignBridge

**Breaking down communication barriers in real-time.** SignBridge is a lightweight, full-stack web application that translates sign language gestures into audible speech instantly using a standard webcam. No expensive hardware or massive datasets required.

## 🚀 The Problem & Solution
People who use sign language face severe communication barriers in emergency or daily-use situations with individuals who don't understand it. 

**SignBridge** solves this by utilizing edge-computed Machine Learning (MediaPipe) in the browser for zero-latency hand tracking, coupled with a Node.js backend to manage custom gesture dictionaries.

## 🛠 Tech Stack
* **Frontend:** HTML, CSS, JavaScript, Web Speech API
* **Machine Learning:** Google MediaPipe (Hands)
* **Backend:** Node.js, Express.js

## 🧠 How it Works
1.  **Edge-AI Processing:** Video feeds are never sent to a server. Hand landmark detection happens directly in the browser via WebAssembly, ensuring 100% privacy and sub-50ms latency.
2.  **Heuristic Classification:** Instead of relying on heavy image-classification neural networks, SignBridge maps the 3D spatial geometry of 21 hand landmarks to dynamically calculate finger states (extended vs. folded).
3.  **Thin-Server Architecture:** The Node.js backend acts purely as an API layer to store translation history and allow users to save personalized gesture configurations to a dictionary.

## 💻 Running it Locally

1. **Clone & Install**
   ```bash
   git clone <your-repo-link>
   cd sign-bridge
   npm install