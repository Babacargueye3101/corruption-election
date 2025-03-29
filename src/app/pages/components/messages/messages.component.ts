import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../../services/firebase.service';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';
import {MatDialogModule} from '@angular/material/dialog';
import { EmailjsService } from '../../../services/emailjs.service';


interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  status: 'new' | 'read' | 'archived';
  replied: string;
  replyDate: Date;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit {
  messages: ContactMessage[] = [];
  isLoading = true;
  filteredMessages: ContactMessage[] = [];
  filterStatus: 'all' | 'new' | 'read' | 'archived' = 'all';

  constructor(private firebaseService: FirebaseService, private emailjsService: EmailjsService) {}

  async ngOnInit() {
    try {
      this.messages = await this.firebaseService.getContactMessages() as ContactMessage[];
      this.applyFilter();
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      this.isLoading = false;
    }
  }

  applyFilter() {
    if (this.filterStatus === 'all') {
      this.filteredMessages = [...this.messages];
    } else {
      this.filteredMessages = this.messages.filter(
        msg => msg.status === this.filterStatus
      );
    }
  }

  changeFilter(status: 'all' | 'new' | 'read' | 'archived') {
    this.filterStatus = status;
    this.applyFilter();
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getNewMessagesCount(): number {
    return this.messages?.filter(m => m.status === 'new')?.length || 0;
  }

  getReadMessagesCount(): number {
    return this.messages?.filter(m => m.status === 'read')?.length || 0;
  }

  getArchivedMessagesCount(): number {
    return this.messages?.filter(m => m.status === 'archived')?.length || 0;
  }

  async markAsRead(messageId: string) {
    try {
      await this.firebaseService.markMessageAsRead(messageId);

      // Mettre à jour le statut localement
      const message = this.messages.find(m => m.id === messageId);
      if (message) {
        message.status = 'read';
        this.applyFilter();
      }

      // Feedback utilisateur avec Swal
      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: 'Message marqué comme lu',
        showConfirmButton: false,
        timer: 2000,
        toast: true,
        background: '#f0fdf4',
        iconColor: '#16a34a'
      });
    } catch (error) {
      console.error('Erreur:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Échec du marquage comme lu',
        confirmButtonColor: '#2563eb',
      });
    }
  }

  async replyToMessage(message: any) {
    const { value: text } = await Swal.fire({
      title: `Réponse à ${message.name}`,
      input: 'textarea',
      inputLabel: 'Votre réponse',
      inputPlaceholder: 'Tapez votre message ici...',
      inputAttributes: {
        'aria-label': 'Tapez votre message ici'
      },
      showCancelButton: true,
      confirmButtonText: 'Envoyer',
      cancelButtonText: 'Annuler',
      inputValidator: (value) => {
        if (!value) {
          return 'Vous devez écrire un message !';
        }
        return null;
      }
    });

    if (text) {
      try {
        await this.emailjsService.sendReply(
          message.email,
          message.name,
          text
        );

        await this.firebaseService.markAsReplied(message.id, text);

        // Marquer comme envoyé dans l'interface
        message.replied = true;
        message.replyDate = new Date();

        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Réponse envoyée',
          showConfirmButton: false,
          timer: 1500
        });
      } catch (error) {
        Swal.fire('Erreur', "L'envoi a échoué", 'error');
      }
    }
  }

}