# ⚙️ OS Visualizer - Execution Guide

This document explains how to **set up, run, and use** the **OS Page Replacement Visualizer** project.

---

## 🏃‍♂️ 1. How to Run (Setup Instructions)

This project uses **modern JavaScript modules** (`import/export`) for better code organization.  
Because of browser security restrictions, you **cannot** run it by simply double-clicking `index.html`.

You must use a **local server** — the easiest way is via the **Live Server** extension in Visual Studio Code.

### 🧩 Steps

1. **Create a Folder**
   - Make a new folder, for example:  
     `My_OS_Project`

2. **Save All Files**
   - Place the following 7 files inside the folder:
     ```
     index.html
     style.css
     main.js
     simulation.js
     algorithms.js
     README.md
     EXECUTION_GUIDE.md
     ```

3. **Open VS Code**
   - Launch **Visual Studio Code**.

4. **Open the Folder**
   - Go to `File > Open Folder...`
   - Choose your `My_OS_Project` folder.

5. **Install “Live Server”**
   - Click the **Extensions** icon (🧩 four squares) on the left sidebar.
   - Search for **Live Server** by *Ritwick Dey*.
   - Click **Install**.

6. **Run the Project**
   - In the Explorer panel, right-click `index.html`.
   - Select **“Open with Live Server”**.
   - Your default browser will open, and the visualizer will start working correctly.

---

## 🧭 2. User Interface Guide

### 🪟 Left Panel — Setup

| Option | Description |
|--------|--------------|
| **Algorithm** | Choose the algorithm: *FIFO*, *LRU*, or *Optimal*. |
| **Number of Frames** | Set how many memory frames (slots) to use. |
| **Page String** | Enter the reference string (comma-separated). |
| **Start Sim** | Begins the simulation. |

---

### 🎮 Controls (Left Panel)

| Control | Function |
|----------|-----------|
| **Play / Pause** | Starts or stops the animation. |
| **Step Forward** | Runs one step of the algorithm manually. |
| **Step Back** | Moves one step backward to review previous states. |
| **Animation Speed** | Adjusts the speed of the animation with a slider. |
| **Reset** | Stops and clears the current simulation. |

---

### 📤 Export (Left Panel)

| Option | Function |
|---------|-----------|
| **Export Screenshot** | Saves the current canvas as a **PNG** image. |

---

## 🎨 3. Animation Features (Color Coding)

| Color / Element | Meaning |
|------------------|----------|
| 🟩 **Green Highlight** | **Page Hit** — page already present in frame. |
| 🟥 **Red Highlight** | **Page Fault** — page not found, frame replaced. |
| 🟦 **Blue Box** (on Page String) | The **current page** being processed. |
| 🔵 **Blue Arrow** (on Frames) | In **FIFO**, shows the next frame to be replaced. |

---

## 🌐 4. Browser Requirements

This visualizer runs on **any modern browser** that supports ES6 modules and Canvas.

✅ Supported browsers:
- **Google Chrome**
- **Mozilla Firefox**
- **Microsoft Edge**
- **Apple Safari**

---
