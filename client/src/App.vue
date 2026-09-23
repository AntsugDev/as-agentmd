<script setup lang="ts">
import {onBeforeMount, onMounted, onUnmounted, provide, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {api, snack, type Payload} from "./services/api.ts";

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

onBeforeMount(() => {
  setSession()
})
// Separate boolean ref so Vuetify can manage timeout autonomously
const snackVisible = ref<boolean>(false)

watch(snack, (v) => {
  if (v && v.view) {
    snackVisible.value = true
  }
}, { deep: true })

// When Vuetify closes the snackbar (via timeout or ESC), sync back snack state
watch(snackVisible, (v) => {
  if (!v) {
    snack.value = { ...snack.value, view: false }
  }
})

onMounted(() => {
  goToArchives()
})
onUnmounted(() => {
  if (polling.value) {
    clearTimeout(polling.value)
    polling.value = null
  }
})

const closeSnack = () => {
  snackVisible.value = false
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
    }
  } catch (err: any) {
    console.error("Eccezione lista chat archiviate", err)
  }finally {
    polling.value = setTimeout(() => {
      goToArchives()
    }, 30000)
  }
}
const recupera = ref<any[]>([])
const openArchive = (data: any[]) => {
  try {
    recupera.value = data
    if(route.fullPath.toString().indexOf('home') === -1)
      router.push({name: 'home'})
  } catch (err: any) {
    console.error("Eccezione recupero chat", err)
  }
}
const goToCtrlChat = ()=>{
  router.push({name:'double_chat'})
}
const goToRag = () => {
  router.push({name:'rag'})
}
</script>

