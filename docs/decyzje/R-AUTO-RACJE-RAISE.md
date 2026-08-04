# R-AUTO-RACJE-RAISE — auto-podnoszenie Wyżywienia u gracza na EOT

**Status:** WDROŻONE (kod) · Q1=B · czeka deploy · 2026-08-05  
**ID:** `R-AUTO-RACJE-RAISE-Q1`  
**Decyzja Macieja:** **B** — gracz: auto-raise tylko przy trwałej nadwyżce produkcji miast (≥0); zapasy Spichlerza nie uruchamiają podnoszenia. Major AI: bez zmian (może z zapasów).  
**Branch:** `cursor/abc-auto-racje-raise-63a1`  
**Źródło:** Maciej — suwak Wyżywienia/rozwoju wraca do max mimo ręcznego obniżenia (Spichlerz)

---

## Diagnoza (kod)

Na koniec tury (`main.ts` ~19760) dla **każdego** właściciela poza miastami-państwami (`!typCityCopyOwners`) wołane jest:

`autoRaiseRationsForGrowth` (`empire-food.ts`)

- Komentarz w kodzie: *„tylko major AI”*
- W praktyce warunek **nie wyklucza gracza** (`ownerId === 0`) → **gracz też dostaje auto-podnoszenie do max**
- Warunek startu: solvent + (`nadwyżka > 0` **lub** `zapasyPrzed > 0`) → podnosi racje **nawet z zapasów Spichlerza**, nie tylko z nadwyżki produkcji

Osobno działa **SPICH-AUTO-Q1** (`autoBalanceRationsToSolvency`) — to tylko **obniża** przy deficycie (zgodne z decyzją B).

## Objaw Macieja

1. Obniża Wyżywienie (bo Spichlerz / zasoby słabe).
2. Koniec tury → suwak znów w górę (często do max).
3. Obawa o **ubytek ludności** — uzasadniona pośrednio: wyższe racje = wyższy koszt 🍞 → łatwiej o brak dopłaty centrali → `applyHungerPenaltyV85` → **−1 ludność** (min 1). Rekrutacja nadal **nie** odejmuje pop (`R-REKRUT-LUDNOSC-UI`).

## Cytat / oczekiwanie Macieja

> Powinien się podnosić ewentualnie automatycznie tylko wtedy kiedy w całej cywilizacji nie ma ujemnego salda co turę. Czyli co najmniej musi być na końcu zero.

---

## [TEMAT: Auto-podnoszenie Wyżywienia u gracza]

### Sytuacja
Dziś na koniec tury gra **sama podnosi Wyżywienie** w miastach gracza (ten sam mechanizm, co u AI major „max wzrost”). Gracz obniża suwak przez brak zapasów w Spichlerzu — po turze wraca w górę. Auto-**obniżanie** przy deficycie (SPICH-AUTO) zostaje bez zmian.

### Cel pytania
Ustalic, czy i kiedy gra wolno **podnosić** Wyżywienie u gracza bez jego kliknięcia.

### Dlaczego teraz
Playtest: suwak walczy z graczem; ryzyko głodu i −1 ludności przy zbyt wysokich racjach.

### Opcje

**A — Gracz: zero auto-podnoszenia** (rekomendacja)  
Tylko major AI podnosi Wyżywienie przy nadwyżce. U gracza zostaje wyłącznie ręczne ustawienie + auto-**obniżenie** przy deficycie (SPICH-AUTO).  
- **Za:** zgodne z komentarzem w kodzie („tylko major AI”); gracz ma kontrolę; koniec walki z suwakiem.  
- **Za:** mniej ryzyka głodu od wymuszonego max.  
- **Przeciw:** gracz musi sam wracać w górę, gdy Spichlerz się zapełni.  
- **Przeciw:** AI ma wygodę „auto max wzrostu”, gracz nie.

**B — Podnosić u gracza tylko przy trwałej nadwyżce produkcji (≥ 0 po podniesieniu), bez zjadania zapasów**  
Auto-raise tylko gdy bilans miast (nadwyżka) pozwala utrzymać wyższy poziom **bez** sięgania po Spichlerz jako warunek startu; po każdym kroku bilans imperium ≥ 0.  
- **Za:** blisko słów Macieja („nie ujemne saldo / co najmniej zero”).  
- **Za:** nadal pomaga, gdy żywności naprawdę starcza z produkcji.  
- **Przeciw:** trudniejsza reguła do zrozumienia w UI.  
- **Przeciw:** przy małej nadwyżce i tak może podnosić wbrew woli gracza.

**C — Status quo (gracz = jak major AI)**  
Zostawić auto-raise do max przy solvent + (nadwyżka lub zapasy > 0).  
- **Za:** zero pracy.  
- **Za:** AI i gracz jednakowo „pchają wzrost”.  
- **Przeciw:** dokładnie obecny bug UX.  
- **Przeciw:** zjada Spichlerz i sprzyja głodowi.

### Rekomendacja
**A** — auto-podnoszenie tylko u major AI; u gracza ręka + SPICH-AUTO obniżanie.

---

## Implementacja (Q1=B — WDROŻONE w kodzie)

- `empire-food.ts`: `AutoRaiseRationsOpts.requireProductionSurplus` — gracz wymaga `nadwyzka > 0` (start i w pętli raise).
- `main.ts` ~19762: `requireProductionSurplus: ownerId === 0`.
- Test: `ai-major-economy-test.cjs` sekcje G–I (AI zapasy OK; gracz bez nadwyżki = no-op; gracz z nadwyżką = raise).
- Deploy osobno na hasło `deploy`.
