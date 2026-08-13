<script setup lang="ts">
import Home from "./components/Home.vue";
</script>

<template>
  <v-card class="d-flex flex-column pa-5 justify-center align-center mt-5 mb-5 elevation-3">
    <v-card-title style="background: #9ca3af;border: 0.15vw solid #000;" class="mb-3 w-100 d-flex flex-row justify-space-between">
      <h3 class="text-center" style="color: #ffffff">AgentMd</h3>
      <v-icon icon="mdi-cog" size="35" end class="mb-3"></v-icon>
    </v-card-title>
    <v-card-text class="d-flex flex-column justify-center align-content-center pa-3 mb-3">
      <Home />
    </v-card-text>
  </v-card>
</template>
