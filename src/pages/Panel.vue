<template>
    <div class="panel-page">
        <PanelHeader />

        <main class="panel-content">
            <!-- desktop table -->
            <div class="desktop-view">
                <table class="params-table">
                    <thead>
                        <tr>
                            <th class="expander"></th>
                            <th class="table-header">Parameter Key</th>
                            <th class="table-header">Value</th>
                            <th class="table-header">Description</th>
                            <th class="table-header sort-header" @click="toggleSort">
                                Create Date
                                <span class="arrow">{{ sortAsc ? '↓' : '↑' }}</span>
                            </th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="param in params" :key="param.id">
                            <tr>
                                <!-- Expander -->
                                <td class="expander">
                                    <button @click="toggleExpand(param)">
                                        {{ expandedRows.has(param.id) ? '▼' : '▶' }}
                                    </button>
                                </td>

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

                                <!-- DATE -->
                                <td>{{ param.date }}</td>

                                <!-- ACTIONS -->
                                <td class="actions">
                                    <template v-if="editingId === param.id">
                                        <button class="btn edit" @click="save(param)">Save</button>
                                        <button class="btn delete" @click="cancel()">Cancel</button>
                                    </template>
                                    <template v-else>
                                        <button class="btn edit" @click="startEdit(param)">Edit</button>
                                        <button class="btn delete" @click="remove(param)">Delete</button>
                                    </template>
                                </td>
                            </tr>

                            <!-- Country‐specific Overrides -->
                            <tr v-if="expandedRows.has(param.id)" class="override-row">
                                <td colspan="6">
                                    <table class="override-table">
                                        <thead>
                                            <tr>
                                                <th>Country</th>
                                                <th>Value</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="ov in overridesMap[param.id]" :key="param.id + '-' + ov.country">
                                                <td>{{ ov.country }}</td>
                                                <td>
                                                    <template v-if="overrideEditing[param.id] === ov.country">
                                                        <input v-model="overrideEditModel[param.id].value" />
                                                    </template>
                                                    <template v-else>
                                                        {{ ov.value }}
                                                    </template>
                                                </td>
                                                <td class="actions">
                                                    <template v-if="overrideEditing[param.id] === ov.country">
                                                        <button class="btn edit"
                                                            @click="saveOverride(param, ov.country)">Save</button>
                                                        <button class="btn delete"
                                                            @click="cancelOverride(param)">Cancel</button>
                                                    </template>
                                                    <template v-else>
                                                        <button class="btn edit"
                                                            @click="startOverrideEdit(param, ov)">Edit</button>
                                                        <button class="btn delete"
                                                            @click="deleteOverride(param, ov.country)">Delete</button>
                                                    </template>
                                                </td>
                                            </tr>
                                            <!-- add new override -->
                                            <tr class="new-override-row">
                                                <td><input v-model="newOverride[param.id].country"
                                                        placeholder="Country code" /></td>
                                                <td><input v-model="newOverride[param.id].value" placeholder="Value" />
                                                </td>
                                                <td><button class="btn add" @click="addOverride(param)">Add</button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </template>
                        <tr class="new-row">
                            <td></td>
                            <td><input v-model="newParam.key" placeholder="New Parameter" /></td>
                            <td><input v-model="newParam.value" placeholder="Value" /></td>
                            <td colspan="2">
                                <input v-model="newParam.description" placeholder="New Description" />
                            </td>
                            <td class="actions">
                                <button class="btn add" @click="add()">Add</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="pager">
                    <button @click="prevPage" :disabled="!hasPrev">Prev</button>
                    <span>Page {{ currentPage + 1 }}</span>
                    <button @click="nextPage" :disabled="!hasNext">Next</button>
                </div>
            </div>


            <!-- mobile cards -->
            <div class="mobile-view">
                <ParamCard v-for="param in params" :key="param.id" :param="param"
                    :overrides="overridesMap[param.id] || []" :editingOverride="overrideEditing[param.id]"
                    :overrideEditModel="overrideEditModel[param.id]" :newOverride="newOverride[param.id]"
                    @load-overrides="loadOverrides" @start-override-edit="startOverrideEdit"
                    @cancel-override="cancelOverride" @save-override="saveOverride" @delete-override="deleteOverride"
                    @add-override="addOverride" @edit="startEdit" @delete="remove" />

                <!-- “Add new” as a final card -->
                <div class="param-card add-card">
                    <input v-model="newParam.key" placeholder="Parameter Key" />
                    <input v-model="newParam.value" placeholder="Value" />
                    <input v-model="newParam.description" placeholder="Description" />
                    <div class="actions">
                        <button class="btn add" @click="add()">Add</button>
                    </div>
                </div>
                <div class="pager mobile-pager">
                    <button @click="loadPage(currentPage - 1)" :disabled="!hasPrev">
                        Prev
                    </button>
                    <span>Page {{ currentPage + 1 }}</span>
                    <button @click="loadPage(currentPage + 1)" :disabled="!hasNext">
                        Next
                    </button>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">


