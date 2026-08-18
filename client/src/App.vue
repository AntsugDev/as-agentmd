<script setup lang="ts">
import {computed, onBeforeMount, onMounted, provide, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {api, type Payload} from "./services/api.ts";

const route = useRoute()
const router = useRouter()
const {t, locale} = useI18n()

const isSettings = computed(() => route.name === 'settings')

const goToHome = () => {
  router.push({name: 'home'})
}

const goToSettings = () => {
  router.push({name: 'settings'})
}

const toggleLocale = () => {
  locale.value = locale.value === 'it' ? 'en' : 'it'
}
const session = ref<boolean>(false)
const setSession = async () => {
  try {
    const r = await api({
      url: 'session', method: 'GET'
    } as Payload)
    if (r) {
      session.value = true
    }
  } catch (err: any) {
    console.log('Session error', err)
  }
}
const snack = ref<{
  error: boolean, msg: string | null, view: boolean
}>({
  error: false, msg: null, view: false
})

onBeforeMount(() => {
  setSession()
})
watch(snack, (v) => {
  if (v && v.view) {
    setTimeout(() => {
      closeSnack()
    }, 8000)
  }
})
onMounted(() => {
  goToArchives()
})

const closeSnack = () => {
  snack.value = {
    error: false,
    msg: null,
    view: false
  }
}
provide('snack', snack)

const archive = ref<any[]>([])
const polling = ref<any | null>(null)
const goToArchives = async () => {
  try {
    if (polling.value) clearInterval(polling.value)
    const response = await api({
      url: 'archive', method: 'GET'
    } as Payload)
    if (response) {
      archive.value = response.data
      polling.value = setInterval(() => {
        goToArchives()
      }, 30000)
    }
  } catch (err: any) {
    console.error("Eccezione lista chat archiviate", err)
  }
}
const recupera = ref<any[]>([])
const openArchive = (data: any[]) => {
  try {
    recupera.value = data
  } catch (err: any) {
    console.error("Eccezione recupero chat", err)
  }
}
</script>

<template>
  <v-app>
    <v-main class="app-shell">
      <v-container class="py-6 py-md-8" fluid>
        <section class="page-frame">
          <header class="app-header">
            <button class="brand-button" type="button" @click="goToHome">
              <span class="brand-mark">A</span>
              <span>
                <strong>AgentMd</strong>
                <small>{{ t('app.subtitle') }}</small>
              </span>
            </button>

            <div class="header-actions">


              <v-menu location="bottom" v-if="archive.length > 0" open-on-hover>
                <template v-slot:activator="{ props }">
                  <v-badge :content="archive.length" color="info" v-bind="props">
                    <v-icon icon="mdi-archive" @click="openArchive"></v-icon>
                  </v-badge>
                </template>
                <v-list density="compact">
                  <v-list-item
                      v-for="(item, index) in archive"
                      :key="index"
                      @click="openArchive(item)"
                  >
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                  </v-list-item>
                </v-list>

              </v-menu>
              <v-btn
                  :variant="isSettings ? 'flat' : 'text'"
                  :color="isSettings ? 'primary' : undefined"
                  icon="mdi-cog-outline"
                  :aria-label="t('navigation.settings')"
                  @click="goToSettings"
              />
              <v-btn variant="tonal" color="primary" size="small" @click="toggleLocale">
                {{ locale.toUpperCase() }}
              </v-btn>
            </div>
          </header>

          <v-alert
              density="compact"
              class="mb-3 mt-3"
              rounded="5"
              v-if="snack.view"
              :text="snack.msg || 'generico'"
              :title="snack.error ? t('eccezione') : t('success')"
              :type="snack.error ? 'error' : 'success'"
          />

          <v-skeleton-loader v-if="!session" type="article, actions"/>
          <router-view v-else :recupera="recupera"/>
        </section>
      </v-container>
    </v-main>
  </v-app>
</template>
