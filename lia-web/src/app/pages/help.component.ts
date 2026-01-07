import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserMenuComponent } from '../components/user-menu.component';

@Component({
  standalone: true,
  selector: 'app-help',
  imports: [CommonModule, UserMenuComponent],
  templateUrl: './help.component.html',
  styleUrl: './help.component.css'
})
export class HelpComponent {
  constructor(private router: Router) {}

  back(): void { this.router.navigate(['/dashboard']); }
}
