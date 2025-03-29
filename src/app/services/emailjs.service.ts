// emailjs.service.ts
import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';

@Injectable({ providedIn: 'root' })
export class EmailjsService {
  private serviceID = 'service_714qilr';
  private templateID = 'template_gzsdfpc';
  private userID = 'XpDqHIuCxIZCLKsju';

  constructor() {
    emailjs.init(this.userID);
  }

  async sendReply(toEmail: string, toName: string, message: string) {
    try {
      const response = await emailjs.send(this.serviceID, this.templateID, {
        name: toName,       // Doit correspondre à {{name}} dans le template
        email: toEmail,     // Doit correspondre à {{email}} dans le template
        message: message    // Doit correspondre à {{message}} dans le template
      });
      return response;
    } catch (error) {
      console.error('Erreur EmailJS:', error);
      throw error;
    }
  }
}