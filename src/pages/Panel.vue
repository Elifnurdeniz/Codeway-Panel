<template>
  <div class="panel-page">
    <PanelHeader />

    <main class="panel-content">
      <!-- desktop table -->
       <div class="desktop-view">
        <table class="params-table">
            <thead>
            <tr>
                <th class="table-header">Parameter Key</th>
                <th class="table-header">Value</th>
                <th class="table-header">Description</th>
                <th
                    class="table-header sort-header"
                    @click="toggleSort"
                    >
                    Create Date
                    <span class="arrow">
                        {{ sortAsc ? '↓' : '↑' }}
                    </span>
                </th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="param in sortedParams" :key="param.id">
                <!-- KEY -->
                <td>
                <template v-if="editingId === param.id">
                    <input v-model="editModel.key" />
                </template>
                <template v-else>
                    {{ param.key }}
                </template>
                </td>

                <!-- VALUE -->
                <td>
                <template v-if="editingId === param.id">
                    <input v-model="editModel.value" />
                </template>
                <template v-else>
                    {{ param.value }}
                </template>
                </td>

                <!-- DESCRIPTION -->
                <td>
                <template v-if="editingId === param.id">
                    <input v-model="editModel.description" />
                </template>
                <template v-else>
                    {{ param.description }}
                </template>
                </td>

                <!-- DATE (read-only) -->
                <td>{{ param.date }}</td>

                <!-- ACTIONS -->
                <td class="actions">
                <template v-if="editingId === param.id">
                    <button class="btn edit" @click="save(param)">Save</button>
                    <button class="btn delete" @click="cancel()">Cancel</button>
                </template>
                <template v-else>
                    <button class="btn edit"   @click="startEdit(param)">Edit</button>
                    <button class="btn delete" @click="remove(param)">Delete</button>
                </template>
                </td>
            </tr>

            <!-- “Add new” row (unchanged) -->
            <tr class="new-row">
                <td><input v-model="newParam.key"        placeholder="New Parameter"    /></td>
                <td><input v-model="newParam.value"      placeholder="Value"            /></td>
                <td colspan="2">
                    <input
                    v-model="newParam.description"
                    placeholder="New Description"
                    />
                </td>
                <td class="actions">
                <button class="btn add" @click="add()">Add</button>
                </td>
            </tr>
            </tbody>
        </table>
       </div>
      

      <!-- mobile cards -->
      <div class="mobile-view">
        <ParamCard
          v-for="param in params"
          :key="param.id"
          :param="param"
          @edit="startEdit"
          @delete="remove"
        />
        <!-- “Add new” as a final card -->
        <div class="param-card add-card">
          <input v-model="newParam.key" placeholder="Parameter Key" />
          <input v-model="newParam.value" placeholder="Value" />
          <input v-model="newParam.description" placeholder="Description" />
          <div class="actions">
            <button class="btn add" @click="add()">Add</button>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import PanelHeader from '../components/PanelHeader.vue'
import ParamCard from '../components/ParamCard.vue'
import { reactive, ref, computed } from 'vue'


