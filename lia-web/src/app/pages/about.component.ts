import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserMenuComponent } from '../components/user-menu.component';

@Component({
  standalone: true,
  selector: 'app-about',
  imports: [CommonModule, UserMenuComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {
  constructor(private router: Router) {}

  back(): void { this.router.navigate(['/dashboard']); }

  handleReload(event: Event): void {
    event.preventDefault();
    window.location.reload();
  }
}
