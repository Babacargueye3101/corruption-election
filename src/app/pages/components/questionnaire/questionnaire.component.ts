import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';
import { FirebaseService } from '../../../services/firebase.service';
@Component({
  selector: 'app-questionnaire',
  imports: [ReactiveFormsModule, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.scss'
})
export class QuestionnaireComponent implements OnInit{
  questionnaireForm: FormGroup;
  currentSection: number = 1;
  totalScore: number = 0;

  regions: any[] = [];
  communes: string[] = [];

  constructor(private fb: FormBuilder, private http: HttpClient, private firebaseService: FirebaseService) {
    this.questionnaireForm = this.fb.group({
      section1: this.fb.group({
        age: ['', Validators.required],
        gender: ['', Validators.required],
        region: ['', Validators.required],
        commune: ['', Validators.required]
      }),
      section2: this.fb.group({
        corruptionType: ['', Validators.required],
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
        corruptPerson: [''],
        otherCorruptPerson: ['']
      }),
      section5: this.fb.group({
        alternativeOptions: ['', Validators.required],
        alternativeOptionsDescription: [''],
        needHelp: ['', Validators.required],
        willingToRefuseCorruption: ['', Validators.required]
      }),
      section6: this.fb.group({
        intentionVoter: ['', Validators.required],
        raisonsNonVoter: [''],
        autreRaisonNonVoter: [''],
        aideObstaclesPratiques: [''],
        impactCorruption: ['', Validators.required],
        impactsCorruptionDetails: [''],
        autreImpactCorruption: [''],
        encouragerVoteLibre: [''],
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

  ngOnInit(): void {
    this.loadRegions();
  }

  loadRegions() {
    this.http.get('assets/regions-communes.json').subscribe((data: any) => {
      this.regions = data.regions;
    });
  }

  onRegionChange(event: Event) {
    const target = event.target as HTMLSelectElement; // Indique à TypeScript que c'est un <select>
    const regionName = target.value; // Récupère la valeur sélectionnée
    const selectedRegion = this.regions.find(region => region.nom === regionName);
    this.communes = selectedRegion ? selectedRegion.communes : [];
  }


  nextSection() {
    if (this.currentSection < 7) {
      this.currentSection++;
    }
  }

  previousSection() {
    if (this.currentSection > 1) {
      this.currentSection--;
    }
  }

  onSubmit() {
    this.calculateScore();
    const formData = this.questionnaireForm.value;
    formData.totalScore = this.totalScore;

    // Afficher une boîte de dialogue de confirmation avec champ email
    Swal.fire({
      title: 'Confirmation',
      html: `
        <p>Êtes-vous sûr d'avoir bien  répondu aux différentes questions ?</p>
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
        const email = result.value; // Récupère l'email validé
        const name = 'Jimmy David'; // Remplacez par le nom du participant

        // Sauvegarder les données avec l'email comme clé Firebase
        this.saveToFirebase(email, formData);

        if (this.totalScore >= 50) {
          this.generateCertificate(name, this.totalScore);
        } else {
          this.generateCertificate(name, this.totalScore);
        }
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire('Annulé', 'Vous pouvez revenir plus tard pour compléter le questionnaire.', 'info');
      }
    });
  }

  // Méthode pour sauvegarder dans Firebase
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

    // Section 2 : Connaissances sur la corruption électorale
    const corruptionType = this.questionnaireForm.get('section2.corruptionType')?.value;
    if (corruptionType === 'voteBuying' || corruptionType === 'resultFalsification' || corruptionType === 'voterIntimidation' || corruptionType === 'abuseOfPublicResources' || corruptionType === 'renovationOfVotersHouses' || corruptionType === 'fuelExpenses' || corruptionType === 'jobPromise' || corruptionType === 'subsidyToAssociations' || corruptionType === 'contractWithCollectivity') {
      score += 2;
    } else if (corruptionType === 'otherCorruption') {
      score += 1;
    }

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

    // Section 3 : Expériences personnelles
    const corruptionExperience = this.questionnaireForm.get('section3.corruptionExperience')?.value;
    if (corruptionExperience === 'Oui') {
      score += 0;
    } else if (corruptionExperience === 'Non') {
      score += 5;
    } else if (corruptionExperience === 'Ne pas répondre') {
      score += 2;
    }

    const voteIncentive = this.questionnaireForm.get('section3.voteIncentive')?.value;
    if (voteIncentive === 'Oui') {
      score += 0;
    } else if (voteIncentive === 'Non') {
      score += 5;
    } else if (voteIncentive === 'Ne pas répondre') {
      score += 2;
    }

    const votingPressure = this.questionnaireForm.get('section3.votingPressure')?.value;
    if (votingPressure === 'Oui') {
      score += 0;
    } else if (votingPressure === 'Non') {
      score += 5;
    } else if (votingPressure === 'Ne pas répondre') {
      score += 2;
    }

    // Section 4 : Question spécifique pour les personnes à faible score (corrompus)
    const sellVote = this.questionnaireForm.get('section4.sellVote')?.value;
    if (sellVote === 'Oui') {
      score += 0;
    } else if (sellVote === 'Non') {
      score += 5;
    } else if (sellVote === 'Je ne sais pas') {
      score += 1;
    }

    // Section 5 : Alternatives à la corruption
    const alternativeOptions = this.questionnaireForm.get('section5.alternativeOptions')?.value;
    if (alternativeOptions === 'Chercher un emploi ou une formation professionnelle' || alternativeOptions === 'Participer à des programmes d’aide sociale' || alternativeOptions === 'Refuser les offres et signaler la corruption') {
      score += 2;
    }

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

    // Section 6 : Sensibilisation des abstentionnistes
    const intentionVoter = this.questionnaireForm.get('section6.intentionVoter')?.value;
    if (intentionVoter === 'Oui') {
      score += 5;
    } else if (intentionVoter === 'Je ne sais pas') {
      score += 1;
    }

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

    const encouragerVoteLibre = this.questionnaireForm.get('section6.encouragerVoteLibre')?.value;
    if (encouragerVoteLibre === 'Sensibiliser votre entourage' || encouragerVoteLibre === 'Participer à des initiatives de surveillance électorale' || encouragerVoteLibre === 'Voter en toute conscience, sans pression') {
      score += 2;
    }

    // Section 7 : Évaluation du questionnaire
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


  // generateCertificate(name: string, score: number) {
  //   const doc = new jsPDF('landscape'); // Mode paysage pour plus d'espace

  //   // Ajouter une bordure sur la première page
  //   doc.setDrawColor(0); // Couleur de la bordure (noir)
  //   doc.setLineWidth(1); // Épaisseur de la bordure
  //   doc.rect(10, 10, 280, 190); // Rectangle pour la bordure

  //   // Ajouter le logo
  //   const img = new Image();
  //   img.src = 'assets/vote.png'; // Chemin vers votre logo
  //   img.onload = () => {
  //     doc.addImage(img, 'PNG', 20, 20, 30, 30); // Logo plus petit (30x30)

  //     // Récupérer la région et la commune depuis le formulaire
  //     const region = this.questionnaireForm.get('section1.region')?.value;
  //     const commune = this.questionnaireForm.get('section1.commune')?.value;

  //     // Ajouter la région et la commune à droite
  //     doc.setFontSize(12); // Taille réduite
  //     doc.setFont('helvetica', 'bold');
  //     doc.text(`Région : ${region}`, 260, 25, { align: 'right' }); // Position à droite
  //     doc.text(`Commune : ${commune}`, 260, 35, { align: 'right' }); // Position à droite

  //     // Ajouter le nom du site
  //     doc.setFontSize(16); // Taille réduite
  //     doc.setFont('helvetica', 'bold');
  //     doc.text('Nom du Site', 60, 40); // Ajuster la position

  //     // Titre du certificat
  //     doc.setFontSize(24); // Taille réduite
  //     doc.setFont('helvetica', 'bold');
  //     doc.text('Certificat de Réussite', 105, 60, { align: 'center' });

  //     // Sous-titre
  //     doc.setFontSize(16); // Taille réduite
  //     doc.setFont('helvetica', 'normal');
  //     doc.text('Questionnaire sur la sensibilisation à la corruption électorale', 105, 75, { align: 'center' });

  //     // Numéro de certificat
  //     doc.setFontSize(12); // Taille réduite
  //     const certificateNumber = `#CORR-2023-${Math.floor(Math.random() * 10000)}`; // Génère un numéro aléatoire
  //     doc.text(`Numéro de certificat : ${certificateNumber}`, 20, 100);

  //     // Félicitations
  //     doc.setFontSize(14); // Taille réduite
  //     doc.setFont('helvetica', 'bold');
  //     doc.text('Félicitations !', 20, 120);
  //     doc.setFontSize(12); // Taille réduite
  //     doc.setFont('helvetica', 'normal');
  //     doc.text('Nous avons le plaisir de vous décerner ce Certificat de Réussite pour avoir démontré une', 20, 130);
  //     doc.text('compréhension approfondie des enjeux liés à la corruption électorale et pour votre', 20, 140);
  //     doc.text('engagement en faveur de la transparence et de l\'intégrité dans les processus démocratiques.', 20, 150);

  //     // Informations du participant
  //     doc.setFontSize(14); // Taille réduite
  //     doc.setFont('helvetica', 'bold');
  //     doc.text(`Nom du participant : ${name}`, 20, 170);
  //     doc.text(`Score obtenu : ${score} / 97`, 20, 180);
  //     doc.text(`Date de délivrance : ${new Date().toLocaleDateString()}`, 20, 190);

  //     // Ajouter une deuxième page
  //     doc.addPage();

  //     // Ajouter une bordure sur la deuxième page
  //     doc.setDrawColor(0); // Couleur de la bordure (noir)
  //     doc.setLineWidth(1); // Épaisseur de la bordure
  //     doc.rect(10, 10, 280, 190); // Rectangle pour la bordure

  //     // Message d'engagement (sur la deuxième page)
  //     doc.setFontSize(12); // Taille réduite
  //     doc.setFont('helvetica', 'normal');
  //     doc.text('En obtenant plus de 45 points à ce questionnaire, vous avez prouvé votre sensibilisation', 20, 20);
  //     doc.text('aux défis posés par la corruption électorale et votre volonté de contribuer à une', 20, 30);
  //     doc.text('démocratie plus juste et équitable. Votre engagement est essentiel pour préserver la', 20, 40);
  //     doc.text('confiance des citoyens dans les institutions et pour garantir des élections libres et', 20, 50);
  //     doc.text('transparentes.', 20, 60);

  //     // Signature (sur la deuxième page)
  //     doc.setFontSize(14); // Taille réduite
  //     doc.setFont('helvetica', 'bold');
  //     doc.text('Ce certificat symbolise votre rôle actif dans la lutte contre la corruption', 20, 80);
  //     doc.text('et votre contribution à un avenir démocratique plus solide.', 20, 90);

  //     // Enregistrer le PDF
  //     doc.save(`certificat_${name.replace(/ /g, '_')}.pdf`);
  //   };
  // }

  generateCertificate(name: string, score: number) {
    const doc = new jsPDF('landscape'); // Mode paysage pour plus d'espace

    // Ajouter une bordure
    doc.setDrawColor(0); // Couleur de la bordure (noir)
    doc.setLineWidth(1); // Épaisseur de la bordure
    doc.rect(10, 10, 280, 190); // Rectangle pour la bordure

    // Ajouter le logo
    const img = new Image();
    img.src = 'assets/vote.png'; // Chemin vers votre logo
    img.onload = () => {
      doc.addImage(img, 'PNG', 20, 20, 30, 30); // Logo plus petit (30x30)

      // Récupérer la région et la commune depuis le formulaire
      const region = this.questionnaireForm.get('section1.region')?.value;
      const commune = this.questionnaireForm.get('section1.commune')?.value;

      // Ajouter la région et la commune à droite
      doc.setFontSize(12); // Taille réduite
      doc.setFont('helvetica', 'bold');
      doc.text(`Région : ${region}`, 260, 25, { align: 'right' }); // Position à droite
      doc.text(`Commune : ${commune}`, 260, 35, { align: 'right' }); // Position à droite

      // Titre du certificat
      doc.setFontSize(24); // Taille réduite
      doc.setFont('helvetica', 'bold');
      doc.text(score >= 45 ? 'Certificat de Réussite' : 'Certificat d\'Échec', 105, 60, { align: 'center' });

      // Sous-titre
      doc.setFontSize(16); // Taille réduite
      doc.setFont('helvetica', 'normal');
      doc.text('Questionnaire sur la sensibilisation à la corruption électorale', 105, 75, { align: 'center' });

      // Numéro de certificat
      doc.setFontSize(12); // Taille réduite
      const certificateNumber = `#CORR-2023-${Math.floor(Math.random() * 10000)}`; // Génère un numéro aléatoire
      doc.text(`Numéro de certificat : ${certificateNumber}`, 20, 100);

      // Félicitations ou message d'échec
      doc.setFontSize(14); // Taille réduite
      doc.setFont('helvetica', 'bold');
      if (score >= 45) {
        doc.text('Félicitations !', 20, 120);
        doc.setFontSize(12); // Taille réduite
        doc.setFont('helvetica', 'normal');
        doc.text('Vous avez démontré une compréhension approfondie des enjeux liés à la corruption électorale.', 20, 130);
        doc.text('Votre engagement est essentiel pour préserver la transparence et l\'intégrité dans les processus démocratiques.', 20, 140);
      } else {
        doc.text('Nous vous remercions pour votre participation.', 20, 120);
        doc.setFontSize(12); // Taille réduite
        doc.setFont('helvetica', 'normal');
        doc.text('Votre score indique que vous avez besoin de plus d\'informations et de sensibilisation sur la corruption électorale.', 20, 130);
        doc.text('Nous vous encourageons à vous renseigner davantage pour contribuer à une démocratie plus juste et équitable.', 20, 140);
      }

      // Informations du participant
      doc.setFontSize(14); // Taille réduite
      doc.setFont('helvetica', 'bold');
      doc.text(`Nom du participant : ${name}`, 20, 170);
      doc.text(`Score obtenu : ${score} / 97`, 20, 180);
      doc.text(`Date de délivrance : ${new Date().toLocaleDateString()}`, 20, 190);

      // Enregistrer le PDF
      doc.save(`certificat_${name.replace(/ /g, '_')}.pdf`);
    };
  }
}
