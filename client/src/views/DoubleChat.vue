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
const selectedModel = ref([])
const formError = ref(null)
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
  try {
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
      <h1>{{ t('double_chat.title') }}</h1>
      <p>{{ t('double_chat.intro') }}</p>
    </div>

    <v-sheet class="panel conversation-panel" rounded="lg" border>

      <div class="panel-title">
        <h2>{{ t('home.conversation') }}</h2>
      </div>
      <v-skeleton-loader v-if="isLoading" type="article, actions"/>
      <template v-else>
        <div class="d-flex flex-row justify-space-between gap-3">
          <template v-for="(data,model) in messages" :key="model">
            <div class="d-flex flex-column justify-start align-start pa-3 ga-2 mr-3"
                 style="width: 50%;border: 1px solid; border-radius: 6px">
              <v-btn color="info" variant="elevated">
                {{ model }}
              </v-btn>
              <v-alert color="error" v-if="errors[model]" density="compact" type="error">{{errors[model]}}</v-alert>
              <div class="message-list mr-3" v-for="(message,idx) in data" :key="idx" v-else>
                <div
                    v-if="message.role !== 'system'"
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
            </div>
          </template>
        </div>
      </template>
    </v-sheet>
    <v-sheet class="panel chat-panel" rounded="lg" border>

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
          :error="tError.is"
          :error-messages="tError.text"
      >

        <template #details>
          <div class="d-flex flex-row ga-2 justify-space-between">

            <v-autocomplete
                style="width: 600px"
                clearable
                v-model="selectedModel"
                :model-value="selectedModel"
                multiple
                :items="filterModels"
                item-title="text"
                item-value="value"
                :label="t('home.model')"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-brain"
                hide-details="auto"
                :loading="loadModel"
                chips
                closable-chips
                :error="aError.is"
                :error-messages="aError.text"
                @update:modelValue="verifyModel"
            />

            <div class="d-flex flex-column">
              <v-btn
                  color="primary"
                  :loading="isLoading"
                  :disabled="loading"
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
                  color="error"
                  :loading="isLoading"
                  :disabled="loading"
                  append-icon="mdi-new-box"
                  @click="clearChats"
                  density="compact"
                  variant="elevated"
                  :alt=" t('home.clear')"
                  :title=" t('home.clear')"

              >
                {{ t('home.clear') }}
              </v-btn>
            </div>
          </div>
        </template>

      </v-textarea>

      <div class="input-row">


      </div>

    </v-sheet>
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
