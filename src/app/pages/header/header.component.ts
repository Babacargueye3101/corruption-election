import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  isMenuOpen = false;

  constructor(private router: Router, private firebaseService: FirebaseService){}
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  async openLoginModal() {
    const { value: formValues } = await Swal.fire({
      title: 'Connexion',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Email">' +
        '<input id="swal-input2" class="swal2-input" placeholder="Mot de passe" type="password">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Se connecter',
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement).value,
          (document.getElementById('swal-input2') as HTMLInputElement).value
        ];
      }
    });

    if (formValues) {
      const [email, password] = formValues;
      try {
        const auth = getAuth();
        await signInWithEmailAndPassword(auth, email, password);
        Swal.fire({
          icon: 'success',
          title: 'Connexion réussie!',
          showConfirmButton: false,
          timer: 1500
        });
        this.router.navigate(['/statistiques'])
      } catch (error) {
        let errorMessage = 'Erreur de connexion';
        console.log(error);

        if (error instanceof Error) {
          errorMessage = this.getFirebaseErrorMessage(error);
        }
        Swal.fire('Erreur', errorMessage, 'error');
      }
    }
  }

  private getFirebaseErrorMessage(error: Error): string {
    const errorCode = (error as any).code;
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Email invalide';
      case 'auth/user-disabled':
        return 'Compte désactivé';
      case 'auth/user-not-found':
        return 'Utilisateur non trouvé';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect';
      default:
        return 'Erreur de connexion';
    }
  }
}
