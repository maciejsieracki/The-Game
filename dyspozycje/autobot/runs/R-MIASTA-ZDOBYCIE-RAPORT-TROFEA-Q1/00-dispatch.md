# R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 — dispatch

TEMAT: `R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1`
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — **Opus 5**, effort high (temat wizualny + logika trzech lejków);
Evaluator — **Opus 5**, effort high (`R-PROC-AUTOBOT.md` §9 poz. 6b);
Final Control — Sonnet 5, effort high.

## WYZWALACZ (dosłownie, właściciel — dwie wiadomości)

> „Nie widzę, żeby podczas zdobywania miasta, stolicy było gdzieś widoczne, jakie udało się
> zdobyć trofea. A nawet jeżeli coś, to powinien też się pojawiać raport, wydarzenie, które
> mówi dokładnie, co zostało zdobyte i jakie zwycięstwo zostało odniesione."

Po zrzucie modalu `ELIMINACJA!` (Yan, Chińczycy · miasto-państwo):
> „Myślę, że można byłoby ten komunikat trochę ładniej ułożyć, bardziej logicznie
> i czytelnie."

**ECHO właściciela (AskUserQuestion):**
1. Łup ze zwykłego miasta — **„Tylko raport, bez nowej mechaniki"**. Zdobycie zwykłego
   miasta nadal NIE daje łupu; raport ma to uczciwie powiedzieć, a nie udawać zdobycz.
2. Forma — **„1+2", czyli OBA naraz**: rozbudowany modal z pełnym rozliczeniem ORAZ
   trwały wpis w panelu WYDARZENIA ze szczegółami po kliknięciu.

## RECON (zweryfikowany odczytem kodu; POTWIERDŹ własnym odczytem — `main.ts` zmieniał się dziś kilka razy)

**A. ZNALEZISKO KRYTYCZNE — komunikat zaprzecza temu, co gra właśnie zrobiła.**
Przy zdobyciu **stolicy**, gdy cywilizacja ofiary PRZEŻYWA, skarbiec ofiary trafia
**w całości do zdobywcy** (`capital-capture.ts:190-193`:
`access.setTreasury(newOwner, access.getTreasury(newOwner) + skarbiecPrzejety)`),
a komunikat mówi „**skarbiec i pula pracy przepadły**" (`main.ts:25945`) — i nie podaje
kwoty. **Pula pracy faktycznie przepada** (`capital-capture.ts:197`), skarbiec NIE.
Kwoty pojawiają się wyłącznie przy pełnej eliminacji. To defekt komunikatu, nie ekonomii —
ekonomia działa poprawnie, **nie ruszaj jej**.

**B. Zwykłe miasto nie daje łupu w ogóle** — `applyCapitalCapturePlunder` zwraca `null`
dla nie-stolicy (`capital-capture.ts:182`). Zdobywca dostaje samo miasto i budynki,
kolejka budowy jest czyszczona (`main.ts` ~26234-26248). Zgodnie z ECHO (1) — **bez zmian
w mechanice**, raport ma to jawnie powiedzieć.

**C. Zero śladu w panelu WYDARZENIA** — `collectTurnEvents` (`main.ts:13877`) nie emituje
nic o zdobyciu; są tylko modal `showCityCaptureNotice` (`cityCaptureNotice.ts:106`)
i znikający toast. Nie ma do czego wrócić po turach — stąd druga część zgłoszenia.

**D. TRZY lejki przejęcia, nie jeden.** Raport musi pokrywać wszystkie trzy, inaczej
powstanie kolejna dziura:
- `applyCityCaptureToMap` (`main.ts:26150`) — wspólny lejek bojowy: bitwa polowa o miasto,
  szturm muru, wejście do pustego miasta;
- `resolveSiegeSurrender` (`main.ts:12980`) — kapitulacja głodowa, przejęcie ~13055-13075;
- `runCapitalCapturePlunder` (`main.ts:25854`) — ścieżka stolicy, wołana z 26265 i 13070.

**E. Wady obecnego tekstu — potwierdzone zrzutem właściciela**, wszystkie w
`main.ts:25974-25980` + `cityCaptureNotice.ts:143-146`:
- **E1. Brak jakiejkolwiek struktury do ułożenia.** Cała treść to JEDEN sklejony string
  (`eliminatedDetails`), przepuszczony przez `esc()` i wstawiony do POJEDYNCZEGO
  `<div class="civ-ccn-elim-sub">`. Nie ma wierszy, etykiet ani wartości — jest zdanie.
  **Dlatego naprawa musi być STRUKTURALNA (wiersze etykieta/wartość), nie kosmetyczna.**
- **E2.** `Nauka: +16 nauki` — słowo powtórzone, bo `naukaText` (`main.ts:25977`) skleja
  etykietę „Nauka:" z jednostką „nauki".
