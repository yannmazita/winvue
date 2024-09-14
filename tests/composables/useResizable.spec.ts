import { describe, it, expect, beforeEach } from 'vitest';
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
function mockElement(parentWidth = 1200, parentHeight = 800) {
    return {
        parentElement: {
            getBoundingClientRect: () => ({
                width: parentWidth,
                height: parentHeight,
                left: 0,
                top: 0,
                right: parentWidth,
                bottom: parentHeight,
            }),
        },
    };
}

describe('useResizable composable', () => {
    let store: ReturnType<typeof useWindowsStore>;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useWindowsStore();
        store.createWindow(mockWindow);
    });

    it('resizes southeast (se) correctly', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement();

        toggleResize('se', new MouseEvent('mousedown', { clientX: 100, clientY: 100 }), element as unknown as HTMLDivElement);

        handleResize(new MouseEvent('mousemove', { clientX: 600, clientY: 600 }));

        const window = store.getWindow(mockWindow.id);
        expect(window?.width).toBe(1000);
        expect(window?.height).toBe(900);
    });

    it('resizes southwest (sw) correctly', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement();

        toggleResize('sw', new MouseEvent('mousedown', { clientX: 100, clientY: 100 }), element as unknown as HTMLDivElement);

        handleResize(new MouseEvent('mousemove', { clientX: 50, clientY: 600 }));

        const window = store.getWindow(mockWindow.id);
        expect(window?.xPos).toBe(50); // xPos adjusts left
        expect(window?.width).toBe(550); // Width increases
        expect(window?.height).toBe(900); // Height increases
    });

    it('resizes northeast (ne) correctly', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement();

        toggleResize('ne', new MouseEvent('mousedown', { clientX: 100, clientY: 100 }), element as unknown as HTMLDivElement);

        handleResize(new MouseEvent('mousemove', { clientX: 600, clientY: 50 }));

        const window = store.getWindow(mockWindow.id);
        expect(window?.yPos).toBe(50); // yPos adjusts upwards
        expect(window?.width).toBe(1000); // Width increases
        expect(window?.height).toBe(350); // Height decreases
    });

    it('resizes northwest (nw) correctly', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement();

        toggleResize('nw', new MouseEvent('mousedown', { clientX: 100, clientY: 100 }), element as unknown as HTMLDivElement);

        handleResize(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }));

        const window = store.getWindow(mockWindow.id);
        expect(window?.xPos).toBe(50); // xPos adjusts left
        expect(window?.yPos).toBe(50); // yPos adjusts upwards
        expect(window?.width).toBe(550); // Width increases
        expect(window?.height).toBe(350); // Height decreases
    });

    it('resizes north (n) correctly', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement();

        toggleResize('north', new MouseEvent('mousedown', { clientX: 100, clientY: 100 }), element as unknown as HTMLDivElement);

        handleResize(new MouseEvent('mousemove', { clientX: 100, clientY: 50 }));

        const window = store.getWindow(mockWindow.id);
        expect(window?.yPos).toBe(50); // yPos adjusts upwards
        expect(window?.height).toBe(450); // Height increases
    });

    it('resizes south (s) correctly', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement();

        toggleResize('south', new MouseEvent('mousedown', { clientX: 100, clientY: 100 }), element as unknown as HTMLDivElement);

        handleResize(new MouseEvent('mousemove', { clientX: 100, clientY: 150 }));

        const window = store.getWindow(mockWindow.id);
        expect(window?.height).toBe(450); // Height increases
    });

    it('resizes east (e) correctly', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement();

        toggleResize('east', new MouseEvent('mousedown', { clientX: 100, clientY: 100 }), element as unknown as HTMLDivElement);

        handleResize(new MouseEvent('mousemove', { clientX: 150, clientY: 100 }));

        const window = store.getWindow(mockWindow.id);
        expect(window?.width).toBe(550); // Width increases
    });

    it('resizes west (w) correctly', () => {
        const { toggleResize, handleResize } = useResizable(mockWindow.id);
        const element = mockElement();

        toggleResize('west', new MouseEvent('mousedown', { clientX: 100, clientY: 100 }), element as unknown as HTMLDivElement);

        handleResize(new MouseEvent('mousemove', { clientX: 50, clientY: 100 }));

        const window = store.getWindow(mockWindow.id);
        expect(window?.xPos).toBe(50); // xPos adjusts left
        expect(window?.width).toBe(550); // Width increases
    });

    it('stops resizing correctly when mouseup is triggered', () => {
        const { toggleResize, stopResize } = useResizable(mockWindow.id);
        const element = mockElement();

        toggleResize('se', new MouseEvent('mousedown', { clientX: 100, clientY: 100 }), element as unknown as HTMLDivElement);

        stopResize();

        const window = store.getWindow(mockWindow.id);
        expect(window?.resizing).toBe(false);
        expect(window?.resizeDirection).toBe('');
    });
});
