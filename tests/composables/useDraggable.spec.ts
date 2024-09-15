import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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
    parent.style.padding = '10px'; // Add padding
    parent.style.margin = '5px'; // Add margin
    parent.style.border = '2px solid black'; // Add border

    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.top = `${offsetTop}px`; // Set top to simulate offsetTop
    element.style.width = '100%'; // Child takes full width of the parent
    element.style.height = '100%'; // Child takes full height of the parent

    parent.appendChild(element);

    // Mock getBoundingClientRect based on the set styles and positions
    parent.getBoundingClientRect = () => {
        const rect = {
            width: parseFloat(parent.style.width),
            height: parseFloat(parent.style.height),
            //width: parseFloat(parent.style.width) - parseFloat(parent.style.padding) * 2 - parseFloat(parent.style.border) * 2,
            //height: parseFloat(parent.style.height) - parseFloat(parent.style.padding) * 2 - parseFloat(parent.style.border) * 2,
            left: parseFloat(parent.style.margin),
            top: parseFloat(parent.style.margin),
            right: parseFloat(parent.style.width) + parseFloat(parent.style.margin) * 2,
            bottom: parseFloat(parent.style.height) + parseFloat(parent.style.margin) * 2,
            x: parseFloat(parent.style.margin),
            y: parseFloat(parent.style.margin),
            toJSON: () => {
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
        };
        return rect;
    };

    element.getBoundingClientRect = () => {
        const parentRect = parent.getBoundingClientRect();
        const rect = {
            width: parentRect.width - parseFloat(parent.style.padding) * 2 - parseFloat(parent.style.border) * 2,
            height: parentRect.height - parseFloat(parent.style.padding) * 2 - parseFloat(parent.style.border) * 2,
            left: parentRect.left + parseFloat(parent.style.padding) + parseFloat(parent.style.border),
            top: parentRect.top + parseFloat(parent.style.padding) + parseFloat(parent.style.border) + offsetTop,
            right: parentRect.right - parseFloat(parent.style.padding) - parseFloat(parent.style.border),
            bottom: parentRect.bottom - parseFloat(parent.style.padding) - parseFloat(parent.style.border),
            x: parentRect.x + parseFloat(parent.style.padding) + parseFloat(parent.style.border),
            y: parentRect.y + parseFloat(parent.style.padding) + parseFloat(parent.style.border) + offsetTop,
            toJSON: () => {
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
        };
        return rect;
    };

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
    let addSpy: ReturnType<typeof vi.spyOn>;
    let removeSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useWindowsStore();
        store.createWindow(mockWindow);

        // Spy on document event listeners
        addSpy = vi.spyOn(document, 'addEventListener');
        removeSpy = vi.spyOn(document, 'removeEventListener');
    });

    afterEach(() => {
        // Restore the document event listeners
        addSpy.mockRestore();
        removeSpy.mockRestore();
    });

    it('correctly updates dragging and mouse coordinates on drag start', () => {
        const { toggleDrag } = useDraggable('window-1');
        const element = mockElement(800, 600);
        const downEvent = createMouseEvent('mousedown', 150, 150);

        toggleDrag(downEvent, element);

        const window = store.getWindow('window-1');
        expect(window.dragging).toBe(true);
        expect(window.lastMouseX).toBe(150);
        expect(window.lastMouseY).toBe(150);
    });

    it('correctly resets dragging on drag stop', () => {
        const { toggleDrag } = useDraggable('window-1');
        const element = mockElement(800, 600);
        const downEvent = createMouseEvent('mousedown', 150, 150);
        const upEvent = createMouseEvent('mouseup', 200, 200);

        toggleDrag(downEvent, element);
        document.dispatchEvent(upEvent); // Simulate the mouse up event

        const window = store.getWindow('window-1');
        expect(window.dragging).toBe(false);
        expect(window.lastMouseX).toBe(200);
        expect(window.lastMouseY).toBe(200);
    });

    it('updates window position and mouse coordinates on mouse move', () => {
        const { toggleDrag, handleDrag } = useDraggable('window-1');
        const element = mockElement();
        const downEvent = createMouseEvent('mousedown', 150, 150);
        const moveEvent = createMouseEvent('mousemove', 200, 250);

        toggleDrag(downEvent, element);
        handleDrag(moveEvent);

        const window = store.getWindow('window-1');
        expect(window.xPos).toBe(150); // Assuming initial xPos was 100
        expect(window.yPos).toBe(200); // Assuming initial yPos was 100
        expect(window.lastMouseX).toBe(200);
        expect(window.lastMouseY).toBe(250);
    });

    it('adds and removes mousemove and mouseup event listeners correctly', () => {
        const { toggleDrag } = useDraggable(mockWindow.id);
        const element = mockElement(800, 600);

        // Simulate starting the drag
        const downEvent = createMouseEvent('mousedown', 100, 100);
        toggleDrag(downEvent, element as unknown as HTMLDivElement);

        // Verify that mousemove and mouseup listeners are added
        expect(addSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
        expect(addSpy).toHaveBeenCalledWith('mouseup', expect.any(Function), expect.objectContaining({ once: true }));

        // Simulate the mouseup event which should trigger stopDrag
        const upEvent = createMouseEvent('mouseup', 200, 200);
        document.dispatchEvent(upEvent);

        // Verify that mousemove and mouseup listeners are removed
        expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));

        // Since 'mouseup' was added with { once: true }, it auto-removes, but we verify it was set to auto-remove
        expect(addSpy).toHaveBeenCalledWith('mouseup', expect.any(Function), expect.objectContaining({ once: true }));
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

        // Simulate dragging to negative coordinates
        const moveEvent = createMouseEvent('mousemove', -50, -50);
        handleDrag(moveEvent);

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

        const moveEvent = createMouseEvent('mousemove', 1300, 850);
        handleDrag(moveEvent);

        const window = store.getWindow(mockWindow.id);

        expect(window?.xPos).toBe(700); // Constrained at the parent's right edge
        expect(window?.yPos).toBe(400); // Constrained at the parent's bottom edge
    });

    it('updates window position dynamically when parent dimensions change', () => {
        const { toggleDrag, handleDrag, updateRootElement } = useDraggable(mockWindow.id);
        let element = mockElement(1200, 800);

        // Initial drag with a large parent
        const downEvent = createMouseEvent('mousedown', 100, 100);
        const moveEvent = createMouseEvent('mousemove', 400, 300);
        toggleDrag(downEvent, element as unknown as HTMLDivElement);

        handleDrag(moveEvent);

        let window = store.getWindow(mockWindow.id);

        expect(window?.xPos).toBe(400);
        expect(window?.yPos).toBe(300);

        // Simulate the parent shrinking
        element = mockElement(600, 400);
        updateRootElement(element as unknown as HTMLDivElement);
        const moveEvent2 = createMouseEvent('mousemove', 500, 350);

        handleDrag(moveEvent2);

        window = store.getWindow(mockWindow.id);

        expect(window?.xPos).toBe(100); // Constrained by the new smaller parent width
        expect(window?.yPos).toBe(0);   // Constrained by the new smaller parent height
    });

    it('handles mouse drag to extreme left and top beyond boundaries', () => {
        const { toggleDrag, handleDrag } = useDraggable(mockWindow.id);
        const element = mockElement(800, 600);

        const downEvent = createMouseEvent('mousedown', 300, 200);
        toggleDrag(downEvent, element as unknown as HTMLDivElement);

        // Dragging far beyond the initial click position to the top-left corner
        const moveEvent = createMouseEvent('mousemove', -1000, -1000);
        handleDrag(moveEvent);

        const window = store.getWindow(mockWindow.id);

        // Ensure the window position does not exceed the parent's boundaries
        expect(window?.xPos).toBe(0);
        expect(window?.yPos).toBe(0);
    });
});
