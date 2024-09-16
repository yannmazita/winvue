import { useWindowsStore } from "@/stores/useWindowsStore";
import { Window } from "@/utils/interfaces";
import { computed, Ref } from "vue";

export function useResizable(id: string) {
    const store = useWindowsStore();
    const currentWindow = computed(() => store.windows.get(id)) as Ref<Window>;
    let rootElement: HTMLDivElement | null = null;

    function adjustSize(dx: number, dy: number, expandRight: boolean, expandDown: boolean) {
        const parent = rootElement?.parentElement;
        const parentRect = parent?.getBoundingClientRect();
        const rootRect = rootElement?.getBoundingClientRect();

        if (!parentRect || !rootRect) return;

        // Calculate offsets
        const leftOffset = rootRect.left - parentRect.left;
        const topOffset = rootRect.top - parentRect.top;

        if (currentWindow.value.resizeDirection === 'north') {
            const newHeight = Math.min(Math.max(currentWindow.value.height - dy, currentWindow.value.minimumHeight), currentWindow.value.maximumHeight);
            if (newHeight > currentWindow.value.minimumHeight) {
                const newY = Math.max(0, currentWindow.value.yPos + dy);
                store.updateWindow(id, { yPos: newY, height: newHeight });
            }
        } else {
            let newWidth = Math.min(Math.max(currentWindow.value.width + (expandRight ? dx : -dx), currentWindow.value.minimumWidth), currentWindow.value.maximumWidth);
            let newHeight = Math.min(Math.max(currentWindow.value.height + (expandDown ? dy : -dy), currentWindow.value.minimumHeight), currentWindow.value.maximumHeight);
            let newX = currentWindow.value.xPos;
            let newY = currentWindow.value.yPos;

            if (!expandRight) {
                newX = Math.max(0, Math.min(currentWindow.value.xPos + dx, currentWindow.value.xPos + currentWindow.value.width - currentWindow.value.minimumWidth));
            }

            if (!expandDown) {
                newY = Math.max(0, Math.min(currentWindow.value.yPos + dy, currentWindow.value.yPos + currentWindow.value.height - currentWindow.value.minimumHeight));
            }

            // Ensure the window stays within the parent boundaries, accounting for offsets
            if (newX + newWidth > parentRect.width - leftOffset) {
                newWidth = parentRect.width - leftOffset - newX;
            }
            if (newY + newHeight > parentRect.height - topOffset) {
                newHeight = parentRect.height - topOffset - newY;
            }

            store.updateWindow(id, { xPos: newX, yPos: newY, width: newWidth, height: newHeight });
        }
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
