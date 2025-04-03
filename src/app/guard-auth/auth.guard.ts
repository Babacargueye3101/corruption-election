import { Injectable } from '@angular/core';
import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    UrlTree,
    Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private router: Router) {}

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return new Promise((resolve) => {
            const auth = getAuth();
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    resolve(true);
                } else {
                    const message = route.data['authMessage'] ||
                                  'Vous devez être connecté pour accéder à cette page';

                    Swal.fire({
                        icon: 'warning',
                        title: 'Accès restreint',
                        text: message,
                        confirmButtonText: 'Se connecter',
                        showCancelButton: true,
                        cancelButtonText: 'Annuler',
                        allowOutsideClick: false
                    }).then((result) => {
                        // Cette partie sera exécutée après la fermeture de la popup
                        if (result.isConfirmed) {
                            // Redirection vers la page d'accueil avec refresh
                            window.location.href = '/';
                        } else {
                            // Si annulation, on recharge aussi la page d'accueil
                            window.location.href = '/';
                        }
                    });

                    resolve(false);
                }
            });
        });
    }
}