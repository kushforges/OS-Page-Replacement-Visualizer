# 🧠 OS Page Replacement Visualizer

A **web-based visualization tool** for understanding **Operating System Page Replacement Algorithms**.  
It allows users to input a page reference string and frame count, then watch animated simulations of **FIFO**, **LRU**, and **Optimal** algorithms in action.

---

## 🚀 Features

- **🧩 Modular Code Structure**  
  Project split into **5 separate files** for UI, simulation, and algorithm logic — clean, reusable, and easy to test.

- **🔢 Three Algorithms Implemented**  
  - **FIFO (First In First Out)**  
  - **LRU (Least Recently Used)**  
  - **Optimal Page Replacement**

- **🎞️ Simple Animation**  
  Uses `setInterval()` and **HTML5 Canvas** to visually animate page frame changes step-by-step.

- **⏯️ Animation Controls**  
  - **Play / Pause**  
  - **Step Forward** (manual control)

- **⚡ Adjustable Speed**  
  A **slider** lets you change the animation speed in real time.

- **📊 Real-Time Stats**  
  Displays live counts of **Page Faults** and **Page Hits** during simulation.

- **📸 Export Option**  
  Save the current canvas view as a **PNG screenshot** with one click.

---

## 🧰 Technology Stack

| Technology | Purpose |
|-------------|----------|
| **HTML5** | Page structure and layout |
| **CSS3** | Styling and layout customization |
| **JavaScript (ES6+)** | Logic, simulation, and modular design |
| **HTML5 Canvas** | Dynamic animation and visual rendering |

---

## 📂 Project Structure

/os-page-visualizer
│
├── index.html # Main entry point (UI layout)
├── style.css # Custom styles
├── main.js # Initialization and control logic
├── algorithms.js # FIFO, LRU, and Optimal algorithm implementations
├── simulation.js # Simulation and animation engine
└── ui.js # UI rendering and user interactions
