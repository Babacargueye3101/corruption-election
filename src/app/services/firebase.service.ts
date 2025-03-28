import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp, query, where, getDocs, getCountFromServer } from '@angular/fire/firestore';
import { initializeApp } from 'firebase/app';
import { doc, getFirestore, orderBy, updateDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private firestore: Firestore;

  constructor() {
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
        region: data.section1.region,
        commune: data.section1.commune,
        totalScore: data.totalScore,
        moneyGiven: data.section4.moneyGivenAmount,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (e: any) {
      console.error("Erreur Firebase:", e);
      throw new Error(`Échec de l'enregistrement: ${e.message}`);
    }
  }

  async getStatistics(region: string, commune: string) {
    try {
      // Requête pour la commune spécifique
      const communeQuery = query(
        collection(this.firestore, 'responses'),
        where('section1.region', '==', region),
        where('section1.commune', '==', commune)
      );

      // Requête pour toute la région
      const regionQuery = query(
        collection(this.firestore, 'responses'),
        where('section1.region', '==', region)
      );

      const [communeSnap, regionSnap] = await Promise.all([
        getDocs(communeQuery),
        getDocs(regionQuery)
      ]);

      // Calcul des statistiques pour la commune
      let communeTotalScore = 0;
      let communeVotePrices: number[] = [];
      let communeCount = communeSnap.size;

      communeSnap.forEach(doc => {
        const data = doc.data();
        communeTotalScore += data['totalScore'] || 0;

        const moneyGiven = data['section4']?.moneyGivenAmount;
        if (moneyGiven && !isNaN(parseFloat(moneyGiven))) {
          communeVotePrices.push(parseFloat(moneyGiven));
        }
      });

      // Calcul des statistiques pour la région
      let regionTotalScore = 0;
      let regionVotePrices: number[] = [];
      let regionCount = regionSnap.size;

      regionSnap.forEach(doc => {
        const data = doc.data();
        regionTotalScore += data['totalScore'] || 0;

        const moneyGiven = data['section4']?.moneyGivenAmount;
        if (moneyGiven && !isNaN(parseFloat(moneyGiven))) {
          regionVotePrices.push(parseFloat(moneyGiven));
        }
      });

      // Calcul des moyennes
      const averageCommuneScore = communeCount > 0 ? (communeTotalScore / communeCount).toFixed(1) : 'N/A';
      const averageRegionScore = regionCount > 0 ? (regionTotalScore / regionCount).toFixed(1) : 'N/A';

      const calculateAveragePrice = (prices: number[]) => {
        if (prices.length === 0) return 'N/A';
        const sum = prices.reduce((a, b) => a + b, 0);
        return (sum / prices.length).toFixed(2);
      };

      return {
        commune: {
          participantsCount: communeCount,
          averageScore: averageCommuneScore,
          averageVotePrice: calculateAveragePrice(communeVotePrices),
          votePrices: communeVotePrices
        },
        region: {
          participantsCount: regionCount,
          averageScore: averageRegionScore,
          averageVotePrice: calculateAveragePrice(regionVotePrices),
          votePrices: regionVotePrices
        }
      };
    } catch (e: any) {
      console.error("Erreur lors de la récupération des statistiques:", e);
      throw new Error(`Échec de la récupération des statistiques: ${e.message}`);
    }
  }

  async getAverageVotePrice(region: string, commune: string) {
    try {
      const stats = await this.getStatistics(region, commune);
      return {
        communePrice: stats.commune.averageVotePrice,
        regionPrice: stats.region.averageVotePrice
      };
    } catch (e) {
      console.error("Erreur:", e);
      return {
        communePrice: 'N/A',
        regionPrice: 'N/A'
      };
    }
  }

  // Ajoutez cette nouvelle méthode pour sauvegarder les messages de contact
  async saveContactMessage(contactData: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.firestore, 'contactMessages'), {
        name: contactData.name,
        email: contactData.email,
        message: contactData.message,
        createdAt: serverTimestamp(),
        status: 'new'
      });
      return docRef.id;
    } catch (e: any) {
      console.error("Erreur Firebase:", e);
      throw new Error(`Échec de l'enregistrement du message: ${e.message}`);
    }
  }

  async getContactMessages() {
    try {
      const q = query(
        collection(this.firestore, 'contactMessages'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data['name'],
          email: data['email'],
          message: data['message'],
          createdAt: data['createdAt']?.toDate() || new Date(),
          status: data['status'] || 'new'
        };
      });
    } catch (e) {
      console.error("Erreur lors de la récupération des messages:", e);
      throw new Error('Failed to fetch messages');
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const messageRef = doc(this.firestore, 'contactMessages', messageId);
      await updateDoc(messageRef, {
        status: 'read',
        readAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Erreur lors du marquage comme lu:", e);
      throw new Error('Failed to mark message as read');
    }
  }
  async markAsReplied(messageId: string, replyContent: string): Promise<void> {
    try {
      const messageRef = doc(this.firestore, 'contactMessages', messageId);
      await updateDoc(messageRef, {
        status: 'replied',
        replyContent: replyContent,
        repliedAt: serverTimestamp(),
        adminId: 'system'
      });
    } catch (e) {
      console.error("Erreur lors du marquage comme répondu:", e);
      throw new Error('Échec de la mise à jour du statut');
    }
  }
}