<template>
  <v-app>
    <v-main class="app-shell">
      <v-container class="py-5 py-md-7 px-4 px-md-6" fluid>
        <section class="page-frame">
          <header class="app-header">
            <button class="brand-button" type="button" @click="goToHome">
              <span class="brand-mark">
                <v-icon icon="mdi-creation" size="22" color="white"></v-icon>
              </span>
              <span>
                <strong>AgentMd</strong>
                <small>{{ t('app.subtitle') }}</small>
              </span>
            </button>

            <!-- Navigation Links -->
            <nav class="header-nav d-none d-md-flex align-center ga-2 px-2">
              <v-btn
                  variant="text"
                  :color="route.name === 'home' ? 'primary' : 'default'"
                  prepend-icon="mdi-chat-processing-outline"
                  @click="goToHome"
                  class="font-weight-bold text-capitalize px-3"
                  rounded="lg"
              >
                {{ t('navigation.home') }}
              </v-btn>
              <v-btn
                  variant="text"
                  :color="route.name === 'double_chat' ? 'primary' : 'default'"
                  prepend-icon="mdi-compare"
                  @click="goToCtrlChat"
                  class="font-weight-bold text-capitalize px-3"
                  rounded="lg"
              >
                {{ t('navigation.compare') }}
              </v-btn>
              <v-btn
                  variant="text"
                  :color="route.name === 'rag' ? 'primary' : 'default'"
                  prepend-icon="mdi-file-document-multiple-outline"
                  @click="goToRag"
                  class="font-weight-bold text-capitalize px-3"
                  rounded="lg"
              >
                {{ t('navigation.rag') }}
              </v-btn>
              <v-btn
                  variant="text"
                  :color="route.name === 'settings' ? 'primary' : 'default'"
                  prepend-icon="mdi-cog-outline"
                  @click="goToSettings"
                  class="font-weight-bold text-capitalize px-3"
                  rounded="lg"
              >
                {{ t('navigation.settings') }}
              </v-btn>
            </nav>

            <div class="header-actions d-flex align-center ga-3">
              <!-- Archive Dropdown Menu -->
              <v-menu location="bottom end" v-if="archive.length > 0" transition="scale-transition">
                <template v-slot:activator="{ props }">
                  <v-btn
                      v-bind="props"
                      icon
                      variant="tonal"
                      color="primary"
                      size="small"
                      :title="t('navigation.archivia')"
                  >
                    <v-badge :content="archive.length" color="secondary" offset-x="-2" offset-y="-2">
                      <v-icon icon="mdi-archive-outline" size="20"></v-icon>
                    </v-badge>
                  </v-btn>
                </template>

                <v-card width="320" class="elevation-4 mt-2" rounded="xl" border>
                  <v-card-title class="text-subtitle-2 font-weight-bold d-flex align-center justify-space-between py-3 px-4 border-b">
                    <div class="d-flex align-center gap-2">
                      <v-icon icon="mdi-archive" color="primary" size="18"></v-icon>
                      <span>{{ t('navigation.archivia') }}</span>
                    </div>
                    <v-chip size="x-small" color="primary" variant="flat">{{ archive.length }}</v-chip>
                  </v-card-title>

                  <v-list density="compact" class="py-1" style="max-height: 280px; overflow-y: auto;">
                    <v-list-item
                        v-for="(item, index) in archive"
                        :key="index"
                        @click="openArchive(item)"
                        class="px-4 py-2 hover-archive-item"
                    >
                      <template #prepend>
                        <v-icon icon="mdi-message-text-outline" size="16" color="grey"></v-icon>
                      </template>
                      <v-list-item-title class="text-caption font-weight-medium">
                        {{ item.title }}
                      </v-list-item-title>
                      <v-list-item-subtitle class="text-overline text-grey-darken-1" style="font-size: 0.65rem !important;">
                        {{ item.time }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-menu>

              <!-- Mobile Quick Nav Buttons -->
              <div class="d-flex d-md-none align-center gap-1">
                <v-btn icon variant="text" size="small" @click="goToHome" :color="route.name === 'home' ? 'primary' : 'default'">
                  <v-icon icon="mdi-chat-processing-outline" size="22"></v-icon>
                </v-btn>
                <v-btn icon variant="text" size="small" @click="goToCtrlChat" :color="route.name === 'double_chat' ? 'primary' : 'default'">
                  <v-icon icon="mdi-compare" size="22"></v-icon>
                </v-btn>
                <v-btn icon variant="text" size="small" @click="goToRag" :color="route.name === 'rag' ? 'primary' : 'default'">
                  <v-icon icon="mdi-file-document-multiple-outline" size="22"></v-icon>
                </v-btn>
                <v-btn icon variant="text" size="small" @click="goToSettings" :color="route.name === 'settings' ? 'primary' : 'default'">
                  <v-icon icon="mdi-cog-outline" size="22"></v-icon>
                </v-btn>
              </div>

              <!-- Locale Switcher Pill -->
              <v-btn
                  variant="tonal"
                  color="primary"
                  size="small"
                  @click="toggleLocale"
                  class="font-weight-bold text-caption px-3"
                  rounded="pill"
                  prepend-icon="mdi-translate"
              >
                {{ locale.toUpperCase() }}
              </v-btn>
            </div>
          </header>

          <!-- Floating Error / Success Snackbar Notification -->
          <v-snackbar
              v-model="snackVisible"
              :color="snack.error ? 'error' : 'success'"
              :timeout="60000"
              location="top"
              elevation="24"
              rounded="xl"
              class="mt-3"
          >
            <div class="d-flex align-center justify-space-between w-100 ga-3 py-1">
              <div class="d-flex align-center ga-2">
                <v-icon :icon="snack.error ? 'mdi-alert-circle-outline' : 'mdi-check-circle-outline'" size="24"></v-icon>
                <div>
                  <div class="font-weight-bold text-caption text-uppercase">{{ snack.error ? t('eccezione') : t('success') }}</div>
                  <div class="text-body-2">{{ snack.msg || 'Generico' }}</div>
                </div>
              </div>
              <v-btn icon="mdi-close" variant="text" size="small" color="white" @click="closeSnack"></v-btn>
            </div>
          </v-snackbar>

          <v-skeleton-loader v-if="!session" type="article, actions" rounded="xl"/>
          <router-view v-else :recupera="recupera"/>
        </section>
      </v-container>
    </v-main>
  </v-app>
</template>
