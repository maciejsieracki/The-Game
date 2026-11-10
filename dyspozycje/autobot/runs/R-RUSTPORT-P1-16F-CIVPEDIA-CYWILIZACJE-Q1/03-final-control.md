STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-16F-CIVPEDIA-CYWILIZACJE-Q1
GOAL: Pełny audyt 9 haseł CivPedii „Cywilizacje" (bonusy poza „Strategią dla gracza", zamkniętą
wcześniej) wobec `gra/data/civ-matrix.json` i kodu konsumującego na pinie edb8fb56.

RUNDY: 1/5 (Operator → Evaluator 13 zarzutów — **istotny błąd metodologiczny**: Operator sprawdzał
WYŁĄCZNIE macierz `civ-matrix.json` i uznawał brak konsumenta w klasyfikatorze za „BLOCKED/martwe",
pomijając że realne zachowanie w grze idzie przez STARSZĄ ścieżkę `civs.json` bonusy[]/`civ-bonuses.ts`
— to odwróciło status 8+ pozycji (np. R-5 Rzymianie regeneracja poboru: Operator dał ZGODNE/REAL na
podstawie metadanych bez konsumenta, realnie w grze jest +100% nie +35% — NIEZGODNE-WARTOŚĆ; Z-2
Zulusi rekrutacja: Operator dał „kierunek odwrotny x1.10", realnie kod traktuje to jako ulgę -10% —
ZGODNE w skutku) → Obrona 13×PRZYJMUJE, przepisała analizę przez `civs.json`/`civ-bonuses.ts`/
`production.ts`/`manpower.ts`/`economy.ts` → Final Control 13×ODDAL, zweryfikowane niezależnie
przez `git show`/`git grep` na pinie dla każdego z 13 punktów).

ZMIANY/COMMIT: nowy plik `dyspozycje/rust-port/p1/P1-16F-CIVPEDIA-CYWILIZACJE.md`.

WYNIK (po korekcie): realne rozbieżności WARTOŚCI w runtime: Celtowie Uderzenie (+40% vs opis +15%),
Germanie Furia (+40% vs +15%, DWA wymiary: wartość i warunek — tylko runda szarży, nie „każde
starcie"), Egipt ruch rydwanów (+30%, suma dwóch pól macierzy, zgodne po scaleniu), **Rzymianie
regeneracja poboru NIEZGODNE-WARTOŚĆ (+100% w grze vs +35% w opisie)**. Kilka pozycji ZGODNE W
SKUTKU mimo że pole macierzy jest martwe (prawdziwy konsument to starsza ścieżka `civs.json`):
Rzymianie koszt budowy, Zulusi koszt rekrutacji. Baza regeneracji poboru NIEZGODNE-TEKST (CivPedia
„standard 10%" vs kod `DEFAULT_REGEN=2%`).

BLOKADY: brak. Jawnie otwarte (nie blokujące): mapowanie „na starciu" → runda szarży dla 2 cywilizacji,
konwencja znaku pola kosztu rekrutacji, zakres (obrona rydwanów) Sumerów S-4.

NASTĘPNY KROK: integracja orkiestratora. **To zamyka WSZYSTKIE 6/6 P1.16f — cały AUDYT-OPISY jest
teraz w pełni pokryty (wyczerpujący audyt zgodnie z decyzją właściciela 2026-10-21).** Następny krok:
`P1-GATE-SYNTHESIS`.
DEPLOY/PUSH: NIE WYKONANO
