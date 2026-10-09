<template>
    <v-dialog v-model="model" max-width="840" scrollable>
        <v-card rounded="xl" border>
            <v-card-title class="d-flex align-center justify-space-between py-3 px-4 border-b">
                <div class="d-flex align-center ga-2">
                    <span class="text-subtitle-1 font-weight-bold">Chunks 
                        <strong>{{ fileName ? `(${fileName})` : '' }}</strong>
                    </span>
                </div>
                <div class="d-flex flex-row justify-end">
                    <!--<v-btn icon="mdi-redo-variant" color="error" variant="flat" class="mr-2" size="32" @click="resetChunk"></v-btn>-->
                    <v-btn icon="mdi-close" variant="flat" color="info"  size="32" @click="model = false"></v-btn>
                </div>
            </v-card-title>
            <v-card-text class="pa-4">
                <v-alert v-if="notice" type="success" variant="tonal" density="comfortable" rounded="lg" class="mb-4">
                    {{ notice }}
                </v-alert>
                <v-list density="compact" class="pa-4">
                    <v-list-item border rounded="5" v-for="(e, i) of list" :key="i" class="pa-2 mb-4">
                        <v-list-item-title class="mb-2 pa-3"><span
                                style="font-weight: 700;border-bottom: 1px solid;">Chunk
                                nr. {{ i + 1
                                }}</span><br />
                        </v-list-item-title>
                        <span v-html="e"></span>
                    </v-list-item>
                </v-list>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>
<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import { onUpdated, ref, watch } from 'vue'
import { api, type Payload } from '../services/api';
import { useI18n } from "vue-i18n";


const notice = ref<string | null>(null)
const { t } = useI18n();
const props = defineProps({
    item: {
        type: [String, null], required: true
    },
    fileId: {
        type: [Number, null], required: true
    },
    fileName:{
        type:[String,null], required:false, default: null
    }
})

const model = defineModel<boolean>({ default: false })

const resetChunk = async () => {
    try {
        if (!props.fileId) throw new Error("Not file reset")
        const response = await api({
            method: 'GET',
            url: `rag/reset/${props.fileId}`

        } as Payload)
        if (response) {
            notice.value = t("rag.notice")
            setTimeout(() => {
                model.value = false
                notice.value = null
            }, 5000)
        }

    } catch (e: any) {
        console.log('eccezione reset chunks', e)
    }

}

const list = ref<any[]>([])
const mdRender = new MarkdownIt({ html: false });

watch(() => props.item, (v) => {
    if (v) {
        list.value = v.split('~').map((t: string) => {
            return mdRender.render(t)
        }).slice(0,30)
    }
})


</script>