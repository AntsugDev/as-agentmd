<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {api, type Payload} from "../services/api.ts";
import MarkdownIt from "markdown-it";
import IncorrectRequestExampleModal from './IncorrectRequestExampleModal.vue'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import Chip from 'primevue/chip'
import Dialog from 'primevue/dialog'
import FileUpload from 'primevue/fileupload'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'

const {t} = useI18n()

const props = defineProps({
  recupera: {
    type: Object,
    default: []
  }
})

interface ModelOption {
  text: string
  value: string
}

const selectedModel = ref<string | null>(null)
const modelInput = ref<ModelOption | string | null>(null)
const selectedTag = ref<string | null>(null)
const tagInput = ref<{ title: string, value: string } | string | null>(null)
const prompt = ref('')
const selectedFile = ref<File[]>([])
const isLoading = ref(false)
const messages = ref<any[]>([])
const formError = ref('')

const modelItems = ref<ModelOption[]>([])
const modelSuggestions = ref<ModelOption[]>([])
const tagsItems = ref<{ title: string, value: string }[]>([])
const tagSuggestions = ref<{ title: string, value: string }[]>([])
const dialog = ref<boolean>(false)
const fileUploadKey = ref(0)
const incorrectRequestExampleDialog = ref(false)

const loadModel = ref<boolean>(false)
const loadTag = ref<boolean>(false)
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
    tagSuggestions.value = tagsItems.value
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
      modelSuggestions.value = modelItems.value
      void settingsModel()
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
    if (response) {
      selectedModel.value = response.data.modelSelected
      modelInput.value = modelItems.value.find((item) => item.value === selectedModel.value) ?? null
    }
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

const searchModels = (event: { query: string }) => {
  const query = event.query.trim().toLowerCase()
  modelSuggestions.value = query
    ? modelItems.value.filter((item) => item.text?.toLowerCase().includes(query))
    : modelItems.value
}

const searchTags = (event: { query: string }) => {
  const query = event.query.trim().toLowerCase()
  tagSuggestions.value = query
    ? tagsItems.value.filter((item) => item.title.toLowerCase().includes(query))
    : tagsItems.value
}

const updateModelInput = (value: ModelOption | string | null) => {
  modelInput.value = value
  if (typeof value === 'object' && value) {
    selectedModel.value = value.value
    void changeModel()
  } else {
    selectedModel.value = null
  }
}

const updateTagInput = (value: { title: string, value: string } | string | null) => {
  tagInput.value = value
  selectedTag.value = typeof value === 'object' && value ? value.value : null
}

watch(messages, () => {
  scrollToBottom()
}, {deep: true})

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
  messages.value.push({role: 'user', content: mdRender.render(text)})
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
  if (selectedFile.value.length > 0) {
    selectedFile.value = []
  }
  fileUploadKey.value += 1
  errorAccept.value = false
  dialog.value = true
}

const onFilesSelected = (event: { files: File[] }) => {
  selectedFile.value = event.files
  closeDialog()
}

