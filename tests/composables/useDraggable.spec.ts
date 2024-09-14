import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDraggable } from '@/composables/useDraggable';
import { setActivePinia, createPinia } from 'pinia';
import { useWindowsStore } from '@/stores/useWindowsStore';

// Mock data for a window
const mockWindow = {
    id: 'window-1',
    xPos: 100,
    yPos: 100,
    width: 500,
    height: 400,
    dragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
};

function mockElement(parentWidth = 1200, parentHeight = 800, offsetTop = 0) {
    const parent = document.createElement('div');
    parent.style.width = `${parentWidth}px`;
    parent.style.height = `${parentHeight}px`;
    parent.style.position = 'relative'; // Ensure positioning context

    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.top = `${offsetTop}px`; // Set top to simulate offsetTop

    parent.appendChild(element);

    // Mock getBoundingClientRect based on the set styles and positions
    parent.getBoundingClientRect = () => ({
        width: parseFloat(parent.style.width),
        height: parseFloat(parent.style.height),
        left: 0,
        top: 0,
        right: parseFloat(parent.style.width),
        bottom: parseFloat(parent.style.height),
        x: 0,
        y: 0,
        toJSON() {
            return {
                width: this.width,
                height: this.height,
                left: this.left,
                top: this.top,
                right: this.right,
                bottom: this.bottom,
                x: this.x,
                y: this.y
            };
        }
    });

    element.getBoundingClientRect = () => ({
        width: parseFloat(element.style.width || parent.style.width),
        height: parseFloat(element.style.height || parent.style.height),
        left: 0,
        top: parseFloat(element.style.top),
        right: parseFloat(element.style.width || parent.style.width),
        bottom: parseFloat(element.style.top) + parseFloat(element.style.height || parent.style.height),
        x: 0,
        y: parseFloat(element.style.top),
        toJSON() {
            return {
                width: this.width,
                height: this.height,
                left: this.left,
                top: this.top,
                right: this.right,
                bottom: this.bottom,
                x: this.x,
                y: this.y
            };
        }
    });

    return element;
}

function createMouseEvent(type: string, clientX: number, clientY: number) {
    const event = new MouseEvent(type, {
        clientX,
        clientY,
        bubbles: true,
        cancelable: true,
    });

    // Spy on preventDefault and stopPropagation
    event.preventDefault = vi.fn();
    event.stopPropagation = vi.fn();

    return event;
}

