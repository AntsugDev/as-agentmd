<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MarkdownIt from 'markdown-it'
import Button from 'primevue/button'
import Message from 'primevue/message'
import MultiSelect from 'primevue/multiselect'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { api, type Payload } from '../services/api.ts'

interface ModelOption {
  text: string
  value: string
}

interface ComparisonMessage {
  role: string
  content: string
}

interface ComparisonResult {
  uuid: string | null
  model: string
  name_file: string | null
  msg: ComparisonMessage[]
  error: string | null
}

const { t } = useI18n()
const isLoading = ref(false)
const messages = ref<Record<string, ComparisonMessage[]>>({})
const errors = ref<Record<string, string | null>>({})
const errorGeneral = ref<string | null>(null)
const selectedModel = ref<string[]>([])
const prompt = ref('')
const modelItems = ref<ModelOption[]>([])
const loadModel = ref(false)
const standard = ref<{
  status: 'init' | 'next'
  next: Record<string, { uuid: string | null, nameFile: string | null }>
}>({
  status: 'init',
  next: {},
})
const modelError = ref(false)
const promptError = ref(false)

const validate = computed(() => {
  modelError.value = selectedModel.value.length !== 2
  promptError.value = !prompt.value.trim()
  return !modelError.value && !promptError.value
})

const submitMessage = async () => {
  if (!validate.value || isLoading.value) return

  try {
    errorGeneral.value = null
    isLoading.value = true
    const response = await api({
      url: `chat/compare/${standard.value.status}`,
      method: 'POST',
      body: {
        message: prompt.value,
        models: selectedModel.value,
        next: Object.keys(standard.value.next).length > 0 ? standard.value.next : null,
      },
    } as Payload)

    if (response) {
      standard.value.status = 'next'
      ;(response.data as ComparisonResult[]).forEach((result) => {
        standard.value.next[result.model] = {
          uuid: result.uuid,
          nameFile: result.name_file,
        }
        messages.value[result.model] = result.msg
        errors.value[result.model] = result.error
      })
      prompt.value = ''
    }
  } catch (err) {
    console.error('Errore invio confronto chat', err)
    errorGeneral.value = t('double_chat.generic')
  } finally {
    isLoading.value = false
  }
}

const clearChats = () => {
  selectedModel.value = []
  messages.value = {}
  errors.value = {}
  prompt.value = ''
  standard.value = { status: 'init', next: {} }
  modelError.value = false
  promptError.value = false
  errorGeneral.value = null
}

const loadModels = async () => {
  try {
    loadModel.value = true
    const response = await api({
      url: 'models', method: 'GET'
    } as Payload)
    if (response) modelItems.value = response.data
  } catch (err) {
    console.error('Errore caricamento modelli', err)
  } finally {
    loadModel.value = false
  }
}

const verifyModel = () => {
  modelError.value = selectedModel.value.length > 2
}

const getContentHtml = (content: string) => new MarkdownIt({ html: true }).render(content)
const hasMessages = computed(() => Object.keys(messages.value).length > 0)

onMounted(loadModels)
</script>

