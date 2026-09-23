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
const selectedTag = ref<string | null>(null)
const prompt = ref('')
const selectedFile = ref([])
const isLoading = ref(false)
const messages = ref<any[]>([])
const formError = ref('')

const modelItems = ref([])
const tagsItems = ref([])
const dialog = ref<boolean>(false)
const snack = inject('snack')

const loadModel = ref<boolean>(false)
const loadTag = ref<boolean>(false)
const loadTags = async () => {
  try {
    loadTag.value = true
    const response = await api({
      url: 'tags', method: 'GET'
    } as Payload)
    if (response) tagsItems.value = response.data
  } catch (err) {
    console.log(err)
  } finally {
    loadTag.value = false
  }
}
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
const tt = ref<number>(0)
const blockChat = ref(false)

const messageListContainer = ref<HTMLElement | null>(null)

const scrollToBottom = () => {
  setTimeout(() => {
    if (messageListContainer.value) {
      messageListContainer.value.scrollTop = messageListContainer.value.scrollHeight
    }
  }, 100)
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

const submitMessage = async () => {
  formError.value = ''
  blockChat.value = false;
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

  // Optimistically push user prompt & scroll
  const mdRender = new MarkdownIt({html: true});
  messages.value.push({ role: 'user', content: mdRender.render(text) })
  prompt.value = "";
  isLoading.value = true
  scrollToBottom()

  form.append('message', text)
  if (uuid.value)
    form.append('uuid', uuid.value)
  if (time.value)
    form.append('time', time.value)
  selectedFile.value.forEach(e => {
    form.append('files', e)
  })
  if (selectedTag.value)
    form.append('tag', selectedTag.value)
  if (tt.value)
    form.append('tt', tt.value.toString())

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
      let globalMsg: any[] | null = response.data.global
      let errorMsg = globalMsg ? globalMsg.filter(e => {
        return e.content === 'EXCEPTION'
      }) : [];
      if (errorMsg.length > 0) {
        blockChat.value = true;
        formError.value = t('home.block')
      } else {
        messages.value = globalMsg ? globalMsg.map(e => {
          return {role: e.role, content: mdRender.render(e.content)}
        }) : []
        uuid.value = response.data.uuid
        time.value = response.data.time
        status.value = 'next'
        token.value = response.data.t
        tt.value = response.data.tt
        scrollToBottom()
      }
    }
  } catch (e: any) {
    // if (e?.response?.data && e?.response?.data?.error)
    //   formError.value = e.response.data.error
  } finally {
    isLoading.value = false
    scrollToBottom()
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
    blockChat.value = false;
    isLoading.value = true
    messages.value = []
    uuid.value = null
    status.value = 'init'
    nameFile.value = null
    token.value = {
      input: 0, output: 0
    }
    selectedTag.value = null
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
  loadTags()
})
</script>