describe('useDraggable composable with complex scenarios', () => {
    let store: ReturnType<typeof useWindowsStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useWindowsStore();
        store.createWindow(mockWindow);
    });

    it('does not allow dragging when window is maximized', () => {
        const maximizedWindow = { ...mockWindow, isMaximized: true };
        store.createWindow(maximizedWindow);
        const { toggleDrag, handleDrag } = useDraggable(maximizedWindow.id);
        const element = mockElement(800, 600);

        const downEvent = createMouseEvent('mousedown', 100, 100);
        toggleDrag(downEvent, element as unknown as HTMLDivElement);

        const moveEvent = createMouseEvent('mousemove', 200, 200);
        handleDrag(moveEvent);

        const window = store.getWindow(maximizedWindow.id);

        // Expect no change in position since the window is maximized
        expect(window?.xPos).toBe(maximizedWindow.xPos);
        expect(window?.yPos).toBe(maximizedWindow.yPos);
    });

    it('does not allow dragging when window is minimized', () => {
        const minimizedWindow = { ...mockWindow, isMinimized: true };
        store.createWindow(minimizedWindow);
        const { toggleDrag, handleDrag } = useDraggable(minimizedWindow.id);
        const element = mockElement(800, 600);

        const downEvent = createMouseEvent('mousedown', 100, 100);
        toggleDrag(downEvent, element as unknown as HTMLDivElement);

        const moveEvent = createMouseEvent('mousemove', 300, 300);
        handleDrag(moveEvent);

        const window = store.getWindow(minimizedWindow.id);

        // Expect no change in position since the window is minimized
        expect(window?.xPos).toBe(minimizedWindow.xPos);
        expect(window?.yPos).toBe(minimizedWindow.yPos);
    });

    it('prevents window from moving to negative x and y coordinates', () => {
        const { toggleDrag, handleDrag } = useDraggable(mockWindow.id);
        const element = mockElement(500, 400); // Parent dimensions

        const downEvent = createMouseEvent('mousedown', 100, 100);
        toggleDrag(downEvent, element as unknown as HTMLDivElement);

        expect(downEvent.preventDefault).toHaveBeenCalled();
        expect(downEvent.stopPropagation).toHaveBeenCalled();

        // Simulate dragging to negative coordinates
        const moveEvent = createMouseEvent('mousemove', -50, -50);
        handleDrag(moveEvent);

        expect(moveEvent.preventDefault).toHaveBeenCalled();
        expect(moveEvent.stopPropagation).toHaveBeenCalled();

        const window = store.getWindow(mockWindow.id);

        // Check if the window position is clamped to 0 (not negative)
        expect(window?.xPos).toBe(0);
        expect(window?.yPos).toBe(0);
    });

    it('handles dragging within very small parent boundaries', () => {
        const { toggleDrag, handleDrag } = useDraggable(mockWindow.id);
        const element = mockElement(400, 300); // Parent is smaller than the window

        const downEvent = createMouseEvent('mousedown', 100, 100);
        toggleDrag(downEvent, element as unknown as HTMLDivElement);

        const moveEvent = createMouseEvent('mousemove', 200, 200);
        handleDrag(moveEvent);

        const window = store.getWindow(mockWindow.id);

        expect(window?.xPos).toBe(0);  // Cannot move right because parent is smaller
        expect(window?.yPos).toBe(0);  // Cannot move down beyond parent's height
    });

    it('handles dragging near the edge of the parent', () => {
        const { toggleDrag, handleDrag } = useDraggable(mockWindow.id);
        const element = mockElement(1200, 800);

        const downEvent = createMouseEvent('mousedown', 100, 100);
        toggleDrag(downEvent, element as unknown as HTMLDivElement);

        expect(downEvent.preventDefault).toHaveBeenCalled();
        expect(downEvent.stopPropagation).toHaveBeenCalled();

        const moveEvent = createMouseEvent('mousemove', 1300, 850);
        handleDrag(moveEvent);

        expect(moveEvent.preventDefault).toHaveBeenCalled();
        expect(moveEvent.stopPropagation).toHaveBeenCalled();

        const window = store.getWindow(mockWindow.id);

        expect(window?.xPos).toBe(700); // Constrained at the parent's right edge
        expect(window?.yPos).toBe(380); // Constrained at the parent's bottom edge
    });

    it('handles top UI element offsets correctly', () => {
        const { toggleDrag, handleDrag } = useDraggable(mockWindow.id);
        const element = mockElement(1200, 800, 100); // Simulate top UI element with 100px offset

        const downEvent = createMouseEvent('mousedown', 100, 200);
        toggleDrag(downEvent, element as unknown as HTMLDivElement);

        expect(downEvent.preventDefault).toHaveBeenCalled();
        expect(downEvent.stopPropagation).toHaveBeenCalled();

        const moveEvent = createMouseEvent('mousemove', 150, 150);
        handleDrag(moveEvent);

        expect(moveEvent.preventDefault).toHaveBeenCalled();
        expect(moveEvent.stopPropagation).toHaveBeenCalled();

        const window = store.getWindow(mockWindow.id);

        // Ensure yPos respects the top UI offset
        expect(window?.yPos).toBe(100); // Constrained by the 100px top offset
    });

    it('updates window position dynamically when parent dimensions change', () => {
        const { toggleDrag, handleDrag } = useDraggable(mockWindow.id);
        let element = mockElement(1200, 800);

        // Initial drag with a large parent
        const downEvent = createMouseEvent('mousedown', 100, 100);
        const moveEvent = createMouseEvent('mousemove', 400, 300);
        toggleDrag(downEvent, element as unknown as HTMLDivElement);

        expect(downEvent.preventDefault).toHaveBeenCalled();
        expect(downEvent.stopPropagation).toHaveBeenCalled();

        handleDrag(moveEvent);

        expect(moveEvent.preventDefault).toHaveBeenCalled();
        expect(moveEvent.stopPropagation).toHaveBeenCalled();

        let window = store.getWindow(mockWindow.id);

        expect(window?.xPos).toBe(400);
        expect(window?.yPos).toBe(300);

        // Simulate the parent shrinking
        element = mockElement(600, 400);
        const moveEvent2 = createMouseEvent('mousemove', 500, 350);
        handleDrag(moveEvent2);

        window = store.getWindow(mockWindow.id);

        expect(window?.xPos).toBe(100); // Constrained by the new smaller parent width
        expect(window?.yPos).toBe(0);   // Constrained by the new smaller parent height
    });

    it('handles mouse drag to extreme left and top beyond boundaries', () => {
        const { toggleDrag, handleDrag } = useDraggable(mockWindow.id);
        const element = mockElement(800, 600); // Parent dimensions

        const downEvent = createMouseEvent('mousedown', 300, 200);
        toggleDrag(downEvent, element as unknown as HTMLDivElement);

        expect(downEvent.preventDefault).toHaveBeenCalled();
        expect(downEvent.stopPropagation).toHaveBeenCalled();

        // Dragging far beyond the initial click position to the top-left corner
        const moveEvent = createMouseEvent('mousemove', -1000, -1000);
        handleDrag(moveEvent);

        expect(moveEvent.preventDefault).toHaveBeenCalled();
        expect(moveEvent.stopPropagation).toHaveBeenCalled();

        const window = store.getWindow(mockWindow.id);

        // Ensure the window position does not exceed the parent's boundaries
        expect(window?.xPos).toBe(0);
        expect(window?.yPos).toBe(0);
    });
});
