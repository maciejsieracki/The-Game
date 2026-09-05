# R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1 — Evaluator, runda 1/5

STATUS: ZARZUTY (8) — Evaluator nie wydaje werdyktu PASS/FAIL (§3c)
DOMAIN: GAME
TEMAT: R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
GOAL: zgodny z `00-dispatch.md` — Aszur/Byblos na pierwszych pozycjach (Ninive i Tyr dalej na listach) + rozłączne pule `miasta_panstwa` × `miasta_cywilizacji` dla 15 cywilizacji. §16a pkt 9: bez rozjazdu.
MODEL+EFFORT: Opus 5, effort high · ROLA: Evaluator · RUNDY: 1/5

## SPRAWDZONE SAMODZIELNIE (nie ze streszczenia)

Baza `01da66d1`, commit `20016500`, drzewo czyste. Zmierzone w danych: 15/15 cywilizacji ma
**100 + 10** nazw, przecięcie MP×MC **puste**, zero duplikatów wewnątrz list. `asyria.MC[0]=Aszur`,
`Ninive` na `[1]`; `fenicjanie.MC[0]=Byblos`, `Tyr` na `[2]`. `harappa.MC[0]=Harappa` nietknięte.
Duplikaty MIĘDZY cywilizacjami: 93→94 w MC (jedyny przyrost to `Aszur`) — nic z 118 pozycji poza
zakresem nie zostało usunięte. `civs.json` zmieniony chirurgicznie: wyłącznie 14× `nazwyKlastra`.

Bramki uruchomione przeze mnie: `nazwy-miast-rozlaczne-pule` 9/9 · `city-names-pool` 12/12 ·
`city-names-pools` 6/6 · `civ-names` 6/6 · `mapa-etykieta-stolicy` 47/47 · `display-names` 27/27 ·
logic 213/213 · tech-tree 19/19 · research 33/33 · unit-replace 13/13 · combat OK ·
mgla-sciezka-inwariant OK · `tsc --noEmit` exit 0 · `git diff --check` czysto · brak sekretów.

**Nietautologiczność — 9 własnych mutacji na kopii danych poza worktree**, każde K czerwienieje
osobno: K1 (odwrócenie MC[0] Asyrii; MC[0]=Sydon; usunięcie `Ninive`), K2 (kolizja MP/MC u Greków),
K3 (MP=9 u Rzymian; MC=99 u Egiptu), K4 (duplikat w MP Sumeru), K5 (rozjazd `nazwyKlastra` Hetytów).
Baseline i restore = 9/9 zielone. Na danych z `01da66d1` (oba pliki cofnięte): **4 passed, 5 failed,
exit 1** — nie „3/6" jak w raporcie (inny zakres cofnięcia; nie jest to wada).

