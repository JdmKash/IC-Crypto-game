'use server'

import { headers } from 'next/headers'
import { initializeApp, getApp } from 'firebase/app'
import { getFirestore, collection, doc, getDoc, setDoc, increment, Timestamp, query, orderBy, limit, getDocs } from 'firebase/firestore'

// Initialize Firebase directly with the user's configuration
const firebaseConfig = {
  apiKey: "AIzaSyBuWYnT6y19wCcTsY-rW4xHukUQh1tPmgQ",
  authDomain: "ic-crypto-app.firebaseapp.com",
  projectId: "ic-crypto-app",
  storageBucket: "ic-crypto-app.firebasestorage.app",
  messagingSenderId: "13895584736",
  appId: "1:13895584736:web:900ca75971c4a76fa6f985",
  measurementId: "G-3D4VFKS28V"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  // Ignore the "Firebase App already exists" error in development
  if (!/already exists/.test(error.message)) {
    console.error('Firebase initialization error', error);
  }
  // If initialization fails, try to get the existing app
  app = getApp();
}

// Get Firestore instance
const db = getFirestore(app!);

// Increment counter and log access
export async function incrementAndLog() {
  const headersList = await headers()
  
  // Increment page views counter
  const counterRef = doc(db, 'counters', 'page_views')
  const counterSnap = await getDoc(counterRef)
  
  let currentCount = 1
  if (counterSnap.exists()) {
    await setDoc(counterRef, { value: increment(1) }, { merge: true })
    const updatedSnap = await getDoc(counterRef)
    currentCount = updatedSnap.data()?.value || 1
  } else {
    await setDoc(counterRef, { value: 1 })
  }
  
  // Log access
  const accessLogRef = collection(db, 'access_logs')
  await setDoc(doc(accessLogRef), {
    ip: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
    path: headersList.get('x-forwarded-host') || '/',
    accessed_at: Timestamp.now()
  })
  
  // Get recent access logs
  const logsQuery = query(
    collection(db, 'access_logs'),
    orderBy('accessed_at', 'desc'),
    limit(5)
  )
  
  const logsSnapshot = await getDocs(logsQuery)
  const logs = logsSnapshot.docs.map(doc => ({
    ...doc.data(),
    accessed_at: doc.data().accessed_at.toDate().toISOString()
  }))
  
  return {
    count: currentCount,
    recentAccess: logs
  } as { count: number; recentAccess: { accessed_at: string }[] }
}

// Get current count and recent access
export async function getStats() {
  // Get counter value
  const counterRef = doc(db, 'counters', 'page_views')
  const counterSnap = await getDoc(counterRef)
  const count = counterSnap.exists() ? counterSnap.data()?.value || 0 : 0
  
  // Get recent access logs
  const logsQuery = query(
    collection(db, 'access_logs'),
    orderBy('accessed_at', 'desc'),
    limit(5)
  )
  
  const logsSnapshot = await getDocs(logsQuery)
  const logs = logsSnapshot.docs.map(doc => ({
    ...doc.data(),
    accessed_at: doc.data().accessed_at.toDate().toISOString()
  }))
  
  return {
    count,
    recentAccess: logs
  } as { count: number; recentAccess: { accessed_at: string }[] }
}
