import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { FirebaseService } from '../../../services/firebase.service';
import { FormsModule } from '@angular/forms';



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
  imports: [CommonModule, FormsModule],
  templateUrl: './statistique.component.html',
  styleUrl: './statistique.component.scss'
})
export class StatistiqueComponent implements OnInit, AfterViewInit {
  @ViewChild('genderChart') genderChartRef: any;
  @ViewChild('priceChart') priceChartRef: any;
  @ViewChild('corruptionTypesChart') corruptionTypesChartRef: any;
  @ViewChild('ageDistributionChart') ageDistributionChartRef: any;

  regions: string[] = [];
  communes: string[] = [];
  communesStats: any[] = [];
  selectedRegion: string = '';
  selectedCommune: string = '';
  selectedPeriod: string = 'all';
  stats: any = {};
  loading = true;
  corruptionTypesArray: any[] = [];

  private genderChart?: Chart;
  private priceChart?: Chart;
  private corruptionTypesChart?: Chart;
  private ageDistributionChart?: Chart;

  constructor(private firebaseService: FirebaseService) {}

  async ngOnInit() {
    await this.loadRegions();
    await this.loadGlobalStats();
  }

  ngAfterViewInit() {
    this.initCharts();
  }

  private initCharts() {
    if (this.stats) {
      this.renderGenderChart();
      this.renderPriceChart();
      this.renderCorruptionTypesChart();
      this.renderAgeDistributionChart();
    }
  }

  private renderGenderChart() {
    const ctx = this.genderChartRef.nativeElement.getContext('2d');
    new Chart(ctx, this.getGenderChartConfig());
  }

  private renderPriceChart() {
    const ctx = this.priceChartRef.nativeElement.getContext('2d');
    new Chart(ctx, this.getPriceChartConfig());
  }

  private renderCorruptionTypesChart() {
    const ctx = this.corruptionTypesChartRef.nativeElement.getContext('2d');
    new Chart(ctx, this.getCorruptionTypesChartConfig());
  }

  private renderAgeDistributionChart() {
    const ctx = this.ageDistributionChartRef.nativeElement.getContext('2d');
    new Chart(ctx, this.getAgeDistributionChartConfig());
  }


  async loadRegions() {
    this.regions = await this.firebaseService.getRegions();
  }

  async loadGlobalStats() {
    this.loading = true;
    this.stats = await this.firebaseService.getStatistics();
    this.prepareCharts();
    this.loading = false;
  }

  async onRegionChange() {
    this.selectedCommune = '';
    if (!this.selectedRegion) {
      await this.loadGlobalStats();
      return;
    }

    this.loading = true;
    this.communes = await this.firebaseService.getCommunes(this.selectedRegion);
    this.stats = await this.firebaseService.getStatistics(this.selectedRegion);

    // Charger les stats pour chaque commune
    this.communesStats = [];
    for (const commune of this.communes) {
      const stats = await this.firebaseService.getStatistics(this.selectedRegion, commune);
      this.communesStats.push({
        name: commune,
        ...stats
      });
    }

    this.prepareCharts();
    this.loading = false;
  }

  async onCommuneChange() {
    if (!this.selectedCommune) {
      await this.onRegionChange();
      return;
    }

    this.loading = true;
    this.stats = await this.firebaseService.getStatistics(this.selectedRegion, this.selectedCommune);
    this.prepareCharts();
    this.loading = false;
  }

  onPeriodChange() {
    // Implémentez le filtrage par période ici
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
    // Implémentez l'export Excel ici
    console.log('Exporting data to Excel...');
  }

  private prepareCharts() {
    this.corruptionTypesArray = this.firebaseService.objectToArray(this.stats.corruptionTypes || {});

    // Détruire les anciens graphiques s'ils existent
    [this.genderChart, this.priceChart, this.corruptionTypesChart, this.ageDistributionChart].forEach(chart => {
      if (chart) chart.destroy();
    });

    // Graphique de répartition par genre
    this.genderChart = new Chart(
      this.genderChartRef.nativeElement,
      this.getGenderChartConfig()
    );

    // Graphique du prix moyen
    this.priceChart = new Chart(
      this.priceChartRef.nativeElement,
      this.getPriceChartConfig()
    );

    // Graphique des types de corruption
    this.corruptionTypesChart = new Chart(
      this.corruptionTypesChartRef.nativeElement,
      this.getCorruptionTypesChartConfig()
    );

    // Graphique de répartition par âge
    this.ageDistributionChart = new Chart(
      this.ageDistributionChartRef.nativeElement,
      this.getAgeDistributionChartConfig()
    );
  }

  private getGenderChartConfig(): ChartConfiguration {
    return {
      type: 'doughnut',
      data: this.firebaseService.getGenderChartData(this.stats),
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    };
  }

  private getPriceChartConfig(): ChartConfiguration {
    return {
      type: 'bar',
      data: this.firebaseService.getPriceChartData(this.stats),
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    };
  }

  private getCorruptionTypesChartConfig(): ChartConfiguration {
    return {
      type: 'pie',
      data: this.firebaseService.getCorruptionTypesChartData(this.stats),
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' }
        }
      }
    };
  }

  private getAgeDistributionChartConfig(): ChartConfiguration {
    const ageGroups = Object.keys(this.stats.participantsByAge || {});
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
        scales: {
          y: { beginAtZero: true }
        }
      }
    };
  }

}
