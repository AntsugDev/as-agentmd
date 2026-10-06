<script setup lang="ts">
import {computed, inject, onMounted, reactive, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import type {AiModel, UserSettings} from '../types/chat'
import {api, type Payload} from "../services/api.ts";

const {t, locale} = useI18n()

const settings = ref<UserSettings | null>(null)
const apiKeys = reactive<Record<string, string>>({})
const isLoading = ref(true)
const isSyncing = ref(false)
const savingProvider = ref<string | null>(null)
const notice = ref('')
const modelItems = ref<AiModel[]>([]);

const formattedLastUpdated = computed(() => {
  if (!settings.value?.lastUpdated) {
    return '-'
  }

  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(settings.value.lastUpdated))
})

const maskApiKey = (apiKey: string) => {
  if (!apiKey) {
    return '********'
  }

  const tail = apiKey.slice(-4)
  return `************${tail}`
}

const hydrateApiKeys = () => {
  if (settings.value?.providers && Array.isArray(settings.value?.providers))
    settings.value.providers.forEach((provider, key) => {
      apiKeys[key] = provider.apiKey
    })
}
const snack = inject('snack')

const noApiKeyProviders = ['ollama', 'claude-deep-seek', 'openai-deep-seek']
const requiresApiKey = (providerKey: string | number): boolean => {
  if (!providerKey) return true
  const lowerKey = providerKey.toString().toLowerCase().trim()
  return !noApiKeyProviders.includes(lowerKey)
}

const getModelsList = async () => {
  try {
    load.value = true
    const response = await api({
      url: 'models', method: 'GET'
    } as Payload)
    if (response) modelItems.value = response.data
  } catch (e) {
    console.error('eccezione', e)
  } finally {
    load.value = false
  }
}

const loadSettings = async () => {
  isLoading.value = true
  try {
    const r = await api({
      url: 'settings',
      method: 'GET'
    } as Payload)
    if (r) {
      settings.value = r.data
      hydrateApiKeys()
      modelName.value = r.data?.modelSelected ?? null
    }
  } catch (e) {
    console.error('eccezione', e)
  } finally {
    isLoading.value = false
  }
}

const saveApiKey = async (providerName: string, isDelete: boolean = false) => {
  try {
    savingProvider.value = providerName
    const p: Payload = {
      url: `settings/${providerName}`,
      method: isDelete ? 'DELETE' : 'PUT',
      body: isDelete ? null : {
        apikey: apiKeys[providerName]
      }
    } as Payload

    const r = await api(p)
    if (parseInt(r.status) === 201 || parseInt(r.status) === 204) {
      snack.value = {
        view: true,
        msg: isDelete ? t('settings.deleted', {provider: providerName}) : t('settings.saved', {provider: providerName}),
        error: false
      }
      loadSettings()
    }
  } catch (e) {
    console.error('eccezione', e)
  } finally {
    savingProvider.value = null
  }

}

const synchronizeModels = async () => {
  try {
    isSyncing.value = true
    const response = await api({
      url: 'sincro', method: 'GET'
    } as Payload)
    if (response) {
      snack.value = {
        view: true,
        msg: response.data.msg,
        error: false
      }
    }
  } catch (err) {
    console.error('Sincro eccezione', err)
  } finally {
    isSyncing.value = false
  }
}
const modelName = ref<string | null>(null)
const load = ref<boolean>(false)
const changeDefaultModel = async () => {

  try {
    load.value = true
    const r = await api({
      url: `select_models/${modelName.value?.toString().replace('models/', '')}`,
      method: 'GET'

    } as Payload)

    if (parseInt(r.status) === 204) {
      snack.value = {
        view: true, msg: t('settings.up_model', {model: modelName.value})
      }
    }

  } catch (err) {
    console.error('Eccezione salvataggio select models')
  } finally {
    load.value = false
  }

}

const getModels = (providerName: string): AiModel[] | [] => {
  if (typeof providerName !== 'string')
    return []

  if (settings.value?.providers && settings.value?.providers.hasOwnProperty(providerName))
    return settings.value.providers[providerName]?.models ?? []

  return [];
}
const iconView = ref<{
  icon: string, type: string
}>({
  icon: 'mdi-eye', type: 'password'
})
const viewApiKey = () => {
  if (iconView.value.type === 'password')
    iconView.value = {
      icon: 'mdi-eye-off', type: 'text'
    }
  else
    iconView.value = {
      icon: 'mdi-eye', type: 'password'
    }
}
const loadDownload = ref<boolean>(false)
const download = async () => {
  try {
    loadDownload.value = true
    const response = await api({
      url: 'download', method: 'GET', responseType: 'blob'
    } as Payload)
    if (response) {
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download.csv';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

// Pulizia
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }


  } catch
      (err: any) {
    console.error('Eccezione download file ', err)
  } finally {
    loadDownload.value = false
  }
}


onMounted(() => {
  getModelsList()
  loadSettings()
})
</script>

