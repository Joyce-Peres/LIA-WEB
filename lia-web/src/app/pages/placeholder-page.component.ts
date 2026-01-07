import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-placeholder-page',
  imports: [CommonModule],
  template: `
    <section class="page">
      <h1>{{ page }}</h1>
      <p>Placeholder Angular para a tela "{{ page }}".</p>
      <p>Substitua pelo conteúdo migrado do React.</p>
    </section>
  `,
  styles: [`
    .page {
      padding: 2rem;
      max-width: 960px;
      margin: 0 auto;
    }
    h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
    p { margin: 0.25rem 0; }
  `]
})
export class PlaceholderPageComponent {
  protected readonly page = inject(ActivatedRoute).snapshot.data['page'] ?? 'Página';
}
