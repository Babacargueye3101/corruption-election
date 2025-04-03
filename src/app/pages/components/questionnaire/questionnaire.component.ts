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
  maxPossibleScore: number = 100;

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
    { value: 'dontknow', label: 'Je ne sais pas' , points: 0 },
    { value: 'otherCorruption', label: 'Autre' , points: 1 }
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
    { value: 'Autre', label: 'Autre', points: 2 }
  ];

  encourageVoteOptions = [
    { value: 'awareness', label: 'Sensibiliser votre entourage', points: 2 },
    { value: 'monitoring', label: 'Participer à des initiatives de surveillance électorale', points: 2 },
    { value: 'vote_free', label: 'Voter en toute conscience, sans pression', points: 2 },
    { value: 'dontknow', label: 'Je sais pas', points: 0 },
    { value: 'Autre', label: 'Autre', points: 2 }
  ];

  impactOptions = [
    {
      value: 'public_services_health',
      label: 'Détérioration des services publics (hôpitaux sous-équipés, pénuries de médicaments)'
    },
    {
      value: 'public_services_education',
      label: 'Détérioration des services publics (écoles délabrées, manque de matériel pédagogique)'
    },
    {
      value: 'public_services_infrastructure',
      label: 'Détérioration des services publics (travaux publics de mauvaise qualité)'
    },
    {
      value: 'inequalities',
      label: 'Inégalités sociales et économiques (favoritisme envers les riches)'
    },
    {
      value: 'social_programs',
      label: 'Inégalités sociales et économiques (détournement des aides sociales)'
    },
    {
      value: 'justice',
      label: 'Insécurité et injustice (justice influencée par l\'argent)'
    },
    {
      value: 'police',
      label: 'Insécurité et injustice (forces de l\'ordre corrompues)'
    },
    {
      value: 'trust_institutions',
      label: 'Perte de confiance dans les institutions (abstention, protestation)'
    },
    {
      value: 'brain_drain',
      label: 'Perte de confiance dans les institutions (exode des jeunes)'
    },
    {
      value: 'high_prices',
      label: 'Impact économique (vie chère due aux monopoles)'
    },
    {
      value: 'investment',
      label: 'Impact économique (découragement des investissements)'
    },
    {
      value: 'environment_mining',
      label: 'Impact sur l\'environnement (exploitation minière illégale)'
    },
    {
      value: 'environment_pollution',
      label: 'Impact sur l\'environnement (pollution non contrôlée)'
    },
    {
      value: 'other_impact',
      label: 'Autre (précisez)'
    }
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
        sellVote: [''],
        moneyForVote: [''],
        corruptPersons: this.fb.array([], this.validateCorruptPersons()),
        otherCorruptPerson: ['']
      }),
      section5: this.fb.group({
        alternativeOptions: this.fb.array([]),
        alternativeOptionsDescription: [''],
        needHelp: [''],
        willingToRefuseCorruption: ['']
      }),
      section6: this.fb.group({
        intentionVoter: ['', Validators.required],
        nonVoteReasons: this.fb.array([]),
        aideObstaclesPratiques: [''],
        impactCorruption: ['', Validators.required],
        impactsCorruptionDetails: [''],
        autreImpactCorruption: [''],
        encourageVoteOptions: this.fb.array([]),
        autreEncouragerVoteLibre: [''],
        impactOptions: this.fb.array([]),
        otherImpactDescription: ['']
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



  get impactOptionsArray(): FormArray {
    return this.questionnaireForm.get('section6.impactOptions') as FormArray;
  }

  toggleImpactOption(value: string): void {
    const index = this.impactOptionsArray.value.indexOf(value);
    if (index === -1) {
      this.impactOptionsArray.push(this.fb.control(value));
    } else {
      this.impactOptionsArray.removeAt(index);
    }
  }

  isImpactOptionSelected(value: string): boolean {
    return this.impactOptionsArray.value.includes(value);
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
    // Valider la section courante avant de continuer
    if (!this.validateCurrentSection()) {
      return;
    }

    // Cas particulier de la section 3
    if (this.currentSection === 3) {
      const section3 = this.getCurrentSectionGroup().value;

      const allNegativeOrNoAnswer =
        (section3.corruptionExperience === 'Non' || section3.corruptionExperience === 'Ne pas répondre') &&
        (section3.voteIncentive === 'Non' || section3.voteIncentive === 'Je préfère ne pas répondre') &&
        (section3.votingPressure === 'Non' || section3.votingPressure === 'Je préfère ne pas répondre');

      if (allNegativeOrNoAnswer) {
        this.currentSection = 6; // Saut direct à la section 6
      } else {
        this.currentSection++; // Aller normalement à la section 4
      }
    }
    // Navigation standard pour les autres sections
    else {
      this.currentSection++;
    }
  }

  previousSection() {
    // Cas particulier quand on revient de la section 6
    if (this.currentSection === 6) {
      const section3 = this.questionnaireForm.get('section3')?.value;
      const cameFromSkippedSections =
        (section3?.corruptionExperience === 'Non' || section3?.corruptionExperience === 'Ne pas répondre') &&
        (section3?.voteIncentive === 'Non' || section3?.voteIncentive === 'Je préfère ne pas répondre') &&
        (section3?.votingPressure === 'Non' || section3?.votingPressure === 'Je préfère ne pas répondre');

      if (cameFromSkippedSections) {
        this.currentSection = 3; // Retour spécial à la section 3
        return;
      }
    }

    // Navigation arrière standard
    this.currentSection--;
  }

  private shouldSkipSections4And5(): boolean {
    const section3 = this.questionnaireForm.get('section3')?.value;
    return (
      (section3?.corruptionExperience === 'Non' || section3?.corruptionExperience === 'Ne pas répondre') &&
      (section3?.voteIncentive === 'Non' || section3?.voteIncentive === 'Je préfère ne pas répondre') &&
      (section3?.votingPressure === 'Non' || section3?.votingPressure === 'Je préfère ne pas répondre')
    );
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(c => c.markAsTouched());
      }
    });
  }

  private goToFirstInvalidSection() {
    for (let i = 1; i <= 7; i++) {
      const section = this.questionnaireForm.get(`section${i}`) as FormGroup;
      if (section.invalid) {
        this.currentSection = i;
        this.scrollToFirstInvalidControl();
        break;
      }
    }
  }


  private getCurrentSectionGroup(): FormGroup {
    return this.questionnaireForm.get(`section${this.currentSection}`) as FormGroup;
  }

  validateCurrentSection(): boolean {
    const currentSection = this.getCurrentSectionGroup();

    if (currentSection.invalid) {
      this.markFormGroupTouched(currentSection);

      // Optionnel : faire défiler jusqu'au premier champ invalide
      this.scrollToFirstInvalidControl();
      return false;
    }
    return true;
  }

  private scrollToFirstInvalidControl() {
    const firstInvalidControl = document.querySelector('.ng-invalid');
    if (firstInvalidControl) {
      firstInvalidControl.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  async onSubmit() {
    this.markFormGroupTouched(this.questionnaireForm);
    this.formSubmitted = true;

    if (this.questionnaireForm.invalid) {
      // Retourner à la première section avec erreur
      this.goToFirstInvalidSection();
      return;
    }
    if (this.questionnaireForm.valid) {
      this.calculateScore();
      const formData = {
        ...this.questionnaireForm.value,
        totalScore: this.totalScore,
        timestamp: new Date().toISOString()
      };

      Swal.fire({
        title: 'Confirmation',
        html: `
          <p>Êtes-vous sûr d'avoir bien répondu aux différentes questions ?</p>
          <input type="email" id="swal-email" class="swal2-input" placeholder="Votre email">
          <input type="text" id="swal-name" class="swal2-input" placeholder="Votre nom">
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'OUI',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        preConfirm: async () => {
          const email = (document.getElementById('swal-email') as HTMLInputElement).value;
          const name = (document.getElementById('swal-name') as HTMLInputElement).value;

          if (!email) {
            Swal.showValidationMessage('Veuillez entrer votre email');
            return false;
          }
          if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            Swal.showValidationMessage('Veuillez entrer un email valide');
            return false;
          }
          if (!name) {
            Swal.showValidationMessage('Veuillez entrer votre nom');
            return false;
          }
          // Vérifier si l'email a déjà été utilisé
          const emailExists = await this.firebaseService.checkIfEmailExists(email);
          if (emailExists) {
            Swal.showValidationMessage('Cet email a déjà voté. Vous ne pouvez pas voter à nouveau.');
            return false;
          }
          return { email, name };
        }
      }).then(async (result) => {
        if (result.isConfirmed && result.value) {
          const { email, name } = result.value;
          const region = this.questionnaireForm.get('section1.region')?.value;
          const commune = this.questionnaireForm.get('section1.commune')?.value;
          const moneyForVote = this.questionnaireForm.get('section4.moneyForVote')?.value;

          try {
            // Sauvegarde des données
            const docId = await this.firebaseService.saveResponse(email, formData);

            if (docId) {
              // // Génération du certificat
              // this.generateCertificate(name, this.totalScore);

              // // Génération des statistiques
              // await this.generateStatistics(region, commune, moneyGiven);

              // this.generateSummaryPdf(name);

              Swal.fire({
                title: 'Merci !',
                text: 'Votre questionnaire a été soumis avec succès. Les documents ont été générés.',
                icon: 'success',
                showCancelButton: false,
                showConfirmButton: false,
                allowOutsideClick: false,
                html: `
                  <button id="btn-price-average" class="swal2-confirm swal2-styled" style="background-color: #ffc107;">
                    <i class="fas fa-hand-holding-usd"></i> Voir le prix moyen des votes
                  </button>
                  <button id="btn-certificate" class="swal2-confirm swal2-styled">Générer le Certificat</button>
                  <button id="btn-statistics" class="swal2-confirm swal2-styled" style="background-color: #28a745;">Générer les Statistiques</button>
                  <button id="btn-summary" class="swal2-confirm swal2-styled" style="background-color: #17a2b8;">Générer vos réponses</button>
                  <button id="btn-share" class="swal2-confirm swal2-styled" style="background-color: #6c757d;">
                    <i class="fas fa-share-alt"></i> Partager à vos amis
                  </button>
                  <button id="btn-close" class="swal2-close" style="position: absolute; top: 10px; right: 10px; font-size: 24px;">×</button>
                `
              }).then(() => {

              });

              // Ajouter des écouteurs d'événements après l'affichage du Swal
              setTimeout(() => {
                document.getElementById("btn-certificate")?.addEventListener("click", () => {
                  this.generateCertificate(name, this.totalScore);
                });

                document.getElementById("btn-statistics")?.addEventListener("click", async () => {
                  await this.generateStatistics(region, commune, moneyForVote);
                });

                document.getElementById("btn-summary")?.addEventListener("click", () => {
                  this.generateSummaryPdf(name);
                });

                // Gestionnaire pour le bouton de partage
                document.getElementById('btn-share')?.addEventListener('click', function() {
                  // URL à partager (à adapter)
                  const shareUrl = window.location.href;
                  // Texte à partager
                  const shareText = "Regardez ce questionnaire que j'ai complété !";

                  // Si l'API Web Share est disponible (mobile principalement)
                  if (navigator.share) {
                    navigator.share({
                      title: 'Mon Questionnaire',
                      text: shareText,
                      url: shareUrl
                    }).catch(console.error);
                  } else {
                    // Fallback pour desktop - ouvrir une fenêtre avec les options de partage
                    Swal.fire({
                      title: 'Partager sur',
                      html: `
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" target="_blank" style="margin: 5px; color: #3b5998; font-size: 24px;">
                          <i class="fab fa-facebook"></i>
                        </a>
                        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}" target="_blank" style="margin: 5px; color: #1da1f2; font-size: 24px;">
                          <i class="fab fa-twitter"></i>
                        </a>
                        <a href="https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}" target="_blank" style="margin: 5px; color: #0077b5; font-size: 24px;">
                          <i class="fab fa-linkedin"></i>
                        </a>
                      `,
                      showConfirmButton: false,
                      showCloseButton: true
                    });
                  }
                });

                document.getElementById('btn-price-average')?.addEventListener('click', async () => {
                  if (!moneyForVote) {
                    Swal.fire({
                      title: 'Information',
                      text: 'Le prix moyen n\'est pas disponible car vous n\'avez pas indiqué de montant.',
                      icon: 'info'
                    }).then(() => {
                      this.modalShow(formData, name)
                    });
                    return;
                  }

                  try {
                    const stats = await this.firebaseService.getStatistics(region, commune);
                    const today = new Date().toLocaleDateString('fr-FR');
                    const averagePrice = stats.commune?.averageVotePrice
                      ? parseFloat(stats.commune.averageVotePrice).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })
                      : 'Non disponible';

                    Swal.fire({
                      title: `Prix moyen des votes à ${commune} au ${today}`,
                      html: `
                        <div style="text-align: center; padding: 1rem;">
                          <p style="font-size: 1.5rem; font-weight: bold; color: #1e40af;">
                            ${averagePrice} €
                          </p>
                          <p style="color: #6b7280; margin-top: 1rem;">
                            <i class="fas fa-info-circle"></i> Basé sur ${stats.commune?.participantsCount || 0} participant (s)
                          </p>
                        </div>
                      `,
                      icon: 'info',
                      confirmButtonText: 'Fermer'
                    }).then((res) =>{
                      this.modalShow(formData, name)
                    });
                  } catch (error) {
                    Swal.fire(
                      'Erreur',
                      `Impossible d'afficher la moyenne pour ${commune}`,
                      'error'
                    );
                  }
                });

                document.getElementById('btn-close')?.addEventListener('click', () => {
                  Swal.close();
                  window.location.href = '/';
                });
              }, 100);
            } else {
              throw new Error('Erreur lors de la sauvegarde');
            }
          } catch (error) {
            console.error('Erreur:', error);
            Swal.fire(
              'Erreur',
              'Une erreur est survenue lors de la soumission. Veuillez réessayer.',
              'error'
            );
          }
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

  async modalShow(formData: any, name: string) {
    // Supposons que nous avons déjà les données nécessaires
    const region = this.questionnaireForm.get('section1.region')?.value;
    const commune = this.questionnaireForm.get('section1.commune')?.value;
    const moneyForVote = this.questionnaireForm.get('section4.moneyForVote')?.value;

    // Afficher directement le modal avec les boutons
    Swal.fire({
      title: '',
      text: 'Votre questionnaire a été soumis avec succès. Les documents ont été générés.',
      icon: 'success',
      showCancelButton: false,
      showConfirmButton: false,
      allowOutsideClick: false,
      html: `
        <button id="btn-price-average" class="swal2-confirm swal2-styled" style="background-color: #ffc107;">
          <i class="fas fa-hand-holding-usd"></i> Voir le prix moyen des votes
        </button>
        <button id="btn-certificate" class="swal2-confirm swal2-styled">Générer le Certificat</button>
        <button id="btn-statistics" class="swal2-confirm swal2-styled" style="background-color: #28a745;">Générer les Statistiques</button>
        <button id="btn-summary" class="swal2-confirm swal2-styled" style="background-color: #17a2b8;">Générer vos réponses</button>
        <button id="btn-share" class="swal2-confirm swal2-styled" style="background-color: #6c757d;">
          <i class="fas fa-share-alt"></i> Partager à vos amis
        </button>
        <button id="btn-close" class="swal2-close" style="position: absolute; top: 10px; right: 10px; font-size: 24px;">×</button>
      `
    });

    // Ajouter les écouteurs d'événements immédiatement
    document.getElementById("btn-certificate")?.addEventListener("click", () => {
      this.generateCertificate(name, formData.totalScore);
    });

    document.getElementById("btn-statistics")?.addEventListener("click", async () => {
      await this.generateStatistics(region, commune, moneyForVote);
    });

    document.getElementById("btn-summary")?.addEventListener("click", () => {
      this.generateSummaryPdf(name);
    });

    document.getElementById('btn-share')?.addEventListener('click', () => {
      const shareUrl = window.location.href;
      const shareText = "Regardez ce questionnaire que j'ai complété !";

      if (navigator.share) {
        navigator.share({
          title: 'Mon Questionnaire',
          text: shareText,
          url: shareUrl
        }).catch(console.error);
      } else {
        Swal.fire({
          title: 'Partager sur',
          html: `
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" target="_blank" style="margin: 5px; color: #3b5998; font-size: 24px;">
              <i class="fab fa-facebook"></i>
            </a>
            <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}" target="_blank" style="margin: 5px; color: #1da1f2; font-size: 24px;">
              <i class="fab fa-twitter"></i>
            </a>
            <a href="https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}" target="_blank" style="margin: 5px; color: #0077b5; font-size: 24px;">
              <i class="fab fa-linkedin"></i>
            </a>
          `,
          showConfirmButton: false,
          showCloseButton: true
        });
      }
    });

    document.getElementById('btn-price-average')?.addEventListener('click', async () => {
      if (!moneyForVote) {
        Swal.fire({
          title: 'Information',
          text: 'Le prix moyen n\'est pas disponible car vous n\'avez pas indiqué de montant.',
          icon: 'info'
        }).then((res) =>{
          this.modalShow(formData, name)
        })
        return;
      }

      try {
        const stats = await this.firebaseService.getStatistics(region, commune);
        const today = new Date().toLocaleDateString('fr-FR');
        const averagePrice = stats.commune?.averageVotePrice
          ? parseFloat(stats.commune.averageVotePrice).toLocaleString('fr-FR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })
          : 'Non disponible';

        Swal.fire({
          title: `Prix moyen des votes à ${commune} au ${today}`,
          html: `
            <div style="text-align: center; padding: 1rem;">
              <p style="font-size: 1.5rem; font-weight: bold; color: #1e40af;">
                ${averagePrice} €
              </p>
              <p style="color: #6b7280; margin-top: 1rem;">
                <i class="fas fa-info-circle"></i> Basé sur ${stats.commune?.participantsCount || 0} participants
              </p>
            </div>
          `,
          icon: 'info',
          confirmButtonText: 'Fermer'
        }).then((res) =>{
          this.modalShow(formData, name)
        });
      } catch (error) {
        Swal.fire(
          'Erreur',
          `Impossible d'afficher la moyenne pour ${commune}`,
          'error'
        );
      }
    });

    document.getElementById('btn-close')?.addEventListener('click', () => {
      Swal.close();
      window.location.href = '/';
    });
  }
  async generateStatistics(region: string, commune: string, userAmount: string) {
    try {
      const stats = await this.firebaseService.getStatistics(region, commune);

      const doc = new jsPDF();

      // Titre
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`Statistiques pour ${commune}, ${region}`, 15, 20);

      // Section Prix du vote
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Prix du vote moyen', 15, 40);

      doc.setFont('helvetica', 'normal');
      doc.text(`- Votre commune (${commune}): ${stats.commune.averageVotePrice} €`, 20, 50);
      doc.text(`- Votre région (${region}): ${stats.region.averageVotePrice} €`, 20, 60);

      if (userAmount) {
        doc.text(`- Votre réponse: ${userAmount} €`, 20, 70);

        if (stats.commune.averageVotePrice !== 'N/A') {
          const diff = parseFloat(userAmount) - parseFloat(stats.commune.averageVotePrice);
          doc.text(`- Différence avec la moyenne communale: ${diff.toFixed(2)} €`, 20, 80);
        }
      }

      // Section Participation
      doc.setFont('helvetica', 'bold');
      doc.text('Participation', 15, 100);

      doc.setFont('helvetica', 'normal');
      doc.text(`- Participants dans votre commune: ${stats.commune.participantsCount}`, 20, 110);
      doc.text(`- Participants dans votre région: ${stats.region.participantsCount}`, 20, 120);

      // Section Scores
      doc.setFont('helvetica', 'bold');
      doc.text('Scores moyens', 15, 140);

      doc.setFont('helvetica', 'normal');
      doc.text(`- Score moyen dans votre commune: ${stats.commune.averageScore}/100`, 20, 150);
      doc.text(`- Score moyen dans votre région: ${stats.region.averageScore}/100`, 20, 160);
      doc.text(`- Votre score: ${this.totalScore}/100`, 20, 170);

      // Conseils
      doc.setFont('helvetica', 'bold');
      doc.text('Conseils', 15, 190);

      doc.setFont('helvetica', 'normal');
      doc.text('Plus vous êtes informé sur la corruption électorale,', 20, 200);
      doc.text('plus vous pouvez contribuer à des élections libres et transparentes.', 20, 210);

      // Sauvegarde du PDF
      doc.save(`statistiques_${commune.replace(/ /g, '_')}.pdf`);

    } catch (error) {
      console.error('Erreur lors de la génération des statistiques:', error);
      Swal.fire(
        'Erreur',
        'Impossible de générer les statistiques pour le moment.',
        'error'
      );
    }
  }

  generateCertificate(name: string, score: number) {
    const doc = new jsPDF('landscape');

    // Style du certificat
    doc.setDrawColor(0);
    doc.setLineWidth(1);
    doc.rect(10, 10, 280, 190);

    // Logo
    const img = new Image();
    img.src = 'assets/vote.png';
    img.onload = () => {
      doc.addImage(img, 'PNG', 20, 20, 30, 30);

      // Informations région/commune
      const region = this.questionnaireForm.get('section1.region')?.value;
      const commune = this.questionnaireForm.get('section1.commune')?.value;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Région : ${region}`, 260, 25, { align: 'right' });
      doc.text(`Commune : ${commune}`, 260, 35, { align: 'right' });

      // Titre
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(score >= 60 ? 'Certificat de Réussite' : 'Certificat de Participation', 105, 60, { align: 'center' });

      // Sous-titre
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Questionnaire sur la sensibilisation à la corruption électorale', 105, 75, { align: 'center' });

      // Numéro de certificat
      doc.setFontSize(12);
      const certificateNumber = `#CORR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
      doc.text(`Numéro de certificat : ${certificateNumber}`, 20, 100);

      // Message selon le score
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      if (score >= 60) {
        doc.text('Félicitations !', 20, 120);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Vous avez démontré une excellente compréhension des enjeux liés à la corruption électorale.', 20, 130);
        doc.text('Votre engagement est essentiel pour préserver la démocratie et l\'intégrité des élections.', 20, 140);
      } else if (score >= 55 && score <= 59) {
        doc.text('Bon travail !', 20, 120);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Vous avez une bonne compréhension des enjeux, mais il reste des aspects à approfondir.', 20, 130);
        doc.text('Nous vous encourageons à continuer à vous informer sur le sujet.', 20, 140);
      } else {
        doc.text('Merci pour votre participation !', 20, 120);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Votre score indique que vous pourriez bénéficier de plus d\'informations sur la corruption électorale.', 20, 130);
        doc.text('Nous vous encourageons à consulter nos ressources éducatives.', 20, 140);
      }

      // Ajout de la phrase demandée
      doc.text('N\'hésitez pas à prendre contact avec nous pour participer à des actions de sensibilisation ou pour plus d\'informations.', 20, 155);

      // Informations participant
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Nom du participant : ${name}`, 20, 170);
      doc.text(`Score obtenu : ${score} / 100`, 20, 180);
      doc.text(`Date de délivrance : ${new Date().toLocaleDateString('fr-FR')}`, 20, 190);

      // Sauvegarde du PDF
      doc.save(`certificat_${name.replace(/ /g, '_')}.pdf`);
    };
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
    const formValues = this.questionnaireForm.value;
    const shouldSkipSections4And5 = this.shouldSkipSections4And5();

    // Section 1: Informations démographiques (pas de points)
    // Juste une validation, pas de calcul de score
    if (!this.questionnaireForm.get('section1')?.valid) {
        console.warn("Section 1 non valide");
    }

    // Section 2: Connaissances sur la corruption
    if (this.questionnaireForm.get('section2')?.valid) {
        // Types de corruption (multi-sélection)
        formValues.section2.corruptionTypes?.forEach((val: string) => {
            const option = this.corruptionOptions.find(o => o.value === val);
            if (option) score += option.points;
        });

        // Problème de corruption électorale
        switch (formValues.section2.electoralCorruptionProblem) {
            case 'Oui': score += 3; break;
            case 'Ne sais pas': score += 1; break;
        }

        // Connaissance des lois
        switch (formValues.section2.knowledgeAboutLaws) {
            case 'Très informé': score += 5; break;
            case 'Un peu informé': score += 3; break;
        }
    }

    // Section 3: Expériences personnelles
    if (this.questionnaireForm.get('section3')?.valid) {
        // Expérience de corruption
        switch (formValues.section3.corruptionExperience) {
            case 'Non': score += 5; break;
            case 'Ne pas répondre': score += 2; break;
        }

        // Incitation à voter
        switch (formValues.section3.voteIncentive) {
            case 'Non': score += 5; break;
            case 'Je préfère ne pas répondre': score += 2; break;
        }

        // Pression pour voter
        switch (formValues.section3.votingPressure) {
            case 'Non': score += 5; break;
            case 'Je préfère ne pas répondre': score += 2; break;
        }
    }

    // Section 4: Questions spécifiques (uniquement si non sautée)
    if (!shouldSkipSections4And5 && this.questionnaireForm.get('section4')?.valid) {
        // Vente de vote
        switch (formValues.section4.sellVote) {
            case 'Non': score += 5; break;
            case 'Je ne sais pas': score += 1; break;
            case 'Oui': score -= 20; break; // Pénalité importante
        }

        // Personnes corruptrices (2 points par réponse)
        if (formValues.section4.corruptPersons) {
            score += formValues.section4.corruptPersons.length * 2;
        }
    }

    // Section 5: Alternatives à la corruption (uniquement si non sautée)
    if (!shouldSkipSections4And5 && this.questionnaireForm.get('section5')?.valid) {
        // Alternatives choisies
        formValues.section5.alternativeOptions?.forEach((val: string) => {
            const option = this.alternativeOptions.find(o => o.value === val);
            if (option) score += option.points;
        });

        // Besoin d'aide
        switch (formValues.section5.needHelp) {
            case 'Oui': score += 5; break;
            case 'Je ne sais pas': score += 1; break;
        }

        // Refus de corruption
        switch (formValues.section5.willingToRefuseCorruption) {
            case 'Oui': score += 5; break;
            case 'Je ne sais pas': score += 1; break;
        }
    }

    // Section 6: Sensibilisation des abstentionnistes
    if (this.questionnaireForm.get('section6')?.valid) {
        // Intention de voter
        switch (formValues.section6.intentionVoter) {
            case 'Oui': score += 5; break;
            case 'Je ne sais pas': score += 1; break;
        }

        // Raisons de non-vote
        formValues.section6.nonVoteReasons?.forEach((val: string) => {
            const option = this.nonVoteReasons.find(o => o.value === val);
            if (option) score += option.points;
        });

        // Impact de la corruption
        switch (formValues.section6.impactCorruption) {
            case 'Oui': score += 5; break;
            case 'Je ne sais pas': score += 1; break;
        }

        // Actions pour encourager le vote
        formValues.section6.encourageVoteOptions?.forEach((val: string) => {
            const option = this.encourageVoteOptions.find(o => o.value === val);
            if (option) score += option.points;
        });

        // Impacts spécifiques (2 points par impact)
        if (formValues.section6.impactOptions) {
            score += formValues.section6.impactOptions.length * 2;
        }
    }

    // Section 7: Évaluation du questionnaire
    if (this.questionnaireForm.get('section7')?.valid) {
        // Utilité du questionnaire
        switch (formValues.section7.questionnaireHelpful) {
            case 'Oui': score += 2; break;
            case 'Un peu': score += 1; break;
        }

        // Intention de vote libre
        switch (formValues.section7.intentionVoteLibre) {
            case 'Oui': score += 5; break;
            case 'Je ne sais pas': score += 1; break;
        }

        // Type de candidature
        switch (formValues.section7.candidatureType) {
            case 'Tête de liste': score += 5; break;
            case 'Colistier ou colistière': score += 3; break;
            case 'Je ne sais pas': score += 1; break;
        }
    }

    // Garantir un score minimum de 0
    this.totalScore = Math.max(0, score);
    return this.totalScore;
}

  generateSummaryPdf(name: string) {
    const doc = new jsPDF();

    // Configuration de base
    const margin = 15;
    let yPosition = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height - margin;

    // Style du titre
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Récapitulatif de vos réponses', margin, yPosition);
    yPosition += lineHeight * 2;

    // Informations personnelles
    doc.setFontSize(14);
    doc.text('Informations personnelles', margin, yPosition);
    yPosition += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const section1 = this.questionnaireForm.get('section1')?.value;
    doc.text(`- Âge: ${section1.age || 'Non spécifié'}`, margin + 5, yPosition);
    yPosition += lineHeight;
    doc.text(`- Genre: ${section1.gender || 'Non spécifié'}`, margin + 5, yPosition);
    yPosition += lineHeight;
    doc.text(`- Région: ${section1.region || 'Non spécifié'}`, margin + 5, yPosition);
    yPosition += lineHeight;
    doc.text(`- Commune: ${section1.commune || 'Non spécifié'}`, margin + 5, yPosition);
    yPosition += lineHeight * 2;

    // Vérification de la position pour saut de page
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }

    // Section 2 - Connaissances
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Section 2: Connaissances sur la corruption', margin, yPosition);
    yPosition += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const section2 = this.questionnaireForm.get('section2')?.value;

    // Types de corruption
    const corruptionTypes = this.corruptionTypesArray.value.map((val: any) => {
      const option = this.corruptionOptions.find(o => o.value === val);
      return option ? option.label : val;
    });

    doc.text('- Types de corruption identifiés:', margin + 5, yPosition);
    yPosition += lineHeight;

    corruptionTypes.forEach((type: any) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(`  • ${type}`, margin + 10, yPosition);
      yPosition += lineHeight;
    });

    if (section2.otherCorruptionDescription) {
      doc.text(`  • Autre: ${section2.otherCorruptionDescription}`, margin + 10, yPosition);
      yPosition += lineHeight;
    }

    doc.text(`- Problème de corruption: ${section2.electoralCorruptionProblem || 'Non spécifié'}`, margin + 5, yPosition);
    yPosition += lineHeight;
    doc.text(`- Connaissance des lois: ${section2.knowledgeAboutLaws || 'Non spécifié'}`, margin + 5, yPosition);
    yPosition += lineHeight * 2;

    // Vérification de la position pour saut de page
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }

    // Section 3 - Expériences
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Section 3: Expériences personnelles', margin, yPosition);
    yPosition += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const section3 = this.questionnaireForm.get('section3')?.value;

    doc.text(`- Expérience de corruption: ${section3.corruptionExperience || 'Non spécifié'}`, margin + 5, yPosition);
    yPosition += lineHeight;

    if (section3.corruptionDescription) {
      const descriptionLines = doc.splitTextToSize(section3.corruptionDescription, 180);
      doc.text('- Description:', margin + 5, yPosition);
      yPosition += lineHeight;

      descriptionLines.forEach((line: string) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(`  ${line}`, margin + 10, yPosition);
        yPosition += lineHeight;
      });
    }

    doc.text(`- Incitation à voter: ${section3.voteIncentive || 'Non spécifié'}`, margin + 5, yPosition);
    yPosition += lineHeight;
    doc.text(`- Pression pour voter: ${section3.votingPressure || 'Non spécifié'}`, margin + 5, yPosition);
    yPosition += lineHeight * 2;

    // Vérification de la position pour saut de page
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }

    // Section 4 - Questions spécifiques (uniquement si affichée)
    if (this.questionnaireForm.get('section4.sellVote')?.value) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Section 4: Questions spécifiques', margin, yPosition);
      yPosition += lineHeight;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      const section4 = this.questionnaireForm.get('section4')?.value;

      if (section4.moneyGivenAmount) {
        doc.text(`- Montant reçu/proposé: ${section4.moneyGivenAmount}`, margin + 5, yPosition);
        yPosition += lineHeight;
      }

      doc.text(`- Vente de vote: ${section4.sellVote || 'Non spécifié'}`, margin + 5, yPosition);
      yPosition += lineHeight;

      if (section4.moneyForVote) {
        doc.text(`- Montant demandé pour vote: ${section4.moneyForVote}`, margin + 5, yPosition);
        yPosition += lineHeight;
      }

      // Personnes corruptrices
      if (this.corruptPersonsArray.value.length > 0) {
        doc.text('- Personnes ayant tenté de vous corrompre:', margin + 5, yPosition);
        yPosition += lineHeight;

        this.corruptPersonsArray.value.forEach((person: string) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(`  • ${person}`, margin + 10, yPosition);
          yPosition += lineHeight;
        });

        if (section4.otherCorruptPerson) {
          doc.text(`  • Autre: ${section4.otherCorruptPerson}`, margin + 10, yPosition);
          yPosition += lineHeight;
        }
      }
      yPosition += lineHeight;
    }

    // Vérification de la position pour saut de page
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }

    // Section 5 - Alternatives (uniquement si affichée)
    if (this.questionnaireForm.get('section5.alternativeOptions')?.value.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Section 5: Alternatives à la corruption', margin, yPosition);
      yPosition += lineHeight;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      const section5 = this.questionnaireForm.get('section5')?.value;

      if (this.alternativeOptionsArray.value.length > 0) {
        doc.text('- Alternatives choisies:', margin + 5, yPosition);
        yPosition += lineHeight;

        this.alternativeOptionsArray.value.forEach((option: string) => {
          const opt = this.alternativeOptions.find(o => o.value === option);
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(`  • ${opt?.label || option}`, margin + 10, yPosition);
          yPosition += lineHeight;
        });

        if (section5.alternativeOptionsDescription) {
          doc.text(`  • Autre: ${section5.alternativeOptionsDescription}`, margin + 10, yPosition);
          yPosition += lineHeight;
        }
      }

      doc.text(`- Besoin d'aide: ${section5.needHelp || 'Non spécifié'}`, margin + 5, yPosition);
      yPosition += lineHeight;
      doc.text(`- Refus de corruption: ${section5.willingToRefuseCorruption || 'Non spécifié'}`, margin + 5, yPosition);
      yPosition += lineHeight * 2;
    }

    // Vérification de la position pour saut de page
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }

    // Section 6 - Sensibilisation
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Section 6: Sensibilisation', margin, yPosition);
    yPosition += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const section6 = this.questionnaireForm.get('section6')?.value;

    doc.text(`- Intention de voter: ${section6.intentionVoter || 'Non spécifié'}`, margin + 5, yPosition);
    yPosition += lineHeight;

    if (this.nonVoteReasonsArray.value.length > 0) {
      doc.text('- Raisons de non-vote:', margin + 5, yPosition);
      yPosition += lineHeight;

      this.nonVoteReasonsArray.value.forEach((reason: string) => {
        const opt = this.nonVoteReasons.find(o => o.value === reason);
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(`  • ${opt?.label || reason}`, margin + 10, yPosition);
        yPosition += lineHeight;
      });

      if (section6.otherNonVoteReason) {
        doc.text(`  • Autre: ${section6.otherNonVoteReason}`, margin + 10, yPosition);
        yPosition += lineHeight;
      }
    }

    doc.text(`- Impact de la corruption: ${section6.impactCorruption || 'Non spécifié'}`, margin + 5, yPosition);
    yPosition += lineHeight;

    // Impacts de la corruption (si affichés)
    if (this.impactOptionsArray.value.length > 0) {
      doc.text('- Impacts identifiés:', margin + 5, yPosition);
      yPosition += lineHeight;

      this.impactOptionsArray.value.forEach((impact: string) => {
        const opt = this.impactOptions.find(o => o.value === impact);
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(`  • ${opt?.label || impact}`, margin + 10, yPosition);
        yPosition += lineHeight;
      });

      if (section6.otherImpactDescription) {
        doc.text(`  • Autre: ${section6.otherImpactDescription}`, margin + 10, yPosition);
        yPosition += lineHeight;
      }
    }

    if (this.encourageVoteOptionsArray.value.length > 0) {
      doc.text('- Actions pour encourager le vote libre:', margin + 5, yPosition);
      yPosition += lineHeight;

      this.encourageVoteOptionsArray.value.forEach((option: string) => {
        const opt = this.encourageVoteOptions.find(o => o.value === option);
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(`  • ${opt?.label || option}`, margin + 10, yPosition);
        yPosition += lineHeight;
      });

      if (section6.autreEncouragerVoteLibre) {
        doc.text(`  • Autre: ${section6.autreEncouragerVoteLibre}`, margin + 10, yPosition);
        yPosition += lineHeight;
      }
    }
    yPosition += lineHeight;

    // Vérification de la position pour saut de page
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }

    // Section 7 - Évaluation
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Section 7: Évaluation du questionnaire', margin, yPosition);
    yPosition += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const section7 = this.questionnaireForm.get('section7')?.value;

    doc.text(`- Questionnaire utile: ${section7.questionnaireHelpful || 'Non spécifié'}`, margin + 5, yPosition);
    yPosition += lineHeight;
    doc.text(`- Intention de vote libre: ${section7.intentionVoteLibre || 'Non spécifié'}`, margin + 5, yPosition);
    yPosition += lineHeight;
    doc.text(`- Type de candidature: ${section7.candidatureType || 'Non spécifié'}`, margin + 5, yPosition);
    yPosition += lineHeight;

    if (section7.needHelpForCandidature) {
      doc.text(`- Besoin d'aide pour candidature: ${section7.needHelpForCandidature}`, margin + 5, yPosition);
      yPosition += lineHeight;
    }

    // Score total
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Score total: ${this.totalScore}/${this.maxPossibleScore}`, margin, yPosition + 10);

    // Pied de page
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Généré le ' + new Date().toLocaleDateString('fr-FR'), margin, doc.internal.pageSize.height - 10);

    // Sauvegarde du PDF
    doc.save(`recapitulatif_${name.replace(/ /g, '_')}.pdf`);
  }
}