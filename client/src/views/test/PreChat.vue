<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { api, type Payload } from '../../services/api';
import MarkdownIt from 'markdown-it';
import dayjs from 'dayjs';


const { t } = useI18n()
const selectedTag = ref<string | null>(null)
const tagsItems = ref<any[]>([])
const loadTag = ref<boolean>(false)
const isLoading = ref<boolean>(false)
const domanda = ref<string | null>(null)
const risposta = ref<{ distance: number, content: string }[]>([])
const start = ref<string | null>(null)
const end = ref<string | null>(null)

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
const md = new MarkdownIt({ html: true })
const clear = () => {
    isLoading.value = false
    start.value = null
    end.value = null
}
const minMax = ref<{ min: number | null, max: number | null }>({
    min: null, max: null
})


const submitMessage = async () => {
    try {
        start.value = dayjs().format('HH:mm:ss')
        isLoading.value = true
        risposta.value = []

        const response = await api({
            method: 'POST', url: 'test/prechat', body: {
                input: domanda.value, tag: selectedTag.value
            }

        } as Payload)
        if (response) {
            const data = response.data.map((e: {
                CONTENT: string, distance: number
            }) => {
                return {
                    distance: e.distance.toFixed(3),
                    content: e.CONTENT
                }
            })
            risposta.value = data
            const min = data.reduce((acc, i) => i.value < acc ? i.value : acc, Infinity);
            const max = data.reduce((acc, i) => i.value > acc ? i.value : acc, -Infinity);
            
            end.value = dayjs().format('HH:mm:ss')
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

            <v-autocomplete v-model="selectedTag" :items="tagsItems" :label="t('home.tag')" variant="outlined"
                density="comfortable" prepend-inner-icon="mdi-tag-multiple-outline" hide-details="auto"
                :loading="loadTag" rounded="lg" clearable class="flex-grow-1" :disabled="isLoading" />

            <div class="d-flex flex-column mt-2 mb-3 ">
                <v-textarea v-model="domanda" :label="t('home.message')" :placeholder="t('home.messagePlaceholder')"
                    variant="outlined" rows="3" auto-grow hide-details="auto" :disabled="isLoading" rounded="lg"
                    @update:focused="clear" />

                <div class="d-flex flex-row justify-end mt-2">

                    <v-btn color="primary" :loading="isLoading" append-icon="mdi-send" @click="submitMessage"
                        variant="flat" size="large" class="px-6 font-weight-bold">
                        {{ (isLoading ? t('home.waiting') : t('home.start')) }}
                    </v-btn>
                </div>

            </div>
            <div class="d-flex flex-row justify-between-around pa-2 mb-2">
                <v-btn small variant="outlined" color="warning" class="mr-2" v-if="start">Start: {{ start }}</v-btn>
                <v-btn small variant="outlined" color="success" v-if="end">End: {{ end }}</v-btn>
            </div>
        </v-sheet>


        <v-sheet class="panel" rounded="xl" border style="height: max-content" v-if="risposta.length > 0">
            <v-list denisty="compact">
                <v-list-item v-for="(e, i) in risposta" :key="i" class="pa-1 mb-2" border rounder="5">
                    <v-list-item-title class="mb-2 pa-3"><span style="font-weight: 700;border-bottom: 1px solid;">
                            {{ e.distance }}
                        </span>
                    </v-list-item-title>
                    <code>{{ e.content }}</code>
                </v-list-item>
            </v-list>
        </v-sheet>


    </section>


</template>