import { useWindowsStore } from "@/stores/useWindowsStore";
import { Window } from "@/utils/interfaces";
import { computed, Ref } from "vue";

export function useResizable(id: string) {
    const store = useWindowsStore();
    const currentWindow = computed(() => store.windows.get(id)) as Ref<Window>;
    let rootElement: HTMLDivElement | null = null;

    function getEffectiveBoundaries(parent: HTMLElement) {
        const parentRect = parent.getBoundingClientRect();
        const parentStyle = window.getComputedStyle(parent);

        const paddingLeft = parseInt(parentStyle.paddingLeft, 10);
        const paddingRight = parseInt(parentStyle.paddingRight, 10);
        const paddingTop = parseInt(parentStyle.paddingTop, 10);
        const paddingBottom = parseInt(parentStyle.paddingBottom, 10);
        const borderLeft = parseInt(parentStyle.borderLeftWidth, 10);
        const borderRight = parseInt(parentStyle.borderRightWidth, 10);
        const borderTop = parseInt(parentStyle.borderTopWidth, 10);
        const borderBottom = parseInt(parentStyle.borderBottomWidth, 10);

        return {
            effectiveLeft: parentRect.left + paddingLeft + borderLeft,
            effectiveTop: parentRect.top + paddingTop + borderTop,
            effectiveRight: parentRect.right - paddingRight - borderRight,
            effectiveBottom: parentRect.bottom - paddingBottom - borderBottom
        };
    }

    function adjustSize(dx: number, dy: number, expandRight: boolean, expandDown: boolean) {
        if (!rootElement || !rootElement.parentElement) return;

        const parent = rootElement.parentElement;
        const { effectiveLeft, effectiveTop, effectiveRight, effectiveBottom } = getEffectiveBoundaries(parent);

        let newWidth = currentWindow.value.width + (expandRight ? dx : -dx);
        let newHeight = currentWindow.value.height + (expandDown ? dy : -dy);
        let newX = currentWindow.value.xPos;
        let newY = currentWindow.value.yPos;

        if (!expandRight) {
            newX = Math.max(effectiveLeft, Math.min(currentWindow.value.xPos + dx, currentWindow.value.xPos + currentWindow.value.width - currentWindow.value.minimumWidth));
        }

        if (!expandDown) {
            newY = Math.max(effectiveTop, Math.min(currentWindow.value.yPos + dy, currentWindow.value.yPos + currentWindow.value.height - currentWindow.value.minimumHeight));
        }

        if (newX + newWidth > effectiveRight) {
            newWidth = effectiveRight - newX;
        }
        if (newY + newHeight > effectiveBottom) {
            newHeight = effectiveBottom - newY;
        }

        newWidth = Math.min(Math.max(newWidth, currentWindow.value.minimumWidth), currentWindow.value.maximumWidth);
        newHeight = Math.min(Math.max(newHeight, currentWindow.value.minimumHeight), currentWindow.value.maximumHeight);

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
        if (!element) return; // Avoid setting null elements

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
    };
}
