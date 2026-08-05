# R-AI-TRUDNOSC-P2 — ABC (canAfford + L3 majorEarly)

**Status:** ✅ ZDEPLOYOWANE FALA 231 `283de421` (Maciej 1+2+3)  
**Źródło:** audyt `R-AI-TRUDNOSC-AUDYT.md` §D P2-1 / P2-2 · Maciej wybrał „3” po FALA 230  
**Scope:** tylko major AI (nie miasta-państwa)


## ECHO odpowiedzi (Maciej 2026-08-05)

> P2-Q1a / P2-Q2 a

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **P2-Q1** | **A** | Zostaw pustą turę gdy nic nie stać — **bez zmiany kodu** (status quo + zamknięcie tematu) |
| **P2-Q2** | **A** | Na Trudnym przy `startowe_miasta ≥ 1`: `majorEarly` max tura **= 25** |

## ECHO (kontekst)
Po P0/P1 w ROBOCZEJ (FALA 230) kolejka audytu: **P2** wymaga decyzji ABC przed kodem.

---

## Stan dziś (kod)

W `chooseCityProduction` (`gra/src/game/ai.ts`):
- gdy podano `canAfford` i **żaden** kandydat nie przechodzi bramki → **`return null`**
- miasto ma Pracę, ale **pusta kolejka** → Praca idzie do puli imperium (nie buduje nic w tej turze)
- `main.ts` i tak ponownie sprawdza surowce przy wstawianiu do kolejki

To jest rank **#3** przyczyn słabego rozwoju w audycie (P-AI-MOC-GAP).

---

## [PACZKA 1/1 — 2 pytania] P2-Q1 · P2-Q2

### P2-Q1 — Gdy AI nic nie stać w tej turze

**Sytuacja:**  
Major AI ma w mieście kandydatów do budowy (Spichlerz, Stolarnia, Wojownik…), ale **żaden** nie mieści się w zapasie surowców państwa (`canAfford` = false dla wszystkich). Dziś funkcja wyboru produkcji zwraca **pustkę** — tura bez budowy w tym mieście, mimo że jest Praca.

**Cel pytania:**  
Czy AI ma w takiej sytuacji nadal coś robić z kolejką produkcji, czy świadomie czekać na surowce?

**Dlaczego teraz:**  
P0/P1 już przyspieszają budowę i wczesną fazę; bez decyzji o pustych turach zostaje „myszkowanie” surowców i zmarnowana Praca w mieście.

**A — Zostaw pustą turę (jak dziś)**  
Gdy nic nie stać → brak pozycji w kolejce; Praca idzie do puli państwa.  
**Za:**  
1. Zero ryzyka budowy „na kredyt” / ujemnych zapasów.  
2. Proste i przewidywalne; AI zbiera surowce, potem buduje.  
**Przeciw:**  
1. Nadal zmarnowana Praca lokalna w mieście (pusta kolejka).  
2. Nie rozwiązuje rank #3 z audytu.

**B — Gdy nic nie stać: wstaw najtańszy kandydat do kolejki (budowa czeka na surowce)**  
Wybierz pozycję o **najniższym koszcie surowców** z listy kandydatów i ustaw w kolejce; postęp Pracy / pobranie surowców **dopiero gdy stać** (kolejka „wisi”, nie idzie na kredyt ujemny).  
**Za:**  
1. Miasto ma cel w kolejce — mniej „stoi i nic nie robi”.  
2. Po zebraniu surowców budowa rusza bez ponownego losowania.  
**Przeciw:**  
1. Większa zmiana w silniku kolejki (trzeba dopiąć bramkę „nie pobieraj surowców / nie dawaj postępu aż stać”).  
2. AI może długo trzymać drogi cel, jeśli źle oceni najtańszy.

**C — Gdy nic nie stać: tylko wymuś konwerter brakującego surowca; inaczej pusta tura**  
Jeśli da się wskazać Cegielnię / Odlewnię itd. pod deficyt — wybierz ją (nawet gdy droższa); jeśli i jej nie stać → jak A (null).  
**Za:**  
1. Łączy się z już istniejącym priorytetem konwerterów (P-AI-011).  
2. Mniej inwazyjne niż pełna kolejka „na później”.  
**Przeciw:**  
1. Nie pomaga, gdy brakuje wielu surowców naraz albo konwerter też za drogi.  
2. Nadal częste puste tury.

**Rekomendacja:** **C** — domyka lukę surowcową bez budowy na kredyt i bez dużej przebudowy kolejki.

---

### P2-Q2 — Trudny: skrócić early po bonusowym mieście startowym

**Sytuacja:**  
Na poziomie **Trudnym** major AI dostaje **+1 miasto** na starcie. Faza `majorEarly` i tak tłumi trochę budynki gospodarcze (teraz ×0,70) do tury ~40 (albo niskiego pop). Drugie miasto mogłoby wcześniej budować infrastrukturę mid, ale wisi w early.

**Cel pytania:**  
Czy na Trudnym, gdy AI ma startowe dodatkowe miasto, skrócić karę early (np. max tura 25 jak na Prostym)?

**Dlaczego teraz:**  
To osobna dźwignia Trudnego (snowball) — bez ABC łatwo przesadzić z siłą AI vs gracz.

**A — Tak: na Trudnym przy `startowe_miasta ≥ 1` early max tura = 25**  
Szybsze wejście w Koszary / budynki mid w obu miastach.  
**Za:**  
1. Wykorzystuje bonus +1 miasta zgodnie z intencją Trudnego.  
2. Spójne z już skróconym early na Prostym (25).  
**Przeciw:**  
1. Szybszy snowball vs gracz.  
2. Wojownicze archetypy wcześniej silniejsze.

**B — Nie zmieniać: early Trudny zostaje jak dziś (max tura 40 + warunki pop/budynki)**  
**Za:**  
1. Zero ryzyka dodatkowego snowballa po FALA 230.  
2. P1 już złagodził ×0,70 — wystarczy na teraz.  
**Przeciw:**  
1. Drugie miasto startowe dłużej w trybie „wczesnym”.  
2. Audyt P2-2 zostaje otwarty.

**C — Kompromis: early max tura = 30 tylko gdy `startowe_miasta ≥ 1` na Trudnym**  
**Za:**  
1. Lekki boost bez pełnego 25.  
2. Łatwo cofnąć w JSON później.  
**Przeciw:**  
1. Kolejna „magiczna” liczba do balansu.  
2. Mniejszy efekt niż A.

**Rekomendacja:** **B** — najpierw ogrąć FALA 230 (P0+P1); P2-Q2 dopiero po playteście Trudnego.

---

## Wdrożenie (Operator 2026-08-05)

| ID | Zmiana | Pliki |
|---|---|---|
| **P2-Q1** | **A** — brak zmiany kodu (`canAfford` → null gdy nic nie stać) | — |
| **P2-Q2** | **A** — L3 + `startoweMiasta ≥ 1`: `majorEarly` max tura **25** (jak L1) | `gra/src/game/ai.ts` (`AITurnOpts.startoweMiasta`, `computeMajorAiEarlyGame`, `decideAITurn`) |

**Testy:** `ai-test.cjs` T14-p2 (L3+1 miasto turn 26 false; L3+0 i L2+1 turn 26 true).

## Po odpowiedzi
ECHO → wdrożenie AutoBot tylko dla wybranych liter · deploy na hasło.
