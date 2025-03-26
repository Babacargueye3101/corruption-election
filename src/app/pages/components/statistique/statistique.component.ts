import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FirebaseService } from '../../../services/firebase.service';



interface VotePriceData {
  region: string;
  commune: string;
  amount: number;
}

interface RegionStats {
  totalAmount: number;
  average: number;
  maxAmount: number;
  communeStats: { [commune: string]: CommuneStats };
}

interface CommuneStats {
  totalAmount: number;
  average: number;
  maxAmount: number;
  count: number;
}

@Component({
  selector: 'app-statistique',
  imports: [CommonModule],
  templateUrl: './statistique.component.html',
  styleUrl: './statistique.component.scss'
})
export class StatistiqueComponent {

  isLoading = true;
  regionStats: { [region: string]: RegionStats } = {};
  regions: string[] = [];

  constructor(private firebaseService: FirebaseService){}


  async ngOnInit() {
    try {
      // const data = await this.firebaseService.getStatistics("",);
      // this.processData(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private processData(data: VotePriceData[]) {
    // Initialiser la structure des données
    this.regionStats = {};

    data.forEach(item => {
      // Initialiser la région si elle n'existe pas
      if (!this.regionStats[item.region]) {
        this.regionStats[item.region] = {
          totalAmount: 0,
          average: 0,
          maxAmount: 0,
          communeStats: {}
        };
      }

      // Initialiser la commune si elle n'existe pas
      if (!this.regionStats[item.region].communeStats[item.commune]) {
        this.regionStats[item.region].communeStats[item.commune] = {
          totalAmount: 0,
          average: 0,
          maxAmount: 0,
          count: 0
        };
      }

      // Mettre à jour les statistiques
      const region = this.regionStats[item.region];
      const commune = region.communeStats[item.commune];

      // Mise à jour des totaux
      region.totalAmount += item.amount;
      commune.totalAmount += item.amount;
      commune.count += 1;

      // Mise à jour des max
      if (item.amount > region.maxAmount) {
        region.maxAmount = item.amount;
      }
      if (item.amount > commune.maxAmount) {
        commune.maxAmount = item.amount;
      }
    });

    // Calculer les moyennes
    for (const regionName in this.regionStats) {
      const region = this.regionStats[regionName];
      const communeCount = Object.keys(region.communeStats).length;

      region.average = communeCount > 0 ? region.totalAmount / communeCount : 0;

      for (const communeName in region.communeStats) {
        const commune = region.communeStats[communeName];
        commune.average = commune.count > 0 ? commune.totalAmount / commune.count : 0;
      }
    }

    this.regions = Object.keys(this.regionStats).sort();
  }

  getCommunes(region: string): string[] {
    return Object.keys(this.regionStats[region]?.communeStats || {}).sort();
  }

  getSortedRegionsByAmount(): string[] {
    return this.regions.sort((a, b) =>
      this.regionStats[b].totalAmount - this.regionStats[a].totalAmount
    );
  }

  getSortedCommunes(region: string): string[] {
    return this.getCommunes(region).sort((a, b) =>
      this.regionStats[region].communeStats[b].totalAmount -
      this.regionStats[region].communeStats[a].totalAmount
    );
  }

}
