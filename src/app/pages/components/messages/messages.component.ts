import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../../services/firebase.service';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  status: 'new' | 'read' | 'archived';
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
    MatTooltipModule
  ],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit {
  messages: ContactMessage[] = [];
  isLoading = true;
  filteredMessages: ContactMessage[] = [];
  filterStatus: 'all' | 'new' | 'read' | 'archived' = 'all';

  constructor(private firebaseService: FirebaseService) {}

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
}