import PanelHeader from '../components/PanelHeader.vue'
import ParamCard from '../components/ParamCard.vue'
import { reactive, ref } from 'vue'

import { onMounted } from 'vue'
import {
    collection, getDocs
} from 'firebase/firestore'
import {
    query,
    orderBy,
    limit,
    startAfter,
    QueryDocumentSnapshot
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { getAuth } from 'firebase/auth'
// Reactive array of parameters
type ParamType = {
    id: string
    key: string
    value: string
    description: string
    date: string
    rawDate: Date
    version: number
}
interface Override { country: string; value: string; version:number; }

const BASE_URL = 'http://localhost:8080'
// sort state: true = ascending, false = descending
const sortAsc = ref(true)
const PAGE_SIZE = 10
const pageCursors = ref<QueryDocumentSnapshot[]>([])
const hasNext = ref(false)
const hasPrev = ref(false)
const currentPage = ref(0)    // zero-based page index
// The params for the *current* page:
const params = ref<ParamType[]>([])


// overrides state
const expandedRows = ref(new Set<string>())
const overridesMap: Record<string, Override[]> = reactive({})
const overrideEditing: Record<string, string | null> = reactive({})
const overrideEditModel: Record<string, { value: string }> = reactive({})
const newOverride: Record<string, { country: string; value: string }> = reactive({})

// helper to get a fresh Firebase ID token
async function getIdToken() {
  const user = getAuth().currentUser
  if (!user) throw new Error("not logged in")
  return await user.getIdToken(/* forceRefresh */ true)
}

// toggle row expansion & load overrides
async function toggleExpand(p: ParamType) {
    if (expandedRows.value.has(p.id)) {
        expandedRows.value.delete(p.id)
    } else {
        expandedRows.value.add(p.id)
        if (!overridesMap[p.id]) await loadOverrides(p)
    }
}
async function loadOverrides(p: ParamType) {
  const snap = await getDocs(collection(db, 'config_params', p.id, 'overrides'))
  overridesMap[p.id] = snap.docs.map(d => {
    const data = d.data() as { value: any; version?: number }
    return {
      country: d.id,
      value:   data.value,
      version: typeof data.version === 'number' ? data.version : 0
    }
  })
  overrideEditing[p.id]   = null
  overrideEditModel[p.id] = { value: '' }
  newOverride[p.id]       = { country: '', value: '' }
}
function startOverrideEdit(p: ParamType, ov: Override) {
    overrideEditing[p.id] = ov.country
    overrideEditModel[p.id].value = ov.value
}
function cancelOverride(p: ParamType) {
    overrideEditing[p.id] = null
}
async function saveOverride(p: ParamType, country: string) {
  const newValue = overrideEditModel[p.id].value
  // grab the current version from your local map
  const currentOverride = overridesMap[p.id].find(o => o.country === country)!
  const payload = {
    value:   newValue,
    version: currentOverride.version
  }

  try {
    const res = await fetch(
      `${BASE_URL}/v1/config/${encodeURIComponent(p.id)}/overrides/${encodeURIComponent(country)}`,
      {
        method: 'PATCH',
        headers: {
          'x-api-key':     PUBLIC_API_KEY,
          'Authorization': `Bearer ${await getIdToken()}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    if (res.status === 204) {
      // success: bump local value + version
      const arr = overridesMap[p.id]
      const idx = arr.findIndex(o => o.country === country)
      arr[idx].value   = newValue
      arr[idx].version!++  
      overrideEditing[p.id] = null

    } else if (res.status === 409) {
      alert('Conflict: someone else updated that override—please reload and try again.')
    } else {
      // other error
      let errMsg = res.statusText
      if (res.headers.get('content-type')?.includes('application/json')) {
        const err = await res.json().catch(() => ({}))
        errMsg = err.error || JSON.stringify(err)
      }
      alert(`Update override failed: ${errMsg}`)
    }

  } catch (e) {
    console.error(e)
    alert('Network error while updating override')
  }
}
async function deleteOverride(p: ParamType, country: string) {
  // call your DELETE /v1/config/:paramId/overrides/:country endpoint
  const res = await fetch(
    `${BASE_URL}/v1/config/${encodeURIComponent(p.id)}/overrides/${encodeURIComponent(country)}`,
    {
      method: 'DELETE',
      headers: {
        'x-api-key':     PUBLIC_API_KEY,
        'Authorization': `Bearer ${await getIdToken()}`,
      },
    }
  )
  if (res.status === 204) {
    // success: remove it locally
    overridesMap[p.id] = overridesMap[p.id].filter(o => o.country !== country)
  } else {
    // failure: show error
    let msg = res.statusText
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const err = await res.json().catch(() => ({}))
      msg = err.error || JSON.stringify(err)
    }
    alert(`Delete override failed: ${msg}`)
  }
}

async function addOverride(p: ParamType) {
  const nr = newOverride[p.id]
  if (!nr.country || !nr.value) return
  const country = nr.country.toUpperCase()
  const res = await fetch(
    `${BASE_URL}/v1/config/${p.id}/overrides`,
    {
      method:  'POST',
      headers: {
        'x-api-key':     PUBLIC_API_KEY,
        'Authorization': `Bearer ${await getIdToken()}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ country, value: nr.value }),
    }
  )
  if (res.status === 201) {
    // server always creates version=0
    overridesMap[p.id].push({ country, value: nr.value, version: 0 })
    newOverride[p.id] = { country: '', value: '' }
  } else {
    const err = await res.json()
    alert(`Add override failed: ${err.error||res.statusText}`)
  }
}

// toggle sort order
function toggleSort() {
    sortAsc.value = !sortAsc.value
    pageCursors.value = []   // clear saved cursors
    loadPage(0)
}

// Prev/Next handlers
function prevPage() {
    if (currentPage.value > 0) {
        loadPage(currentPage.value - 1)
    }
}
function nextPage() {
    if (hasNext.value) {
        loadPage(currentPage.value + 1)
    }
}



async function loadPage(idx: number) {
    const dir = sortAsc.value ? 'asc' : 'desc'
    const col = collection(db, 'config_params')
    let q = query(col, orderBy('createdAt', dir), limit(PAGE_SIZE + 1))

    // if we’re past the first page, start after that page’s cursor
    if (idx > 0) {
        q = query(
            col,
            orderBy('createdAt', dir),
            startAfter(pageCursors.value[idx - 1]),
            limit(PAGE_SIZE + 1)
        )
    }

    const snap = await getDocs(q)
    const docs = snap.docs

    // if we got more than PAGE_SIZE, there *is* a next page
    hasNext.value = docs.length === PAGE_SIZE + 1
    hasPrev.value = idx > 0

    // our real page slice is the first PAGE_SIZE docs
    const pageDocs = docs.slice(0, PAGE_SIZE)
    // record the cursor for this page (the last doc of the slice)
    pageCursors.value[idx] = pageDocs[pageDocs.length - 1]

    // map into your ParamType
    params.value = pageDocs.map(d => {
        const data = d.data() as any
        const raw = data.createdAt.toDate()
        return {
            id: d.id,
            key: data.key,
            value: data.value,
            description: data.description,
            date: formatDate(raw),
            rawDate: raw,
            version: (data.version ?? 0)  
        }
    })

    currentPage.value = idx
}

onMounted(() => loadPage(0))

const newParam = reactive({ key: '', value: '', description: '' })
const PUBLIC_API_KEY = import.meta.env.VITE_PUBLIC_API_KEY || '';
// for edit mode
const editingId = ref<string | null>(null)
const editModel = reactive({ key: '', value: '', description: '', version: 0 })


// start editing a row
function startEdit(p: any) {
    editingId.value = p.id
    editModel.key = p.key
    editModel.value = p.value
    editModel.description = p.description
    editModel.version = p.version
}

// cancel edit
function cancel() {
    editingId.value = null
}

// save changes back to Firestore + local state
async function save(p: any) {
  try {
    await fetch(
      `${BASE_URL}/v1/config/${encodeURIComponent(p.key)}`,
      {
        method:  'PATCH',
        headers: {
          'x-api-key': PUBLIC_API_KEY,
          'Authorization': `Bearer ${await getIdToken()}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          value:       editModel.value,
          description: editModel.description,
          version:     editModel.version,    // ← include it
        })
      }
    ).then(async res => {
      if (res.status === 204) {
        // success! bump local version too:
        const idx = params.value.findIndex(x => x.id === p.id)
        if (idx > -1) {
          params.value[idx].version++
          params.value[idx].value       = editModel.value
          params.value[idx].description = editModel.description
          params.value[idx].date        = formatDate(new Date())
          params.value[idx].rawDate     = new Date()
        }
        editingId.value = null
      }
      else if (res.status === 409) {
        alert('Conflict: Someone else updated that parameter—please reload and try again.')
      }
      else {
        let errMsg = res.statusText
        const ct = res.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
        const err = await res.json()
        errMsg = err.error || JSON.stringify(err)
        }
        alert(`Update failed: ${errMsg}`)
      }
    })
  } catch (e) {
    console.error(e)
    alert('Network error during update')
  }
}


async function remove(p: { id: string }) {
  if (!confirm(`“${p.id}” will be deleted.`)) return

  try {
    const res = await fetch(
      `${BASE_URL}/v1/config/${encodeURIComponent(p.id)}`,
      {
        method: 'DELETE',
        headers: {
          'x-api-key':    PUBLIC_API_KEY,
          'Authorization': `Bearer ${await getIdToken()}`,
        }
      }
    )

    if (res.status === 204) {
      // success — reload current page
      await loadPage(currentPage.value)
    }
    else {
      const err = await res.json().catch(() => ({}))
      alert(`Delete failed: ${err.error || res.statusText}`)
    }
  }
  catch (e) {
    console.error(e)
    alert('Network error during delete')
  }
}

async function add() {
  if (!newParam.key || !newParam.value) return

  try {
    const res = await fetch(
      `${BASE_URL}/v1/config`,
      {
        method:  'POST',
        headers: {
          'x-api-key':    PUBLIC_API_KEY,
          'Authorization': `Bearer ${await getIdToken()}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          key:         newParam.key,
          value:       newParam.value,
          description: newParam.description,
        })
      }
    )

    if (res.status === 201) {
      // success – reload the current page of data
      await loadPage(currentPage.value)

      // clear form
      newParam.key         = ''
      newParam.value       = ''
      newParam.description = ''
    }
    else {
      const err = await res.json()
      alert(`Add failed: ${err.error || res.statusText}`)
    }
  }
  catch (e) {
    console.error(e)
    alert('Network error during add')
  }
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
    width: 100%;
    box-sizing: border-box;
}

