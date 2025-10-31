/* * -----------------------------------------------------------------
 * simulation.js
 * -----------------------------------------------------------------
 * This file holds the simulation "state" (variables).
 * It imports and calls the algorithms.
 * It also has the main drawing function.
 * -----------------------------------------------------------------
 */

// Import the algorithm functions
import { runFifo, runLru, runOptimal } from './algorithms.js';

// 1.Simulation State Variables
// These are the "global" state for the simulation
let frames = [];
let pageList = [];
let pageIndex = 0;
let faults = 0;
let hits = 0;
let isFinished = false;
let lastEvent = { type: 'IDLE' };

// Algorithm-specific state
let currentAlgo = 'fifo';
let fifoPointer = 0;
let lruQueue = [];


// 2.Core Simulation Functions

// Sets up the simulation state. Called by main.js
export function setupSim(algo, numFrames, pageString) {
    // Parse the page string into a list of numbers
    pageList = pageString.split(',')
                         .map(s => s.trim())
                         .filter(s => s.length > 0)
                         .map(s => parseInt(s));
    
    // Reset all state variables
    currentAlgo = algo;
    frames = new Array(numFrames).fill(null);
    pageIndex = 0;
    faults = 0;
    hits = 0;
    isFinished = false;
    lastEvent = { type: 'START' };
    
    // Reset algo-specific state
    fifoPointer = 0;
    lruQueue = [];
}

// Resets the simulation
export function resetSim() {
    frames = [];
    pageList = [];
    pageIndex = 0;
    faults = 0;
    hits = 0;
    isFinished = true; // Set to true to stop loop
    lastEvent = { type: 'IDLE' };
}

// Runs one step of the simulation
export function stepForward() {
    if (isFinished || pageIndex >= pageList.length) {
        isFinished = true;
        lastEvent = { type: 'DONE' };
        return;
    }

    // 1.Get the current page
    const currentPage = pageList[pageIndex];

    // 2.Run the correct algorithm
    let result;
    if (currentAlgo === 'fifo') {
        result = runFifo(frames, fifoPointer, currentPage);
        fifoPointer = result.fifoPointer; // Update pointer
        
    } else if (currentAlgo === 'lru') {
        result = runLru(frames, lruQueue, currentPage);
        lruQueue = result.lruQueue; // Update queue
        
    } else if (currentAlgo === 'optimal') {
        const futurePages = pageList.slice(pageIndex + 1);
        result = runOptimal(frames, currentPage, futurePages);
    }

    // 3.Update state with the result
    frames = result.newFrames;
    lastEvent = result.event;

    if (lastEvent.type === 'HIT') {
        hits++;
    } else if (lastEvent.type === 'FAULT') {
        faults++;
    }
    
    // 4.Move to the next page
    pageIndex++;
    
    // 5.Check if we're done
    if (pageIndex >= pageList.length) {
        isFinished = true;
        lastEvent = { type: 'DONE' };
    }
}

// Lets main.js get the current state for the UI
export function getSimState() {
    return {
        faults,
        hits,
        lastEvent,
        isFinished
    };
}


// 3.Canvas Drawing Function

