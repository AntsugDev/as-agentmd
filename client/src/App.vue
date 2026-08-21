<script setup lang="ts">
import {onBeforeMount, onMounted, onUnmounted, provide, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {api, type Payload} from "./services/api.ts";

const route = useRoute()
const router = useRouter()
const {t, locale} = useI18n()


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
onUnmounted(() => {
  if (polling.value) clearTimeout(polling.value)
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
    if (polling.value) clearTimeout(polling.value)
    const response = await api({
      url: 'archive', method: 'GET'
    } as Payload)
    if (response) {
      archive.value = response.data
      polling.value = setTimeout(() => {
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
    if(route.fullPath.toString().indexOf('settings') !== -1)
      router.push({name: 'home'})
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


              <v-menu location="bottom" v-if="archive.length > 0">
                <template v-slot:activator="{ props }">
                  <v-badge :content="archive.length" color="info" v-bind="props">
                    <v-icon icon="mdi-archive" size="33" @click="openArchive"></v-icon>
                  </v-badge>
                </template>
                <v-list  :lines="false"
                         density="compact"
                         nav>
                  <v-list-item
                      v-for="(item, index) in archive"
                      :key="index"
                      @click="openArchive(item)"
                  >
                    <v-list-item-title>&blacktriangleright; {{ item.time }} - {{ item.title }}</v-list-item-title>
                  </v-list-item>
                </v-list>

              </v-menu>
              <v-icon size="33" icon="mdi-cog-outline" @click="goToSettings" class="ml-2" :alt="t('navigation.settings')" :title="t('navigation.settings')" ></v-icon>

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
