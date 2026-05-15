# 🔧 GUIDE TECHNIQUE DÉTAILLÉ
## Architecture Hybride - Explications et Diagrammes

---

## 📐 Diagramme 1: Architecture 3-Niveaux

```
┌──────────────────────────────────────────────────────────┐
│         UTILISATEUR (Web ou Mobile App)                  │
└──────────────────────┬───────────────────────────────────┘
                       │ Message utilisateur
                       ↓
        ┌──────────────────────────────────┐
        │   FRONTEND (Next.js + React)     │
        │  - Chat Widget                   │
        │  - Forms & Input                 │
        │  - Display Results               │
        │  - Local State Management        │
        └──────────────────┬───────────────┘
                           │ HTTP/REST API
                           ↓
        ┌─────────────────────────────────────────────────────────────┐
        │              BACKEND (NestJS)                               │
        │  ┌──────────────────────────────────────────────────────┐   │
        │  │  CHATBOT CONTROLLER (HTTP Endpoint)                 │   │
        │  │  - Route: POST /chatbot/message                     │   │
        │  │  - Parse request                                    │   │
        │  │  - Validate input                                   │   │
        │  └────────────────┬─────────────────────────────────────┘   │
        │                   │                                          │
        │  ┌────────────────▼─────────────────────────────────────┐   │
        │  │  🧠 CHATBOT SERVICE (ORCHESTRATOR)                  │   │
        │  │                                                      │   │
        │  │  Task: Coordinate all sub-services                  │   │
        │  │  Input: { message, userId, language }              │   │
        │  │  Output: { response, intent, recommendations }      │   │
        │  └────────────────┬─────────────────────────────────────┘   │
        │                   │                                          │
        │                   ├──────────────────────────────────────────┤
        │                   │                                          │
        │  ┌────────────────▼──────────┐  ┌──────────────────────┐   │
        │  │ IntentDetectorService     │  │ LanguageDetector    │   │
        │  ├────────────────────────────┤  ├──────────────────────┤   │
        │  │ Detect question type:      │  │ French or Arabic?   │   │
        │  │ - ask_programs             │  │ Regex: [\u0600...]  │   │
        │  │ - ask_jobs                 │  │ Adjust response     │   │
        │  │ - ask_comparison           │  │ accordingly         │   │
        │  │ - ask_roadmap              │  │                    │   │
        │  │ - rejection                │  │                    │   │
        │  │ - greeting                 │  │                    │   │
        │  │ - general                  │  │                    │   │
        │  └────────────────────────────┘  └──────────────────────┘   │
        │                                                              │
        │  ┌──────────────────────────────────────────────────────┐   │
        │  │ ProfileFilterService                                │   │
        │  ├──────────────────────────────────────────────────────┤   │
        │  │ Validate student profile:                           │   │
        │  │ - Retrieve from DB: BAC type, Score, Interests      │   │
        │  │ - Check allowed domains for this BAC                │   │
        │  │ - Filter all subsequent data                        │   │
        │  │                                                      │   │
        │  │ BAC_DOMAINS mapping:                                │   │
        │  │ MATH    → [IT, Engineering, Physics, ...]           │   │
        │  │ SVT     → [Medicine, Pharmacy, Biology, ...]        │   │
        │  │ INFO    → [IT, Software, Networks, ...]             │   │
        │  │ ECO     → [Business, Economics, Management, ...]    │   │
        │  └──────────────────────────────────────────────────────┘   │
        │                                                              │
        │  ┌──────────────────────────────────────────────────────┐   │
        │  │ DomainMatcherService (SEMANTIC MATCHING)            │   │
        │  ├──────────────────────────────────────────────────────┤   │
        │  │ Match user query to domains:                        │   │
        │  │                                                      │   │
        │  │ 1. Normalize text:                                  │   │
        │  │    - lowercase                                      │   │
        │  │    - remove accents (preserve Arabic diacritics)    │   │
        │  │    - trim whitespace                                │   │
        │  │                                                      │   │
        │  │ 2. Search in order:                                 │   │
        │  │    a. Domain aliases (10 pts per match)             │   │
        │  │    b. Keywords (5 pts per match)                    │   │
        │  │    c. Education programs (2 pts per match)          │   │
        │  │    d. Field names (1 pt per match)                  │   │
        │  │                                                      │   │
        │  │ 3. Score and sort:                                  │   │
        │  │    Top scoring domain wins                          │   │
        │  │                                                      │   │
        │  │ Returns: Domain object + confidence score           │   │
        │  └──────────────────────────────────────────────────────┘   │
        │                                                              │
        │  ┌──────────────────────────────────────────────────────┐   │
        │  │ RAGService (DETERMINISTIC RECOMMENDATIONS)          │   │
        │  ├──────────────────────────────────────────────────────┤   │
        │  │ Main logic engine:                                  │   │
        │  │                                                      │   │
        │  │ Step 1: Load data for domain                        │   │
        │  │ Step 2: Filter by BAC compatibility (strict)        │   │
        │  │ Step 3: Filter by score range                       │   │
        │  │ Step 4: Score each program:                         │   │
        │  │    - Base: admission level (0-100 pts)              │   │
        │  │    - Bonus: interest match (+20 pts)                │   │
        │  │    - Bonus: high demand (+10 pts)                   │   │
        │  │ Step 5: Rank by score (descending)                  │   │
        │  │ Step 6: Return top N (typically 10)                 │   │
        │  │                                                      │   │
        │  │ Output: RankedProgram[] with:                       │   │
        │  │ - program metadata                                  │   │
        │  │ - rankScore (0-130)                                 │   │
        │  │ - admissionLevel (safe|possible|hard|impossible)    │   │
        │  │ - admissionGap (score diff from threshold)          │   │
        │  │ - matchedKeywords (explanation)                     │   │
        │  └──────────────────────────────────────────────────────┘   │
        │                                                              │
        │  ┌──────────────────────────────────────────────────────┐   │
        │  │ MemoryService (CONVERSATION STATE)                  │   │
        │  ├──────────────────────────────────────────────────────┤   │
        │  │ Track conversation context:                         │   │
        │  │ - Current domain being discussed                    │   │
        │  │ - Rejected domains/topics                           │   │
        │  │ - Last question type                                │   │
        │  │ - Conversation stage (intro→decision)               │   │
        │  │ - Turn count                                        │   │
        │  │                                                      │   │
        │  │ Update memory after each turn                       │   │
        │  │ Prevent repetitive questions                        │   │
        │  │ Generate smart follow-ups                           │   │
        │  └──────────────────────────────────────────────────────┘   │
        │                                                              │
        │  ┌──────────────────────────────────────────────────────┐   │
        │  │ ResponseBuilderService (FORMAT OUTPUT)              │   │
        │  ├──────────────────────────────────────────────────────┤   │
        │  │ Build deterministic response:                       │   │
        │  │ - Take all gathered data                            │   │
        │  │ - Structure in logical order                        │   │
        │  │ - Add explanations                                  │   │
        │  │ - Choose language (FR/AR)                           │   │
        │  │ - Generate raw response string                      │   │
        │  │                                                      │   │
        │  │ Output: Plain text response (NO fancy formatting)   │   │
        │  └──────────────────────────────────────────────────────┘   │
        │                                                              │
        │  ┌──────────────────────────────────────────────────────┐   │
        │  │ ⭐ GemmaEnhancerService (OPTIONAL LLM LAYER)        │   │
        │  ├──────────────────────────────────────────────────────┤   │
        │  │ Humanize response (COSMETIC ONLY):                  │   │
        │  │                                                      │   │
        │  │ 1. Check if Ollama healthy:                         │   │
        │  │    If not available → SKIP, return raw response     │   │
        │  │                                                      │   │
        │  │ 2. Check enhancement cache:                         │   │
        │  │    If already enhanced → return from cache          │   │
        │  │                                                      │   │
        │  │ 3. Build Gemma prompt:                              │   │
        │  │    "Make this more friendly, same facts"            │   │
        │  │                                                      │   │
        │  │ 4. Call Ollama API:                                 │   │
        │  │    POST /api/generate                               │   │
        │  │                                                      │   │
        │  │ 5. Validate enhanced response:                      │   │
        │  │    - Check length (not too verbose)                 │   │
        │  │    - Verify key keywords retained                   │   │
        │  │    - If validation fails → return raw response      │   │
        │  │                                                      │   │
        │  │ 6. Cache result + return                            │   │
        │  │                                                      │   │
        │  │ CRITICAL: NEVER change core facts!                  │   │
        │  │ LLM can only reformulate, not override              │   │
        │  └──────────────────────────────────────────────────────┘   │
        │                                                              │
        │  └──────────────────────────────────────────────────────┐   │
        │     Final Response Assembly                           │   │
        │     ├─ Enhanced response (or raw if no enhancement)    │   │
        │     ├─ Metadata (intent, confidence, etc.)             │   │
        │     ├─ Follow-up suggestions                           │   │
        │     └─ JSON format for frontend                        │   │
        │  ──────────────────────────────────────────────────────┘   │
        │                                                              │
        └──────────────────────────────┬───────────────────────────────┘
                                       │ JSON Response
                                       ↓
        ┌──────────────────────────────────────────────────────┐
        │         DATABASE (PostgreSQL)                        │
        │  - User profiles                                     │
        │  - Student data (BAC, score, interests)              │
        │  - Conversation history                              │
        │  - Recommendations & reports                         │
        └──────────────────────────────────────────────────────┘
                                       ↑
                         ┌─────────────────────────────┐
                         │  Ollama (Local LLM Server)  │
                         │  - Gemma2:2b model          │
                         │  - /api/generate endpoint   │
                         │  - ~2-3 sec response time   │
                         └─────────────────────────────┘
```

