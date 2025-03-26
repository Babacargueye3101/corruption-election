import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';
import { FirebaseService } from '../../../services/firebase.service';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.scss'
})
export class QuestionnaireComponent implements OnInit {
  questionnaireForm: FormGroup;
  currentSection: number = 1;
  totalScore: number = 0;
  formSubmitted: boolean = false;

  regions: any[] = [];
  communes: string[] = [];

  // Options pour les sélections multiples
  corruptionOptions = [
    { value: 'voteBuying', label: 'Achat de votes', points: 2 },
    { value: 'resultFalsification', label: 'Falsification des résultats', points: 2 },
    { value: 'voterIntimidation', label: 'Intimidation des électeurs', points: 2 },
    { value: 'abuseOfPublicResources', label: 'Utilisation abusive des ressources publiques', points: 2 },
    { value: 'renovationOfVotersHouses', label: 'Rénovation de la maison des électeurs', points: 2 },
    { value: 'fuelExpenses', label: 'Prise en charge de frais de carburant', points: 2 },
    { value: 'jobPromise', label: 'Promesse d\'emploi', points: 2 },
    { value: 'subsidyToAssociations', label: 'Subvention versée à certaines associations', points: 2 },
    { value: 'contractWithCollectivity', label: 'Obtention d\'un contrat avec la collectivité', points: 2 },
    { value: 'otherCorruption', label: 'Autre', points: 1 }
  ];

  alternativeOptions = [
    { value: 'job', label: 'Chercher un emploi ou une formation professionnelle', points: 2 },
    { value: 'social', label: 'Participer à des programmes d\'aide sociale', points: 2 },
    { value: 'report', label: 'Refuser les offres et signaler la corruption', points: 2 },
    { value: 'other', label: 'Autre', points: 1 }
  ];

  nonVoteReasons = [
    { value: 'no_trust', label: 'Manque de confiance dans les politiciens', points: 2 },
    { value: 'no_info', label: 'Manque d\'informations sur les enjeux électoraux', points: 2 },
    { value: 'no_impact', label: 'Sentiment que votre vote ne compte pas', points: 2 },
    { value: 'corruption', label: 'Corruption électorale', points: 2 },
    { value: 'no_interest', label: 'Manque d\'intérêt pour la politique', points: 2 },
    { value: 'no_representation', label: 'Manque de représentativité des candidats', points: 2 },
    { value: 'useless', label: 'Inutilité du vote', points: 2 },
    { value: 'practical_obstacles', label: 'Obstacles pratiques (déplacement, absence, etc.)', points: 2 },
    { value: 'other', label: 'Autre', points: 1 }
  ];

  encourageVoteOptions = [
    { value: 'awareness', label: 'Sensibiliser votre entourage', points: 2 },
    { value: 'monitoring', label: 'Participer à des initiatives de surveillance électorale', points: 2 },
    { value: 'vote_free', label: 'Voter en toute conscience, sans pression', points: 2 },
    { value: 'other', label: 'Autre', points: 1 }
  ];

