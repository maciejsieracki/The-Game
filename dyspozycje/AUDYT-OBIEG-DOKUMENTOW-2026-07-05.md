# AUDYT OBIEGU DOKUMENTÓW I INFORMACJI — 2026-07-05 (wieczór)

Zlecenie Macieja: przeczytać wszystkie MD projektu, ocenić obieg dokumentów/informacji,
wskazać co zachować (żeby Cursor mógł w przyszłości przejąć pracę) i co zmienić.
Wykonanie: 2 subagenty Opus (read-only) — ~30 dokumentów procesowych w całości
+ pełna analiza `_handoff/` (454 pliki, próbka ~45 przeczytana w całości). Synteza: MASTER.

## 1. JAK DZIAŁA OBIEG (rekonstrukcja — to jest wartość sama w sobie dla nowego wykonawcy)

```
Maciej (decyzje ABC / playtest / hasła-triggery)
  → MASTER: dyspozycja <LANE>.md + handoff _handoff/MASTER-do-<LANE>_temat.md
    → Lane czyta: <LANE>-STAN.md (mikro-status ≤12 linii) → <LANE>.md → kontrakt
    → Lane melduje: <LANE>-DO-MASTERA.md (append-only) + "GOTOWE"
  → INTEGRATOR (= SILNIK = GRUPA F; jedyny editor main.ts): bramki (tsc=0,
    weryfikacja-mapy PASS, strażnik markerów) → build → publish → md5 → DZIENNIK
  → Maciej: Ctrl+F5 na gra-robocza/START.html → playtest → "OK" / "BUG"
  → promocja do gra-kanon/ TYLKO po playteście
```

Konwencje nazw: `BLAD-*`, `BLEDY-*`, `DYSPOZYCJA-*`, `DESIGN-*`, `MASTER-PLAN-*`,
`KRYZYS-*` + data `-YYYY-MM-DD`; handoff `OD-do-DO_temat.md`; backup `.bak-OPIS-DATA`;
foldery `_handoff/ _scalone/ _archiwum/`. Wersje: md5 bundla + pieczętka w menu +
ROBOCZA-MANIFEST.json. Od 2026-07-05: LOCK.json (mutex) i KANAL-*.md (wspólny plik
append-only z `CZEKAM-NA:`).

## 2. CO DZIAŁA — ZACHOWAĆ (kompatybilne z Cursorem i Claude Code)

1. Nazwa pliku = adres + temat (`OD-do-DO_temat.md`) — routing bez otwierania pliku.
2. Sztywna własność plików per lane; cross-lane TYLKO przez `_handoff/`; main.ts
   edytuje wyłącznie INTEGRATOR. To fundament pracy równoległej bez kolizji.
3. Twarde bramki przed publishem: tsc=0 + weryfikacja-mapy PASS + strażnik markerów
   + determinizm rand(). Skryptowalne, niezależne od tego KTÓRE AI wykonuje.
4. md5 + pieczętka wersji w menu + manifest = jednoznaczne "co testuje Maciej".
5. Kontrakt zamiast prozy: sygnatury TS, pliki:linie, kryteria akceptacji (DoD),
   szablon "Meldunek" wymuszający kształt odpowiedzi zwrotnej.
6. Decyzje ABC (max 3 pytania/paczka) — decyzje nie-programisty szybkie i jednoznaczne.
7. Progressive disclosure: `<LANE>-STAN.md` ≤12 linii na zimny start agenta.
8. Append-only dzienniki (DZIENNIK-MASTERA, *-DO-MASTERA) — historia "dlaczego" nie ginie.
9. Osobny WERYFIKATOR read-only (adwersaryjny audyt wg DoD) + para zlecenie↔meldunek
   (wzór: MASTER-do-INTEGRATOR_BLEDY + F-do-MASTER_BLEDY z 2026-07-05).
10. KANAL-*.md (protokół `[HH:MM] OD → DO` + `CZEKAM-NA:`) — Maciej przestaje być
    ludzkim mostem kopiującym wiadomości między czatami.

## 3. CO ZAWIODŁO (z dowodami — lekcje z dzisiejszego kryzysu)

1. **Dwa drzewa źródłowe** (`gra/src` buduje, `gra-robocza/src` zbiera pracę) — bundle
   nigdy nie zawierał nowego kodu; "regresy" były złudzeniem starego bundla. Dyspozycje
   bywały wewnętrznie sprzeczne (MASTER-do-INTEGRATOR_BLEDY każe edytować OBA drzewa).
2. **Wiele plików wejściowych** (root Gra-podglad.html vs Gra-podglad-ROBOCZA vs
   START.html) — Maciej testował stary kanon. Naprawione dekretem: TYLKO START.html.
3. **Powtarzający się błąd "publish bez nowego kodu"** — udokumentowany ≥3× (CLAUDE.md
   §3, DZIENNIK ~11:45, regres C1/C2). Strażnik markerów powstał jako odpowiedź.
4. **Cztery różne "aktualne" md5 kanonu** w INTEGRATOR-STAN / MAPA-STAN / UI-STAN /
   F-KOLEJKA-P0 — brak jednego licznika prawdy o wersji.
5. **Duplikacja opisów błędów w 3 miejscach** (BLAD-B0.x + BLEDY-DO-NAPRAWY + CLAUDE.md)
   → rozjazdy przy aktualizacji jednego z nich.
