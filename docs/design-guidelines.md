# WeGroup Platform - Design Guidelines

## Überblick

Diese Design Guidelines definieren die visuellen und funktionalen Standards für die WeGroup Platform basierend auf dem Login-Mockup und der Plattform-Vision.

## Visuelle Identität

### Farbschema

#### Primärfarben
- **Primär Blau**: #4285F4 (Login-Button, Hauptaktionen)
- **Weiß**: #FFFFFF (Hintergrund, Cards)
- **Hellgrau**: #F8F9FA (Sekundärer Hintergrund)
- **Dunkelgrau**: #202124 (Text, Icons)

#### Sekundärfarben
- **Erfolg Grün**: #34A853 (Erfolgsmeldungen, positive Aktionen)
- **Warnung Orange**: #FBBC04 (Warnungen, Aufmerksamkeit)
- **Fehler Rot**: #EA4335 (Fehlermeldungen, kritische Aktionen)
- **Info Blau**: #4285F4 (Informationen, Links)

#### Graustufen
- **Text Primär**: #202124 (Haupttext)
- **Text Sekundär**: #5F6368 (Sekundärtext, Beschreibungen)
- **Border**: #DADCE0 (Rahmen, Trennlinien)
- **Background**: #F8F9FA (Hintergrund-Bereiche)

### Typografie

#### Schriftarten
- **Primär**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Monospace**: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace

#### Schriftgrößen
- **H1**: 32px / 2rem (Hauptüberschriften)
- **H2**: 24px / 1.5rem (Sektionsüberschriften)
- **H3**: 20px / 1.25rem (Unterüberschriften)
- **Body**: 16px / 1rem (Fließtext)
- **Small**: 14px / 0.875rem (Kleintext, Labels)
- **Caption**: 12px / 0.75rem (Bildunterschriften, Metadaten)

#### Schriftgewichte
- **Light**: 300 (Dekorative Texte)
- **Regular**: 400 (Standardtext)
- **Medium**: 500 (Hervorhebungen)
- **Semibold**: 600 (Überschriften)
- **Bold**: 700 (Starke Betonungen)

## Layout & Spacing

### Grid-System
- **Container**: Max-width 1200px, zentriert
- **Columns**: 12-Spalten Grid-System
- **Gutters**: 24px zwischen Spalten
- **Breakpoints**:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

### Spacing-System
**8px Base Unit System**
- **xs**: 4px (0.25rem)
- **sm**: 8px (0.5rem)
- **md**: 16px (1rem)
- **lg**: 24px (1.5rem)
- **xl**: 32px (2rem)
- **2xl**: 48px (3rem)
- **3xl**: 64px (4rem)

### Komponenten-Abstände
- **Card Padding**: 24px (lg)
- **Button Padding**: 12px 24px (vertical: sm, horizontal: lg)
- **Input Padding**: 12px 16px (vertical: sm, horizontal: md)
- **Section Margins**: 48px (2xl)

## UI-Komponenten

### Login-Interface

#### Login-Card
```css
.login-card {
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 48px;
  max-width: 400px;
  margin: 0 auto;
}
```

#### Header
- **Logo**: WeGroup Platform mit Icon
- **Tagline**: "Intelligente Multi-Mandanten-Plattform für moderne Unternehmen"
- **Schriftgröße**: 14px, Farbe: #5F6368

#### Eingabefelder
```css
.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #DADCE0;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.input-field:focus {
  border-color: #4285F4;
  outline: none;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
}
```

#### Buttons
```css
.primary-button {
  background: #4285F4;
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  width: 100%;
}

.primary-button:hover {
  background: #3367D6;
}

.primary-button:active {
  background: #2E5BBA;
}
```

### Demo-Benutzer Sektion

#### Demo-User Cards
```css
.demo-user-card {
  background: #F8F9FA;
  border: 1px solid #DADCE0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.demo-user-card:hover {
  background: #E8F0FE;
  border-color: #4285F4;
}
```

