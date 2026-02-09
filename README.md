# 🧪 Proofy.ai — Professional Media Verification

Proofy is a simple but powerful tool for checking if videos, images, audio, and text are real or made by AI. It is built for professional use and deep inspection.

![Status](https://img.shields.io/badge/Status-Professional%20Grade-blue?style=for-the-badge)
![AI-Powered](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-blueviolet?style=for-the-badge)

---

## 🏗 How it Works

Proofy works by talking directly to advanced AI to check your files quickly and accurately.

```mermaid
graph LR
    User([User]) -->|Upload Media| App[Proofy Frontend]
    App -->|Secure SDK Call| AI[Gemini Neural Engine]
    AI -->|Deep Analysis| Logic{Checking...}
    Logic -->|Structured Report| Result[Forensic Dashboard]
    Result -->|Report| Certificate[Technical Certificate]
```

---

## 🚀 Main Features

Proofy is designed with these core capabilities:

-   **Full Media Uploads**: Check any video, image, audio clip, or block of text.
-   **Deep Video Analysis**: Watches videos frame-by-frame and flags exactly when a problem happens with **timestamp-level marking** (e.g., "Melted face at 0:15").
-   **Advanced Detection**: Finds specific problems like:
    -   **Lighting Errors**: Shadows that don't make sense.
    -   **Facial Warping**: Faces that "melt" or change shape unnaturally.
    -   **Motion Anomalies**: Objects that move in impossible ways.
    -   **AI Artifacts**: Strange "glitches" left behind by AI generators.
-   **Saved Results**: Every check is saved with a **confidence score** so you can review it later.

---

## 📽 Video Checking Flow

```mermaid
sequenceDiagram
    participant U as User
    participant P as Proofy Engine
    participant G as Gemini 2.5 Flash
    U->>P: Upload Video File
    P->>G: Start Frame-by-Frame Check
    Note over G: AI Scanning for Errors
    G->>G: Find Lighting & Mesh Warps
    G->>G: Check Motion & Timestamps
    G-->>P: Return Analysis JSON
    P->>U: Show Flagged Moments & Scores
```

---

## 🎙 Audio & Sound Checking

```mermaid
graph TD
    A[Audio Input] --> B[Acoustic Check]
    B --> C{AI Brain}
    C -->|Natural Signs| D[Natural Breaths & Real Voice]
    C -->|Fake Signs| E[Robot Tones & Metallic Echoes]
    D --> F[Verdict: REAL]
    E --> G[Verdict: AI CLONE]
```

---

## 🛠 How to Use It

### **Setting it up**
Add your API key to a file called `.env`:
```sh
VITE_API_KEY=your_key_here
```

### **Installation**
1.  Run `npm install`
2.  Run `npm run dev`
3.  Open the website in your browser!

---

## 📄 License
Professional Verification Protocol.
