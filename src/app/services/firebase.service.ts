import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, setDoc, serverTimestamp, query, where, getDocs, getCountFromServer } from '@angular/fire/firestore';
import { initializeApp } from 'firebase/app';
import { doc, getFirestore, orderBy, updateDoc } from 'firebase/firestore';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

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

  // Enregistrement des réponses
  async saveResponse(email: string, data: any) {
    try {
      const docRef = await addDoc(collection(this.firestore, 'responses'), {
        email,
        ...data,
        region: data.section1.region,
        commune: data.section1.commune,
        gender: data.section1.gender,
        totalScore: data.totalScore,
        moneyForVote: data.section4.moneyForVote,
        moneyGiven: data.section4.moneyGivenAmount,
        createdAt: serverTimestamp()
      });

      // Mise à jour des statistiques
      await this.updateStatistics(data.section1.region, data.section1.commune);

      return docRef.id;
    } catch (e: any) {
      console.error("Erreur Firebase:", e);
      throw new Error(`Échec de l'enregistrement: ${e.message}`);
    }
  }

  // Vérification de l'existence d'un email
  async checkIfEmailExists(email: string): Promise<boolean> {
    const q = query(collection(this.firestore, 'responses'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  // Statistiques principales
  async getStatistics(region?: string, commune?: string): Promise<any> {
    try {
      let q = query(collection(this.firestore, 'responses'));

      if (region) {
        q = query(q, where('section1.region', '==', region));
      }
      if (commune) {
        q = query(q, where('section1.commune', '==', commune));
      }

      const querySnapshot = await getDocs(q);
      const responses = querySnapshot.docs.map(doc => doc.data());

      return this.calculateDetailedStats(responses, region, commune);
    } catch (e: any) {
      console.error("Erreur lors de la récupération des statistiques:", e);
      throw new Error(`Échec de la récupération des statistiques: ${e.message}`);
    }
  }

  // Calcul des statistiques détaillées
  private calculateDetailedStats(responses: any[], region?: string, commune?: string): any {
    const stats = {
      region,
      commune,
      totalParticipants: responses.length,
      averageScore: 0,
      averageVotePrice: 0,
      genderDistribution: { male: 0, female: 0, other: 0 },
      corruptionTypes: {} as Record<string, number>,
      votesSold: 0,
      participantsByAge: {} as Record<string, number>,
      participantsByCommune: {} as Record<string, number>
    };

    let totalScore = 0;
    let totalMoney = 0;
    let moneyCount = 0;

    responses.forEach(response => {
      // Score
      totalScore += response.totalScore || 0;

      // Genre
      const gender = response.section1?.gender || 'other';
      if (gender.includes('Homme')) stats.genderDistribution.male++;
      else if (gender.includes('Femme')) stats.genderDistribution.female++;
      else stats.genderDistribution.other++;

      // Prix du vote
      if (response.section4?.moneyForVote) {
        const amount = parseFloat(response.section4.moneyForVote) || 0;
        totalMoney += amount;
        moneyCount++;
        stats.votesSold++;
      }

      // Types de corruption
      if (response.section2?.corruptionTypes) {
        response.section2.corruptionTypes.forEach((type: string) => {
          stats.corruptionTypes[type] = (stats.corruptionTypes[type] || 0) + 1;
        });
      }

      // Âge
      const age = response.section1?.age || 'inconnu';
      stats.participantsByAge[age] = (stats.participantsByAge[age] || 0) + 1;

      // Commune (pour les stats régionales)
      if (region && !commune) {
        const responseCommune = response.section1?.commune;
        if (responseCommune) {
          stats.participantsByCommune[responseCommune] = (stats.participantsByCommune[responseCommune] || 0) + 1;
        }
      }
    });

    stats.averageScore = parseFloat((totalScore / responses.length).toFixed(1));
    stats.averageVotePrice = moneyCount > 0
      ? parseFloat((totalMoney / moneyCount).toFixed(2))
      : 0;

    return stats;
  }

  // Mise à jour des statistiques agrégées
  private async updateStatistics(region: string, commune: string): Promise<void> {
    try {
      // Mise à jour des stats globales
      const globalRef = doc(this.firestore, 'statistics', 'global');
      await setDoc(globalRef, {
        totalParticipants: await this.getTotalParticipants(),
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // Mise à jour des stats régionales
      const regionRef = doc(this.firestore, 'statistics', `region_${region}`);
      const regionStats = await this.getStatistics(region);
      await setDoc(regionRef, regionStats, { merge: true });

      // Mise à jour des stats communales
      const communeRef = doc(this.firestore, 'statistics', `commune_${commune}`);
      const communeStats = await this.getStatistics(region, commune);
      await setDoc(communeRef, communeStats, { merge: true });

    } catch (e) {
      console.error("Erreur lors de la mise à jour des statistiques:", e);
    }
  }

  // Nombre total de participants
  async getTotalParticipants(): Promise<number> {
    const snapshot = await getCountFromServer(collection(this.firestore, 'responses'));
    return snapshot.data().count;
  }

  // Liste des régions
  async getRegions(): Promise<string[]> {
    const q = query(collection(this.firestore, 'responses'));
    const querySnapshot = await getDocs(q);

    const regions = new Set<string>();
    querySnapshot.forEach(doc => {
      const region = doc.data()['section1']?.region;
      if (region) regions.add(region);
    });

    return Array.from(regions);
  }

  // Liste des communes par région
  async getCommunes(region: string): Promise<string[]> {
    const q = query(
      collection(this.firestore, 'responses'),
      where('section1.region', '==', region)
    );
    const querySnapshot = await getDocs(q);

    const communes = new Set<string>();
    querySnapshot.forEach(doc => {
      const commune = doc.data()['section1']?.commune;
      if (commune) communes.add(commune);
    });

    return Array.from(communes);
  }

  // Récupération des réponses d'un utilisateur
  async getUserResponses(email: string): Promise<any[]> {
    const q = query(
      collection(this.firestore, 'responses'),
      where('email', '==', email),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data['createdAt']?.toDate() || null
      };
    });
  }

  // Méthodes pour les messages de contact (existantes)
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

  // Méthodes pour les graphiques
  getGenderChartData(stats: any): ChartData<'doughnut'> {
    return {
      labels: ['Hommes', 'Femmes', 'Autres'],
      datasets: [{
        data: [
          stats.genderDistribution?.male || 0,
          stats.genderDistribution?.female || 0,
          stats.genderDistribution?.other || 0
        ],
        backgroundColor: ['#3b82f6', '#ec4899', '#94a3b8'],
        hoverOffset: 4
      }]
    };
  }

  getPriceChartData(stats: any): ChartData<'bar'> {
    return {
      labels: ['Prix moyen du vote'],
      datasets: [{
        label: '€',
        data: [stats.averageVotePrice || 0],
        backgroundColor: '#f59e0b'
      }]
    };
  }

  getCorruptionTypesChartData(stats: any): ChartData<'pie'> {
    const types = Object.keys(stats.corruptionTypes || {});
    return {
      labels: types,
      datasets: [{
        data: types.map(type => stats.corruptionTypes[type]),
        backgroundColor: [
          '#ef4444', '#f97316', '#f59e0b', '#84cc16',
          '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
          '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
          '#d946ef', '#ec4899', '#f43f5e'
        ]
      }]
    };
  }

  objectToArray(obj: any): {key: string, value: any}[] {
    if (!obj) return [];
    return Object.keys(obj).map(key => ({
      key,
      value: obj[key]
    }));
  }

}