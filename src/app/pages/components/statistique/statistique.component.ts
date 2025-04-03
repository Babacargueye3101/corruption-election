import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { FirebaseService } from '../../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SortPipe } from '../../../pipes/sort.pipe';
import { Router } from '@angular/router';

Chart.register(...registerables);

@Component({
  selector: 'app-statistique',
  standalone: true,
  imports: [CommonModule, FormsModule, SortPipe],
  templateUrl: './statistique.component.html',
  styleUrls: ['./statistique.component.scss']
})
export class StatistiqueComponent implements OnInit, OnDestroy {
  @ViewChild('genderChart') genderChartRef!: ElementRef;
  @ViewChild('priceChart') priceChartRef!: ElementRef;
  @ViewChild('corruptionTypesChart') corruptionTypesChartRef!: ElementRef;
  @ViewChild('ageDistributionChart') ageDistributionChartRef!: ElementRef;

  regions: string[] = [];
  communes: string[] = [];
  communesStats: any[] = [];
  selectedRegion: string = '';
  selectedCommune: string = '';
  selectedPeriod: string = 'all';
  stats: any = {};
  loading = true;
  corruptionTypesArray: any[] = [];

  private charts: Chart[] = [];

  constructor(private firebaseService: FirebaseService, private router: Router) {}

  async ngOnInit() {
    await this.loadRegions();
    await this.loadGlobalStats();
  }

  ngOnDestroy() {
    this.destroyAllCharts();
  }

  private destroyAllCharts() {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  }

  private createChart(
    canvasRef: ElementRef,
    config: ChartConfiguration
  ): Chart | undefined {
    if (!canvasRef?.nativeElement) return undefined;

    const existingChart = Chart.getChart(canvasRef.nativeElement);
    if (existingChart) {
      existingChart.destroy();
    }

    const ctx = canvasRef.nativeElement.getContext('2d');
    if (!ctx) return undefined;

    const newChart = new Chart(ctx, config);
    this.charts.push(newChart);
    return newChart;
  }

  // Méthodes utilitaires pour les types de corruption
  getTypeLabel(key: string): string {
    const labels: {[key: string]: string} = {
      'voterIntimidation': 'Intimidation des électeurs',
      'jobPromise': 'Promesses d\'emploi',
      'contractWithCollectivity': 'Contrats publics',
      'voteBuying': 'Achat de votes',
      'renovationOfVotersHouses': 'Rénovation de maisons',
      'subsidyToAssociations': 'Subventions aux associations',
      'fuelExpenses': 'Carburant offert',
      'resultFalsification': 'Falsification des résultats',
      'abuseOfPublicResources': 'Détournement de fonds publics',
      'dontknow': 'Autres cas'
    };
    return labels[key] || key;
  }

  getTypeIcon(key: string): string {
    const icons: {[key: string]: string} = {
      'voterIntimidation': 'fas fa-user-shield',
      'jobPromise': 'fas fa-briefcase',
      'contractWithCollectivity': 'fas fa-file-contract',
      'voteBuying': 'fas fa-money-bill-wave',
      'renovationOfVotersHouses': 'fas fa-home',
      'subsidyToAssociations': 'fas fa-hand-holding-usd',
      'fuelExpenses': 'fas fa-gas-pump',
      'resultFalsification': 'fas fa-clipboard-check',
      'abuseOfPublicResources': 'fas fa-landmark',
      'dontknow': 'fas fa-question-circle'
    };
    return icons[key] || 'fas fa-exclamation-circle';
  }

  getTypeColor(key: string): string {
    const colors: {[key: string]: string} = {
      'voterIntimidation': '#ef4444',
      'jobPromise': '#f97316',
      'contractWithCollectivity': '#f59e0b',
      'voteBuying': '#10b981',
      'renovationOfVotersHouses': '#3b82f6',
      'subsidyToAssociations': '#6366f1',
      'fuelExpenses': '#8b5cf6',
      'resultFalsification': '#ec4899',
      'abuseOfPublicResources': '#71717a',
      'dontknow': '#84cc16'
    };
    return colors[key] || '#999';
  }

  async loadRegions() {
    this.regions = await this.firebaseService.getRegions();
  }

  async loadGlobalStats() {
    try {
      this.loading = true;
      this.stats = await this.firebaseService.getStatistics();
      this.corruptionTypesArray = this.stats.corruptionTypes
        ? this.firebaseService.objectToArray(this.stats.corruptionTypes)
        : [];
      this.prepareCharts();
    } finally {
      this.loading = false;
    }
  }

