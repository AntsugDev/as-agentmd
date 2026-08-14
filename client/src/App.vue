<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

const isSettings = computed(() => route.name === 'settings')

const goToHome = () => {
  router.push({ name: 'home' })
}

const goToSettings = () => {
  router.push({ name: 'settings' })
}

const toggleLocale = () => {
  locale.value = locale.value === 'it' ? 'en' : 'it'
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

          <router-view />
        </section>
      </v-container>
    </v-main>
  </v-app>
</template>
