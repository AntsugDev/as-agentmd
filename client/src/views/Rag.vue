<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import FileUpload, { type FileUploadRemoveEvent, type FileUploadSelectEvent } from 'primevue/fileupload'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import ChunksDialog from './ChunksDialog.vue'
import { api, type Payload } from '../services/api.ts'

interface RagFile {
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
  TEXT_CHUNKS: string
}

const ACCEPTED_FILES = '.txt,.md,.pdf,.doc,.docx,.xls,.xlsx,.csv,text/plain,text/markdown,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv'

const { t } = useI18n()
const tagItems = ref<{ TAG: string }[]>([])
const loading = ref(false)
const loadTable = ref(false)
const viewForm = ref(false)
const viewTable = ref(true)
const rulesTag = ref(false)
const fileRequired = ref(false)
const table = ref<RagFile[]>([])
const notice = ref<string | null>(null)

const formData = reactive<{
  tag: string | null
  tagCreate: string | null
  files: File[]
}>({
  tag: null,
  tagCreate: null,
  files: [],
})

const selectTags = async () => {
  try {
    loading.value = true
    const response = await api({
      url: 'tags', method: 'GET'
    } as Payload)
    if (response) tagItems.value = response.data
  } catch (err) {
    console.error('Errore caricamento argomenti', err)
  } finally {
    loading.value = false
  }
}

const validateTag = () => {
  rulesTag.value = !formData.tag && !formData.tagCreate
  return !rulesTag.value
}

const uploaded = async () => {
  rulesTag.value = !formData.tag && !formData.tagCreate
  fileRequired.value = formData.files.length === 0
  if (rulesTag.value || fileRequired.value) return

  try {
    loading.value = true
    const form = new FormData()
    if (formData.tag && !formData.tagCreate) {
      form.append('argument', formData.tag)
    } else if (!formData.tag && formData.tagCreate) {
      form.append('argument', formData.tagCreate)
    }
    formData.files.forEach((file) => form.append('files', file))

    const response = await api({
      url: 'rag/files',
      method: 'POST',
      body: form,
    } as Payload)
    if (response && parseInt(response.status) === 201) {
      notice.value = t('rag.insert_OK')
      window.location.reload()
    }
  } catch (err) {
    console.error('Errore caricamento documenti', err)
  } finally {
    loading.value = false
  }
}

const resetTagError = () => {
  if (rulesTag.value) validateTag()
}

const onFilesSelected = (event: FileUploadSelectEvent) => {
  formData.files = event.files as File[]
  fileRequired.value = false
}

const onFilesRemoved = (event: FileUploadRemoveEvent) => {
  formData.files = event.files
  fileRequired.value = false
}

const onFilesCleared = () => {
  formData.files = []
}

const invertView = () => {
  viewForm.value = !viewForm.value
  if (viewForm.value) {
    viewTable.value = false
    selectTags()
  }
}

const listTable = async () => {
  try {
    loadTable.value = true
    const response = await api({
      url: 'rag/files', method: 'GET'
    } as Payload)
    if (response) table.value = response.data
  } catch (err) {
    console.error('Errore caricamento lista documenti', err)
  } finally {
    loadTable.value = false
  }
}

const invertViewTable = () => {
  viewTable.value = !viewTable.value
  if (viewTable.value) {
    viewForm.value = false
    if (table.value.length === 0) listTable()
  }
}

const paginatorTemplate = 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown'
const currentPageReport = computed(() => t('rag.pageReport', {
  first: '{first}',
  last: '{last}',
  total: '{totalRecords}',
}))

const getStatus = (item: RagFile) => {
  const status = item.STATUS_NAME?.toUpperCase() ?? ''
  if (status === 'PENDING' || (status === 'OK' && item.ELABORATE !== item.TOT_EMB)) {
    return { label: t('rag.wait'), icon: 'mdi mdi-clock-time-four-outline', severity: 'warn' as const }
  }
  if (status === 'OK') {
    return { label: t('rag.success'), icon: 'mdi mdi-check-circle-outline', severity: 'success' as const }
  }
  if (status === 'KO') {
    return { label: t('rag.error'), icon: 'mdi mdi-alert-circle-outline', severity: 'danger' as const }
  }
  if (status === 'PROCESSING') {
    return { label: t('rag.insert_OK'), icon: 'mdi mdi-loading mdi-spin', severity: 'info' as const }
  }
  return { label: item.STATUS_NAME, icon: 'mdi mdi-help-circle-outline', severity: 'secondary' as const }
}

