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
  totalHighScore = 0;
  totalLowScore = 0;
  allHighScores: number[] = [];
  allLowScores: number[] = [];

  highScoreStatsByRegion: { [region: string]: { count: number; communes: { [commune: string]: number } } } = {};
  lowScoreStatsByRegion: { [region: string]: { count: number; communes: { [commune: string]: number } } } = {};

  constructor(private firebaseService: FirebaseService){}


  async ngOnInit() {
    try {
      const [highScoreData, lowScoreData] = await Promise.all([
        this.firebaseService.getResponsesWithHighScore(45),
        this.firebaseService.getResponsesWithLowScore(45)
      ]);

      this.processHighScoreData(highScoreData as SurveyData[]);
      this.processLowScoreData(lowScoreData as SurveyData[]);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private processHighScoreData(data: SurveyData[]) {
    this.totalHighScore = data.length;
    this.allHighScores = data.map(item => item.totalScore);

    this.highScoreStatsByRegion = data.reduce((acc, item) => {
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

  private processLowScoreData(data: SurveyData[]) {
    this.totalLowScore = data.length;
    this.allLowScores = data.map(item => item.totalScore);

    this.lowScoreStatsByRegion = data.reduce((acc, item) => {
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

  get highScoreAverage(): number {
    if (this.allHighScores.length === 0) return 0;
    const sum = this.allHighScores.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.allHighScores.length);
  }

  get lowScoreAverage(): number {
    if (this.allLowScores.length === 0) return 0;
    const sum = this.allLowScores.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.allLowScores.length);
  }

  get highScoreRegions() {
    return Object.keys(this.highScoreStatsByRegion);
  }

  get lowScoreRegions() {
    return Object.keys(this.lowScoreStatsByRegion);
  }

  getHighScoreCommunes(region: string): string[] {
    return Object.keys(this.highScoreStatsByRegion[region]?.communes || {});
  }

  getLowScoreCommunes(region: string): string[] {
    return Object.keys(this.lowScoreStatsByRegion[region]?.communes || {});
  }

}
