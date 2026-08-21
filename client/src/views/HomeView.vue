<script setup lang="ts">
import {computed, inject, onMounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import type {AiModel, ChatMessage} from '../types/chat'
import {api, type Payload} from "../services/api.ts";
import MarkdownIt from "markdown-it";

const {t} = useI18n()

const props = defineProps({
  recupera: {
    type: Object,
    default: []
  }
})

const models = ref<AiModel[]>([])
const selectedModel = ref<string | null>(null)
const prompt = ref('')
const selectedFile = ref([])
const isLoading = ref(false)
const messages = ref<any[]>([])
const formError = ref('')

const modelItems = ref([])
const dialog = ref<boolean>(false)
const snack = inject('snack')

const loadModel = ref<boolean>(false)
const loadModels = async () => {
  try {
    loadModel.value = true
    const response = await api({
      url: 'models', method: 'GET'
    } as Payload)
    if (response) {
      modelItems.value = response.data
      setTimeout(() => settingsModel(), 1500)
    }
  } catch (err) {
    console.error(err)
  } finally {
    loadModel.value = false
  }
}

const settingsModel = async () => {
  try {
    const response = await api({
      url: 'settings/model', method: 'GET'
    } as Payload)
    if (response) selectedModel.value = response.data.modelSelected
  } catch (e) {
    console.error(e)
  }
}
const status = ref<string>('init')
const uuid = ref<string | null>(null)
const time = ref<string | null>(null)
const nameFile = ref<string | null>(null)
const token = ref<{ input: number, output: number }>({
  input: 0, output: 0
})
const submitMessage = async () => {
  isLoading.value = true
  formError.value = ''
  const form = new FormData()

  if (!selectedModel.value) {
    formError.value = t('home.modelRequired')
    return
  }
  const text = prompt.value.trim()
  if (!text) {
    formError.value = t('home.messageRequired')
    return
  }
  form.append('message', text)
  if (uuid.value)
    form.append('uuid', uuid.value)
  if (time.value)
    form.append('time', time.value)
  selectedFile.value.forEach(e => {
    form.append('files', e)
  })

  try {
    const response = await api({
      url: `chat/${status.value}`,
      method: 'POST',
      body: form,
      queryString: {
        name_file: nameFile.value
      }
    } as Payload)
    if (response && parseInt(response.status) === 423) {
      formError.value = response.data.error
      return;
    }

    if (response) {
      prompt.value = "";
      let globalMsg: any[] | null = response.data.global
      const m = new MarkdownIt({html: true});
      messages.value = globalMsg ? globalMsg.map(e => {
        return {role: e.role, content: m.render(e.content)}
      }) : []
      uuid.value = response.data.uuid
      time.value = response.data.time
      status.value = 'next'
      token.value = response.data.t
    }
  } catch (e: any) {
    if (e?.response?.data && e?.response?.data?.error)
      formError.value = e.response.data.error
  } finally {
    isLoading.value = false
  }
}
const openDialog = () => {
  dialog.value = true
  if (selectedFile.value && selectedFile.value?.length > 0)
    selectedFile.value = []
}


const closeDialog = () => {
  let stop = false;
  errorAccept.value = false
  if (accept.value)
    selectedFile.value.map((e: any) => {
      const mimeType = e.type
      if (!accept.value.includes(mimeType)) {
        stop = true;
        return;
      }
    })
  if (!stop)
    dialog.value = false
  else {
    errorAccept.value = true
    selectedFile.value = []
  }
}

const changeModel = async () => {
  try {
    await api({
      url: `select_models/${selectedModel.value?.toString().replace('models/', '')}`,
      method: 'GET'
    } as Payload)

  } catch (e) {
    console.log('eccezione change model', e)
  }
}
const archivia = async () => {
  try {
    isLoading.value = true
    messages.value = []
    uuid.value = null
    status.value = 'init'
    nameFile.value = null
    token.value = {
      input: 0, output: 0
    }
  } catch (err: any) {
    console.error("Archiviazione fallita", err)
  } finally {
    isLoading.value = false
  }
}
watch(() => props.recupera, (v) => {
  if (v) {
    let content = []
    const m = new MarkdownIt({html: true})
    if (v?.data_content)
      content = v.data_content.map((e: { role: string, content: string }) => {
        return {role: e.role, content: m.render(e.content)}
      })
    messages.value = content
    uuid.value = v?.uuid ?? null
    status.value = 'next'
    nameFile.value = v?.name ?? null
    token.value = {
      input: 0, output: 0
    }
  }
})
const accept = ref<string[]>([])
const errorAccept = ref<boolean>(false)
const isAttachement = computed(() => {

  if (selectedModel.value && selectedModel.value.toString().indexOf('mistral') !== -1)
    return false;
  else if (selectedModel.value && selectedModel.value.toString().indexOf('ollama') !== -1)
    return false
  else if (selectedModel.value && selectedModel.value.toString().indexOf('deep') !== -1)
    return false
  else if (selectedModel.value && selectedModel.value.toString().indexOf('claude') !== -1)
    return false
  return true;
})

onMounted(() => {
  loadModels()
})
</script>

<template>
  <section class="content-grid">
    <div class="section-heading">
      <h1>{{ t('home.title') }}</h1>
      <p>{{ t('home.intro') }}</p>
    </div>

    <v-sheet class="panel conversation-panel" rounded="lg" border>

      <div class="panel-title">
        <h2>{{ t('home.conversation') }}</h2>
      </div>
      <v-skeleton-loader v-if="isLoading" type="article, actions"/>
      <template v-else>
        <div v-if="messages.length === 0" class="empty-state">
          {{ t('home.emptyConversation') }}
        </div>

        <div v-else class="message-list">
          <template v-for="(message,i) in messages" :key="i">
            <div
                v-if="message.role !== 'system'"
                class="message-item"
                :class="`message-item--${message.role}`"
            >
              <div class="message-bubble__header">
                <span class="message-author-dot"></span>
                <strong>{{ message.role === 'user' ? t('home.user') : t('home.agent') }}</strong>
              </div>
              <div class="message-content" v-html="message.content"></div>
            </div>
          </template>
        </div>
      </template>
    </v-sheet>
    <v-sheet class="panel chat-panel" rounded="lg" border>
      <div class="d-flex border-b-1 ml-4 flex-column" v-if="selectedFile.length > 0">
        <h6>{{ t('home.fileAttached') }}</h6>
        <ul>
          <li style="font-size: 11px" v-for="(e,i) in selectedFile" :key="i">{{ e.name }}</li>
        </ul>
      </div>
      <v-alert v-if="formError" type="error" variant="tonal" density="comfortable">
        {{ formError }}
      </v-alert>
      <v-textarea
          v-model="prompt"
          :label="t('home.message')"
          :placeholder="t('home.messagePlaceholder')"
          variant="outlined"
          rows="4"
          auto-grow
          hide-details="auto"
          :disabled="isLoading"
          @keydown.ctrl.enter.prevent="submitMessage"
      >

        <template #append>
          <div class="d-flex flex-column ga-2 justify-end" style="align-items: flex-start">

            <v-autocomplete
                v-model="selectedModel"
                :model-value="selectedModel"
                :items="modelItems"
                item-title="text"
                item-value="value"
                :label="t('home.model')"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-brain"
                hide-details="auto"
                :loading="loadModel"
                @update:model-value="changeModel"
            />

            <div class="d-flex flex-column">
              <v-btn
                  color="primary"
                  :loading="isLoading"
                  append-icon="mdi-send"
                  @click="submitMessage"
                  density="compact"
                  variant="elevated"
                  :alt="(isLoading ? t('home.waiting')  : t('home.start'))"
                  :title="(isLoading ? t('home.waiting')  : t('home.start'))"
                  class="mb-3"
              >
                {{ t('home.start') }}
              </v-btn>

              <v-btn
                  v-if="isAttachement"
                  color="secondary"
                  :loading="isLoading"
                  @click="openDialog"
                  append-icon="mdi-plus"
                  variant="elevated"
                  :alt="t('home.file')"
                  :title="t('home.file')"
                  class="mb-3"
              >
                {{ t('home.file') }}
              </v-btn>

              <v-btn
                  color="error"
                  :loading="isLoading"
                  append-icon="mdi-new-box"
                  @click="archivia"
                  :disabled="messages.length === 0"
                  density="compact"
                  variant="elevated"
                  :alt=" t('home.clear')"
                  :title=" t('home.clear')"

              >
                {{ t('home.clear') }}
              </v-btn>
              <div class="d-flex flex-row justify-space-around mt-3 pa-2"
                   v-if="(token?.input && token?.output &&token.input > 0 && token.output > 0)">
                <v-chip color="#CAD5E2" class="mr-2" variant="flat" label>{{ t('home.tokenIn', {t: token.input}) }}
                </v-chip>
                <v-chip color="#90A1B9" variant="flat" label>{{ t('home.tokenOut', {t: token.output}) }}</v-chip>
              </div>

            </div>
          </div>
        </template>

      </v-textarea>

      <div class="input-row">


      </div>

    </v-sheet>

    <v-dialog v-model="dialog" persistent max-width="500">
      <v-card>
        <v-card-title>
          <div class="d-flex flex-row justify-space-between">
            {{ t('home.file') }}
            <v-btn size="30" icon="mdi-close" color="error" @click="closeDialog"></v-btn>
          </div>
        </v-card-title>
        <v-card-text>
          <div class="d-flex flex-column justify-center align-center pa-3">
            <v-alert variant="outlined" rounded="3" class="mb-3" density="compact" v-if="errorAccept"
                     color="warning" type="warning">{{ t('home.accept', {format: accept}) }}
            </v-alert>
            <v-file-upload
                density="comfortable"
                browse-text="Upload Files"
                icon="mdi-upload"
                title="Drag and Drop Here"
                clearable
                inset-file-list
                multiple
                show-size
                v-model="selectedFile"
                @update:modelValue="closeDialog"
            >
              <template #browse>
                <v-btn size="30" icon="mdi-upload" color="success" @click="closeDialog"></v-btn>
              </template>

            </v-file-upload>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </section>
</template>

<style scoped>
.conversation-panel {
  overflow: hidden;
}

.conversation-panel .message-list {
  gap: 16px;
  padding: 2px;
}

.conversation-panel .message-item {
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.message-bubble__header {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 4px;
  color: #526071;
  font-size: 0.78rem;
  letter-spacing: 0;
}

.message-author-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.message-content {
  padding: 14px 16px;
  border: 1px solid #dce5f1;
  border-radius: 8px;
  color: #253044;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(31, 42, 68, 0.06);
  font-size: 0.96rem;
  line-height: 1.6;
  overflow-x: auto;
}

.message-item--assistant {
  align-self: flex-start;
  width: min(100%, 980px);
  min-height: 0;
  max-height: none;
  overflow: visible;
}

.message-item--assistant .message-content {
  border-top-left-radius: 2px;
  background: #ffffff;
}

.message-item--user {
  align-self: flex-end;
  width: min(78%, 760px);
}

.message-item--user .message-bubble__header {
  justify-content: flex-end;
  color: #267365;
}

.message-item--user .message-author-dot {
  order: 2;
}

.message-item--user .message-content {
  border-color: #a7d8ce;
  border-top-right-radius: 2px;
  color: #153b35;
  background: #eefbf7;
}

.message-content :deep(p) {
  margin: 0 0 0.8rem;
}

.message-content :deep(p:last-child),
.message-content :deep(ul:last-child),
.message-content :deep(ol:last-child),
.message-content :deep(pre:last-child),
.message-content :deep(blockquote:last-child) {
  margin-bottom: 0;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  margin: 0 0 0.85rem;
  padding-left: 1.25rem;
}

.message-content :deep(li + li) {
  margin-top: 0.35rem;
}

.message-content :deep(pre) {
  margin: 0.85rem 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: #111827;
  color: #f8fafc;
  overflow-x: auto;
}

.message-content :deep(code) {
  padding: 0.12rem 0.35rem;
  border-radius: 5px;
  background: #e8edf5;
  color: #1f2937;
  font-size: 0.9em;
}

.message-content :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
}

.message-content :deep(blockquote) {
  margin: 0.85rem 0;
  padding: 0.1rem 0 0.1rem 0.9rem;
  border-left: 3px solid #94a3b8;
  color: #526071;
}

.message-content :deep(table) {
  width: 100%;
  margin: 0.85rem 0;
  border-collapse: collapse;
  font-size: 0.92rem;
}

.message-content :deep(th),
.message-content :deep(td) {
  padding: 8px 10px;
  border: 1px solid #dce5f1;
  text-align: left;
}

.message-content :deep(th) {
  background: #f8fafc;
  font-weight: 700;
}

@media (max-width: 720px) {
  .message-item--assistant,
  .message-item--user {
    width: 100%;
  }
}
</style>
