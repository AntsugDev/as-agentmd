<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { api, type Payload } from '../services/api.ts'

const { t } = useI18n()

// ─── Types ────────────────────────────────────────────────────────────────────
interface LogEntry {
  id: number
  date: string
  type: 'info' | 'exception'
  message: string
  stack?: string | null
}

// ─── State ────────────────────────────────────────────────────────────────────
const logs = ref<LogEntry[]>([])
const loading = ref<boolean>(false)
const search = ref<string>('')
const filterType = ref<string | null>(null)
const stackDialog = ref<boolean>(false)
const selectedStack = ref<string | null>(null)
const selectedMessage = ref<string>('')


// ─── API ──────────────────────────────────────────────────────────────────────
const fetchLogs = async () => {
  try {
    loading.value = true
    // TODO: sostituire con l'endpoint reale quando disponibile
    const response = await api({
      url: 'worked/log',
      method: 'GET',
    } as Payload)
    if (response && response.data) {
      logs.value = response.data
    } else {
      logs.value = mockLogs
    }
  } catch(err:any) {
    console.log(err)
  } finally {
    loading.value = false
  }
}

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredLogs = computed(() => {
  return logs.value.filter((log) => {
    const matchType = !filterType.value || log.type === filterType.value
    const matchSearch =
      !search.value ||
      log.message.toLowerCase().includes(search.value.toLowerCase())
    return matchType && matchSearch
  })
})

const infoCount = computed(() => logs.value.filter((l) => l.type === 'info').length)
const exceptionCount = computed(() => logs.value.filter((l) => l.type === 'exception').length)

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso)
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}

const openStack = (log: LogEntry) => {
  selectedStack.value = log.stack ?? null
  selectedMessage.value = log.message
  stackDialog.value = true
}

const closeStack = () => {
  stackDialog.value = false
  selectedStack.value = null
  selectedMessage.value = ''
}

// ─── Table headers ────────────────────────────────────────────────────────────
const headers = [
  { title: t('logs.date'), key: 'CREATED_AT', sortable: true, width: '190px' },
  { title: t('logs.type'), key: 'TYPE', sortable: true, width: '130px' },
  { title: t('logs.tag'), key: 'TAG', sortable: true, width: '130px' },
  { title: t('logs.message'), key: 'MESSAGE', sortable: false },
]

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchLogs()
})
</script>

