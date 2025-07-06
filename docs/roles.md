# WeGroup Platform - Rollensystem

## Überblick

Die WeGroup Platform implementiert ein hierarchisches Rollensystem mit sechs Hauptrollen, die verschiedene Zugriffsebenen und Verantwortlichkeiten abdecken.

## Rollen-Hierarchie

### 1. Super Administrator
**Höchste Berechtigung - Vollzugriff auf alle Mandanten und System-Funktionen**

#### Berechtigungen:
- Vollzugriff auf alle Mandanten und deren Daten
- System-weite Konfiguration und Einstellungen
- Benutzer- und Rollen-Verwaltung über alle Mandanten hinweg
- Plattform-Administration und Wartung
- Zugriff auf System-Logs und Audit-Trails
- Mandanten-Erstellung und -Verwaltung

#### Typische Anwendungsfälle:
- Plattform-Betreiber und System-Administratoren
- Technische Leitung der WeGroup Platform
- Support-Teams für mandanten-übergreifende Probleme

### 2. Administrator
**Mandanten-spezifische Administration**

#### Berechtigungen:
- Vollzugriff auf den eigenen Mandanten
- Benutzer- und Rollen-Verwaltung innerhalb des Mandanten
- Konfiguration mandanten-spezifischer Einstellungen
- Zugriff auf Mandanten-spezifische Reports und Analytics
- Integration-Management (APIs, Webhooks)

#### Typische Anwendungsfälle:
- IT-Administratoren in Unternehmen
- System-Verantwortliche pro Organisation
- Technische Projektleiter

### 3. C-Level
**Strategische Führungsebene**

#### Berechtigungen:
- Zugriff auf Executive Dashboards und KPIs
- Strategische Reports und Business Intelligence
- Budget- und Ressourcen-Übersicht
- Genehmigungsworkflows für kritische Entscheidungen
- Zugriff auf Compliance und Governance-Berichte

#### Typische Anwendungsfälle:
- CEOs, CTOs, CFOs
- Geschäftsführung und Vorstand
- Strategische Entscheidungsträger

### 4. Management
**Mittlere Führungsebene**

#### Berechtigungen:
- Team- und Abteilungs-Management
- Projekt-Übersicht und -Steuerung
- Mitarbeiter-Performance Tracking
- Budget-Verwaltung für den Verantwortungsbereich
- Genehmigungsrechte für operative Entscheidungen

#### Typische Anwendungsfälle:
- Abteilungsleiter und Team-Manager
- Projekt-Manager
- Bereichsleiter

### 5. Operative
**Operative Mitarbeiter**

#### Berechtigungen:
- Zugriff auf arbeitsplatz-relevante Funktionen
- Bearbeitung von Aufgaben und Projekten
- Zeiterfassung und Reporting
- Zugriff auf Team-Kommunikation
- Dokumenten-Bearbeitung im Rahmen der Zuständigkeit

#### Typische Anwendungsfälle:
- Fachkräfte und Spezialisten
- Operative Mitarbeiter
- Sachbearbeiter

### 6. Business
**Geschäftsprozess-orientierte Rolle**

#### Berechtigungen:
- Zugriff auf Business-Prozesse und Workflows
- Kunden- und Partner-Management
- Verkaufs- und Marketing-Tools
- Business Analytics und Reporting
- CRM und Lead-Management

#### Typische Anwendungsfälle:
- Vertriebsmitarbeiter
- Marketing-Teams
- Business Development
- Account Manager

### 7. Externe
**Externe Partner und Dienstleister**

#### Berechtigungen:
- Eingeschränkter Zugriff auf spezifische Projekte
- Temporäre Zugriffsrechte
- Nur Zugriff auf freigegebene Bereiche
- Keine administrativen Rechte
- Audit-Trail für alle Aktivitäten

#### Typische Anwendungsfälle:
- Externe Berater
- Freelancer und Contractors
- Partner-Unternehmen
- Lieferanten mit System-Zugriff

## Rollen-Matrix

| Funktion | Super Admin | Admin | C-Level | Management | Operative | Business | Externe |
|----------|-------------|-------|---------|------------|-----------|----------|----------|
| System-Administration | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Mandanten-Verwaltung | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Benutzer-Verwaltung | ✅ | ✅ | ❌ | ⚠️ | ❌ | ❌ | ❌ |
| Executive Dashboards | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Team-Management | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Projekt-Zugriff | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Business-Tools | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ |
| Reporting | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ⚠️ |

**Legende:**
- ✅ Vollzugriff
- ⚠️ Eingeschränkter Zugriff
- ❌ Kein Zugriff

## Rollen-Zuweisung

### Automatische Zuweisung
- Neue Benutzer erhalten standardmäßig die "Operative" Rolle
- Rollen können basierend auf E-Mail-Domains automatisch zugewiesen werden
- Integration mit Active Directory/LDAP für automatische Rollen-Synchronisation

### Manuelle Zuweisung
- Administratoren können Rollen manuell zuweisen und ändern
- Temporäre Rollen-Erhöhungen für spezifische Projekte
- Audit-Trail für alle Rollen-Änderungen

### Rollen-Vererbung
- Hierarchische Vererbung von Berechtigungen
- Mandanten-spezifische Rollen-Anpassungen
- Projekt-basierte temporäre Rollen-Erweiterungen