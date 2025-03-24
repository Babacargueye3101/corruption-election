import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { provideFirebaseApp } from '@angular/fire/app';
import { provideFirestore } from '@angular/fire/firestore';
import { provideAuth } from '@angular/fire/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAbnY6SooO8NtkoFndao1ZGP5GGdXIjcUo",
  authDomain: "election-sensivilisation.firebaseapp.com",
  projectId: "election-sensivilisation",
  storageBucket: "election-sensivilisation.firebasestorage.app",
  messagingSenderId: "771898551176",
  appId: "1:771898551176:web:6449230ac9a8d1675ca83d",
  measurementId: "G-4ZGZSX6RRY"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    // Configuration Firebase
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth())
  ]
};