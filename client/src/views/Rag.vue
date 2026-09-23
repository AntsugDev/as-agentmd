<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {onMounted, reactive, ref} from "vue";
import {api, type Payload} from "../services/api.ts";
import dayjs from "dayjs";

const {t} = useI18n()
const tagItems = ref<any[]>([])
const loading = ref<boolean>(false)
const valid = ref<boolean>(false)
const formRag = ref<any | null>(null)
const icon = ref<string>('mdi-chevron-down')
const viewForm = ref<boolean>(false)
const viewTable = ref<boolean>(true)
const alt = ref<string>(t('alt.open'))
const altTable = ref<string>(t('alt.closed'))
const iconTable = ref<string>('mdi-chevron-up')

const formData = reactive({
  tag: null,
  tagCreate: null,
  files: []
})

const selectTags = async () => {
  try {
    loading.value = true
    const response = await api({
      url: 'tags', method: 'GET'
    } as Payload)
    if (response) tagItems.value = response.data

  } catch (err: any) {
    console.log(err)
  } finally {
    loading.value = false
  }
}
const rulesTag = ref(false)

const rulesTagF = () => {
  if (formData.tag || formData.tagCreate) {
    rulesTag.value = false
    return true;
  } else {
    rulesTag.value = true
    return false;
  }

}
const notice = ref<string | null>(null)
const uploaded = async () => {
  try {
    loading.value = true
    const v = await formRag.value.validate();
    const r = rulesTagF()
    if (r && v) {
      const f = new FormData();
      if (formData.tag && !formData.tagCreate)
        f.append('argument', formData.tag)
      else if (!formData.tag && formData.tagCreate)
        f.append('argument', formData.tagCreate)

      formData.files.map((e: any) => {
        f.append('files', e)
      })
      const response = await api({
        url: `rag/files`,
        method: 'POST',
        body: f,
      } as Payload)
      if (response && parseInt(response.status) === 201) {
        notice.value = t('rag.insert_OK')
        window.location.reload();
      }
    } else throw new Error("Form non valido")
  } catch (err: any) {
    console.log(err)
  } finally {
    loading.value = false

  }

}
const resetError = () => {
  if (rulesTag.value) rulesTag.value = false
}


const invertView = () => {
  viewForm.value = !viewForm.value
  if (icon.value === 'mdi-chevron-down') {
    icon.value = 'mdi-chevron-up'
    alt.value = t('alt.closed')
    if (viewTable.value) {
      viewTable.value = false
      iconTable.value = 'mdi-chevron-down'
      altTable.value = t('alt.open')
    }
    selectTags()
  } else {
    icon.value = 'mdi-chevron-down'
    alt.value = t('alt.open')
  }
}
const table = ref<any []>([])
const loadTable = ref<boolean>(false)
const listTable = async () => {
  try {
    loadTable.value = true
    const response = await api({
      url: 'rag/files', method: 'GET'
    } as Payload)
    if (response) table.value = response.data
  } catch (err: any) {
    console.log(err)
  } finally {
    loadTable.value = false
  }
}

