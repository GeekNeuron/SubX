// src/hooks/useUndoRedo.js
import React from 'react';

export function useUndoRedo(initialState) {
    const [state, setState] = React.useState({
        past: [],
        present: initialState,
        future: []
    });

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    const updatePresent = React.useCallback((newPresentData, actionType = "standard_edit") => {
        setState(currentState => {
            // Check if only hasUnsavedChanges flag is different, without actual data change
            const dataIsSame = JSON.stringify(newPresentData.subtitles) === JSON.stringify(currentState.present.subtitles) &&
                               newPresentData.originalFileName === currentState.present.originalFileName;

            let newHasUnsavedChanges;
            if (actionType === "save") {
                newHasUnsavedChanges = false;
            } else if (actionType === "load_or_reset") {
                newHasUnsavedChanges = false;
            } else { // standard_edit or any other action implying a change
                newHasUnsavedChanges = true;
            }
            
            // If data is the same and hasUnsavedChanges is also the same as intended, no update
            if (dataIsSame && newHasUnsavedChanges === currentState.present.hasUnsavedChanges) {
                 return currentState;
            }
            
            const newPast = [...currentState.past, currentState.present];
            const limitedPast = newPast.slice(Math.max(0, newPast.length - 50)); // Limit history

            return {
                past: limitedPast,
                present: { ...newPresentData, hasUnsavedChanges: newHasUnsavedChanges },
                future: [] // Clear future on new state update
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

    const resetState = React.useCallback((newInitialState) => {
        setState({
            past: [],
            present: { ...newInitialState, hasUnsavedChanges: false }, // Ensure unsaved is false on reset
            future: []
        });
    }, []);

    return { presentState: state.present, setPresentState: updatePresent, undo, redo, canUndo, canRedo, resetState };
}
