# WKLEJKA CALOSC — POLE-BITWY HUD v4 (skopiuj caly blok ponizej do Design)

Plik referencyjny w repo: `docs/ux/WKLEJKA-DESIGN-POLE-BITWY-CALOSC.md`  
Repo: Civ (The Game) — sciezka `docs/ux/`

---

```
═══════════════════════════════════════
REGUŁA NAZEWNICTWA — OBOWIĄZKOWA
═══════════════════════════════════════

ZLECENIE-ID: POLE-BITWY-HUD-v4-2026-07-04
DATA ZLECENIA: 2026-07-04

1) Każdy plik .dc.html — nazwa MUSI zawierać ID, opis, wersję, DATĘ, (1E).

2) JEDEN plik ZIP:
   POLE-BITWY-HUD-v4-2026-07-04.zip

3) W ZIP (korzeń):
   · wszystkie .dc.html
   · DESIGN-do-UI_POLE-BITWY-HUD-v4.md
   · MANIFEST.txt

4) Po gotowości napisz:
   „Paczka POLE-BITWY-HUD-v4-2026-07-04.zip gotowa” + lista plików.

NAZWA POBRANIA (Maciej):
POLE-BITWY-HUD-v4-2026-07-04.zip

═══════════════════════════════════════
TREŚĆ ZLECENIA
═══════════════════════════════════════

START — POLE-BITWY HUD v4 · styl 1E · zero emoji

CEL: Mockupy 1E sync z grą (Gra-podglad-POLE-BITWY.html, build manual-polish).
v2/v3 mockupy = ARCHIWUM — nie edytować.

DELIVERABLES (ZIP MUST):

1) The Game - C06 Deployment v4 2026-07-04 (1E).dc.html
   · JEDEN plik, 3 klatki/sekcje @1920:
     A) Deploy
     B) Walka AUTO (roster ukryty, toolbar ukryty, rail widoczny)
     C) Walka R + lewy roster (scroll pionowy)

2) The Game - C09 Roster lewy panel v4 2026-07-04 (1E).dc.html
   · OSOBNY plik
   · Lewy panel W KONTEKŚCIE mapy (wcięty od lewej, NIE neutralne tło)
   · Mini-klatka: >30 kart ze scrollbarem 1E

3) DESIGN-do-UI_POLE-BITWY-HUD-v4.md (MUST)
   · Mapowanie regionów UI → battleScene.ts / battleHudTheme.ts
   · Tooltips pełne słowa dla skrótów rail (P/V/R/M/MUZ/H/>>/WYCOF)

4) MANIFEST.txt

5) PNG @1920 (mile widziane, wrzuci Maciej do repo):
   · 3 stany C06 + C09 → docs/ux/pipeline/02-po-design/grupa-C/

STARE BRIEFY — NIE STOSOWAĆ:
· DESIGN-BRIEF-C06-v4-map-redesign (pionowe morale, dolny dock TW)
· DESIGN-BRIEF-C09-roster-tw-v3 (dolny dock 2 rzędy)
· C-07 dolny pasek komend
Obowiązuje DELTA + spec poniżej.

MUST TREŚĆ (Maciej + MASTER zatwierdzone):

· Lewy panel = ROSTER jednostek (~368–370px @1920), NIE formacje F1/F2/F3
· Formacje F1/F2/F3 = dolny toolbar (Formacja · Konnica · Linie) — tylko deploy
· Deploy dolny pasek: Formacja · Konnica · Linie · Taktyka · Strategia · Reset · Start walki (CTA)
· Walka R: toolbar = tylko Taktyka + Strategia
· Filtry roster: Konnica · Piechota · Łucznicy · Wszystkie · Grupa 1–3 · Generał
· Zaznaczenie: Odznacz · Grupuj · Rozgrupuj (◆ może być SVG diament z brand-book)
· Komendy = prawy rail 56px: P · V · R · M · MUZ · H · >> · WYCOF (SVG)
· LOGI / USTAWIENIA na deploy: NIE (dźwięk = rail)
· Log starć: NIE w paczce 1 (ani deploy, ani AUTO/R)
· Top: tura · prędkość · VS · ikony typów K/P/Ł · Wycofaj się
· Top deploy: emblemat cywilizacji + miecz/tarcza TAK
· Pasek mocy POZIOMY: zielony (Ty) | czerwony (wróg) + etykieta „Ostatnie starcia”
· Mapa placeholder B: heksy + sylwetki + ramki grup + złota obwódka + linia podziału nieb/czerw
· Minimapa: TAK lewy dół obok rosteru (deploy + R)
· Rail we WSZYSTKICH 3 stanach C06
· Stan AUTO: R na railu bez podświetlenia
· Stan R: dyskretny hint „SPACJA = tura”
· Taktyka/Strategia: 1 klatka z OTWARTYM popupem Taktyka
· Chips lewej kolumny toolbara: Design proponuje chip 1E, treść jak kod
· Start walki: czerwony gradient CTA (default) + wariant B złoty 1E w stopce mockupu

KARTA JEDNOSTKI (C09) MUST:
· ikona typu SVG · nazwa skrócona · badge grupy · pasek HP · pasek morale · HP tekst
· obwódka zaznaczenia niebieska (Ty) · martwy/routed = przyciemnienie
· filtry: aktywny chip złoto 1E; akcent per typ OK (błękit/złoto/piaskowy)

STYL:
· Tokeny 1E · Ty #3a6ad0 · wróg #c84040 · złoto #e8d88a
· Zero emoji · SVG line icons

POZA SCOPE PACZKI 1:
C-01 pre-bitwa · C-12 koniec · C-19/C-20 oblężenie · balans walki

REFERENCJE W REPO (Maciej/Cursor):
docs/ux/MASTER-DELTA-POLE-BITWY-vs-mockupy.md
docs/ux/DESIGN-SPEC-POLE-BITWY-HUD-v4-2026-07-04.md
docs/ux/export/C-POLE-BITWY-review-3stany.html
Gra-podglad-POLE-BITWY.html

DoD:
□ C06 — 3 klatki Deploy/AUTO/R
□ C09 — kontekst mapy + scroll >30
□ Popup Taktyka otwarty
□ Minimapa deploy+R
□ DESIGN-do-UI + MANIFEST
□ Zero emoji · Start czerwony (+ wariant B złoty w stopce)
```
