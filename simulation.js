/* * -----------------------------------------------------------------
 * simulation.js
 * -----------------------------------------------------------------
 * This file holds the simulation "state" (variables).
 * It imports and calls the algorithms.
 * It also has the main drawing function.
 * -----------------------------------------------------------------
 */

// Import the algorithm functions
import { fifoStep,lruStep,optimalStep } from './algorithms.js';

// Main controller class for the simulation
export class SimulationController{
    
    /**
     * @param {HTMLCanvasElement} canvas - The canvas element to draw on.
     * @param {string} algo - The selected algorithm ('fifo', 'lru', 'optimal').
     * @param {number} numFr - The number of physical memory frames.
     * @param {number[]} pgStr - The array of page requests.
     */
    constructor(canvas,algo,numFr,pgStr) {
        this.canvas=canvas;
        this.ctx=canvas.getContext('2d');
        this.algorithm=algo;
        this.numFrames=numFr;
        this.pageString=pgStr;
        
        this.stateHistory=[]; // Stores snapshots for step-back
        this.currentState=null;
        this.isFinished=false;

        this.initState();
        this.recordState(); // Save the initial state
        
        // Add a resize listener
        this.resizeObs=new ResizeObserver(() => this.resizeCanvas());
        this.resizeObs.observe(this.canvas.parentElement);
        this.resizeCanvas(); // Initial resize
    }
    
    // Cleans up listeners when the simulation is reset
    destroy(){
        this.resizeObs.disconnect();
    }

    // Resizes the canvas to fit its container and recalculates coordinates
    resizeCanvas(){
        const container=this.canvas.parentElement;
        if (!container) return;
        
        // Set internal canvas resolution
        this.canvas.width=container.clientWidth;
        this.canvas.height=500; 
        
        // Recalculate coordinates based on new size
        this.calculateCoordinates();
        // Redraw immediately
        this.draw(); 
    }


    // Sets up the initial state of the simulation
    initState(){
        this.currentState={
            // Core Logic State
            frames: new Array(this.numFrames).fill(null), // Physical memory
            pageIndex:0,           // Current position in pageString
            stats:{
                pageFaults:0,
                pageHits:0
            },
            
            // Algorithm-specific state
            // For FIFO:
            fifoPointer:0,
            // For LRU:
            lruQueue:[], // Stores pages in order of use (most recent at end)

            // UI / Animation State
            lastEvent:{
                type:'START', // 'START', 'HIT', 'FAULT', 'DONE'
                page:null,
                replaced:null
            },
            
            // Drawing coordinates (calculated once)
            coords:{} // Will be populated by calculateCoordinates
        };
        this.isFinished=false;
        this.stateHistory=[];
    }
    
    /**
     * Calculates and stores all coordinates for drawing.
     * This improves performance by not recalculating on every frame.
     */
    calculateCoordinates(){
        const coords={
            frames:[],
            pageString:[],
            pageStringLabel:{x:0,y:0},
            framesLabel:{x:0,y:0},
            pointer:{}
        };

        const canvasWidth=this.canvas.width;
        const canvasHeight=this.canvas.height;
        
        const topMargin=60;
        const bottomMargin=120;
        
        // Page String Coordinates
        const pgBoxSz=40;
        const pgBoxPd=10;
        const pgStrTotalWd=this.pageString.length*(pgBoxSz+pgBoxPd)-pgBoxPd;
        let pageStringStartX=(canvasWidth-pgStrTotalWd)/2;

        if (pageStringStartX<30) pageStringStartX=30;
    
        const pageStringY=canvasHeight-bottomMargin+40;
        coords.pageStringLabel={x:Math.max(30,pageStringStartX),y:pageStringY-20};
        
        for (let i=0;i<this.pageString.length;i++){
            coords.pageString.push({
                x:pageStringStartX+i*(pgBoxSz+pgBoxPd),
                y:pageStringY,
                w:pgBoxSz,
                h:pgBoxSz
            });
        }

        // Memory Frames Coordinates
        const frameWidth=100;
        const frameHeight=60;
        const framePadding=20;
        const frameStartX=(canvasWidth/2)-50; 
        const frameStartY=topMargin+40;
        coords.framesLabel={x:frameStartX-framePadding,y:frameStartY-20};
        
        for (let i=0;i<this.numFrames;i++){
            coords.frames.push({
                x:frameStartX,
                y:frameStartY+i*(frameHeight+framePadding),
                w:frameWidth,
                h:frameHeight,
                labelX:frameStartX-framePadding,
                labelY:frameStartY+i*(frameHeight+framePadding)+(frameHeight/2)
            });
        }
        
        // Pointer coordinates
        coords.pointer.x=frameStartX+frameWidth+framePadding;
        
        // Store coordinates in the state
        if (this.currentState){
            this.currentState.coords=coords;
        }
        return coords;
    }

