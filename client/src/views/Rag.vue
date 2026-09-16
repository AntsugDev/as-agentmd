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
const icon = ref<string>('mdi-arrow-down-drop-circle')
const viewForm = ref<boolean>(false)
const viewTable = ref<boolean>(true)
const alt = ref<string>(t('alt.open'))
const altTable = ref<string>(t('alt.closed'))
const iconTable = ref<string>('mdi-arrow-up-drop-circle')

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
const notice=ref<string|null>(null)
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

      formData.files.map((e:any) => {
        f.append('files',e)
      })
      const response = await api({
        url: `rag/files`,
        method: 'POST',
        body: f,
      } as Payload)
      if(response && parseInt(response.status) === 201){
        notice.value = t('rag.insert_OK')
        window.location.reload();
      }
    }else throw new Error("Form non valido")
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
  if (icon.value.toString().indexOf('down') !== -1) {
    icon.value = 'mdi-arrow-up-drop-circle'
    alt.value = t('alt.closed')
    if (viewTable.value) {
      viewTable.value = false
      iconTable.value = 'mdi-arrow-down-drop-circle'
      altTable.value = t('alt.open')
    }
    selectTags()
  } else {
    icon.value = 'mdi-arrow-down-drop-circle'
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
  if (iconTable.value.toString().indexOf('down') !== -1) {
    iconTable.value = 'mdi-arrow-up-drop-circle'
    altTable.value = t('alt.closed')
    if (viewForm.value) {
      viewForm.value = false
      icon.value = 'mdi-arrow-down-drop-circle'
      alt.value = t('alt.open')
    }
  } else {
    iconTable.value = 'mdi-arrow-down-drop-circle'
    altTable.value = t('alt.open')
    if (table.value.length === 0) listTable()
  }
}
const headers = [
  {title: t('rag.fileName'), key: 'FILE_NAME'},
  {title: t('rag.preview'), key: 'PREVIEW_CONTENT_FILE'},
  {title: t('rag.tagTable'), key: 'TAG'},
  {title: t('rag.status'), key: 'STATUS', align: 'center'},
  {title: t('rag.created'), key: 'CREATED_AT'},
  {title: t('rag.update'), key: 'UPDATED_AT'},
]
const getStatus = (status: string) => {
  const title = getTitleStatus(status)

  if (status === 'SUCCESS' || 'OK')
    return `<span style="vertical-align: middle"><i  class=" mdi mdi-hand-okay"  style="font-size: 33px;color: #0f766e" alt="${title}" title=""${title}></i></span>`
  else if (status === 'WAIT EMBED' || 'WAIT CHUNK' || 'processing')
    return `<span style="vertical-align: middle"><i  class=" mdi mdi-wrench-clock"  style="font-size: 33px;color: #FDC745" alt="${title}" title=""${title}></i></span>`
  else if (status === 'EXCEPTION FILE' || status === 'EXCEPTION CHUNK' || 'ko')
    return `<span style="vertical-align: middle"><i   class=" mdi mdi-alert-circle"  style="font-size: 33px;color: #b42318" alt="${title}" title=""${title}></i></span>`
  else
    return `<span style="vertical-align: middle"><v-icon  icon="mdi-wrench-clock"  style="font-size: 33px;color: #FDC745" alt="${title}" title=""${title}></v-icon></span>`
}

const getTitleStatus = (s: string) => {
  if (s === 'SUCCESS' || 'OK')
    return t('rag.success')
  else if (s === 'WAIT EMBED' || 'WAIT CHUNK' || 'processing')
    return t('rag.wait')
  else if (s === 'EXCEPTION FILE' || status === 'EXCEPTION CHUNK' || 'ko')
    return t('rag.error')
  else return t('rag.wait')
}

onMounted(() => {
  listTable()
})

</script>

