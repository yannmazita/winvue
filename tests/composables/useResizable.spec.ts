import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useResizable } from '@/composables/useResizable';
import { setActivePinia, createPinia } from 'pinia';
import { useWindowsStore } from '@/stores/useWindowsStore';

// Mock data for a window
const mockWindow = {
    id: 'window-1',
    xPos: 100,
    yPos: 100,
    width: 500,
    height: 400,
    minimumWidth: 320,
    maximumWidth: 1024,
    minimumHeight: 240,
    maximumHeight: 768,
    lastMouseX: 0,
    lastMouseY: 0,
    resizing: false,
    resizeDirection: '',
};

// Mock the root element with customizable boundaries
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

describe('useResizable composable with complex scenarios', () => {
    let store: ReturnType<typeof useWindowsStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useWindowsStore();
        store.createWindow(mockWindow);
    });

    it('resizes southeast (se) within max window size', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement(1200, 800);
        const downEvent = createMouseEvent('mousedown', 100, 100);
        const moveEvent = createMouseEvent('mousemove', 150, 150);

        toggleResize('se', downEvent, element as unknown as HTMLDivElement);

        handleResize(moveEvent);

        const window = store.getWindow(mockWindow.id);
        expect(window?.xPos).toBe(100);     // xPos stays the same
        expect(window?.yPos).toBe(100);     // yPos stays the same
        expect(window?.width).toBe(550);    // Width increases
        expect(window?.height).toBe(450);   // Height increases
    });

    it('resizes southwest (sw) within max window size', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement(1200, 800);
        const downEvent = createMouseEvent('mousedown', 100, 100);
        const moveEvent = createMouseEvent('mousemove', 50, 150);

        toggleResize('sw', downEvent, element as unknown as HTMLDivElement);

        handleResize(moveEvent);

        const window = store.getWindow(mockWindow.id);
        expect(window?.xPos).toBe(50);      // xPos adjusts left
        expect(window?.yPos).toBe(100);     // yPos stays the same
        expect(window?.width).toBe(550);    // Width increases
        expect(window?.height).toBe(450);   // Height increases
    });

    it('resizes northeast (ne) within max window size', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement(1200, 800);
        const downEvent = createMouseEvent('mousedown', 100, 100);
        const moveEvent = createMouseEvent('mousemove', 150, 50);

        toggleResize('ne', downEvent, element as unknown as HTMLDivElement);

        handleResize(moveEvent);

        const window = store.getWindow(mockWindow.id);
        expect(window?.xPos).toBe(100);     // xPos stays the same
        expect(window?.yPos).toBe(50);      // yPos adjusts upwards
        expect(window?.width).toBe(550);    // Width increases
        expect(window?.height).toBe(450);   // Height decreases
    });

    it('resizes northwest (nw) within max window size', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement(1200, 800);
        const downEvent = createMouseEvent('mousedown', 100, 100);
        const moveEvent = createMouseEvent('mousemove', 50, 50);

        toggleResize('nw', downEvent, element as unknown as HTMLDivElement);

        handleResize(moveEvent);

        const window = store.getWindow(mockWindow.id);
        expect(window?.xPos).toBe(50);      // xPos adjusts left
        expect(window?.yPos).toBe(50);      // yPos adjusts upwards
        expect(window?.width).toBe(550);    // Width increases
        expect(window?.height).toBe(450);   // Height increases
    });

    it('resizes north (n) within max window size', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement(1200, 800);
        const downEvent = createMouseEvent('mousedown', 100, 100);
        const moveEvent = createMouseEvent('mousemove', 100, 50);

        toggleResize('north', downEvent, element as unknown as HTMLDivElement);

        handleResize(moveEvent);

        const window = store.getWindow(mockWindow.id);
        expect(window?.xPos).toBe(100);     // xPos stays the same
        expect(window?.yPos).toBe(50);      // yPos adjusts upwards
        expect(window?.width).toBe(500);    // Width stays the same
        expect(window?.height).toBe(450);   // Height increases
    });

    it('resizes south (s) within max window size', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement(1200, 800);
        const downEvent = createMouseEvent('mousedown', 100, 100);
        const moveEvent = createMouseEvent('mousemove', 100, 150);

        toggleResize('south', downEvent, element as unknown as HTMLDivElement);

        handleResize(moveEvent);

        const window = store.getWindow(mockWindow.id);
        expect(window?.xPos).toBe(100);     // xPos stays the same
        expect(window?.yPos).toBe(100);     // yPos stays the same
        expect(window?.width).toBe(500);    // Width stays the same
        expect(window?.height).toBe(450);   // Height increases
    });

    it('resizes east (e) within max window size', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement(1200, 800);
        const downEvent = createMouseEvent('mousedown', 100, 100);
        const moveEvent = createMouseEvent('mousemove', 150, 100);

        toggleResize('east', downEvent, element as unknown as HTMLDivElement);

        handleResize(moveEvent);

        const window = store.getWindow(mockWindow.id);
        expect(window?.xPos).toBe(100);     // xPos stays the same
        expect(window?.yPos).toBe(100);     // yPos stays the same
        expect(window?.width).toBe(550);    // Width increases
        expect(window?.height).toBe(400);   // Height stays the same
    });

    it('resizes west (w) within max window size', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement(1200, 800);
        const downEvent = createMouseEvent('mousedown', 100, 100);
        const moveEvent = createMouseEvent('mousemove', 50, 100);

        toggleResize('west', downEvent, element as unknown as HTMLDivElement);

        handleResize(moveEvent);

        const window = store.getWindow(mockWindow.id);
        expect(window?.xPos).toBe(50);      // xPos adjusts left
        expect(window?.yPos).toBe(100);     // yPos stays the same
        expect(window?.width).toBe(550);    // Width increases
        expect(window?.height).toBe(400);   // Height stays the same
    });

    it('resizes southeast (se) beyond max window size', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement(1920, 1080);
        const downEvent = createMouseEvent('mousedown', 100, 100);
        const moveEvent = createMouseEvent('mousemove', 10000, 10000);
        toggleResize('se', downEvent, element as unknown as HTMLDivElement);
        handleResize(moveEvent);
        const window = store.getWindow(mockWindow.id);
        expect(window?.xPos).toBe(100);     // xPos stays the same
        expect(window?.yPos).toBe(100);     // yPos stays the same
        expect(window?.width).toBe(1024);   // Width reaches maximum
        expect(window?.height).toBe(768);   // Height reaches maximum
    });

    it('resizes southwest (sw) beyond max window size', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement(1920, 1080);
        const downEvent = createMouseEvent('mousedown', 100, 100);
        const moveEvent = createMouseEvent('mousemove', -10000, 10000);
        toggleResize('sw', downEvent, element as unknown as HTMLDivElement);
        handleResize(moveEvent);
        const window = store.getWindow(mockWindow.id);
        expect(window?.xPos).toBe(0);       // xPos reaches minimum
        expect(window?.yPos).toBe(100);     // yPos stays the same
        expect(window?.width).toBe(1024);   // Width reaches maximum
        expect(window?.height).toBe(768);   // Height reaches maximum
    });

    it('stops resizing when mouseup is triggered', () => {
        const { toggleResize, stopResize } = useResizable(mockWindow.id);
        const element = mockElement(1200, 800);
        const downEvent = createMouseEvent('mousedown', 100, 100);

        toggleResize('se', downEvent, element as unknown as HTMLDivElement);

        stopResize();

        const window = store.getWindow(mockWindow.id);
        expect(window?.resizing).toBe(false);
        expect(window?.resizeDirection).toBe('');
    });
});
