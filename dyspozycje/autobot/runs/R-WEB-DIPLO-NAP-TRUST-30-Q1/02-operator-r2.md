STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — dyplomacja: bramka paktu o nieagresji
TEMAT: R-WEB-DIPLO-NAP-TRUST-30-Q1
GOAL: Pakt o nieagresji wymaga Relacji ≥ próg ORAZ Zaufania ≥ 30 dla gracza, AI i AI↔AI.
ZMIANY-COMMIT: baza aaece58c2 (Operator R1, kod). Commit R2 (poprawki po zarzutach): SHA w odpowiedzi końcowej orkiestratora (git log, pierwszy commit ponad aaece58c2).
  Zmienione: gra/src/game/diplomacy-locks.ts (fail-closed, fallback 30), gra/src/game/diplomacy-proposals.ts (fail-closed, przeniesiony blok Zaufania),
  gra/tools/diplo-nap-trust-30-test.cjs (sekcje C2 F1–F4 AI behawioralnie, B6/B7, E3), NOWY gra/tools/diplo-nap-trust-30-live-test.cjs (Chromium),
  dyspozycje/autobot/runs/R-WEB-DIPLO-NAP-TRUST-30-Q1/02-operator-r2.md, evidence/01 i 02 (zrzuty).
  ai.ts, diplomacy.json, main.ts: bez zmian w R2 (zostają z R1).

ODPOWIEDZI NA ZARZUTY
1. Brak testu behawioralnego AI — PRZYJMUJĘ. Dodano sekcję C2 w diplo-nap-trust-30-test.cjs: decideAIDiplomacy z bundla (jak T9k w ai-test.cjs).
   F1 score 109, Zaufanie 29 → brak zaproponuj_pakt; F2 Zaufanie 30 → jest; F3 granica 98/Zaufanie 30 → jest; F4 98/Zaufanie 29 → brak.
   Mutacja: usunięto `&& rel.relation.zaufanie >= dipP.progNapZaufanie` z ai.ts → test 22/25, FAIL: F1, F4, E1. Przywrócono, ai.ts identyczny z kopią (cmp).
2. Brak dowodu wizualnego (NIE_ZMIERZONO) — PRZYJMUJĘ. Zbudowano bundle Vite POZA repo (vite build --outDir w scratchpadzie, nie npm run build).
   diplo-nap-trust-30-live-test.cjs (headless Chromium, ?playtest=mapa): 6/6 OK, zero pageerror/console.error.
   V1: Zaufanie 29, Relacja 200 → przycisk data-aid=2 disabled, notka „zablokowana — wymaga Zaufania 30 (masz 29)”. Zrzut: evidence/01-pakt-zaufanie-29-zablokowany.png.
   V2: Zaufanie 30 → przycisk aktywny, bez notki. Zrzut: evidence/02-pakt-zaufanie-30-dostepny.png.
   Ustawienie: setAiPowerBonusForTest(AI,-1e6) (Relacja w panelu = zaufanie + respekt OBIEKTYWNY, main.ts audienceRelTotal, nie zapisany respekt) — dzięki temu izolowana jest sama bramka Zaufania.
3. progNapZaufanie opcjonalne = ciche wyłączenie bramki — PRZYJMUJĘ. (a) diplomacy-locks.ts: brak wartości → NAP_ZAUFANIE_FALLBACK = 30 (fail-closed, nie pominięcie).
   (b) diplomacy-proposals.ts evaluateProposal: `if (!(relation.zaufanie >= p.progNapZaufanie))` — brak wartości = odrzut.
   B6 w teście zmieniono z „bramka pominięta” na „bramka 30 działa”; dodano B7 (brak pola + Zaufanie 30 + Relacja OK → dostępny). Uzasadnienie zmiany asercji: stara B6 utrwalała obejście.
4. Notka „zablokowany” vs „zablokowana” — ODRZUCAM (kosmetyka, konwencja). Notkę buduje wspólny helper formatLockedNote (diplomacy-locks.ts:134) i dualGate (:177),
   z których korzystają też Sojusz i Otwarte granice: „zablokowana — wymaga …”. Dispatch podawał wzór ilustracyjnie. Zrzut 01 pokazuje identyczny format dla Sojuszu („zablokowana — wymaga Zaufania 91 (masz 29) i Relacji 151”).
5. Komentarz w evaluateProposal w środku bloku narzutu granicy — PRZYJMUJĘ. Blok Zaufania przeniesiony przed „C-DYP-STOL-Q1=B” (po bramce Wiarygodności); blok narzutu granicy wraca do swojego komentarza.
6. Otwarte kwestie (1–3) — PRZYJMUJĘ jako otwarte dla orkiestratora, bez zmian kodu w tym temacie.
   (1) Rozjazd UI/silnik potwierdzony pomiarem (test sekcja D, MEASURE): silnik Normalny 110 / Normalny+granica 130 / Trudny 120 / Trudny+granica 140; UI blokady: normal=110, hard=120 (bez narzutu +20 za granicę).
   (2) UPR (automatyczny NAP państw-miast): nie zbadane w pełni, nie zmieniane — decyzja właściciela.
   (3) Ręczna akceptacja propozycji AI przez gracza bez progów (C-DYP-Q1=A) — bez zmian.

TESTY (gra/, po npm ci --ignore-scripts; tsc --noEmit EXIT=0):
- diplo-nap-trust-30-test.cjs: 25/25 (EXIT=0). Mutacja AI: 22/25 (EXIT=1, jak wyżej).
- diplo-nap-trust-30-live-test.cjs: 6/6 (EXIT=0), Chromium, bundle poza repo.
- diplomacy-locks 88/0; diplomacy-test 148/0; diplomacy-acceptance-points 304/0; diplomacy-audience-actions 20/0; diplomacy-war-gates 22/0;
  diplomacy-treaties 17/17; dyplo-pakt-ekspansja-granica 26/26; dyplo-kara-granica-realna 10/0; wiarygodnosc 270/0; diplomacy-ai-balance 36/36; diplomacy-sensible-deals 63/0.
- Bez zmiany względem bazy d3e88b7d9 (zweryfikowane uruchomieniem bazy z git archive):
  granice-relacja-dyplomatyczna 3 FAIL (main.ts relationColorFn, identyczne nazwy w bazie); diplomacy-proposal 186/188 (pokój, pre-existing); ai-test 274/20 (pre-existing).

BLOKADY / NOTES:
- Otwarte decyzje właściciela: punkt 6 (1)–(3). Nie blokują tego tematu.
- Pliki pomocnicze testu (.nap-trust-30-*) są w gitignore; bundle scratch usunięte po pomiarach.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator weryfikuje R2 (diff, mutacja AI, live 6/6, zrzuty). Final Control po PASS. Orkiestrator rozstrzyga punkt 6.
DEPLOY/PUSH: NIE WYKONANO. Operator nie pushuje i nie deployuje. Deploy do roboczej i sprzątanie dysku po READY_FOR_DEPLOY należą do orkiestratora.