6. **DZIENNIK-MASTERA: 4682 linie, deklaruje append-only, a najnowszy wpis na górze,
   kolejność wpisów mieszana** — świeży agent nie wie, gdzie jest "teraz".
7. **Pliki-sieroty z fałszywym autorytetem**: F-KOLEJKA-P0 ("czytaj TEN plik pierwszy")
   podaje kanon sprzed 4 dni; MASTER-KANON-SPRINT/PILNE-07-02 nieoznaczone jako
   archiwalne; w `_handoff/` zero archiwizacji (zamknięte z 24.06 obok kryzysu z 05.07).
8. **Status prozą, nie polem**: STATUS słownie w ~84% handoffów, ale maszynowo czytelne
   `CZEKAM-NA` tylko w 12/454 plikach; ~30-40% handoffów wisi bez jawnego domknięcia.
   Bywa rozjazd nazwa↔treść (BUG-OBL-CAP-01: nazwa "NAPRAWIONE", treść "czeka").
9. **ZASADY-WSPOLPRACY.md nieaktualne** (mówią: Canvas+JS, bez Claude Code, źródło
   prawdy PROJEKT-GRY-master.md) — sprzeczne z praktyką (TS+Three.js, Claude Code,
   DZIENNIK). Cztery dokumenty ogłaszają się "źródłem prawdy".
10. **OneDrive jako transport** — opóźnienia synchronizacji i cofnięcia dużych plików
    (dzisiejszy revert). Reguły w markdownie nie wystarczyły — stąd LOCK.json.

## 4. REKOMENDACJE (wg wpływu; wykonalne przez Macieja + AI)

1. **`dyspozycje/START-TU.md` — jedyny punkt wejścia** dla każdego agenta (Cursor też):
   aktualne md5 kanon+robocza, reguła "jedno drzewo kodu", link playtestu (START.html),
   5 twardych zasad, lista AKTYWNYCH dyspozycji, status LOCK. Każdy czat zaczyna od niego.
2. **Dokończyć decyzję "jedno drzewo"**: skasować/zarchiwizować forki src zgodnie z
   KRYZYS §Kasacja; publish kopiuje TYLKO bundle. Każda dyspozycja podaje JEDNO drzewo.
3. **`WERSJE.md` — jedyne miejsce z md5** (kanon + robocza, append-only). STAN-y i
   kolejki tylko LINKUJĄ, nigdy nie kopiują hasha.
4. **Obowiązkowa stopka w każdym handoffie**: `STATUS: OTWARTY|GOTOWE-ROBOCZA|ZAMKNIĘTY|BLOK`
   + `CZEKAM-NA:` + `md5:`. Do tego `_handoff/_INDEKS-OTWARTE.md` (co wisi, na kogo czeka)
   i po domknięciu dopisek `ZAMKNIĘTE-PRZEZ: <ścieżka meldunku>` w zleceniu.
5. **Jeden błąd = jeden plik** — opis TYLKO w BLAD-*.md; CLAUDE.md/BLEDY/DZIENNIK linkują.
6. **Reguły archiwizacji**: ZAMKNIĘTY >3 dni → `_archiwum/` (kopią, wg konwencji projektu);
   od razu: F-KOLEJKA-P0, MASTER-KANON-SPRINT-07-02, MASTER-PILNE-07-02, ORCHESTRATOR-E2.
7. **Zaktualizować ZASADY-WSPOLPRACY.md** do rzeczywistości (TS+Three.js, Claude
   Code/Cursor, role, DZIENNIK operacyjnym źródłem prawdy) — 20 minut, usuwa sprzeczne
   instrukcje na wejściu nowego wykonawcy.
8. **DZIENNIK**: jawna zasada "najnowsze NA GÓRZE", ścisła kolejność, split miesięczny
   (`DZIENNIK-2026-07.md`).
9. **Szablony**: `_SZABLON-DYSPOZYCJA.md` i `_SZABLON-HANDOFF.md` z polami: właściciel,
   drzewo, pliki, kryteria akceptacji, bramka, md5-po, meldunek-do, stopka statusu.
   Plus słownik ról (SILNIK = GRUPA F = INTEGRATOR — ta sama rola w czasie!).
10. **KANAL-*.md na stałe** (nie tylko kryzys) — jeden kanał na sprint/temat zamiast
    dziesiątek małych plików; wydzielić z `_handoff/` typy nie-handoffowe (BUG-*,
    AUDYT-*, BRIEF-UX_*) do własnych podfolderów.

## 5. UWAGA O ZAKRESIE
Poza audytem zostały: `docs/` (MASTER-SILNIK.md, CZAT-TEMATYCZNY-PROTOKOL.md, obieg,
decyzje), `.cursor/rules/civ-workflow.mdc`, PLAYBOOK-operacyjny-Civ.md i panele Excel —
rozproszona "konstytucja" poza `dyspozycje/` to samo w sobie ryzyko; do przejrzenia
przy wdrażaniu rekomendacji 1 i 7.

STATUS: OTWARTY (czeka na decyzje Macieja, które rekomendacje wdrażamy)
CZEKAM-NA: MACIEJ — wybór rekomendacji (proponuję start: 1+2+3+4)
