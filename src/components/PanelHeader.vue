<template>
  <header class="panel-header">
    <img src="../assets/codeway_icon.png" alt="Codeway" class="header-logo" />

    <div class="user-menu" @click="toggleDropdown">
      <!-- <span class="user-email">{{ auth.user?.email || '—' }}</span> -->
      <img src="../assets/user.png" alt="User" class="user-icon" />
      <span class="dropdown-arrow">▾</span>

      <div v-if="show" class="dropdown">
        <div class="dropdown-item email">{{ auth.user?.email }}</div>
        <div class="dropdown-item logout" @click.stop="doLogout">
          Logout
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const show = ref(false)

function toggleDropdown() {
  show.value = !show.value
}

async function doLogout() {
  await auth.doLogout()
  router.push('/signin')
}
</script>

<style scoped>
.panel-header {
  position: relative; /* for absolute dropdown */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: transparent;
  width: 100%;
  box-sizing: border-box;
}
.header-logo {
  height: 32px;
}

.user-menu {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  /* margin-left: auto; */
}
.user-email {
  color: #ccc;
  /* margin-right: 0.5rem; */
}
.user-icon {
  width: 24px;
  height: 24px;
  margin-right: 0.5rem;
}
.dropdown-arrow {
  color: #888;
  font-size: 0.8rem;
}

/* dropdown panel */
.dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: #181826;
  border: 1px solid #2e2c3c;
  border-radius: 4px;
  margin-top: 0.5rem;
  min-width: 180px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}
.dropdown-item {
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  color: #ddd;
  white-space: nowrap;
}
.dropdown-item.email {
  cursor: default;
}
.dropdown-item.logout {
  cursor: pointer;
  color: #e74c3c;
}
.dropdown-item.logout:hover {
  background: #2e2c3c;
}
</style>
