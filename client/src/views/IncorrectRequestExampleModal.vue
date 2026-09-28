<script setup lang="ts">
import {nextTick, onBeforeUnmount, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'

const {t} = useI18n()
const model = defineModel<boolean>({default: false})
const exampleStage = ref(0)
const latestContent = ref<HTMLElement | null>(null)
let sequenceTimers: ReturnType<typeof setTimeout>[] = []

const clearSequence = () => {
  sequenceTimers.forEach(clearTimeout)
  sequenceTimers = []
}

const startSequence = () => {
  exampleStage.value = 0
  sequenceTimers = [
    setTimeout(() => exampleStage.value = 1, 1500),
    setTimeout(() => exampleStage.value = 2, 3000),
    setTimeout(() => exampleStage.value = 3, 4800),
    setTimeout(() => exampleStage.value = 4, 6200),
    setTimeout(() => exampleStage.value = 5, 7700),
    setTimeout(() => exampleStage.value = 6, 9000),
    setTimeout(() => exampleStage.value = 7, 10800),
    setTimeout(() => exampleStage.value = 8, 12400),
    setTimeout(() => exampleStage.value = 9, 14000),
    setTimeout(() => exampleStage.value = 10, 15500),
    setTimeout(() => exampleStage.value = 11, 17400)
  ]
}

watch(model, (isOpen) => {
  clearSequence()
  exampleStage.value = 0
  if (isOpen) {
    sequenceTimers = [setTimeout(startSequence, 400)]
  }
})

watch(exampleStage, async (stage) => {
  if (stage === 0) return

  await nextTick()
  latestContent.value?.scrollIntoView({behavior: 'smooth', block: 'end'})
})

onBeforeUnmount(clearSequence)
</script>

<template>
  <v-dialog v-model="model" max-width="840" scrollable>
    <v-card rounded="xl" border>
      <v-card-title class="d-flex align-center justify-space-between py-3 px-4 border-b">
        <div class="d-flex align-center ga-2">
          <v-icon icon="mdi-message-alert-outline" color="warning"></v-icon>
          <span class="text-subtitle-1 font-weight-bold">{{ t('home.incorrectRequestExample.title') }}</span>
        </div>
        <v-btn icon="mdi-close" variant="text" size="32" @click="model = false"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <v-alert color="info" variant="tonal" density="comfortable" class="mb-4" icon="mdi-information-outline">
          {{ t('home.incorrectRequestExample.intro') }}
        </v-alert>

        <div class="example-chat" :aria-label="t('home.incorrectRequestExample.title')">
          <div v-if="exampleStage === 0" class="example-status example-status--user">
            <v-icon icon="mdi-account" size="16"></v-icon>
            <span>{{ t('home.incorrectRequestExample.userTyping') }}</span>
            <span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          </div>

          <Transition name="example-message">
            <div v-if="exampleStage >= 1" class="example-message example-message--user">
              <div class="example-message__header">
                <v-icon icon="mdi-account" size="16"></v-icon>
                <strong>{{ t('home.user') }}</strong>
              </div>
              <p>{{ t('home.incorrectRequestExample.firstQuestion') }}</p>
            </div>
          </Transition>

          <div v-if="exampleStage === 2" class="example-status example-status--assistant">
            <v-progress-circular indeterminate size="16" width="2"></v-progress-circular>
            <span>{{ t('home.incorrectRequestExample.assistantThinking') }}</span>
          </div>

          <Transition name="example-message">
            <div v-if="exampleStage >= 3" class="example-message example-message--assistant">
              <div class="example-message__header">
                <v-icon icon="mdi-robot-outline" size="16"></v-icon>
                <strong>{{ t('home.agent') }}</strong>
              </div>
              <p>{{ t('home.incorrectRequestExample.trafficAnswer') }}</p>
            </div>
          </Transition>

          <div v-if="exampleStage === 4" class="example-status example-status--user">
            <v-icon icon="mdi-account" size="16"></v-icon>
            <span>{{ t('home.incorrectRequestExample.userTyping') }}</span>
            <span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          </div>

          <Transition name="example-message">
            <div v-if="exampleStage >= 5" class="example-message example-message--user">
              <div class="example-message__header">
                <v-icon icon="mdi-account" size="16"></v-icon>
                <strong>{{ t('home.user') }}</strong>
              </div>
              <p>{{ t('home.incorrectRequestExample.secondQuestion') }}</p>
            </div>
          </Transition>

          <div v-if="exampleStage === 6" class="example-status example-status--assistant">
            <v-progress-circular indeterminate size="16" width="2"></v-progress-circular>
            <span>{{ t('home.incorrectRequestExample.assistantThinking') }}</span>
          </div>

          <Transition name="example-message">
            <div v-if="exampleStage >= 7" class="example-message example-message--assistant">
              <div class="example-message__header">
                <v-icon icon="mdi-robot-outline" size="16"></v-icon>
                <strong>{{ t('home.agent') }}</strong>
              </div>
              <p>{{ t('home.incorrectRequestExample.incorrectAnswer') }}</p>
            </div>
          </Transition>

          <div v-if="exampleStage > 0 && exampleStage < 7" ref="latestContent" class="scroll-anchor"></div>
        </div>

        <Transition name="example-message">
          <v-alert v-if="exampleStage >= 7" color="warning" variant="tonal" density="comfortable" class="mt-4" icon="mdi-alert-outline">
            {{ t('home.incorrectRequestExample.outcome') }}
          </v-alert>
        </Transition>

        <section v-if="exampleStage >= 7" class="correct-request mt-5" :aria-label="t('home.incorrectRequestExample.correctRequestTitle')">
          <div class="d-flex align-center ga-2 mb-3">
            <v-icon icon="mdi-check-decagram-outline" color="success"></v-icon>
            <h3 class="text-subtitle-1 font-weight-bold">{{ t('home.incorrectRequestExample.correctRequestTitle') }}</h3>
          </div>

          <div class="example-chat">
            <div v-if="exampleStage === 8" class="example-status example-status--user">
              <v-icon icon="mdi-account" size="16"></v-icon>
              <span>{{ t('home.incorrectRequestExample.userTyping') }}</span>
              <span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>
            </div>

            <Transition name="example-message">
              <div v-if="exampleStage >= 9" class="example-message example-message--user">
                <div class="example-message__header">
                  <v-icon icon="mdi-account" size="16"></v-icon>
                  <strong>{{ t('home.user') }}</strong>
                </div>
                <p>{{ t('home.incorrectRequestExample.correctQuestion') }}</p>
              </div>
            </Transition>

            <div v-if="exampleStage === 10" class="example-status example-status--assistant">
              <v-progress-circular indeterminate size="16" width="2"></v-progress-circular>
              <span>{{ t('home.incorrectRequestExample.assistantThinking') }}</span>
            </div>

            <Transition name="example-message">
              <div v-if="exampleStage >= 11" class="example-message example-message--assistant">
                <div class="example-message__header">
                  <v-icon icon="mdi-robot-outline" size="16"></v-icon>
                  <strong>{{ t('home.agent') }}</strong>
                </div>
                <p>{{ t('home.incorrectRequestExample.correctAnswer') }}</p>
              </div>
            </Transition>

            <div ref="latestContent" class="scroll-anchor"></div>
          </div>
        </section>
      </v-card-text>

      <v-card-actions class="pa-3 border-t justify-end">
        <v-btn variant="text" color="primary" @click="model = false">
          {{ t('home.incorrectRequestExample.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.example-chat {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.example-message {
  width: min(100%, 680px);
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.example-message--user {
  align-self: flex-end;
  border-color: #c7d2fe;
  background: #eef2ff;
}

.example-message--assistant {
  align-self: flex-start;
  border-left: 4px solid #4f46e5;
  background: #ffffff;
}

.example-message__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  color: #475569;
}

.example-message p {
  margin: 0;
  color: #334155;
  line-height: 1.55;
}

.correct-request {
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.correct-request h3 {
  color: #1e293b;
}

.example-status {
  display: flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  min-height: 38px;
  padding: 9px 12px;
  border-radius: 10px;
  color: #475569;
  font-size: 0.82rem;
}

.example-status--user {
  align-self: flex-end;
  background: #eef2ff;
}

.example-status--assistant {
  background: #f8fafc;
}

.typing-dots {
  display: inline-flex;
  gap: 3px;
}

.typing-dots i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  animation: typing 1s infinite ease-in-out;
}

.typing-dots i:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots i:nth-child(3) {
  animation-delay: 0.3s;
}

.example-message-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.example-message-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.scroll-anchor {
  height: 1px;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@media (max-width: 600px) {
  .example-message {
    width: 100%;
  }
}
</style>
