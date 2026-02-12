import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { ProfileService } from '../core/services/profile.service';
import type { AuthSession, UserProfile } from '../core/models/auth.types';

@Component({
  selector: 'app-right-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './right-sidebar.component.html',
  styleUrl: './right-sidebar.component.css',
})
export class RightSidebarComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);

  protected readonly session = signal<AuthSession | null>(null);
  protected readonly profile = signal<UserProfile | null>(null);

  protected readonly mobileOpen = signal(false);

  private sub?: Subscription;
  private profileSub?: Subscription;

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

    this.profileSub = this.profileService.profile$.subscribe((p) => {
      if (p) this.profile.set(p);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.profileSub?.unsubscribe();
  }

  toggleMobile(): void {
    this.mobileOpen.set(!this.mobileOpen());
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  async handleLogout(): Promise<void> {
    await this.auth.signOut();
    this.closeMobile();
  }
}


