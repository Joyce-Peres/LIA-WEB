import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserMenuComponent } from '../components/user-menu.component';

@Component({
  standalone: true,
  selector: 'app-help',
  imports: [CommonModule, UserMenuComponent, RouterModule],
  templateUrl: './help.component.html',
  styleUrl: './help.component.css'
})
export class HelpComponent {
  expandedSections: { [key: string]: boolean } = {
    quickStart: false,
    howToUse: false,
    recognition: false,
    video: false,
    progression: false,
    settings: false,
    faq: false,
    tips: false,
    requirements: false
  };

  constructor(private location: Location) {}

  back(): void { this.location.back(); }

  toggleSection(section: string): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  isSectionExpanded(section: string): boolean {
    return this.expandedSections[section];
  }
}
