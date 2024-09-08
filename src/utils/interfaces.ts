// File: interfaces.ts
// Description: This file contains interfaces that define common structures.

export interface Window {
    id: string;
    isMinimized: boolean;
    isMaximized: boolean;
    windowComponent: unknown;
    windowComponentKey: string;    // To force re-rendering if needed
    xPos: number;
    yPos: number;
    minimumWidth: number;
    maximumWidth: number;
    minimumHeight: number;
    maximumHeight: number;
    initialWidth: number;
    initialHeight: number;
    restoreSize: { width: number, height: number, xPos: number, yPos: number };
    windowProps: object;
    dragging: boolean;
    resizing: boolean;
    resizeDirection: string;
    lastMouseX: number;
    lastMouseY: number;
    width: number;
    height: number;
    zIndex: number;
}

export interface WindowDualPaneContent {
    label: string;
    component: unknown;
}