<template>
  <section class="content-grid">
    <div class="section-heading">
      <Tag :value="t('double_chat.badge')" icon="mdi mdi-scale-balance" severity="secondary" class="compare-badge" />
      <h1>{{ t('double_chat.title') }}</h1>
      <p>{{ t('double_chat.intro') }}</p>
    </div>

    <section class="panel conversation-panel">
      <header class="panel-title">
        <div class="compare-panel-title">
          <i class="mdi mdi-compare-horizontal" aria-hidden="true"></i>
          <h2>{{ t('home.conversation') }}</h2>
        </div>
      </header>

      <div v-if="!hasMessages && !isLoading" class="empty-state">
        <i class="mdi mdi-scale-balance empty-state-icon" aria-hidden="true"></i>
        <strong>{{ t('home.emptyConversation') }}</strong>
        <small>{{ t('double_chat.selectTwoModels') }}</small>
      </div>

      <div v-if="isLoading && !hasMessages" class="comparison-loading" aria-busy="true">
        <Skeleton height="18rem" border-radius="1rem" />
        <Skeleton height="18rem" border-radius="1rem" />
      </div>

      <div v-else-if="hasMessages" class="comparison-columns">
        <article v-for="(data, model) in messages" :key="model" class="comparison-column">
          <header class="comparison-column__header">
            <Tag :value="model" icon="mdi mdi-chip" severity="primary" />
            <Tag :value="t('double_chat.modelOutput')" severity="secondary" />
          </header>

          <Message v-if="errors[model]" severity="error" class="comparison-error">{{ errors[model] }}</Message>

          <div v-else class="message-list">
            <div
              v-for="(message, index) in data"
              v-show="message.role !== 'system'"
              :key="index"
              class="message-item"
              :class="`message-item--${message.role}`"
            >
              <div class="message-bubble__header">
                <span class="message-author-dot"></span>
                <strong>{{ message.role === 'user' ? t('home.user') : t('home.agent') }}</strong>
              </div>
              <div class="message-content" v-html="getContentHtml(message.content)"></div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="panel chat-panel">
      <Message v-if="errorGeneral" severity="error" closable class="comparison-general-error" @close="errorGeneral = null">
        {{ errorGeneral }}
      </Message>

      <div class="compare-model-field">
        <label class="compare-field-label" for="compare-model">{{ t('home.model') }}</label>
        <MultiSelect
          v-model="selectedModel"
          input-id="compare-model"
          :options="modelItems"
          option-label="text"
          option-value="value"
          filter
          :placeholder="t('home.model')"
          :loading="loadModel"
          :disabled="loadModel || isLoading"
          :selection-limit="2"
          :max-selected-labels="2"
          display="chip"
          class="compare-model-select"
          @update:model-value="verifyModel"
        >
          <template #dropdownicon><i class="mdi mdi-chevron-down" aria-hidden="true"></i></template>
          <template #loadingicon><i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i></template>
          <template #filtericon><i class="mdi mdi-magnify" aria-hidden="true"></i></template>
          <template #headercheckboxicon="{ checked }"><i class="mdi" :class="checked ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'" aria-hidden="true"></i></template>
          <template #itemcheckboxicon="{ checked }"><i class="mdi" :class="checked ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'" aria-hidden="true"></i></template>
        </MultiSelect>
        <Message v-if="modelError" severity="error" size="small" variant="simple">{{ t('double_chat.max') }}</Message>
        <small class="compare-help"><i class="mdi mdi-information-outline" aria-hidden="true"></i>{{ t('double_chat.selectTwoModels') }}</small>
      </div>

      <div class="compare-prompt-field">
        <label class="compare-field-label" for="compare-prompt">{{ t('home.message') }}</label>
        <Textarea
          id="compare-prompt"
          v-model="prompt"
          :placeholder="t('home.messagePlaceholder')"
          rows="3"
          auto-resize
          :disabled="isLoading"
          :invalid="promptError"
          @update:model-value="promptError = false"
          @keydown.ctrl.enter.prevent="submitMessage"
        />
        <Message v-if="promptError" severity="error" size="small" variant="simple">{{ t('double_chat.required') }}</Message>
      </div>

      <footer class="compare-actions">
        <Button
          :label="t('home.clear')"
          icon="mdi mdi-refresh"
          severity="danger"
          outlined
          :loading="isLoading"
          :disabled="isLoading"
          :title="t('home.clear')"
          @click="clearChats"
        />
        <Button
          :label="isLoading ? t('home.waiting') : t('home.start')"
          icon="mdi mdi-send"
          icon-pos="right"
          :loading="isLoading"
          :disabled="isLoading || selectedModel.length !== 2 || !prompt.trim()"
          :title="isLoading ? t('home.waiting') : t('home.start')"
          @click="submitMessage"
        />
      </footer>
    </section>
  </section>
</template>

<style scoped>
.compare-badge { width: fit-content; }
.comparison-error { margin-bottom: 12px; }
.comparison-general-error { margin-bottom: 16px; }
.compare-panel-title { display: flex; align-items: center; gap: 9px; }
.compare-panel-title > .mdi { color: var(--color-primary); font-size: 1.2rem; }
.comparison-columns,
.comparison-loading { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.comparison-column {
  min-width: 0;
  min-height: 280px;
  max-height: 540px;
  padding: 16px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: #f8fafc;
}
.comparison-column__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}
.comparison-column__header :deep(.p-tag:first-child) { max-width: 70%; overflow-wrap: anywhere; }
.message-list { display: flex; flex-direction: column; gap: 12px; }
.message-item { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; border: 1px solid var(--color-border); border-radius: 12px; background: #fff; }
.message-item--user { border-color: #c7d2fe; background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); }
.message-bubble__header { display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 0.78rem; }
.message-author-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.message-content { font-size: 0.9rem; line-height: 1.6; overflow-wrap: anywhere; }
.compare-model-field,
.compare-prompt-field { display: grid; gap: 8px; margin-bottom: 18px; }
.compare-field-label { color: #475569; font-size: 0.875rem; font-weight: 600; }
.compare-model-select,
.compare-prompt-field :deep(.p-textarea) { width: 100%; }
.compare-help { display: flex; align-items: center; gap: 5px; color: var(--color-text-muted); font-size: 0.78rem; }
.compare-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px; border-top: 1px solid var(--color-border); }
@media (max-width: 760px) {
  .comparison-columns,
  .comparison-loading { grid-template-columns: 1fr; }
  .comparison-column { max-height: 460px; }
}
@media (max-width: 480px) {
  .compare-actions { align-items: stretch; flex-direction: column-reverse; }
  .compare-actions :deep(.p-button) { justify-content: center; }
}
</style>
