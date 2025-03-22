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

  questionnaireForm!: FormGroup;
  currentSection: number = 1; // Suivi de la section actuelle
  totalScore: number = 0;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    // Initialisation du formulaire avec la section 1
    this.questionnaireForm = this.fb.group({
      section1: this.fb.group({
        age: ['', Validators.required],
        gender: ['', Validators.required],
        region: ['', Validators.required],
        commune: ['', Validators.required]
      }),
      section2: this.fb.group({
        corruptionElectoral: this.fb.array([]),
        corruptionProblem: ['', Validators.required],
        informedAboutLaws: ['', Validators.required]
      }),
      section3: this.fb.group({
        // Ajoutez des contrôles pour la section 3 ici
      }),
      section4: this.fb.group({
        // Ajoutez des contrôles pour la section 4 ici
      }),
      section5: this.fb.group({
        // Ajoutez des contrôles pour la section 5 ici
      }),
      section6: this.fb.group({
        // Ajoutez des contrôles pour la section 6 ici
      }),
    });
  }

  // Get the corruption answers FormArray
  get corruptionElectoral(): FormArray {
    return this.questionnaireForm.get('section2.corruptionElectoral') as FormArray;
  }

  // Add checkbox form controls to the FormArray
  addCorruptionOption(option: string, points: number) {
    this.corruptionElectoral.push(this.fb.group({
      option: [option],
      points: [points, Validators.required]
    }));
  }

  // Add all options for corruption electoral question
  loadCorruptionOptions() {
    const options = [
      { option: 'Achat de votes', points: 2 },
      { option: 'Falsification des résultats', points: 2 },
      { option: 'Intimidation des électeurs', points: 2 },
      { option: 'Utilisation abusive des ressources publiques', points: 2 },
      { option: 'Rénovation de la maison des électeurs', points: 2 },
      { option: 'Prise en charge de frais de carburant', points: 2 },
      { option: 'Promesse d\'emploi', points: 2 },
      { option: 'Subvention versée à certaines associations', points: 2 },
      { option: 'Obtention d\'un contrat avec la collectivité', points: 2 },
      { option: 'Autre', points: 1 }
    ];

    options.forEach(option => {
      this.addCorruptionOption(option.option, option.points);
    });
  }

  // Calculate the score based on selected answers
  calculateScore() {
    this.totalScore = 0;
    this.corruptionElectoral.controls.forEach(control => {
      if (control.value.selected) {
        this.totalScore += control.value.points;
      }
    });

    const corruptionProblem = this.questionnaireForm.get('section2.corruptionProblem')?.value;
    if (corruptionProblem === 'Oui') {
      this.totalScore += 3;
    } else if (corruptionProblem === 'Je ne sais pas') {
      this.totalScore += 1;
    }

    const informedAboutLaws = this.questionnaireForm.get('section2.informedAboutLaws')?.value;
    if (informedAboutLaws === 'Très informé(e)') {
      this.totalScore += 5;
    } else if (informedAboutLaws === 'Un peu informé(e)') {
      this.totalScore += 3;
    }
  }

  // Handle next section navigation
  nextSection() {
    if (this.currentSection < 6) {
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
}
