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
const selectedFile = ref<any[]>([])
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
const nameFile = ref<string|null>(null)
const submitMessage = async () => {
  isLoading.value = true
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
  try {
    const response = await api({
      url: `chat/${status.value}`,
      method: 'POST',
      body: {
        message: prompt.value,
        uuid: uuid.value
      },
      queryString:{
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
      status.value = 'next'
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
  console.log('selectedFile.value', selectedFile.value)
  dialog.value = false
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
    const response = await api({
      url: `archive/${uuid.value}`,
      method: 'GET'
    } as Payload)
    if (parseInt(response.status) === 201) {
      snack.value = {
        error: false,
        msg: t('home.archiviata'),
        view: true
      }
      messages.value = []
      prompt.value = ''
    }

  } catch (err: any) {
    console.error("Archiviazione fallita", err)
  } finally {
    isLoading.value = false
  }
}
watch(() => props.recupera, (v) => {
  if (v) {
    messages.value = v?.data_content ?? []
    uuid.value = v?.uuid ?? null
    status.value = 'next'
    nameFile.value = v?.name ?? null
  }
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
          <div
              v-for="(message,i) in messages"
              :key="i"
              class="message-item"
              :class="`message-item--${message.role}`"
          >
            <template v-if="(message.role !== 'system')">
              <strong>{{ message.role === 'user' ? t('home.user') : t('home.agent') }}: <br/></strong>
              <div v-html="message.content"></div>
            </template>
          </div>
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
                  color="secondary"
                  :loading="isLoading"
                  @click="openDialog"
                  :disabled="true"
                  append-icon="mdi-plus"
                  variant="elevated"
                  :alt="t('home.file')"
                  :title="t('home.file')"
                  class="mb-3"
              >
                {{ t('home.file') }}
              </v-btn>

              <v-btn
                  color="warning"
                  :loading="isLoading"
                  append-icon="mdi-archive"
                  @click="archivia"
                  :disabled="messages.length === 0"
                  density="compact"
                  variant="elevated"
                  :alt=" t('home.archivia')"
                  :title=" t('home.archivia')"

              >
                {{ t('home.archivia') }}
              </v-btn>


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
          >
            <template #browse>
              <v-btn size="30" icon="mdi-upload" color="success" @click="closeDialog"></v-btn>
            </template>

          </v-file-upload>
        </v-card-text>
      </v-card>
    </v-dialog>
  </section>
</template>
