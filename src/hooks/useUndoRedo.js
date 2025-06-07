import React from 'react';

// This custom hook manages the state for undo/redo functionality.
// It tracks past, present, and future states of the subtitle data.
export function useUndoRedo(initialState) {
    const [state, setState] = React.useState({
        past: [],
        present: initialState,
        future: []
    });

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    // This function is the main way to update the state and push to the undo history.
    // actionType helps determine if 'hasUnsavedChanges' should be set.
    const updatePresent = React.useCallback((newPresentData, actionType = "standard_edit") => {
        setState(currentState => {
            // Check if only hasUnsavedChanges flag is different, without actual data change
            const dataIsSame = JSON.stringify(newPresentData.subtitles) === JSON.stringify(currentState.present.subtitles) &&
                               newPresentData.originalFileName === currentState.present.originalFileName;

            let newHasUnsavedChanges;
            if (actionType === "save_action") {
                newHasUnsavedChanges = false; // Saving clears the unsaved status.
            } else if (actionType === "load_or_reset_action") {
                newHasUnsavedChanges = false; // Loading a new file or clearing all resets the status.
            } else { // Any other action (edit, add, delete, etc.) marks the state as having unsaved changes.
                // It becomes true if either the data actually changed OR if it was already true.
                newHasUnsavedChanges = !dataIsSame || currentState.present.hasUnsavedChanges;
            }
            
            // If no actual data changed and the unsaved status is also not changing, do nothing.
            if (dataIsSame && newHasUnsavedChanges === currentState.present.hasUnsavedChanges) {
                 return currentState;
            }
            
            // Push the current state to the past for undo history
            const newPast = [...currentState.past, currentState.present];
            // Limit the history size to prevent potential memory issues with very large files or many edits.
            const limitedPast = newPast.slice(Math.max(0, newPast.length - 50)); 

            return {
                past: limitedPast,
                present: { ...newPresentData, hasUnsavedChanges: newHasUnsavedChanges },
                future: [] // Any new action clears the "redo" history.
            };
        });
    }, []);

    // Moves the current state to the future and the last past state to the present.
    const undo = React.useCallback(() => {
        if (!canUndo) return;
        setState(currentState => {
            const newPresent = currentState.past[currentState.past.length - 1];
            const newPast = currentState.past.slice(0, currentState.past.length - 1);
            const newFuture = [currentState.present, ...currentState.future];
            return { past: newPast, present: newPresent, future: newFuture };
        });
    }, [canUndo]);

    // Moves the first future state to the present and the current state to the past.
    const redo = React.useCallback(() => {
        if (!canRedo) return;
        setState(currentState => {
            const newPresent = currentState.future[0];
            const newFuture = currentState.future.slice(1);
            const newPast = [...currentState.past, currentState.present];
            return { past: newPast, present: newPresent, future: newFuture };
        });
    }, [canRedo]);

    // Completely resets the state history, used when loading a new file or clearing all subtitles.
    const resetState = React.useCallback((newInitialState) => {
        setState({
            past: [],
            present: { ...newInitialState, hasUnsavedChanges: false }, // Explicitly set unsaved to false.
            future: []
        });
    }, []);

    return { presentState: state.present, setPresentState: updatePresent, undo, redo, canUndo, canRedo, resetState };
}
