# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-ZELAZO-MODELE-BRAKUJACE-Q1-T4`
GOAL: Zbudować nowy, dedykowany model 3D dla **Jeździec z oszczepami** (epoka Żelazo,
kultura Słowianie) — dziś generyczny model kategorii `konnica` z kopią/lancą, mimo że
to lekka, dystansowa jednostka oszczepnicza.

## Wyzwalacz

Kontynuacja `R-ZELAZO-MODELE-BRAKUJACE-Q1` po zamknięciu T1/T2/T3. Pełny kontekst, ECHO
właściciela i podział na tematy: `docs/decyzje/R-ZELAZO-MODELE-BRAKUJACE-Q1.md`.

## Izolacja

Nowa gałąź `autobot/ZELAZO-T4-Q1`, odgałęziona od `origin/main` (zawiera już T1+T2+T3),
osobny worktree per rola.

## Allowlista

- `gra/src/render/units.ts` — WYŁĄCZNIE: (a) nowy import nowego buildera, (b) nowa gałąź
  rozpoznania po nazwie w `buildNamedUnit()`. Zero zmian w generycznym `case 'konnica'`
  (ok. `units.ts:3202-3299`) — nadal obsługuje resztę jeźdźców bez dedykowanego modelu.
- Nowy plik w `gra/src/render/`, konwencja nazewnictwa rodziny Opus 5, np.
  `zelazo-jezdziec-oszczepami-opus5.ts`.
- `gra/tools/*` — nowy lub rozszerzony test regresji renderowania (real render).

Poza zakresem: `Drużynnik` (Słowianie, Żelazo, już ma dedykowany model w
`jednostki-z3-plemiona.ts`) — WOLNO CZYTAĆ jako referencję stylu/spójności kulturowej,
NIE WOLNO zmieniać.

## Kontekst techniczny (z reconu orkiestratora, do potwierdzenia przez Operatora)

**Dane jednostki** (`units.json`): Typ=Mount, Klasa=Specjalna, `Atak dystansowy=2`,
`Zasięg ataku (hex)=2`, `Ilość pocisków=5`, `Rola (linia)=Flanka`, Pancerz niski (3),
`Uwagi`: „Lekka konnica leśna; rzut oszczepami/szczepnikami przed walką wręcz". Nazwa EN:
„Slavic Javelin Cavalry". To jest LEKKI, mobilny oszczepnik konny — NIE ciężka lanca
(Asyria, T1) i NIE łucznik (T1) — musi się różnić bronią (oszczep/szczepnik do rzutu, nie
łuk ani kopia) i sylwetką (lekki pancerz, „leśny" kontekst sugeruje minimalne oporządzenie).

**Kultura „Słowianie" NIE jest dziś rozpoznaną `Culture`** w silniku renderowania
(`units.ts`, typ `Culture` = rzym|grecja|chiny|zulu|inka|egipt|sumer|germanie|neutral).
Operator NIE MUSI rozszerzać tego typu — dispatch po NAZWIE JEDNOSTKI (jak reszta rodziny
Opus 5) omija ten system w ogóle, tak samo jak zrobiono to dla `Drużynnik` (też Słowianie,
`jednostki-z3-plemiona.ts`) — jeśli jednak Operator uzna rozszerzenie typu `Culture` o
`'slowianie'` za lepsze rozwiązanie (np. dla spójności z `applyCultureOverrides`), to
decyzja implementacyjna, do udokumentowania z uzasadnieniem.

**Istniejący kanon wizualny Słowian w repo** (`jednostki-z3-plemiona.ts`, `Drużynnik`,
ok. linii 33/81/378-...): wczesnosłowiański wojownik drużyny książęcej, ciemnoblond wąsy
(`TR_HAIR_SLAV = 0xa07840`), współdzielona funkcja wąsów „Słowianin / Gal" (ok. linii 350).
Trzymać się tego samego języka wizualnego (kolor włosów/wąsów, ogólny charakter
„wczesnosłowiański") dla spójności międzyjednostkowej tej samej kultury — ale jazda, nie
piechota, więc geometria konia/siedzenia musi być własna (nie kopiować Drużynnika 1:1).

**Rama historyczna do zbadania i udokumentowania (styl K1-K7):** wczesnosłowiańska
lekka jazda oszczepnicza, VI-X w. n.e. — źródła bizantyjskie (m.in. *Strategikon*
przypisywany Maurycjuszowi, opisujący taktykę Słowian/Antów: lekkie uzbrojenie, unikanie
otwartej walki, zasadzki leśne, użycie kilku krótkich oszczepów miotanych) są dobrym
punktem wyjścia do realnego badania, nie do ślepego kopiowania — Operator ma zweryfikować
i uzasadnić każdy element (uzbrojenie, brak/obecność pancerza, typ konia, uprząż stosowna
dla tej epoki i regionu — BRAK strzemion jeśli region/okres tego nie potwierdza, tak jak
rozstrzygnięto to dla `braz-konnica-opus5.ts` K1, ale sprawdzić czy dla Żelaza/Słowian
wczesnego średniowiecza strzemię już jest udokumentowane — to inna rama czasowa niż Brąz).

## Kryteria sukcesu

1. Nowy, dedykowany model — jawne rozpoznanie po nazwie, nie generyczny fallback.
2. Jeździec dzierży OSZCZEP/OSZCZEPY gotowe do rzutu (nie kopię/lancę trzymaną
   nadręcznie jak w generycznym `case 'konnica'`), zgodnie z `Atak dystansowy=2`/
   `Ilość pocisków=5`.
3. Wizualnie ODRÓŻNIALNY od generycznego `Konnica` (Brąz), generycznego `case 'konnica'`
   fallbacku, i od jednostek z T1 (Asyria — inna broń/kontekst kulturowy).
4. Spójny stylistycznie z istniejącym `Drużynnik` (ta sama kultura) bez kopiowania 1:1
   geometrii pieszej na konną.
5. Sekcja „ZGODNOŚĆ HISTORYCZNA" (K-style, z realnym uzasadnieniem, nie zgadywaniem).
6. Zero regresji dla innych jeźdźców/kultur i dla `Drużynnik`.
7. Real render Playwright/Chromium (bezwarunkowy wymóg, `R-PROC-AUTOBOT.md` §9 poz. 6a) —
   zmierzone proporcje względem `HEX_R`.
8. `tsc --noEmit` i `vite build` (C-001) czyste; testy tematu + 5 bramek referencyjnych
   zielone.
9. Szczegóły historyczne budzące niedającą się rozstrzygnąć wątpliwość — Operator
   dokumentuje wybór i uzasadnienie (§10, decyzja implementacyjno-badawcza, nie
   produktowa), nie pyta właściciela.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna
gałąź. Limit 5 rund. Model/effort: **Opus 5 High dla Operatora i Evaluatora**
(temat czysto wizualny, `R-PROC-AUTOBOT.md` §5a), Final Control Sonnet 5 High.

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–9 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1 (po zamknięciu T1/T2/T3).
DEPLOY/PUSH: NIE WYKONANO.
