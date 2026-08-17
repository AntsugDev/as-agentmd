<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import type {AiModel, ChatMessage} from '../types/chat'
import {api, type Payload} from "../services/api.ts";

const {t} = useI18n()

const models = ref<AiModel[]>([])
const selectedModel = ref<string | null>(null)
const prompt = ref('')
const selectedFile = ref<File | File[] | null>(null)
const isLoading = ref(false)
const messages = ref<ChatMessage[]>([])
const formError = ref('')

const modelItems = ref([])

const attachedFile = computed(() => {
  if (Array.isArray(selectedFile.value)) {
    return selectedFile.value[0] ?? null
  }

  return selectedFile.value
})

const canSend = computed(() => Boolean(selectedModel.value && prompt.value.trim()) && !isLoading.value)
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

const submitMessage = async () => {
  formError.value = ''

  if (!selectedModel.value) {
    formError.value = t('home.modelRequired')
    return
  }

  const text = prompt.value.trim()
  if (!text) {
    formError.value = t('home.messageRequired')
    return
  }

  const file = attachedFile.value
  messages.value.push({
    id: crypto.randomUUID(),
    role: 'user',
    text,
    fileName: file?.name,
  })

  prompt.value = ''
  selectedFile.value = null
  isLoading.value = true

  try {
    const response = null;
    // const response = await sendChatMessage({
    //   model: selectedModel.value,
    //   prompt: text,
    //   file,
    // })

    // messages.value.push({
    //   id: crypto.randomUUID(),
    //   role: 'agent',
    //   text: response.answer,
    // })
  } finally {
    isLoading.value = false
  }
}

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

    <v-sheet class="panel chat-panel" rounded="lg" border>
      <v-autocomplete
          v-model="selectedModel"
          :model-value="selectedModel"
          :items="modelItems"
          item-title="text"
          item-value="value"
          :label="t('home.model')"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-brain"
          hide-details="auto"
          :loading="loadModel"
      />

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
      />

      <div class="input-row">
        <v-file-input
            v-model="selectedFile"
            :label="t('home.attachment')"
            variant="outlined"
            density="comfortable"
            prepend-icon=""
            prepend-inner-icon="mdi-paperclip"
            hide-details="auto"
            :disabled="isLoading"
        />
        <v-btn
            color="primary"
            size="large"
            min-width="132"
            :loading="isLoading"
            :disabled="!canSend"
            prepend-icon="mdi-send"
            @click="submitMessage"
        >
          {{ isLoading ? t('home.waiting') : t('home.start') }}
        </v-btn>
      </div>

      <v-progress-linear
          v-if="isLoading"
          color="primary"
          height="6"
          indeterminate
          rounded
          :aria-label="t('home.waiting')"
      />

      <v-alert v-if="formError" type="warning" variant="tonal" density="comfortable">
        {{ formError }}
      </v-alert>
    </v-sheet>

    <v-sheet class="panel conversation-panel" rounded="lg" border>
      <div class="panel-title">
        <h2>{{ t('home.conversation') }}</h2>
      </div>

      <div v-if="messages.length === 0" class="empty-state">
        {{ t('home.emptyConversation') }}
      </div>

      <div v-else class="message-list">
        <article
            v-for="message in messages"
            :key="message.id"
            class="message-item"
            :class="`message-item--${message.role}`"
        >
          <strong>{{ message.role === 'user' ? t('home.user') : t('home.agent') }} &gt;</strong>
          <span>{{ message.text }}</span>
          <small v-if="message.fileName">{{ t('home.fileAttached') }}: {{ message.fileName }}</small>
        </article>
      </div>
    </v-sheet>
  </section>
</template>
