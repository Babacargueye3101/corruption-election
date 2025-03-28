import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FirebaseService } from '../../../services/firebase.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  contactForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  async onSubmit() {
    if (this.contactForm.invalid || this.isSubmitting) return;

    const result = await Swal.fire({
      title: 'Confirmer l\'envoi',
      text: 'Voulez-vous envoyer votre message ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Envoyer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      this.isSubmitting = true;

      try {
        await this.firebaseService.saveContactMessage(this.contactForm.value);

        Swal.fire({
          title: 'Envoyé !',
          text: 'Votre message a bien été transmis à notre équipe.',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false
        });

        this.contactForm.reset();
      } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        Swal.fire({
          title: 'Erreur',
          text: 'Une erreur est survenue lors de l\'envoi de votre message. Veuillez réessayer.',
          icon: 'error'
        });
      } finally {
        this.isSubmitting = false;
      }
    }
  }
}