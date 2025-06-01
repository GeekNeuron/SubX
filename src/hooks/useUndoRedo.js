// src/hooks/useUndoRedo.js
import React from 'react';

export function useUndoRedo(initialState) {
    // The state includes the core data (subtitles, originalFileName) 
    // and a flag for unsaved changes.
    const [state, setState] = React.useState({
        past: [],
        present: { ...initialState, hasUnsavedChanges: false }, // Initialize with no unsaved changes
        future: []
    });

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    // updatePresent is called when a new state is set by an action.
    // actionType helps determine if 'hasUnsavedChanges' should be set.
    const updatePresent = React.useCallback((newPresentData, actionType = "standard_edit") => {
        setState(currentState => {
            // Determine if the core data (subtitles, filename) actually changed.
            const subtitlesChanged = JSON.stringify(newPresentData.subtitles) !== JSON.stringify(currentState.present.subtitles);
            const fileNameChanged = newPresentData.originalFileName !== currentState.present.originalFileName;
            const actualDataChanged = subtitlesChanged || fileNameChanged;

            let newHasUnsavedChanges;
            if (actionType === "save_action" || actionType === "load_or_reset_action") {
                newHasUnsavedChanges = false; // Saving or loading/resetting clears unsaved status
            } else { // Any other action implies a potential change
                newHasUnsavedChanges = actualDataChanged || currentState.present.hasUnsavedChanges;
            }
            
            // If no actual data changed AND the unsaved status is also not changing, don't push to history.
            // This prevents pushing to history just for a flag change if data is identical.
            if (!actualDataChanged && newHasUnsavedChanges === currentState.present.hasUnsavedChanges) {
                 return { ...currentState, present: { ...currentState.present, hasUnsavedChanges: newHasUnsavedChanges }};
            }
            
            const newPast = [...currentState.past, currentState.present];
            const limitedPast = newPast.slice(Math.max(0, newPast.length - 50)); // Limit history size

            return {
                past: limitedPast,
                present: { ...newPresentData, hasUnsavedChanges: newHasUnsavedChanges },
                future: [] // Clear future on new state update (standard undo/redo behavior)
            };
        });
    }, []);

    const undo = React.useCallback(() => {
        if (!canUndo) return;
        setState(currentState => {
            const newPresent = currentState.past[currentState.past.length - 1];
            const newPast = currentState.past.slice(0, currentState.past.length - 1);
            const newFuture = [currentState.present, ...currentState.future];
            return { past: newPast, present: newPresent, future: newFuture };
        });
    }, [canUndo]);

    const redo = React.useCallback(() => {
        if (!canRedo) return;
        setState(currentState => {
            const newPresent = currentState.future[0];
            const newFuture = currentState.future.slice(1);
            const newPast = [...currentState.past, currentState.present];
            return { past: newPast, present: newPresent, future: newFuture };
        });
    }, [canRedo]);

    // Resets the state to a new initial state, typically after loading a new file or clearing all.
    const resetState = React.useCallback((newInitialState) => {
        setState({
            past: [],
            present: { ...newInitialState, hasUnsavedChanges: false }, // Explicitly set unsaved to false
            future: []
        });
    }, []);

    return { presentState: state.present, setPresentState: updatePresent, undo, redo, canUndo, canRedo, resetState };
}
