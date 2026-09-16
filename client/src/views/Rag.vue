<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {onBeforeMount, onMounted, reactive, ref} from "vue";
import {api, type Payload} from "../services/api.ts";

const {t} = useI18n()
const tagItems = ref<any[]>([])
const loading = ref<boolean>(false)
const valid = ref<boolean>(false)
const formRag = ref<any | null>(null)

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

const uploaded = () => {
  try {
    console.log(rulesTag.value)
    loading.value = true
    if (rulesTagF()) {

    }
  } catch (err: any) {
    console.log(err)
  } finally {
    loading.value = false

  }

}
const resetError = () => {
  if(rulesTag.value) rulesTag.value = false
}

onBeforeMount(() => {
  selectTags()
})


</script>

<template>
  <section class="content-grid">
    <div class="section-heading">
      <h1>{{ t('rag.title') }}</h1>
    </div>
    <v-sheet class="panel conversation-panel" rounded="lg" border>
      <v-form ref="formRag" v-model="valid">
        <div class="d-flex flex-column justify-center pa-4 ga-2 elevation-1"
             style="border: 1px solid; border-radius: 5px">
          <p class="text-body-medium mb-2 ">{{ t('rag.tag') }}</p>
          <v-text-field :label="t('rag.topic_create')" density="compact"
                        variant="solo"
                        v-model="formData.tagCreate" class="mb-2"
                        @update:focused="resetError"

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
          />
          <p class="obbligatorio text-body-medium mt-2 ml-3"  v-if="rulesTag">{{ t('rag.obbligatorio') }}</p>
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
          >

          </v-file-input>
        </div>
        <div class="d-flex flex-row mt-3 pa-2 ga-2 justify-end">
          <v-btn
              color="success"
              :loading="loading"
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
  </section>

</template>

<style scoped>
.obbligatorio{
  color: #b42318;
}
</style>