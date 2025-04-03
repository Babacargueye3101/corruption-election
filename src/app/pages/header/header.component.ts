import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isMenuOpen = false;
  isAuthenticated = false;
  userEmail: string | null = null;
  private auth = getAuth();

  constructor(private router: Router, private firebaseService: FirebaseService) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user: User | null) => {
      this.isAuthenticated = !!user;
      this.userEmail = user?.email || null;
    });
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
        await signInWithEmailAndPassword(this.auth, email, password);
        Swal.fire({
          icon: 'success',
          title: 'Connexion réussie!',
          showConfirmButton: false,
          timer: 1500
        });
        this.router.navigate(['/statistiques']);
      } catch (error) {
        let errorMessage = 'Erreur de connexion';
        if (error instanceof Error) {
          errorMessage = this.getFirebaseErrorMessage(error);
        }
        Swal.fire('Erreur', errorMessage, 'error');
      }
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.isAuthenticated = false;
      this.userEmail = null;
      Swal.fire({
        icon: 'success',
        title: 'Déconnexion réussie!',
        showConfirmButton: false,
        timer: 1500
      });
      this.router.navigate(['/']);
    } catch (error) {
      Swal.fire('Erreur', 'Erreur lors de la déconnexion', 'error');
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

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}