# Winvue

Work in progress! Very early stage.

Window manager for [Vue3 with Composition API](https://vuejs.org/) written in Typescript.

[demo](https://github.com/user-attachments/assets/e50c4ec0-5cf0-4530-af17-2f39b5707862)

## Running
- Start the UI with :
```commandline
npm run dev
```

## Intefaces

```typescript
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
```

## Props
`<AppWindow>` takes a single prop `id` the uuid of the window.