const closeDialog = () => {
  errorAccept.value = false
  const hasInvalidFile = accept.value.length > 0
    && selectedFile.value.some((file) => !accept.value.includes(file.type))
  if (!hasInvalidFile) {
    dialog.value = false
  } else {
    errorAccept.value = true
    selectedFile.value = []
    fileUploadKey.value += 1
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
    //todo svuota la sessionChat 
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
      <div class="home-heading-badge">
        <span class="home-badge"><i class="mdi mdi-creation" aria-hidden="true"></i>AI Chat</span>
      </div>
      <h1>{{ t('home.title') }}</h1>
      <p>{{ t('home.intro') }}</p>
    </div>

    <!-- Conversation Container -->
    <div class="panel conversation-panel">
      <div class="panel-title">
        <div class="home-panel-heading">
          <i class="mdi mdi-forum-outline home-section-icon" aria-hidden="true"></i>
          <h2>{{ t('home.conversation') }}</h2>
        </div>
        <Tag v-if="messages.length > 0" severity="primary" rounded>
          {{ messages.length }} {{ messages.length === 1 ? 'msg' : 'msgs' }}
        </Tag>
      </div>

      <div v-if="isLoading && messages.length === 0" class="conversation-skeleton" aria-busy="true">
        <Skeleton height="6rem" border-radius="1rem" />
        <Skeleton height="4rem" border-radius="1rem" />
      </div>

      <template v-else>
        <div v-if="messages.length === 0" class="empty-state">
          <i class="mdi mdi-message-text-outline empty-state-icon" aria-hidden="true"></i>
          <div class="empty-state__title">
            {{ t('home.emptyConversation') }}
          </div>
          <small class="empty-state__hint">Seleziona un modello in basso e invia la tua domanda.</small>
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
                  <i :class="['mdi', message.role === 'user' ? 'mdi-account' : 'mdi-robot-outline']" aria-hidden="true"></i>
                </span>
                <strong>{{ message.role === 'user' ? t('home.user') : t('home.agent') }}</strong>
              </div>
              <div class="message-content" v-html="message.content"></div>
            </div>
          </template>

          <div v-if="isLoading" class="message-skeleton" aria-busy="true">
            <Skeleton height="4rem" border-radius="0.75rem" />
          </div>
        </div>
      </template>
    </div>

    <!-- Chat Controls & Prompt Card -->
    <div class="panel chat-panel">
      <Message v-if="formError" severity="error" closable class="chat-error-message" @close="formError = ''">
      <template #closeicon="{ class: iconClass }">
        <i :class="[iconClass, 'mdi', 'mdi-close']" aria-hidden="true"></i>
      </template>
      {{ formError }}
      </Message>

      <!-- Models & Tag Selectors Row -->
      <div class="row-selectors">
        <div class="prime-field">
          <i class="mdi mdi-chip" aria-hidden="true"></i>
          <AutoComplete
            :model-value="modelInput"
            @update:model-value="updateModelInput"
            :suggestions="modelSuggestions"
            option-label="text"
            :placeholder="t('home.model')"
            input-id="chat-model"
            :aria-label="t('home.model')"
            :loading="loadModel"
            loading-icon="mdi mdi-loading mdi-spin"
            :delay="0"
            force-selection
            dropdown
            fluid
            :disabled="isLoading"
            @complete="searchModels"
          >
            <template #dropdownicon="{ class: iconClass }">
              <i :class="[iconClass, 'mdi', 'mdi-chevron-down']" aria-hidden="true"></i>
            </template>
            <template #clearicon>
              <i class="mdi mdi-close" aria-hidden="true"></i>
            </template>
            <template #loadingicon="{ class: iconClass }">
              <i :class="[iconClass, 'mdi', 'mdi-loading', 'mdi-spin']" aria-hidden="true"></i>
            </template>
          </AutoComplete>
        </div>
        <div class="prime-field">
          <i class="mdi mdi-tag-multiple-outline" aria-hidden="true"></i>
          <AutoComplete
            :model-value="tagInput"
            @update:model-value="updateTagInput"
            :suggestions="tagSuggestions"
            option-label="title"
            :placeholder="t('home.tag')"
            input-id="chat-tag"
            :aria-label="t('home.tag')"
            :loading="loadTag"
            loading-icon="mdi mdi-loading mdi-spin"
            :delay="0"
            force-selection
            dropdown
            show-clear
            fluid
            :disabled="isLoading"
            @complete="searchTags"
          >
            <template #dropdownicon="{ class: iconClass }">
              <i :class="[iconClass, 'mdi', 'mdi-chevron-down']" aria-hidden="true"></i>
            </template>
            <template #clearicon>
              <i class="mdi mdi-close" aria-hidden="true"></i>
            </template>
            <template #loadingicon="{ class: iconClass }">
              <i :class="[iconClass, 'mdi', 'mdi-loading', 'mdi-spin']" aria-hidden="true"></i>
            </template>
          </AutoComplete>
        </div>
      </div>

      <div v-if="selectedTag" class="tag-detail-reminder">
        <i class="mdi mdi-information-outline" aria-hidden="true"></i>
        <span>{{ t('home.tagDetailReminder') }}</span>
        <Button
          :label="t('home.incorrectRequestExample.open')"
          icon="mdi mdi-open-in-new"
          text
          size="small"
          @click="incorrectRequestExampleDialog = true"
        >
        </Button>
      </div>

      <!-- Attached Files Preview -->
      <div class="attached-files-container" v-if="selectedFile.length > 0">
        <div class="attached-files-label">
          <i class="mdi mdi-paperclip" aria-hidden="true"></i>
          <span>{{ t('home.fileAttached') }}:</span>
        </div>
        <div class="attached-file-list">
          <Chip
            v-for="(file, i) in selectedFile"
            :key="`${file.name}-${i}`"
            :label="file.name"
            :title="t('home.removeFile', {name: file.name})"
            removable
            class="attached-file-chip"
            @remove="selectedFile.splice(i, 1)"
          >
            <template #removeicon>
              <i class="mdi mdi-close" aria-hidden="true"></i>
            </template>
          </Chip>
        </div>
      </div>

      <!-- Textarea Input Area -->
      <div class="prompt-input-wrapper">
        <label class="sr-only" for="chat-prompt">{{ t('home.message') }}</label>
        <Textarea
            id="chat-prompt"
            v-model="prompt"
            :placeholder="t('home.messagePlaceholder')"
            rows="3"
            auto-resize
            :disabled="isLoading"
            @keydown.ctrl.enter.prevent="submitMessage"
            class="chat-prompt"
        />
        <div class="shortcut-tip">
          <i class="mdi mdi-keyboard-return" aria-hidden="true"></i>
          <span>Press <strong>Ctrl + Enter</strong> to send</span>
        </div>
      </div>

      <!-- Footer Actions & Token Chips -->
      <div class="chat-footer">
        <div class="chat-token-summary">
          <div class="chat-token-list"
               v-if="(token?.input && token?.output && token.input > 0 && token.output > 0)">
            <span class="token-pill">
              <i class="mdi mdi-tray-arrow-up" aria-hidden="true"></i>
              {{ t('home.tokenIn', {t: token.input}) }}
            </span>
            <span class="token-pill">
              <i class="mdi mdi-tray-arrow-down" aria-hidden="true"></i>
              {{ t('home.tokenOut', {t: token.output}) }}
            </span>
          </div>
        </div>

        <div class="chat-actions">
          <Button
            :label="t('home.clear')"
            icon="mdi mdi-message-plus-outline"
            severity="danger"
            outlined
            :loading="isLoading"
            loading-icon="mdi mdi-loading mdi-spin"
            @click="archivia"
            :disabled="messages.length === 0"
            :title="t('home.clear')"
          >
          </Button>

          <Button
            v-if="isAttachement"
            :label="t('home.file')"
            icon="mdi mdi-file-document-plus-outline"
            severity="secondary"
            outlined
            :loading="isLoading"
            loading-icon="mdi mdi-loading mdi-spin"
            @click="openDialog"
            :title="t('home.file')"
            :disabled="blockChat"
          >
          </Button>

          <Button
            :label="isLoading ? t('home.waiting') : t('home.start')"
            icon="mdi mdi-send"
            icon-pos="right"
            :loading="isLoading"
            loading-icon="mdi mdi-loading mdi-spin"
            @click="submitMessage"
            size="large"
            :disabled="blockChat"
          >
          </Button>
        </div>
      </div>

      <!-- Privacy Notice Footer -->
      <div class="privacy-notice">
        <i class="mdi mdi-shield-check-outline privacy-icon" aria-hidden="true"></i>
        <span class="privacy-text">{{ t('privacy') }}</span>
      </div>
    </div>

    <IncorrectRequestExampleModal v-model="incorrectRequestExampleDialog"/>

    <!-- File Upload Dialog -->
    <Dialog
      v-model:visible="dialog"
      modal
      :closable="false"
      :draggable="false"
      :style="{ width: 'min(520px, calc(100vw - 2rem))' }"
      class="file-dialog"
    >
      <template #header>
        <div class="file-dialog__header">
          <div class="file-dialog__title">
            <i class="mdi mdi-cloud-upload-outline" aria-hidden="true"></i>
            <span>{{ t('home.file') }}</span>
          </div>
          <Button
            icon="mdi mdi-close"
            text
            severity="secondary"
            rounded
            :aria-label="t('home.close')"
            @click="closeDialog"
          />
        </div>
      </template>

      <div class="file-dialog__body">
        <Message v-if="errorAccept" severity="warn" class="upload-error-message">
          <template #icon><i class="mdi mdi-alert" aria-hidden="true"></i></template>
          <template #closeicon="{ class: iconClass }">
            <i :class="[iconClass, 'mdi', 'mdi-close']" aria-hidden="true"></i>
          </template>
            {{ t('home.accept', {format: accept}) }}
        </Message>

        <FileUpload
          :key="fileUploadKey"
          mode="advanced"
          :multiple="true"
          :custom-upload="true"
          :show-upload-button="false"
          :show-cancel-button="false"
          :choose-label="t('home.chooseFiles')"
          choose-icon="mdi mdi-cloud-upload"
          :cancel-label="t('home.close')"
          @select="onFilesSelected"
          @clear="selectedFile = []"
          @remove="selectedFile = $event.files"
        >
          <template #chooseicon><i class="mdi mdi-cloud-upload" aria-hidden="true"></i></template>
          <template #cancelicon><i class="mdi mdi-close" aria-hidden="true"></i></template>
          <template #fileremoveicon><i class="mdi mdi-close" aria-hidden="true"></i></template>
          <template #empty>
            <div class="file-upload-empty">
              <i class="mdi mdi-cloud-upload-outline" aria-hidden="true"></i>
              <span>{{ t('home.dragDropFiles') }}</span>
            </div>
          </template>
        </FileUpload>
      </div>

      <template #footer>
        <div class="file-dialog__footer">
          <Button :label="t('home.close')" severity="secondary" text @click="closeDialog" />
          <Button :label="t('home.confirm')" @click="closeDialog" />
        </div>
      </template>
    </Dialog>
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

.home-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 999px;
  color: var(--color-primary);
  background: rgba(79, 70, 229, 0.1);
  font-size: 0.72rem;
  font-weight: 700;
}

.home-section-icon {
  color: var(--color-primary);
  font-size: 1.25rem;
}

.empty-state-icon {
  font-size: 3rem;
}

.conversation-skeleton {
  display: grid;
  gap: 14px;
}

.message-skeleton {
  width: min(100%, 680px);
  margin-top: 8px;
}

.prime-field {
  position: relative;
  min-width: 0;
}

.prime-field > .mdi {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 0.9rem;
  color: #64748b;
  font-size: 1rem;
  pointer-events: none;
  transform: translateY(-50%);
}

.prime-field :deep(.p-autocomplete),
.prime-field :deep(.p-autocomplete-input) {
  width: 100%;
}

.prime-field :deep(.p-autocomplete-input) {
  padding-left: 2.6rem;
}

.chat-prompt {
  width: 100%;
  min-height: 6rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.file-dialog__header {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.file-dialog__title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-main);
  font-size: 1rem;
  font-weight: 700;
}

.file-dialog__title > .mdi {
  color: var(--color-primary);
  font-size: 1.25rem;
}

.file-dialog__body {
  display: grid;
  gap: 12px;
}

.file-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.file-upload-empty {
  display: flex;
  min-height: 100px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-text-muted);
  text-align: center;
}