<template>
  <section class="content-grid">
    <div class="section-heading">
      <h1>{{ t('rag.title') }}</h1>
    </div>
    <v-sheet class="panel" rounded="lg" border style="height: max-content">
      <div class="d-flex flex-row mb-3 justify-space-between">
        <p class="text-body-medium">{{ t('rag.form') }}</p>
        <v-icon :icon="icon" size="30" @click="invertView" :alt="alt" :title="alt"></v-icon>
      </div>
      <v-divider></v-divider>
      <v-alert v-if="notice" type="success" variant="tonal" density="compact">
        {{ notice }}
      </v-alert>
      <v-form ref="formRag" v-model="valid" v-if="viewForm">
        <div class="d-flex flex-column justify-center pa-4 ga-2 elevation-1"
             style="border: 1px solid; border-radius: 5px">
          <p class="text-body-medium mb-2 ">{{ t('rag.tag') }}</p>
          <v-text-field :label="t('rag.topic_create')" density="compact"
                        variant="solo"
                        v-model="formData.tagCreate" class="mb-2"
                        @update:focused="resetError"
                        :disabled="loading"
          ></v-text-field>
          <v-autocomplete
              v-model="formData.tag"
              :model-value="formData.tag"
              :items="tagItems"
              item-title="TAG"
              item-value="TAG"
              :label="t('rag.topics')"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-brain"
              hide-details="auto"
              :loading="loading"
              @update:focused="resetError"
              :disabled="loading"
          />
          <p class="obbligatorio text-body-medium mt-2 ml-3" v-if="rulesTag">{{ t('rag.obbligatorio') }}</p>
        </div>

        <div class="d-flex flex-column justify-center pa-4 ga-2 elevation-1 mt-4"
             style="border: 1px solid; border-radius: 5px"
        >
          <p class="text-body-medium mb-2" style="color: #b42318">{{ t('rag.only_file') }}</p>
          <v-file-input v-model="formData.files"
                        clearable
                        chips
                        counter
                        show-size
                        :label="t('rag.file')"
                        accept=".txt,.md,.pdf,.doc,.docx,.xls,.xlsx,.csv,text/plain,text/markdown,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                        variant="solo" multiple
                        :rules="[v => !!v || t('obbligatorio')]"
                        :disabled="loading"
          >

          </v-file-input>
        </div>
        <div class="d-flex flex-row mt-3 pa-2 ga-2 justify-end">
          <v-btn
              color="success"
              :loading="loading"
              :disabled="loading"
              append-icon="mdi-upload"
              @click="uploaded"
              variant="elevated"
              :alt=" t('rag.up')"
              :title=" t('rag.up')"
              class="mr-3"

          >{{ t('rag.up') }}
          </v-btn>
        </div>
      </v-form>
    </v-sheet>
    <v-sheet class="panel" rounded="lg" border style="height: max-content">
      <div class="d-flex flex-row mb-3 justify-space-between">
        <p class="text-body-medium">{{ t('rag.table') }}</p>
        <v-icon :icon="iconTable" size="30" @click="invertViewTable" :alt="altTable" :title="altTable"></v-icon>
      </div>
      <v-divider></v-divider>
      <div v-if="viewTable">

        <v-data-table
            :headers="headers"
            :items="table"
            :loading="loadTable"
        >
          <template v-slot:[`item.CREATED_AT`]="{item}">
            <span v-if="item.CREATED_AT">
              {{ dayjs(item.CREATED_AT).format('DD/MM/YYYY HH:mm:ss') }}
            </span>
          </template>

          <template v-slot:[`item.UPDATED_AT`]="{item}">
            <span v-if="item.UPDATED_AT">
              {{ dayjs(item.UPDATED_AT).format('DD/MM/YYYY HH:mm:ss') }}
            </span>
          </template>

          <template v-slot:[`item.PREVIEW_CONTENT_FILE`]="{item}">
            {{ item.PREVIEW_CONTENT_FILE }} ...
          </template>

          <template v-slot:[`item.STATUS`]="{item}">
            <div v-html="getStatus(item.STATUS)"></div>
          </template>
        </v-data-table>

      </div>
    </v-sheet>

  </section>

</template>

<style scoped>
.obbligatorio {
  color: #b42318;
}
</style>