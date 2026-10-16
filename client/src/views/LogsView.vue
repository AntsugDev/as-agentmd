<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { api, type Payload } from '../services/api.ts'

interface LogEntry {
  id: number
  date: string
  type: 'info' | 'exception'
  tag: string
  message: string
  stack?: string | null
}

const { t, locale } = useI18n()
const logs = ref<LogEntry[]>([])
const loading = ref(false)
const search = ref('')
const filterType = ref<LogEntry['type'] | null>(null)
const stackDialog = ref(false)
const selectedStack = ref<string | null>(null)
const selectedMessage = ref('')

const fetchLogs = async () => {
  try {
    loading.value = true
    const response = await api({
      url: 'worked/log',
      method: 'GET',
    } as Payload)
    if (response && Array.isArray(response.data)) {
      logs.value = response.data.map((entry: Record<string, unknown>, index: number) => ({
        id: Number(entry.id ?? entry.ID ?? index),
        date: String(entry.date ?? entry.CREATED_AT ?? ''),
        type: String(entry.type ?? entry.TYPE ?? '').toLowerCase() === 'exception' ? 'exception' : 'info',
        tag: String(entry.tag ?? entry.TAG ?? ''),
        message: String(entry.message ?? entry.MESSAGE ?? ''),
        stack: typeof (entry.stack ?? entry.STACK) === 'string' ? String(entry.stack ?? entry.STACK) : null,
      }))
    } else {
      logs.value = []
    }
  } catch (err) {
    console.error('Errore caricamento log', err)
  } finally {
    loading.value = false
  }
}

const filteredLogs = computed(() => logs.value.filter((log) => {
  const matchesType = !filterType.value || log.type === filterType.value
  const matchesSearch = !search.value || log.message.toLowerCase().includes(search.value.toLowerCase())
  return matchesType && matchesSearch
}))

const infoCount = computed(() => logs.value.filter((log) => log.type === 'info').length)
const exceptionCount = computed(() => logs.value.filter((log) => log.type === 'exception').length)

const formatDate = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const openStack = (log: LogEntry) => {
  selectedStack.value = log.stack ?? ''
  selectedMessage.value = log.message
  stackDialog.value = true
}

const closeStack = () => {
  stackDialog.value = false
  selectedStack.value = null
  selectedMessage.value = ''
}

onMounted(fetchLogs)
</script>

<template>
  <section class="content-grid">
    <div class="section-heading">
      <Tag :value="t('logs.badge')" icon="mdi mdi-text-box-search-outline" severity="warn" class="logs-badge" />
      <h1>{{ t('logs.title') }}</h1>
      <p>{{ t('logs.intro') }}</p>
    </div>

    <div class="logs-summary">
      <Tag :value="`${t('logs.total')}: ${logs.length}`" icon="mdi mdi-format-list-bulleted" severity="primary" />
      <Tag :value="`${t('logs.info')}: ${infoCount}`" icon="mdi mdi-information-outline" severity="info" />
      <Tag :value="`${t('logs.exception')}: ${exceptionCount}`" icon="mdi mdi-alert-circle-outline" severity="danger" />
    </div>

    <div class="panel logs-filters">
      <label class="logs-search">
        <i class="mdi mdi-magnify" aria-hidden="true"></i>
        <InputText v-model="search" :placeholder="t('logs.search')" :aria-label="t('logs.search')" />
        <Button
          v-if="search"
          icon="mdi mdi-close"
          text
          rounded
          severity="secondary"
          :aria-label="t('logs.clearSearch')"
          @click="search = ''"
        />
      </label>

      <div class="logs-filter-group" role="group" :aria-label="t('logs.type')">
        <Button :label="t('logs.all')" :severity="filterType === null ? 'primary' : 'secondary'" :outlined="filterType !== null" @click="filterType = null" />
        <Button :label="t('logs.info')" icon="mdi mdi-information-outline" :severity="filterType === 'info' ? 'info' : 'secondary'" :outlined="filterType !== 'info'" @click="filterType = 'info'" />
        <Button :label="t('logs.exception')" icon="mdi mdi-alert-circle-outline" :severity="filterType === 'exception' ? 'danger' : 'secondary'" :outlined="filterType !== 'exception'" @click="filterType = 'exception'" />
      </div>

      <Button
        :label="t('logs.refresh')"
        icon="mdi mdi-refresh"
        severity="secondary"
        :loading="loading"
        @click="fetchLogs"
      />
    </div>

    <div class="panel logs-table-panel">
      <header class="panel-title">
        <div class="logs-table-title">
          <i class="mdi mdi-table-search" aria-hidden="true"></i>
          <h2>{{ t('logs.tableTitle') }}</h2>
        </div>
        <Tag v-if="filteredLogs.length !== logs.length" :value="`${filteredLogs.length} / ${logs.length}`" severity="warn" />
      </header>

      <div v-if="loading" class="logs-loading" aria-busy="true">
        <Skeleton v-for="row in 6" :key="row" height="2.75rem" border-radius="0.5rem" />
      </div>

      <DataTable
        v-else
        :value="filteredLogs"
        data-key="id"
        paginator
        :rows="15"
        :rows-per-page-options="[15, 30, 50]"
        striped-rows
        class="logs-table"
      >
        <template #empty>
          <div class="empty-state compact">
            <i class="mdi mdi-text-box-remove-outline logs-empty-icon" aria-hidden="true"></i>
            <strong>{{ t('logs.empty') }}</strong>
          </div>
        </template>

        <Column field="date" :header="t('logs.date')" sortable class="logs-date-column">
          <template #body="{ data }"><span class="logs-date">{{ formatDate(data.date) }}</span></template>
        </Column>
        <Column field="type" :header="t('logs.type')" sortable>
          <template #body="{ data }">
            <Tag
              :value="data.type === 'exception' ? t('logs.exception') : t('logs.info')"
              :icon="data.type === 'exception' ? 'mdi mdi-alert-circle-outline' : 'mdi mdi-information-outline'"
              :severity="data.type === 'exception' ? 'danger' : 'info'"
            />
          </template>
        </Column>
        <Column field="tag" :header="t('logs.tag')" sortable />
        <Column field="message" :header="t('logs.message')" class="logs-message-column">
          <template #body="{ data }">
            <span :class="{ 'logs-message--exception': data.type === 'exception' }">{{ data.message }}</span>
          </template>
        </Column>
        <Column :header="t('logs.stack')" class="logs-action-column">
          <template #body="{ data }">
            <Button
              v-if="data.stack"
              icon="mdi mdi-code-braces"
              text
              rounded
              :aria-label="t('logs.viewStack')"
              :title="t('logs.viewStack')"
              @click="openStack(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="stackDialog"
      modal
      :closable="false"
      :draggable="false"
      :style="{ width: 'min(720px, calc(100vw - 2rem))' }"
      :breakpoints="{ '640px': '100vw' }"
      class="stack-dialog"
    >
      <template #header>
        <div class="stack-dialog__header">
          <div class="stack-dialog__title">
            <i class="mdi mdi-code-braces" aria-hidden="true"></i>
            <strong>{{ t('logs.stack') }}</strong>
          </div>
          <Button icon="mdi mdi-close" text rounded severity="secondary" :aria-label="t('logs.close')" @click="closeStack" />
        </div>
      </template>
      <Message severity="error" class="stack-message">{{ selectedMessage }}</Message>
      <pre class="stack-trace-block">{{ selectedStack }}</pre>
      <template #footer>
        <Button :label="t('logs.close')" severity="secondary" @click="closeStack" />
      </template>
    </Dialog>
  </section>
