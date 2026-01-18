import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { UserMenuComponent } from '../components/user-menu.component';

@Component({
  standalone: true,
  selector: 'app-about',
  imports: [CommonModule, UserMenuComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {
  constructor(private location: Location) {}

  back(): void { this.location.back(); }

  handleReload(event: Event): void {
    event.preventDefault();
    window.location.reload();
  }
}
