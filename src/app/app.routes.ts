import { Routes } from '@angular/router';
import { HomeComponent } from './pages/components/home/home.component';
import { AproposComponent } from './pages/components/apropos/apropos.component';
import { ContactComponent } from './pages/components/contact/contact.component';
import { QuestionnaireComponent } from './pages/components/questionnaire/questionnaire.component';
import { StatistiqueComponent } from './pages/components/statistique/statistique.component';
import { MessagesComponent } from './pages/components/messages/messages.component';
import { AuthGuard } from './guard-auth/auth.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'apropos', component: AproposComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'questionnaire', component: QuestionnaireComponent },
    {
        path: 'statistiques',
        component: StatistiqueComponent,
        canActivate: [AuthGuard],
        data: {
            authMessage: 'Vous devez être connecté pour accéder aux statistiques'
        }
    },
    {
        path: 'messages',
        component: MessagesComponent,
        canActivate: [AuthGuard], // Ajoutez le guard ici
        data: {
            authMessage: 'Vous devez être connecté pour accéder aux messages'
        }
    },
    { path: '**', redirectTo: '' }
];