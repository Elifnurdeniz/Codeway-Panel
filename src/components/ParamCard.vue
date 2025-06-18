<template>
  <div class="param-card">
    <div>
      <strong class="label">Parameter Key:</strong>
      <span class="value">{{ param.key }}</span>
    </div>
    <div>
      <strong class="label">Value:</strong>
      <span class="value">{{ param.value }}</span>
    </div>
    <div>
      <strong class="label">Description:</strong>
      <span class="value">{{ param.description }}</span>
    </div>
    <div>
      <strong class="label">Create Date:</strong>
      <span class="value">{{ param.date }}</span>
    </div>
    <div class="actions">
      <button class="btn edit" @click="$emit('edit', param)">Edit</button>
      <button class="btn delete" @click="$emit('delete', param)">Del</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{
  param: {
    id: string
    key: string
    value: string
    description: string
    date: string
  }
}>()
</script>

<style scoped>
.param-card {
  background: transparent;
  border: 1px solid #ffffff;
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 1rem;
}
.param-card div {
  margin-bottom: 0.5rem;
  color: #ddd;
  font-size: 0.95rem;
}

.param-card .label {
  font-weight: 600;      /* bolder */
  color: #fff;           /* brighter if you like */
  margin-right: 0.25rem;
}

.param-card .value {
  font-weight: 400;      /* normal */
  color: #ccc;           /* slightly dimmer */
}
.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}
/* re-use your existing button styles from Panel.vue */
.btn.edit {
  padding: 0.5rem 1rem;
  border-radius: 4px;
}
.btn.delete {
  padding: 0.5rem 1rem;
  border-radius: 4px;
}
</style>
