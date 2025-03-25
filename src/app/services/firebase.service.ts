import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, query, where, getDocs } from '@angular/fire/firestore';
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
      const docRef = await addDoc(collection(this.firestore, 'responses'), {
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


  async getResponsesWithHighScore(minScore: number = 45) {
    try {
      const q = query(
        collection(this.firestore, 'responses'),
        where('totalScore', '>', minScore)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (e: any) {
      console.error("Erreur lors de la récupération:", e);
      throw new Error(`Échec de la récupération: ${e.message}`);
    }
  }

  async getResponsesWithLowScore(maxScore: number = 45) {
    try {
      const q = query(
        collection(this.firestore, 'responses'),
        where('totalScore', '<=', maxScore)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (e: any) {
      console.error("Erreur lors de la récupération:", e);
      throw new Error(`Échec de la récupération: ${e.message}`);
    }
  }

  async getResponsesWithHighMoney(minMoney: number) {
    try {
      const q = query(
        collection(this.firestore, 'responses'),
        where('moneyForVote', '>', minMoney)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (e: any) {
      console.error("Erreur lors de la récupération:", e);
      throw new Error(`Échec de la récupération: ${e.message}`);
    }
  }

  async getResponsesWithLowMoney(maxMoney: number) {
    try {
      const q = query(
        collection(this.firestore, 'responses'),
        where('moneyForVote', '<=', maxMoney)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (e: any) {
      console.error("Erreur lors de la récupération:", e);
      throw new Error(`Échec de la récupération: ${e.message}`);
    }
  }

  async getVotePricesByLocation() {
    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'responses'));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          region: data['section1']?.region || 'Non spécifié',
          commune: data['section1']?.commune || 'Non spécifié',
          amount: data['section4']?.moneyForVote ? parseInt(data['section4'].moneyForVote) : 0
        };
      }).filter(item => item.amount > 0); // Ne garder que ceux avec un montant positif
    } catch (e: any) {
      console.error("Erreur lors de la récupération:", e);
      throw new Error(`Échec de la récupération: ${e.message}`);
    }
  }
}