import { Routes } from '@angular/router';
import { HomeComponent } from './pages/components/home/home.component';
import { AproposComponent } from './pages/components/apropos/apropos.component';
import { ContactComponent } from './pages/components/contact/contact.component';
import { QuestionnaireComponent } from './pages/components/questionnaire/questionnaire.component';

export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'apropos', component: AproposComponent},
    {path: 'contact', component: ContactComponent},
    {path: 'questionnaire', component: QuestionnaireComponent},
    { path: '**', redirectTo: '' }
];