<template>
  <div class="content-grid">

    <!-- Page heading -->
    <div class="section-heading">
      <div class="d-flex align-center ga-2 mb-1">
        <v-chip color="warning" variant="flat" size="small" rounded="pill" class="font-weight-bold text-uppercase">
          <v-icon icon="mdi-text-box-search-outline" size="14" class="mr-1"></v-icon>
          {{ t('logs.badge') }}
        </v-chip>
      </div>
      <h1>{{ t('logs.title') }}</h1>
      <p>{{ t('logs.intro') }}</p>
    </div>

    <!-- Summary chips -->
    <div class="d-flex flex-wrap align-center ga-3">
      <v-chip color="primary" variant="tonal" rounded="pill" size="small" class="font-weight-bold">
        <v-icon icon="mdi-format-list-bulleted" size="14" class="mr-1"></v-icon>
        {{ t('logs.total') }}: {{ logs.length }}
      </v-chip>
      <v-chip color="info" variant="tonal" rounded="pill" size="small" class="font-weight-bold">
        <v-icon icon="mdi-information-outline" size="14" class="mr-1"></v-icon>
        {{ t('logs.info') }}: {{ infoCount }}
      </v-chip>
      <v-chip color="error" variant="tonal" rounded="pill" size="small" class="font-weight-bold">
        <v-icon icon="mdi-alert-circle-outline" size="14" class="mr-1"></v-icon>
        {{ t('logs.exception') }}: {{ exceptionCount }}
      </v-chip>
    </div>

    <!-- Filters bar -->
    <v-sheet class="panel pa-4" rounded="xl" border>
      <div class="d-flex flex-wrap align-center ga-3">
        <v-text-field
            v-model="search"
            :label="t('logs.search')"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            clearable
            class="flex-grow-1"
            style="min-width: 200px; max-width: 400px;"
        />
        <v-btn-toggle
            v-model="filterType"
            density="compact"
            rounded="lg"
            variant="outlined"
            color="primary"
        >
          <v-btn value="" class="text-caption font-weight-bold px-4 mr-2">
            {{ t('logs.all') }}
          </v-btn>
          <v-btn value="info" class="text-caption font-weight-bold px-4 mr-2">
            <v-icon icon="mdi-information-outline" size="16" class="mr-2"></v-icon>
            Info
          </v-btn>
          <v-btn value="exception" class="text-caption font-weight-bold px-4 mr-2">
            <v-icon icon="mdi-alert-circle-outline" size="16" class="mr-2"></v-icon>
            Exception
          </v-btn>
        </v-btn-toggle>

        <v-spacer />

        <v-btn
            variant="tonal"
            color="primary"
            size="small"
            prepend-icon="mdi-refresh"
            :loading="loading"
            rounded="lg"
            class="font-weight-bold"
            @click="fetchLogs"
        >
          {{ t('logs.refresh') }}
        </v-btn>
      </div>
    </v-sheet>

    <!-- Data Table -->
    <v-sheet class="panel pa-0" rounded="xl" border>
      <div class="panel-title px-5 pt-4 pb-3">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-table-search" color="primary"></v-icon>
          <h2>{{ t('logs.tableTitle') }}</h2>
        </div>
        <v-chip v-if="filteredLogs.length !== logs.length" color="warning" size="small" variant="flat" rounded="pill">
          {{ filteredLogs.length }} / {{ logs.length }}
        </v-chip>
      </div>

      <v-skeleton-loader v-if="loading" type="table-row-divider@6" class="mx-4 mb-4" rounded="lg" />

      <v-data-table
          v-else
          :headers="headers"
          :items="filteredLogs"
          :items-per-page="15"
          item-value="id"
          class="logs-table"
          hover
      >
        <!-- Date column -->
        <template #item.CREATED_AT="{ item }">
          <span class="text-caption font-weight-medium text-mono">
            {{ formatDate(item.CREATED_AT) }}
          </span>
        </template>

        <!-- Type chip column -->
        <template #item.TYPE="{ item }">
          <v-chip
              :color="item.TYPE === 'exception' ? 'error' : 'info'"
              variant="flat"
              size="small"
              rounded="pill"
              class="font-weight-bold text-uppercase"
          >
            <v-icon
                :icon="item.TYPE === 'exception' ? 'mdi-alert-circle-outline' : 'mdi-information-outline'"
                size="13"
                class="mr-1"
            ></v-icon>
            {{ item.TYPE === 'exception' ? t('logs.exception') : t('logs.info') }}
          </v-chip>
        </template>

        <!-- Message column -->
        <template #item.MESSAGE="{ item }">
          <span :class="item.TYPE === 'exception' ? 'text-error font-weight-medium' : 'text-medium-emphasis'">
            {{ item.MESSAGE }}
          </span>
        </template>

        <!-- Stack column -->

        <!-- Empty state -->
        <template #no-data>
          <div class="empty-state compact ma-4">
            <v-icon icon="mdi-text-box-remove-outline" size="40" class="mb-2 text-grey"></v-icon>
            <div class="font-weight-bold text-grey-darken-1">{{ t('logs.empty') }}</div>
          </div>
        </template>
      </v-data-table>
    </v-sheet>

    <!-- Stack Trace Dialog -->
    <v-dialog v-model="stackDialog" max-width="720" scrollable>
      <v-card rounded="xl" border elevation="8">
        <v-card-title class="d-flex align-center justify-space-between pa-4 border-b">
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-code-braces" color="warning"></v-icon>
            <span class="font-weight-bold text-subtitle-1">Stack Trace</span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" color="grey" @click="closeStack"></v-btn>
        </v-card-title>

        <v-card-text class="pa-4">
          <!-- Trigger message recap -->
          <v-alert
              variant="tonal"
              color="error"
              rounded="lg"
              density="comfortable"
              icon="mdi-alert-circle-outline"
              class="mb-4 text-caption"
          >
            {{ selectedMessage }}
          </v-alert>

          <!-- Stack trace block -->
          <pre class="stack-trace-block">{{ selectedStack }}</pre>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0 justify-end">
          <v-btn
              variant="tonal"
              color="primary"
              rounded="lg"
              class="font-weight-bold"
              @click="closeStack"
          >
            {{ t('logs.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<style scoped>
.logs-table {
  border-radius: 0 0 16px 16px;
  overflow: hidden;
}

.text-mono {
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: 0.8rem;
}

.stack-trace-block {
  margin: 0;
  padding: 16px 18px;
  border-radius: 12px;
  background: #0f172a;
  color: #f1f5f9;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: 0.82rem;
  line-height: 1.7;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
