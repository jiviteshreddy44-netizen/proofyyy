# 🧪 Proofy.ai — Easy Deepfake & AI Checker

Proofy is a simple tool to help you find out if a video, audio clip, or text was made by AI. It helps you check if something is real or fake in just a few seconds.

![Easy Check](https://img.shields.io/badge/Check-Quick%20%26%20Simple-brightgreen?style=for-the-badge)
![AI-Powered](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-blue?style=for-the-badge)
![Fast](https://img.shields.io/badge/Speed-Fast%20Processing-orange?style=for-the-badge)

---

## 👋 What does Proofy do?

Proofy helps you spot things that aren't real. Whether it's a fake video of someone talking, a robot voice, or a news story that sounds suspicious, Proofy checks it for you.

### **How it works (The simple version)**
1.  **Upload**: Put your video, audio, or text into the app.
2.  **AI Scan**: Our AI looks at every detail very closely.
3.  **Result**: You get a score telling you how likely it is to be a fake.

---

## 📽 Checking Videos (Deepfakes)

When you upload a video, our AI doesn't just look at the picture—it watches how things move.

-   **Faces & Lips**: It checks if the lips match the words perfectly. AI often gets this slightly wrong.
-   **Warping**: It looks for weird "glitches" or "melting" effects that happen in AI videos.
-   **Lighting**: It checks if shadows and light look natural.
-   **Timestamps**: If something is fake, Proofy tells you exactly *when* in the video it saw the problem (e.g., "AI detected at 0:12").

---

## 🎙 Checking Audio & Voices

Spotting fake "clone" voices is easy for Proofy.

-   **Robot Sounds**: It listens for "metallic" or robotic tones that humans don't have.
-   **Breathing**: It checks for natural breathing and pauses. Fakes often forget to "breathe."
-   **Voice Pacing**: It listens to the rhythm of the speech to see if it sounds like a real person.

---

## 🗞 Checking Text & Facts

Not sure if a story is true or if a bot wrote it? Proofy can help.

-   **AI Writer Detection**: It finds patterns that robots use when they write.
-   **Fact-Checking**: The AI goes online to search and see if claims are supported by real news sources.
-   **Sources**: It gives you links to real websites so you can double-check the facts yourself.

---

## 🚀 Main Features

-   **Big Files**: You can upload long videos and large files without any issues.
-   **Easy Reports**: Get a clear "Real" or "Fake" answer with a simple score (0-100%).
-   **Project Scanner**: You can even upload a ZIP folder of a software project to see what tech it uses.

---

## 🛠 How to Use It

### **Setting it up**
If you want to run this yourself, just add your API key to a file called `.env`:
```sh
VITE_API_KEY=your_key_here
```

### **Installation**
1.  Run `npm install`
2.  Run `npm run dev`
3.  Open the website in your browser!

---

## 📄 Final Note
Proofy is a great helper, but always use your own common sense too. AI is smart, but human eyes are pretty good at spotting fakes too!