</template>

<style scoped>
.logs-badge { width: fit-content; }
.logs-summary,
.logs-filters,
.logs-filter-group,
.logs-table-title,
.stack-dialog__header,
.stack-dialog__title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logs-summary { flex-wrap: wrap; }
.logs-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; padding: 16px; }
.logs-search {
  display: flex;
  flex: 1 1 240px;
  align-items: center;
  gap: 8px;
  max-width: 400px;
  min-height: 42px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
}
.logs-search > .mdi { color: #64748b; }
.logs-search :deep(.p-inputtext) { width: 100%; min-width: 0; padding: 8px 0; border: 0; box-shadow: none; }
.logs-filter-group { flex-wrap: wrap; }
.logs-table-panel { padding: 0; overflow: hidden; }
.logs-table-panel > .panel-title { margin: 0; padding: 18px 20px; }
.logs-table-title > .mdi { color: var(--color-primary); font-size: 1.2rem; }
.logs-loading { display: grid; gap: 8px; padding: 0 20px 20px; }
.logs-table { border-top: 1px solid var(--color-border); }
.logs-table :deep(.p-datatable-thead > tr > th) { padding: 12px 14px; color: #475569; background: #f8fafc; font-size: 0.8rem; white-space: nowrap; }
.logs-table :deep(.p-datatable-tbody > tr > td) { padding: 12px 14px; font-size: 0.82rem; }
.logs-date { font-family: var(--font-mono); font-size: 0.78rem; white-space: nowrap; }
.logs-message-column { min-width: 260px; }
.logs-message--exception { color: #dc2626; font-weight: 600; }
.logs-action-column { width: 5rem; }
.logs-empty-icon { margin-bottom: 8px; color: #94a3b8; font-size: 2.25rem; }
.stack-dialog__header { width: 100%; justify-content: space-between; }
.stack-dialog__title { color: #92400e; font-size: 1rem; }
.stack-dialog__title > .mdi { font-size: 1.2rem; }
.stack-message { margin-bottom: 16px; }
.stack-trace-block {
  max-height: min(55vh, 520px);
  margin: 0;
  padding: 16px 18px;
  overflow: auto;
  border-radius: 12px;
  color: #f1f5f9;
  background: #0f172a;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (max-width: 680px) {
  .logs-filters { align-items: stretch; flex-direction: column; }
  .logs-search { max-width: none; }
  .logs-filter-group { justify-content: flex-start; }
  .logs-table-panel > .panel-title { padding: 16px; }
}
</style>
