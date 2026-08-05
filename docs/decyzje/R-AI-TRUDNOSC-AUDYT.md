# R-AI-TRUDNOSC-AUDYT — rozwój major AI vs poziomy trudności

**Status:** 🔵 W TOKU · AutoBot Operator · Maciej 2026-08-05  
**Scope:** **tylko major AI** (nie miasta-państwa / defensiveCopy / typCityCopy)  
**Cel:** (1) audyt — co najbardziej psuje rozwój AI; (2) plan usprawnień **per poziom** 1=Prosty / 2=Normalny / 3=Trudny.

## ECHO (cytat)
> przy okazji, zrób audyt trudności AI, co wpływa najbardziej na to, że AI źle sobie radzi z rozwojem. Mówię głównie o głównych AI, nie o państwach miastach. I zrób plan działania, co możemy jeszcze usprawnić na każdym poziomie trudności, z podziałem na poziomy trudności, żeby AI lepiej sobie radziło. Wszystko zgodnie z zasadą Autobot.

## Kontekst już wdrożony (nie powtarzaj jako „brak”)
- FALA 226: P-AI-MOC-BONUS (startowe jednostki/miasta, bonusWalka, bonusNauka) — major only
- FALA 226: P-AI-008 — threat: jednostki+rozwój zamiast murów
- FALA 220: AI-MANAGE auto-zarządca major; early wzrost/Spichlerz; AI-FOUND/LOCAL
- `ai-params.json` + `loadDifficultyParams` w `ai.ts`
- `ai-difficulty-bonus.ts`

## Deliverable Operatora
Plik ten uzupełnić sekcjami:

### A — Mapa dźwigni (co realnie czyta kod)
Tabela: parametr / poziom 1–2–3 wartości z JSON / czy podpięty / wpływ na **rozwój** (produkcja, żywność, budynki, ulepszenia, nauka, ekspansja).

### B — Top przyczyny słabego rozwoju (rank 1…N)
Z dowodem w kodzie (plik:funkcja). Oddziel: bug/martwy wiring vs zły balans vs zła polityka AI (scoring).

### C — Plan działań per poziom trudności
Dla **Prosty / Normalny / Trudny** osobno:
- Quick wins (params JSON, bez redesignu)
- Średnie (scoring `chooseCityProduction` / economy tick)
- Duże (nowe zachowania — wymaga ABC)

Każdy punkt: **efekt na rozwój** + **ryzyko** + **czy ABC**.

### D — Propozycja kolejności wdrożeń (max 8 pozycji P0–P2)
Bez otwierania nowych wątków poza tym audytem. **Bez deploy / bez kodu** w tej turze Operatora — tylko audyt+plan w docs (+ ewentualnie rejestr).

## Zakazy
- Nie mieszać MP w rekomendacjach „wzmocnij AI”
- Nie `npm run build` / nie deploy / nie merge main
- AutoBot: po audycie → Evaluator → Grok prezentuje Maciejowi
