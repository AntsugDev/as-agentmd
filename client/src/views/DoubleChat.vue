<script setup lang="ts">
import {computed, inject, onMounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import type {AiModel, ChatMessage} from '../types/chat'
import {api, type Payload} from "../services/api.ts";
import MarkdownIt from "markdown-it";
import {filterItems} from "vuetify/lib/composables/filter";

const {t} = useI18n()
const isLoading = ref(false)
let messages = ref<any>({})
let errors = ref<any>({})
let errorGeneral = ref<null|string>(null)
const selectedModel = ref([])
const prompt = ref(null)
const modelItems = ref([])
const loadModel = ref(false)
const standard = ref({
  status: 'init',
  next: {},
})
const validate = computed(() => {
  let error = 0;
  tError.value = {
    is: false, text: ""
  }
  if (selectedModel.value.length !== 2)
    error++
  if (!prompt) {
    tError.value = {
      is: true, text: t('double_chat.required')
    }
    error++
  }
  return error === 0
})

const submitMessage = async () => {
  //todo
  try {
    errorGeneral.value = null
    isLoading.value = true;
    const f = new FormData()
    if (validate.value) {

      const url = `chat/compare/${standard.value.status}`

      let body = {
        message: prompt.value,
        models: selectedModel.value,
        next: (Object.keys(standard.value.next).length > 0 ? standard.value.next : null)
      }

      let payload = {
        url: url, method: 'POST', body: body
      } as Payload
      const response = await api(payload)
      if (response) {
        standard.value.status = 'next'
        response.data.map((e: {
          uuid: string | null,
          model: string,
          name_file: string | null,
          msg: string,
          error:string|null
        }) => {
          standard.value.next[e.model] = {
            uuid: e.uuid, nameFile: e.name_file
          }
          messages.value[e.model] = e.msg
          errors.value[e.model]= e.error
        })
        prompt.value = null
      }
    }

  } catch (err: any) {
    console.error("Form submit exc", err)
    // errorGeneral.value = err.response.data?.error ?? t('double_chat.generic')
  } finally {
    isLoading.value = false
  }

}
const clearChats = () => {
  selectedModel.value = []
  messages.value = []
  prompt.value = null

}
const filterModels = ref([])
const loadModels = async () => {
  try {
    loadModel.value = true
    const response = await api({
      url: 'models', method: 'GET'
    } as Payload)
    if (response) {
      modelItems.value = response.data
      filterModels.value = response.data
    }
  } catch (err) {
    console.error(err)
  } finally {
    loadModel.value = false
  }
}
const aError = ref({
  is: false, text: ""
})
const tError = ref({
  is: false, text: ""
})

const verifyModel = () => {
  if (selectedModel.value.length === 0) {
    filterModels.value = modelItems.value
    return
  }
  ;
  if (selectedModel.value.length === 1) {
    const first = selectedModel.value[0]
    let all = modelItems.value
    filterModels.value = all.filter((e: any) => {
      return e.value.toString().indexOf(first?.toString().split('|')[0]) === -1
    })
  }
  if (selectedModel.value.length > 2)
    aError.value = {
      is: true, text: t('double_chat.max')
    }
  else
    aError.value = {
      is: false, text: ""
    }
}
const loading = computed(() => {
  if (aError.value.is) return true;
  else return isLoading.value
})
const getContentHtml = (content: string) => {
  const m = new MarkdownIt({html: true})
  return m.render(content)
}

onMounted(() => {
  loadModels()
})

</script>

<template>
  <section class="content-grid">
    <div class="section-heading">
      <div class="d-flex align-center ga-2">
        <v-chip color="secondary" variant="tonal" size="small" class="font-weight-bold">
          <v-icon icon="mdi-scale-balance" size="14" class="mr-1"></v-icon>
          Model Arena
        </v-chip>
      </div>
      <h1>{{ t('double_chat.title') }}</h1>
      <p>{{ t('double_chat.intro') }}</p>
    </div>

    <!-- Comparison Conversation Panel -->
    <v-sheet class="panel conversation-panel" rounded="xl" border>
      <div class="panel-title">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-compare-horizontal" color="primary"></v-icon>
          <h2>{{ t('home.conversation') }}</h2>
        </div>
      </div>

      <div v-if="Object.keys(messages).length === 0" class="empty-state">
        <v-icon icon="mdi-scale-balance" size="48" class="empty-state-icon mb-2"></v-icon>
        <div class="font-weight-bold text-subtitle-1 text-grey-darken-2">
          {{ t('home.emptyConversation') }}
        </div>
        <small class="text-grey-darken-1">Seleziona 2 modelli e invia un messaggio per confrontare le risposte.</small>
      </div>

      <v-skeleton-loader v-if="isLoading && Object.keys(messages).length === 0" type="article, actions" rounded="xl"/>
      
      <template v-else>
        <div class="d-flex flex-column flex-md-row justify-space-between ga-4">
          <template v-for="(data, model) in messages" :key="model">
            <v-card class="comparison-column flex-1-1 pa-4 border shadow-sm" rounded="xl">
              <!-- Model Header Badge -->
              <div class="d-flex align-center justify-space-between pb-3 border-b mb-3">
                <v-chip color="primary" variant="flat" class="font-weight-bold" rounded="lg">
                  <v-icon icon="mdi-chip" size="16" class="mr-1"></v-icon>
                  {{ model }}
                </v-chip>
                <v-chip size="x-small" color="secondary" variant="tonal">Model Output</v-chip>
              </div>

              <v-alert color="error" v-if="errors[model]" density="comfortable" type="error" variant="tonal" rounded="lg" class="mb-3">
                {{ errors[model] }}
              </v-alert>

              <div class="message-list" v-for="(message, idx) in data" :key="idx" v-else>
                <div
                    v-if="message.role !== 'system'"
                    class="message-item mb-3"
                    :class="`message-item--${message.role}`"
                >
                  <div class="message-bubble__header">
                    <span class="message-author-dot"></span>
                    <strong>{{ message.role === 'user' ? t('home.user') : t('home.agent') }}</strong>
                  </div>
                  <div class="message-content" v-html="getContentHtml(message.content)"></div>
                </div>
              </div>
            </v-card>
          </template>
        </div>
      </template>
    </v-sheet>

    <!-- Controls & Prompt Card -->
    <v-sheet class="panel chat-panel pa-5" rounded="xl" border>
      <v-alert v-if="errorGeneral" type="error" variant="tonal" density="comfortable" rounded="lg" closable class="mb-4" @click:close="errorGeneral = null">
        {{ errorGeneral }}
      </v-alert>

      <!-- Model Selector -->
      <div class="mb-4">
        <v-autocomplete
            clearable
            v-model="selectedModel"
            :model-value="selectedModel"
            multiple
            :items="filterModels"
            item-title="text"
            item-value="value"
            :label="t('home.model')"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-chip"
            hide-details="auto"
            :loading="loadModel"
            chips
            closable-chips
            :error="aError.is"
            :error-messages="aError.text"
            @update:modelValue="verifyModel"
            rounded="lg"
        />
        <div class="text-caption text-grey-darken-1 mt-2 ml-1 d-flex align-center ga-1">
          <v-icon icon="mdi-information-outline" size="14"></v-icon>
          <span>Seleziona esattamente 2 modelli da mettere a confronto.</span>
        </div>
      </div>

      <!-- Textarea Input -->
      <div class="mb-4">
        <v-textarea
            v-model="prompt"
            :label="t('home.message')"
            :placeholder="t('home.messagePlaceholder')"
            variant="outlined"
            rows="3"
            auto-grow
            hide-details="auto"
            :disabled="isLoading"
            :error="tError.is"
            :error-messages="tError.text"
            rounded="lg"
            @keydown.ctrl.enter.prevent="submitMessage"
        />
      </div>

      <!-- Action Buttons Bar -->
      <div class="d-flex flex-row justify-end align-center ga-3 pt-3 border-t">
        <v-btn
            color="error"
            :loading="isLoading"
            :disabled="loading"
            prepend-icon="mdi-refresh"
            @click="clearChats"
            variant="tonal"
            :title="t('home.clear')"
            class="px-4"
        >
          {{ t('home.clear') }}
        </v-btn>

        <v-btn
            color="primary"
            :loading="isLoading"
            :disabled="loading"
            append-icon="mdi-send"
            @click="submitMessage"
            variant="flat"
            size="large"
            class="px-6 font-weight-bold"
            :title="(isLoading ? t('home.waiting') : t('home.start'))"
        >
          {{ (isLoading ? t('home.waiting') : t('home.start')) }}
        </v-btn>
      </div>
    </v-sheet>
  </section>
</template>

<style scoped>
.conversation-panel {
  overflow: hidden;
}

.comparison-column {
  background: #f8fafc;
  min-height: 280px;
  max-height: 540px;
  overflow-y: auto;
}

.message-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.message-item--user {
  border-color: #c7d2fe;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
}

.message-bubble__header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
}

.message-author-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.message-content {
  font-size: 0.94rem;
  line-height: 1.6;
}
</style>