- **E3.** `0 tech(y) przejęte` (`main.ts:25980`) — deweloperski skrót na liczbę mnogą
  wyciekł do gracza, w dodatku przy zerze.
- **E4.** `Zdobycze Power: +0` (`main.ts:25980`) — wewnętrzna, nieprzetłumaczona nazwa
  `Power` w tekście dla gracza.
- **E5. NAJWAŻNIEJSZE — zera pokazywane na równi z realnymi zdobyczami.** Na zrzucie
  z czterech faktów tylko JEDEN coś znaczy (+16 nauki); pozostałe trzy mówią „nic nie
  zdobyłeś". Modal jest w trzech czwartych szumem.
- **Uwaga:** gałąź barbarzyńska (`main.ts:25978-25979`, „Skarbiec i nauka przepadły
  (barbarzyńcy nie dziedziczą łupu)") jest sformułowana POPRAWNIE — nie zepsuj jej.

**F. Wzorce do naśladowania — nie wymyślaj od zera:**
- wpis w panelu + modal ze szczegółami po kliknięciu: `recordCivElimEvent`
  (`main.ts:7948-7961`) + `civElimEventDetails` (`main.ts:7926`) + `civElimNotice.ts`;
- drugi wzorzec rozbudowanego wpisu: `recordWarDeclarationEvent` (`main.ts:7965-7995`);
- typ wydarzenia: `SidePanelEvent` (`sidePanelHud.ts:31`), zbieranie `collectTurnEvents`
  (`main.ts:13877`), logi źródłowe `warEventLog` (`main.ts:7909`);
- panel podsumowania z GOTOWYM polem na łup: `showPostBattleSummary`
  (`postBattleSummary.ts:554`), dane `battle-summary.ts:44,57` (`lootNote`),
  render `postBattleSummary.ts:447-456`.

## GOAL

### GOAL 1 — naprawa komunikatu, który kłamie (recon A)

Komunikat przejęcia stolicy przestaje twierdzić, że skarbiec przepadł, i **podaje kwotę
faktycznie przejętą**. Pula pracy nadal przepada i tak ma być napisane — rozróżnij te dwa
losy wprost, bo dziś są zlepione w jedno zdanie.

### GOAL 2 — strukturalny raport zamiast sklejonego zdania

`eliminatedDetails: string` przestaje być jednym stringiem. Modal dostaje **listę pozycji
etykieta/wartość**, renderowaną jako wiersze. Wymagania:
1. **Pozycje zerowe są POMIJANE, nie wypisywane** (recon E5). Wyjątek: gdy nie zdobyto
   NICZEGO — wtedy jedna, świadoma linia „Łupu brak" (spójne z ECHO (1)).
2. Zero deweloperskich skrótów w tekście gracza: bez `tech(y)`, bez `Power` (E3, E4).
   Liczba mnoga po polsku albo sformułowanie, które jej unika.
3. Bez powtórzeń etykiety i jednostki (E2).
4. Kolejność logiczna, od najważniejszego: co się stało (zdobycie/eliminacja) → co
   zdobyto → co przepadło. Dziś kolejność jest przypadkowa.
5. Gałąź barbarzyńska zachowuje swój sens (recon E, uwaga).

### GOAL 3 — wpis w panelu WYDARZENIA dla WSZYSTKICH TRZECH lejków

Każde przejęcie miasta (bojowe, kapitulacja głodowa, stolica) zostawia trwały wpis
w panelu wydarzeń, ze szczegółami po kliknięciu — wzorem `recordCivElimEvent` (recon F).
**Pokrycie wszystkich trzech lejków jest kryterium, nie ambicją** — recon D wymienia je
z numerami linii, więc „nie znalazłem" nie jest wytłumaczeniem.

### GOAL 4 — raport dla ZWYKŁEGO miasta mówi prawdę

Zdobycie zwykłego miasta nadal nie daje łupu (ECHO 1). Raport ma to powiedzieć wprost —
co przejąłeś (miasto, budynki, ludność) i że łupu brak. **Nie wymyślaj łupu, żeby raport
wyglądał ciekawiej.**

### GOAL 5 — bramka testowa

Nowa `gra/tools/miasto-zdobycie-raport-test.cjs`, minimum:
1. stolica, cywilizacja przeżywa, skarbiec > 0 → komunikat zawiera FAKTYCZNĄ kwotę
   i NIE zawiera słowa „przepadły" w odniesieniu do skarbca;
2. ten sam przypadek, skarbiec = 0 → brak pozycji o skarbcu (pominięta, nie „pusty");
3. eliminacja z zerowymi technologiami i Power → te pozycje NIE występują w wyniku
   (asercja wprost na E5);
4. `'tech(y)'` i `'Power'` nie występują w żadnym tekście dla gracza — skan negatywny;
5. każdy z trzech lejków (recon D) produkuje wpis w panelu wydarzeń — trzy osobne asercje;
6. zwykłe miasto → wpis istnieje i mówi o braku łupu, nie o zdobyczy;
7. gałąź barbarzyńska zachowuje swoją treść (regresja na recon E, uwaga).

## KRYTERIA KOŃCA (binarne)

- [ ] `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
- [ ] `node tools/miasto-zdobycie-raport-test.cjs` — 100% pass, minimum 7 asercji.
- [ ] Zrzuty żywego Chromium: modal eliminacji, modal zwykłego zdobycia, wpis w panelu
      wydarzeń — **obejrzane i opisane**, w `dowody/`. Temat wizualny bez obejrzanego
      zrzutu jest niezamknięty (`R-PROC-AUTOBOT.md` §9 poz. 6).
- [ ] Pięć bramek referencyjnych bez regresu: logic 213/213, tech-tree 19/19,
      research 33/33, unit-replace 13/13, combat 6/6.
- [ ] Bez regresu na bramkach zdobycia/oblężenia/eliminacji — **znajdź je sam**
      (`ls gra/tools/ | grep -Ei "capture|zdobyc|siege|oblez|elim|capital|stolic"`),
      uruchom WSZYSTKIE, podaj wyniki; czerwona → sprawdź parytet na czystej bazie
      PRZED zgłoszeniem jako regres.

## REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

**Tryb pierwszy: naprawa jednego lejka i uznanie tematu za zamknięty.** Recon D wymienia
TRZY ścieżki przejęcia z numerami linii. Dokładnie ta klasa błędu (łatanie po jednym
miejscu) kosztowała projekt cztery zgłoszenia w rodzinie tematów mgły. Dla każdego
z trzech lejków podaj **osobną asercję**, nie jedno zdanie „pokryte".

**Tryb drugi: zmiana mechaniki pod pretekstem raportu.** ECHO (1) mówi wprost: bez nowej
mechaniki. Jeśli w trakcie uznasz, że zwykłe miasto POWINNO dawać łup — to jest
`DECISION_REQUIRED` do właściciela, nie twoja decyzja.

**Tryb trzeci: kosmetyka zamiast struktury.** Poprawienie sklejanego stringa tak, żeby
ładniej brzmiał, NIE spełnia GOAL 2 — dopóki treść jest jednym stringiem w jednym `<div>`,
„ułożenie" jest niemożliwe. Pokaż w raporcie, że modal renderuje WIERSZE.

**Tryb czwarty: test tautologiczny.** Pokaż, że bramka czerwienieje po mutacji — przywróć
`0 tech(y) przejęte` w jednym miejscu, uruchom, wklej liczbę faili, cofnij.

## ALLOWLISTA

- `gra/src/main.ts`
- `gra/src/ui/cityCaptureNotice.ts`
- `gra/src/ui/sidePanelHud.ts`
- `gra/src/game/capital-capture.ts` (**tylko** jeśli konieczne dla typów/kształtu wyniku —
  **zakaz zmiany ekonomii**: kto co dostaje, zostaje bez zmian; uzasadnij w raporcie)
- `gra/tools/miasto-zdobycie-raport-test.cjs` (nowy)
- `dyspozycje/autobot/runs/R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/**`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`,
`gra/src/game/society-breakdown.ts`, `gra/src/game/order.ts`, `gra/data/society-params.json`
(węzeł A audytu szczęścia), `gra/src/ui/entityCards/**`, `gra/src/ui/techDiscoveryNotice.ts`
(temat kart) — `R-PROC-AUTOBOT.md` §2b.
Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-miasta-zdobycie-raport`, gałąź
`autobot/R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1`, baza jawnie `origin/main` —
potwierdź `git log -1` PRZED pracą.

C-001, brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje
JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist
--emptyOutDir". Jedyna dozwolona kompilacja: `node ./node_modules/typescript/bin/tsc
--noEmit`; bramki `node tools/*-test.cjs` nie są zakazem objęte. `--outDir` poza drzewem repo.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- **Nie zmieniasz ekonomii przejęcia** — kto co dostaje przy zdobyciu stolicy, eliminacji
  i zwykłym mieście zostaje dokładnie jak dziś. Ten temat zmienia wyłącznie to, co gracz
  WIDZI.
- Nie dodajesz łupu zwykłemu miastu (ECHO 1).
- Nie zmieniasz zasad dziedziczenia Power ani kopiowania technologii.
- Nie integrujesz, nie deployujesz, nie pushujesz.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec
skryptu. Final Control osobno, integracja allowlist-only ręką orkiestratora.
