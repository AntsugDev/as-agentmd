<template>
    <v-dialog v-model="model" max-width="840" scrollable>
        <v-card rounded="xl" border>
            <v-card-title class="d-flex align-center justify-space-between py-3 px-4 border-b">
                <div class="d-flex align-center ga-2">
                    <span class="text-subtitle-1 font-weight-bold">Chunks</span>
                </div>
                <v-btn icon="mdi-close" variant="text" size="32" @click="model = false"></v-btn>
            </v-card-title>
            <v-list density="compact" class="pa-4">
                <v-list-item border rounded v-for="(e, i) of list" :key="i" class="pa-2 mb-4">
                    <span style="font-weight: 700;margin-bottom: 5px;margin-left: 3px;">{{i+1}}</span><br />
                    <div v-html="e"></div>
                    </v-list-item>
            </v-list>
            <v-card-text class="pa-4">
            </v-card-text>
        </v-card>
    </v-dialog>
</template>
<script setup lang="ts">
import  MarkdownIt  from 'markdown-it';
import { ref,  onMounted } from 'vue'

const props = defineProps({
    item: {
        type: [String, null], required: true
    }
})

const model = defineModel<boolean>({ default: false })
    
const list = ref<any[]>([])
const mdRender = new MarkdownIt({html:false});
onMounted(() => {
    if (props.item){
        list.value = props.item.split('~').map(text => {return mdRender.content(true)} )
}

})
</script>