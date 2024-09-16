import { useWindowsStore } from "@/stores/useWindowsStore";
import { Window } from "@/utils/interfaces";
import { computed, Ref } from "vue";

export function useResizable(id: string) {
    const store = useWindowsStore();
    const currentWindow = computed(() => store.windows.get(id)) as Ref<Window>;
    let rootElement: HTMLDivElement | null = null;

    function adjustSize(dx: number, dy: number, expandRight: boolean, expandDown: boolean) {
        const parent = rootElement?.parentElement;
        if (!parent) return;

        const parentRect = parent.getBoundingClientRect();
        const parentStyle = window.getComputedStyle(parent);

        // Extract padding and border values from the parent style
        const paddingLeft = parseInt(parentStyle.paddingLeft, 10);
        const paddingRight = parseInt(parentStyle.paddingRight, 10);
        const paddingTop = parseInt(parentStyle.paddingTop, 10);
        const paddingBottom = parseInt(parentStyle.paddingBottom, 10);
        const borderLeft = parseInt(parentStyle.borderLeftWidth, 10);
        const borderRight = parseInt(parentStyle.borderRightWidth, 10);
        const borderTop = parseInt(parentStyle.borderTopWidth, 10);
        const borderBottom = parseInt(parentStyle.borderBottomWidth, 10);

        // Calculate effective boundaries considering padding and borders
        const effectiveLeftBoundary = parentRect.left + paddingLeft + borderLeft;
        const effectiveTopBoundary = parentRect.top + paddingTop + borderTop;
        const effectiveRightBoundary = parentRect.right - paddingRight - borderRight;
        const effectiveBottomBoundary = parentRect.bottom - paddingBottom - borderBottom;

        let newWidth = currentWindow.value.width + (expandRight ? dx : -dx);
        let newHeight = currentWindow.value.height + (expandDown ? dy : -dy);
        let newX = currentWindow.value.xPos;
        let newY = currentWindow.value.yPos;

        if (!expandRight) {
            newX = Math.max(effectiveLeftBoundary, Math.min(currentWindow.value.xPos + dx, currentWindow.value.xPos + currentWindow.value.width - currentWindow.value.minimumWidth));
        }

        if (!expandDown) {
            newY = Math.max(effectiveTopBoundary, Math.min(currentWindow.value.yPos + dy, currentWindow.value.yPos + currentWindow.value.height - currentWindow.value.minimumHeight));
        }

        // Constrain new dimensions within the parent boundaries
        if (newX + newWidth > effectiveRightBoundary) {
            newWidth = effectiveRightBoundary - newX;
        }
        if (newY + newHeight > effectiveBottomBoundary) {
            newHeight = effectiveBottomBoundary - newY;
        }

        // Constrain the dimensions within the window's max/min sizes
        newWidth = Math.min(Math.max(newWidth, currentWindow.value.minimumWidth), currentWindow.value.maximumWidth);
        newHeight = Math.min(Math.max(newHeight, currentWindow.value.minimumHeight), currentWindow.value.maximumHeight);

        // Update the window position and size
        store.updateWindow(id, {
            xPos: newX,
            yPos: newY,
            width: newWidth,
            height: newHeight
        });
    }

    function handleResize(event: MouseEvent) {
        if (currentWindow.value.resizing) {
            const dx = event.clientX - currentWindow.value.lastMouseX;
            const dy = event.clientY - currentWindow.value.lastMouseY;

            switch (currentWindow.value.resizeDirection) {
                case 'se':
                    adjustSize(dx, dy, true, true);
                    break;
                case 'sw':
                    adjustSize(dx, dy, false, true);
                    break;
                case 'nw':
                    adjustSize(dx, dy, false, false);
                    break;
                case 'ne':
                    adjustSize(dx, dy, true, false);
                    break;
                case 'north':
                    adjustSize(0, dy, false, false);
                    break;
                case 'south':
                    adjustSize(0, dy, false, true);
                    break;
                case 'east':
                    adjustSize(dx, 0, true, true);
                    break;
                case 'west':
                    adjustSize(dx, 0, false, false);
                    break;
            }

            store.updateWindow(id, { lastMouseX: event.clientX, lastMouseY: event.clientY });
        }
    }

    function toggleResize(direction: string, event: MouseEvent, element: HTMLDivElement | null) {
        rootElement = element;
        store.updateWindow(id, { resizing: true, resizeDirection: direction, lastMouseX: event.clientX, lastMouseY: event.clientY });
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize, { once: true });
    }

    function stopResize() {
        store.updateWindow(id, { resizing: false, resizeDirection: '' });
        document.removeEventListener('mousemove', handleResize);
    }

    return {
        toggleResize,
        stopResize,
        handleResize,
    }
}
