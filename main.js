/* * -----------------------------------------------------------------
 * main.js
 * -----------------------------------------------------------------
 * This is the main "controller" file.
 * It finds all HTML elements, adds click listeners,
 * and manages the 'setInterval' animation loop.
 * -----------------------------------------------------------------
 */

// Import the main simulation class
import {SimulationController} from './simulation.js';

// Wait for the DOM to be fully loaded before running
document.addEventListener('DOMContentLoaded',() => {

    // 1.Global State
    let sim=null;             // The simulation controller instance
    let anmFrId=null; // ID for requestAnimationFrame
    let isPlaying=false;      // Is the animation running?
    let lastStepTime=0;       // For controlling animation speed
    let anmSpd=2;     // Steps per second

    // 2.DOM Element References
    
    // Setup Panel
    const setupPanel=document.getElementById('setup-section');
    const algoSelect=document.getElementById('algorithm-select');
    const numFrIp=document.getElementById('num-frames');
    const pgStrIp=document.getElementById('page-string');
    const startBtn=document.getElementById('btn-start');

    // Controls Panel
    const anmSec=document.getElementById('animation-section');
    const playBtn=document.getElementById('btn-play');
    const pauseBtn=document.getElementById('btn-pause');
    const prevBtn=document.getElementById('btn-step-back');
    const nextBtn=document.getElementById('btn-step-forward');
    const spdControl=document.getElementById('speed-slider');
    const resetBtn=document.getElementById('btn-reset');

    // Export
    const ssBtn=document.getElementById('btn-screenshot');

    // Visualization Panel
    const canvas=document.getElementById('simulation-canvas');
    const eventStatus=document.getElementById('event-status-box');
    const vizTitle=document.getElementById('viz-title');

    // Stats Panel
    const statFaults=document.getElementById('stat-faults');
    const statHits=document.getElementById('stat-hits');
    const statSteps=document.getElementById('stat-steps');
    const statHitRatio=document.getElementById('stat-hit-ratio');


    // 3.Core Functions

    /**
     * The main animation loop.
     * @param {number} timestamp - The current time from requestAnimationFrame
     */
    function anmLoop(timestamp){
        if(isPlaying){
            const delay=1000/anmSpd;
            const elapsed=timestamp-lastStepTime;
            if (elapsed>delay) {
                lastStepTime=timestamp-(elapsed%delay);
                if(sim.isFinished){
                    setPlaying(false);
                } else {
                    sim.stepForward();
                }
            }
        }
        
        // Always draw the current state
        if(sim){
            sim.draw();
            updateUI();
        }
        anmFrId=requestAnimationFrame(anmLoop);
    }

    /**
     * Updates all UI elements based on the simulation state.
     */
    function updateUI(){
        if(!sim){
            // Reset to default
            statFaults.textContent='0';
            statHits.textContent='0';
            statSteps.textContent='0';
            statHitRatio.textContent='0.0%';
            eventStatus.textContent='Waiting to start...';
            eventStatus.className='status-box status-idle';
            vizTitle.textContent='Visualization';
            return;
        }
        const state = sim.currentState;
        
        // Update Stats
        statFaults.textContent=state.stats.pageFaults;
        statHits.textContent=state.stats.pageHits;
        const totalSteps=state.stats.pageHits + state.stats.pageFaults;
        statSteps.textContent=totalSteps;
        const hitRatio=totalSteps>0?(state.stats.pageHits/totalSteps)*100:0;
        statHitRatio.textContent=`${hitRatio.toFixed(1)}%`;
        
        // Update Event Status Box
        const lastEvent=state.lastEvent;
        switch(lastEvent.type){
            case 'START':
                eventStatus.textContent='Simulation started.';
                eventStatus.className='status-box status-idle';
                break;
            case 'HIT':
                eventStatus.textContent=`Page ${lastEvent.page} HIT`;
                eventStatus.className='status-box status-hit';
                break;
            case 'FAULT':
                eventStatus.textContent = `Page ${lastEvent.page} FAULT${lastEvent.replaced ? ` (Replaced ${lastEvent.replaced})` : ''}`;
                eventStatus.className = 'status-box status-fault';
                break;
            case 'DONE':
                eventStatus.textContent='Simulation Complete!';
                eventStatus.className='status-box status-done';
                break;
        }

        // Update Button States
        playBtn.disabled=isPlaying || sim.isFinished;
        pauseBtn.disabled=!isPlaying || sim.isFinished;
        nextBtn.disabled=isPlaying || sim.isFinished;
        prevBtn.disabled=isPlaying || sim.stateHistory.length<=1;
        
        // Update title
        vizTitle.textContent=`Visualization(${algoSelect.options[algoSelect.selectedIndex].text})`;
    }

    /**
     * Toggles the animation state between playing and paused.
     * @param {boolean} play - True to play, false to pause.
     */
    function setPlaying(play){
        isPlaying=play;
        if (isPlaying && !sim.isFinished) {
            lastStepTime=performance.now(); // Start the timer
        }
        updateUI(); // Update button states
    }


    // 4.Event Handlers

    // Handles the 'Start Simulation' button click
    function handleStart(){
        // 1. Get and validate inputs
        const algo=algoSelect.value;
        const numFrames=parseInt(numFrIp.value);
        const pgStrRaw=pgStrIp.value;
        
        if (isNaN(numFrames) || numFrames<1 || numFrames>8){
            // Use a custom message box instead of alert()
            showCustomAlert("Please enter a valid number of frames (1-8).");
            return;
        }

        const pageString=pgStrRaw.split(',')
                                        .map(s => s.trim())
                                        .filter(s => s.length>0)
                                        .map(s => parseInt(s));
        
        if (pageString.some(isNaN) || pageString.length===0){
            // Use a custom message box instead of alert()
            showCustomAlert("Please enter a valid, comma-separated page reference string (e.g., 7, 0, 1).");
            return;
        }

        // 2. Create new simulation
        sim=new SimulationController(canvas,algo,numFrames,pageString);
        
        // 3. Switch UI panels
        setupPanel.classList.add('hidden');
        anmSec.classList.remove('hidden');

        // 4. Set initial state
        setPlaying(false);
        sim.draw();
        updateUI();
    }
    
    /**
     * Shows a custom, non-blocking alert message.
     * @param {string} message - The message to display.
     */
    function showCustomAlert(message){
        // We can re-use the eventStatusBox for alerts
        eventStatus.textContent=message;
        eventStatus.className='status-box status-fault'; // Use 'fault' style for errors
        
        // Reset to idle after 3 seconds
        setTimeout(() => {
            if(!sim){ // Only reset if simulation hasn't started
                eventStatus.textContent='Waiting to start...';
                eventStatus.className='status-box status-idle';
            }
        },3000);
    }

    // Handles the 'Reset Simulation' button click
    function handleReset(){
        // 1. Stop simulation
        setPlaying(false);
        sim=null;
        
        // 2. Switch UI panels
        anmSec.classList.add('hidden');
        setupPanel.classList.remove('hidden');

        // 3. Clear canvas and UI
        const ctx=canvas.getContext('2d');
        ctx.clearRect(0,0,canvas.width,canvas.height);
        updateUI();
    }

    // Handles the 'Play' button click
    function handlePlay(){
        setPlaying(true);
    }

    // Handles the 'Pause' button click
    function handlePause(){
        setPlaying(false);
    }

    // Handles the 'Step Forward' button click
    function handleStepForward(){
        if(!sim.isFinished){
            sim.stepForward();
            updateUI(); // Update immediately
        }
    }

    // Handles the 'Step Backward' button click
    function handleStepBackward(){
        sim.stepBackward();
        updateUI(); // Update immediately
    }

    // Handles the 'Speed Slider' input change
    function handleSpeedChange(e){
        anmSpd=parseFloat(e.target.value);
    }

    // Handles the 'Export Screenshot' button 
    function handleScreenshot(){
        const dataURL=canvas.toDataURL('image/png');
        const link=document.createElement('a');
        link.download=`os-visualizer-${algoSelect.value}.png`;
        link.href=dataURL;
        link.click();
    }

    // 5.Initialization

    // Attach all event listeners
    startBtn.addEventListener('click',handleStart);
    resetBtn.addEventListener('click',handleReset);
    playBtn.addEventListener('click',handlePlay);
    pauseBtn.addEventListener('click',handlePause);
    nextBtn.addEventListener('click',handleStepForward);
    prevBtn.addEventListener('click',handleStepBackward);
    spdControl.addEventListener('input',handleSpeedChange);
    ssBtn.addEventListener('click',handleScreenshot);

    // Start the animation loop (it will only draw when 'sim' is not null)
    anmFrId=requestAnimationFrame(anmLoop);

    // Initial clear of canvas
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
});

