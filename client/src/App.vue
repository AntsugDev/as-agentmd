<script setup lang="ts">
import { computed, onBeforeMount, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Popover, { type PopoverMethods } from 'primevue/popover'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { api, snack, type Payload } from './services/api.ts'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t, locale } = useI18n()

const goToHome = () => {
  router.push({ name: 'home' })
}

const goToSettings = () => {
  router.push({ name: 'settings' })
}

const goTopreChat = () => {
  router.push({ name: 'prechat' })
}

const goToCtrlChat = () => {
  router.push({ name: 'double_chat' })
}

const goToRag = () => {
  router.push({ name: 'rag' })
}

const goToLogs = () => {
  router.push({ name: 'logs' })
}

const navigationItems = computed(() => [
  { name: 'home', label: t('navigation.home'), icon: 'mdi mdi-chat-processing-outline', navigate: goToHome },
  { name: 'double_chat', label: t('navigation.compare'), icon: 'mdi mdi-compare', navigate: goToCtrlChat },
  { name: 'rag', label: t('navigation.rag'), icon: 'mdi mdi-file-document-multiple-outline', navigate: goToRag },
  { name: 'logs', label: t('navigation.logs'), icon: 'mdi mdi-text-box-search-outline', navigate: goToLogs },
  { name: 'settings', label: t('navigation.settings'), icon: 'mdi mdi-cog-outline', navigate: goToSettings },
  { name: 'prechat', label: t('navigation.prechat'), icon: 'mdi mdi-chat', navigate: goTopreChat },
])

const toggleLocale = () => {
  locale.value = locale.value === 'it' ? 'en' : 'it'
}

const session = ref(false)
const setSession = async () => {
  try {
    const response = await api({
      url: 'session',
      method: 'GET',
    } as Payload)
    if (response) {
      session.value = true
    }
  } catch (err: any) {
    console.log('Session error', err)
  }
}

onBeforeMount(() => {
  setSession()
})

let toastGeneration = 0
const syncToastDismissal = (event: unknown) => {
  if (typeof event !== 'object' || event === null || !('message' in event)) return

  const message = event.message
  if (
    typeof message === 'object'
    && message !== null
    && 'styleClass' in message
    && message.styleClass === `app-toast-generation-${toastGeneration}`
  ) {
    snack.value = { ...snack.value, view: false }
  }
}

watch(snack, (notification) => {
  if (!notification.view) return

  const generation = ++toastGeneration
  toast.removeGroup('app-notifications')
  toast.add({
    group: 'app-notifications',
    styleClass: `app-toast-generation-${generation}`,
    severity: notification.error ? 'error' : 'success',
    summary: notification.error ? t('eccezione') : t('success'),
    detail: notification.msg || 'Generico',
    life: 60000,
  })
}, { deep: true })

onMounted(() => {
  goToArchives()
})

onUnmounted(() => {
  if (polling.value) {
    clearTimeout(polling.value)
    polling.value = null
  }
})

provide('snack', snack)

const archive = ref<any[]>([])
const polling = ref<ReturnType<typeof setTimeout> | null>(null)
const archivePopover = ref<PopoverMethods | null>(null)
const toggleArchive = (event: MouseEvent) => {
  archivePopover.value?.toggle(event)
}

const goToArchives = async () => {
  try {
    if (polling.value) clearTimeout(polling.value)
    const response = await api({
      url: 'archive',
      method: 'GET',
    } as Payload)
    if (response) {
      archive.value = response.data
    }
  } catch (err: any) {
    console.error('Eccezione lista chat archiviate', err)
  } finally {
    polling.value = setTimeout(() => {
      goToArchives()
    }, 30000)
  }
}

const recupera = ref<any[]>([])
const openArchive = (data: any[]) => {
  try {
    recupera.value = data
    archivePopover.value?.hide()
    if (route.fullPath.toString().indexOf('home') === -1) {
      router.push({ name: 'home' })
    }
  } catch (err: any) {
    console.error('Eccezione recupero chat', err)
  }
}
</script>

<template>
  <main class="app-shell">
    <div class="app-container">
      <section class="page-frame">
        <header class="app-header">
          <div class="app-header__top">
            <button class="brand-button" type="button" @click="goToHome">
              <span class="brand-mark">
                <i class="mdi mdi-creation" aria-hidden="true"></i>
              </span>
              <span class="brand-copy">
                <strong>AgentMd</strong>
                <small>{{ t('app.subtitle') }}</small>
              </span>
            </button>

            <div class="header-actions">
              <Button
                v-if="archive.length > 0"
                icon="mdi mdi-archive-outline"
                :badge="String(archive.length)"
                badge-severity="secondary"
                outlined
                rounded
                class="archive-trigger"
                :aria-label="t('navigation.archivia')"
                :title="t('navigation.archivia')"
                @click="toggleArchive"
              />
              <Popover ref="archivePopover" class="archive-popover">
                <div class="archive-menu">
                  <header class="archive-menu__header">
                    <div class="archive-menu__title">
                      <i class="mdi mdi-archive" aria-hidden="true"></i>
                      <span>{{ t('navigation.archivia') }}</span>
                    </div>
                    <Tag :value="String(archive.length)" severity="primary" />
                  </header>
                  <ul class="archive-list">
                    <li v-for="(item, index) in archive" :key="index">
                      <button class="archive-item" type="button" @click="openArchive(item)">
                        <i class="mdi mdi-message-text-outline" aria-hidden="true"></i>
                        <span class="archive-item__copy">
                          <span class="archive-item__title">{{ item.title }}</span>
                          <span class="archive-item__time">{{ item.time }}</span>
                        </span>
                      </button>
                    </li>
                  </ul>
                </div>
              </Popover>

              <Button
                :label="locale.toUpperCase()"
                icon="mdi mdi-translate"
                severity="primary"
                size="small"
                rounded
                class="locale-button"
                @click="toggleLocale"
              />
            </div>
          </div>

          <nav class="header-nav" :aria-label="t('app.subtitle')">
            <Button
              v-for="item in navigationItems"
              :key="item.name"
              :label="item.label"
              :icon="item.icon"
              text
              class="app-nav-button"
              :class="{ 'is-active': route.name === item.name }"
              :aria-current="route.name === item.name ? 'page' : undefined"
              @click="item.navigate"
            />
          </nav>
        </header>

        <Toast
          group="app-notifications"
          position="top-center"
          success-icon="mdi mdi-check-circle-outline"
          error-icon="mdi mdi-alert-circle-outline"
          close-icon="mdi mdi-close"
          @close="syncToastDismissal"
          @life-end="syncToastDismissal"
        />

        <div v-if="!session" class="session-skeleton" aria-busy="true" :aria-label="t('app.subtitle')">
          <Skeleton height="10rem" border-radius="1rem" />
          <Skeleton height="8rem" border-radius="1rem" />
        </div>
        <router-view v-else :recupera="recupera" />
      </section>
    </div>
  </main>
</template>