const dialog = ref(false)
const propsDialog = ref<string | null>(null)
const fileIdDialog = ref<number | null>(null)
const fileNameDialog = ref<string | null>(null)

watch(dialog, (isOpen) => {
  if (!isOpen) {
    propsDialog.value = null
    fileIdDialog.value = null
    fileNameDialog.value = null
  }
})

const viewChunks = (text: string, id: number, name: string | null = null) => {
  propsDialog.value = text
  fileIdDialog.value = id
  fileNameDialog.value = name
  dialog.value = true
}

onMounted(listTable)
</script>

<template>
  <section class="content-grid">
    <div class="section-heading">
      <Tag :value="t('rag.documentHub')" icon="mdi mdi-file-document-multiple-outline" severity="secondary" class="rag-badge" />
      <h1>{{ t('rag.title') }}</h1>
    </div>

    <section class="panel rag-panel">
      <button
        class="rag-panel__toggle"
        type="button"
        :aria-expanded="viewForm"
        @click="invertView"
      >
        <span class="rag-panel__title">
          <i class="mdi mdi-cloud-upload-outline" aria-hidden="true"></i>
          <span>{{ t('rag.form') }}</span>
        </span>
        <i class="mdi rag-panel__chevron" :class="viewForm ? 'mdi-chevron-up' : 'mdi-chevron-down'" aria-hidden="true"></i>
      </button>

      <Transition name="rag-panel">
        <div v-show="viewForm" class="rag-panel__content">
          <Message v-if="notice" severity="success" class="rag-success-message">
            {{ notice }}
          </Message>

          <div class="rag-form-section">
            <div class="rag-form-section__title">
              <i class="mdi mdi-tag-plus-outline" aria-hidden="true"></i>
              <span>{{ t('rag.tag') }}</span>
            </div>

            <div class="rag-form-fields">
              <div class="rag-field">
                <label class="rag-field__label" for="rag-new-topic">{{ t('rag.topic_create') }}</label>
                <span class="rag-input-wrapper">
                  <i class="mdi mdi-plus-box-outline" aria-hidden="true"></i>
                  <InputText
                    id="rag-new-topic"
                    v-model="formData.tagCreate"
                    :disabled="loading"
                    :aria-label="t('rag.topic_create')"
                    @update:model-value="resetTagError"
                  />
                </span>
              </div>
              <div class="rag-field">
                <label class="rag-field__label" for="rag-topic">{{ t('rag.topics') }}</label>
                <Select
                  v-model="formData.tag"
                  input-id="rag-topic"
                  :options="tagItems"
                  option-label="TAG"
                  option-value="TAG"
                  :placeholder="t('rag.topics')"
                  :loading="loading"
                  :disabled="loading"
                  show-clear
                  class="rag-select"
                  @update:model-value="resetTagError"
                >
                  <template #dropdownicon><i class="mdi mdi-chevron-down" aria-hidden="true"></i></template>
                  <template #loadingicon><i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i></template>
                </Select>
              </div>
            </div>
            <Message v-if="rulesTag" severity="error" size="small" variant="simple">
              {{ t('rag.obbligatorio') }}
            </Message>
          </div>

          <div class="rag-form-section">
            <div class="rag-form-section__title">
              <i class="mdi mdi-paperclip" aria-hidden="true"></i>
              <span>{{ t('rag.file') }}</span>
            </div>
            <p class="rag-help-text">{{ t('rag.only_file') }}</p>

            <FileUpload
              mode="advanced"
              :multiple="true"
              :accept="ACCEPTED_FILES"
              :disabled="loading"
              :custom-upload="true"
              :show-upload-button="false"
              :show-cancel-button="false"
              :choose-label="t('rag.chooseFiles')"
              :choose-button-props="{ severity: 'secondary', outlined: true }"
              class="rag-file-upload"
              @select="onFilesSelected"
              @remove="onFilesRemoved"
              @clear="onFilesCleared"
            >
              <template #header="{ chooseCallback, clearCallback, files }">
                <div class="rag-file-upload__header">
                  <Button
                    :label="t('rag.chooseFiles')"
                    icon="mdi mdi-cloud-upload-outline"
                    severity="secondary"
                    outlined
                    :disabled="loading"
                    @click="chooseCallback"
                  />
                  <Button
                    v-if="files.length > 0"
                    :label="t('rag.clearFiles')"
                    icon="mdi mdi-close"
                    text
                    severity="secondary"
                    :disabled="loading"
                    @click="clearCallback"
                  />
                </div>
              </template>
              <template #chooseicon><i class="mdi mdi-cloud-upload-outline" aria-hidden="true"></i></template>
              <template #cancelicon><i class="mdi mdi-close" aria-hidden="true"></i></template>
              <template #fileremoveicon><i class="mdi mdi-close" aria-hidden="true"></i></template>
              <template #empty>
                <div class="rag-file-upload__empty">
                  <i class="mdi mdi-cloud-upload-outline" aria-hidden="true"></i>
                  <span>{{ t('rag.dragDropFiles') }}</span>
                </div>
              </template>
            </FileUpload>
            <Message v-if="fileRequired" severity="error" size="small" variant="simple">
              {{ t('rag.fileRequired') }}
            </Message>
          </div>

          <div class="rag-form-footer">
            <div class="processing-schedule-note">
              <i class="mdi mdi-clock-outline" aria-hidden="true"></i>
              <span>{{ t('rag.scheduledProcessing') }}</span>
            </div>
            <Button
              :label="t('rag.up')"
              icon="mdi mdi-cloud-upload"
              icon-pos="right"
              severity="success"
              size="large"
              :loading="loading"
              :disabled="loading"
              @click="uploaded"
            />
          </div>
        </div>
      </Transition>
    </section>

    <section class="panel rag-panel">
      <button
        class="rag-panel__toggle"
        type="button"
        :aria-expanded="viewTable"
        @click="invertViewTable"
      >
        <span class="rag-panel__title">
          <i class="mdi mdi-table" aria-hidden="true"></i>
          <span>{{ t('rag.table') }}</span>
        </span>
        <i class="mdi rag-panel__chevron" :class="viewTable ? 'mdi-chevron-up' : 'mdi-chevron-down'" aria-hidden="true"></i>
      </button>

      <Transition name="rag-panel">
        <div v-show="viewTable" class="rag-panel__content">
          <div class="rag-table-toolbar">
            <strong>{{ t('rag.storedDocuments') }}</strong>
            <Button
              icon="mdi mdi-refresh"
              text
              rounded
              :aria-label="t('rag.refresh')"
              :title="t('rag.refresh')"
              :loading="loadTable"
              @click="listTable"
            />
          </div>

          <DataTable
            :value="table"
            :loading="loadTable"
            data-key="FILE_ID"
            paginator
            :rows="10"
            :rows-per-page-options="[10, 25, 50]"
            :paginator-template="paginatorTemplate"
            :current-page-report-template="currentPageReport"
            class="rag-data-table"
            responsive-layout="scroll"
          >
            <template #empty>
              <div class="rag-table-empty">
                <i class="mdi mdi-file-document-outline" aria-hidden="true"></i>
                <span>{{ t('rag.emptyTable') }}</span>
              </div>
            </template>

            <Column field="FILE_NAME" :header="t('rag.fileName')" sortable>
              <template #body="{ data }">
                <div class="rag-file-name">
                  <i class="mdi mdi-file-text-outline" aria-hidden="true"></i>
                  <span>{{ data.FILE_NAME }}</span>
                </div>
              </template>
            </Column>
            <Column field="TAG" :header="t('rag.tagTable')" sortable>
              <template #body="{ data }">
                <Tag :value="data.TAG" severity="secondary" />
              </template>
            </Column>
            <Column field="STATUS_NAME" :header="t('rag.status')" sortable>
              <template #body="{ data }">
                <Tag
                  :value="getStatus(data).label"
                  :icon="getStatus(data).icon"
                  :severity="getStatus(data).severity"
                  class="rag-status-tag"
                />
              </template>
            </Column>
            <Column field="CREATED_AT" :header="t('rag.created')" sortable>
              <template #body="{ data }">
                <span v-if="data.CREATED_AT" class="rag-date">{{ dayjs(data.CREATED_AT).format('DD/MM/YYYY HH:mm') }}</span>
              </template>
            </Column>
            <Column field="UPDATED_AT" :header="t('rag.update')" sortable>
              <template #body="{ data }">
                <span v-if="data.UPDATED_AT" class="rag-date">{{ dayjs(data.UPDATED_AT).format('DD/MM/YYYY HH:mm') }}</span>
              </template>
            </Column>
            <Column :header="t('rag.actions')" class="rag-actions-column">
              <template #body="{ data }">
                <Button
                  v-if="data.TEXT_CHUNKS"
                  icon="mdi mdi-view-grid-outline"
                  text
                  rounded
                  :aria-label="t('rag.viewChunks')"
                  :title="t('rag.viewChunks')"
                  :disabled="loadTable"
                  @click="viewChunks(data.TEXT_CHUNKS, data.FILE_ID, data.FILE_NAME)"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </Transition>
    </section>

    <ChunksDialog v-model="dialog" :item="propsDialog" :file-id="fileIdDialog" :file-name="fileNameDialog" />
  </section>
