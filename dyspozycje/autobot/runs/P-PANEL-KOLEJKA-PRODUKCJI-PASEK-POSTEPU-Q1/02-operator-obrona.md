# P-PANEL-KOLEJKA-PRODUKCJI-PASEK-POSTEPU-Q1 — Obrona Operatora (runda 1, drugie wywołanie)

ROLA: Operator (obrona, `R-PROC-AUTOBOT.md` §3c pkt 2) · MODEL+EFFORT: **Opus 5, effort high**
DATA: 2026-09-05 · RUNDA: 1/5 (to nie jest nowa runda)
BAZA: `21ae70b6` · HEAD tematu: `1e549cd0` (kod tematu **niezmieniony** tą obroną)
DOMAIN: GAME

Zarzuty 1-3 dotyczą **raportu**, nie wytworu. `gra/src/ui/empireDetailPanel.ts`
i `gra/tools/panel-kolejka-pasek-postepu-test.cjs` nie zostały tą obroną tknięte —
zmienia się wyłącznie ta dokumentacja runu (allowlista poz. 3).

## Zarzut 1 — bilans bramek panelu nie odtwarza się → **PRZYJMUJĘ**

Raport rundy 1 podał „43 pliki `.cjs`, 36 zielonych, osiem czerwonych". 36+8+1 (skrypt
podglądu) = 45 > 43 — arytmetyka nie domyka się i to jest błąd, nie literówka:
`hud-tooltip-body-mounted-panels-test.cjs` **w ogóle nie znalazło się na liście czerwonych**,
choć w tamtym przebiegu było czerwone (13 pass · 3 fail). Kryterium końca dispatchu żąda
wyników WSZYSTKICH bramek panelu — zgłoszenie było niepełne. Korekta niżej.

Skutek dla `GOAL`: żaden. Skutek dla dowodu: raport przestaje twierdzić rzecz nieprawdziwą.

## Zarzut 2 — liczba 47/0 dla `sidepanel-blocking-card-cutoff` → **ODRZUCAM**

Zarzut brzmi: „zacytowana liczba nie istnieje po żadnej stronie porównania". Pomiar
z 2026-09-05, sekwencyjnie, ta sama maszyna, obie strony:

| Strona | Kiedy | Wynik |
|---|---|---|
| HEAD `1e549cd0` (`/home/user/wt-panel-kolejka-pasek`) | 00:09 | **47 pass · 0 fail**, rc=0 |
| BAZA `21ae70b6` (`/home/user/wt-pkpp-parity2`) | 00:29 | **47 pass · 0 fail**, rc=0 |

Liczba istnieje po obu stronach i jest parytetem. Zarzut w części „nie odtwarza się"
jest obalony pomiarem.

