import admin from 'firebase-admin'
import * as serviceAccount from '../serviceAccountKey.json'


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
})

export const db = admin.firestore()