</template>

<style scoped>
.rag-badge {
  width: fit-content;
}

.rag-panel {
  height: max-content;
}

.rag-panel__toggle {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.rag-panel__toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
}

.rag-panel__title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-main);
  font-size: 1.05rem;
  font-weight: 700;
}

.rag-panel__title > .mdi {
  color: var(--color-primary);
  font-size: 1.25rem;
}

.rag-panel__chevron {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: var(--color-primary);
  background: #eef2ff;
  font-size: 1.15rem;
}

.rag-panel__content {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.rag-success-message {
  margin-bottom: 16px;
}

.rag-panel-enter-active,
.rag-panel-leave-active {
  overflow: hidden;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.rag-panel-enter-from,
.rag-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.rag-form-section {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: #f8fafc;
}

.rag-form-section__title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #334155;
  font-size: 0.94rem;
  font-weight: 700;
}

.rag-form-section__title > .mdi {
  color: var(--color-primary);
  font-size: 1.15rem;
}

.rag-form-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.rag-field {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.rag-field__label {
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
}

.rag-input-wrapper {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
}

.rag-input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.rag-input-wrapper > .mdi {
  color: #64748b;
}

.rag-input-wrapper :deep(.p-inputtext) {
  width: 100%;
  min-width: 0;
  padding: 9px 0;
  border: 0;
  outline: 0;
  box-shadow: none;
}

.rag-select {
  width: 100%;
}

.rag-help-text {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}

.rag-file-upload {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: #fff;
}

.rag-file-upload :deep(.p-fileupload-header) {
  display: flex;
  justify-content: flex-start;
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
}

.rag-file-upload__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rag-file-upload :deep(.p-fileupload-content) {
  min-height: 120px;
  padding: 12px;
}

.rag-file-upload__empty {
  display: flex;
  min-height: 90px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.rag-file-upload__empty > .mdi {
  color: var(--color-primary);
  font-size: 1.5rem;
}

.rag-form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 2px;
}

.rag-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: #475569;
  font-size: 0.92rem;
}

.processing-schedule-note {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.5;
}

.processing-schedule-note > .mdi {
  flex: 0 0 auto;
  font-size: 1rem;
}

.rag-data-table {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.rag-data-table :deep(.p-datatable-table-container) {
  overflow-x: auto;
}

.rag-data-table :deep(.p-datatable-thead > tr > th) {
  padding: 12px 14px;
  color: #475569;
  background: #f8fafc;
  font-size: 0.8rem;
  white-space: nowrap;
}

.rag-data-table :deep(.p-datatable-tbody > tr > td) {
  padding: 12px 14px;
  font-size: 0.82rem;
}

.rag-file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
  color: #1e293b;
  font-weight: 600;
}

.rag-file-name > .mdi {
  flex: 0 0 auto;
  color: var(--color-primary);
  font-size: 1.1rem;
}

.rag-file-name > span {
  overflow-wrap: anywhere;
}

.rag-status-tag {
  white-space: nowrap;
}

.rag-date {
  color: #64748b;
  white-space: nowrap;
}

.rag-table-empty {
  display: flex;
  min-height: 110px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-text-muted);
}

.rag-table-empty > .mdi {
  font-size: 1.25rem;
}

.rag-actions-column {
  width: 5rem;
}

@media (max-width: 680px) {
  .rag-form-fields {
    grid-template-columns: 1fr;
  }

  .rag-form-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .rag-form-footer :deep(.p-button) {
    align-self: flex-end;
  }
}
</style>
