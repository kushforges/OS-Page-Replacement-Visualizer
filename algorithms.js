/* * -----------------------------------------------------------------
 * algorithms.js
 * -----------------------------------------------------------------
 * This file holds the pure logic for the FIFO, LRU, and
 * Optimal page replacement algorithms.
 * -----------------------------------------------------------------
 */

/**
 * Runs one FIFO step.
 * @param {Array} currentFrames - The current memory frames.
 * @param {number} currentPointer - The index of the next victim frame.
 * @param {number} page - The page to process.
 * @returns {object} The new state (frames, pointer, event).
 */
export function runFifo(currentFrames, currentPointer, page) {
    // Copy frames to avoid changing the original
    const newFrames = [...currentFrames];
    
    // 1.Page Hit
    if (newFrames.includes(page)) {
        return {
            newFrames: newFrames,
            fifoPointer: currentPointer, // Pointer doesn't move
            event: { type: 'HIT', page: page }
        };
    }

    // 2.Page Fault
    const victimIndex = currentPointer;
    const replacedPage = newFrames[victimIndex];
    
    // Replace page at pointer
    newFrames[victimIndex] = page;
    
    // Move pointer
    const newPointer = (currentPointer + 1) % newFrames.length;

    return {
        newFrames: newFrames,
        fifoPointer: newPointer,
        event: {
            type: 'FAULT',
            page: page,
            replaced: replacedPage,
            frameIndex: victimIndex
        }
    };
}

/**
 * Runs one LRU step.
 * @param {Array} currentFrames - The current memory frames.
 * @param {Array} currentQueue - The list of pages (LRU...MRU).
 * @param {number} page - The page to process.
 * @returns {object} The new state (frames, queue, event).
 */
export function runLru(currentFrames, currentQueue, page) {
    const newFrames = [...currentFrames];
    const newQueue = [...currentQueue];

    // 1.Update queue (move page to end)
    // Remove page if it exists
    const existingIndex = newQueue.indexOf(page);
    if (existingIndex > -1) {
        newQueue.splice(existingIndex, 1);
    }
    // Add to end (MRU)
    newQueue.push(page);

    // 2.Page Hit
    if (newFrames.includes(page)) {
        return {
            newFrames: newFrames,
            lruQueue: newQueue,
            event: { type: 'HIT', page: page }
        };
    }

    // 3.Page Fault
    let victimIndex = -1;
    let replacedPage = null;

    // Find empty frame
    const emptyIndex = newFrames.indexOf(null);
    if (emptyIndex > -1) {
        victimIndex = emptyIndex;
    } else {
        // No empty frames, find LRU page
        // LRU page is the first in queue that's also in frames
        const lruPage = newQueue.find(p => newFrames.includes(p));
        replacedPage = lruPage;
        victimIndex = newFrames.indexOf(lruPage);
        
        // Remove victim from queue
        const lruQueueIndex = newQueue.indexOf(lruPage);
        if (lruQueueIndex > -1) {
            newQueue.splice(lruQueueIndex, 1);
        }
    }
    
    // Add new page to frame
    newFrames[victimIndex] = page;

    return {
        newFrames: newFrames,
        lruQueue: newQueue,
        event: {
            type: 'FAULT',
            page: page,
            replaced: replacedPage,
            frameIndex: victimIndex
        }
    };
}

/**
 * Runs one Optimal step.
 * @param {Array} currentFrames - The current memory frames.
 * @param {number} page - The page to process.
 * @param {Array} futurePages - The list of all upcoming pages.
 * @returns {object} The new state (frames, event).
 */
export function runOptimal(currentFrames, page, futurePages) {
    const newFrames = [...currentFrames];

    // 1.Page Hit
    if (newFrames.includes(page)) {
        return {
            newFrames: newFrames,
            event: { type: 'HIT', page: page }
        };
    }

    // 2.Page Fault
    let victimIndex = -1;
    let replacedPage = null;

    // Find empty frame
    const emptyIndex = newFrames.indexOf(null);
    if (emptyIndex > -1) {
        victimIndex = emptyIndex;
    } else {
        // No empty frames, find optimal victim
        let furthestUse = -1;
        
        // Check each page in memory
        for (let i = 0; i < newFrames.length; i++) {
            const framePage = newFrames[i];
            
            // Find its next use in the future
            const nextUseIndex = futurePages.indexOf(framePage);
            
            if (nextUseIndex === -1) {
                // Page not used again? Perfect victim.
                victimIndex = i;
                replacedPage = framePage;
                break;
            } else {
                // Track page used furthest in future
                if (nextUseIndex > furthestUse) {
                    furthestUse = nextUseIndex;
                    victimIndex = i;
                    replacedPage = framePage;
                }
            }
        }
    }

    // Add new page to frame
    newFrames[victimIndex] = page;
    
    return {
        newFrames: newFrames,
        event: {
            type: 'FAULT',
            page: page,
            replaced: replacedPage,
            frameIndex: victimIndex
        }
    };
}