.desktop-view {
    display: block;
}

.mobile-view {
    display: none;
}

/* at mobile widths swap them */
@media (max-width: 600px) {
    .desktop-view {
        display: none;
    }

    .mobile-view {
        display: block;
    }

    .panel-content {
        margin-left: 0.5rem;
        margin-right: 0.5rem;
    }
}

/* MOBILE VIEW */
.param-card,
.add-card {
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

/* PAGING */
.pager {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: center;
    margin-top: 1rem;
}

.pager button {
    padding: 0.5rem 1rem;
    border: none;
    background: #5069e3;
    color: white;
    border-radius: 4px;
    cursor: pointer;
}

.pager button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Override table */
.expander {
    width: 2rem;
}

.expander button {
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
}

.override-row td {
    padding: 0;
    background: #252536;
}

.override-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.5rem 0;
}

.override-table th,
.override-table td {
    padding: 0.5rem;
    border: 1px solid #2e2c3c;
}

.override-table input,
.new-override-row input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #778BA3;
    border-radius: 4px;
    background: transparent;
    color: #fff;
    transition: border-color 0.2s;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
}

/* CONTENT */
.panel-content {
    flex: 1;
    padding: 0.5rem;
}

/* TABLE */
.params-table thead tr>th.table-header {
    color: #778BA3;
    font-weight: 400;
    font-size: 1.5rem;
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
    font-size: 0.9rem;
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

.sort-header.sorted-asc .arrow {
    transform: rotate(180deg);
}

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