  constructor(private fb: FormBuilder, private http: HttpClient, private firebaseService: FirebaseService) {
    this.questionnaireForm = this.fb.group({
      section1: this.fb.group({
        age: ['', Validators.required],
        gender: ['', Validators.required],
        region: ['', Validators.required],
        commune: ['', Validators.required]
      }),
      section2: this.fb.group({
        corruptionTypes: this.fb.array([], Validators.required),
        otherCorruptionDescription: [''],
        electoralCorruptionProblem: ['', Validators.required],
        knowledgeAboutLaws: ['', Validators.required]
      }),
      section3: this.fb.group({
        corruptionExperience: ['', Validators.required],
        corruptionDescription: [''],
        voteIncentive: ['', Validators.required],
        votingPressure: ['', Validators.required]
      }),
      section4: this.fb.group({
        moneyGivenAmount: [''],
        voteValueEstimate: [''],
        sellVote: ['', Validators.required],
        moneyForVote: [''],
        corruptPersons: this.fb.array([], this.validateCorruptPersons()),
        otherCorruptPerson: ['']
      }),
      section5: this.fb.group({
        alternativeOptions: this.fb.array([]),
        alternativeOptionsDescription: [''],
        needHelp: ['', Validators.required],
        willingToRefuseCorruption: ['', Validators.required]
      }),
      section6: this.fb.group({
        intentionVoter: ['', Validators.required],
        nonVoteReasons: this.fb.array([]),
        aideObstaclesPratiques: [''],
        impactCorruption: ['', Validators.required],
        impactsCorruptionDetails: [''],
        autreImpactCorruption: [''],
        encourageVoteOptions: this.fb.array([]),
        autreEncouragerVoteLibre: ['']
      }),
      section7: this.fb.group({
        questionnaireHelpful: ['', Validators.required],
        intentionVoteLibre: ['', Validators.required],
        candidatureType: ['', Validators.required],
        needHelpForCandidature: ['']
      })
    });
  }

  // Méthodes pour gérer les FormArray
  get corruptionTypesArray(): FormArray {
    return this.questionnaireForm.get('section2.corruptionTypes') as FormArray;
  }

  get corruptPersonsArray(): FormArray {
    return this.questionnaireForm.get('section4.corruptPersons') as FormArray;
  }

  get alternativeOptionsArray(): FormArray {
    return this.questionnaireForm.get('section5.alternativeOptions') as FormArray;
  }

  get nonVoteReasonsArray(): FormArray {
    return this.questionnaireForm.get('section6.nonVoteReasons') as FormArray;
  }

  get encourageVoteOptionsArray(): FormArray {
    return this.questionnaireForm.get('section6.encourageVoteOptions') as FormArray;
  }

  // Méthodes pour toggle les sélections
  toggleCorruptionType(value: string): void {
    const index = this.corruptionTypesArray.value.indexOf(value);
    if (index === -1) {
      this.corruptionTypesArray.push(this.fb.control(value));
    } else {
      this.corruptionTypesArray.removeAt(index);
    }
  }

  toggleCorruptPerson(value: string): void {
    const index = this.corruptPersonsArray.value.indexOf(value);
    if (index === -1) {
      this.corruptPersonsArray.push(this.fb.control(value));
    } else {
      this.corruptPersonsArray.removeAt(index);
    }

    if (value === 'Autre' && !this.isCorruptPersonSelected('Autre')) {
      this.questionnaireForm.get('section4.otherCorruptPerson')?.reset();
    }
  }

  toggleAlternativeOption(value: string): void {
    const index = this.alternativeOptionsArray.value.indexOf(value);
    if (index === -1) {
      this.alternativeOptionsArray.push(this.fb.control(value));
    } else {
      this.alternativeOptionsArray.removeAt(index);
    }
  }

  toggleNonVoteReason(value: string): void {
    const index = this.nonVoteReasonsArray.value.indexOf(value);
    if (index === -1) {
      this.nonVoteReasonsArray.push(this.fb.control(value));
    } else {
      this.nonVoteReasonsArray.removeAt(index);
    }
  }

  toggleEncourageVoteOption(value: string): void {
    const index = this.encourageVoteOptionsArray.value.indexOf(value);
    if (index === -1) {
      this.encourageVoteOptionsArray.push(this.fb.control(value));
    } else {
      this.encourageVoteOptionsArray.removeAt(index);
    }
  }

  // Méthodes pour vérifier les sélections
  isCorruptionTypeSelected(value: string): boolean {
    return this.corruptionTypesArray.value.includes(value);
  }

  isCorruptPersonSelected(value: string): boolean {
    return this.corruptPersonsArray.value.includes(value);
  }

  isAlternativeOptionSelected(value: string): boolean {
    return this.alternativeOptionsArray.value.includes(value);
  }

