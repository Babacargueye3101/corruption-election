import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-apropos',
  imports: [RouterModule, CommonModule],
  templateUrl: './apropos.component.html',
  styleUrl: './apropos.component.scss'
})
export class AproposComponent {
  newDate= new Date();

}
