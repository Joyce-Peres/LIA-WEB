import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ProfileService } from '../core/services/profile.service';
import type { UserProfile, AuthSession } from '../core/models/auth.types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.css'
})
export class UserMenuComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  protected readonly isOpen = signal(false);
  protected readonly session = signal<AuthSession | null>(null);
  protected readonly profile = signal<UserProfile | null>(null);

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.auth.session$.subscribe((sess) => {
      this.session.set(sess);
      if (sess) {
        const p = this.profileService.ensureProfile(sess.user.id);
        this.profile.set(p);
      } else {
        this.profile.set(null);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggleMenu(): void {
    this.isOpen.set(!this.isOpen());
  }

  closeMenu(): void {
    this.isOpen.set(false);
  }

  async handleLogout(): Promise<void> {
    await this.auth.signOut();
    this.closeMenu();
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
    this.closeMenu();
  }

  // Placeholders: podem virar rotas futuras
  navigateToSettings(): void {
    this.router.navigate(['/settings']);
    this.closeMenu();
  }

  navigateToAbout(): void {
    this.router.navigate(['/about']);
    this.closeMenu();
  }

  navigateToHelp(): void {
    this.router.navigate(['/help']);
    this.closeMenu();
  }
}
