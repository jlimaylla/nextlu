import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

interface BrandFeature {
  icon: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, MatIconModule, ThemeToggleComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {
  readonly features: BrandFeature[] = [
    {
      icon: 'quiz',
      title: 'Evaluaciones automáticas',
      desc: 'Banco de preguntas con calificación y retroalimentación instantánea',
    },
    {
      icon: 'workspace_premium',
      title: 'Certificados verificables',
      desc: 'Emisión automática con código único y verificación por QR',
    },
  ];
}
