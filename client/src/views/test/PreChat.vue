<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { api, type Payload } from '../../services/api';
import MarkdownIt from 'markdown-it';


const { t } = useI18n()
const selectedTag = ref<string | null>(null)
const tagsItems = ref<any[]>([])
const loadTag = ref<boolean>(false)
const isLoading = ref<boolean>(false)
const domanda = ref<string | null>(null)
const risposta = ref<string | null>(null)

const loadTags = async () => {
    try {
        loadTag.value = true
        const response = await api({
            url: 'tags', method: 'GET'
        } as Payload)
        if (response) tagsItems.value = response.data.filter((ef: { TAG: string, ACTIVE: 1 | 0 }) => {
            return ef.ACTIVE === 1
        }).map((e: { TAG: string, ACTIVE: 1 | 0 }) => {
            return {
                title: e.TAG,
                value: e.TAG,
            }
        })
    } catch (err) {
        console.log(err)
    } finally {
        loadTag.value = false
    }
}
const md = new MarkdownIt()
const submitMessage = async () => {
    try {
        isLoading.value = true

        const response = await api({
            method: 'POST', url: 'test/prechat', body: {
                input: domanda.value, tag: selectedTag.value
            }

        } as Payload)
        if (response) {
            risposta.value = md.render(response.content)
        }


    } catch (e) {
        console.log(e)

    } finally {
        isLoading.value = false
    }

}
onBeforeMount(() => {
    loadTags()
})

</script>
<template>

    <section class="content-grid">
        <div class="section-heading">
            <div class="d-flex align-center gap-2">
                <v-chip color="secondary" variant="tonal" size="small" class="font-weight-bold">
                    <v-icon icon="mdi-file-document-multiple-outline" size="14" class="mr-1"></v-icon>
                    PreChat
                </v-chip>
            </div>
            <h1>{{ t('prechat.title') }}</h1>
        </div>
        <v-sheet class="panel" rounded="xl" border style="height: max-content">

            <v-autocomplete v-model="selectedTag"  :items="tagsItems" :label="t('home.tag')"
                variant="outlined" density="comfortable" prepend-inner-icon="mdi-tag-multiple-outline"
                hide-details="auto" :loading="loadTag" 
                rounded="lg" clearable class="flex-grow-1" :disabled="isLoading" />

            <div class="d-flex flex-column mt-2 mb-3 ">
                <v-textarea v-model="domanda" :label="t('home.message')" :placeholder="t('home.messagePlaceholder')"
                    variant="outlined" rows="3" auto-grow hide-details="auto" :disabled="isLoading"
                    @keydown.ctrl.enter.prevent="submitMessage" rounded="lg" />

                <div class="d-flex flex-row justify-end mt-2">
                    <div class=" mt-1 mr-3">
                        <v-icon icon="mdi-keyboard-return" size="14" class="mr-1"></v-icon>
                        <span>Press <strong>Ctrl + Enter</strong> to send</span>
                    </div>
                    <v-btn color="primary" :loading="isLoading" append-icon="mdi-send" @click="submitMessage"
                        variant="flat" size="large" class="px-6 font-weight-bold">
                        {{ (isLoading ? t('home.waiting') : t('home.start')) }}
                    </v-btn>
                </div>

            </div>
        </v-sheet>

        <v-sheet class="panel" rounded="xl" border style="height: max-content" v-if="risposta" v-html="risposta">
        </v-sheet>


    </section>


</template>