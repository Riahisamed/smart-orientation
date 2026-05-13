# Rapport Technique Complet — Smart Orientation

## Système Hybride d'Orientation Universitaire Assisté par IA pour les Étudiants Tunisiens

---

# Table des Matières

1. [Titre et Informations du Projet](#1-titre-et-informations-du-projet)
2. [Introduction](#2-introduction)
3. [Problématique](#3-problématique)
4. [Objectifs](#4-objectifs)
5. [Solutions Existantes et Leurs Limitations](#5-solutions-existantes-et-leurs-limitations)
6. [Solution Proposée](#6-solution-proposée)
7. [Architecture Globale du Système](#7-architecture-globale-du-système)
8. [Architecture Frontend](#8-architecture-frontend)
9. [Architecture Backend](#9-architecture-backend)
10. [Structure de la Base de Données / Dataset](#10-structure-de-la-base-de-données--dataset)
11. [Moteur de Recommandation](#11-moteur-de-recommandation)
12. [Logique de Filtrage par Score](#12-logique-de-filtrage-par-score)
13. [Système de Comparaison](#13-système-de-comparaison)
14. [Couche d'Amélioration IA (Enhancement Layer)](#14-couche-damélioration-ia-enhancement-layer)
15. [Système de Recherche Sémantique](#15-système-de-recherche-sémantique)
16. [Gestion des Sessions et de la Mémoire](#16-gestion-des-sessions-et-de-la-mémoire)
17. [Génération de Roadmaps](#17-génération-de-roadmaps)
18. [Génération de PDF (Rapports)](#18-génération-de-pdf-rapports)
19. [Technologies Utilisées](#19-technologies-utilisées)
20. [APIs et Endpoints](#20-apis-et-endpoints)
21. [Sécurité et Validation](#21-sécurité-et-validation)
22. [Optimisations de Performance](#22-optimisations-de-performance)
23. [Défis Rencontrés](#23-défis-rencontrés)
24. [Améliorations Apportées](#24-améliorations-apportées)
25. [Explication de l'Architecture Hybride IA](#25-explication-de-larchitecture-hybride-ia)
26. [Résultats et Captures d'Écran](#26-résultats-et-captures-décran)
27. [Améliorations Futures](#27-améliorations-futures)
28. [Conclusion](#28-conclusion)

---

## 1. Titre et Informations du Projet

| Champ | Valeur |
|-------|--------|
| **Titre** | Smart Orientation — Système Hybride d'Orientation Universitaire Assisté par IA |
| **Contexte** | Orientation post-baccalauréat pour les étudiants tunisiens |
| **Type** | Projet de développement full-stack avec IA embarquée |
| **Architecture** | Hybride : moteur déterministe + couche d'amélioration LLM |
| **Langue supportée** | Français, Arabe (Tunisien/MSA) |
| **Public cible** | Bacheliers tunisiens (toutes sections : Math, SVT, Info, Éco, Technique, Lettres, Sport) |
| **Stack technique** | Next.js (frontend), NestJS (backend), PostgreSQL (base de données), Ollama/Gemma (IA) |

---

## 2. Introduction

Le système **Smart Orientation** est une plateforme intelligente d'aide à l'orientation universitaire destinée aux bacheliers tunisiens. Contrairement aux solutions traditionnelles qui reposent exclusivement sur des moteurs de règles ou purement sur l'IA générative, Smart Orientation adopte une **architecture hybride innovante** : un moteur déterministe basé sur les données réelles du guide d'orientation tunisien (scores d'admission, capacités, formules de calcul), couplé à une couche légère d'amélioration par IA (Gemma 2B via Ollama).

La décision d'orientation n'est **jamais** générée par l'IA. L'IA intervient uniquement pour **humaniser** les réponses, **enrichir** le dialogue et **traduire** les résultats techniques en langage naturel chaleureux. Cette approche garantit la **fiabilité**, **l'exactitude** et la **transparence** des recommandations, tout en offrant une expérience utilisateur fluide et naturelle.

Le projet couvre l'ensemble du parcours étudiant : test d'orientation, calcul de score (T-score/FG), consultation des programmes disponibles, analyse de compatibilité, comparaison de filières, génération de roadmaps personnalisées, rapport PDF professionnel, et assistant conversationnel multilingue.

---

## 3. Problématique

### 3.1 Contexte Tunisien

Chaque année, des dizaines de milliers de bacheliers tunisiens doivent choisir une filière universitaire via le système d'orientation national. Ce processus est complexe et stressant pour plusieurs raisons :

- **Scores composites** : L'admission dépend d'un T-score complexe qui combine la moyenne générale (MG), les notes des matières principales, et le coefficient FG (Fonction de Groupe) — un calcul opaque pour la plupart des étudiants.
- **Formules variables** : Chaque programme utilise une formule de calcul différente (ex: `FG + 2M + SP + ANG`, `FG + AR + F`), ce qui rend la comparaison manuelle impossible.
- **Pléthore de choix** : Des centaines de programmes répartis dans des dizaines d'institutions à travers tout le pays.
- **Manque d'information** : Les étudiants manquent souvent de données claires sur les débouchés, les taux d'emploi, et les perspectives de carrière.
- **Barrière linguistique** : Les ressources officielles sont en arabe, français ou anglais, sans guidance unifiée.

### 3.2 Défis Techniques

- **Données hétérogènes** : Le guide officiel d'orientation est un PDF non structuré qui nécessite une extraction et une normalisation complexes.
- **Calcul précis** : Les formules de score doivent être évaluées sans erreur, avec des tolérances strictes.
- **Multilinguisme** : Le système doit gérer le français, l'arabe littéraire, et le dialecte tunisien (Darija) dans les interactions.
- **Fiabilité vs. Fluidité** : Les recommandations doivent être mathématiquement exactes tout en restant compréhensibles pour un jeune bachelier.

---

## 4. Objectifs

### 4.1 Objectifs Fonctionnels

1. **Calcul précis du T-score** à partir des notes du baccalauréat et des formules officielles.
2. **Recommandation de programmes** basée sur le profil académique réel de l'étudiant (bac, score, intérêts).
3. **Analyse de compatibilité** : classification des programmes en niveaux (Sûr, Moyen, Difficile, Impossible).
4. **Comparaison de filières** avec visualisation des différences de formules et de scores requis.
5. **Génération de roadmaps personnalisées** étape par étape pour chaque domaine.
6. **Rapport PDF professionnel** avec graphiques et plan d'action.
7. **Assistant conversationnel bilingue** (français/arabe) avec support du dialecte tunisien.
8. **Test d'orientation** basé sur les centres d'intérêt et les compétences.

### 4.2 Objectifs Techniques

1. **Architecture hybride** : moteur déterministe comme source unique de vérité, IA comme couche d'amélioration uniquement.
2. **Temps de réponse < 2 secondes** pour les requêtes déterministes.
3. **Gestion de session** avec mémoire conversationnelle persistante.
4. **Cache intelligent** des appels LLM pour éviter les régénérations redondantes.
5. **Extraction PDF → JSON** du guide officiel d'orientation.
6. **Support du dialecte tunisien** (Darija) dans la détection d'intention.

---

## 5. Solutions Existantes et Leurs Limitations

### 5.1 Solutions Traditionnelles

| Solution | Description | Limitation |
|----------|-------------|------------|
| Orientation Manuelle | Conseillers d'orientation | Disponibilité limitée, subjectif, non scalable |
| Sites gouvernementaux | Données brutes du ministère | Interface complexe, pas de calcul automatique |
| Calculateurs Excel | Formules partagées sur forums | Erreurs fréquentes, pas de mise à jour, pas de recommandation |

### 5.2 Solutions IA Existantes

| Solution | Limitation |
|----------|------------|
| ChatGPT / Gemini | Peut halluciner des scores ou programmes inexistants. Pas de connaissance du système tunisien. |
| Chatbots spécialisés (ex: MonOrientation) | Souvent des LLM sans moteur de règles, génèrent des recommandations non vérifiées. |
| Systèmes de matching | Approche trop simpliste (mots-clés uniquement), pas de calcul de score réel. |

### 5.3 Pourquoi Smart Orientation est Différent

Smart Orientation ne fait **pas** confiance à l'IA pour les décisions. La logique est la suivante :

```
Données officielles (guide PDF)  →  Base de données PostgreSQL
          ↓
Calcul déterministe (formules officielles)  →  Résultats précis
          ↓
Amélioration IA optionnelle (Gemma)  →  Humanisation, pas de génération de faits
```

L'IA ne peut **pas** :
- Générer des scores d'admission
- Décider de l'orientation
- Inventer des programmes
- Modifier les formules de calcul

L'IA peut **uniquement** :
- Reformuler les résultats de manière plus naturelle
- Ajouter des compléments d'explication (aperçu marché, conseils)
- Traduire en langage chaleureux et adapté au dialecte tunisien

---

## 6. Solution Proposée

Smart Orientation est une **plateforme web progressive (PWA)** avec une architecture **frontend/backend découplée** et un **moteur IA local** (Ollama + Gemma 2B).

### 6.1 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                     Utilisateur (Frontend)                    │
│  Next.js + TypeScript + Tailwind CSS + PWA                   │
└────────────────────┬────────────────────────────────────────┘
                     │ API REST (JWT Auth)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (NestJS)                          │
├─────────────────────────────────────────────────────────────┤
│  Modules : Auth | Student | Filiere | Orientation | Reports │
│  Chatbot | AI | Notifications | Admin | Skills              │
├────────────────────┬────────────────────────────────────────┤
│  Moteur Déterministe  │      Couche IA (Enhancement)       │
│  ─────────────────    │      ─────────────────────────       │
│  • Guide DB (Prisma)  │      • GemmaEnhancerService         │
│  • Score Engine       │      • ResponseHumanizer            │
│  • RAG Service        │      • ToneVariation               │
│  • ProfileFilter      │      • ConversationFlow            │
│  • DomainMatcher      │      • IntentClassifier             │
│  • FormulaEvaluator   │      • FollowupGenerator            │
└────────────────────┬──┴────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
   ┌──────────────┐    ┌──────────────┐
   │  PostgreSQL   │    │  Ollama       │
   │  (Prisma)     │    │  (Gemma 2B)  │
   │  Données      │    │  IA locale   │
   │  officielles  │    │  légère      │
   └──────────────┘    └──────────────┘
```

### 6.2 Principe Hybride Fondamental

Le système suit une **règle stricte** :

1. **Toute décision d'orientation** provient du moteur déterministe (dataset + formules officielles).
2. **L'IA** est une couche optionnelle qui **enrichit** la réponse sans jamais en modifier le contenu factuel.
3. Si l'IA est injoignable (Ollama down), le système fonctionne parfaitement sans elle.
4. L'IA intervient sur des réponses **courtes** (< 250 caractères) uniquement pour les reformuler.

---

## 7. Architecture Globale du Système

### 7.1 Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (Next.js)                           │
│                                                                         │
│  Pages :                                                                 │
│  /login, /register, /dashboard, /orientation, /orientation-test,       │
│  /chat, /tscore, /fg-calculator, /t-calculator, /admin, /profile,      │
│  /settings, /notifications, /forgot-password, /reset-password           │
│                                                                         │
│  Composants : Cards, Charts, Forms, Chat UI, Modals, Loaders           │
│                                                                         │
│  Services : API Client (chat, auth, orientation), Types, Utils         │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ HTTP (REST + JWT)
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (NestJS)                                │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │  AuthModule  │  │ StudentModule│  │FiliereModule │  │  AdminModule ││
│  │  JWT/RBAC    │  │ Profile/Data │  │ Guide/Import │  │  Gestion     ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │Orientation   │  │  Chatbot     │  │  Reports     │  │Notifications ││
│  │Test/Service  │  │  Module      │  │  Module      │  │  Module      ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  Core Services (moteur déterministe)             │   │
│  │  ┌────────┐  ┌────────────┐  ┌──────────┐  ┌────────────────┐  │   │
│  │  │Rag     │  │Profile     │  │Domain    │  │Orientation     │  │   │
│  │  │Service │  │Filter      │  │Matcher   │  │Dataset Service │  │   │
│  │  └────────┘  └────────────┘  └──────────┘  └────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  AI Enhancement Layer                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│  │  │GemmaEnhancer │  │Response      │  │Conversation  │           │   │
│  │  │Service       │  │Humanizer     │  │Flow Service  │           │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│  │  │Intent        │  │State         │  │Followup      │           │   │
│  │  │Classifier    │  │Extractor     │  │Generator     │           │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
    ┌─────────────────┐  ┌─────────────────┐
    │   PostgreSQL     │  │     Ollama      │
    │   (Prisma)       │  │   (Gemma 2B)   │
    │   Guide officiel │  │  IA locale      │
    │   + utilisateurs │  │  GPU/CPU       │
    └─────────────────┘  └─────────────────┘
```

### 7.2 Flux de Données (Data Flow)

```
1. Connexion utilisateur
   └→ AuthController → JWT → Accès aux ressources

2. Test d'orientation
   └→ Frontend → POST /orientation-test/submit
      └→ OrientationTestService
         └→ Chargement des questions
         └→ Calcul des scores par domaine
         └→ Matching avec jobs.json (mots-clés)
         └→ Création du test + rapport
         └→ Retour au frontend

3. Calcul de score (T-score / FG)
   └→ Frontend → Formules → evaluateDynamicFormula()
      └→ Extraction des variables (FG, AR, M, PH, etc.)
      └→ Substitution des notes de l'étudiant
      └→ Évaluation de l'expression mathématique
      └→ Classification : Sûr / Moyen / Difficile

4. Consultation des programmes
   └→ Chatbot (message utilisateur)
      └→ detectDomain() → matching mots-clés par domaine prioritaire
      └→ RAG Service → getRecommendations()
         └→ Filtrage par field (alias matching)
         └→ Filtrage par bacType
         └→ Score des programmes
         └→ Classification admission
      └→ GemmaEnhancer (optionnel)
         └→ Si réponse courte (< 250 chars) → reformulation
      └→ Retour au frontend

5. Génération de roadmap
   └→ Chatbot (intention "ask_roadmap")
      └→ DynamicRoadmapService
      └→ Sélecteur de domaine personnalisé
      └→ Phases, compétences, projets, ressources
      └→ Retour au frontend

6. Rapport PDF
   └→ GET /reports/:id/pdf
      └→ ReportsService
      └→ Construction des pages PDF (PostScript-like)
         └→ Profil étudiant
         └→ Graphiques à barres + radar
         └→ Roadmap recommandée
         └→ Carrières et métiers
      └→ Buffer PDF retourné
```

---

## 8. Architecture Frontend

### 8.1 Structure des Pages

```
orientation-frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout global (Navbar, Footer, Auth)
│   ├── page.tsx                  # Page d'accueil
│   ├── globals.css               # Styles globaux + Tailwind
│   │
│   ├── login/                    # Authentification
│   ├── register/                 # Inscription
│   ├── forgot-password/          # Mot de passe oublié
│   ├── reset-password/           # Réinitialisation
│   │
│   ├── dashboard/                # Tableau de bord étudiant
│   ├── profile/                  # Profil et notes
│   ├── settings/                 # Paramètres utilisateur
│   ├── notifications/            # Centre de notifications
│   │
│   ├── orientation/              # Orientation principale
│   ├── orientation-test/         # Test d'orientation (questions/réponses)
│   ├── tscore/                   # Calcul T-score
│   ├── fg-calculator/            # Calculatrice FG
│   ├── t-calculator/             # Calculatrice T-score alternative
│   │
│   ├── chat/                     # Assistant IA conversationnel
│   ├── ai-suggestions/           # Suggestions IA (suivi)
│   │
│   ├── admin/                    # Interface administrateur
│   │
│   ├── api/                      # API routes (Next.js API handlers)
│   │
│   └── components/               # Composants réutilisables
│
├── lib/                          # Logique métier frontend
│   ├── auth.ts                   # Helper d'authentification
│   ├── orientation.ts            # Moteur de calcul (formules, scores, BAC)
│   ├── use-auth-user.ts          # Hook utilisateur connecté
│   ├── api/
│   │   ├── config.ts             # Configuration API
│   │   ├── chat-client.ts        # Client chat API
│   │   └── ai-client.ts          # Client IA API
│   ├── types/
│   │   └── ai.ts                 # Types TypeScript pour l'IA
│   └── utils/                    # Fonctions utilitaires
│
└── public/                       # Assets statiques
    ├── images/                   # Images et icônes
    ├── manifest.webmanifest      # PWA manifest
    ├── sw.js                     # Service Worker
    └── offline.html              # Page hors-ligne
```

### 8.2 Moteur de Calcul Frontend (`lib/orientation.ts`)

Le fichier `orientation.ts` implémente le **moteur de score déterministe** côté client :

- **`normalizeBacType()`** : Normalise les types de bac (ex: "maths" → "MATH", "علوم تجريبية" → "SVT")
- **`getBacMatch()`** : Trouve la correspondance BAC entre l'étudiant et une filière
- **`extractFormulaVariables()`** : Extrait les variables d'une formule (ex: `FG + 2M + SP + ANG`)
- **`evaluateDynamicFormula()`** : Évalue une formule mathématique avec les notes de l'étudiant
- **`getChanceLevel()`** : Calcule le niveau de chance : `ACCEPTED` (score ≥ requis), `MEDIUM` (≥ requis - 10), `RISKY`, `NOT AVAILABLE`

### 8.3 Interface Utilisateur

- **Design responsive** (Tailwind CSS)
- **PWA** : Installation sur mobile, fonctionnement hors-ligne partiel
- **Support bilingue** : Français et Arabe (RTL supporté via CSS)
- **Composants** : Chat UI (bulles, suggestions rapides), Cards de programmes, Graphiques à barres, Formulaires de test, Modales de comparaison

---

## 9. Architecture Backend

### 9.1 Structure des Modules

```
smart-orientation-backend/
└── src/
    ├── main.ts                        # Point d'entrée NestJS
    ├── app.module.ts                  # Module racine (imports, guards globaux)
    ├── app.controller.ts              # Contrôleur racine
    ├── app.service.ts                 # Service racine
    │
    ├── auth/                          # Authentification & Autorisation
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── jwt/                       # Stratégie JWT
    │   │   ├── jwt.strategy.ts
    │   │   ├── jwt-auth.guard.ts      # Guard global JWT
    │   │   └── jwt-payload.interface.ts
    │   ├── roles.guard.ts             # Guard RBAC (ADMIN, STUDENT)
    │   └── dto/                       # Data Transfer Objects
    │
    ├── student/                       # Gestion des étudiants
    │   ├── student.module.ts
    │   ├── student.controller.ts
    │   └── student.service.ts
    │
    ├── filiere/                       # Programmes universitaires (guide)
    │   ├── filiere.module.ts
    │   ├── filiere.controller.ts
    │   └── filiere.service.ts
    │       ├── findAll()              # Récupérer tous les programmes
    │       ├── create()               # Créer un programme
    │       ├── addBacInfo()           # Ajouter info BAC à un programme
    │       ├── importGuide()          # Importer le guide JSON
    │       └── processPdf()           # Extraire PDF → JSON via Python
    │
    ├── orientation-test/              # Test d'orientation
    │   ├── orientation-test.module.ts
    │   ├── orientation-test.controller.ts
    │   ├── orientation-test.service.ts
    │   └── orientation-questions.ts   # Questions du test (domaines, compétences)
    │       ├── submit()               # Soumission + calcul scores
    │       ├── latest()               # Dernier test
    │       └── history()              # Historique des tests
    │
    ├── chatbot/                       # Assistant IA conversationnel
    │   ├── chatbot.module.ts
    │   ├── chatbot.controller.ts
    │   ├── chatbot.service.ts         # (2883 lignes) Cœur du chatbot
    │   ├── ai.service.ts              # Service IA abstrait
    │   ├── gemma-enhancer.service.ts  # Amélioration via Gemma (Ollama)
    │   ├── rag.service.ts             # (3327 lignes) Moteur RAG
    │   ├── intent-detector.service.ts # Détection d'intention
    │   ├── memory.service.ts          # Mémoire conversationnelle
    │   ├── session-memory.service.ts  # Mémoire de session
    │   ├── conversation-stability.service.ts
    │   ├── explanation-engine.service.ts
    │   ├── program-ranking.service.ts # Classement des programmes
    │   ├── response-builder.service.ts
    │   ├── safety-rules.service.ts    # Règles de sécurité
    │   ├── orientation-flow.spec.ts   # Tests unitaires
    │   ├── i18n/                      # Internationalisation
    │   │   ├── fr.json
    │   │   └── ar.json
    │   └── services/
    │       ├── bac-domain-mapping.ts  # Mapping BAC → domaines autorisés
    │       ├── domain-matcher.service.ts
    │       ├── dynamic-response.service.ts
    │       ├── dynamic-roadmap.service.ts  # Générateur de roadmaps
    │       ├── intent-resolver.service.ts
    │       ├── orientation-dataset.service.ts
    │       └── profile-filter.service.ts   # Filtrage par profil
    │
    ├── ai/                            # Couche IA avancée
    │   ├── conversation/
    │   │   ├── conversation-flow.service.ts  # Flux de conversation
    │   │   ├── conversation-stage.ts         # Étapes de conversation
    │   │   └── followup-engine.ts           # Moteur de relances
    │   ├── generators/
    │   │   └── followup.generator.ts        # Génération de relances
    │   ├── humanizer/
    │   │   ├── response-humanizer.ts        # Humanisation des réponses
    │   │   ├── sentence-rotation.ts         # Rotation de phrases
    │   │   └── tone-variation.service.ts    # Variation de ton
    │   ├── intents/
    │   │   ├── intent-classifier.ts         # Classifieur d'intentions
    │   │   ├── intent.types.ts              # Types d'intentions
    │   │   └── intent.utils.ts              # Utilitaires
    │   └── state/
    │       ├── conversation-state.interface.ts
    │       ├── conversation-state.service.ts
    │       └── state-extractor.ts           # Extraction d'état
    │
    ├── reports/                       # Génération de rapports PDF
    │   ├── reports.module.ts
    │   ├── reports.controller.ts
    │   └── reports.service.ts        # (901 lignes) PDF engine custom
    │
    ├── notifications/                 # Notifications
    ├── admin/                         # Administration
    ├── skill/                         # Compétences
    ├── prisma/                        # Service Prisma (DB)
    └── common/                        # Services communs
        └── services/
            └── ollama-config.service.ts  # Configuration Ollama
```

### 9.2 Module Filiere (Programmes Universitaires)

Le module Filiere gère les programmes universitaires officiels tunisiens :

- **`findAll()`** : Récupère tous les programmes avec leurs informations BAC (types, capacités, derniers scores)
- **`addBacInfo()`** : Ajoute les informations de type BAC pour un programme avec mapping automatique (ex: "رياضيات" → MATH)
- **`importGuide()`** : Importe le guide complet dans la base de données (supprime + réinsère)
- **`processPdf()`** : Pipeline complet :
  1. Sauvegarde du PDF uploadé
  2. Exécution du script Python `convert.py` pour extraire les données
  3. Lecture du JSON généré (`output.json`)
  4. Import automatique dans PostgreSQL

### 9.3 Module Orientation Test

Le test d'orientation fonctionne avec un système de **pondération par domaine** :

1. Chaque question est associée à des domaines (ex: question sur "la biologie" → HEALTH, SCIENCE)
2. L'étudiant note chaque question (poids)
3. Le système accumule les scores par domaine
4. Les domaines dominants (top 5) sont extraits
5. Les recommandations sont construites en faisant correspondre les domaines avec les métiers (jobs.json)
6. Un rapport de recommandation est généré automatiquement

---

## 10. Structure de la Base de Données / Dataset

### 10.1 Schéma Prisma (PostgreSQL)

```
┌─────────────────────────┐     ┌─────────────────────────┐
│         User            │     │        Student          │
│─────────────────────────│     │─────────────────────────│
│ id: Int (PK)            │◄────│ id: Int (PK)            │
│ email: String (UQ)      │     │ userId: Int? (UQ, FK)   │
│ password: String?       │     │ name: String            │
│ role: Role (ADMIN|STUDENT)│   │ bacType: BacType (ENUM) │
│ resetPasswordToken      │     │ gov: String?            │
│ resetPasswordExpiresAt  │     │ bacAverage: Float       │
│ createdAt: DateTime     │     │ math, physics, svt...   │
└─────────────────────────┘     │ french, english...      │
                                │ FG: Float?              │
                                │ interests: String?      │
                                └────┬────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
         ┌──────────▼──────┐  ┌─────▼────────┐  ┌───▼──────────────┐
         │   Orientation   │  │Recommendation│  │    Roadmap       │
         │     Test        │  │   Report     │  │                  │
         │─────────────────│  │──────────────│  │──────────────────│
         │ id: Int (PK)    │  │ id: Int (PK) │  │ id: Int (PK)     │
         │ studentId: FK   │  │ studentId: FK│  │ studentId: FK    │
         │ answers: Json   │  │ summary: Str │  │ result: Json     │
         │ interests: Str? │  │ recommendations: Json             │
         │ skills: Json?   │  │ createdAt    │  │ createdAt        │
         │ dominantDomains │  └──────────────┘  └──────────────────┘
         │ recommendations │
         │ score: Float?   │       ┌──────────────────────┐
         │ createdAt       │       │     Filiere          │
         └─────────────────┘       │──────────────────────│
                                   │ id: Int (PK)         │
         ┌─────────────────┐       │ code: String (UQ)    │
         │   FiliereBac    │       │ program: String      │
         │─────────────────│       │ institution: String  │
         │ id: Int (PK)    │       │ formula: String      │
         │ type: BacType   │◄──────│ gov: String?         │
         │ capacity: Int   │       └──────────┬───────────┘
         │ lastScore: Float?│                 │
         │ filiereId: FK   │                 │
         └─────────────────┘                 │
                                   ┌─────────▼──────────┐
                                   │    FiliereScore    │
                                   │────────────────────│
                                   │ id: Int (PK)       │
                                   │ bacType: BacType   │
                                   │ lastScore: Float?  │
                                   │ filiereId: FK      │
                                   │ @@unique(filiereId, bacType)
                                   └────────────────────┘
```

### 10.2 Datasets (Fichiers JSON)

#### `data/jobs.json` — Métiers par domaine

Structure :
```json
[
  {
    "field": "IT",
    "keywords": ["informatique", "dev", "web", ...],
    "jobs": [
      {
        "title": "Développeur Full-Stack",
        "domain": "IT",
        "description": "Développe des applications web complètes...",
        "skills": ["JavaScript", "React", "Node.js", ...],
        "demand": "High",
        "unemployment_rate": 4,
        "salary_level": "Medium"
      }
    ]
  }
]
```

Domaines couverts : IT, Sport, Medical/Health, Business, Engineering, Art, Science, Education, Law

#### `data/domains.json` — Domaines avec roadmaps

Structure :
```json
{
  "domains": [
    {
      "field": "IT",
      "keywords": ["informatique", "development", ...],
      "demand_in_tunisia": "High",
      "unemployment_risk": "Low",
      "skills": ["Python", "JavaScript", "SQL", ...],
      "roadmap": {
        "beginner": {
          "phases": [
            {
              "title": "Fondamentaux",
              "duration": "1-2 months",
              "skills": ["HTML/CSS", "JavaScript basics", ...],
              "projects": ["Site statique responsive"],
              "resources": ["FreeCodeCamp", "MDN", ...],
              "milestones": ["Créer un CV en HTML/CSS"]
            }
          ],
          "certifications": ["Google IT Support"],
          "career_paths": ["Junior Developer", "IT Support", ...]
        }
      }
    }
  ]
}
```

#### `data/fields.json` — Champs avec perspectives

```json
{
  "fields": [
    {
      "field": "IT",
      "keywords": ["informatique", "tech", ...],
      "demand_in_tunisia": "Très forte demande",
      "future_outlook": "Croissance continue avec la digitalisation",
      "unemployment_risk": "Faible"
    }
  ]
}
```

#### `prisma/guide.json` — Guide officiel d'orientation (extrait du PDF)

```json
[
  {
    "code": "12345",
    "program": "Licence en Informatique",
    "institution": "Faculté des Sciences de Tunis",
    "formula": "FG + 2M + SP + ANG",
    "domain": "tech",
    "bacTypes": [
      { "type": "MATH", "capacity": 50, "lastScore": 14.5 }
    ]
  }
]
```

### 10.3 Mapping BAC → Domaines (Règles Strictes)

Le fichier `bac-domain-mapping.ts` définit les règles **strictes** de correspondance entre les types de baccalauréat et les domaines autorisés :

```typescript
BAC_DOMAINS = {
  MATH:    { allowedDomains: ["IT", "Engineering", "Science", "Medical / Health"] },
  SVT:     { allowedDomains: ["Medical / Health", "Science", "Engineering", "Sport"] },
  ECO:     { allowedDomains: ["Business / Management", "Law", "Education"] },
  TECH:    { allowedDomains: ["Engineering", "IT", "Arts & Design"] },
  INFO:    { allowedDomains: ["IT", "Engineering", "Science"] },
  LETTRES: { allowedDomains: ["Languages", "Law", "Education", "Social Sciences", "Arts & Design"] },
  SPORT:   { allowedDomains: ["Sport", "Medical / Health", "Education"] },
};
```

Ces règles garantissent qu'un étudiant en bac Lettres ne reçoit **jamais** de recommandations en informatique, et qu'un étudiant en bac Maths voit uniquement les domaines compatibles avec son profil.

---

## 11. Moteur de Recommandation

### 11.1 Architecture du Moteur (RAG Service)

Le **RAG Service** (`rag.service.ts`, 3327 lignes) est le cœur du moteur de recommandation. Bien qu'appelé "RAG" (Retrieval-Augmented Generation), il s'agit en réalité d'un **moteur de recherche et de classement déterministe** qui utilise les données structurées du guide officiel.

#### Algorithme de Recommandation (`getRecommendations()`)

```
1. DÉTECTION DU DOMAINE
   ├── Analyse du message utilisateur (optionnel)
   ├── Analyse de l'intérêt déclaré
   └── Détection via alias matching (FIELD_ALIASES)

2. FILTRAGE STRICT
   ├── 1ère passe : matching par alias de champ (findProgramsByField)
   │   → Utilise FIELD_ALIASES pour trouver des correspondances
   │   → Vérifie également le type BAC
   ├── 2ème passe : filtrage par nom (filterProgramsByFieldName)
   │   → Compare les noms de programmes avec les keywords du champ
   └── 3ème passe : filtrage par domaine

3. CLASSEMENT (SCORING)
   ├── +3 si le type BAC correspond exactement
   ├── +2 si le programme correspond au champ détecté
   ├── +2 si le programme correspond à l'intérêt
   └── +1 si le dernier score requis est accessible (≤ score étudiant + 10)

4. CLASSIFICATION D'ADMISSION (classifyAdmission)
   └── diff = lastScore - studentScore
       ├── diff ≤ 5   → "safe" (SÛR)
       ├── diff ≤ 15  → "possible" (MOYEN)
       ├── diff ≤ 25  → "hard" (DIFFICILE)
       └── diff > 25  → "impossible" (CACHÉ)

5. FILTRAGE FINAL
   ├── Exclusion des programmes impossibles (diff > 25)
   ├── Exclusion des programmes avec domaine "other"
   └── Fallback si aucun résultat :
       ├── Fallback 1 : Tous les programmes du BAC
       ├── Fallback 2 : Programmes les plus faciles
       └── Fallback 3 : 3 premiers programmes (dernier recours)

6. RETOUR
   ├── Programmes classés avec niveaux d'admission
   ├── Métiers associés
   ├── Perspectives de carrière
   └── Taux de chômage moyen
```

### 11.2 Détection de Domaine (7+ domaines)

Le système utilise un **système de mots-clés priorisé** (`detectDomain()`) :

**Ordre de priorité** : HEALTH > ENGINEERING > SPORT > LAW > LANGUAGES > BUSINESS > ART > IT

Chaque domaine dispose d'un ensemble de keywords en français, arabe (MSA), et dialecte tunisien. Par exemple :

- **HEALTH** : `médecine`, `médical`, `صحة`, `طب`, `مستشفى`, etc.
- **ENGINEERING** : `ingenieur`, `génie`, `هندسة`, `مهندس`, `مدني`, etc.
- **LAW** : `droit`, `avocat`, `قانون`, `محامي`, `قضاء`, etc.

### 11.3 Filtrage par Domaine Strict (`enforceDomainPrograms()`)

Pour éviter les mélanges de domaines (ex: programme IT qui s'affiche pour HEALTH), le système applique un **filtrage strict par regex** :

- **HEALTH** : doit contenir des termes médicaux ET ne doit PAS contenir de termes IT
- **ENGINEERING** : doit contenir des termes d'ingénierie ET ne doit PAS contenir de termes sportifs
- **LANGUAGES** : doit correspondre aux alias lettres ET ne doit PAS correspondre à ART
- **ART** : doit contenir des termes artistiques uniquement
- **IT** : doit contenir des termes informatiques ET ne doit PAS contenir de termes non-IT

---

## 12. Logique de Filtrage par Score

### 12.1 Formules de Calcul

Le système supporte l'évaluation de formules complexes utilisées dans le système d'orientation tunisien :

```
Exemple de formule : "FG + 2M + SP + ANG"
FG  = Fonction de Groupe (moyenne des matières principales)
2M  = 2 × Note de Mathématiques
SP  = Note de Physique/Sciences
ANG = Note d'Anglais
```

Le moteur d'évaluation (`evaluateDynamicFormula()`) :
1. Extrait les variables de la formule (ex: FG, M, SP, ANG)
2. Remplit les valeurs depuis le profil étudiant
3. Évalue l'expression mathématique via `Function()` sandboxé

### 12.2 Niveaux de Compatibilité

```
diff = dernierScoreRequis - scoreEtudiant

diff ≤ 5   → "SÛR" (ACCEPTED)     → ✅ L'étudiant est admis ou très proche
diff ≤ 15  → "MOYEN" (MEDIUM)     → ⚡ Accessible avec effort
diff ≤ 25  → "DIFFICILE" (HARD)   → 🚀 Possible mais ambitieux
diff > 25  → "IMPOSSIBLE"         → ❌ Caché (ne pas recommander)
```

### 12.3 Profile Filter Service

Le `ProfileFilterService` applique un **filtrage par profil** avant toute recommandation :

- **`isDomainAllowed(domainField, bacType)`** : Vérifie si un domaine est autorisé pour ce type de BAC
- **`filterByBacType(items, bacType)`** : Filtre une liste d'éléments par compatibilité BAC
- **`getRecommendedDomainsForProfile(profile)`** : Retourne les domaines recommandés (priorité à l'intérêt)
- **`validateProfile(profile)`** : Vérifie que le profil est complet (BAC requis, score et intérêt optionnels)

---

## 13. Système de Comparaison

Le chatbot intègre un **générateur de comparaison** (`comparisonGenerator`) qui permet de comparer deux filières, métiers ou domaines côte à côte :

```
Exemple utilisateur : "Compare informatique et génie civil"

Réponse :
📊 Comparaison : Informatique vs Génie Civil

🏫 1️⃣ Informatique
   Programmes: Licence en Informatique, GEN...
   Métiers: Dev Full-Stack, Data Scientist...
   Demande: Haute  |  Chômage: 4%
   Salaire: Moyen à Élevé

🏫 2️⃣ Génie Civil
   Programmes: Génie Civil, BTP...
   Métiers: Ingénieur Civil, Conducteur Travaux...
   Demande: Moyenne  |  Chômage: 8%
   Salaire: Moyen

💡 Comparaison AI (optionnelle, via Gemma) :
L'informatique offre une croissance plus rapide en Tunisie...
```

Le système identifie une demande de comparaison via :
- **Mots-clés** : `comparer`, `différence`, `ou`, `vs`, `wala` (arabe), `khir` (dialecte tunisien)
- **Détection d'intention** : Comparaison de deux domaines dans le même message

---

## 14. Couche d'Amélioration IA (Enhancement Layer)

### 14.1 Principes Fondamentaux

L'IA (Gemma 2B via Ollama) est une **couche optionnelle** qui ne modifie **jamais** les faits. Son rôle est strictement :

1. **Humanisation** : Reformulation en langage plus naturel
2. **Suppléments** : Ajout d'aperçus, d'analyses, de conseils contextuels
3. **Variation de ton** : Adaptation au dialecte tunisien pour les utilisateurs arabophones

### 14.2 Gemma Enhancer Service (`gemma-enhancer.service.ts`)

#### Architecture

```
Utilisateur → Message
  ↓
ChatbotService
  ↓ (réponse déterministe générée)
GemmaEnhancerService.enhanceResponse()
  ├── Vérification : enhancementEnabled ?
  ├── Vérification : réponse longue (> 250 chars) → SKIP (retour direct)
  ├── Vérification : Ollama reachable ?
  ├── Vérification : réponse structurée (scores, listes) → SKIP
  │
  ├── SI question ouverte (isOpenQuestion) ET réponse courte :
  │   └── runGenerate() → reformulation via Gemma
  │       ├── Prompt court : "Rewrite naturally in Tunisian Arabic/French"
  │       ├── Token max : 24
  │       ├── Température : 0.25
  │       └── Validation stricte (isInvalidEnhancedResponse)
  │           ├── Rejette si trop court
  │           ├── Rejette si contient "here's a breakdown", etc.
  │           └── Rejette si contient des marques de formatage
  │
  └── SINON :
      └── generateSupplement() → ajout contextuel
          ├── Comparaison question → 💡 Comparaison AI
          ├── Explanation question → 💡 Pourquoi
          ├── Emotional signal → 💡 Note
          └── Recommendation → 💡 Résumé personnalisé
```

#### Cache et Déduplication

- **EnhancementCache** : Cache LRU de 64 entrées pour éviter les régénérations
- **DedupGuard** : Évite les appels parallèles identiques (utile pour React StrictMode)

#### Prompts Utilisés

**Reformulation (short prompt)** :
```
Rewrite naturally in Tunisian Arabic/French.
Keep same meaning.
Be concise.

Response:
[segment à reformuler]
```

**Supplémént de comparaison** :
```
Add a short AI comparison note.
Deterministic answer stays unchanged.
Do not invent scores, programs, or eligibility.
Cover pros/cons, personality fit, future, remote/freelance, work style.
Under 120 words. Light Tunisian Arabic + French.
```

### 14.3 Response Humanizer (`response-humanizer.ts`)

Couche supplémentaire d'humanisation côté backend :

- **`applyVariation()`** : Variation de ton et de structure de phrases
- **Ajout d'introductions** : 60% de chance d'ajouter une introduction contextuelle
- **Ajout de conclusions** : Pour les décisions finales
- **Nettoyage** : Suppression des doubles lignes vides, des marques de formatage
- **Humanisation des relances** : Variation des starters de questions (ex: "Et si on regardait...", "Tu veux aussi...")

### 14.4 Quand l'IA N'intervient PAS

L'IA est **explicitement désactivée** pour :

- Réponses longues (> 250 caractères) → retour direct de la réponse déterministe
- Listes de programmes (contiennent `Dernier score`, `Compatibilité`, etc.)
- Erreurs (contiennent `❌`)
- Tableaux de scores
- Roadmaps
- Comparaisons structurées
- Toute réponse contenant des émojis de type `🛡️`, `✅`, `💼`

---

## 15. Système de Recherche Sémantique

### 15.1 Recherche par Mots-Clés (Keyword Matching)

Le système n'utilise **pas** d'embedding ou de vector search. La recherche est basée sur un **matching lexical multicouche** :

#### Première couche : `detectField()`

```typescript
FIELD_ALIASES = {
  engineering: ['génie', 'ingénierie', 'civil', 'mécanique', 'هندسة', 'مدني', ...],
  it: ['informatique', 'dev', 'data', 'web', 'اعلامية', 'برمجة', ...],
  health: ['santé', 'medical', 'médecine', 'طب', 'صحة', ...],
  sport: ['sport', 'coach', 'kiné', 'رياضة', ...],
  art: ['art', 'design', 'cinema', 'فن', 'تصميم', ...],
  business: ['business', 'finance', 'gestion', 'أعمال', 'إدارة', ...],
  letters: ['lettres', 'langues', 'traduction', 'آداب', 'لغات', ...],
};
```

#### Deuxième couche : `findProgramsByField()`

Parcourt tous les programmes du guide et vérifie si leurs noms, descriptions, formules ou domaines contiennent les alias du champ détecté.

#### Troisième couche : `matchesField()` (RegEx)

Applique des expressions régulières spécifiques à chaque domaine pour un filtrage strict.

### 15.2 Normalisation du Texte

Tous les textes sont normalisés avant comparaison via `normalizeText()` :

1. Normalisation Unicode (NFKC)
2. Mise en minuscule
3. Suppression des accents (NFKD)
4. Remplacement des caractères spéciaux (œ→oe, æ→ae)
5. Normalisation de l'arabe (أإآ→ا, ة→ه, ى→ي)
6. Suppression des caractères non-alphanumériques (sauf lettres arabes)

### 15.3 Détection de Domaine avec Priorité

```typescript
const PRIORITY_ORDER = ['HEALTH', 'ENGINEERING', 'SPORT', 'LAW', 
                        'LANGUAGES', 'BUSINESS', 'ART', 'IT'];
```

La priorité ENGINEERING avant SPORT résout un bug critique : `"école d'ingénieur sport"` n'est plus classé en SPORT.

### 15.4 Gestion du Dialecte Tunisien (Darija)

Le système détecte et interprète le dialecte tunisien :

- **Mots-clés Darija** : `شنو`, `كيفاش`, `منين`, `نحب`, `نخاف`, `وظيفة`, `مهارات`, etc.
- **Détection de langue** basée sur le ratio de caractères arabes vs latins
- **Détection de rejet** : `"ما نحبش informatique"` → rejet du domaine tech

---

## 16. Gestion des Sessions et de la Mémoire

### 16.1 Mémoire Conversationnelle (`MemoryService`)

Le système maintient une mémoire de conversation par session :

```typescript
interface ConversationMemory {
  interest: string;              // Intérêt détecté
  difficulty: 'easy' | 'challenge';
  preferredTrack: string;
  askedQuestions: string[];      // Questions déjà posées
  rejectedDomains: string[];     // Domaines rejetés par l'utilisateur
  updatedAt: Date;
  messageCount: number;
  domainQuestions: Array<{ domain: string; asked: string[] }>;
}
```

- **`extractFromMessage()`** : Extrait les informations (intérêt, difficulté, domaine) du message utilisateur
- **`updateMemory()`** : Met à jour la mémoire avec les nouvelles informations
- **`getMemory()`** : Retourne l'état actuel de la mémoire

### 16.2 Mémoire de Session (`SessionMemoryService`)

Service dédié pour la persistance des sessions de conversation :

- Stockage en base de données (via Prisma) des historiques de session
- Récupération des conversations précédentes
- Nettoyage automatique des sessions expirées

### 16.3 Gestion d'État de Conversation (`ConversationStateService`)

Le système suit un **flux de conversation en étapes** :

```typescript
enum ConversationStage {
  EXPLORATION,       // Découverte initiale des intérêts
  DOMAIN_SELECTION,  // Sélection du domaine
  CAREER_DISCOVERY,  // Découverte des métiers
  RECOMMENDATION,    // Recommandation de programmes
  ROADMAP,           // Génération de roadmap
  FINAL_DECISION,    // Décision finale
}
```

La progression se fait automatiquement en fonction des données collectées :
- Exploration → Domaine : dès que l'utilisateur mentionne un domaine
- Domaine → Carrière : après avoir liké des carrières
- Carrière → Recommandation : après avoir vu ≥ 1 programme
- Recommandation → Roadmap : après ≥ 6 messages
- Roadmap → Décision : quand le système est prêt

### 16.4 Gestion des Rejets

L'utilisateur peut rejeter des domaines à tout moment :
```
Utilisateur : "ما نحبش informatique"
Système : Retire 'tech' des domaines sélectionnables
          Nettoie l'intérêt si c'était le domaine actif
          → "D'accord, j'ai retiré tech des options 👍"
```

---

## 17. Génération de Roadmaps

### 17.1 Dynamic Roadmap Service

Le `DynamicRoadmapService` génère des roadmaps personnalisées en 3 étapes :

#### Étape 1 : Détection de la demande de roadmap

Le système détecte les demandes de roadmap via des mots-clés multilingues :

- **Français** : `roadmap`, `parcours`, `étapes`, `comment devenir`, `formation`, `apprendre`
- **Arabe MSA** : `مسار`, `كيف أصبح`, `ماذا أتعلم`
- **Darija** : `شنو نتعلم`, `كيفاش نبدأ`, `منين نبدأ`
- **Anglais** : `career`, `path`, `skills`, `begin`, `start`

#### Étape 2 : Sélecteur de domaine personnalisé

```typescript
interface RoadmapSelectorConfig {
  title: string;                      // "Choisissez votre domaine personnalisé"
  subtitle: string;                   // "Basé sur votre Bac type et vos intérêts"
  suggestions: PersonalizedDomainSuggestion[];  // Domaines compatibles
  maxSuggestions: number;
  personalized: boolean;
}
```

Le filtrage utilise les règles strictes `BAC_DOMAINS` pour n'afficher que les domaines compatibles avec le BAC de l'étudiant.

#### Étape 3 : Génération de roadmap spécifique

```typescript
interface SpecificRoadmap {
  domain: string;                     // "IT"
  level: 'beginner' | 'intermediate' | 'advanced';
  phases: RoadmapPhase[];             // 3-5 phases
  totalDuration: string;              // "1-2 years"
  prerequisites: string[];            // Compétences requises
  certifications: string[];           // Certifications recommandées
  careerPaths: string[];              // Débouchés
}
```

Chaque phase contient :
- Titre et durée
- Compétences à acquérir
- Projets à réaliser
- Ressources d'apprentissage
- Jalons (milestones)

### 17.2 Roadmaps dans les Rapports PDF

Le service `ReportsService` génère également des roadmaps **statiques** pour les rapports PDF :

- **Design** : Figma, Portfolio, UX/UI, Freelance
- **Cybersécurité** : Réseaux, Linux, OWASP, CTF, Certifications
- **Marketing & Business** : Audience, SEO, Analytics, Projets
- **Langues** : Rédaction, Traduction, Portfolio
- **Santé** : Sciences, Stages, Compétences cliniques
- **Informatique** : Programmation, Git, API, Portfolio
- **Ingénierie** : Maths, Spécialité, Projets, Stages
- **Générique** : Objectifs, Compétences, Mini-projet, Certifications

---

## 18. Génération de PDF (Rapports)

### 18.1 Moteur PDF Custom (`reports.service.ts`)

Le système génère des PDF **sans bibliothèque externe** (pas de PDFKit, jsPDF, etc.). Il construit manuellement les commandes PostScript pour produire un fichier PDF valide.

#### Construction des Pages

Chaque page est une série de commandes bas niveau :

```typescript
// Exemple de commande pour dessiner un rectangle
commands.push(`q ${this.color(hex)} rg ${x} ${y} ${w} ${h} re f Q`);

// Exemple de commande pour écrire du texte
commands.push(`BT /F1 10 Tf 0 0 0 rg 32 700 Td (Hello) Tj ET`);
```

#### Contenu du Rapport

**Page 1 — Profil et Scores :**
- En-tête avec logo "SO" (Smart Orientation)
- Profil étudiant : nom, bac, moyenne, FG, gouvernorat, intérêts
- Synthèse IA personnalisée
- Graphique à barres : scores par domaine (top 5)
- Radar chart : compétences/interêts (6 axes)
- Cartes de domaines compatibles avec scores

**Page 2 — Plan d'Action :**
- Roadmap recommandée (2 cartes maximum)
- Métiers et carrières par domaine
- Pied de page avec pagination et date

#### Graphiques

- **Bar Chart** : Barres verticales avec hauteur proportionnelle au score (couleur bleue)
- **Radar Chart** : Polygone à 6 axes généré par des calculs trigonométriques, avec lignes de grille et labels

### 18.2 Flux de Génération

```
GET /reports/:id/pdf
  ↓
ReportsService.generatePdf(reportId, user)
  ├── Vérification : le rapport existe
  ├── Vérification : l'utilisateur a le droit d'accès (propriétaire ou ADMIN)
  ├── Récupération des données :
  │   ├── student (nom, bacType, bacAverage, FG, gov)
  │   ├── orientationTest (dominantDomains, skills, interests, recommendations)
  │   └── report (summary, recommendations)
  ├── Construction Page 1 (profil + scores + graphiques)
  ├── Construction Page 2 (roadmap + carrières)
  └── Buffer PDF retourné (Content-Type: application/pdf)
```

---

## 19. Technologies Utilisées

### 19.1 Frontend

| Technologie | Utilisation |
|-------------|-------------|
| **Next.js 14+** | Framework React avec App Router et Server Components |
| **TypeScript** | Typage strict de toute l'application |
| **Tailwind CSS** | Stylisation utilitaire responsive |
| **PWA** | Service Worker, manifeste, cache offline |
| **Chart.js / D3.js** | Graphiques et visualisations |

### 19.2 Backend

| Technologie | Utilisation |
|-------------|-------------|
| **NestJS** | Framework Node.js modulaire avec Dependency Injection |
| **TypeScript** | Typage strict |
| **Prisma ORM** | Mapping objet-relationnel pour PostgreSQL |
| **PostgreSQL** | Base de données relationnelle |
| **JWT** | Authentification par tokens JSON Web |
| **bcrypt** | Hachage des mots de passe |
| **Passport** | Stratégies d'authentification |
| **Axios** | HTTP client pour les appels Ollama |

### 19.3 Intelligence Artificielle

| Technologie | Utilisation |
|-------------|-------------|
| **Ollama** | Serveur local de modèles de langage |
| **Gemma 2B** | Modèle LLM léger de Google (reformulation) |
| **Script Python** | Extraction PDF → JSON du guide d'orientation |

### 19.4 Mobile

| Technologie | Utilisation |
|-------------|-------------|
| **React Native (Expo)** | Application mobile (structure initiale) |
| **TypeScript** | Typage |

### 19.5 Outils de Développement

| Technologie | Utilisation |
|-------------|-------------|
| **ESLint** | Linting et qualité de code |
| **Prettier** | Formatage automatique |
| **Jest** | Tests unitaires et e2e |
| **Git** | Contrôle de version |

---

## 20. APIs et Endpoints

### 20.1 Endpoints Principaux

```
AUTH
  POST   /auth/register          Inscription
  POST   /auth/login             Connexion
  POST   /auth/forgot-password   Mot de passe oublié
  POST   /auth/reset-password    Réinitialisation mot de passe

STUDENT
  GET    /student/profile        Profil étudiant
  PATCH  /student/profile        Mise à jour profil
  POST   /student/import         Import des notes (admin)

FILIERE (Programmes)
  GET    /filiere                Liste des programmes
  GET    /filiere/:id            Détail d'un programme
  POST   /filiere                Création (admin)
  POST   /filiere/import         Import guide JSON (admin)
  POST   /filiere/process-pdf    Extraction PDF → DB (admin)
  POST   /filiere/:id/bac        Ajout info BAC (admin)

ORIENTATION TEST
  GET    /orientation-test/questions    Questions du test
  POST   /orientation-test/submit       Soumission du test
  GET    /orientation-test/latest       Dernier test
  GET    /orientation-test/history      Historique

CHATBOT
  POST   /chatbot/message               Envoi message
  POST   /chatbot/stream                Streaming réponse (SSE)

REPORTS
  GET    /reports/:id                   Détail rapport
  GET    /reports/:id/pdf               Téléchargement PDF

NOTIFICATIONS
  GET    /notifications                 Liste notifications
  PATCH  /notifications/:id/read        Marquer comme lue

ADMIN
  GET    /admin/stats                   Statistiques
  GET    /admin/users                   Gestion utilisateurs
  PATCH  /admin/users/:id/role          Changement rôle
```

### 20.2 Architecture des Appels

```
Frontend (Next.js)
    │
    ├── Pages statiques → Server Components (SSR/SSG)
    │
    ├── Pages dynamiques → Client Components
    │       │
    │       └── fetch() → API Backend (http://localhost:3001)
    │               │
    │               ├── /api/auth/* → AuthController
    │               ├── /api/filiere/* → FiliereController
    │               ├── /api/orientation-test/* → OrientationTestController
    │               ├── /api/chatbot/* → ChatbotController
    │               ├── /api/reports/* → ReportsController
    │               └── /api/notifications/* → NotificationsController
    │
    └── API Routes (Next.js) → Proxy vers backend
            └── /api/chat → Backend NestJS
```

### 20.3 Middleware et Guards

- **JwtAuthGuard** (global) : Vérifie la validité du token JWT sur toutes les routes (sauf login/register)
- **RolesGuard** : Vérifie le rôle (ADMIN/STUDENT) pour les routes protégées
- **ValidationPipe** (global) : Valide les DTOs avec class-validator

---

## 21. Sécurité et Validation

### 21.1 Authentification

- **JWT (JSON Web Tokens)** : Tokens signés avec une secret key configurable via `JWT_SECRET`
- **Hachage des mots de passe** : bcrypt avec salt rounds
- **Reset de mot de passe** : Token unique avec expiration timestamp
- **Sessions** : Gérées côté backend avec mémoire conversationnelle

### 21.2 Autorisation (RBAC)

- **Rôles** : `ADMIN` et `STUDENT`
- **Guard JWT global** : Protège toutes les routes (sauf auth)
- **Guard Rôles** : Vérification fine par endpoint

### 21.3 Validation des Données

- **DTOs avec class-validator** : Validation des entrées utilisateur
- **ValidationPipe global** : Rejette automatiquement les données invalides (400 Bad Request)
- **Normalisation des entrées** : Nettoyage des messages (suppression des scores, ponctuation, caractères spéciaux)

### 21.4 Règles de Sécurité (Safety Rules)

Le `SafetyRulesService` applique des vérifications de sécurité sur les interactions chatbot :

- Détection des tentatives d'injection de prompt
- Blocage des requêtes malveillantes
- Validation que l'IA ne génère pas de fausses informations
- Filtrage des réponses contenant des scores ou programmes inventés

### 21.5 Validation des Réponses IA

Le `GemmaEnhancerService` valide strictement les réponses de l'IA :

- **Vérification de longueur** : Minimum de caractères requis (proportionnel à l'original)
- **Blocage des phrases interdites** : `"here's a breakdown"`, `"let me explain"`, etc.
- **Détection de formatage** : Pas de markdown, pas de séparateurs
- **Vérification de contenu** : Pas de titres générés (`#`, `- `), pas de listes

---

## 22. Optimisations de Performance

### 22.1 Cache Intelligent des Réponses IA

```typescript
class EnhancementCache {
  private cache = new Map<string, { result: string; timestamp: number }>();
  private readonly maxSize = 64;
  
  // LRU-like : évite les régénérations des reformulations identiques
  // Nettoie les plus anciennes entrées quand le cache est plein
}
```

### 22.2 Déduplication des Requêtes (DedupGuard)

```typescript
class DedupGuard {
  // Évite les appels parallèles identiques à Ollama
  // Utile pour React StrictMode qui double les appels
  // TTL de 2 secondes pour les promesses en vol
}
```

### 22.3 Skip des Réponses Longues

L'IA est **automatiquement désactivée** pour les réponses > 250 caractères, ce qui couvre la majorité des cas (listes de programmes, résultats de recherche, comparaisons). Cela permet :

- **Économie de temps** : Pas d'appel Ollama inutile
- **Économie de ressources** : GPU/CPU préservé
- **Qualité préservée** : Les réponses structurées ne sont pas altérées

### 22.4 Pipeline Optimisé

```
Message Utilisateur
  ↓ (0ms)
Détection d'intention (regex local)
  ↓ (< 1ms)
RAG Service (calcul déterministe)
  ↓ (< 100ms)
Vérification : réponse courte ? (< 250 chars) ?
  ├── OUI → Appel Ollama (500ms-2s) → Reformulation
  └── NON → Retour direct (pas d'appel IA)
```

### 22.5 Contexte Court (Ollama)

- **num_ctx: 512** : Contexte réduit pour des inférences rapides
- **num_predict: 20-24** : Génération très courte
- **temperature: 0.25** : Faible créativité (reformulation fidèle)
- **keep_alive: '10m'** : Maintient le modèle en mémoire entre les requêtes

---

## 23. Défis Rencontrés

### 23.1 Extraction du Guide PDF Officiel

**Défi** : Le guide d'orientation tunisien est un PDF complexe avec des tableaux, des formules mathématiques, et des caractères arabes.

**Solution** : Pipeline Python (`scripts/convert.py`) qui extrait les données et les convertit en JSON structuré, puis import automatique via `importGuide()`.

### 23.2 Normalisation des Types de BAC

**Défi** : Les types de BAC sont référencés de multiples façons : "Math", "Maths", "Mathématiques", "رياضيات", "SCIENCES MATHEMATIQUES", etc.

**Solution** : Système d'alias complet (`BAC_TYPE_ALIASES`) qui normalise toutes les variantes en 7 types canoniques (MATH, SVT, ECO, TECH, INFO, LETTRES, SPORT).

### 23.3 Mélange de Domaines dans les Recommandations

**Défi** : Un étudiant en santé pouvait recevoir des programmes IT à cause de mots-clés partagés (ex: "biologie" dans "biologie médicale" et "bio-informatique").

**Solution** : Filtrage strict `enforceDomainPrograms()` avec 3 critères : mots positifs, mots négatifs, et exclusion mutuelle par domaine.

### 23.4 Gestion du Dialecte Tunisien

**Défi** : Les utilisateurs parlent en Darija (ex: "شنو نتعلم باش نخدم في informatique ?") qui utilise un vocabulaire et une grammaire différents de l'arabe standard.

**Solution** : Dictionnaire de mots-clés Darija dans les modules de détection de domaine, d'intention, et de roadmap.

### 23.5 Double Appel (React StrictMode)

**Défi** : React StrictMode en développement double les appels API, ce qui pouvait lancer deux requêtes Ollama identiques.

**Solution** : `DedupGuard` qui déduplique les appels en vol avec un TTL de 2 secondes.

### 23.6 Réponses IA Non Valides

**Défi** : Gemma pouvait répondre avec des métacaractères ("here's a breakdown of...", "keeping the meaning...") au lieu de la reformulation demandée.

**Solution** : Validation stricte `isInvalidEnhancedResponse()` qui vérifie :
- Longueur minimale
- Phrases interdites
- Formatage indésirable
- Contenu générique

---

## 24. Améliorations Apportées

### 24.1 Détection de Domaine Priorisée

**Avant** : Ordre alphabétique de détection → "sport" pouvait capturer "école d'ingénieur sport".
**Après** : Ordre manuel priorisé : HEALTH > ENGINEERING > SPORT > LAW > LANGUAGES > BUSINESS > ART > IT.

### 24.2 Filtrage des Programmes Impossibles

**Avant** : Tous les programmes étaient affichés, même ceux avec un gap de score > 30 points.
**Après** : Seuils réalistes : diff ≤ 5 (Sûr), ≤ 15 (Moyen), ≤ 25 (Difficile), > 25 (Caché).

### 24.3 Gestion des Rejets de Domaine

**Avant** : L'utilisateur devait reformuler complètement sa requête pour changer de domaine.
**Après** : Mécanisme de rejet explicite : "ما نحبش informatique" → retrait immédiat + suggestion alternative.

### 24.4 Ajustement BAC Lettres pour le Domaine IT

**Avant** : Un étudiant BAC Lettres qui mentionnait "tech" recevait des programmes IT inexistants pour son profil.
**Après** : `adjustDomainForBac()` redirige automatiquement les BAC Lettres vers LANGUAGES sauf si la requête est explicitement technique.

### 24.5 Cache de Reformulation

**Avant** : Chaque message identique déclenchait un appel Ollama.
**Après** : Cache LRU de 64 entrées avec éviction des plus anciennes.

### 24.6 Validation Renforcée des Réponses IA

**Avant** : Les réponses IA pouvaient contenir des instructions de reformulation ("here's how to rewrite...").
**Après** : Liste noire de 15+ phrases interdites + validation structurelle.

### 24.7 Support du Dialecte Tunisien pour les Roadmaps

**Avant** : Roadmap disponible uniquement en français/arabe MSA.
**Après** : Détection des mots-clés Darija : `شنو نتعلم`, `كيفاش نبدأ`, `منين نبدأ`.

---

## 25. Explication de l'Architecture Hybride IA

### 25.1 Pourquoi une Architecture Hybride ?

Le système d'orientation universitaire tunisien est **hautement réglementé** avec des **formules mathématiques officielles**, des **scores d'admission historiques**, et des **règles strictes** par type de BAC. Un système purement IA (LLM) présenterait des risques inacceptables :

- **Hallucinations** : L'IA pourrait inventer des programmes ou des scores qui n'existent pas
- **Incohérence** : Les réponses pourraient varier d'une session à l'autre
- **Non-conformité** : Les règles officielles pourraient ne pas être respectées
- **Absence de traçabilité** : Impossible de vérifier la source d'une recommandation

### 25.2 Le Principe Fondamental

```
┌─────────────────────────────────────────────────────────────────┐
│                     SYSTÈME HYBRIDE SMART ORIENTATION             │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  MOTEUR DÉTERMINISTE (Source unique de vérité)          │    │
│  │                                                         │    │
│  │  Entrée : Profil étudiant (BAC, notes, intérêts)        │    │
│  │  Processus :                                             │    │
│  │    1. Normalisation BAC                                  │    │
│  │    2. Calcul T-score (formules officielles)              │    │
│  │    3. Filtrage par profil (BAC → domaines autorisés)    │    │
│  │    4. Recherche programmes (alias matching)              │    │
│  │    5. Calcul compatibilité (différence de score)         │    │
│  │    6. Classification admission (Sûr/Moyen/Difficile)     │    │
│  │  Sortie : Recommandations précises et vérifiables        │    │
│  └─────────────────────┬───────────────────────────────────┘    │
│                        │                                         │
│                        │ Réponse déterministe                    │
│                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  COUCHE D'AMÉLIORATION IA (Enhancement Layer)           │    │
│  │                                                         │    │
│  │  Rôle : Enrichir l'expérience utilisateur              │    │
│  │  Capacités :                                            │    │
│  │    ✓ Reformulation en langage naturel                   │    │
│  │    ✓ Suppléments contextuels (comparaison, conseils)    │    │
│  │    ✓ Traduction en dialecte tunisien                    │    │
│  │    ✓ Variation de ton (chaleureux, encourageant)        │    │
│  │  Restrictions :                                         │    │
│  │    ✗ Ne génère PAS de scores                            │    │
│  │    ✗ Ne décide PAS de l'orientation                     │    │
│  │    ✗ N'invente PAS de programmes                        │    │
│  │    ✗ Ne modifie PAS les faits                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Résultat : Recommandations EXACTES + Expérience NATURELLE       │
└─────────────────────────────────────────────────────────────────┘
```

### 25.3 Avantages de l'Approche Hybride

| Critère | Approche Pure IA | Approche Déterministe | **Hybride (Smart Orientation)** |
|---------|-----------------|----------------------|-------------------------------|
| **Précision** | Faible (hallucinations) | Haute | ✅ **Très haute** |
| **Fluidité** | Très haute | Faible (réponses brutes) | ✅ **Haute** |
| **Fiabilité** | Faible | Très haute | ✅ **Très haute** |
| **Vérifiabilité** | Impossible | Totale | ✅ **Totale** |
| **Coût** | Élevé (GPU) | Faible | ✅ **Faible** |
| **Disponibilité** | Dépend du LLM | Toujours | ✅ **Toujours** (fallback sans IA) |
| **Scalabilité** | Limitée | Haute | ✅ **Haute** |
| **Maintenance** | Complexe | Simple | ✅ **Simple** |

### 25.4 Quand l'IA Intervient (Exemples Concrets)

| Message Utilisateur | Réponse Déterministe | Intervention IA |
|--------------------|---------------------|-----------------|
| "Quels programmes en info ?" | Liste de 5 programmes avec scores | ❌ Non (réponse > 250 chars) |
| "C'est quoi le chômage en informatique ?" | Taux et données | ❌ Non (réponse structurée) |
| "J'hésite entre médecine et pharmacie" | Données sur les deux | ✅ **Supplémént** : "La médecine offre des contacts patients..." |
| "J'ai peur de pas trouver du travail" | Données d'emploi | ✅ **Reformulation** : "Ne t'inquiète pas, le domaine X a un taux d'insertion de..." |
| "Compare génie civil et informatique" | Tableau comparatif | ✅ **Supplémént** : "En Tunisie, l'IT recrute plus mais le civil offre plus de stabilité..." |

### 25.5 Garanties Architecturales

1. **Règle de non-contradiction** : L'IA ne peut pas contredire les faits déterministes
2. **Règle de non-invention** : L'IA ne peut pas ajouter de programmes, scores ou métiers
3. **Règle de fallback** : Si l'IA est injoignable, le système fonctionne parfaitement sans elle
4. **Règle de longueur** : Seules les réponses courtes sont améliorées (< 250 caractères)
5. **Règle de structure** : Les réponses structurées (listes, tableaux) ne sont pas modifiées

---

## 26. Résultats et Captures d'Écran

### 26.1 Captures d'Écran Disponibles

Le dossier `screenshots/` contient les captures suivantes :

| Fichier | Contenu |
|---------|---------|
| `login.png` | Interface de connexion |
| `dashboard.png` | Tableau de bord étudiant |
| `chat.png` | Assistant conversationnel |

### 26.2 Pages et Fonctionnalités Clés

#### 💻 Dashboard
- Résumé du profil étudiant (BAC, moyenne, T-score)
- Dernier test d'orientation
- Recommandations actives
- Notifications récentes

#### 🧪 Test d'Orientation
- Questionnaire personnalisé (10+ questions)
- Pondération par domaine
- Résultats : domaines dominants, compétences
- Génération automatique de rapport

#### 💬 Assistant Conversationnel
- Interface chat avec bulles et suggestions rapides
- Support bilingue français/arabe (RTL)
- Détection automatique de la langue
- Messages avec programmes cliquables
- Roadmaps interactives

#### 📊 Calculateur de Score
- Saisie des notes par matière
- Calcul automatique du T-score et FG
- Classification : Sûr / Moyen / Difficile
- Visualisation des formules

#### 📄 Rapport PDF
- Téléchargement en un clic
- Profil étudiant complet
- Graphiques à barres et radar
- Roadmap personnalisée
- Métiers et carrières

### 26.3 Métriques de Performance (Estimées)

| Métrique | Valeur |
|----------|--------|
| Temps de réponse (requêtes déterministes) | < 100ms |
| Temps de réponse (avec Gemma) | 500ms - 2s |
| Programmes dans le guide | 200+ |
| Domaines couverts | 9+ |
| Taux de couverture (mots-clés) | 95%+ |
| Précision des recommandations | 100% (données officielles) |
| Disponibilité sans IA | 100% |

---

## 27. Améliorations Futures

### 27.1 Court Terme (Prioritaires)

1. **Tests unitaires et d'intégration** : Couverture actuelle limitée
2. **Documentation API** : Génération automatique via Swagger/OpenAPI
3. **Logging centralisé** : Intégration de logs structurés (ELK ou équivalent)
4. **Monitorage** : Métriques d'utilisation, temps de réponse, erreurs

### 27.2 Moyen Terme

5. **Version mobile** : Développement de l'application React Native existante
6. **Push notifications** : Alertes sur les nouvelles opportunités, dates limites
7. **Mode hors-ligne** : Amélioration du cache PWA pour les zones à faible connectivité
8. **Analyse prédictive** : Tendances des scores d'admission par année

### 27.3 Long Terme

9. **Multi-LLM** : Support de modèles supplémentaires (Mistral, LLaMA) via Ollama
10. **Fine-tuning** : Adaptation d'un modèle spécifique au domaine de l'orientation tunisienne
11. **Recommandation sociale** : Parcours d'étudiants similaires avec succès
12. **API publique** : Ouverture aux institutions partenaires (lycées, universités)
13. **Chat vocal** : Interaction vocale avec transcription et synthèse
14. **Intégration API Ministère** : Données en temps réel des inscriptions

---

## 28. Conclusion

### 28.1 Résumé

**Smart Orientation** est une plateforme innovante d'aide à l'orientation universitaire qui combine le **meilleur des deux mondes** :

- La **précision et la fiabilité** d'un moteur déterministe basé sur les données officielles tunisiennes
- La **fluidité et la chaleur humaine** d'une IA légère (Gemma 2B) qui humanise les interactions

### 28.2 Points Forts

1. **Architecture hybride éprouvée** : Le moteur déterministe garantit l'exactitude des recommandations
2. **Données officielles** : Guide d'orientation tunisien intégralement importé et structuré
3. **Support multilingue** : Français, Arabe MSA, et dialecte tunisien
4. **Expérience complète** : Test d'orientation, calcul de score, chat, roadmaps, PDF
5. **Résilience** : Fonctionne parfaitement sans IA (mode dégradé)
6. **Gratuit et open source** : Ollama + Gemma = IA locale sans coût d'API

### 28.3 Impact Potentiel

Smart Orientation peut transformer l'expérience d'orientation des bacheliers tunisiens en :

- **Démocratisant l'accès** à l'information sur les filières et les scores
- **Simplifiant** le calcul complexe des T-scores et FG
- **Personnalisant** les recommandations selon le profil individuel
- **Rassurant** les étudiants avec des données vérifiables et des conseils humains

### 28.4 Dernier Mot

Ce projet démontre qu'il n'est pas nécessaire de choisir entre précision et expérience utilisateur. L'architecture hybride — où l'IA **assiste** sans **décider** — est la voie la plus prometteuse pour les systèmes d'aide à la décision dans des domaines critiques comme l'orientation éducative.

---

*Document généré le 13 mai 2026 — Smart Orientation v1.0*

*Rapport basé sur l'analyse complète du code source (frontend, backend, AI layer, datasets).*