  isNonVoteReasonSelected(value: string): boolean {
    return this.nonVoteReasonsArray.value.includes(value);
  }

  isEncourageVoteOptionSelected(value: string): boolean {
    return this.encourageVoteOptionsArray.value.includes(value);
  }

  // Validation personnalisée
  validateCorruptPersons(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const sellVote = this.questionnaireForm?.get('section4.sellVote')?.value;
      const corruptPersons = control as FormArray;

      if (sellVote === 'Oui' && corruptPersons.length === 0) {
        return { required: true };
      }
      return null;
    };
  }

  ngOnInit(): void {
    this.loadRegions();
  }

  loadRegions() {
    this.http.get('assets/regions-communes.json').subscribe((data: any) => {
      this.regions = data.regions;
    });
  }

  onRegionChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const regionName = target.value;
    const selectedRegion = this.regions.find(region => region.nom === regionName);
    this.communes = selectedRegion ? selectedRegion.communes : [];
  }

  nextSection() {
    this.markFormGroupTouched(this.getCurrentSectionGroup());

    if (this.getCurrentSectionGroup().valid) {
      if (this.currentSection < 7) {
        // Logique spéciale pour la section 3
        if (this.currentSection === 3) {
          const corruptionExperience = this.questionnaireForm.get('section3.corruptionExperience')?.value;
          if (corruptionExperience === 'Non' || corruptionExperience === 'Ne pas répondre') {
            this.currentSection = 6;
          } else {
            this.currentSection++;
          }
        }
        // Logique spéciale pour la section 6
        else if (this.currentSection === 6) {
          const intentionVoter = this.questionnaireForm.get('section6.intentionVoter')?.value;
          if (intentionVoter === 'Oui') {
            this.currentSection = 7;
          } else {
            this.currentSection++;
          }
        }
        // Pour toutes les autres sections
        else {
          this.currentSection++;
        }
      }
    } else {
      Swal.fire({
        title: 'Champs obligatoires',
        text: 'Veuillez remplir tous les champs obligatoires avant de continuer.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    }
  }

  previousSection() {
    if (this.currentSection > 1) {
      // Si on est à la section 7 et qu'on vient de la section 6 avec un "Oui" à intentionVoter
      if (this.currentSection === 7) {
        const intentionVoter = this.questionnaireForm.get('section6.intentionVoter')?.value;
        if (intentionVoter === 'Oui') {
          this.currentSection = 6;
          return;
        }
      }
      // Si on est à la section 6 et qu'on vient de la section 3
      else if (this.currentSection === 6) {
        const corruptionExperience = this.questionnaireForm.get('section3.corruptionExperience')?.value;
        if (corruptionExperience === 'Non' || corruptionExperience === 'Ne pas répondre') {
          this.currentSection = 3;
          return;
        }
      }
      this.currentSection--;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.markAsTouched();
      }
    });
  }

  private getCurrentSectionGroup(): FormGroup {
    return this.questionnaireForm.get(`section${this.currentSection}`) as FormGroup;
  }

  onSubmit() {
    this.markFormGroupTouched(this.questionnaireForm);
    this.formSubmitted = true;

    if (this.questionnaireForm.valid) {
      this.calculateScore();
      const formData = {
        ...this.questionnaireForm.value,
        totalScore: this.totalScore
      };

      Swal.fire({
        title: 'Confirmation',
        html: `
          <p>Êtes-vous sûr d'avoir bien répondu aux différentes questions ?</p>
          <input type="email" id="swal-email" class="swal2-input" placeholder="Votre email">
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'OUI',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        preConfirm: () => {
          const email = (document.getElementById('swal-email') as HTMLInputElement).value;
          if (!email) {
            Swal.showValidationMessage('Veuillez entrer votre email');
            return false;
          }
          if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            Swal.showValidationMessage('Veuillez entrer un email valide');
            return false;
          }
          return email;
        }
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const email = result.value;
          const name = 'Jimmy David';

          this.saveToFirebase(email, formData);
          this.generateCertificate(name, this.totalScore);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire('Annulé', 'Vous pouvez revenir plus tard pour compléter le questionnaire.', 'info');
        }
      });
    } else {
      Swal.fire({
        title: 'Formulaire incomplet',
        text: 'Veuillez remplir tous les champs obligatoires avant de soumettre.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    }
  }

  async saveToFirebase(email: string, data: any) {
    try {
      const docId = await this.firebaseService.saveResponse(email, data);
      console.log('Sauvegarde réussie, ID:', docId);
      return true;
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      return false;
    }
  }

  calculateScore() {
    let score = 0;

    // Section 2
    this.corruptionTypesArray.value.forEach((val: string) => {
      const option = this.corruptionOptions.find(o => o.value === val);
      if (option) score += option.points;
    });

    const electoralCorruptionProblem = this.questionnaireForm.get('section2.electoralCorruptionProblem')?.value;
    if (electoralCorruptionProblem === 'Oui') {
      score += 3;
    } else if (electoralCorruptionProblem === 'Ne sais pas') {
      score += 1;
    }

    const knowledgeAboutLaws = this.questionnaireForm.get('section2.knowledgeAboutLaws')?.value;
    if (knowledgeAboutLaws === 'Très informé') {
      score += 5;
    } else if (knowledgeAboutLaws === 'Un peu informé') {
      score += 3;
    }

    // Section 3
    const corruptionExperience = this.questionnaireForm.get('section3.corruptionExperience')?.value;
    if (corruptionExperience === 'Non') {
      score += 5;
    } else if (corruptionExperience === 'Ne pas répondre') {
      score += 2;
    }

    const voteIncentive = this.questionnaireForm.get('section3.voteIncentive')?.value;
    if (voteIncentive === 'Non') {
      score += 5;
    } else if (voteIncentive === 'Ne pas répondre') {
      score += 2;
    }

    const votingPressure = this.questionnaireForm.get('section3.votingPressure')?.value;
    if (votingPressure === 'Non') {
      score += 5;
    } else if (votingPressure === 'Ne pas répondre') {
      score += 2;
    }

    // Section 4
    const sellVote = this.questionnaireForm.get('section4.sellVote')?.value;
    if (sellVote === 'Non') {
      score += 5;
    } else if (sellVote === 'Je ne sais pas') {
      score += 1;
    }

    // Ajout des points pour les personnes corruptrices (2 points par réponse)
    this.corruptPersonsArray.value.forEach((val: string) => {
      score += 2;
    });

    // Section 5
    this.alternativeOptionsArray.value.forEach((val: string) => {
      const option = this.alternativeOptions.find(o => o.value === val);
      if (option) score += option.points;
    });

    const needHelp = this.questionnaireForm.get('section5.needHelp')?.value;
    if (needHelp === 'Oui') {
      score += 5;
    } else if (needHelp === 'Je ne sais pas') {
      score += 1;
    }

    const willingToRefuseCorruption = this.questionnaireForm.get('section5.willingToRefuseCorruption')?.value;
    if (willingToRefuseCorruption === 'Oui') {
      score += 5;
    } else if (willingToRefuseCorruption === 'Je ne sais pas') {
      score += 1;
    }

    // Section 6
    const intentionVoter = this.questionnaireForm.get('section6.intentionVoter')?.value;
    if (intentionVoter === 'Oui') {
      score += 5;
    } else if (intentionVoter === 'Je ne sais pas') {
      score += 1;
    }

    this.nonVoteReasonsArray.value.forEach((val: string) => {
      const option = this.nonVoteReasons.find(o => o.value === val);
      if (option) score += option.points;
    });

    const aideObstaclesPratiques = this.questionnaireForm.get('section6.aideObstaclesPratiques')?.value;
    if (aideObstaclesPratiques === 'Oui') {
      score += 5;
    } else if (aideObstaclesPratiques === 'Je ne sais pas') {
      score += 1;
    }

    const impactCorruption = this.questionnaireForm.get('section6.impactCorruption')?.value;
    if (impactCorruption === 'Oui') {
      score += 5;
    } else if (impactCorruption === 'Je ne sais pas') {
      score += 1;
    }

    this.encourageVoteOptionsArray.value.forEach((val: string) => {
      const option = this.encourageVoteOptions.find(o => o.value === val);
      if (option) score += option.points;
    });

    // Section 7
    const questionnaireHelpful = this.questionnaireForm.get('section7.questionnaireHelpful')?.value;
    if (questionnaireHelpful === 'Oui') {
      score += 2;
    } else if (questionnaireHelpful === 'Un peu') {
      score += 1;
    }

    const intentionVoteLibre = this.questionnaireForm.get('section7.intentionVoteLibre')?.value;
    if (intentionVoteLibre === 'Oui') {
      score += 5;
    } else if (intentionVoteLibre === 'Je ne sais pas') {
      score += 1;
    }

    const candidatureType = this.questionnaireForm.get('section7.candidatureType')?.value;
    if (candidatureType === 'Tête de liste') {
      score += 5;
    } else if (candidatureType === 'Colistier ou colistière') {
      score += 3;
    } else if (candidatureType === 'Je ne sais pas') {
      score += 1;
    }

    const needHelpForCandidature = this.questionnaireForm.get('section7.needHelpForCandidature')?.value;
    if (needHelpForCandidature === 'Oui') {
      score += 5;
    } else if (needHelpForCandidature === 'Je ne sais pas') {
      score += 1;
    }

    this.totalScore = score;
  }

  generateCertificate(name: string, score: number) {
    const doc = new jsPDF('landscape');

    doc.setDrawColor(0);
    doc.setLineWidth(1);
    doc.rect(10, 10, 280, 190);

    const img = new Image();
    img.src = 'assets/vote.png';
    img.onload = () => {
      doc.addImage(img, 'PNG', 20, 20, 30, 30);

      const region = this.questionnaireForm.get('section1.region')?.value;
      const commune = this.questionnaireForm.get('section1.commune')?.value;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Région : ${region}`, 260, 25, { align: 'right' });
      doc.text(`Commune : ${commune}`, 260, 35, { align: 'right' });

      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(score >= 45 ? 'Certificat de Réussite' : 'Certificat d\'Échec', 105, 60, { align: 'center' });

      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Questionnaire sur la sensibilisation à la corruption électorale', 105, 75, { align: 'center' });

      doc.setFontSize(12);
      const certificateNumber = `#CORR-2023-${Math.floor(Math.random() * 10000)}`;
      doc.text(`Numéro de certificat : ${certificateNumber}`, 20, 100);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      if (score >= 45) {
        doc.text('Félicitations !', 20, 120);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Vous avez démontré une compréhension approfondie des enjeux liés à la corruption électorale.', 20, 130);
        doc.text('Votre engagement est essentiel pour préserver la transparence et l\'intégrité dans les processus démocratiques.', 20, 140);
      } else {
        doc.text('Nous vous remercions pour votre participation.', 20, 120);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Votre score indique que vous avez besoin de plus d\'informations et de sensibilisation sur la corruption électorale.', 20, 130);
        doc.text('Nous vous encourageons à vous renseigner davantage pour contribuer à une démocratie plus juste et équitable.', 20, 140);
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Nom du participant : ${name}`, 20, 170);
      doc.text(`Score obtenu : ${score} / 97`, 20, 180);
      doc.text(`Date de délivrance : ${new Date().toLocaleDateString()}`, 20, 190);

      doc.save(`certificat_${name.replace(/ /g, '_')}.pdf`);
    };
  }
}