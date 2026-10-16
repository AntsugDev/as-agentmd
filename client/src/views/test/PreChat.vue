<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { api, type Payload } from '../../services/api';
import dayjs from 'dayjs';
import Button from 'primevue/button'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'


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
const clear = () => {
    isLoading.value = false
    start.value = null
    end.value = null
    minMax.value = null
    risposta.value = []
}
const minMax = ref<{ min: number | null, max: number | null } | null>(null)

const minMaxItems = (items: any[]) => {
    if (items.length === 0) return null;

    let minItem = items[0];
    let maxItem = items[0];

    for (let i = 1; i < items.length; i++) {
        const item = items[i];
        if (item.distance < minItem.distance) minItem = item;
        if (item.distance > maxItem.distance) maxItem = item;
    }

    return { min: minItem.distance, max: maxItem.distance };
}


const submitMessage = async () => {
    try {
        end.value = null
        minMax.value = null
        risposta.value = []
        start.value = dayjs().format('HH:mm:ss')
        isLoading.value = true



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
                    distance: e.distance,
                    content: e.CONTENT
                }
            })
            risposta.value = data

            minMax.value = minMaxItems(data)
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
            <Tag :value="t('prechat.badge')" icon="mdi mdi-file-document-multiple-outline" severity="secondary" class="prechat-badge" />
            <h1>{{ t('prechat.title') }}</h1>
        </div>
        <section class="panel prechat-form">
            <div class="prechat-field">
                <label class="prechat-field__label" for="prechat-topic">{{ t('home.tag') }}</label>
                <Select
                    v-model="selectedTag"
                    input-id="prechat-topic"
                    :options="tagsItems"
                    option-label="title"
                    option-value="value"
                    :placeholder="t('home.tag')"
                    :loading="loadTag"
                    :disabled="isLoading"
                    show-clear
                    class="prechat-select"
                >
                    <template #dropdownicon><i class="mdi mdi-chevron-down" aria-hidden="true"></i></template>
                    <template #loadingicon><i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i></template>
                </Select>
            </div>

            <div class="prechat-field">
                <label class="prechat-field__label" for="prechat-question">{{ t('home.message') }}</label>
                <Textarea
                    id="prechat-question"
                    v-model="domanda"
                    :placeholder="t('home.messagePlaceholder')"
                    rows="3"
                    auto-resize
                    :disabled="isLoading"
                    class="prechat-textarea"
                    @focus="clear"
                />
                <div class="prechat-actions">
                    <Button
                        :label="isLoading ? t('home.waiting') : t('home.start')"
                        icon="mdi mdi-send"
                        icon-pos="right"
                        :loading="isLoading"
                        :disabled="!domanda || isLoading"
                        @click="submitMessage"
                    />
                </div>
            </div>
            <div v-if="start" class="prechat-timing" aria-live="polite">
                <strong>{{ t('prechat.duration') }}</strong>
                <Tag :value="`${t('prechat.startTime')}: ${start}`" severity="warn" />
                <i v-if="!end" class="mdi mdi-loading mdi-spin prechat-timing__loading" aria-hidden="true"></i>
                <Tag v-if="end" :value="`${t('prechat.endTime')}: ${end}`" severity="success" />
            </div>
        </section>

        <section v-if="risposta.length > 0" class="panel prechat-results">
            <header class="panel-title">
                <div class="prechat-results__heading">
                    <i class="mdi mdi-vector-difference" aria-hidden="true"></i>
                    <h2>{{ t('prechat.results') }}</h2>
                </div>
            </header>

            <div v-if="minMax && minMax.min !== null && minMax.max !== null" class="prechat-metrics">
                <Tag :value="`${t('prechat.minimum')}: ${minMax.min}`" severity="success" />
                <Tag :value="`${t('prechat.maximum')}: ${minMax.max}`" severity="danger" />
                <Tag :value="`${t('prechat.difference')}: ${(minMax.max - minMax.min).toFixed(3)}`" severity="info" />
                <Tag :value="`${t('prechat.similarity')}: ${(1 - minMax.min).toFixed(3)}`" severity="warn" />
            </div>

            <ol class="prechat-results-list">
                <li v-for="(result, index) in risposta" :key="index" class="prechat-result">
                    <header class="prechat-result__header">
                        <strong>{{ t('prechat.distance') }}: {{ result.distance.toFixed(3) }}</strong>
                        <Tag :value="`${t('prechat.resultNumber')} ${index + 1}`" severity="secondary" />
                    </header>
                    <pre>{{ result.content }}</pre>
                </li>
            </ol>
        </section>
    </section>
</template>

<style scoped>
.prechat-badge { width: fit-content; }
.prechat-form,
.prechat-results { display: grid; gap: 18px; }
.prechat-field { display: grid; gap: 8px; }
.prechat-field__label { color: #475569; font-size: 0.875rem; font-weight: 600; }
.prechat-select,
.prechat-textarea { width: 100%; }
.prechat-actions { display: flex; justify-content: flex-end; }
.prechat-timing,
.prechat-metrics { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.prechat-timing { padding-top: 14px; border-top: 1px solid var(--color-border); }
.prechat-timing__loading { color: var(--color-info); }
.prechat-results__heading { display: flex; align-items: center; gap: 8px; }
.prechat-results__heading > .mdi { color: var(--color-primary); font-size: 1.2rem; }
.prechat-results-list { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
.prechat-result { min-width: 0; padding: 14px; border: 1px solid var(--color-border); border-radius: 12px; background: #f8fafc; }
.prechat-result__header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; color: #334155; font-size: 0.82rem; }
.prechat-result pre { margin: 0; color: #475569; font-family: var(--font-mono); font-size: 0.8rem; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
</style>