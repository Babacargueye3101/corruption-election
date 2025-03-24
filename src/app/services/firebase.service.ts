import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { FirebaseApp } from '@angular/fire/app';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private firestore: Firestore;

  constructor() {
    // Initialisation explicite si nécessaire
    const firebaseConfig = {
      apiKey: "AIzaSyAbnY6SooO8NtkoFndao1ZGP5GGdXIjcUo",
      authDomain: "election-sensivilisation.firebaseapp.com",
      projectId: "election-sensivilisation",
      storageBucket: "election-sensivilisation.appspot.com",
      messagingSenderId: "771898551176",
      appId: "1:771898551176:web:6449230ac9a8d1675ca83d"
    };

    const app = initializeApp(firebaseConfig);
    this.firestore = getFirestore(app);
  }

  async saveResponse(email: string, data: any) {
    try {
      const docRef = await addDoc(collection(this.firestore, 'question-reponses'), {
        email,
        ...data,
        createdAt: serverTimestamp()
      });
      console.log('Document enregistré avec ID:', docRef.id);
      return docRef.id;
    } catch (e: any) {
      console.error("Erreur Firebase:", e);
      throw new Error(`Échec de l'enregistrement: ${e.message}`);
    }
  }
}