# Dispatch — R-HOTSEAT-ETAP8-DYPLOMACJA-UI-Q1

## Kontekst

Etap 8 planu hot-seat (`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §G), część ii —
OSTATNI fragment całego planu hot-seat. Warstwa danych (część i,
`R-HOTSEAT-ETAP8-DYPLOMACJA-DANE-Q1`, commit `8dfca234`) jest zamknięta: kolejka
`interHumanDiplomacyInbox`, funkcje `proposeToHuman`/`respondToHumanProposal`,
save/load — WSZYSTKO gotowe i przetestowane przez haki `__hotSeatTestDebug`, ale
BEZ ŻADNEGO UI. Ten temat dopina UI do gotowej warstwy danych, wzorem
`R-HOTSEAT-ETAP6F-PART2-UI-Q1` (dopięło UI do `R-HOTSEAT-ETAP6F-PART2-DATA-Q1`).

ABC-Q4 (rozstrzygnięte 2026-09-10, `R-HOTSEAT-ETAP8-DYPLOMACJA-RECON-Q1`): punkt
wejścia UI = **NOWY, DEDYKOWANY** ekran/przycisk, NIE zakładka w dzisiejszym
panelu dyplomacji z AI (`gra/src/ui/diplomacyPanel.ts`).

## Punkty zaczepienia w istniejącym kodzie (zweryfikowane reconem, NIE zgaduj)

**Warstwa danych (main.ts), gotowa, NIE MODYFIKUJ logiki, tylko wywołuj:**
- `interface InterHumanDiplomacyProposal { id, fromOwnerId, toOwnerId, cmd: AIDiplomacyCommand, reason, createdTurn }` (main.ts ok.11238)
- `proposeToHuman(fromOwnerId, toOwnerId, cmd, reason): string` (main.ts ok.17338)
- `respondToHumanProposal(id, action: 'accept'|'reject'|'counter', counterCmd?, counterReason?): boolean` (main.ts ok.17370) —
  przy `'counter'` **wymagany** `counterCmd` (brak → `false`); `'reject'` → `true`,
  nic więcej; `'accept'` reużywa `finalizePeaceTreatyBetween`/`aiCommandToPendingProposal`/
  `resolvePlayerAcceptsAiPending`/`applyProposalOutcome` (te same co dla AI).
- `getInterHumanProposalsFor(ownerId): ReadonlyArray<InterHumanDiplomacyProposal>` (main.ts ok.17353)
- Haki testowe już istnieją: `proposeToHumanForTest`, `getInterHumanProposalsForTest`,
  `respondToHumanProposalForTest`, `getDiploRelationForTest`, `countActiveDealsForTest`
  w `__hotSeatTestDebug` (main.ts ok.23700-23711) — Twoja nowa bramka UI może z nich
  korzystać do SETUP-u scenariusza (np. wstrzyknij propozycję hakiem, potem
  klikaj UI żeby ją zobaczyć/zaakceptować — realistyczny test end-to-end).

**`AIDiplomacyCommand`** (`gra/src/game/ai.ts` ok.4841) — unia typów propozycji.
ABC-Q3 = „istniejące traktaty 1:1, zero nowych wariantów" — z całej unii do TEGO
UI (propozycje adresowane do konkretnej osoby, NIE jednostronne akcje wrogie)
kwalifikują się:
- `zaproponuj_pokoj` (`{targetId, powod}`)
- `zaproponuj_sojusz` (`{targetId, powod, allianceKind?: 'defensywny'|'pelny'}`)
- `zaproponuj_pakt` (`{targetId, powod, turns?}`) — pakt nieagresji, UŻYTY w
  dowodzie żywym tematu części i (`hotseat-etap8-dyplomacja-dane-test.cjs`)
- `zaproponuj_audiencje` (`{targetId, powod, motive?}`)

**WYMAGANE w UI v1** (minimalny, kompletny zakres): powyższe 4 warianty.
**OPCJONALNE** (jeśli starczy czasu, NIE blokuj tematu jeśli pominięte —
udokumentuj wybór w raporcie): `zaproponuj_handel`, `zaproponuj_umowe_handlowa`,
`zaproponuj_handel_surowiec` (ostatni ma najwięcej pól konfiguracyjnych — jeśli
pomijasz, powiedz to jawnie, nie milcz).
**WYKLUCZONE bezwzględnie z tego UI**: `wypowiedz_wojne`, `zadaj_trybut` — to
jednostronne, wrogie akcje, NIE propozycje do zaakceptowania przez drugą stronę;
nie mają miejsca w ekranie „złóż propozycję drugiemu fotelowi".

**Wzorzec stylistyczny UI** — `gra/src/ui/diplomacyPendingHud.ts` (modal AI→gracz,
`showDiplomacyPendingModal(item, onAccept, onReject, opts?)`/`hideDiplomacyPendingModal()`,
`DiplomacyPendingItem = {id, civName, title, detail}`, DOM `position:fixed;inset:0`
overlay + `.civ-dip-box`, style z `diploUiSkin.ts` — `DIPLO_1E_SHARED_CSS`,
`dipBrandIconHtml`). Zbuduj NOWY plik (np. `gra/src/ui/interHumanDiplomacyHud.ts`)
na tym wzorcu — własny `show*/hide*` eksport, własny scoped `STYLE_ID`, NIE
rozszerzaj `diplomacyPanel.ts` (to zakładka listy AI, ABC-Q4 tego zakazuje).

**Brak precedensu — decyzja Twoja (nie ABC, to inżynieryjny domyślny wybór, nie
produktowy):** dziś ŻADEN element HUD nie jest bramkowany warunkiem „jesteśmy w
hot-seat" (`humanSeats.humanOwnerIds.length > 1`). Nowy przycisk/ikona wejścia do
tego UI MUSI być widoczny WYŁĄCZNIE w hot-seat (ukryty całkowicie w grze
jednoosobowej) — to naturalny domyślny wybór (mirror `hotSeatHandoff.ts`/
`seat2-toggle-btn` bycia hot-seat-specific), NIE wymaga pytania właściciela.
Wzorzec licznika/badge do skopiowania: `getWarBadge: () => cfg!.getWarsWithPlayer?.().length ?? 0`
(`gra/src/ui/hud.ts` ok.1676, zasilany z main.ts `getWarsWithPlayer: collectWarsWithPlayer`
ok.22186) — analogicznie dodaj `getInterHumanProposalsBadge` zliczający
`getInterHumanProposalsFor(aktywny fotel).length`, przekazywany jak
`getBlockingCount: () => countBlockingEvents()` (main.ts ok.21764).

**Punkt osadzenia w HUD** — `gra/src/ui/mapToolbarHud.ts` (`MapToolbarHudConfig`,
istniejące pole `onOpenDiplomacy?: () => void` jako wzorzec) — dodaj analogiczne
nowe pole configu dla tego ekranu, spięte jak `toggleDiploListFromToolbar()`
(main.ts ok.21770/21805-21808), ale gatowane hot-seat.

## GOAL

1. **Panel „skrzynka propozycji"** (odbiorca = aktywny fotel): lista propozycji z
   `getInterHumanProposalsFor(aktywnyOwnerId)`, każda z akcją Akceptuj/Odrzuć/
   Kontrpropozycja. Kontrpropozycja otwiera formularz edycji warunków (np. inny
   `turns`, inny `allianceKind`) i woła `respondToHumanProposal(id,'counter',counterCmd,counterReason)`.
2. **Formularz „złóż nową propozycję"**: wybór typu (4 wymagane warianty wyżej),
   pola specyficzne dla wariantu, woła `proposeToHuman(aktywnyOwnerId, drugiFotelOwnerId, cmd, reason)`.
3. **Nowy przycisk/ikona w HUD**, widoczny WYŁĄCZNIE w hot-seat
   (`humanSeats.humanOwnerIds.length > 1`), z badge liczącym propozycje
   zaadresowane do aktywnego fotela (wzorem `getWarBadge`).
4. Otwarcie ekranu pokazuje ZARÓWNO skrzynkę odbiorczą, JAK I możliwość złożenia
   nowej propozycji (jeden ekran, dwie sekcje — lub dwa kroki, Twoja decyzja
   stylistyczna, opisz wybór w raporcie).

## Reguła przeciw samooszukiwaniu (ANTY-HALUCYNACYJNA)

Zakaz uznania tematu za zamknięty na podstawie samego czytania kodu LUB samych
haków `*ForTest`. Wymagany dowód na żywym Chromium z REALNYMI KLIKNIĘCIAMI DOM
(nie tylko wywołaniami `__hotSeatTestDebug`): hot-seat 2 fotele, fotel A
(aktywny) OTWIERA nowy przycisk HUD (widoczny — dowód że hot-seat-gating działa),
WYPEŁNIA formularz i SKŁADA propozycję (np. pakt nieagresji) DO fotela B przez
kliknięcia UI → kończy turę → fotel B aktywny → DOWÓD że badge/licznik na
przycisku HUD fotela B pokazuje 1 → fotel B OTWIERA ekran, WIDZI propozycję
zaadresowaną do niego (treść zgodna z tym co złożył fotel A) → KLIKA Akceptuj →
DOWÓD realnego wpisu w `activeDeals`/zmiany `getDiploRelation(A,B)` (przez hak
`getDiploRelationForTest`/`countActiveDealsForTest`, to OK jako weryfikacja
WYNIKU, nie jako zamiennik kliknięcia). Osobny scenariusz: fotel B zamiast
akceptować KLIKA Kontrpropozycję, zmienia warunek w formularzu, wysyła → kończy
turę → fotel A aktywny → DOWÓD że widzi kontrpropozycję w swojej skrzynce
(zmienione warunki, kierunek odwrócony). Regresja: gra jednoosobowa — nowy
przycisk HUD MUSI BYĆ NIEOBECNY (nie tylko disabled — brak w DOM albo `display:none`
sprawdzony jawnie w teście).

## Binarne kryterium sukcesu

Nowa bramka `gra/tools/hotseat-etap8-dyplomacja-ui-test.cjs` (wzorem strukturalnym
`hotseat-etap8-dyplomacja-dane-test.cjs` — `buildBundle()`/`launchBrowser()` z
fallbackiem/`closeBrowserSafely()`/`pollUntil()`/`waitForWorldGenerated()`
zwiększony do 360000ms zgodnie z `R-PROCESS-HOTSEAT-WORLDGEN-TIMEOUT-Q1`/
`startHotSeatGame()`/`runWithRetry()`) dowodząca scenariusza z Reguły przeciw
samooszukiwaniu (propozycja→akceptacja z realnymi kliknięciami ORAZ
propozycja→kontrpropozycja ORAZ regresja braku przycisku w single-player) PASS
ORAZ `tsc --noEmit` czysty ORAZ 5 bramek referencyjnych zielone ORAZ zero regresji:
`hotseat-etap8-dyplomacja-dane-test.cjs`, `hotseat-etap6f-part2-ui-test.cjs`,
`hotseat-etap6e-render-noop-test.cjs`, `hotseat-drugi-fotel-tura-test.cjs`,
`hotseat-dyplo-kontakt-per-fotel-test.cjs` ORAZ istniejące testy panelu dyplomacji
AI (`gra/tools/*.cjs` z „diplomacy"/„diplo" w nazwie) nadal PASS.

## Allowlista

- `gra/src/main.ts` (WYŁĄCZNIE: nowe wywołania `proposeToHuman`/
  `respondToHumanProposal`/`getInterHumanProposalsFor` z warstwy UI, nowy getter
  badge, nowe pole configu HUD, spięcie nowego przycisku — NIE dotykaj logiki
  `interHumanDiplomacyInbox`/funkcji z części i, one są gotowe i przetestowane)
- `gra/src/ui/interHumanDiplomacyHud.ts` (NOWY plik)
- `gra/src/ui/mapToolbarHud.ts` (nowe pole configu + render przycisku/badge)
- Nowy plik testowy: `gra/tools/hotseat-etap8-dyplomacja-ui-test.cjs`
- `dowody/hotseat-etap8-ui-*.png` (nowe pliki, dowód)

Zakazane bezwzględnie: `gra/src/ui/diplomacyPanel.ts` i `diplomacyPendingHud.ts`
(ZERO zmian — to gotowe, dojrzałe komponenty AI-dyplomacji, ten temat buduje
RÓWNOLEGŁY, nowy, dedykowany ekran, nie modyfikuje istniejących), logika
`interHumanDiplomacyInbox`/`proposeToHuman`/`respondToHumanProposal` w main.ts
(gotowa z części i — WOŁAJ, nie zmieniaj), `gra/data/*.json`, pliki z sekretami,
`docs/decyzje/*.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-hotseat-etap8-ui`, gałąź
`autobot/R-HOTSEAT-ETAP8-DYPLOMACJA-UI-Q1`, baza `origin/main` (jawnie, weryfikacja
`git merge-base` przed integracją). C-001: zakaz `npm run build`/`dev` w `gra/`;
dozwolona wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir <katalog spoza repo> --emptyOutDir`
oraz `node ./node_modules/typescript/bin/tsc --noEmit`. Testy Chromium URUCHAMIAJ
SEKWENCYJNIE, sprawdź `pgrep -fa "node tools|vite.js build|chrome-linux"` PRZED
każdym testem przeglądarkowym.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i
TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 700 słów w raporcie (temat złożony — nowy UI + nowa bramka). Ścieżki+SHA
zamiast diffu; zakaz `git add -A`. Przy decyzji PRODUKTOWEJ (nie inżynieryjnej —
patrz wyżej, hot-seat-gating NIE jest decyzją produktową) — STATUS: DECISION_REQUIRED.
Nie integrujesz, nie deployujesz, nie pushujesz.
