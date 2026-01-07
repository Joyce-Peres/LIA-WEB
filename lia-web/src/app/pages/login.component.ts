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

        <div class="info-text">
          Você escolheu <strong>evitar serviços externos</strong>. Este login cria
          uma sessão local (armazenada no navegador) e não usa Google/Supabase.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      background: #f9fafb;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .login-card {
      width: 100%;
      max-width: 28rem;
      border-radius: 0.75rem;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #e5e7eb;
      padding: 1.5rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: bold;
      color: #111827;
      margin: 0 0 0.25rem;
    }
    .subtitle {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0 0 1.5rem;
    }
    .login-btn {
      margin-top: 1.5rem;
      width: 100%;
      border-radius: 0.5rem;
      background: #8b5cf6;
      padding: 0.5rem 1rem;
      color: white;
      font-weight: 600;
      border: none;
      cursor: pointer;
    }
    .login-btn:hover:not(:disabled) {
      opacity: 0.95;
    }
    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .error-msg {
      margin-top: 1rem;
      border-radius: 0.5rem;
      border: 1px solid #fecaca;
      background: #fef2f2;
      padding: 0.75rem;
      font-size: 0.875rem;
      color: #b91c1c;
    }
    .info-text {
      margin-top: 1rem;
      font-size: 0.75rem;
      color: #6b7280;
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
