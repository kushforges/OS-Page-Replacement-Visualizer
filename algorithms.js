/* * -----------------------------------------------------------------
 * algorithms.js
 * -----------------------------------------------------------------
 * This file holds the pure logic for the FIFO, LRU, and
 * Optimal page replacement algorithms.
 * -----------------------------------------------------------------
 */

/**
 * Performs one step of the FIFO algorithm.
 * @param {object} state - A deep copy of the current simulation state.
 * @param {number} currentPage - The page to be processed.
 * @returns {object} The new state after this step.
 */
export function fifoStep(state, currentPage) {
    // Check for Page Hit
    if (state.frames.includes(currentPage)) {
        state.stats.pageHits++;
        state.lastEvent = {
            type: 'HIT',
            page: currentPage,
            replaced: null,
            replacedFrameIndex: -1
        };
    } else {
        // Page Fault
        state.stats.pageFaults++;
        
        // Find victim frame using the FIFO pointer
        const victimIndex = state.fifoPointer;
        const victimPage = state.frames[victimIndex];
        
        // Replace the page
        state.frames[victimIndex] = currentPage;
        
        // Move the FIFO pointer
        state.fifoPointer = (state.fifoPointer + 1) % state.frames.length;
        
        state.lastEvent = {
            type: 'FAULT',
            page: currentPage,
            replaced: victimPage, // Will be null if frame was empty
            replacedFrameIndex: victimIndex
        };
    }
    return state;
}

/**
 * Performs one step of the LRU algorithm.
 * @param {object} state - A deep copy of the current simulation state.
 * @param {number} currentPage - The page to be processed.
 * @returns {object} The new state after this step.
 */
export function lruStep(state, currentPage) {
    // 1.Update LRU Queue (used for both hit and fault)
    // Remove if it exists
    const existingIndex = state.lruQueue.indexOf(currentPage);
    if (existingIndex > -1) {
        state.lruQueue.splice(existingIndex, 1);
    }
    // Add to the end (most recently used)
    state.lruQueue.push(currentPage);

    // 2.Check for Page Hit
    if (state.frames.includes(currentPage)) {
        state.stats.pageHits++;
        state.lastEvent = {
            type: 'HIT',
            page: currentPage,
            replaced: null,
            replacedFrameIndex: -1
        };
    } else {
        // 3.Page Fault
        state.stats.pageFaults++;
        
        let victimPage = null;
        let victimIndex = -1;

        // Check if frames are full
        if (state.frames.includes(null)) {
            // Frames are not full, find first empty slot
            victimIndex = state.frames.indexOf(null);
        } else {
            // Frames are full, find the LRU page
            // The LRU page is the first element in lruQueue *that is in frames*
            for (let i = 0; i < state.lruQueue.length; i++) {
                const lruPage = state.lruQueue[i];
                if (state.frames.includes(lruPage)) {
                    victimPage = lruPage;
                    break;
                }
            }
            
            // Find the frame index of the victim page
            victimIndex = state.frames.indexOf(victimPage);
            
            // Remove the victim page from the LRU queue since it's no longer in memory
            const lruVictimIndex = state.lruQueue.indexOf(victimPage);
            if (lruVictimIndex > -1) {
                state.lruQueue.splice(lruVictimIndex, 1);
            }
        }
        
        // Replace the page
        state.frames[victimIndex] = currentPage;
        
        state.lastEvent = {
            type: 'FAULT',
            page: currentPage,
            replaced: victimPage,
            replacedFrameIndex: victimIndex
        };
    }
    return state;
}

/**
 * Performs one step of the Optimal (OPT) algorithm.
 * @param {object} state - A deep copy of the current simulation state.
 * @param {number} currentPage - The page to be processed.
 * @param {number[]} futureString - The rest of the page string (lookahead).
 * @returns {object} The new state after this step.
 */
export function optimalStep(state, currentPage, futureString) {
    // 1.Check for Page Hit
    if (state.frames.includes(currentPage)) {
        state.stats.pageHits++;
        state.lastEvent = {
            type: 'HIT',
            page: currentPage,
            replaced: null,
            replacedFrameIndex: -1
        };
    } else {
        // 2.Page Fault
        state.stats.pageFaults++;
        
        let victimPage = null;
        let victimIndex = -1;

        // Check if frames are full
        if (state.frames.includes(null)) {
            // Frames are not full, find first empty slot
            victimIndex = state.frames.indexOf(null);
        } else {
            // 3.Frames are full, find the optimal page to replace
            let maxFutureIndex = -1;
            
            // Iterate through each page currently in a frame
            for (let i = 0; i < state.frames.length; i++) {
                const framePage = state.frames[i];
                
                // Find the next time this page is used
                const futureUseIndex = futureString.indexOf(framePage);
                
                if (futureUseIndex === -1) {
                    // This page is never used again. It's the perfect victim.
                    victimIndex = i;
                    victimPage = framePage;
                    break;
                } else {
                    // Track the page that is used furthest in the future
                    if (futureUseIndex > maxFutureIndex) {
                        maxFutureIndex = futureUseIndex;
                        victimIndex = i;
                        victimPage = framePage;
                    }
                }
            }
        }
        
        // 4.Replace the page
        state.frames[victimIndex] = currentPage;
        
        state.lastEvent = {
            type: 'FAULT',
            page: currentPage,
            replaced: victimPage,
            replacedFrameIndex: victimIndex
        };
    }
    return state;
}

