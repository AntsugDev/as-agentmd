<script setup lang="ts">
import {computed, inject, onMounted, reactive, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import type {AiModel, ProviderConfig, UserSettings} from '../types/chat'
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


onMounted(() => {
  getModelsList()
  loadSettings()
})
</script>

<template>
  <section class="content-grid">
    <div class="section-heading">
      <h1>{{ t('settings.title') }}</h1>
      <p>{{ t('settings.intro') }}</p>
    </div>

    <v-skeleton-loader v-if="isLoading" type="article, actions"/>

    <template v-else-if="settings">
      <v-sheet class="panel settings-summary" rounded="lg" border>
        <v-autocomplete
            :items="modelItems"
            item-title="text"
            item-value="value"
            :label="t('settings.defaultModel')"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-brain"
            append-inner-icon="mdi-pencil"
            hide-details="auto"
            v-model="modelName"
            :model-value="modelName"
            :loading="load"
            @click:append-inner="changeDefaultModel"
        >
        </v-autocomplete>

        <div class="summary-meta">
          <span>{{ t('settings.lastUpdated') }}</span>
          <strong>{{ formattedLastUpdated }}</strong>
        </div>

        <v-btn
            color="secondary"
            variant="flat"
            prepend-icon="mdi-refresh"
            :loading="isSyncing"
            @click="synchronizeModels"
        >
          {{ isSyncing ? t('settings.syncing') : t('settings.updateModels') }}
        </v-btn>
      </v-sheet>

      <v-alert v-if="notice" type="success" variant="tonal" density="comfortable">
        {{ notice }}
      </v-alert>

      <v-sheet class="panel" rounded="lg" border>
        <div class="panel-title">
          <h2>{{ t('settings.providers') }}</h2>
        </div>

        <v-expansion-panels variant="accordion">
          <v-expansion-panel v-for="(provider,key) in settings.providers" :key="key">
            <v-expansion-panel-title>
              <div class="provider-title">
                <strong>{{ key }}</strong>
                <small>{{ maskApiKey(provider.apiKey) }}</small>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <div class="provider-body">
                <div class="input-row">
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
                  />
                  <div class="d-flex flex-row justify-start">
                    <v-btn
                        class="mr-2"
                        color="primary"
                        prepend-icon="mdi-content-save-outline"
                        :loading="savingProvider === key"
                        @click="saveApiKey(key)"
                    >
                      {{ t('settings.saveApiKey') }}
                    </v-btn>
                    <v-btn
                        color="error"
                        prepend-icon="mdi-delete"
                        :loading="savingProvider === key"
                        @click="saveApiKey(key, true)"
                    >
                      {{ t('settings.delApiKey') }}
                    </v-btn>
                  </div>

                </div>

                <div class="models-block">
                  <h3>{{ t('settings.models') }}</h3>
                  <div v-if="getModels(key).length === 0" class="empty-state compact">
                    {{ t('settings.noModels') }}
                  </div>
                  <v-list v-else lines="two" density="comfortable">
                    <v-list-item v-for="model in getModels(key)" :key="model.name">
                      <template #prepend>
                        <v-icon icon="mdi-cube-outline"/>
                      </template>
                      <v-list-item-title>{{ model.displayName ?? model.name }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ model.description ?? model.name }}
                      </v-list-item-subtitle>
                      <template #append>
                        <span class="token-pill">
                          {{ t('settings.tokens') }}: {{
                            model.inputTokenLimit ?? '-'
                          }} / {{ model.outputTokenLimit ?? '-' }}
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
