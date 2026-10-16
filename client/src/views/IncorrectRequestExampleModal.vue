<script setup lang="ts">
import {nextTick, onBeforeUnmount, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

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
  <Dialog
    v-model:visible="model"
    modal
    :draggable="false"
    :style="{ width: 'min(840px, calc(100vw - 2rem))' }"
    :breakpoints="{ '640px': '100vw' }"
    class="incorrect-request-dialog"
  >
    <template #header>
      <div class="incorrect-request-dialog__header">
        <div class="incorrect-request-dialog__title">
          <i class="mdi mdi-message-alert-outline" aria-hidden="true"></i>
          <span class="incorrect-request-dialog__heading">{{ t('home.incorrectRequestExample.title') }}</span>
        </div>
        <Button
          icon="mdi mdi-close"
          text
          rounded
          severity="secondary"
          :aria-label="t('home.incorrectRequestExample.close')"
          @click="model = false"
        />
      </div>
    </template>

      <div class="incorrect-request-dialog__content">
        <Message severity="info" class="example-intro">
          <template #icon><i class="mdi mdi-information-outline" aria-hidden="true"></i></template>
          {{ t('home.incorrectRequestExample.intro') }}
        </Message>

        <div class="example-chat" :aria-label="t('home.incorrectRequestExample.title')">
          <div v-if="exampleStage === 0" class="example-status example-status--user">
            <i class="mdi mdi-account" aria-hidden="true"></i>
            <span>{{ t('home.incorrectRequestExample.userTyping') }}</span>
            <span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          </div>

          <Transition name="example-message">
            <div v-if="exampleStage >= 1" class="example-message example-message--user">
              <div class="example-message__header">
                <i class="mdi mdi-account" aria-hidden="true"></i>
                <strong>{{ t('home.user') }}</strong>
              </div>
              <p>{{ t('home.incorrectRequestExample.firstQuestion') }}</p>
            </div>
          </Transition>

          <div v-if="exampleStage === 2" class="example-status example-status--assistant">
            <ProgressSpinner class="example-progress" stroke-width="8" />
            <span>{{ t('home.incorrectRequestExample.assistantThinking') }}</span>
          </div>

          <Transition name="example-message">
            <div v-if="exampleStage >= 3" class="example-message example-message--assistant">
              <div class="example-message__header">
                <i class="mdi mdi-robot-outline" aria-hidden="true"></i>
                <strong>{{ t('home.agent') }}</strong>
              </div>
              <p>{{ t('home.incorrectRequestExample.trafficAnswer') }}</p>
            </div>
          </Transition>

          <div v-if="exampleStage === 4" class="example-status example-status--user">
            <i class="mdi mdi-account" aria-hidden="true"></i>
            <span>{{ t('home.incorrectRequestExample.userTyping') }}</span>
            <span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          </div>

          <Transition name="example-message">
            <div v-if="exampleStage >= 5" class="example-message example-message--user">
              <div class="example-message__header">
                <i class="mdi mdi-account" aria-hidden="true"></i>
                <strong>{{ t('home.user') }}</strong>
              </div>
              <p>{{ t('home.incorrectRequestExample.secondQuestion') }}</p>
            </div>
          </Transition>

          <div v-if="exampleStage === 6" class="example-status example-status--assistant">
            <ProgressSpinner class="example-progress" stroke-width="8" />
            <span>{{ t('home.incorrectRequestExample.assistantThinking') }}</span>
          </div>

          <Transition name="example-message">
            <div v-if="exampleStage >= 7" class="example-message example-message--assistant">
              <div class="example-message__header">
                <i class="mdi mdi-robot-outline" aria-hidden="true"></i>
                <strong>{{ t('home.agent') }}</strong>
              </div>
              <p>{{ t('home.incorrectRequestExample.incorrectAnswer') }}</p>
            </div>
          </Transition>

          <div v-if="exampleStage > 0 && exampleStage < 7" ref="latestContent" class="scroll-anchor"></div>
        </div>

        <Transition name="example-message">
          <Message v-if="exampleStage >= 7" severity="warn" class="example-outcome">
            <template #icon><i class="mdi mdi-alert-outline" aria-hidden="true"></i></template>
            {{ t('home.incorrectRequestExample.outcome') }}
          </Message>
        </Transition>

        <section v-if="exampleStage >= 7" class="correct-request" :aria-label="t('home.incorrectRequestExample.correctRequestTitle')">
          <div class="correct-request__heading">
            <i class="mdi mdi-check-decagram-outline correct-request__icon" aria-hidden="true"></i>
            <h3>{{ t('home.incorrectRequestExample.correctRequestTitle') }}</h3>
          </div>

          <div class="example-chat">
            <div v-if="exampleStage === 8" class="example-status example-status--user">
              <i class="mdi mdi-account" aria-hidden="true"></i>
              <span>{{ t('home.incorrectRequestExample.userTyping') }}</span>
              <span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>
            </div>

            <Transition name="example-message">
              <div v-if="exampleStage >= 9" class="example-message example-message--user">
                <div class="example-message__header">
                  <i class="mdi mdi-account" aria-hidden="true"></i>
                  <strong>{{ t('home.user') }}</strong>
                </div>
                <p>{{ t('home.incorrectRequestExample.correctQuestion') }}</p>
              </div>
            </Transition>

            <div v-if="exampleStage === 10" class="example-status example-status--assistant">
              <ProgressSpinner class="example-progress" stroke-width="8" />
              <span>{{ t('home.incorrectRequestExample.assistantThinking') }}</span>
            </div>

            <Transition name="example-message">
              <div v-if="exampleStage >= 11" class="example-message example-message--assistant">
                <div class="example-message__header">
                  <i class="mdi mdi-robot-outline" aria-hidden="true"></i>
                  <strong>{{ t('home.agent') }}</strong>
                </div>
                <p>{{ t('home.incorrectRequestExample.correctAnswer') }}</p>
              </div>
            </Transition>

            <div ref="latestContent" class="scroll-anchor"></div>
          </div>
        </section>
      </div>

    <template #footer>
      <Button :label="t('home.incorrectRequestExample.close')" text @click="model = false" />
    </template>
  </Dialog>
</template>

<style scoped>
.example-chat {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.incorrect-request-dialog__header {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.incorrect-request-dialog__title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #b45309;
}

.incorrect-request-dialog__title > .mdi {
  font-size: 1.25rem;
}

.incorrect-request-dialog__heading {
  font-size: 1rem;
  font-weight: 700;
}

.example-intro {
  margin-bottom: 16px;
}

.example-outcome {
  margin-top: 16px;
}

.incorrect-request-dialog__content {
  max-height: min(70vh, 680px);
  padding: 4px;
  overflow-y: auto;
}

.example-progress {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.correct-request__icon {
  color: #10b981;
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
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.correct-request__heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.correct-request h3 {
  color: #1e293b;
  font-size: 1rem;
  font-weight: 700;
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
