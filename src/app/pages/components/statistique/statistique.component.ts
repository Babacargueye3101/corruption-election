import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FirebaseService } from '../../../services/firebase.service';



interface SurveyData {
  section1: {
    region: string;
    commune: string;
    age: string;
    gender: string;
  };
  totalScore: number; // Déplacé au niveau racine
  [key: string]: any;
}

@Component({
  selector: 'app-statistique',
  imports: [CommonModule],
  templateUrl: './statistique.component.html',
  styleUrl: './statistique.component.scss'
})
export class StatistiqueComponent {

  isLoading = true;
  total =0;
  allScores: number[] = [];

  statsByRegion: { [region: string]: { count: number; communes: { [commune: string]: number } } } = {};

  constructor(private firebaseService: FirebaseService){}


  async ngOnInit() {
    try {
      const data = await this.firebaseService.getResponsesWithHighScore();
      this.processData(data as SurveyData[]);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      this.isLoading = false;
    }
  }


  private processData(data: SurveyData[]) {
    this.total = data.length;
    this.allScores = data.map(item => item.totalScore);

    this.statsByRegion = data.reduce((acc, item) => {
      const region = item.section1.region;
      const commune = item.section1.commune;

      if (!acc[region]) {
        acc[region] = { count: 0, communes: {} };
      }

      acc[region].count++;

      if (!acc[region].communes[commune]) {
        acc[region].communes[commune] = 0;
      }
      acc[region].communes[commune]++;

      return acc;
    }, {} as { [region: string]: { count: number; communes: { [commune: string]: number } } });
  }

  get averageScore(): number {
    if (this.allScores.length === 0) return 0;
    const sum = this.allScores.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.allScores.length);
  }

  get regions() {
    return Object.keys(this.statsByRegion);
  }

  getCommunes(region: string): string[] {
    return Object.keys(this.statsByRegion[region]?.communes || {});
  }

}
