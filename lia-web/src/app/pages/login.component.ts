import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>Entrar</h1>
        <p class="subtitle">Faça login para acessar o LIA Web.</p>

        <button
          type="button"
          (click)="handleLogin()"
          [disabled]="isLoading()"
          class="login-btn">
          {{ isLoading() ? 'Entrando…' : 'Entrar (modo local)' }}
        </button>

        @if (error()) {
          <div class="error-msg">
            {{ error() }}
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      background: var(--surface-2);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .login-card {
      width: 100%;
      max-width: 28rem;
      border-radius: 1.25rem;
      background: var(--surface-1);
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.25);
      border: 1px solid var(--border);
      padding: 2.25rem 2.5rem;
      text-align: center;
    }
    h1 {
      font-size: 2rem;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 0.5rem;
    }
    .subtitle {
      font-size: 0.875rem;
      color: var(--muted);
      margin: 0 0 2rem;
    }
    .login-btn {
      margin-top: 0.5rem;
      width: 100%;
      border-radius: 999px;
      background: var(--accent);
      padding: 0.75rem 1rem;
      color: white;
      font-weight: 600;
      font-size: 0.95rem;
      border: none;
      cursor: pointer;
      box-shadow: 0 10px 24px rgba(124, 58, 237, 0.35);
      transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease, opacity 0.15s ease;
    }
    .login-btn:hover:not(:disabled) {
      filter: brightness(1.03);
      transform: translateY(-1px);
      box-shadow: 0 16px 32px rgba(124, 58, 237, 0.45);
    }
    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .error-msg {
      margin-top: 1rem;
      border-radius: 0.5rem;
      border: 1px solid var(--color-error-light);
      background: rgba(248, 113, 113, 0.12);
      padding: 0.75rem;
      font-size: 0.875rem;
      color: #b91c1c;
    }
  `]
})
export class LoginComponent implements OnInit {
  protected readonly error = signal<string | null>(null);
  protected readonly isLoading = signal(false);

  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }

  async handleLogin(): Promise<void> {
    this.error.set(null);
    this.isLoading.set(true);

    try {
      await this.authService.signInLocal();
      await this.router.navigate(['/dashboard'], { replaceUrl: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro inesperado';
      this.error.set(message);
      this.isLoading.set(false);
    }
  }
}
