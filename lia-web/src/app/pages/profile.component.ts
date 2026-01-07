import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserMenuComponent } from '../components/user-menu.component';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { ProfileService } from '../core/services/profile.service';
import type { AuthSession, UserProfile } from '../core/models/auth.types';

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, UserMenuComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  protected readonly session = signal<AuthSession | null>(null);
  protected readonly profile = signal<UserProfile | null>(null);
  protected displayName = '';
  protected avatarText = '';
  protected isSaving = false;
  protected email = '';
  protected showIconPicker = false;
  protected showSuccessMessage = false;

  // Ícones predefinidos da LIA
  protected readonly availableIcons = [
    '👤', '👥', '👦', '👧', '👨', '👩',
    '🧑', '👶', '🧒', '🧓', '🦸', '🦹',
    '👽', '🤖', '👾', '🐱', '🐶', '🐻',
    '⭐', '🔥', '✨', '🌟', '🌈', '🎉'
  ];

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.session$
      .pipe(takeUntil(this.destroy$))
      .subscribe(session => {
        this.session.set(session);
        if (!session) {
          this.router.navigate(['/login'], { replaceUrl: true });
          return;
        }
        const p = this.profileService.ensureProfile(session.user.id);
        this.profile.set(p);
        this.displayName = p.displayName;
        this.avatarText = p.avatarText;
        this.email = session.user.email;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  back(): void {
    this.router.navigate(['/dashboard']);
  }

  toggleIconPicker(): void {
    this.showIconPicker = !this.showIconPicker;
  }

  selectIcon(icon: string): void {
    this.avatarText = icon;
    this.showIconPicker = false;
  }

  async handleLogout(): Promise<void> {
    await this.authService.signOut();
  }

  saveProfile(): void {
    const sess = this.session();
    if (!sess) return;
    const name = this.displayName.trim();
    const avatar = this.avatarText.trim() || this.profile()?.avatarText || 'PR';
    const newEmail = this.email.trim();
    if (!name || !newEmail) return;
    this.isSaving = true;
    const updated = this.profileService.updateProfile(sess.user.id, (current) => ({
      ...current,
      displayName: name,
      avatarText: avatar
    }));
    this.profile.set(updated);
    // Atualizar email na sessão (simulação local)
    this.email = newEmail;
    this.isSaving = false;

    // Mostrar mensagem de sucesso
    this.showSuccessMessage = true;
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 3000);
  }
}
