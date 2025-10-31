/* * -----------------------------------------------------------------
 * main.js
 * -----------------------------------------------------------------
 * This is the main "controller" file.
 * It finds all HTML elements, adds click listeners,
 * and manages the 'setInterval' animation loop.
 * -----------------------------------------------------------------
 */

// Import functions from other JS files
import { setupSim, resetSim, stepForward, drawSim, getSimState } from './simulation.js';

// 1.Global Variables
let simLoop = null;     // Holds our setInterval
let isPlaying = false;  // Is the animation running?
let animSpeed = 500;    // Animation speed in milliseconds

// 2.Find All HTML Elements 
const setupBox = document.getElementById('setup-box');
const algoSelect = document.getElementById('algo-select');
const framesInput = document.getElementById('frames-input');
const pageStringInput = document.getElementById('page-string-input');
const startBtn = document.getElementById('start-btn');

const animBox = document.getElementById('anim-box');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const stepFwdBtn = document.getElementById('step-fwd-btn');
const stepBackBtn = document.getElementById('step-back-btn');
const speedSlider = document.getElementById('speed-slider');
const resetBtn = document.getElementById('reset-btn');

const screenshotBtn = document.getElementById('screenshot-btn');

const canvas = document.getElementById('sim-canvas');
const ctx = canvas.getContext('2d');
const vizTitle = document.getElementById('viz-title');
const statusBox = document.getElementById('status-box');

const statFaults = document.getElementById('stat-faults');
const statHits = document.getElementById('stat-hits');
const statHitRatio = document.getElementById('stat-hit-ratio');


// 3.Main Animation Loop

// This function runs every 'animSpeed' milliseconds
function mainLoop() {
    if (!isPlaying) return; // Do nothing if paused

    stepForward(); // Run one step of logic
    drawSim(canvas, ctx); // Redraw the canvas
    updateUI(); // Update stats and buttons

    // Stop the loop if the sim is finished
    const { isFinished } = getSimState();
    if (isFinished) {
        pauseSim();
    }
}

// 4.UI Update Functions

// Updates all stats and button states
function updateUI() {
    const { faults, hits, lastEvent, isFinished } = getSimState();
    
    // Update stats
    statFaults.textContent = faults;
    statHits.textContent = hits;
    const total = faults + hits;
    const ratio = total > 0 ? (hits / total) * 100 : 0;
    statHitRatio.textContent = `${ratio.toFixed(1)}%`;

    // Update the status box (top right)
    switch (lastEvent.type) {
        case 'START':
            statusBox.textContent = 'Simulation started.';
            statusBox.className = 'status-box status-idle';
            break;
        case 'HIT':
            statusBox.textContent = `Page ${lastEvent.page} HIT`;
            statusBox.className = 'status-box status-hit';
            break;
        case 'FAULT':
            statusBox.textContent = `Page ${lastEvent.page} FAULT ${lastEvent.replaced ? `(Replaced ${lastEvent.replaced})` : ''}`;
            statusBox.className = 'status-box status-fault';
            break;
        case 'DONE':
            statusBox.textContent = 'Simulation Complete!';
            statusBox.className = 'status-box status-done';
            break;
    }

    // Enable/disable buttons
    playBtn.disabled = isPlaying || isFinished;
    pauseBtn.disabled = !isPlaying || isFinished;
    stepFwdBtn.disabled = isPlaying || isFinished;
    stepBackBtn.disabled = true; // Always disabled
}

// 5.Button Click Handlers

// Called when "Start Sim" is clicked
function startSim() {
    // Get values from form
    const algo = algoSelect.value;
    const frames = parseInt(framesInput.value);
    const pageString = pageStringInput.value;

    // Check inputs
    if (isNaN(frames) || frames < 1 || frames > 8) {
        alert("Please enter a valid number of frames (1-8).");
        return;
    }
    if (pageString.trim().length === 0) {
        alert("Please enter a page string.");
        return;
    }

    // Tell simulation.js to set up
    setupSim(algo, frames, pageString);
    
    // Draw the starting state
    resizeCanvas();
    updateUI();
    vizTitle.textContent = `Visualization (${algo.toUpperCase()})`;

    // Swap the control panels
    setupBox.classList.add('hidden');
    animBox.classList.remove('hidden');

    // Start paused
    pauseSim();
}

// Called when "Reset" is clicked
function doReset() {
    pauseSim(); // Stop the loop
    resetSim(); // Clear the logic
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Swap the control panels back
    animBox.classList.add('hidden');
    setupBox.classList.remove('hidden');
    
    // Reset UI text
    updateUI();
    vizTitle.textContent = 'Visualization';
    statusBox.textContent = 'Waiting to start...';
    statusBox.className = 'status-box status-idle';
}

// Called when "Play" is clicked
function playSim() {
    isPlaying = true;
    if (simLoop) clearInterval(simLoop); // Clear old loop
    simLoop = setInterval(mainLoop, animSpeed); // Start new loop
    updateUI();
}

// Called when "Pause" is clicked
function pauseSim() {
    isPlaying = false;
    if (simLoop) clearInterval(simLoop); // Stop the loop
    simLoop = null;
    updateUI();
}

// Called when "Step Forward" is clicked
function stepSim() {
    if (isPlaying) return; // Don't step if playing
    stepForward();
    drawSim(canvas, ctx);
    updateUI();
}

// Called when slider is moved
function changeSpeed() {
    // Slider is 1 (slow) to 10 (fast)
    // Convert to milliseconds (1000ms to 100ms)
    const speedValue = parseInt(speedSlider.value);
    animSpeed = 1100 - (speedValue * 100);
    
    // Restart loop with new speed if playing
    if (isPlaying) {
        playSim();
    }
}

// Called when "Export Screenshot" is clicked
function saveScreenshot() {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'os-visualizer.png';
    link.href = dataURL;
    link.click();
}

// Makes canvas sharp and redraws on window resize
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = 500; // Fixed height
    drawSim(canvas, ctx); // Redraw
}


// 6.Attach Event Listeners
window.addEventListener('resize', resizeCanvas);
startBtn.addEventListener('click', startSim);
resetBtn.addEventListener('click', doReset);
playBtn.addEventListener('click', playSim);
pauseBtn.addEventListener('click', pauseSim);
stepFwdBtn.addEventListener('click', stepSim);
speedSlider.addEventListener('input', changeSpeed);
screenshotBtn.addEventListener('click', saveScreenshot);

// 7.Initial Setup
resizeCanvas(); // Draw canvas on load