---

## 📊 Diagramme 2: Flux Détaillé d'une Recommandation

```
╔═══════════════════════════════════════════════════════════════════╗
║  USER SENDS MESSAGE: "Je veux faire du développement web"         ║
╚═════════════════════════╤═════════════════════════════════════════╝
                          ↓
        ┌─────────────────────────────────────┐
        │ 1. MESSAGE PREPROCESSING            │
        ├─────────────────────────────────────┤
        │ Input: raw message string           │
        │ cleanMessage():                     │
        │  - Remove "(mon score: xx)"         │
        │  - Remove "?" characters            │
        │  - Remove punctuation               │
        │  - Normalize whitespace             │
        │  - lowercase                        │
        │  - KEEP accents (génie → génie)    │
        │ Output: cleaned message             │
        └────────────┬────────────────────────┘
                     │
        ┌────────────▼─────────────────────┐
        │ 2. LANGUAGE DETECTION           │
        ├──────────────────────────────────┤
        │ Regex: /[\u0600-\u06FF]/         │
        │ If Arabic chars → lang = 'ar'    │
        │ Else → lang = 'fr'               │
        └────────────┬─────────────────────┘
                     │ lang = 'fr'
        ┌────────────▼──────────────────────┐
        │ 3. INTENT DETECTION              │
        ├───────────────────────────────────┤
        │ Check message against patterns:   │
        │ - ask_programs? (filière, fac)   │
        │ - ask_jobs? (travail, emploi)    │
        │ - ask_comparison? (vs, ou)       │
        │ - ask_roadmap? (parcours)        │
        │ - rejection? (pas, nope)         │
        │ - greeting? (bonjour, salam)     │
        │                                   │
        │ Result: intent = 'ask_programs'  │
        └────────────┬─────────────────────┘
                     │
        ┌────────────▼──────────────────────────────┐
        │ 4. FETCH STUDENT PROFILE               │
        ├────────────────────────────────────────────┤
        │ Query Database:                           │
        │ SELECT * FROM students                    │
        │ WHERE userId = {currentUser.id}           │
        │                                           │
        │ Retrieved:                                │
        │ - bacType: "MATH"                         │
        │ - score: 17.5                             │
        │ - interests: "développement, web"         │
        │ - FG: 16.8                                │
        └────────────┬───────────────────────────────┘
                     │
        ┌────────────▼──────────────────────────────┐
        │ 5. DOMAIN MATCHING (SEMANTIC)           │
        ├────────────────────────────────────────────┤
        │ DomainMatcherService.findMatches():       │
        │                                           │
        │ Normalize message:                        │
        │ "je veux faire développement web"         │
        │  → "je veux faire developpement web"      │
        │                                           │
        │ Search domains in order:                  │
        │ 1. Aliases:                               │
        │    - "dev" found → 10 pts                 │
        │    - "web" found → 10 pts                 │
        │                                           │
        │ 2. Keywords:                              │
        │    - "développement" → 5 pts              │
        │                                           │
        │ 3. Education:                             │
        │    - Found 2 matches → 4 pts              │
        │                                           │
        │ Total Score: 29/100                       │
        │ Matched Domain: "Software Engineering"    │
        └────────────┬───────────────────────────────┘
                     │
        ┌────────────▼──────────────────────────────┐
        │ 6. BAC COMPATIBILITY CHECK              │
        ├────────────────────────────────────────────┤
        │ ProfileFilterService.isDomainAllowed():   │
        │                                           │
        │ Query BAC_DOMAINS["MATH"]:                │
        │ allowedDomains = [                        │
        │   "Software Engineering", ← YES!          │
        │   "Data Science",                         │
        │   "Physics",                              │
        │   ...                                     │
        │ ]                                         │
        │                                           │
        │ Result: ALLOWED ✅                        │
        └────────────┬───────────────────────────────┘
                     │
        ┌────────────▼──────────────────────────────┐
        │ 7. LOAD PROGRAMS FOR DOMAIN             │
        ├────────────────────────────────────────────┤
        │ Load from databases/domains.json:         │
        │                                           │
        │ [                                         │
        │   {                                       │
        │     "code": "ING-2024",                   │
        │     "name": "Ingénieur Informatique",     │
        │     "institution": "INSAT",               │
        │     "bacTypes": [                         │
        │       {"type": "MATH", "lastScore": 16.5} │
        │     ]                                     │
        │   },                                      │
        │   ... more programs                       │
        │ ]                                         │
        └────────────┬───────────────────────────────┘
                     │
        ┌────────────▼──────────────────────────────┐
        │ 8. SCORE EACH PROGRAM                   │
        ├────────────────────────────────────────────┤
        │ For each program:                         │
        │                                           │
        │ Base Score = classifyAdmissionLevel():    │
        │  Student Score: 17.5                      │
        │  Program Threshold: 16.5                  │
        │  Gap: -1 (score better!)                  │
        │  → Level: "safe" (100 pts)                │
        │                                           │
        │ Interest Bonus = 0 (no specific mention)  │
        │ Demand Bonus = +10 (high demand)          │
        │                                           │
        │ FINAL SCORE: 100 + 0 + 10 = 110          │
        └────────────┬───────────────────────────────┘
                     │
        ┌────────────▼──────────────────────────────┐
        │ 9. RANK ALL PROGRAMS                    │
        ├────────────────────────────────────────────┤
        │ Sort by rankScore DESC:                   │
        │                                           │
        │ 1. Ingénieur INSAT: 110 (safe)           │
        │ 2. License FST: 85 (possible)             │
        │ 3. Master IT ENIT: 75 (hard)              │
        │ 4. Diplôme ISI: 70 (possible)             │
        │                                           │
        │ Return TOP 10                             │
        └────────────┬───────────────────────────────┘
                     │
        ┌────────────▼──────────────────────────────┐
        │ 10. EXTRACT JOBS & SKILLS              │
        ├────────────────────────────────────────────┤
        │ From jobs.json for "Software Eng":       │
        │                                           │
        │ [                                         │
        │   "Développeur Web",                      │
        │   "Développeur Full-Stack",               │
        │   "DevOps Engineer",                      │
        │   "Mobile Developer"                      │
        │ ]                                         │
        │                                           │
        │ Required Skills:                          │
        │ ["JavaScript", "React", "Node.js",       │
        │  "REST APIs", "Git"]                      │
        └────────────┬───────────────────────────────┘
                     │
        ┌────────────▼──────────────────────────────┐
        │ 11. BUILD DETERMINISTIC RESPONSE        │
        ├────────────────────────────────────────────┤
        │ ResponseBuilderService.build():           │
        │                                           │
        │ Response = `                              │
        │ Basé sur votre profil BAC MATH,           │
        │ score 17.5/20, vous avez accès à:        │
        │                                           │
        │ 📚 FILIERES RECOMMANDEES:                │
        │ 1. Ingénieur Informatique (INSAT)        │
        │    - Admission: SAFE (score au-dessus)   │
        │    - Demande marché: TRÈS ÉLEVÉE         │
        │                                           │
        │ 💼 DÉBOUCHÉS PRINCIPAUX:                 │
        │ - Développeur Web                        │
        │ - Full-Stack Developer                   │
        │ - DevOps Engineer                        │
        │                                           │
        │ 🛣️ ROADMAP: [beginner phases...]        │
        │ `                                        │
        └────────────┬───────────────────────────────┘
                     │
        ┌────────────▼──────────────────────────────┐
        │ 12. UPDATE MEMORY (CONTEXT)             │
        ├────────────────────────────────────────────┤
        │ MemoryService.updateMemory():             │
        │ - domain: "Software Engineering"          │
        │ - lastQuestionType: "ask_programs"        │
        │ - conversationTurn: 1                     │
        │ - conversationStage: "domain"             │
        │ - alreadyAskedQuestions: [message]        │
        └────────────┬───────────────────────────────┘
                     │
        ┌────────────▼──────────────────────────────┐
        │ 13. ⭐ ENHANCEMENT (OPTIONAL)            │
        ├────────────────────────────────────────────┤
        │ GemmaEnhancerService.enhance():           │
        │                                           │
        │ IF (Ollama available) THEN:               │
        │   1. Check cache                          │
        │   2. Build prompt:                        │
        │      "Rends ça amical, même sens"        │
        │   3. Call Ollama:                         │
        │      POST localhost:11434/api/generate    │
        │   4. Get response:                        │
        │      "Wa9t! C'est excellent ton         │
        │       profil! Informatique c'est        │
        │       l'avenir... 🚀"                   │
        │   5. Validate + Cache                     │
        │ ELSE:                                     │
        │   Use raw response                        │
        │                                           │
        │ Output: enhanced_response                 │
        └────────────┬───────────────────────────────┘
                     │
        ┌────────────▼──────────────────────────────┐
        │ 14. ASSEMBLE FINAL JSON RESPONSE        │
        ├────────────────────────────────────────────┤
        │ {                                         │
        │   "message": "Wa9t! [enhanced text]",    │
        │   "intent": "ask_programs",               │
        │   "domain": "Software Engineering",       │
        │   "confidence": 0.95,                     │
        │   "programs": [                           │
        │     {                                     │
        │       "name": "Ingénieur INSAT",         │
        │       "rankScore": 110,                   │
        │       "admissionLevel": "safe"            │
        │     }                                     │
        │   ],                                      │
        │   "jobs": ["Web Dev", ...],               │
        │   "skills": ["JavaScript", ...],          │
        │   "followUp": "Veux-tu voir roadmap?"    │
        │   "enhanced": true                        │
        │ }                                         │
        └────────────┬───────────────────────────────┘
                     │
╔═════════════════════▼═════════════════════════════════════════════╗
║  15. SEND TO FRONTEND & DISPLAY TO USER                          ║
║  - Rendered in Chat Widget                                       ║
║  - User sees friendly, accurate response                         ║
║  - Conversation continues...                                     ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 🔐 Diagramme 3: Authentication & Security Flow

```
┌─────────────────────────────┐
│   LOGIN PAGE (Frontend)     │
├─────────────────────────────┤
│ Email: student@email.com    │
│ Password: ••••••••          │
└────────────┬────────────────┘
             │
             ↓
    ┌────────────────────────────┐
    │ NextAuth validates form    │
    │ - Email format check       │
    │ - Password validation      │
    └────────────┬───────────────┘
                 │
                 ↓ POST /auth/login
    ┌────────────────────────────────────────┐
    │ AUTH SERVICE (Backend)                │
    ├────────────────────────────────────────┤
    │ 1. Find user in DB:                    │
    │    SELECT * FROM users                 │
    │    WHERE email = 'student@email.com'   │
    │                                        │
    │ 2. Hash password check:                │
    │    bcrypt.compare(inputPassword,       │
    │              storedHashedPassword)     │
    │    → Match? YES                        │
    │                                        │
    │ 3. Generate JWT Token:                 │
    │    jwt.sign({                          │
    │      sub: user.id,                     │
    │      email: user.email,                │
    │      role: user.role                   │
    │    }, JWT_SECRET, {                    │
    │      expiresIn: '24h'                  │
    │    })                                  │
    │                                        │
    │ 4. Return response:                    │
    │    {                                   │
    │      token: 'eyJhbGc...',             │
    │      user: { id, email, role }        │
    │    }                                   │
    └────────────┬───────────────────────────┘
                 │
                 ↓
    ┌────────────────────────────────┐
    │ NextAuth stores token in:      │
    │ - Secure HttpOnly cookie       │
    │ - Local session store          │
    └────────────┬───────────────────┘
                 │
                 ↓ Redirect
    ┌─────────────────────────────┐
    │ Dashboard Page Protected    │
    │ useSession() → user loaded  │
    └────────────┬────────────────┘
                 │
                 ↓ All subsequent requests
    ┌────────────────────────────────────────┐
    │ Authorization Header sent:             │
    │ GET /student/me                        │
    │ Headers: {                             │
    │   Authorization: "Bearer eyJhbGc..."   │
    │ }                                      │
    └────────────┬───────────────────────────┘
                 │
                 ↓
    ┌────────────────────────────────────────┐
    │ JwtAuthGuard (Backend):                │
    ├────────────────────────────────────────┤
    │ 1. Extract token from header           │
    │ 2. Verify token signature:             │
    │    jwt.verify(token, JWT_SECRET)       │
    │    → Valid? YES                        │
    │ 3. Check expiration                    │
    │    → Expired? NO                       │
    │ 4. Attach payload to request:          │
    │    request.user = {                    │
    │      userId: 123,                      │
    │      email: '...',                     │
    │      role: 'STUDENT'                   │
    │    }                                   │
    │ 5. Allow request to proceed            │
    └────────────┬───────────────────────────┘
                 │
                 ↓
    ┌────────────────────────────────────────┐
    │ RolesGuard (Backend):                  │
    ├────────────────────────────────────────┤
    │ 1. Check if route requires role        │
    │    @Roles('STUDENT', 'ADMIN')          │
    │ 2. Extract user role from request      │
    │    → 'STUDENT'                         │
    │ 3. Check if in allowed roles           │
    │    → 'STUDENT' ∈ ['STUDENT', 'ADMIN']? │
    │    → YES ✅                            │
    │ 4. Allow access to controller          │
    └────────────┬───────────────────────────┘
                 │
                 ↓
    ┌────────────────────────────────────────┐
    │ Controller Handler Executes:           │
    │ @Get('/me')                            │
    │ async getMe(@User() user) {            │
    │   // user = { userId, email, role }   │
    │   return this.studentService.me(user) │
    │ }                                      │
    └────────────┬───────────────────────────┘
                 │
                 ↓
    ┌────────────────────────────────────────┐
    │ Response sent to Frontend:             │
    │ { id, email, bacType, score, ... }    │
    │ Status: 200 OK                         │
    └────────────────────────────────────────┘
