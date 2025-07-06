<!-- ParamCard.vue -->
<template>
  <div class="param-card">
    <div class="card-header" @click="toggle">
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
      <span class="expander">{{ expanded ? '▼' : '▶' }}</span>
    </div>

    <div v-if="expanded" class="overrides">
      <!-- Render overrides passed in as a prop -->
      <div v-for="ov in overrides" :key="ov.country" class="override-item">
        <div class="override-line" v-if="editingOverride === ov.country">
          <input class="input" v-model="overrideEditModel.value" />
          <div class="actions">
            <button class="btn edit" @click="$emit('save-override', param, ov.country)">Save</button>
            <button class="btn delete" @click="$emit('cancel-override', param)">Cancel</button>
          </div>
        </div>
        <div class="override-line" v-else>
          <div>
            <strong>{{ ov.country }}:</strong> {{ ov.value }}
          </div>
          <div class="actions">
            <button class="btn edit" @click="$emit('start-override-edit', param, ov)">Edit</button>
            <button class="btn delete" @click="$emit('delete-override', param, ov.country)">Del</button>
          </div>
        </div>
      </div>

      <!-- “Add new” override -->
      <div class="add-override">
        <input class="input" v-model="newOverride.country" placeholder="Country code" />
        <input class="input" v-model="newOverride.value" placeholder="Value" />
        <button class="btn add" @click="$emit('add-override', param)">Add</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue'

const props = defineProps({
  param: Object,
  overrides: Array,
  editingOverride: String | null,
  overrideEditModel: Object,
  newOverride: Object,
})

const expanded = ref(false)
function toggle() {
  expanded.value = !expanded.value
  if (expanded.value) {
    // tell parent to load overrides if it hasn’t yet
    emit('load-overrides', props.param)
  }
}

const emit = defineEmits([
  'load-overrides',
  'start-override-edit',
  'cancel-override',
  'save-override',
  'delete-override',
  'add-override',
])
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
  font-weight: 600;
  /* bolder */
  color: #fff;
  /* brighter if you like */
  margin-right: 0.25rem;
}

.param-card .value {
  font-weight: 400;
  /* normal */
  color: #ccc;
  /* slightly dimmer */
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.override-item {
  margin-bottom: 0.75rem;
}

.override-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.add-override {
  display: flex;
  flex-direction: column; /* stack them vertically */
  gap: 0.5rem;            /* puts space between each child */
  margin-top: 1rem;       /* your existing top-margin */
}
.overrides {
  margin-top: 1rem;
  padding: 0.5rem;
}
</style>
