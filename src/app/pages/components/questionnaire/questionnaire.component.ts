import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { jsPDF } from 'jspdf';
@Component({
  selector: 'app-questionnaire',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './questionnaire.component.html',
  styleUrl: './questionnaire.component.scss'
})
export class QuestionnaireComponent implements OnInit{
  questionnaireForm: FormGroup;
  currentSection: number = 1;
  totalScore: number = 0;

  constructor(private fb: FormBuilder) {
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

  ngOnInit(): void {}

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
    console.log('Score final:', this.totalScore);

    if (this.totalScore >= 50) {
      const name = 'Nom Prénom'; // Remplacez par le nom du participant
      this.generateCertificate(name, this.totalScore);
    }
    // Envoyer les données au serveur ou afficher un message de succès
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


  generateCertificate(name: string, score: number) {
    const doc = new jsPDF();

    // Titre du certificat
    doc.setFontSize(22);
    doc.text('Certificat de Réussite au questionnaire sur la sensibilisation à la corruption électorale', 10, 20, { align: 'center' });

    // Numéro de certificat
    doc.setFontSize(14);
    const certificateNumber = `#CORR-2023-${Math.floor(Math.random() * 10000)}`; // Génère un numéro aléatoire
    doc.text(`Numéro de certificat : ${certificateNumber}`, 10, 40);

    // Félicitations
    doc.setFontSize(16);
    doc.text('Félicitations !', 10, 60);
    doc.setFontSize(14);
    doc.text('Nous avons le plaisir de vous décerner ce Certificat de Réussite pour avoir démontré une', 10, 70);
    doc.text('compréhension approfondie des enjeux liés à la corruption électorale et pour votre', 10, 80);
    doc.text('engagement en faveur de la transparence et de l\'intégrité dans les processus démocratiques.', 10, 90);

    // Informations du participant
    doc.setFontSize(16);
    doc.text(`Nom du participant : ${name}`, 10, 110);
    doc.text(`Score obtenu : ${score} / 97`, 10, 120);
    doc.text(`Date de délivrance : ${new Date().toLocaleDateString()}`, 10, 130);

    // Message d'engagement
    doc.setFontSize(14);
    doc.text('En obtenant plus de 45 points à ce questionnaire, vous avez prouvé votre sensibilisation', 10, 150);
    doc.text('aux défis posés par la corruption électorale et votre volonté de contribuer à une', 10, 160);
    doc.text('démocratie plus juste et équitable. Votre engagement est essentiel pour préserver la', 10, 170);
    doc.text('confiance des citoyens dans les institutions et pour garantir des élections libres et', 10, 180);
    doc.text('transparentes.', 10, 190);

    // Signature
    doc.setFontSize(16);
    doc.text('Ce certificat symbolise votre rôle actif dans la lutte contre la corruption', 10, 210);
    doc.text('et votre contribution à un avenir démocratique plus solide.', 10, 220);

    // Enregistrer le PDF
    doc.save(`certificat_${name.replace(/ /g, '_')}.pdf`);
  }
}