<template>
  <section class="content-grid">
    <div class="section-heading">
      <div class="d-flex align-center gap-2">
        <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
          <v-icon icon="mdi-cog-outline" size="14" class="mr-1"></v-icon>
          Configuration
        </v-chip>
      </div>
      <h1>{{ t('settings.title') }}</h1>
      <p>{{ t('settings.intro') }}</p>
    </div>

    <v-skeleton-loader v-if="isLoading" type="article, actions" rounded="xl"/>

    <template v-else-if="settings">
      <!-- Default Model & Sync Card -->
      <v-sheet class="panel settings-summary" rounded="xl" border>
        <v-row density="comfortable" align="center">
          <v-col cols="12" md="6">
            <v-autocomplete
                :items="modelItems"
                item-title="text"
                item-value="value"
                :label="t('settings.defaultModel')"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-brain"
                append-inner-icon="mdi-check-circle-outline"
                hide-details="auto"
                v-model="modelName"
                :model-value="modelName"
                :loading="load"
                @click:append-inner="changeDefaultModel"
                rounded="lg"
            />
          </v-col>

          <v-col cols="12" sm="6" md="3" class="d-flex align-center gap-2">
            <v-icon icon="mdi-clock-outline" color="grey" size="18"></v-icon>
            <div class="summary-meta">
              <span>{{ t('settings.lastUpdated') }}</span>
              <strong class="text-caption font-weight-bold">{{ formattedLastUpdated }}</strong>
            </div>
          </v-col>

          <v-col cols="12" sm="6" md="3" class="d-flex justify-end">
            <v-btn
                color="secondary"
                variant="flat"
                prepend-icon="mdi-sync"
                :loading="isSyncing"
                @click="synchronizeModels"
                rounded="lg"
                class="font-weight-bold w-100 w-sm-auto"
            >
              {{ isSyncing ? t('settings.syncing') : t('settings.updateModels') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-sheet>

      <v-alert v-if="notice" type="success" variant="tonal" density="comfortable" rounded="lg" closable @click:close="notice = ''">
        {{ notice }}
      </v-alert>

      <!-- Providers Panel -->
      <v-sheet class="panel" rounded="xl" border>
        <div class="panel-title">
          <div class="d-flex align-center gap-2">
            <v-icon icon="mdi-server-network" color="primary"></v-icon>
            <h2>{{ t('settings.providers') }}</h2>
          </div>
          
          <v-btn
              variant="tonal"
              color="primary"
              prepend-icon="mdi-file-export-outline"
              size="small"
              :title="t('settings.download')"
              @click="download"
              :loading="loadDownload"
              rounded="lg"
              class="font-weight-bold"
          >
            Export CSV
          </v-btn>
        </div>

        <v-expansion-panels variant="inset" class="provider-panels">
          <v-expansion-panel v-for="(provider, key) in settings.providers" :key="key" rounded="xl" border class="mb-3">
            <v-expansion-panel-title class="py-3">
              <div class="provider-title">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-api" color="primary" size="20"></v-icon>
                  <strong class="text-subtitle-1">{{ key }}</strong>
                </div>
                <v-chip size="x-small" variant="tonal" :color="requiresApiKey(key) ? 'grey' : 'info'" class="font-mono font-weight-bold">
                  {{ requiresApiKey(key) ? maskApiKey(provider.apiKey) : 'Nessuna API Key richiesta' }}
                </v-chip>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <div class="provider-body pt-2">
                <div class="d-flex flex-column flex-md-row ga-4 align-stretch align-md-center" v-if="requiresApiKey(key)">
                  <v-text-field
                      v-model="apiKeys[key]"
                      :label="t('settings.apiKey')"
                      variant="outlined"
                      density="comfortable"
                      :type="iconView.type"
                      prepend-inner-icon="mdi-key-outline"
                      hide-details="auto"
                      :append-inner-icon="iconView.icon"
                      @click:append-inner="viewApiKey"
                      rounded="lg"
                      class="flex-grow-1"
                  />
                  <div class="d-flex align-center ga-3">
                    <v-btn
                        color="primary"
                        prepend-icon="mdi-content-save-outline"
                        :loading="savingProvider === key"
                        @click="saveApiKey(key)"
                        rounded="lg"
                        class="px-4"
                    >
                      {{ t('settings.saveApiKey') }}
                    </v-btn>
                    <v-btn
                        color="error"
                        variant="tonal"
                        icon="mdi-delete-outline"
                        :loading="savingProvider === key"
                        @click="saveApiKey(key, true)"
                        rounded="lg"
                        :title="t('settings.delApiKey')"
                    />
                  </div>
                </div>

                <!-- Models list for this provider -->
                <div class="models-block mt-4">
                  <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-2 d-flex align-center gap-1">
                    <v-icon icon="mdi-cube-outline" size="16"></v-icon>
                    <span>{{ t('settings.models') }}</span>
                  </h3>

                  <div v-if="getModels(key).length === 0" class="empty-state compact">
                    <span class="text-caption text-grey-darken-1">{{ t('settings.noModels') }}</span>
                  </div>

                  <v-list v-else lines="two" density="comfortable" class="rounded-lg border pa-1">
                    <v-list-item v-for="model in getModels(key)" :key="model.name" class="rounded-lg mb-1">
                      <template #prepend>
                        <v-avatar color="primary" variant="tonal" size="32">
                          <v-icon icon="mdi-brain" size="18"></v-icon>
                        </v-avatar>
                      </template>
                      <v-list-item-title class="font-weight-bold text-body-2">
                        {{ model.displayName ?? model.name }}
                      </v-list-item-title>
                      <v-list-item-subtitle class="text-caption text-grey-darken-1">
                        {{ model.description ?? model.name }}
                      </v-list-item-subtitle>
                      <template #append>
                        <span class="token-pill">
                          <v-icon icon="mdi-counter" size="12" class="mr-1"></v-icon>
                          {{ t('settings.tokens') }}: {{ model.inputTokenLimit ?? '-' }} / {{ model.outputTokenLimit ?? '-' }}
                        </span>
                      </template>
                    </v-list-item>
                  </v-list>
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-sheet>
    </template>
  </section>
</template>

<style scoped>
.provider-title {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-right: 8px;
}

.summary-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
