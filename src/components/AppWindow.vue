<template>
    <div v-show="!currentWindow?.isMinimized" ref="componentRef" class="draggable-resizable bg-gray-600"
        :style="styleObject" @mousedown="focusWindow">
        <div class="flex justify-between bg-[#f0f0f0] p-1.5 cursor-move"
            @mousedown="(event) => toggleDrag(event, componentRef)">
            <div class="w-fit">
                Drag Me Up!
            </div>
            <div class="w-fit">
                <button class="mx-2" @click="minimizeComponent">Minimize</button>
                <button class="mx-2" @click="maximizeComponent">{{ currentWindow.isMaximized ? 'Restore' : 'Maximize'
                    }}</button>
                <button class="mx-2" @click="closeComponent">Close</button>
            </div>
        </div>
        <!-- Dialog Content Area -->
        <div v-if="windowsStore.getDualPaneContent(props.id)" class="p-2 h-full w-full grid grid-cols-3">
            <div class="col-span-1 border border-ts-blue mr-1">
                <ul>
                    <li v-for="(item, itemIndex) in dualPaneContents" :key="itemIndex"
                        @click="windowsStore.setWindowComponent(props.id, item.component)"
                        class="cursor-pointer hover:bg-gray-100">
                        {{ item.label }}
                    </li>
                </ul>
            </div>
            <div class="content-container col-span-2" :class="dynamicClasses">
                <component :is="currentWindow.windowComponent" :key="currentWindow.windowComponentKey"
                    v-bind="currentWindow.windowProps" @add-classes="(classes) => updateDynamicClasses(classes)">
                </component>
            </div>
        </div>
        <!-- Normal Content Area -->
        <div v-else class="content-container" :class="dynamicClasses">
            <component :is="currentWindow.windowComponent" :key="currentWindow.windowComponentKey"
                v-bind="currentWindow.windowProps" @add-classes="(classes) => updateDynamicClasses(classes)">
            </component>
        </div>
        <!-- Corner resizers -->
        <div class="resizer se" @mousedown="event => toggleResize('se', event, componentRef)"></div>
        <div class="resizer sw" @mousedown="event => toggleResize('sw', event, componentRef)"></div>
        <div class="resizer nw" @mousedown="event => toggleResize('nw', event, componentRef)"></div>
        <div class="resizer ne" @mousedown="event => toggleResize('ne', event, componentRef)"></div>
        <!-- Border resizers -->
        <div class="resizer north" @mousedown="event => toggleResize('north', event, componentRef)">
        </div>
        <div class="resizer south" @mousedown="event => toggleResize('south', event, componentRef)">
        </div>
        <div class="resizer east" @mousedown="event => toggleResize('east', event, componentRef)">
        </div>
        <div class="resizer west" @mousedown="event => toggleResize('west', event, componentRef)">
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, onMounted } from 'vue';
import { useWindowsStore } from '@/stores/useWindowsStore';
import { useDraggable } from '@/composables/useDraggable';
import { useResizable } from '@/composables/useResizable';
import { WindowDualPaneContent } from '@/utils/interfaces';

interface Props {
    id: string;
}

const props = withDefaults(defineProps<Props>(), {
    //defaults
});

const componentRef: Ref<HTMLDivElement | null> = ref(null);
const dynamicClasses: Ref<object> = ref({});
const dualPaneContents: Ref<WindowDualPaneContent[] | null> = ref(null);

const windowsStore = useWindowsStore();
const currentWindow = computed(() => windowsStore.windows.get(props.id));
const { toggleResize } = useResizable(props.id);
const { toggleDrag } = useDraggable(props.id);

const styleObject = computed(() => ({
    top: currentWindow.value?.isMaximized ? '0' : `${currentWindow.value?.yPos}px`,
    left: currentWindow.value?.isMaximized ? '0' : `${currentWindow.value?.xPos}px`,
    width: currentWindow.value?.isMaximized ? '100%' : `${currentWindow.value?.width}px`,
    height: currentWindow.value?.isMaximized ? '100%' : `${currentWindow.value?.height}px`,
    zIndex: currentWindow.value?.zIndex,
    //position: currentWindow.value?.isMaximized ? 'fixed' : 'absolute' // Use fixed to cover the whole viewport
}));

function closeComponent() {
    windowsStore.closeWindow(props.id);
}

function maximizeComponent() {
    windowsStore.maximizeWindow(props.id);
}

function minimizeComponent() {
    windowsStore.minimizeWindow(props.id);
}

function focusWindow() {
    windowsStore.focusWindow(props.id);
}

function updateDynamicClasses(classes: object) {
    Object.assign(dynamicClasses.value, classes);
}

function getDualPaneComponent() {
    return windowsStore.getDualPaneContent(props.id);
}

onMounted(() => {
    dualPaneContents.value = getDualPaneComponent();
});
</script>

<style scoped>
.content-container {
    flex: 1;
    overflow: auto;
}

.draggable-resizable {
    position: absolute;
    border: 1px solid black;
    display: flex;
    flex-direction: column;
}

.resizer {
    position: absolute;
    background-color: red;
    cursor: pointer;
}

.se,
.sw,
.nw,
.ne {
    width: 10px;
    height: 10px;
}

.se {
    right: 0;
    bottom: 0;
    cursor: se-resize;
}

.sw {
    left: 0;
    bottom: 0;
    cursor: sw-resize;
}

.nw {
    left: 0;
    top: 0;
    cursor: nw-resize;
}

.ne {
    right: 0;
    top: 0;
    cursor: ne-resize;
}

.north,
.south,
.east,
.west {
    background-color: transparent;
}

.north,
.south {
    left: 0;
    right: 0;
    height: 5px;
}

.north {
    top: 0;
    cursor: n-resize;
}

.south {
    bottom: 0;
    cursor: s-resize;
}

.east,
.west {
    top: 0;
    bottom: 0;
    width: 5px;
}

.east {
    right: 0;
    cursor: e-resize;
}

.west {
    left: 0;
    cursor: w-resize;
}
</style>
