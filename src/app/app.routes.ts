import { Routes } from '@angular/router';
import { HomeComponent } from './pages/components/home/home.component';
import { AproposComponent } from './pages/components/apropos/apropos.component';
import { ContactComponent } from './pages/components/contact/contact.component';
import { QuestionnaireComponent } from './pages/components/questionnaire/questionnaire.component';
import { StatistiqueComponent } from './pages/components/statistique/statistique.component';
import { MessagesComponent } from './pages/components/messages/messages.component';

export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'apropos', component: AproposComponent},
    {path: 'contact', component: ContactComponent},
    {path: 'questionnaire', component: QuestionnaireComponent},
    {path: 'statistiques', component: StatistiqueComponent},
    {path: 'messages', component: MessagesComponent},
    { path: '**', redirectTo: '' }
];