.file-upload-empty .mdi {
  color: var(--color-primary);
  font-size: 2rem;
}

.attached-file-chip {
  max-width: 100%;
}

.attached-file-chip :deep(.p-chip-label) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.privacy-icon {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 0.875rem;
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
  margin-bottom: 16px;
}

.home-heading-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.home-panel-heading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-state__title {
  color: #334155;
  font-size: 1rem;
  font-weight: 700;
}

.empty-state__hint {
  color: #64748b;
}

.chat-error-message {
  margin-bottom: 16px;
}

.tag-detail-reminder {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
  color: #64748b;
  font-size: 0.78rem;
}

.attached-files-container {
  margin-bottom: 16px;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.attached-files-label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 700;
}

.attached-file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prompt-input-wrapper {
  position: relative;
  margin-bottom: 16px;
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

.chat-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
}

.chat-token-summary,
.chat-token-list,
.chat-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-token-summary {
  width: 100%;
}

.chat-token-list {
  flex-wrap: wrap;
}

.chat-actions {
  width: 100%;
  justify-content: flex-end;
  gap: 12px;
}

.privacy-notice {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
  color: #64748b;
  font-size: 0.75rem;
}

.upload-error-message {
  margin-bottom: 12px;
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

@media (min-width: 600px) {
  .chat-footer {
    flex-direction: row;
  }

  .chat-token-summary {
    width: auto;
  }

  .chat-actions {
    width: auto;
  }
}
</style>
