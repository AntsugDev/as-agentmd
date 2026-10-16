<script setup lang="ts">
import { ref, watch } from 'vue'
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
const list = ref<string[]>([])

watch(() => props.item, (value) => {
  list.value = value ? value.split('~').slice(0, 30) : []
}, { immediate: true })
</script>

<template>
  <Dialog
    v-model:visible="model"
    modal
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
  color: var(--color-primary);
  font-size: 1.2rem;
}

.chunks-dialog__title strong {
  overflow-wrap: anywhere;
}

.chunks-dialog__content {
  max-height: min(70vh, 680px);
  overflow-y: auto;
}

.chunks-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 4px;
  list-style: none;
}

.chunks-list__item {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: #fff;
}

.chunks-list__title {
  display: inline-block;
  margin-bottom: 10px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--color-border);
  color: #334155;
  font-size: 0.9rem;
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
  padding: 28px 12px;
  color: var(--color-text-muted);
  text-align: center;
}
</style>
