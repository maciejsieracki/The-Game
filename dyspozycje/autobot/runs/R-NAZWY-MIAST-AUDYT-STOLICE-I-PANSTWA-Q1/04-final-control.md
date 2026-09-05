# R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1 — Final Control, runda 1/5

STATUS: PASS
DOMAIN: GAME
TEMAT: R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
GOAL: `Aszur` na `miasta_cywilizacji[0]` Asyrii, `Byblos` na `[0]` Fenicji (`Ninive` i `Tyr` dalej na listach) + rozłączne pule `miasta_panstwa` × `miasta_cywilizacji` dla 15 cywilizacji. Zgodny z `00-dispatch.md`; ID i GOAL bez zmian we wszystkich rundach (§16b pkt 1-2).
MODEL+EFFORT: Sonnet 5, effort high · ROLA: Final Control (sędzia, §3c pkt 3) · RUNDY: 1/5

## ZMIANY/COMMIT

`20016500` + `cd9b7b19`, baza `01da66d1`, ratyfikacja `a4449fc2`. Dziewięć plików, wyłącznie
allowlista (po ratyfikacji `civs.json`). **`gra/src/**` — ZERO zmian.**

## TESTY (uruchomione samodzielnie)

`civs.json` base↔HEAD po odjęciu `nazwyKlastra`: **identyczne** — zmienione tylko 14 tablic
`nazwyKlastra`, dokładnie tych cywilizacji ze zmienionym `miasta_panstwa`. Zmiana chirurgiczna.

W danych: **15/15 = 100+10**, przecięcie MP×MC **puste**, zero duplikatów w listach,
`nazwyKlastra === miasta_panstwa` 15/15. `asyria.MC[0]=Aszur` (`Ninive`→`[1]`),
`fenicjanie.MC[0]=Byblos` (`Tyr`→`[2]`), `harappa.MC[0]=Harappa` nietknięte. Skład MC zmieniony
tylko u Asyrii: −`Assur` +`Aszur`. Duplikaty MIĘDZY cywilizacjami **93→94** (tylko `Aszur`, nic
ze 118 nie usunięte). Kolizje w bazie **125** — korekta orkiestratora potwierdzona.

Bramki: rozlaczne-pule 9/9 · city-names-pool 12/12 · city-names-pools 6/6 · civ-names 6/6 ·
mapa-etykieta-stolicy 47/47 · display-names 27/27 · `tsc --noEmit` 0 · logic 213/213 ·
tech-tree 19/19 · research 33/33 · unit-replace 13/13 · combat 6/6 · `diff --check` czysto ·
brak sekretów.

**Nietautologiczność — 7 własnych mutacji.** Cofnięcie obu plików do bazy: **4 passed, 5 failed,
exit 1**. Osobno czerwienieją: K3 (skrócenie MP hetytów do 9 — tryb „rozwiązanie przez usunięcie"
złapany), K2 (kolizja u Zulusów), K1 (usunięcie `Tyru`; odwrócenie `[0]` Asyrii), K4 (duplikat
u Celtów), K5 (rozjazd lustra Babilonii). Restore → 9/9.

**Weryfikacja historyczna — własna próba z 7 cywilizacji** (Grecy, Rzymianie, Celtowie, Germanie,
Zulusi, Inkowie, Słowianie): **ani jednej nazwy wymyślonej ani z obcego kręgu**. Podmiany
poprawne i z właściwej epoki: `Hebenu` (stolica XVI nomu, od Starego Państwa), `Tjebu` (stolica
X nomu, gr. Antaiopolis), `Uznam` (`castrum Uznam`). Formy greckie u Egiptu 6/10 → 4/10.

**C-001 dotrzymane.** `export-data.py` odtwarza `civs.json` w całości z xlsx (l. 210) — 14 edycji
przetrwało, K5 zielone, brak `gra/dist`: `npm run build`/`dev` nie uruchomiono. Po mutacjach
drzewo przywrócone, `git status` pusty, HEAD `a4449fc2`.

## WERDYKTY (§3c pkt 3)

**1 → ODDAL.** Warunek ratyfikacji sprawdzony: 14× `nazwyKlastra`, reszta pliku identyczna,
`gra/src/**` bez zmian. Decyzja, o którą wnosił zarzut, już zapadła.

**2 → ODDAL.** Uruchomiłem sam: `playerStartCityName(civs,'grecy',pools)==='Ateny'`
(`city-names-pool-test.cjs:56`) zielone na realnym bundlu `src/` — ścieżka produkcyjna nietknięta.
Zmieniona asercja `civ-names-test.cjs:53` dotyczy tylko fallbacku bez puli; naprawa wymaga
`gra/src/**` → osobny temat, nie brak węzła bieżącego.

**3 → ODDAL.** Naprawione: `01-operator.md` ma `DECISION_REQUIRED` ze śladem korekty §13b.

**4 → ODDAL.** `Antinoupolis` (Hadrian, 130 n.e.) usunięty; `Hebenu` poprawne, właściwa epoka.

**5 → ODDAL.** `Karanis` (fundacja ptolemejska ex nihilo) usunięty; `Tjebu` poprawne.

**6 → ODDAL.** `Meklemburg` usunięty; `Uznam` to autentyczna forma słowiańska właściwej epoki.

**7 → ODDAL.** Dowód z wytworu: MC Asyrii traci `Assur`, zyskuje `Aszur` — ta sama nazwa w dwóch
transliteracjach, długość nadal 100, `Ninive` zachowane. Kryteria 1, 3 i 4 wymuszają tę operację;
zapis dispatchu chronił `Ninive` i `Tyr`, i one zostały.

**8 → ODDAL.** Naprawione: **384 słowa** wobec limitu ok. 400 (§11).

Agregat (§16b pkt 8): zero `NAPRAW`, zero `DO DECYZJI CZŁOWIEKA`, osiem `ODDAL` → **PASS**.
Każdy zarzut ma obronę i werdykt (pkt 3); licznik rund niezresetowany, obrona nie zużyła rundy.

## BLOKADY

Jedna, ręką orkiestratora **przed integracją** (§16b pkt 4, §14): `P-CIV-NAMES-FALLBACK-BEZ-PULI-Q1`
istnieje tylko w `00-dispatch.md`, **nie ma go w `REJESTR-PROSB-I-ZADAN.md`** — bez wpisu
znalezisko z zarzutu 2 zginie. Temat bieżący jest w rejestrze i zgodny ze stanem faktycznym.

Noty nieblokujące: `egipt.MP[4] Tebtynis` — forma grecka, ale realny toponim z osadnictwem
przedptolemejskim, nie klasa `Karanis`. `Cywilizacje.xlsx` nie istnieje w repo, więc
`export_cywilizacje()` i tak się nie wykona — `civs.json` jest utrzymywany ręcznie jak dotąd.

RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora do `main` (allowlist-only, per plik i per hunk), po
zarejestrowaniu `P-CIV-NAMES-FALLBACK-BEZ-PULI-Q1`. Potem `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO
