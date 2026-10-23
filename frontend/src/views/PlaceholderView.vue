<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const titulo = computed(() => {
  const nombre = route.name
  if (typeof nombre === 'string') {
    return nombre.replace(/-/g, ' ').toUpperCase()
  }
  return 'PLU'
})
</script>

<template>
  <section class="px-4 py-16 text-center text-white/60 sm:px-6">
    <p class="text-sm tracking-widest uppercase">{{ titulo }}</p>
  </section>
</template>
