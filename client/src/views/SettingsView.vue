<script setup lang="ts">
import {computed, onMounted, reactive, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import type {AiModel, UserSettings} from '../types/chat'
import {api, snack, type Payload} from "../services/api.ts";
import Accordion from 'primevue/accordion'
import AccordionContent from 'primevue/accordioncontent'
import AccordionHeader from 'primevue/accordionheader'
import AccordionPanel from 'primevue/accordionpanel'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'

const {t, locale} = useI18n()

interface ModelOption {
  text: string
  value: string
}

const settings = ref<UserSettings | null>(null)
const apiKeys = reactive<Record<string, string>>({})
const isLoading = ref(true)
const isSyncing = ref(false)
const savingProvider = ref<string | null>(null)
const notice = ref('')
const modelItems = ref<ModelOption[]>([])

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

const noApiKeyProviders = ['ollama', 'claude-deep-seek', 'openai-deep-seek']
const requiresApiKey = (providerKey: string): boolean => {
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
        view: true,
        msg: t('settings.up_model', {model: modelName.value}),
        error: false
      }
    }

  } catch (err) {
    console.error('Eccezione salvataggio select models')
  } finally {
    load.value = false
  }

}

const getModels = (provider: UserSettings['providers'][number]): AiModel[] => {
  return provider.models ?? []
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
      <Tag :value="t('settings.configuration')" icon="mdi mdi-cog-outline" severity="primary" class="settings-badge" />
      <h1>{{ t('settings.title') }}</h1>
      <p>{{ t('settings.intro') }}</p>
    </div>

    <div v-if="isLoading" class="settings-loading" aria-busy="true">
      <Skeleton height="9rem" border-radius="1rem" />
      <Skeleton height="24rem" border-radius="1rem" />
    </div>

    <template v-else-if="settings">
      <div class="panel settings-summary">
        <div class="settings-summary__model">
          <label class="settings-field-label" for="default-model">{{ t('settings.defaultModel') }}</label>
          <div class="settings-model-control">
            <Select
              v-model="modelName"
              input-id="default-model"
              :options="modelItems"
              option-label="text"
              option-value="value"
              :loading="load"
              :placeholder="t('settings.defaultModel')"
              class="settings-select"
            >
              <template #dropdownicon><i class="mdi mdi-chevron-down" aria-hidden="true"></i></template>
              <template #loadingicon><i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i></template>
            </Select>
            <Button
              icon="mdi mdi-check-circle-outline"
              :aria-label="t('settings.saveDefaultModel')"
              :title="t('settings.saveDefaultModel')"
              :loading="load"
              @click="changeDefaultModel"
            />
          </div>
        </div>

        <div class="summary-meta">
          <i class="mdi mdi-clock-outline" aria-hidden="true"></i>
          <span>{{ t('settings.lastUpdated') }}</span>
          <strong>{{ formattedLastUpdated }}</strong>
        </div>

        <Button
          :label="isSyncing ? t('settings.syncing') : t('settings.updateModels')"
          icon="mdi mdi-sync"
          :loading="isSyncing"
          class="settings-sync"
          @click="synchronizeModels"
        />
      </div>

      <Message v-if="notice" severity="success" closable @close="notice = ''">
        {{ notice }}
      </Message>

      <div class="panel">
        <div class="panel-title">
          <div class="settings-panel-heading">
            <i class="mdi mdi-server-network" aria-hidden="true"></i>
            <h2>{{ t('settings.providers') }}</h2>
          </div>

          <Button
            :label="t('settings.exportCsv')"
            icon="mdi mdi-file-export-outline"
            size="small"
            severity="secondary"
            :title="t('settings.download')"
            :loading="loadDownload"
            @click="download"
          />
        </div>

        <Accordion class="provider-panels">
          <AccordionPanel v-for="provider in settings.providers" :key="provider.name" :value="provider.name">
            <AccordionHeader>
              <div class="provider-title">
                <div class="provider-name">
                  <i class="mdi mdi-api" aria-hidden="true"></i>
                  <strong>{{ provider.name }}</strong>
                </div>
                <Tag
                  :value="requiresApiKey(provider.name) ? maskApiKey(provider.apiKey) : t('settings.noApiKeyRequired')"
                  :severity="requiresApiKey(provider.name) ? 'secondary' : 'info'"
                  class="provider-key-status"
                />
              </div>
            </AccordionHeader>

            <AccordionContent>
              <div class="provider-body">
                <div v-if="requiresApiKey(provider.name)" class="provider-key-form">
                  <div class="settings-key-field">
                    <label class="settings-field-label" :for="`api-key-${provider.name}`">{{ t('settings.apiKey') }}</label>
                    <div class="settings-key-control">
                      <i class="mdi mdi-key-outline" aria-hidden="true"></i>
                      <InputText
                        :id="`api-key-${provider.name}`"
                        v-model="apiKeys[provider.name]"
                        :type="iconView.type"
                        :aria-label="t('settings.apiKey')"
                        autocomplete="off"
                        class="settings-key-input"
                      />
                      <Button
                        :icon="`mdi ${iconView.icon}`"
                        text
                        severity="secondary"
                        :aria-label="iconView.type === 'password' ? t('settings.showApiKey') : t('settings.hideApiKey')"
                        :title="iconView.type === 'password' ? t('settings.showApiKey') : t('settings.hideApiKey')"
                        @click="viewApiKey"
                      />
                    </div>
                  </div>
                  <div class="provider-key-actions">
                    <Button
                      :label="t('settings.saveApiKey')"
                      icon="mdi mdi-content-save-outline"
                      :loading="savingProvider === provider.name"
                      @click="saveApiKey(provider.name)"
                    />
                    <Button
                      icon="mdi mdi-delete-outline"
                      severity="danger"
                      outlined
                      :loading="savingProvider === provider.name"
                      :aria-label="t('settings.delApiKey')"
                      :title="t('settings.delApiKey')"
                      @click="saveApiKey(provider.name, true)"
                    />
                  </div>
                </div>

                <div class="models-block">
                  <h3 class="models-heading">
                    <i class="mdi mdi-cube-outline" aria-hidden="true"></i>
                    <span>{{ t('settings.models') }}</span>
                  </h3>

                  <div v-if="getModels(provider).length === 0" class="empty-state compact">
                    <span>{{ t('settings.noModels') }}</span>
                  </div>

                  <ul v-else class="provider-model-list">
                    <li v-for="model in getModels(provider)" :key="model.name" class="provider-model">
                      <span class="provider-model__icon"><i class="mdi mdi-brain" aria-hidden="true"></i></span>
                      <span class="provider-model__details">
                        <strong>{{ model.displayName ?? model.name }}</strong>
                        <small>{{ model.description ?? model.name }}</small>
                      </span>
                      <span class="token-pill">
                        <i class="mdi mdi-counter" aria-hidden="true"></i>
                        {{ t('settings.tokens') }}: {{ model.inputTokenLimit ?? '-' }} / {{ model.outputTokenLimit ?? '-' }}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </div>
    </template>
  </section>
</template>

<style scoped>
.settings-badge {
  width: fit-content;
}

.settings-badge :deep(.p-tag-icon) {
  margin-right: 0.4rem;
}

.settings-loading {
  display: grid;
  gap: 20px;
}

.settings-summary {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(170px, 1fr) auto;
  align-items: end;
  gap: 20px;
}

.settings-summary__model,
.settings-key-field {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.settings-field-label {
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
}

.settings-model-control {
  display: flex;
  gap: 8px;
}

.settings-select {
  flex: 1 1 auto;
  min-width: 0;
}

.settings-sync {
  white-space: nowrap;
}

.provider-title {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-right: 4px;
}

.provider-name,
.settings-panel-heading,
.models-heading {
  display: flex;
  align-items: center;
  gap: 9px;
}

.provider-name {
  color: var(--color-primary);
}

.provider-name strong {
  color: var(--color-text-main);
  font-size: 1rem;
}

.provider-key-status {
  max-width: 55%;
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-overflow: ellipsis;
}

.settings-panel-heading > .mdi {
  color: var(--color-primary);
  font-size: 1.25rem;
}

.provider-body {
  display: grid;
  gap: 22px;
  padding-top: 8px;
}

.provider-key-form {
  display: flex;
  align-items: end;
  gap: 16px;
}

.settings-key-field {
  flex: 1 1 auto;
}

.settings-key-control {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 8px 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
}

.settings-key-control:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.settings-key-control > .mdi {
  color: #64748b;
}

.settings-key-input {
  width: 100%;
  min-width: 0;
  padding: 8px 0;
  border: 0;
  outline: 0;
  box-shadow: none;
}

.settings-key-input:focus {
  box-shadow: none;
}

.provider-key-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.models-block {
  display: grid;
  gap: 10px;
}

.models-heading {
  color: #475569;
  font-size: 0.95rem;
}

.models-heading > .mdi {
  font-size: 1rem;
}

.provider-model-list {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 6px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  list-style: none;
}

.provider-model {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 10px;
  border-radius: 8px;
}

.provider-model + .provider-model {
  border-top: 1px solid #f1f5f9;
}

.provider-model__icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: var(--color-primary);
  background: #eef2ff;
}

.provider-model__details {
  display: grid;
  flex: 1 1 auto;
  gap: 3px;
  min-width: 0;
}

.provider-model__details strong,
.provider-model__details small {
  overflow: hidden;
  text-overflow: ellipsis;
}

.provider-model__details strong {
  color: var(--color-text-main);
  font-size: 0.875rem;
}

.provider-model__details small {
  color: var(--color-text-muted);
  font-size: 0.78rem;
}

.summary-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.summary-meta > .mdi {
  font-size: 1.1rem;
}

.summary-meta strong {
  color: var(--color-text-main);
  font-size: 0.85rem;
}

.provider-panels :deep(.p-accordionpanel) {
  margin-bottom: 10px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: #fff;
}

.provider-panels :deep(.p-accordionheader) {
  padding: 14px 16px;
  background: #fff;
}

.provider-panels :deep(.p-accordioncontent-content) {
  padding: 0 16px 16px;
}

@media (max-width: 760px) {
  .settings-summary {
    grid-template-columns: 1fr 1fr;
  }

  .settings-summary__model {
    grid-column: 1 / -1;
  }

  .settings-sync {
    width: 100%;
  }

  .provider-key-form {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (max-width: 520px) {
  .settings-summary {
    grid-template-columns: 1fr;
  }

  .settings-summary__model {
    grid-column: auto;
  }

  .provider-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .provider-key-status {
    max-width: 100%;
  }

  .provider-model {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .provider-model__details {
    flex-basis: calc(100% - 50px);
  }

  .provider-model .token-pill {
    margin-left: 44px;
  }
}
</style>
