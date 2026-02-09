# 🧪 Proofy.ai — Truth Verification & Neural Forensic Suite

Proofy is a next-generation Forensic Truth Verification Suite. It leverages advanced Neural Engines to interrogate digital media, detect deepfakes, verify textual claims, and audit code project structures.

![Forensic Analysis](https://img.shields.io/badge/Engine-Neural%20Forensics-blueviolet?style=for-the-badge)
![AI-Powered](https://img.shields.io/badge/Powered%20By-Gemini%202.5%20Flash-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Security-Technical%20Grade-green?style=for-the-badge)

---

## 🏗 High-Level Architecture

Proofy uses a **Direct-to-Cognition** architecture. By utilizing the Gemini SDK directly in the browser, Proofy bypasses traditional server-side payload limits, allowing for the analysis of high-resolution, large-scale video and audio files without compression loss.

```mermaid
graph LR
    User([User]) -->|Upload Media| App[Proofy Frontend]
    App -->|Secure SDK Call| AI[Gemini Neural Engine]
    AI -->|Temporal/Acoustic Analysis| Logic{Internal Logic}
    Logic -->|Structured JSON| Result[Forensic Dashboard]
    Result -->|Report| Certificate[ASCII Forensic Certificate]
```

---

## 📽 Neural Video Forensic Analysis

Proofy performs a **Frame-by-Frame Temporal Interrogation** of video files. Unlike simple pixel-scanning, Proofy analyzes the **motion logic** and **temporal consistency** of the media.

### **The Video Analysis Flow**
```mermaid
sequenceDiagram
    participant U as User
    participant P as Proofy Engine
    participant G as Gemini 2.5 Flash
    U->>P: Upload Video File
    P->>G: Provide Media + Forensic Prompt
    Note over G: Frame-by-Frame Scanning
    G->>G: Detect Temporal Glitches (Warping/Morphing)
    G->>G: Verify Biometric Sync (Lip vs Muscle)
    G->>G: Check Lighting Physics & Shadows
    G-->>P: Return Forensic JSON Report
    P->>U: Display Anomaly Score & Verdict
```

### **Technical Indicators**
- **Temporal Failure Detection**: Identifying "flickering" or "warping" that occurs only for split-seconds in AI motion.
- **Biometric Calibration**: Checking if lip movements align with micro-muscle activations in the face.
- **Physics Break Analysis**: Scanning for shadows or reflections that do not follow physical laws.

---

## 🎙 Acoustic Forensic Analysis

For audio media, Proofy specializes in detecting **Artificial Voice Cloning** and **Synthetic Speech (TTS)**.

### **The Audio Analysis Flow**
```mermaid
graph TD
    A[Audio Input] --> B[Acoustic Interrogation]
    B --> C{Signal Logic}
    C -->|Natural Indicator| D[Breaths, Imperfect Articulation, Room Tone]
    C -->|Synthetic Indicator| E[Phase Issues, Metallic Tint, Perfect Pitch Alignment]
    D --> F[Verdict: AUTHENTIC]
    E --> G[Verdict: SYNTHETIC/CLONED]
```

---

## 🚀 Key Features

### 🔍 Media Forensics
- **Deepfake Detection**: High-accuracy scanning for neural synthesis.
- **Manipulation Mapping**: Identifying exactly *where* and *when* a video was likely altered.

### 🗞 Truth Interrogator (Text)
- **AI Text Detection**: Forensic linguistic analysis to detect LLM-generated patterns.
- **Grounded Fact-Checking**: Verification of claims using live Google Search grounding.

### 📦 ZIP Archive Architect
- **Structural Analysis**: Deep-scan of project folders to identify technologies and potential security risks.

### 🤖 Forensic Assistant
- **Evidence Interrogation**: Use the integrated assistant to ask technical questions about analysis results or forensic concepts.

---

## 🛠 Tech Stack
- **Engine**: Gemini 2.5 Flash (Neural Pro Model)
- **Frontend**: Vite + React 19 + Framer Motion
- **Visuals**: Three.js (Neural Network Backgrounds)
- **Deployment**: Vercel (Edge-Optimized)

---

## ⚙️ Setup

To run Proofy locally, set your API key in a `.env` file:

```sh
VITE_API_KEY=your_gemini_api_key_here
```

### Installation
```bash
npm install
npm run dev
```

---

## 📄 License
Forensic Grade Security Protocol. Professional use only.