**Weryfikacja historyczna — próba ze wszystkich 14 zmienionych cywilizacji.** Nie znalazłem ani
jednej nazwy WYMYŚLONEJ. Sumer (Hamazi, Simurrum, Szaszrum, Zimudar, Kimasz, Diniktum),
Asyria (Ekallatum, Apku, Kurbail, Talmusu, Isana, Kahat, Nasibina, Amedi, Rasappa, Sinabu),
Hetyci (Kussara, Arinna, Samuha, Hakmis, Katapa, Ankuwa, Durmitta + wasale Amurru/Nuhasse/Astata),
Harappa (Shortugai, Khirsara, Kanmer, Juni Kuran, Kotada Bhadli, Loteshwar, Bhagatrav, Siswal),
Babilonia (Bit-Jakin…Bit-Sa'alli, Gambulu, Puqudu, Zabban, Nemed-Laguda), Grecja, Rzym, Celtowie,
Germanie, Zulusi, Inkowie, Fenicja — wszystkie to poświadczone toponimy właściwego kręgu. Trzy
pozycje kwestionuję niżej (zarzuty 4–6).

## ZARZUTY

**1. `gra/data/civs.json` — poza allowlistą (§16a pkt 1).** 14 wpisów `nazwyKlastra` (grecy…fenicjanie).
Dispatch §ALLOWLISTA wymienia trzy ścieżki + katalog runu; `civs.json` nie jest żadną z nich. Zmiana
jest wymuszona przez `validateCityNamesPools` (`gra/src/game/civ-names.ts:167-172`, `nazwyKlastra ≠
miasta_panstwa` → błąd), więc kryterium 6 bez niej jest nieosiągalne — ale rozszerzenie allowlisty
należy do właściciela, nie do Operatora.

**2. Regresja ścieżki legacy dla WSZYSTKICH 15 cywilizacji (§16a pkt 4 — ścieżka brzegowa).**
`playerStartCityName` i `foreignCapitalCityName` bez puli czytają `nazwyKlastra[0]`
(`gra/src/game/civ-names.ts:63, 96`). Po zmianie awaryjna stolica to Grecy `Sykion`, Rzymianie `Nola`,
Egipt `Tinis`, Asyria `Ekallatum` — zamiast Ateny/Rzym/Memfis/Aszur. Raport wymienia tylko Greków.
Dodatkowo zielona dotąd asercja `N-1A Grecy → Ateny` została **nadpisana** na `→ Sykion`
(`gra/tools/civ-names-test.cjs:53`) — bramka błogosławi regresję, zamiast ją wyłapać.

**3. Status raportu niezgodny z dispatchem.** Dispatch §ALLOWLISTA: „jeśli okaże się, że potrzebna
jest zmiana w kodzie, **zatrzymaj się na `DECISION_REQUIRED`**". Zarzuty 1 i 2 to dokładnie ten
przypadek (plik spoza allowlisty + naprawa wymagająca `gra/src/**`). Raport wystawia
`PASS-WITH-NOTES`, chowając decyzję właściciela w polu BLOKADY (§3b, §16b pkt 4).

**4. `egipt.miasta_panstwa[3] = "Antinoupolis"` — zła epoka (dispatch §REGUŁA PRZECIW SAMOOSZUKIWANIU).**
Miasto założone przez Hadriana w **130 n.e.**, nazwane od bityńskiego Antinousa — fundacja rzymska,
nie egipski „ośrodek zależny". To ponad tysiąc lat po epoce reszty listy (Tinis, Nagada, Sile, Pitom).

**5. `egipt.miasta_panstwa[5] = "Karanis"` — fundacja ptolemejska (III w. p.n.e.), grecka wieś Fajum.**
W tej samej liście grecką formę nazwy ma 6 z 10 pozycji (Akoris, Antinoupolis, Tebtynis, Karanis,
Terenuthis, Aphroditopolis). Sama pula `miasta_cywilizacji` Egiptu dopuszcza greckie egzonimy
(Aleksandria, Naukratis), więc zarzut dotyczy **zagęszczenia i epoki**, nie samej formy.

**6. `slowianie.miasta_panstwa[2] = "Meklemburg"` — zły krąg kulturowy.** To spolszczona forma
**niemieckiej** nazwy regionu; obodrycki gród nazywał się Mikelenburg/Wieligard. Nota Operatora
(„polska forma obodryckiego Mikilinborga") jest nietrafna. Pozostałe 99 nazw `slowianie.MC` i 9 z 10
`MP` to formy słowiańskie — ta jedna odstaje.

**7. Zmiana składu listy Asyrii wbrew literalnemu zapisowi dispatchu (§16a pkt 6).**
`asyria.miasta_cywilizacji`: usunięto `Assur`, dodano `Aszur`. Dispatch §GOAL pkt 1-2: „zmienia się
wyłącznie pierwsza pozycja, **nie skład listy**". Motyw (uniknięcie faktycznego duplikatu
`Assur`/`Aszur`) jest sensowny, ale to decyzja autorska właściciela, nie Operatora.

**8. Raport przekracza limit §11.** `01-operator.md` ma **609 słów** wobec „ok. 400"; §11 kwalifikuje
to jako `PASS-WITH-NOTES` z powrotem do skrócenia.

## NOTY (nie zarzuty — precedens istnieje w tym samym pliku)

- Inkowie: `Q'enqo`, `Tambomachay`, `Puka Pukara` to huaki/warownie, nie ośrodki — ale `MC` już
  zawiera `Sacsayhuamán`, `Moray`, `Sillustani`, `Ingapirca`.
- Fenicjanie: `Monte Sirai`, `Toscanos`, `Umm el-Amed` to nowożytne nazwy stanowisk, `Siga` jest
  numidyjska — precedens: `Kerkouane`, `Sa Caleta`, `Mogador`, `Cirta`, `Volubilis` w `MC`.
- Słowianie: `Czermno` = nowożytna wieś na miejscu Czerwienia; precedens `Chodlik`, `Stradów`, `Gdecz`.
- Nowe kolizje MIĘDZY cywilizacjami (poza zakresem, zgłaszam informacyjnie): `Bit-Jakin`,
  `Bit-Dakkuri`, `Bit-Amukani` (babilonia MP × asyria MC) oraz `Kisiga` (sumer) ≈ `Kisik` (babilonia) —
  ta druga to wariant transliteracji, czyli dokładnie klasa, którą Operator uznał za duplikat faktyczny.

## BLOKADY

Decyzje właściciela: rozszerzenie allowlisty o `gra/data/civs.json` (zarzut 1) i osobny temat na
`gra/src/**` dla ścieżki legacy (zarzut 2). Nie integruję, nie deployuję, nie pushuję.

RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora do zarzutów 1–8 (§3c pkt 2), potem Final Control (Sonnet 5, effort high).
DEPLOY/PUSH: NIE WYKONANO