  async onRegionChange() {
    this.selectedCommune = '';
    if (!this.selectedRegion) {
      await this.loadGlobalStats();
      return;
    }

    try {
      this.loading = true;
      this.communes = await this.firebaseService.getCommunes(this.selectedRegion);
      this.stats = await this.firebaseService.getStatistics(this.selectedRegion);
      this.corruptionTypesArray = this.stats.corruptionTypes
        ? this.firebaseService.objectToArray(this.stats.corruptionTypes)
        : [];

      this.communesStats = [];
      for (const commune of this.communes) {
        const stats = await this.firebaseService.getStatistics(this.selectedRegion, commune);
        this.communesStats.push({ name: commune, ...stats });
      }

      this.prepareCharts();
    } finally {
      this.loading = false;
    }
  }

  getPercentage(value: number): string {
    if (!this.stats?.totalParticipants || this.stats.totalParticipants === 0) return '0';
    return ((value / this.stats.totalParticipants) * 100).toFixed(1);
  }

  async onCommuneChange() {
    if (!this.selectedCommune) {
      await this.onRegionChange();
      return;
    }

    try {
      this.loading = true;
      this.stats = await this.firebaseService.getStatistics(this.selectedRegion, this.selectedCommune);
      this.corruptionTypesArray = this.stats.corruptionTypes
        ? this.firebaseService.objectToArray(this.stats.corruptionTypes)
        : [];
      this.prepareCharts();
    } finally {
      this.loading = false;
    }
  }

  private prepareCharts() {
    setTimeout(() => {
      this.createChart(this.genderChartRef, this.getGenderChartConfig());
      this.createChart(this.priceChartRef, this.getPriceChartConfig());
      this.createChart(this.corruptionTypesChartRef, this.getCorruptionTypesChartConfig());
      this.createChart(this.ageDistributionChartRef, this.getAgeDistributionChartConfig());
    });
  }

  private getGenderChartConfig(): ChartConfiguration {
    return {
      type: 'doughnut',
      data: {
        labels: ['Femmes', 'Hommes'],
        datasets: [{
          data: [
            this.stats?.genderDistribution?.female || 0,
            this.stats?.genderDistribution?.male || 0
          ],
          backgroundColor: ['#8b5cf6', '#3b82f6'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    };
  }

  private getPriceChartConfig(): ChartConfiguration {
    return {
      type: 'bar',
      data: {
        labels: ['Prix Moyen'],
        datasets: [{
          label: 'Prix (€)',
          data: [this.stats?.averageVotePrice || 0],
          backgroundColor: '#10b981'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        }
      }
    };
  }

  private getCorruptionTypesChartConfig(): ChartConfiguration {
    const sortedTypes = [...this.corruptionTypesArray].sort((a, b) => b.value - a.value);

    return {
      type: 'pie',
      data: {
        labels: sortedTypes.map(t => this.getTypeLabel(t.key)),
        datasets: [{
          data: sortedTypes.map(t => t.value),
          backgroundColor: sortedTypes.map(t => this.getTypeColor(t.key))
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { size: 12 },
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data
                  .filter((value): value is number => typeof value === 'number')
                  .reduce((a: number, b: number) => a + b, 0);
                const percentage = Math.round((Number(value) / Number(total)) * 100);
                return `${label}: ${value} cas (${percentage}%)`;
              }
            }
          }
        }
      }
    };
  }

  private getAgeDistributionChartConfig(): ChartConfiguration {
    const ageGroups = this.stats?.participantsByAge ? Object.keys(this.stats.participantsByAge) : [];
    const ageData = ageGroups.map(age => this.stats.participantsByAge[age]);

    return {
      type: 'bar',
      data: {
        labels: ageGroups,
        datasets: [{
          label: 'Participants',
          data: ageData,
          backgroundColor: '#3b82f6'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        }
      }
    };
  }

  onPeriodChange() {
    console.log('Période sélectionnée:', this.selectedPeriod);
  }

  viewCommuneDetails(commune: string) {
    this.selectedCommune = commune;
    this.onCommuneChange();
  }

  refreshData() {
    if (this.selectedCommune) {
      this.onCommuneChange();
    } else if (this.selectedRegion) {
      this.onRegionChange();
    } else {
      this.loadGlobalStats();
    }
  }
  gotoMessage() {
    this.router.navigate(['/messages'])
  }

  exportToExcel() {
    console.log('Exporting data to Excel...');
  }
}