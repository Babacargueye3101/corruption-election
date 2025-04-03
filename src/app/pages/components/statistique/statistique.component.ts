import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { FirebaseService } from '../../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Enregistrer tous les composants de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-statistique',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(private firebaseService: FirebaseService) {}

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

    // Vérifier si le canvas est déjà utilisé
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

  async loadRegions() {
    this.regions = await this.firebaseService.getRegions();
  }

  async loadGlobalStats() {
    try {
      this.loading = true;
      this.stats = await this.firebaseService.getStatistics();
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

  async onCommuneChange() {
    if (!this.selectedCommune) {
      await this.onRegionChange();
      return;
    }

    try {
      this.loading = true;
      this.stats = await this.firebaseService.getStatistics(this.selectedRegion, this.selectedCommune);
      this.prepareCharts();
    } finally {
      this.loading = false;
    }
  }

  private prepareCharts() {
    this.corruptionTypesArray = this.stats.corruptionTypes
      ? this.firebaseService.objectToArray(this.stats.corruptionTypes)
      : [];

    // Utiliser setTimeout pour s'assurer que la vue est mise à jour
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
    return {
      type: 'pie',
      data: {
        labels: this.corruptionTypesArray.map(t => t.key),
        datasets: [{
          data: this.corruptionTypesArray.map(t => t.value),
          backgroundColor: [
            '#ef4444', '#f97316', '#f59e0b', '#10b981',
            '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' }
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

  exportToExcel() {
    console.log('Exporting data to Excel...');
  }
}