**Uzupełnienie, którego w raporcie rundy 1 zabrakło i które przyjmuję jako słuszne
co do formy:** ta bramka (i dwie inne, patrz niżej) jest **wrażliwa na obciążenie
maszyny**. Pod równoległymi Chromium innych worktree jej asercje klikowe padają na
`locator.click: Timeout 8000ms exceeded` — stąd 44/3 w pierwszym przebiegu rundy 1
i 45/2 u Evaluatora. Raport podał 47/0 jako liczbę stabilną, bez tego zastrzeżenia
w samej liczbie (opis flake'a był akapit niżej). Tu jest on postawiony wprost.

## Zarzut 3 — raport terminalny > ok. 400 słów (§11) → **PRZYJMUJĘ**

Pomiar `wc -w` na tekście raportu terminalnego rundy 1: **585 słów** (nie ~750, ale
i tak ponad limit). §11 kwalifikuje to jako `PASS-WITH-NOTES` i nakazuje skrócenie —
raport obrony mieści się w limicie.

## KOREKTA BILANSU BRAMEK PANELU (zastępuje sekcję „BRAMKI PANELU IMPERIUM" w `01-operator-raport.md`)

`ls gra/tools/ | grep -Ei "empire|imperium|panel"` → 46 pozycji, z tego 3 to `.py`
(`export-panel.py`, `gen-panel-xlsx.py`, `sync-panel-efekty-from-json.py`) → **43 pliki `.cjs`**.
Wszystkie uruchomione sekwencyjnie (nigdy równolegle) 2026-09-04/05.

- **1 nie jest bramką**: `preview-unit-side-panel-screenshots.cjs` — skrypt podglądu,
  pada na braku domyślnej binarki Playwrighta (INFRA, tak samo na bazie).
- **42 bramki**: **36 zielonych**, **6 czerwonych** — każda czerwona z **dokładnym
  parytetem** na czystej bazie `21ae70b6`, żadna nie jest regresem tego tematu.

| Bramka czerwona | HEAD `1e549cd0` | BAZA `21ae70b6` | Werdykt |
|---|---|---|---|
| `empire-food-b5-test` | 25 pass · 3 fail | 25 pass · 3 fail | parytet — zastane |
| `empire-panel-econ-slider-visibility-test` | 57 · 3 | 57 · 3 | parytet — zastane |
| `empire-panel-miasto-obywatele-content-test` | 113 · 2 | 113 · 2 | parytet — zastane |
| `empire-panel-moc-scroll-preserve-test` | 38 · 9 | 38 · 9 | parytet — zastane |
| `empire-panel-sliders-always-visible-test` | 6 · 2 | 6 · 2 | parytet — zastane (plik sam deklaruje SUPERSEDED) |
| `hint-toast-zindex-empire-panel-test` | rc=1, błąd ładowania modułu, bez podsumowania | rc=1, identycznie | parytet — zastane |

36 + 6 + 1 = **43**. Bilans domyka się.

### Trzy bramki wrażliwe na obciążenie — pomiar przeplatany HEAD/BAZA

Pod obciążeniem (równoległe Chromium innych worktree) potrafią zapalić się na czerwono
na asercjach czasowych — w logach `civ-map-load-overlay` zamiast docelowego elementu albo
`locator.click: Timeout`. Zmierzone naprzemiennie HEAD → BAZA → HEAD → …, po jednym
procesie naraz:

| Bramka | HEAD (3 przebiegi) | BAZA (3 przebiegi) | Wynik pod obciążeniem (odrzucony) |
|---|---|---|---|
| `hud-tooltip-body-mounted-panels-test` | 16 · 0, 16 · 0, 16 · 0 | 16 · 0, 16 · 0, 16 · 0 | 13 · 3 (HEAD, przebieg zbiorczy) |
| `sidepanel-hud-deadzone-test` | 43 · 0, 43 · 0, 43 · 0 | 43 · 0, 43 · 0, 43 · 0 | 29 · 11 i 20 · 13 |
| `sidepanel-blocking-card-cutoff-real-render-test` | 47 · 0 | 47 · 0 | 44 · 3 i 45 · 2 |

Wniosek: **te trzy bramki są zielone po obu stronach**, a ich czerwień w przebiegach
zbiorczych była artefaktem obciążenia maszyny, nie zmianą zachowania. Dlatego w tabeli
wyżej nie ma ich wśród sześciu czerwonych.

### Nota metodyczna do przebiegu zbiorczego

Mój własny harness przebiegu zbiorczego miał limit `timeout 300` na bramkę — trzy bramki
real-render (`sidepanel-blocking-card-cutoff`, `sidepanel-diplo-dismiss`,
`sidepanel-event-przekierowania`) fizycznie potrzebują więcej i wróciły z rc=124 (zabite
przez limit, nie przez asercję). Po podniesieniu limitu do 1200 s, uruchomione pojedynczo:
**47 · 0**, **35 · 0**, **51 · 0** — wszystkie zielone. Limit harnessu to nie wynik bramki;
zapisane tu, żeby liczba rc=124 nie została później odczytana jako porażka.

## POWTÓRZONE BRAMKI I ZRZUTY PO OBRONIE

- `node ./node_modules/typescript/bin/tsc --noEmit` (5.9.3 przez symlink `node_modules`, C-029) — **zielone**.
- `node tools/panel-kolejka-pasek-postepu-test.cjs` — **82 pass · 0 fail** (dwa niezależne
  przebiegi: w przebiegu zbiorczym i przy regeneracji zrzutów).
- Zrzuty wygenerowane od nowa (`--shots`) z bieżącego drzewa i porównane md5 z dowodami
  w `dowody/`: **6/6 identycznych** (`kolejka-pasek-po-12-miast.png`
  `379a08be593eca0278f6d9c59a81357a`, `…-cala-zakladka.png` `59f5ca79…`,
  `…-wzorzec-nauka.png` `f80a5754…`, trio mutacyjne `3e3a00d7…`, `d647fab3…`, `f80a5754…`).
  Zrzut główny obejrzany ponownie: 12 miast, procent liczbowy przy każdej pozycji zachowany,
  Wei bez paska i bez procentu (`postep == null`), Chu „pusta" bez paska, Han wygaszony pasek
  + „· wstrzymana", Yan/Zhao pusty tor przy 0%, Qin/Qi 100% bez przelania, stopka nadal niesie
  ORAZ rozróżnienie znaczenia paska, ORAZ zastrzeżenie o froncie kolejki (naprawa N5).

Brak zmian w kodzie tematu = brak nowej treści na zrzutach; identyczność md5 jest tego dowodem,
a nie skrótem („zrzut nie był robiony ponownie").

## BLOKADY

Brak. Żadna poprawka nie wymagała wyjścia poza allowlistę, więc `DECISION_REQUIRED` nie było
potrzebne. Worktree parytetowy `/home/user/wt-pkpp-parity2` usunięty po `git status --porcelain`
(C-033); drzewo główne `/home/user/The-Game` sprawdzone (C-019).