#### Avatar-System
- **Größe**: 40px × 40px
- **Border-Radius**: 50% (kreisrund)
- **Fallback**: Initialen auf farbigem Hintergrund
- **Farben**: Basierend auf Benutzer-Hash

### Navigation & Menüs

#### Hauptnavigation
- **Höhe**: 64px
- **Hintergrund**: #FFFFFF
- **Border-Bottom**: 1px solid #DADCE0
- **Logo**: Links positioniert
- **Benutzer-Menü**: Rechts positioniert

#### Sidebar-Navigation
- **Breite**: 280px (Desktop), Collapsible
- **Hintergrund**: #F8F9FA
- **Active State**: #E8F0FE mit #4285F4 Border-Left

### Cards & Panels

#### Standard Card
```css
.card {
  background: #FFFFFF;
  border: 1px solid #DADCE0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
}
```

#### Panel Header
```css
.panel-header {
  border-bottom: 1px solid #DADCE0;
  padding-bottom: 16px;
  margin-bottom: 24px;
}
```

## Interaktions-Design

### Hover-Effekte
- **Buttons**: Farbvertiefung um 10-15%
- **Cards**: Leichte Schatten-Erhöhung
- **Links**: Unterstreichung erscheint
- **Icons**: Leichte Größenvergrößerung (scale: 1.1)

### Transitions
- **Standard**: 0.2s ease
- **Schnell**: 0.1s ease (kleine Änderungen)
- **Langsam**: 0.3s ease (große Änderungen)

### Loading States
- **Skeleton Screens**: Für Content-Loading
- **Spinner**: Für Aktions-Loading
- **Progress Bars**: Für mehrstufige Prozesse

## Responsive Design

### Mobile-First Approach
- Basis-Styles für Mobile (< 768px)
- Progressive Enhancement für größere Screens
- Touch-optimierte Interaktionen

### Breakpoint-spezifische Anpassungen

#### Mobile (< 768px)
- **Login-Card**: Vollbreite mit 16px Margin
- **Navigation**: Hamburger-Menü
- **Cards**: Reduziertes Padding (16px)
- **Buttons**: Mindesthöhe 44px für Touch

#### Tablet (768px - 1024px)
- **Login-Card**: Zentriert mit max-width 400px
- **Navigation**: Hybrid-Ansatz
- **Grid**: 2-3 Spalten Layout

#### Desktop (> 1024px)
- **Login-Card**: Wie Mockup dargestellt
- **Navigation**: Vollständige Sidebar
- **Grid**: Vollständiges 12-Spalten System

## Accessibility (A11Y)

### Farbkontrast
- **Text auf Weiß**: Mindestens 4.5:1 Kontrast
- **Links**: Mindestens 3:1 Kontrast
- **Buttons**: Mindestens 4.5:1 Kontrast

### Keyboard Navigation
- **Tab-Order**: Logische Reihenfolge
- **Focus Indicators**: Deutlich sichtbar
- **Skip Links**: Für Hauptinhalt

### Screen Reader Support
- **Alt-Texte**: Für alle Bilder
- **ARIA-Labels**: Für komplexe Komponenten
- **Semantic HTML**: Korrekte HTML-Struktur

## Branding & Anpassungen

### Mandanten-spezifisches Branding
- **Logo**: Austauschbar pro Mandant
- **Primärfarbe**: Anpassbar pro Mandant
- **Favicon**: Mandanten-spezifisch
- **E-Mail-Templates**: Branded Templates

### White-Label Optionen
- **Vollständiges Rebranding**: Möglich
- **Custom CSS**: Injection möglich
- **Theme-System**: Vordefinierte Themes
- **Asset-Management**: Mandanten-spezifische Assets

## Performance Guidelines

### Optimierung
- **Lazy Loading**: Für Bilder und Komponenten
- **Code Splitting**: Route-basiert
- **Caching**: Aggressive Browser-Caching
- **Compression**: Gzip/Brotli für Assets

### Metriken
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms