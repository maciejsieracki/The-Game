# 02 — EVALUATOR (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1`
MODEL+EFFORT: Opus 5, effort high (§5a — temat wizualny)

GOAL: usunąć z panelu trybu budowy zdublowany blok **warstwy (a)**
(`CityPodzialPracy.procentBudynki`) i udostępnić tam **warstwę (c)**
(`UlepszeniaEmpirePolicy.pracaAutoPercent` / `City.ulepszeniaPracaPercent`) niezależnie od
trybu. Zgodny z `00-dispatch.md` co do zdania (§16a poz. 9) — brak rozjazdu.

ZMIANY/COMMIT: worktree `/home/user/wt-ev-warstwa` (detached, HEAD `9fac5df4`; gałąź trzyma
worktree Operatora). `merge-base origin/main HEAD` = `136e664c` (§9 poz. 9 — `main` stoi na
`8b6a64d0`). Diff = 8 plików, **wszystkie w allowliście**: `buildModeHud.ts`, `main.ts`
(13 linii, tylko usunięcie pozycji kontraktu przy :19352), `gra/tools/*` (4 bramki + 1 nowa),
`01-operator.md`. `empireDetailPanel.ts`, `cityPanel.ts`, `gra/data/**`, `WERSJE.md` — 0 linii.
`git diff --check` czysty, zero sekretów (§16a poz. 5). Brak kolizji plikowej z równoległym
`R-REKRUTACJA-...-Q1` (tamten rusza `cityPanel.ts` — orkiestrator scala per hunk, §16a poz. 7).

TESTY (każda liczba odtworzona MOJĄ ręką w MOIM worktree, nie przepisana):
`tsc --noEmit` 0 · logic 213/213 · tech-tree 19/0 · research 33/33 · unit-replace 13/13 ·
combat 6/6 · kontrakt **637/0** · real-render **37/0** · ai-zakup 44/0 · scroll 43/0 ·
dyplo 26/26 · cap-migracja 11/0 · praca-split-ui 25/0 (istotnie: nie dotyczy tej zmiany) ·
slider-max 13/0 · żelazo-zrzuty **61/0** (`--out`) · nowa bramka tematu **28/0** ·
vite build `--outDir /tmp/civ-dist-ev` OK (forma C-001).

**Pomiary WŁASNE, celowo inne niż Operatora** (skrypty: `/tmp/claude-0/.../scratchpad/`):
1. `ev-warstwa-c.cjs` **23/0** — panel montowany w **geometrii PRODUKCYJNEJ**
   (`position:fixed`, 270 px, `max-height`+`overflow-y:auto`), pełna scena (kanwa, 22 realne
   ulepszenia, cud), **bez** nadpisania `style.cssText`, którego użył Operator. Warstwa (c)
   w obu trybach: niezerowa geometria, **wewnątrz** prostokąta panelu, **topmost w
   `elementFromPoint`**, `max=100`; warstwa (a) — 0 wystąpień w całym dokumencie.
2. Sprawdzenie ODWROTNE **realną myszą** (`page.mouse`, nie `dispatchEvent`): przy
   `tryb:'auto'` klik w 80% toru wywołuje `onUlepszeniaEmpirePracaPercentChange` i po
   ponownym renderze panel **pokazuje** nową wartość; przy `tryb:'reczny'` ten sam klik
   **nie zapisuje nic** — pole jest martwe, nie tylko wyszarzone.
3. `ev-mutacje.cjs` **5/0** — nietautologiczność MOJEGO harnessu: M1 (cofnięte p.2) gasi
   warstwę (c) w trybie ręcznym, M2 (cofnięte p.1) przywraca markup warstwy (a). Repo nietknięte.
4. `ev-budzet.cjs` **13/0** — zamiast liczyć sztuki, mierzę **wydatek w P** i arytmetykę
   pułapu w `auto-improvements.ts` (pula 5 000): 0%→0 P, 10%→480 P, 25%→1 240 P, 50%→2 480 P,
   75%→3 720 P, 100%→5 000 P — każdy ≤ `pct%×pula`, monotonicznie, ta sama wartość przy innej
   puli daje inny pułap. Liczby Operatora (480 P/12, 2 480 P/62) **potwierdzone niezależnie**.
   Mutacja odpinająca pułap od warstwy (c) czerwieni asercję. Ścieżka realna: suwak →
   `pol.pracaAutoPercent` → `main.ts:27087 pracaBudgetPercent:` → `imperiumBudgetCap`.
5. `ev-warstwa-a.cjs` **12/0** — warstwa (a) w swoich dwóch prawowitych miejscach, mierzona
   **pełnym obiegiem zapis→ponowny render→odczyt tego, co panel POKAZUJE** (Operator mierzył
   sam zapis): panel imperium 70→60 i po renderze pokazuje 40%/60% (suma 100), MAX→50, MIN→100,
   cap 0–50 nietknięty; panel miasta 70→90 i po renderze pokazuje 90, zakres 50–100.
6. Zrzuty z żywego Chromium w geometrii produkcyjnej, obejrzane: `/tmp/civ-shots-ev-warstwa/
   EV-reczny.png`, `EV-auto.png`. Blok warstwy (a) nie występuje w żadnym.

Cztery zaktualizowane bramki przejrzane po jednej: żadna asercja nie została wyłączona ani
rozluźniona — każda ma uzasadnienie „co pilnowała / dlaczego przestało być prawdą / co pilnuje
teraz" i kontrolę negatywną; bilans asercji rośnie (634→637, 36→37, 11→13). Zgłoszenie §13a
Operatora o fałszywie zielonym regeksie (`praca-jeden-podzial-real-render-test:156` trafiał
w komentarz) potwierdzam — poprawka liczy na źródle ze zdjętymi komentarzami.

BLOKADY: brak. Save/load bez zmiany schematu (`ownerDefaultPodzialPracy` — warstwa (a) —
nadal migrowana w `main.ts:32014`); parytet AI nietknięty (`ai.ts:1996 pracaBudgetPercent: 100`).

UWAGI (kosmetyczne, POZA allowlistą tego tematu — proszę orkiestratora o wpis do
`REJESTR-PROSB-I-ZADAN.md` jako osobny temat, §3b):
1. `main.ts:4808 procentPuliImperiumForOwner()` — jedynym konsumentem był usunięty
   `getEmpirePracaSplit`; funkcja jest teraz martwa (0 wywołań). Usunięcie leży poza
   allowlistą (`main.ts` tylko ~:19352-19359), więc pozostawienie jej jest zgodne z zakresem.
2. `main.ts:19391` — komentarz w handlerze warstwy (c) nadal nazywa ją „pole (b)". W temacie
   o ośmiu nawrotach na myleniu warstw to najbardziej mylący nagrobek, jaki został; poza allowlistą.
3. `praca-jeden-podzial-kontrakt-test.cjs` — asercja „HUD budowy: suwak warstwy (c) nadal jest
   renderowany" to regex po własnym źródle; sama w sobie tautologiczna, ale dowód behawioralny
   tej własności stoi w bramce real-render, więc jako kotwica źródłowa jest do przyjęcia.

RUNDY: 1/5.
NASTĘPNY KROK: Final Control (osobny subagent). Worktree `/home/user/wt-ev-warstwa`
zostawiony, `gra/node_modules` podlinkowane symlinkiem do `/home/user/The-Game/gra/node_modules`.
DEPLOY/PUSH: NIE WYKONANO.