// Draws the entire simulation state onto the canvas
export function drawSim(canvas, ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up drawing styles
    ctx.font = "bold 16px Inter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 1.Draw Memory Frames
    const frameBoxWidth = 80;
    const frameBoxHeight = 50;
    const frameStartX = (canvas.width / 2) - (frameBoxWidth / 2);
    const frameStartY = 60;
    const frameSpacing = 20;

    ctx.font = "14px Inter";
    ctx.textAlign = "right";
    ctx.fillStyle = "#475569";
    ctx.fillText("Memory Frames:", frameStartX - 10, frameStartY - 20);

    for (let i = 0; i < frames.length; i++) {
        const x = frameStartX;
        const y = frameStartY + i * (frameBoxHeight + frameSpacing);
        const page = frames[i];
        
        // Highlight hit/fault
        if (lastEvent.type === 'HIT' && page === lastEvent.page) {
            ctx.fillStyle = "#dcfce7"; // green
            ctx.strokeStyle = "#22c55e";
        } else if (lastEvent.type === 'FAULT' && i === lastEvent.frameIndex) {
            ctx.fillStyle = "#fee2e2"; // red
            ctx.strokeStyle = "#ef4444";
        } else {
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#94a3b8";
        }
        
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, frameBoxWidth, frameBoxHeight);
        ctx.strokeRect(x, y, frameBoxWidth, frameBoxHeight);
        
        // Draw page number
        if (page !== null) {
            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 20px Inter";
            ctx.textAlign = "center";
            ctx.fillText(page, x + frameBoxWidth / 2, y + frameBoxHeight / 2);
        }

        // Draw frame label
        ctx.fillStyle = "#475569";
        ctx.font = "14px Inter";
        ctx.textAlign = "right";
        ctx.fillText(`Frame ${i}:`, x - 10, y + frameBoxHeight / 2);
        
        // Draw FIFO pointer
        if (currentAlgo === 'fifo' && i === fifoPointer && !isFinished) {
            ctx.fillStyle = "#0284c7";
            ctx.textAlign = "left";
            ctx.fillText("➔ Next", x + frameBoxWidth + 10, y + frameBoxHeight / 2);
        }
        // Draw LRU tags
        if (currentAlgo === 'lru' && page !== null) {
            ctx.fillStyle = "#64748b";
            ctx.font = "12px Inter";
            ctx.textAlign = "left";
            if(lruQueue.indexOf(page) === 0) {
                 ctx.fillText("(LRU)", x + frameBoxWidth + 10, y + frameBoxHeight / 2);
            }
            if(lruQueue.indexOf(page) === lruQueue.length - 1) {
                 ctx.fillText("(MRU)", x + frameBoxWidth + 10, y + frameBoxHeight / 2);
            }
        }
    }

    // 2.Draw Page String
    const pageBoxSize = 40;
    const pageSpacing = 10;
    const pageStringTotalWidth = pageList.length * (pageBoxSize + pageSpacing) - pageSpacing;
    let pageStringStartX = (canvas.width - pageStringTotalWidth) / 2;
    if (pageStringStartX < 20) pageStringStartX = 20;
    
    const pageStringY = canvas.height - 80;

    ctx.font = "14px Inter";
    ctx.textAlign = "left";
    ctx.fillStyle = "#475569";
    ctx.fillText("Page String:", pageStringStartX, pageStringY - 20);
    
    for (let i = 0; i < pageList.length; i++) {
        const x = pageStringStartX + i * (pageBoxSize + pageSpacing);
        const y = pageStringY;
        
        // Style box based on position
        if (i < pageIndex) { // Processed
            ctx.fillStyle = "#f1f5f9";
            ctx.strokeStyle = "#e2e8f0";
        } else if (i === pageIndex) { // Current
            ctx.fillStyle = "#dbeafe";
            ctx.strokeStyle = "#3b82f6";
        } else { // Future
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#cbd5e1";
        }
        
        ctx.lineWidth = (i === pageIndex) ? 2 : 1;
        ctx.fillRect(x, y, pageBoxSize, pageBoxSize);
        ctx.strokeRect(x, y, pageBoxSize, pageBoxSize);
        
        // Text color
        if (i < pageIndex) {
            ctx.fillStyle = "#94a3b8";
        } else {
            ctx.fillStyle = "#1e293b";
        }
        ctx.font = "bold 16px Inter";
        ctx.textAlign = "center";
        ctx.fillText(pageList[i], x + pageBoxSize / 2, y + pageBoxSize / 2);
    }
    
    // Draw "Current Page" arrow
    if (!isFinished && pageList.length > 0 && pageIndex < pageList.length) {
        const currentBoxX = pageStringStartX + pageIndex * (pageBoxSize + pageSpacing);
        const arrowX = currentBoxX + pageBoxSize / 2;
        const arrowY = pageStringY - 10;
        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - 6, arrowY - 10);
        ctx.lineTo(arrowX + 6, arrowY - 10);
        ctx.closePath();
        ctx.fill();
    }
}