<template>
  <section class="content-grid">
    <div class="section-heading">
      <div class="d-flex align-center ga-2">
        <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
          <v-icon icon="mdi-creation" size="14" class="mr-1"></v-icon>
          AI Chat
        </v-chip>
      </div>
      <h1>{{ t('home.title') }}</h1>
      <p>{{ t('home.intro') }}</p>
    </div>

    <!-- Conversation Container -->
    <v-sheet class="panel conversation-panel" rounded="xl" border>
      <div class="panel-title">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-forum-outline" color="primary"></v-icon>
          <h2>{{ t('home.conversation') }}</h2>
        </div>
        <v-chip v-if="messages.length > 0" color="primary" size="small" variant="flat" rounded="pill">
          {{ messages.length }} {{ messages.length === 1 ? 'msg' : 'msgs' }}
        </v-chip>
      </div>

      <v-skeleton-loader v-if="isLoading && messages.length === 0" type="article, actions" rounded="xl"/>
      
      <template v-else>
        <div v-if="messages.length === 0" class="empty-state">
          <v-icon icon="mdi-message-text-outline" size="48" class="empty-state-icon mb-2"></v-icon>
          <div class="font-weight-bold text-subtitle-1 text-grey-darken-2">
            {{ t('home.emptyConversation') }}
          </div>
          <small class="text-grey-darken-1">Seleziona un modello in basso e invia la tua domanda.</small>
        </div>

        <div v-else class="message-list" ref="messageListContainer">
          <template v-for="(message, i) in messages" :key="i">
            <div
                v-if="message.role !== 'system'"
                class="message-item"
                :class="`message-item--${message.role}`"
            >
              <div class="message-bubble__header">
                <span class="message-avatar">
                  <v-icon :icon="message.role === 'user' ? 'mdi-account' : 'mdi-robot-outline'" size="14"></v-icon>
                </span>
                <strong>{{ message.role === 'user' ? t('home.user') : t('home.agent') }}</strong>
              </div>
              <div class="message-content" v-html="message.content"></div>
            </div>
          </template>

          <v-skeleton-loader v-if="isLoading" type="paragraph" class="mt-2" rounded="lg"/>
        </div>
      </template>
    </v-sheet>

    <!-- Chat Controls & Prompt Card -->
    <v-sheet class="panel chat-panel pa-5" rounded="xl" border>
      <v-alert v-if="formError" type="error" variant="tonal" density="comfortable" rounded="lg" closable class="mb-4" @click:close="formError = ''">
        {{ formError }}
      </v-alert>

      <!-- Models & Tag Selectors Row -->
      <div class="row-selectors mb-4">
        <v-autocomplete
            v-model="selectedModel"
            :model-value="selectedModel"
            :items="modelItems"
            item-title="text"
            item-value="value"
            :label="t('home.model')"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-chip"
            hide-details="auto"
            :loading="loadModel"
            @update:model-value="changeModel"
            rounded="lg"
            class="flex-grow-1"
        />
        <v-autocomplete
            v-model="selectedTag"
            :model-value="selectedTag"
            :items="tagsItems"
            item-title="TAG"
            item-value="TAG"
            :label="t('home.tag')"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-tag-multiple-outline"
            hide-details="auto"
            :loading="loadTag"
            rounded="lg"
            clearable
            class="flex-grow-1"
        />
      </div>

      <!-- Attached Files Preview -->
      <div class="attached-files-container mb-4" v-if="selectedFile.length > 0">
        <div class="text-caption font-weight-bold mb-2 text-primary d-flex align-center ga-1">
          <v-icon icon="mdi-paperclip" size="14"></v-icon>
          <span>{{ t('home.fileAttached') }}:</span>
        </div>
        <div class="d-flex flex-wrap ga-2">
          <v-chip
              v-for="(e, i) in selectedFile"
              :key="i"
              size="small"
              color="primary"
              variant="tonal"
              closable
              class="ma-1"
              @click:close="selectedFile.splice(i, 1)"
          >
            {{ e.name }}
          </v-chip>
        </div>
      </div>

      <!-- Textarea Input Area -->
      <div class="prompt-input-wrapper mb-4">
        <v-textarea
            v-model="prompt"
            :label="t('home.message')"
            :placeholder="t('home.messagePlaceholder')"
            variant="outlined"
            rows="3"
            auto-grow
            hide-details="auto"
            :disabled="isLoading"
            @keydown.ctrl.enter.prevent="submitMessage"
            rounded="lg"
        />
        <div class="shortcut-tip mt-1">
          <v-icon icon="mdi-keyboard-return" size="14" class="mr-1"></v-icon>
          <span>Press <strong>Ctrl + Enter</strong> to send</span>
        </div>
      </div>

      <!-- Footer Actions & Token Chips -->
      <div class="d-flex flex-column flex-sm-row align-center justify-space-between ga-4 pt-2 border-t mt-2">
        <div class="d-flex align-center ga-2">
          <div class="d-flex align-center ga-2" v-if="(token?.input && token?.output && token.input > 0 && token.output > 0)">
            <span class="token-pill">
              <v-icon icon="mdi-tray-arrow-up" size="12"></v-icon>
              {{ t('home.tokenIn', {t: token.input}) }}
            </span>
            <span class="token-pill">
              <v-icon icon="mdi-tray-arrow-down" size="12"></v-icon>
              {{ t('home.tokenOut', {t: token.output}) }}
            </span>
          </div>
        </div>

        <div class="d-flex align-center ga-3 w-100 w-sm-auto justify-end">
          <v-btn
              color="error"
              :loading="isLoading"
              prepend-icon="mdi-message-plus-outline"
              @click="archivia"
              :disabled="messages.length === 0"
              variant="tonal"
              :title="t('home.clear')"
              class="px-4"
          >
            {{ t('home.clear') }}
          </v-btn>

          <v-btn
              v-if="isAttachement"
              color="secondary"
              :loading="isLoading"
              @click="openDialog"
              prepend-icon="mdi-file-document-plus-outline"
              variant="tonal"
              :title="t('home.file')"
              :disabled="blockChat"
              class="px-4"
          >
            {{ t('home.file') }}
          </v-btn>

          <v-btn
              color="primary"
              :loading="isLoading"
              append-icon="mdi-send"
              @click="submitMessage"
              variant="flat"
              size="large"
              class="px-6 font-weight-bold"
              :disabled="blockChat"
          >
            {{ (isLoading ? t('home.waiting') : t('home.start')) }}
          </v-btn>
        </div>
      </div>

      <!-- Privacy Notice Footer -->
      <div class="d-flex align-center ga-1 text-grey-darken-1 text-caption mt-3 pt-2 border-t">
        <v-icon icon="mdi-shield-check-outline" size="14" color="grey"></v-icon>
        <span class="privacy-text">{{ t('privacy') }}</span>
      </div>
    </v-sheet>

    <!-- File Upload Dialog -->
    <v-dialog v-model="dialog" persistent max-width="520">
      <v-card rounded="xl" border class="elevation-6">
        <v-card-title class="d-flex align-center justify-space-between py-3 px-4 border-b">
          <div class="d-flex align-center gap-2">
            <v-icon icon="mdi-cloud-upload-outline" color="primary"></v-icon>
            <span class="text-subtitle-1 font-weight-bold">{{ t('home.file') }}</span>
          </div>
          <v-btn size="32" icon="mdi-close" variant="text" color="grey" @click="closeDialog"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <v-alert variant="tonal" rounded="lg" class="mb-3" density="comfortable" v-if="errorAccept" color="warning" icon="mdi-alert">
            {{ t('home.accept', {format: accept}) }}
          </v-alert>

          <v-file-upload
              density="comfortable"
              browse-text="Upload Files"
              icon="mdi-cloud-upload"
              title="Drag & drop files here"
              clearable
              inset-file-list
              multiple
              show-size
              v-model="selectedFile"
              @update:modelValue="closeDialog"
          />
        </v-card-text>

        <v-card-actions class="pa-3 border-t justify-end">
          <v-btn variant="text" color="grey" @click="closeDialog">Chiudi</v-btn>
          <v-btn variant="flat" color="primary" @click="closeDialog">Conferma</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<style scoped>
.conversation-panel {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.conversation-panel .message-list {
  gap: 16px;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 4px;
}

.message-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 20px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.message-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.15);
  color: #2563eb;
}

.message-item--assistant {
  align-self: flex-start;
  width: min(100%, 940px);
  border-top-left-radius: 4px;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #4f46e5;
  background: #ffffff;
}

.message-item--assistant .message-avatar {
  background: rgba(79, 70, 229, 0.12);
  color: #4f46e5;
}

.message-item--user {
  align-self: flex-end;
  width: min(85%, 720px);
  border-top-right-radius: 4px;
  border: 1px solid #c7d2fe;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
}

.message-item--user .message-avatar {
  background: rgba(79, 70, 229, 0.2);
  color: #3730a3;
}

.row-selectors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.attached-files-container {
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.prompt-input-wrapper {
  position: relative;
}

.shortcut-tip {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 4px;
  padding-right: 4px;
}

.privacy-text {
  font-size: 0.72rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 768px) {
  .row-selectors {
    grid-template-columns: 1fr;
  }
  
  .message-item--assistant,
  .message-item--user {
    width: 100%;
  }
}
</style>
