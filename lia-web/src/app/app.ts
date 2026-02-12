import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import type { AuthSession } from './core/models/auth.types';
import { RightSidebarComponent } from './components/right-sidebar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RightSidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly session = signal<AuthSession | null>(null);
  private readonly currentUrl = signal<string>('/');

  protected readonly title = signal('lia-web');

  protected readonly showChrome = computed(() => {
    const sess = this.session();
    const url = this.currentUrl();
    const hide =
      url.startsWith('/login') ||
      url.startsWith('/auth/callback') ||
      url.startsWith('/practice');

    return !!sess && !hide;
  });

  private sub?: Subscription;
  private routerSub?: Subscription;

  ngOnInit(): void {
    this.session.set(this.auth.getSession());
    this.currentUrl.set(this.router.url || '/');

    this.sub = this.auth.session$.subscribe((sess) => this.session.set(sess));
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.currentUrl.set(e.urlAfterRedirects || e.url || '/'));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }
}
