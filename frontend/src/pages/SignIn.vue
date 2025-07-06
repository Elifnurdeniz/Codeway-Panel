<template>
  <div class="signin-page">
    <div class="signin-box">
      <!-- replace with your actual logo path -->
      <img src="../assets/codeway_icon.png" alt="Codeway Logo" class="logo" />

      <h2>Please sign in</h2>

      <form @submit.prevent="onSubmit">
        <div class="input-group">
            <input
            v-model="email"
            type="email"
            placeholder="E-mail address"
            required
            />
            <input
            v-model="password"
            type="password"
            placeholder="Password"
            required
            />
        </div>

        <button type="submit">Sign in</button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>

      <div class="footer">Codeway © 2021</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { auth } from '../services/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'

const email    = ref('')
const password = ref('')
const router   = useRouter()
const error    = ref<string | null>(null)


async function onSubmit() {
  error.value = null
  try {
    // ② attempt sign-in
    const userCred = await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    )
    // grab ID token for later API calls
    const idToken = await userCred.user.getIdToken()
    //console.log('ID Token:', idToken)

    // ④ on success, go to your panel
    router.push('/')
  } catch (e: any) {
    // display any Firebase error message
    error.value = e.message
  }
}

</script>

<style scoped>
.signin-page {
  min-height: 100vh;
  height:100%;;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 6rem;
}
.signin-box {
  width: 100%;
  max-width: 360px;
  padding: 2rem;
  text-align: center;
}
.logo {
  width: 240px;
  margin: 0 auto 1.5rem;
  margin-bottom: 3rem;
  display: block;
}
h2 {
  color: #31315B;
  margin-bottom: 1rem;
  font-weight: 400;
}
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.input-group {
  width: 100%;
  display: flex;
  flex-direction: column;
}
input {
  padding: 0.75rem 1rem;
  background: transparent;
  border: 1px solid #31315B;
  border-radius: 4px;
  color: #fff;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}
input:focus {
  outline: none;
  border-color: #E55EC1;  
}
button {
  padding: 0.75rem;
  background: linear-gradient(90deg, #384EBC, #5F7AFB);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.2s;
}
button:hover {
  opacity: 0.9;
}
.footer {
  margin-top: 2rem;
  font-size: 0.8rem;
  color: #555465;
}
.error {
  color: #e74c3c;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}
</style>