```

---

## 📱 Diagramme 4: Component Hierarchy (Frontend)

```
                        App Root
                           │
          ┌────────────────┼────────────────┐
          │                │                │
      Navbar          Sidebar         MainContent
          │                │                │
          ├─ Logo          ├─ Nav Links     ├─ Chat Button
          ├─ Language      ├─ User Info     │
          │  Switcher      └─ Logout        ├─ Dashboard or
          └─ Theme                          │  Page Content
             Toggle                        │
                                          └─ Floating Chat
                                             Widget

    Chatbot Component Tree:
    ├─ FloatingAIChat
    │  ├─ ChatWidget (expandable)
    │  │  ├─ ChatHeader
    │  │  ├─ ChatHistory
    │  │  │  └─ Message[] (role-based)
    │  │  ├─ ChatInput
    │  │  │  ├─ Textarea
    │  │  │  └─ SendButton
    │  │  └─ TypingIndicator
    │  └─ ChatModal (for full-screen)
    │
    └─ StudentRouteGuard
       └─ Protected Pages
          ├─ Dashboard
          ├─ Profile
          ├─ Orientation Test
          ├─ Chat Page
          ├─ Roadmap Display
          ├─ Comparison Table
          └─ Market Trends
```

---

## 🧪 Test Coverage

```
Unit Tests (80%+ coverage)
├─ Services:
│  ├─ IntentDetectorService ✅
│  ├─ DomainMatcherService ✅
│  ├─ ProfileFilterService ✅
│  ├─ RagService ✅
│  ├─ MemoryService ✅
│  └─ GemmaEnhancerService ✅
│
├─ Controllers:
│  ├─ ChatbotController ✅
│  ├─ StudentController ✅
│  ├─ OrientationTestController ✅
│  └─ ReportsController ✅
│
└─ Utilities:
   ├─ cleanMessage ✅
   ├─ normalizeText ✅
   ├─ scoreProgram ✅
   └─ classifyAdmissionLevel ✅

Integration Tests (60%+ coverage)
├─ Auth Flow (login → protected route)
├─ Chatbot Flow (message → response)
├─ Orientation Test (submit → results)
├─ Report Generation (generate → PDF)
└─ Database Operations (CRUD)
```

---

## 📈 Performance Metrics

```
Response Times Target:
┌────────────────────┬─────────────┐
│ Operation          │ Target      │
├────────────────────┼─────────────┤
│ Simple Intent      │ < 50ms      │
│ Semantic Match     │ < 100ms     │
│ Profile Filter     │ < 50ms      │
│ Ranking Programs   │ < 150ms     │
│ Enhancement (LLM)  │ 1-3s        │
│ Total Response     │ < 500ms*    │
│ PDF Generation     │ < 3s        │
│ Page Load          │ < 2s        │
└────────────────────┴─────────────┘
* Without LLM if unavailable
```

---

**Document Generated**: Mai 2026  
**Version**: 1.0  
**Technical Level**: Advanced (Architecture & Engineering)  