    // Saves a deep copy of the current state for history
    recordState(){
        // Simple deep copy using JSON
        const stateCopy=JSON.parse(JSON.stringify(this.currentState));
        // We don't need to copy coords every time
        stateCopy.coords=this.currentState.coords; 
        this.stateHistory.push(stateCopy);
    }

    // The main logic tick. Calls the correct algorithm step
    stepForward(){
        if (this.isFinished) return;

        // Check if simulation is done
        if (this.currentState.pageIndex>=this.pageString.length) {
            this.isFinished=true;
            this.currentState.lastEvent={type:'DONE',page:null,replaced:null};
            this.recordState();
            return;
        }

        // Get the current page
        const currentPage=this.pageString[this.currentState.pageIndex];
        
        // Create a deep copy of the state to pass to the pure function
        const stateToProcess=JSON.parse(JSON.stringify(this.currentState));
        
        // Call the appropriate algorithm function
        let result;
        switch (this.algorithm){
            case 'fifo':
                result=fifoStep(stateToProcess,currentPage);
                break;
            case 'lru':
                result=lruStep(stateToProcess,currentPage);
                break;
            case 'optimal':
                // Optimal needs to look ahead in the page string
                const futureString=this.pageString.slice(this.currentState.pageIndex+1);
                result=optimalStep(stateToProcess,currentPage,futureString);
                break;
        }

        // Update the state with the result from the algorithm
        // We must re-assign coords as they are not part of the deep copy
        result.coords=this.currentState.coords;
        this.currentState=result;
        
        // Move to the next page
        this.currentState.pageIndex++;
        
        // Save this new state
        this.recordState();
    }

    // Reverts to the previous state in history
    stepBackward(){
        if (this.stateHistory.length>1) {
            this.stateHistory.pop(); // Remove current state
            const prevState=this.stateHistory[this.stateHistory.length-1];
            // Create a deep copy to avoid mutation issues
            this.currentState=JSON.parse(JSON.stringify(prevState));
            this.currentState.coords=prevState.coords; 
            this.isFinished=false;
        }
    }

    // The main drawing function
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const state = this.currentState;
        if (!state || !state.coords || !state.coords.framesLabel) {
            return;
        }
        
        const coords = state.coords;
        const lastEvent = state.lastEvent;

        // 1.Draw Page Reference String 
        this.ctx.font = "14px Inter";
        this.ctx.fillStyle = "#475569";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "bottom";
        this.ctx.fillText("Page Reference String:", coords.pageStringLabel.x, coords.pageStringLabel.y);
        
        this.ctx.font = "bold 16px Inter";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        for (let i = 0; i < this.pageString.length; i++) {
            const c = coords.pageString[i];
            // If coords are off-canvas (e.g., during resize), skip drawing
            if (!c) continue; 
            
            if (i < state.pageIndex -1) { // Already processed
                this.ctx.fillStyle = "#f1f5f9";
                this.ctx.strokeStyle = "#e2e8f0";
            } else if (i === state.pageIndex - 1) { // Just processed
                if(lastEvent.type === 'HIT') this.ctx.fillStyle = "#dcfce7";
                else if(lastEvent.type === 'FAULT') this.ctx.fillStyle = "#fee2e2";
                else this.ctx.fillStyle = "#f1f5f9";
                this.ctx.strokeStyle = "#94a3b8";
            } else if (i === state.pageIndex) { // Current page
                this.ctx.fillStyle = "#dbeafe";
                this.ctx.strokeStyle = "#3b82f6";
            } else { // Future pages
                this.ctx.fillStyle = "#ffffff";
                this.ctx.strokeStyle = "#cbd5e1";
            }
            
            this.ctx.lineWidth = (i === state.pageIndex) ? 2 : 1;
            this.ctx.beginPath();
            this.ctx.rect(c.x, c.y, c.w, c.h);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Text color
            if (i < state.pageIndex) this.ctx.fillStyle = "#94a3b8";
            else this.ctx.fillStyle = "#1e293b";
            this.ctx.fillText(this.pageString[i], c.x + c.w / 2, c.y + c.h / 2);
        }
        
