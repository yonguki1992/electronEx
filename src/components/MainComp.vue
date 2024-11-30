<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="updateCount">count is {{ count }}</button>
    <p>
      Edit
      <code>components/MainComp.vue</code> to test HMR
    </p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Install
    <a href="https://github.com/vuejs/language-tools" target="_blank">Volar</a>
    in your IDE for a better DX
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>
<script setup lang="ts">
import { reactive, ref, toRefs } from 'vue'

const props = defineProps<{ msg: string }>();
const { msg } = toRefs(props);

const count = ref(0);
const state = reactive({
  count
})
const updateCount = () => {
  state.count = state.count + 1;
}
</script>
<style scoped>
.read-the-docs {
  color: #888;
}
</style>
