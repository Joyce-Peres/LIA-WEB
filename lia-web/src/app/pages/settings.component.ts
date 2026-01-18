import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserMenuComponent } from '../components/user-menu.component';
import { SettingsService, ThemeMode } from '../core/services/settings.service';

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [CommonModule, FormsModule, UserMenuComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  constructor(private location: Location) {}

  protected readonly settings = inject(SettingsService);

  // Local, editable copy to support an explicit Save action
  pendingThemeMode: ThemeMode = 'light';
  pendingUnmirror = true;
  savedMessage = '';

  ngOnInit(): void {
    this.pendingThemeMode = this.settings.themeMode();
    this.pendingUnmirror = this.settings.unmirrorCamera();
  }

  get isDirty(): boolean {
    return (
      this.pendingThemeMode !== this.settings.themeMode() ||
      this.pendingUnmirror !== this.settings.unmirrorCamera()
    );
  }

  back(): void {
    this.location.back();
  }

  setThemeModeLocal(value: ThemeMode): void { this.pendingThemeMode = value; this.savedMessage = ''; }
  setUnmirrorLocal(value: boolean): void { this.pendingUnmirror = value; this.savedMessage = ''; }

  save(): void {
    this.settings.setThemeMode(this.pendingThemeMode);
    this.settings.setUnmirrorCamera(this.pendingUnmirror);
    this.savedMessage = 'Preferências salvas.';
  }
}