        // Draw "Current Page" arrow
        if (!this.isFinished && coords.pageString[state.pageIndex]) {
            const currentBox = coords.pageString[state.pageIndex];
            const arrowX = currentBox.x + currentBox.w / 2;
            const arrowY = currentBox.y - 10;
            this.ctx.fillStyle = "#3b82f6";
            this.ctx.beginPath();
            this.ctx.moveTo(arrowX, arrowY);
            this.ctx.lineTo(arrowX - 6, arrowY - 10);
            this.ctx.lineTo(arrowX + 6, arrowY - 10);
            this.ctx.closePath();
            this.ctx.fill();
        }

        // 2.Draw Memory Frames
        this.ctx.font = "14px Inter";
        this.ctx.fillStyle = "#475569";
        this.ctx.textAlign = "right";
        this.ctx.textBaseline = "bottom";
        this.ctx.fillText("Memory Frames:", coords.framesLabel.x, coords.framesLabel.y);
        
        this.ctx.font = "bold 20px Inter";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        for (let i = 0; i < this.numFrames; i++) {
            const c = coords.frames[i];
            if (!c) continue; // Skip if coords not ready
            
            const page = state.frames[i];
            
            // Determine style based on last event
            if (lastEvent.type === 'HIT' && page === lastEvent.page) {
                // Highlight HIT
                this.ctx.fillStyle = "#dcfce7";
                this.ctx.strokeStyle = "#22c55e";
            } else if (lastEvent.type === 'FAULT' && i === lastEvent.replacedFrameIndex) {
                 // Highlight FAULT (new page)
                 this.ctx.fillStyle = "#fee2e2";
                 this.ctx.strokeStyle = "#ef4444";
            } else {
                // Default
                this.ctx.fillStyle = "#ffffff";
                this.ctx.strokeStyle = "#94a3b8";
            }
            
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.rect(c.x, c.y, c.w, c.h);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw page number
            if (page !== null) {
                this.ctx.fillStyle = "#1e293b";
                this.ctx.fillText(page, c.x + c.w / 2, c.y + c.h / 2);
            } else {
                this.ctx.fillStyle = "#cbd5e1";
                this.ctx.fillText("-", c.x + c.w / 2, c.y + c.h / 2);
            }
            
            // Draw Frame Label
            this.ctx.font = "14px Inter";
            this.ctx.fillStyle = "#475569";
            this.ctx.textAlign = "right";
            this.ctx.fillText(`Frame ${i}:`, c.labelX, c.labelY);
        }
        
        // 3.Draw Algorithm-Specific Pointers
        this.ctx.font = "bold 14px Inter";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "middle";
        
        if (this.algorithm === 'fifo' && !this.isFinished) {
            const c = coords.frames[state.fifoPointer];
            if (c) { // Check if coords are ready
                const pointerY = c.labelY;
                this.ctx.fillStyle = "#0284c7";
                this.ctx.fillText("Next ➔", coords.pointer.x, pointerY);
            }
        }
        
        if (this.algorithm === 'lru') {
            this.ctx.font = "12px Inter";
            this.ctx.fillStyle = "#64748b";
            for (let i = 0; i < this.numFrames; i++) {
                const c = coords.frames[i];
                if (!c) continue; // Check if coords are ready
                
                const page = state.frames[i];
                if (page !== null) {
                    const lruIndex = state.lruQueue.indexOf(page);
                    let lruText = '';
                    if (lruIndex === 0) lruText = "(LRU)";
                    if (lruIndex === state.lruQueue.length - 1) lruText = "(MRU)";
                    this.ctx.fillText(lruText, coords.pointer.x, c.labelY);
                }
            }
        }
    }
}

