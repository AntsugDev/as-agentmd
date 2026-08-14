<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSettings, syncModels, updateDefaultModel, updateProviderApiKey } from '../services/api'
import type { AiModel, UserSettings } from '../types/chat'

const { t, locale } = useI18n()

const settings = ref<UserSettings | null>(null)
const apiKeys = reactive<Record<string, string>>({})
const isLoading = ref(true)
const isSyncing = ref(false)
const savingProvider = ref<string | null>(null)
const notice = ref('')

const allModels = computed<AiModel[]>(() =>
  settings.value?.providers.flatMap((provider) =>
    provider.models.map((model) => ({ ...model, provider: provider.name })),
  ) ?? [],
)

const modelItems = computed(() =>
  allModels.value.map((model) => ({
    ...model,
    label: model.displayName ? `${model.displayName} (${model.provider})` : model.name,
  })),
)

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
  settings.value?.providers.forEach((provider) => {
    apiKeys[provider.name] = provider.apiKey
  })
}

const loadSettings = async () => {
  isLoading.value = true
  try {
    settings.value = await getSettings()
    hydrateApiKeys()
  } finally {
    isLoading.value = false
  }
}

const saveApiKey = async (providerName: string) => {
  savingProvider.value = providerName
  notice.value = ''

  try {
    settings.value = await updateProviderApiKey(providerName, apiKeys[providerName] ?? '')
    hydrateApiKeys()
    notice.value = t('settings.saved')
  } finally {
    savingProvider.value = null
  }
}

const synchronizeModels = async () => {
  isSyncing.value = true
  notice.value = ''

  try {
    settings.value = await syncModels()
    hydrateApiKeys()
    notice.value = t('settings.synced')
  } finally {
    isSyncing.value = false
  }
}

const changeDefaultModel = async (modelName: string | null) => {
  if (!modelName) {
    return
  }

  settings.value = await updateDefaultModel(modelName)
  hydrateApiKeys()
  notice.value = t('settings.saved')
}

onMounted(loadSettings)
</script>

<template>
  <section class="content-grid">
    <div class="section-heading">
      <h1>{{ t('settings.title') }}</h1>
      <p>{{ t('settings.intro') }}</p>
    </div>

    <v-skeleton-loader v-if="isLoading" type="article, actions" />

    <template v-else-if="settings">
      <v-sheet class="panel settings-summary" rounded="lg" border>
        <v-autocomplete
          :model-value="settings.modelSelected"
          :items="modelItems"
          item-title="label"
          item-value="name"
          :label="t('settings.defaultModel')"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-brain"
          hide-details="auto"
          @update:model-value="changeDefaultModel"
        />

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
          <v-expansion-panel v-for="provider in settings.providers" :key="provider.name">
            <v-expansion-panel-title>
              <div class="provider-title">
                <strong>{{ provider.name }}</strong>
                <small>{{ maskApiKey(provider.apiKey) }}</small>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <div class="provider-body">
                <div class="input-row">
                  <v-text-field
                    v-model="apiKeys[provider.name]"
                    :label="t('settings.apiKey')"
                    variant="outlined"
                    density="comfortable"
                    type="password"
                    prepend-inner-icon="mdi-key-outline"
                    hide-details="auto"
                  />
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-content-save-outline"
                    :loading="savingProvider === provider.name"
                    @click="saveApiKey(provider.name)"
                  >
                    {{ t('settings.saveApiKey') }}
                  </v-btn>
                </div>

                <div class="models-block">
                  <h3>{{ t('settings.models') }}</h3>
                  <div v-if="provider.models.length === 0" class="empty-state compact">
                    {{ t('settings.noModels') }}
                  </div>
                  <v-list v-else lines="two" density="comfortable">
                    <v-list-item v-for="model in provider.models" :key="model.name">
                      <template #prepend>
                        <v-icon icon="mdi-cube-outline" />
                      </template>
                      <v-list-item-title>{{ model.displayName ?? model.name }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ model.description ?? model.name }}
                      </v-list-item-subtitle>
                      <template #append>
                        <span class="token-pill">
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