import { onMounted } from 'vue'
import {
  collection, getDocs,
  addDoc, deleteDoc, updateDoc, doc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../services/firebase'

// Reactive array of parameters
const params = ref<Array<{
  id: string
  key: string
  value: string
  description: string
  date: string
}>>([])

// const params = ref<ParamType[]>([])

// sort state: true = ascending, false = descending
const sortAsc = ref(true)


const sortedParams = computed(() => {
  return [...params.value].sort((a, b) => {
    const ta = new Date(a.date).getTime()
    const tb = new Date(b.date).getTime()
    return sortAsc.value ? ta - tb : tb - ta
  })
})

// toggle sort order
function toggleSort() {
  sortAsc.value = !sortAsc.value
}


async function loadParams() {
  const snap = await getDocs(collection(db, 'config_params'))
  params.value = snap.docs.map(doc => {
    const data = doc.data()
    return {
      id:          doc.id,
      key:         data.key,
      value:       data.value,
      description: data.description,
      date:        data.createdAt
                     ? formatDate(data.createdAt.toDate()) : ''
    }
  })
}

onMounted(loadParams)

const newParam = reactive({ key: '', value: '', description: '' })

// for edit mode
const editingId   = ref<string | null>(null)
const editModel   = reactive({ key: '', value: '', description: '' })


// start editing a row
function startEdit(p: any) {
  editingId.value = p.id
  editModel.key         = p.key
  editModel.value       = p.value
  editModel.description = p.description
}

// cancel edit
function cancel() {
  editingId.value = null
}

// save changes back to Firestore + local state
async function save(p: any) {
  // write to Firestore
  const refDoc = doc(db, 'config_params', p.id)
  await updateDoc(refDoc, {
    key:         editModel.key,
    value:       editModel.value,
    description: editModel.description,
    updatedAt:   serverTimestamp()
  })

  // update local array
  const idx = params.value.findIndex(x => x.id === p.id)
  if (idx !== -1) {
    params.value[idx].key         = editModel.key
    params.value[idx].value       = editModel.value
    params.value[idx].description = editModel.description
    params.value[idx].date        = formatDate(new Date())
  }

  editingId.value = null
}

async function remove(p: { id: string }) {
  // delete in Firestore
  await deleteDoc(doc(db, 'config_params', p.id))
  // update local state
  params.value = params.value.filter(item => item.id !== p.id)
}


async function add() {
  if (!newParam.key || !newParam.value) return
  // write to Firestore
  const docRef = await addDoc(collection(db, 'config_params'), {
    key:         newParam.key,
    value:       newParam.value,
    description: newParam.description,
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
    version:     0
  })
  // optimistically update local state
  params.value.push({
    id:          docRef.id,
    key:         newParam.key,
    value:       newParam.value,
    description: newParam.description,
    date:        formatDate(new Date())
  })
  // clear form
  newParam.key = ''
  newParam.value = ''
  newParam.description = ''
}

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

</script>

<style scoped>
.panel-page {
  min-height: 100vh;
  color: #ccc;
  display: flex;
  flex-direction: column;
}

.desktop-view   { display: block; }
.mobile-view    { display: none; }

/* at mobile widths swap them */
@media (max-width: 600px) {
  .desktop-view { display: none; }
  .mobile-view  { display: block; }
  .panel-content { margin-left: 0.5rem; margin-right: 0.5rem; }
}

/* MOBILE VIEW */
.param-card, .add-card {
  width: 100%;
  padding: 0.5rem;
}

.add-card {
  border-radius: 8px;
  border: 1px solid #2e2c3c;
}

.add-card input {
  width: 100%;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: transparent;
  border: 1px solid #2e2c3c;
  /* border: none; */
  border-radius: 4px;
  color: #fff;
}
.add-card .actions {
  justify-content: flex-end;
}

/* CONTENT */
.panel-content {
  flex: 1;
  padding: 0.5rem;
}

/* TABLE */
.params-table thead tr > th.table-header {
  color:       #778BA3;
  font-weight: 400;
  font-size:   2rem; 
}
.params-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.25rem;
}
.params-table th,
.params-table td {
  padding: 0.5rem 1rem;
  text-align: left;
}
.params-table thead th {
  color: #888;
  font-weight: 400;
  font-size: 0.9rem;
}
.params-table tbody td {
  color: #ddd;
  font-size: 0.95rem;
}

.sort-header {
  cursor: pointer;
  user-select: none;
}
.sort-header .arrow {
  margin-left: 0.25rem;
  font-size: 0.85em;
  transition: transform 0.2s;
}
.sort-header.sorted-asc .arrow { transform: rotate(180deg); }

/* ACTION BUTTONS */
.actions {
  display: flex;
  gap: 0.5rem;
}
.btn {
  padding: 0.3rem 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
}

/* “Add new” row inputs */
.new-row input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  border: 1px solid #778BA3;
  border-radius: 4px;
  background: transparent;
  color: #fff;
  transition: border-color 0.2s;
}
.new-row input:focus {
  border-color: #7a71e1;
}
</style>