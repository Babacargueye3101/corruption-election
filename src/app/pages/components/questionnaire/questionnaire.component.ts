import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

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
        voteBuying: [false],
        resultFalsification: [false],
        voterIntimidation: [false],
        abuseOfPublicResources: [false],
        renovationOfVotersHouses: [false],
        fuelExpenses: [false],
        jobPromise: [false],
        subsidyToAssociations: [false],
        contractWithCollectivity: [false],
        otherCorruption: [false],
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
        corruptPersonMayor: [false],
        corruptPersonMayorFriend: [false],
        corruptPersonFamily: [false],
        corruptPersonCandidate: [false],
        corruptPersonFriend: [false],
        corruptPersonOther: [false],
        otherCorruptPerson: ['']
      }),
      section5: this.fb.group({
        alternativeOptions: this.fb.array([], Validators.required),
        needHelp: ['', Validators.required],
        willingToRefuseCorruption: ['', Validators.required]
      }),
      section6: this.fb.group({
        intentionVoter: this.fb.control('', Validators.required),
        raisonsNonVoter: this.fb.array([]),
        aideObstaclesPratiques: this.fb.control('', Validators.required),
        impactCorruption: this.fb.control('', Validators.required),
        impactsCorruptionDetails: this.fb.array([]),
        encouragerVoteLibre: this.fb.array([]),
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




  checkVisibilityOfSection4() {
    const section2Responses = this.questionnaireForm.get('section2')?.value;
    if (section2Responses.electoralCorruptionProblem === 'Oui' || section2Responses.knowledgeAboutLaws === 'Pas informé') {
      this.currentSection = 4; // Afficher la Section 4
    }
  }
  // Handle next section navigation
  nextSection() {
    if (this.currentSection < 7) {
      this.currentSection++;
    }
  }

  // Handle previous section navigation
  previousSection() {
    if (this.currentSection > 1) {
      this.currentSection--;
    }
  }

  // Submit the form
  onSubmit() {
    this.calculateScore();
    console.log('Score final:', this.totalScore);
    // Save the data or submit the form to a server
  }






  calculateScore() {
    // Section 3 : Expériences personnelles
    let score = 0;

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

    this.totalScore = score;

  // Ajouter les points pour les radiobuttons (réponses uniques)
  if (this.questionnaireForm.get('section2.voteBuying')?.value) {
    score += 2;
  }
  if (this.questionnaireForm.get('section2.resultFalsification')?.value) {
    score += 2;
  }
  if (this.questionnaireForm.get('section2.voterIntimidation')?.value) {
    score += 2;
  }
  if (this.questionnaireForm.get('section2.abuseOfPublicResources')?.value) {
    score += 2;
  }
  if (this.questionnaireForm.get('section2.renovationOfVotersHouses')?.value) {
    score += 2;
  }
  if (this.questionnaireForm.get('section2.fuelExpenses')?.value) {
    score += 2;
  }
  if (this.questionnaireForm.get('section2.jobPromise')?.value) {
    score += 2;
  }
  if (this.questionnaireForm.get('section2.subsidyToAssociations')?.value) {
    score += 2;
  }
  if (this.questionnaireForm.get('section2.contractWithCollectivity')?.value) {
    score += 2;
  }
  if (this.questionnaireForm.get('section2.otherCorruption')?.value) {
    score += 1;
  }

  const electoralCorruptionProblem = this.questionnaireForm.get('section2.electoralCorruptionProblem')?.value;
  if (electoralCorruptionProblem === 'Oui') {
    score += 3;
  } else if (electoralCorruptionProblem === 'Non') {
    score += 0;
  } else if (electoralCorruptionProblem === 'Ne sais pas') {
    score += 1;
  }

  const knowledgeAboutLaws = this.questionnaireForm.get('section2.knowledgeAboutLaws')?.value;
  if (knowledgeAboutLaws === 'Très informé') {
    score += 5;
  } else if (knowledgeAboutLaws === 'Un peu informé') {
    score += 3;
  } else if (knowledgeAboutLaws === 'Pas informé') {
    score += 0;
  }

  this.totalScore = score;
  }
}