const invertViewTable = () => {
  viewTable.value = !viewTable.value
  if (iconTable.value === 'mdi-chevron-down') {
    iconTable.value = 'mdi-chevron-up'
    altTable.value = t('alt.closed')
    if (viewForm.value) {
      viewForm.value = false
      icon.value = 'mdi-chevron-down'
      alt.value = t('alt.open')
    }
  } else {
    iconTable.value = 'mdi-chevron-down'
    altTable.value = t('alt.open')
    if (table.value.length === 0) listTable()
  }
}
const headers = [
  {title: t('rag.fileName'), key: 'FILE_NAME'},
  {title: t('rag.tagTable'), key: 'TAG'},
  {title: t('rag.status'), key: 'STATUS', align: 'center'},
  {title: t('rag.created'), key: 'CREATED_AT'},
  {title: t('rag.update'), key: 'UPDATED_AT'},
]
const getStatus = (item: {
  FILE_ID: number
  STATUS_NAME: string
  TOT_CHUNKS: number | null
  NOT_ELABORATE: number | null
  EXCEPTION: number | null
  ELABORATE: number | null
  TOT_EMB: number | null
  FILE_NAME: string
  TAG: string
  CREATED_AT: string
  UPDATED_AT: string
}) => {
  const status = item.STATUS_NAME
  let title = null;
  let icon = null;
  let color = null;
  if (status.toString().toUpperCase() === 'PENDING') {
    icon = 'mdi-clock-time-four-outline'
    color = "#f59e0b"
    title = t('rag.wait')
  } else if (status.toString().toUpperCase() === 'OK') {
    if (item.TOT_CHUNKS === item.ELABORATE) {
      icon = 'mdi-check-circle-outline'
      color = "#10b981"
      title = t('rag.success')
    } else {
      icon = 'mdi-clock-time-four-outline'
      color = "#f59e0b"
      title = t('rag.wait')
    }
  } else if (status.toString().toUpperCase() === 'KO') {
    icon = 'mdi-alert-circle-outline'
    color = "#ef4444"
    title = t('rag.error')
  } else if (status.toString().toUpperCase() === 'PROCESSING') {
    icon = 'mdi-loading mdi-spin'
    color = "#4f46e5"
    title = t('rag.insert_OK')
  } else {
    icon = 'mdi-help-circle-outline'
    color = "#94a3b8"
    title = status
  }
  return `<span style="vertical-align: middle; display: inline-flex; align-items: center;"><i class="mdi ${icon}" style="font-size: 26px; color:${color};" title="${title}"></i></span>`
}
onMounted(() => {
  listTable()
})

</script>

