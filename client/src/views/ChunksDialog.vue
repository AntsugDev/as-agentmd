<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

const { t } = useI18n()
const props = defineProps<{
  item: string | null
  fileId: number | null
  fileName?: string | null
}>()
const model = defineModel<boolean>({ default: false })
const allChunks = ref<string[]>([])
const list = computed(() => allChunks.value.slice(0, 30))

const downloadChunks = () => {
  if (allChunks.value.length === 0) return

  const content = allChunks.value
    .map((chunk, index) => `${t('rag.chunkNumber', { number: index + 1 })}\n\n${chunk}`)
    .join('\n\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const baseName = (props.fileName || 'chunks')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .trim()
    .replace(/[. ]+$/g, '') || 'chunks'

  link.href = url
  link.download = `${baseName}-chunks.txt`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

watch(() => props.item, (value) => {
  allChunks.value = value ? value.split('~') : []
}, { immediate: true })
</script>

<template>
  <Dialog
    v-model:visible="model"
    modal
    :closable="false"
    :draggable="false"
    :style="{ width: 'min(840px, calc(100vw - 2rem))' }"
    :breakpoints="{ '640px': '100vw' }"
    class="chunks-dialog"
  >
    <template #header>
      <div class="chunks-dialog__header">
        <span class="chunks-dialog__title">
          <i class="mdi mdi-view-grid-outline" aria-hidden="true"></i>
          <span>{{ t('rag.chunks') }}</span>
          <strong v-if="fileName">({{ fileName }})</strong>
        </span>
        <div class="chunks-dialog__actions">
          <Button
            :label="t('rag.downloadChunks')"
            icon="mdi mdi-download"
            outlined
            severity="secondary"
            :disabled="list.length === 0"
            @click="downloadChunks"
          />
          <Button
            icon="mdi mdi-close"
            text
            rounded
            severity="secondary"
            :aria-label="t('rag.close')"
            :title="t('rag.close')"
            @click="model = false"
          />
        </div>
      </div>
    </template>

    <div class="chunks-dialog__content">
      <ol v-if="list.length" class="chunks-list">
        <li v-for="(chunk, index) in list" :key="index" class="chunks-list__item">
          <h3 class="chunks-list__title">{{ t('rag.chunkNumber', { number: index + 1 }) }}</h3>
          <pre class="chunks-list__text">{{ chunk }}</pre>
        </li>
      </ol>
      <div v-else class="chunks-dialog__empty">
        {{ t('rag.noChunks') }}
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.chunks-dialog__header {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 4px;
}

.chunks-dialog__title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #334155;
  font-size: 1rem;
  font-weight: 700;
}

.chunks-dialog__title > .mdi {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #e0e7ff;
  border-radius: 10px;
  background: #eef2ff;
  color: var(--color-primary);
  font-size: 1.1rem;
}

.chunks-dialog__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
}

.chunks-dialog__title strong {
  overflow-wrap: anywhere;
}

.chunks-dialog__content {
  max-height: min(70vh, 680px);
  overflow-y: auto;
  padding: 2px;
}

.chunks-list {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 4px;
  list-style: none;
}

.chunks-list__item {
  min-width: 0;
  padding: 16px 18px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: linear-gradient(145deg, #fff 0%, #fbfcff 100%);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.025);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.chunks-list__item:hover {
  transform: translateY(-1px);
  border-color: #c7d2fe;
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.07);
}

.chunks-list__title {
  display: table;
  margin: 0 0 12px;
  padding: 5px 9px;
  border: 1px solid #e0e7ff;
  border-radius: 999px;
  color: #4338ca;
  background: #eef2ff;
  font-size: 0.78rem;
  font-weight: 700;
}

.chunks-list__text {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  color: #475569;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.55;
}

.chunks-dialog__empty {
  padding: 44px 16px;
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  color: var(--color-text-muted);
  background: #f8fafc;
  text-align: center;
}

.chunks-dialog :deep(.p-dialog-header) {
  padding: 20px 22px 14px;
}

.chunks-dialog :deep(.p-dialog-content) {
  padding: 4px 22px 22px;
}

@media (max-width: 520px) {
  .chunks-dialog__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .chunks-dialog__actions {
    width: 100%;
    justify-content: flex-end;
  }

  .chunks-dialog :deep(.p-dialog-header) {
    padding: 16px 16px 10px;
  }

  .chunks-dialog :deep(.p-dialog-content) {
    padding: 4px 16px 16px;
  }
}
</style>