<template>
  <section class="content-grid">
    <div class="section-heading">
      <div class="d-flex align-center gap-2">
        <v-chip color="secondary" variant="tonal" size="small" class="font-weight-bold">
          <v-icon icon="mdi-file-document-multiple-outline" size="14" class="mr-1"></v-icon>
          Document Hub
        </v-chip>
      </div>
      <h1>{{ t('rag.title') }}</h1>
    </div>

    <!-- Upload Form Panel -->
    <v-sheet class="panel" rounded="xl" border style="height: max-content">
      <div class="d-flex align-center justify-space-between cursor-pointer" @click="invertView">
        <div class="d-flex align-center gap-2">
          <v-icon icon="mdi-cloud-upload-outline" color="primary"></v-icon>
          <h2 class="text-subtitle-1 font-weight-bold mb-0">{{ t('rag.form') }}</h2>
        </div>
        <v-btn icon variant="tonal" color="primary" size="small">
          <v-icon :icon="icon" size="20"></v-icon>
        </v-btn>
      </div>

      <v-slide-y-transition>
        <div v-if="viewForm" class="mt-4 pt-3 border-t">
          <v-alert v-if="notice" type="success" variant="tonal" density="comfortable" rounded="lg" class="mb-4">
            {{ notice }}
          </v-alert>

          <v-form ref="formRag" v-model="valid">
            <!-- Topic / Tag Selection Section -->
            <v-card variant="outlined" rounded="xl" class="pa-4 mb-4 bg-slate-50">
              <div class="d-flex align-center gap-2 mb-3">
                <v-icon icon="mdi-tag-plus-outline" color="primary" size="20"></v-icon>
                <span class="font-weight-bold text-subtitle-2">{{ t('rag.tag') }}</span>
              </div>

              <v-row density="comfortable">
                <v-col cols="12" md="6">
                  <v-text-field
                      :label="t('rag.topic_create')"
                      density="comfortable"
                      variant="outlined"
                      v-model="formData.tagCreate"
                      @update:focused="resetError"
                      :disabled="loading"
                      rounded="lg"
                      prepend-inner-icon="mdi-plus-box-outline"
                      hide-details="auto"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-autocomplete
                      v-model="formData.tag"
                      :model-value="formData.tag"
                      :items="tagItems"
                      item-title="TAG"
                      item-value="TAG"
                      :label="t('rag.topics')"
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-brain"
                      hide-details="auto"
                      :loading="loading"
                      @update:focused="resetError"
                      :disabled="loading"
                      rounded="lg"
                      clearable
                  />
                </v-col>
              </v-row>
              <p class="obbligatorio text-caption mt-2 ml-1" v-if="rulesTag">{{ t('rag.obbligatorio') }}</p>
            </v-card>

            <!-- File Upload Input Section -->
            <v-card variant="outlined" rounded="xl" class="pa-4 mb-4 bg-slate-50">
              <div class="d-flex align-center gap-2 mb-2">
                <v-icon icon="mdi-paperclip" color="primary" size="20"></v-icon>
                <span class="font-weight-bold text-subtitle-2">{{ t('rag.file') }}</span>
              </div>
              <p class="text-caption text-grey-darken-1 mb-3">{{ t('rag.only_file') }}</p>

              <v-file-input
                  v-model="formData.files"
                  clearable
                  chips
                  counter
                  show-size
                  :label="t('rag.file')"
                  accept=".txt,.md,.pdf,.doc,.docx,.xls,.xlsx,.csv,text/plain,text/markdown,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  variant="outlined"
                  multiple
                  :rules="[v => !!v || t('obbligatorio')]"
                  :disabled="loading"
                  rounded="lg"
                  density="comfortable"
                  prepend-icon=""
                  prepend-inner-icon="mdi-cloud-upload-outline"
              />
            </v-card>

            <div class="d-flex justify-end">
              <v-btn
                  color="success"
                  :loading="loading"
                  :disabled="loading"
                  append-icon="mdi-cloud-upload"
                  @click="uploaded"
                  variant="flat"
                  size="large"
                  class="font-weight-bold px-6"
                  rounded="lg"
              >
                {{ t('rag.up') }}
              </v-btn>
            </div>
          </v-form>
        </div>
      </v-slide-y-transition>
    </v-sheet>

    <!-- Documents List Table Panel -->
    <v-sheet class="panel" rounded="xl" border style="height: max-content">
      <div class="d-flex align-center justify-space-between cursor-pointer" @click="invertViewTable">
        <div class="d-flex align-center gap-2">
          <v-icon icon="mdi-table" color="primary"></v-icon>
          <h2 class="text-subtitle-1 font-weight-bold mb-0">{{ t('rag.table') }}</h2>
        </div>
        <v-btn icon variant="tonal" color="primary" size="small">
          <v-icon :icon="iconTable" size="20"></v-icon>
        </v-btn>
      </div>

      <v-slide-y-transition>
        <div v-if="viewTable" class="mt-4 pt-3 border-t">
          <v-data-table
              :headers="headers"
              :items="table"
              :loading="loadTable"
              class="elevation-0 rounded-lg border"
          >
            <template #top>
              <div class="d-flex align-center justify-space-between pa-3 border-b">
                <span class="text-subtitle-2 font-weight-bold text-grey-darken-2">Documenti memorizzati</span>
                <v-btn
                    icon="mdi-refresh"
                    variant="tonal"
                    color="primary"
                    size="small"
                    :loading="loadTable"
                    @click="listTable()"
                    title="Aggiorna lista"
                />
              </div>
            </template>

            <template v-slot:[`item.CREATED_AT`]="{item}">
              <span v-if="item.CREATED_AT" class="text-caption font-weight-medium">
                {{ dayjs(item.CREATED_AT).format('DD/MM/YYYY HH:mm') }}
              </span>
            </template>

            <template v-slot:[`item.UPDATED_AT`]="{item}">
              <span v-if="item.UPDATED_AT" class="text-caption text-grey-darken-1">
                {{ dayjs(item.UPDATED_AT).format('DD/MM/YYYY HH:mm') }}
              </span>
            </template>

            <template v-slot:[`item.FILE_NAME`]="{item}">
              <div class="d-flex align-center gap-2 font-weight-bold text-body-2">
                <v-icon icon="mdi-file-text-outline" color="primary" size="18"></v-icon>
                <span>{{ item.FILE_NAME }}</span>
              </div>
            </template>

            <template v-slot:[`item.TAG`]="{item}">
              <v-chip size="x-small" color="secondary" variant="tonal" class="font-weight-bold">
                {{ item.TAG }}
              </v-chip>
            </template>

            <template v-slot:[`item.STATUS`]="{item}">
              <div v-html="getStatus(item)"></div>
            </template>
          </v-data-table>
        </div>
      </v-slide-y-transition>
    </v-sheet>
  </section>
</template>

<style scoped>
.obbligatorio {
  color: #ef4444;
  font-weight: 600;
}

.bg-slate-50 {
  background-color: #f8fafc;
}
</style>