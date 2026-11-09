# R-WEB-TERMINOLOGY-TRADE-VS-TAX-Q1 — tabela audytu (runda 1/5)

Klasy: **A** = produkcja pola/budynku/ulepszenia/technologii nazwana „handlem” -> zmienione na „podatek” ·
**B** = prawdziwy handel (trasy, wymiana, umowy, kosze, cła, port/szlak) -> ZOSTAJE ·
**C** = niejednoznaczne -> NIE ZMIENIONE, do ABC · **T** = identyfikator/klucz/CSS/słowo „handle” — poza zakresem (nie jest tekstem dla gracza).

Metoda: (1) stringi TypeScript — parser AST (`typescript`), wszystkie literały zawierające `handel|handl` w `gra/src/**/*.ts`
(363 trafienia w 51 plikach; poprzednia próba samym wzorcem `handl` pomijała mianownik „handel”); (2) pola JSON — przegląd
liniowy `gra/data/*.json` i `gra/src/data/wikiBundle.json`; (3) źródła CIVPEDII — `docs/PORADNIK-GRACZA/**`, `docs/encyklopedia/**`.

Fakt kluczowy z kodu: pole `handel` w `TileYield` to **Podatek** (`economy.ts:396` czyta `row['Podatek'] ?? row['Handel']`;
`gra/src/game/danina-nazwa.ts` — decyzja 2026-07-27: strumień pól/miasta nazywa się zawsze „Podatek”; handel międzynarodowy to
osobny mechanizm „Handel ze szlaków”). Chip HUD „Handel” liczy WYŁĄCZNIE dochód z tras (`hud.ts handelChipTitle`) = B, nie C.

## 1. Pola danych JSON i generatory (zmienione = A)

| plik:pole | było | jest | klasa |
|---|---|---|---|
| tech-cards-top5 (via `gen-tech-cards-top5.cjs`) Rolnictwo tytuł | Farma: +3 żywności, +3 Pracy, +3 handlu na polu | …, +3 podatku na polu | A |
| … Rolnictwo zdanie | jedno pole daje naraz żywność, Pracę i handel. | … Pracę i podatek. | A |
| … Rolnictwo CMZ korzyść | zyskać +3 żywności, +3 Pracy i +3 handlu z pola | … +3 podatku z pola | A |
| … Łowiectwo tytuł / zdanie / CMZ | Obóz łowiecki: …, +2 handlu / …pieniądz i handel. / (+2 handlu) | +2 podatku / …pieniądz i podatek. / (+2 podatku) | A (3) |
| … Oswojenie zwierząt tytuł | Trzoda: …, +3 handlu, bez złoża | …, +3 podatku, bez złoża | A |
| … Oswojenie zwierząt tytuł+zdanie | Owce: …, +2 handlu na wzgórzu / …Praca i handel z pól… | +2 podatku / …Praca i podatek z pól… | A (2) |
| … Gospodarka wodna tytuł | Irygacja: …, +2 handlu przy rzece | +2 podatku przy rzece | A |
| … Koło tytuł+zdanie | Droga: +2 handlu na polu / …dodatkowy handel. | +2 podatku / …dodatkowy podatek. | A (2) |
| … Brązownictwo tytuł | Kopalnia miedzi: +20 rudy na turę, +5 handlu | …, +5 podatku | A |
| … Żegluga tytuł+zdanie | Łodzie rybackie: …, +3 handlu / …Pracę i handel. | +3 podatku / …Pracę i podatek. | A (2) |
| … Handel (tech) zdanie | Mennica, która mnoży handel (podatek) wszystkich miast | …mnoży podatek wszystkich miast | A |
| … Waluta tytuł+zdanie (zdania.json) | Mennica: ×1,50 podatku (handlu)… / mnoży handel netto… | ×1,50 podatku… / mnoży podatek netto… | A (2) |
| … Waluta Kopalnia złota tytuł/zdanie/CMZ | +10 handlu / daje handel i złoto / (+10 handlu) | +10 podatku / daje podatek i złoto / (+10 podatku) | A (3) |
| … Drogi brukowane tytuł+zdanie | +3 handlu na polu (Droga: +2) / więcej handlu niż zwykła Droga | +3 podatku… / więcej podatku niż… | A (2) |
| building-cards-top5 mennica Top1 zdanie (via `korekty.json`) | Mnoży podatek z handlu wszystkich miast… | Mnoży podatek wszystkich miast… | A |
| terrain-improvements.json droga.warunek | Handel (plon heksa) +2/turę | Podatek (plon heksa) +2/turę | A |
| terrain-improvements.json droga_brukowana.warunek | Handel (plon heksa) +3/turę | Podatek (plon heksa) +3/turę | A |
| wonders.json atrakcja turystyczna `opis` + legenda `handel_turystyka` | +10 do handlu / +N do handlu | +10 do podatku / +N do podatku | A (2) |
| improvementAdapter.ts BONUS_LABEL.handel (wiersz „Handel: +3” na karcie ulepszenia) | Handel | Podatek | A |
| wonderAdapter.ts BONUS_LABEL.handel | Handel | Podatek | A |
| main.ts:5040-5041 komunikat ukończenia cudu | (+10 handel, utrzymanie ÷2) | (+10 podatku, utrzymanie ÷2) | A (2) |
| cityPanel.ts:3569 pasmo Ładu | bonus do pracy i handlu | bonus do pracy i podatku | A |
| docs/encyklopedia/cuda/*.md (19) „Jedyny yield” | +10 handlu (turystyka) | +10 podatku (turystyka) | A (19) |
| docs/encyklopedia/pojecia/cuda-swiata.md:39 | +10 do handlu | +10 do podatku | A |
| docs/encyklopedia/ulepszenia/droga.md:27,40 | Handel (plon heksa) +2/turę / +2 Handel/turę | Podatek (plon heksa)… / +2 podatku/turę | A (2) |
| docs/PORADNIK-GRACZA/05-budowa-mapa.md:200 | Tańszy ruch wojska i handel na tym heksie | …i dodatkowy podatek na tym heksie | A |
| tools/generate-encyklopedia.cjs:126,377 (generator wiki) | handel / +10 handlu | podatek / +10 podatku | A (2) |
| src/data/wikiBundle.json | (generowany z docs/** przez `bundle-wiki-for-game.cjs`; przebudowany, 43 zmienione stringi, wyłącznie powyższe) | — | A (pochodne) |

### B — zostaje (wybór reprezentatywny; test strażnik pilnuje)
tech-cards: „Otwiera handel: bez Wymiany żadnych tras handlowych”, „Targowisko: +50% dochodu z tras handlowych miasta”,
„Targowisko/Emporion: +1 trasa handlowa i premia 5% trasy”, „Port: +1 trasa handlowa miasta”, CMZ „Wyznacz trasy handlowe między
miastami”, „…bez Wymiany handel szlakowy jest zablokowany”, nazwa technologii „Handel”; building-cards: te same trasy + „nie
obejmuje tras” (Mennica); buildings.json: „Port handlowy”, grupa „Handel i pieniądz”, Emporion „+5% handlu” (premia trasy),
Targowisko opis (wymiana towarów); wonders.json: „+15% Handlu — dochodu z tras handlowych (…)” (5 cudów, bonus procentowy tylko do
tras); econ/diplomacy.json: ceny, traktat handlowy, koszyk; civs.json: „handel wewnętrzny”, „Handel morski” (styl cywilizacji);
resources.json „szlaki handlowe”; ui-params.json „oferty handlowe”.

### C — niejednoznaczne, NIE ZMIENIONE (DECISION_REQUIRED)
Zob. 01-operator-r1.md §C (lista i propozycje).

## 2. Stringi TypeScript — pełna lista z parsera AST (stan SPRZED zmian; wiersze A pokazują, co zmieniono)

| plik:linia | tekst | klasa | uzasadnienie |
|---|---|---|---|
| gra/src/game/ai.ts:1422 | `ekspansja_heurystyka_handel_pkt` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/ai.ts:1437 | `Handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/ai.ts:1611 | `Handel i pieniądz` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/ai.ts:6314 | `zaproponuj_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/ai.ts:6315 | `zaproponuj_umowe_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/ai.ts:6317 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/ai.ts:6405 | `ai_diplomacja_prog_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/ai.ts:6408 | `ai_diplomacja_prog_handel_archetyp_min` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/ai.ts:6867 | `chcą handlować (` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/ai.ts:6868 | `chcą handlować` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/ai.ts:6902 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/ai.ts:7064 | `zaproponuj_umowe_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/ai.ts:7067 | `: proponujemy stala Umowe Handlowa` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/ai.ts:7101 | `zaproponuj_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/ai.ts:7103 | `, handlowosc=` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/building-upgrades.ts:205 | `Handel i pieniądz` | B | nazwa grupy budynków „Handel i pieniądz” (Targowisko, Port, Emporion, Mennica) — B/C-grupa, bez zmiany |
| gra/src/game/civ-ai-data.ts:196 | `dip_handlowosc_archetyp` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/civ-matrix-semantic.ts:115 | `civ-ai-data.ts:184–198 + diplomacy.ts:1267–1308 — skłonność AI do handlu` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/civ-matrix-semantic.ts:153 | `eko_handel_brutto_proc` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/civ-matrix-semantic.ts:192 | `dip_handlowosc_archetyp` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/civ-matrix-semantic.ts:225 | `eko_handel_brutto_proc` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/civ-matrix-semantic.ts:244 | `dip_otwartosc_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/civ-matrix-semantic.ts:656 | `handlu` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/civ-matrix-semantic.ts:662 | `handlowość` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diag-log.ts:169 | `unhandledrejection` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-acceptance-points.ts:178 | `umowa_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-acceptance-points.ts:624 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-acceptance-points.ts:625 | `umowa_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-ai-balance.ts:85 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-audience-actions.ts:80 | `Handel niedostępny` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-credibility.ts:100 | `zerwanie_dobrowolne_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-credibility.ts:101 | `niedotrzymanie_handlu_cyklicznego` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-credibility.ts:106 | `dotrwanie_handlu` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-credibility.ts:107 | `splata_handlu_cyklicznego` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-credibility.ts:262 | `strumien_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-credibility.ts:304 | `strumien_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-credibility.ts:490 | `Dobrowolne zerwanie handlu` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-credibility.ts:491 | `Niedotrzymanie handlu cyklicznego` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-credibility.ts:495 | `Dotrwanie umowy handlowej` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-credibility.ts:496 | `Spłata handlu cyklicznego` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-credibility.ts:505 | `Aktywny handel` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-display.ts:32 | ` Wpływa na tempo wzrostu Zaufania u wszystkich nacji. Prezenty i handel: max +5 Zaufania/turę (ten sam limit dla każdego — bez bonusu od wys` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-display.ts:46 | `dip_otwartosc_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-display.ts:47 | `otwartoscHandel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-display.ts:49 | `Handlowy` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-display.ts:260 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-display.ts:279 | `Traktat handlowy` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-display.ts:306 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-display.ts:355 | `Umowa handlowa` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-factors.ts:57 | `Zawarcie umowy handlowej` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-factors.ts:58 | `Rozszerzenie handlu` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-factors.ts:171 | `Aktywny handel` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-layers.ts:25 | `zaproponuj_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-layers.ts:31 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-layers.ts:356 | `zaproponuj_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-layers.ts:357 | `zaproponuj_umowe_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-layers.ts:358 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-layers.ts:394 | `Handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-locks.ts:262 | `handel niedostępny w wojnie` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-locks.ts:275 | `brak możliwego połączenia handlowego (ląd lub porty)` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-locks.ts:279 | `szlaki handlowe, +1 Zaufanie/turę` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-locks.ts:283 | `handel niedostępny w wojnie` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-pair-summary.ts:82 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-pair-summary.ts:99 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-penalty-preview.ts:123 | `zerwanie aktywnej umowy handlowej (w tym cyklicznej) przez wojnę` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-penalty-preview.ts:224 | `brak kary — umowa handlowa zawarta ` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-penalty-preview.ts:237 | `dobrowolne zerwanie umowy handlowej` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-penalty-preview.ts:242 | `zerwanie umowy handlowej` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:76 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:81 | `umowa_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:431 | `Handel dostępem do surowców nieaktualny — wycofany po polityce terytorialnej (SUROW-TERYT)` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:1019 | `Niechęć partnera do handlu podniosła wymagany próg PW o ` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:1503 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:1523 | `Relacja zbyt niska na handel (wymagane ≥ ` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:1571 | `Umowa handlowa (surowiec co turę) bezterminowa` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:1572 | `Umowa handlowa (surowiec co turę) na ` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:1597 | `umowa_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:1612 | `Brak chęci do handlu` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:1615 | `Relacja zbyt niska na traktat handlowy (wymagane ≥ ` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:1649 | ` PW do uczciwej oferty traktatu handlowego @ Relacji (baza ` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:1682 | `Traktat handlowy (ze słodzikiem) zawarty` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:1682 | `Traktat handlowy zawarty` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:1895 | `zaproponuj_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:1914 | `zaproponuj_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:1916 | `zaproponuj_umowe_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:1918 | `Proponujemy stałą umowę handlową (szlaki handlowe) — w geście dobrej woli dokładamy ` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:1919 | `Proponujemy stałą umowę handlową — otwiera i utrzymuje szlaki handlowe między naszymi miastami.` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:1944 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:2036 | `zaproponuj_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:2042 | `pending-handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:2048 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:2051 | `zaproponuj_umowe_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:2054 | `pending-umowahandlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:2055 | `umowa_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:2076 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:2081 | `pending-handelsurowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:2082 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:2128 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:2129 | `umowa_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:2274 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:2307 | `Umowa handlowa (surowiec co turę) bezterminowa` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:2308 | `Umowa handlowa (surowiec co turę) na ` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:2317 | `umowa_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:2336 | `Traktat handlowy zawarty` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-proposals.ts:2510 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-proposals.ts:2832 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-sensible-deals.ts:56 | `zaproponuj_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-sensible-deals.ts:57 | `zaproponuj_umowe_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-sensible-deals.ts:58 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-sensible-deals.ts:66 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-sensible-deals.ts:67 | `umowa_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy-tech-trade.ts:190 | `Handel technologią anulowany — dawca nie posiada oferowanej technologii` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-tech-trade.ts:196 | `Handel technologią anulowany — brak prawidłowej technologii oferowanej w zamian` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-tech-trade.ts:200 | `Handel technologią anulowany — oddający nie posiada oferowanej technologii` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-tech-trade.ts:205 | `Handel technologią anulowany — ` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-tech-trade.ts:211 | `Handel technologią anulowany — oferowana technologia niedostępna dla drugiej strony` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-tech-trade.ts:224 | `Handel technologią anulowany — płatnik nie ma wystarczających środków` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy-tech-trade.ts:229 | `Handel technologią anulowany — ` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/diplomacy.ts:494 | `progPoboczneHandel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy.ts:824 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy.ts:850 | `zerwanie_handlu` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy.ts:853 | `zerwanie_handlu_bez_kary` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy.ts:906 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy.ts:1030 | `zerwanie_handlu` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/diplomacy.ts:1037 | `zerwanie_handlu_bez_kary` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/economy.ts:239 | `budynek_targowisko_bonus_handlu` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/economy.ts:246 | `suwak_handel_nauka_domyslnie` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/economy.ts:247 | `suwak_handel_pieniadz_domyslnie` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/economy.ts:248 | `suwak_handel_luksus_domyslnie` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/economy.ts:396 | `Handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/economy.ts:939 | `eko_handel_brutto_proc` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/empire-handel-split.ts:22 | `podzialHandlu` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/empire-handel-split.ts:22 | `podzialHandluOverride` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/eot-event-defer.ts:62 | ` handluje z ` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/game/fsa-autosave.ts:211 | `handles` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/terrain-improvements.ts:12 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/terrain-improvements.ts:126 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/terrain-improvements.ts:127 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/terrain-improvements.ts:176 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/trade-routes.ts:1075 | `brak miast do handlu` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/game/trade-routes.ts:2126 | `handel_surowiec_min_stock` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/turn-economy.ts:51 | `./empire-handel-split` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/turn-economy.ts:324 | `budynek_targowisko_bonus_handlu` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/turn-economy.ts:331 | `suwak_handel_nauka_domyslnie` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/turn-economy.ts:332 | `suwak_handel_pieniadz_domyslnie` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/turn-economy.ts:333 | `suwak_handel_luksus_domyslnie` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/wiarygodnosc-types.ts:35 | `zerwanie_dobrowolne_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/wiarygodnosc-types.ts:36 | `niedotrzymanie_handlu_cyklicznego` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/wiarygodnosc-types.ts:41 | `dotrwanie_handlu` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/wiarygodnosc-types.ts:42 | `splata_handlu_cyklicznego` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/wonders-data.ts:181 | `handel_turystyka` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/wonders-data.ts:306 | `handel_procent` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/game/wonders-data.ts:307 | `handel_morski` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:48 | `unhandledrejection` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:49 | `Unhandled promise rejection: ` | T | słowo angielskie „handle” — nie dotyczy |
| gra/src/main.ts:251 | `./game/empire-handel-split` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:3869 | `szlak handlowy z ` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:3875 | `szlak handlowy z ` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:5040 | `. Bonusy aktywne do końca Średniowiecza, potem zostaje atrakcją (+10 handel, utrzymanie ÷2).` | A | ZMIENIONE: produkcja pola/cudu/Ładu nazwana „handlem” → „podatek/podatku” |
| gra/src/main.ts:5041 | `Wygraliśmy wyścig. Bonusy aktywne do końca Średniowiecza, potem zostaje atrakcją (+10 handel, utrzymanie ÷2).` | A | ZMIENIONE: produkcja pola/cudu/Ładu nazwana „handlem” → „podatek/podatku” |
| gra/src/main.ts:5728 | `szlak handlowy z ` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:7962 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:11666 | `handel_pn` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:17803 | `[Handel] Blad odswiezania tras:` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:17809 | `[Handel] Blad przeliczania grantow z trasy:` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:17818 | `[Handel] Blad powiadomien o trasach:` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:17863 | `handel wewnętrzny` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:17894 | `⛓️ Szlak handlowy zerwany: ` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:17902 | `Szlak handlowy zerwany` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:18983 | `Handel wewnętrzny` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:19145 | `zaproponuj_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:19146 | `zaproponuj_umowe_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:19146 | `Propozycja umowy handlowej` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:19147 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:19147 | `Propozycja handlu surowcem` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:19167 | `zaproponuj_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:19170 | `zaproponuj_umowe_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:19173 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:19206 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:19218 | `zaproponuj_umowe_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:19379 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:19449 | `umowa_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:19453 | `umowa_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:19561 | `zaproponuj_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:19974 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:19976 | `umowa_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:20076 | `umowa_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:20242 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:20312 | `zaproponuj_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:20315 | `zaproponuj_umowe_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:20318 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:21728 | `zerwanie_dobrowolne_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:21748 | `zerwanie_handlu_bez_kary` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:21749 | `zerwanie_handlu` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:22318 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:22334 | `[Dyplomacja] AI↔AI handel surowcem (` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:22342 | ` handluje z ` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:22349 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:22355 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:22555 | `[Dyplomacja] AI↔AI handel surowcem: ` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:22562 | `[Dyplomacja] AI↔AI Umowa Handlowa ` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:22921 | `niedotrzymanie_handlu_cyklicznego` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:22925 | `niedotrzymanie_handlu_cyklicznego` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:23075 | `strumien_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:23079 | `strumien_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:23135 | `dotrwanie_handlu` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:23136 | `dotrwanie_handlu` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:23138 | `splata_handlu_cyklicznego` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:23139 | `splata_handlu_cyklicznego` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:23475 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:23488 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:23494 | `umowa_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:23532 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:23550 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:24118 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:24391 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:26714 | `zaproponuj_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:36366 | `[EndTurn] Usunięto nieważną ofertę handlową AI (blokada końca tury)` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:36420 | `[EndTurn] blocked: oferta handlowa AI czeka na decyzję gracza` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:36445 | `Rozpatrz ofertę handlową od innego państwa (przyjmij, zmodyfikuj lub odrzuć), potem zakończ turę.` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:36708 | `[Handel] Blad przeplywu ilosciowego surowca przez trase:` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:40420 | `zaproponuj_handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:40422 | `zaproponuj_umowe_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:40424 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:40436 | `zaproponuj_handel_surowiec` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/main.ts:41374 | `[Dyplomacja] Blad Umow Handlowych AI-AI:` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/main.ts:44448 | `[Handel] Blad przeliczania grantow z trasy (load):` | B | szlak handlowy / umowa / handel wewnętrzny (trasy między własnymi miastami) / log techniczny |
| gra/src/types/diplomacy.ts:24 | `umowa_handlowa` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/types/tech.ts:33 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/cityPanel.ts:78 | `../game/empire-handel-split` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/cityPanel.ts:2050 | `\n.civ-cs *{box-sizing:border-box;}\n.civ-cs-backdrop{flex:1 1 55%;min-width:0;background:rgba(8,10,18,0.58);pointer-events:auto;cursor:defa` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:3569 | `≥90% Porządku — bonus do pracy i handlu. Miasto w pełni stabilne.` | A | ZMIENIONE: produkcja pola/cudu/Ładu nazwana „handlem” → „podatek/podatku” |
| gra/src/ui/cityPanel.ts:3623 | `<b>Podnieś Szczęście:</b> przesuń suwak handlu na <b>` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:3624 | `% — im wyżej, tym więcej zamożności z handlu zamiast skarbca/nauki). ` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:4766 | `handel-chip-grid` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/cityPanel.ts:4769 | `<span class="chip handel-card-skarb">` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:4771 | `<span class="chip handel-card-nauka">` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:4773 | `<span class="chip handel-card-zam">` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:4775 | `<span class="chip handel-korupcja-chip" title="Korupcja — uproszczony model, pełniejszy planowany w przyszłej aktualizacji">` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:4778 | `handel-w4-sliders` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/cityPanel.ts:4812 | `indywidualne-row-handlu` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/cityPanel.ts:4841 | `Handel ze szlaków` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:4865 | `<span>Podział Handlu</span>` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:4987 | `Brak wpływu do puli — zwiększ udział „Zamożność” w podziale handlu` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:5018 | ` = floor(handelNetto × %` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:5028 | ` × handelNetto → wpływ do puli zamożności.` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:5959 | `Handel ze szlaków` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:5970 | `Handel ze szlaków` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:5995 | `pieniadzNetto = podatki + handel_netto + budynki − utrzymanie` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:6038 | `Udział handlu` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:6038 | `% handlu netto → nauka` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:6039 | `→ z handlu (szac.)` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:6041 | `nauka += plony + budynki + % handlu` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:6044 | `Podział handlu → więcej % na Naukę = szybsze tech, mniej złota.` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:11147 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/cityPanel.ts:11260 | `Mennica nieaktywna: brak Złota w magazynie państwa (Kopalnia złota, szlak handlowy lub zapas). ` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:11275 | `Premia za trasy handlowe` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:11277 | ` Handlu (` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:11278 | `brak tras z budynkiem handlowym` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:11290 | `handelBrutto = Σ ` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:11291 | ` + premia tras handlowych (z budynkiem)` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:11293 | `strataKorupcji = handelBrutto × ` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:11294 | `handelNetto = handelBrutto − strataKorupcji` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:11301 | `nauka = floor(handelNetto × %Nauka) + budynki  ← już zawiera mnożnik Waluty+Mennicy powyżej` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:11302 | `skarb_z_handlu = floor(handelNetto × %Skarb)  ← już zawiera mnożnik Waluty+Mennicy powyżej` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:11303 | ` = floor(handelNetto × %` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:11309 | `Trasy handlowe z budynkiem: +` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:11309 | ` do handelBrutto (` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:11309 | ` aktywnych — szczegóły szlaków i partnerów w panelu Handel, żeton paska zasobów).` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:11310 | `Bez aktywnych tras handlowych z budynkiem — brak premii do handelBrutto.` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:11311 | `% brutto; docelowo: dystans, miasta, cap) → handelNetto.` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:11312 | ` zwiększa lokalny podatek miejski przed podziałem suwakami; szlaki handlowe są rozliczane osobno i nie podlegają temu mnożnikowi.` | B | trasy handlowe / premia tras / Targowisko — prawdziwy handel (lub identyfikator formuły) |
| gra/src/ui/cityPanel.ts:11313 | `Podziel handelNetto suwakami: Skarb / Nauka / ` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:11326 | `Suwak UI (adjustHandelSplit)` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:11328 | `Kroki co 10% (HANDEL_PCT_STEP). Suma zawsze 100%.` | C | podział/suwak/formuła „handlu” w panelu miasta — strumień = podatek (handelNetto), ale to nazwa podziału; wg dispatchu C → DECISION_REQUIRED (propozycja: „podatku”) |
| gra/src/ui/cityPanel.ts:11880 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/cityPanel.ts:11901 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/cityPanel.ts:12048 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/cityPanel.ts:12050 | `civ-handel-sliders-host` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/cityPanel.ts:12051 | `civ-handel-wealth-host` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/diploListHud.ts:542 | `Handel` | B | etykieta UI „Handel”: HUD = dochód z tras; diploListHud = kategoria dyplomacji; techIcons = nazwa technologii „Handel” |
| gra/src/ui/diploUiSkin.ts:129 | `handlow` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/diplomacyAudience.ts:563 | `\n.civ-diplo-aud{position:fixed;inset:0;z-index:400;background:rgba(5,6,10,.88);\n  display:flex;align-items:flex-start;justify-content:cent` | T | CSS / komentarz w stringu — niewidoczne dla gracza |
| gra/src/ui/diplomacyAudience.ts:1381 | `<div class="da-sec-title">Dobra handlowe</div>` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/ui/diplomacyAudience.ts:1428 | `<div class="da-sec-title">Dobra handlowe</div>` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/ui/diplomacyAudience.ts:1453 | `Handluje z` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/ui/diplomacyAudience.ts:1615 | `handlow` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/diplomacyNegotiationModal.ts:564 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/diplomacyNegotiationModal.ts:573 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/diplomacyPanel.ts:28 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/diplomacyPanel.ts:487 | `Handluje z` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/ui/diplomacyTradeBasket.ts:745 | `<label for="cdb-treaty-turns">Czas traktatu handlowego (tur)</label>` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/ui/diplomacyTradeBasket.ts:751 | `handlowych — opcjonalnie dołóż wymianę PW poniżej.</p>` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/ui/diplomacyTradeBasket.ts:1029 | `Czas traktatu handlowego: bezterminowy (0) lub 1–20 tur` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/ui/diplomacyTradeBasket.ts:1489 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/diplomacyTradeBasket.ts:1498 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/diplomacyTradeBasket.ts:1499 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/diplomacyTradeBasket.ts:2119 | ` Zaufania/turę (trwa umowa handlowa)` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/ui/diplomacyTradeBasket.ts:2315 | `<div class="cdb-blocked">W wojnie zwykły handel i dar są niedostępne — użyj propozycji pokoju</div>` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/ui/diplomacyTradeBasket.ts:2317 | `<div class="cdb-blocked">Handel wymaga Relacji ≥ ` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:101 | `emp-handel-split` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/empireDetailPanel.ts:102 | `<div class="civ-emp-sect" data-section="ekonomia-handel-split" id="` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:116 | `data-handel-key="` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:128 | `emp-handel-split` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/empireDetailPanel.ts:131 | `input[data-handel-key]` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:136 | `input[data-handel-key]` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:292 | `\n.civ-emp-panel{position:fixed;top:0;right:0;bottom:0;width:min(404px,94vw);z-index:450;\n  background:#141a24;border-left:1px solid #2b354` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:927 | `Premia 5% z tej trasy czeka na budynek handlowy (Targowisko / Port / Port wielki) ` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:929 | `teraz — od zawarcia Umowy Handlowej, bez żadnego budynku. Po wybudowaniu po obu stronach ` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:933 | `Premia 5% za budynek handlowy po obu stronach trasy: 5% dochodu dystansowego TEJ trasy, ` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:952 | ` bez budynku handlowego (Targowisko/Port) — dochód dystansowy ` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:965 | `Premia 5% za budynek handlowy: 5% dochodu dystansowego każdej trasy tego zakresu, ` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:1005 | `Handel ze szlaków` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:1140 | ` handel</span>` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:1141 | `<span style="font-size:11px;color:#7d8798;font-weight:600">bez handlu</span>` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:1160 | `Handel ze szlaków` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:1236 | `" data-handel-key="` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:1257 | `input[data-handel-key]` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:1262 | `input[data-handel-key]` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:2187 | `SZLAKI = dochód z tras handlowych · UTRZ. BUD. = utrzymanie budynków tego miasta. ` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:2277 | `Prawo i administracja · Wojsko i obrona · Handel i pieniądz · Nauka i kultura · Wiara · ` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:2378 | `Handel — szlaki per miasto` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:2422 | `<div class="civ-emp-foot">SZLAKI = liczba aktywnych tras handlowych tego miasta · DOCHÓD = dochód ` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:2424 | `budynek handlowy</b> — naliczany tylko z tras, które mają Targowisko/Port po obu stronach, i wchodzący do ` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:2426 | `— zakładka Handel.</div>` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:2427 | `<div class="civ-emp-empty">Brak aktywnych tras handlowych w zakresie.</div>` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:3548 | `<div class="civ-emp-sect sep" data-section="handel">` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:3550 | `<span class="civ-emp-eyebrow">HANDEL — SZLAKI HANDLOWE</span></div>` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:3596 | `<div class="civ-emp-res-lbl">Umowy handlowe</div>` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:3598 | `<div class="civ-emp-empty">Brak aktywnych umów handlowych.</div>` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:3655 | `co turę, niezależnie od budynków (od T3 handel działa od zawarcia umowy).` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:3676 | `Tyle tras nie ma jeszcze budynku handlowego ` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:3688 | `<div class="civ-emp-empty">Brak aktywnych tras handlowych. Wymagane: Umowa Handlowa ` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:3691 | `handlowy nie jest już potrzebny do powstania trasy — odblokowuje wyłącznie premię 5%.</div>` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:3708 | `<div class="civ-emp-res-lbl">Surowce z wymiany handlowej</div>` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:3735 | `wyłącznie gdy miasto ma budynek handlowy (Targowisko/Port); dolicza się do ` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/empireDetailPanel.ts:4249 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/empirePanelSectionMap.ts:15 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/empirePanelSectionMap.ts:30 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/empirePanelSectionMap.ts:30 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/empirePanelSectionMap.ts:148 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/empirePanelSectionMap.ts:148 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/entityCards/improvementAdapter.ts:92 | `Handel` | A | ZMIENIONE: produkcja pola/cudu/Ładu nazwana „handlem” → „podatek/podatku” |
| gra/src/ui/entityCards/wonderAdapter.ts:45 | `Handel` | A | ZMIENIONE: produkcja pola/cudu/Ładu nazwana „handlem” → „podatek/podatku” |
| gra/src/ui/hexContextTooltip.ts:79 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/hexContextTooltip.ts:90 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/hexContextTooltip.ts:106 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/hexContextTooltip.ts:207 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/hud.ts:614 | `px;\n  max-width:min(calc(100vw - 200px),960px);}\n.civ-hud .hud-right-cluster .hud-right{width:auto;max-width:none;justify-content:flex-end` | B | chip HUD „Handel” = dochód z tras (hud.ts handelChipTitle) — B |
| gra/src/ui/hud.ts:995 | ` · Handel ze szlaków: ` | B | chip HUD „Handel” = dochód z tras (hud.ts handelChipTitle) — B |
| gra/src/ui/hud.ts:1228 | `Handel — wymiana z obcymi cywilizacjami` | B | chip HUD „Handel” = dochód z tras (hud.ts handelChipTitle) — B |
| gra/src/ui/hud.ts:1229 | ` aktywnych tras handlowych) → NETTO: ` | B | chip HUD „Handel” = dochód z tras (hud.ts handelChipTitle) — B |
| gra/src/ui/hud.ts:1383 | `Handel` | B | etykieta UI „Handel”: HUD = dochód z tras; diploListHud = kategoria dyplomacji; techIcons = nazwa technologii „Handel” |
| gra/src/ui/hud.ts:1391 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/hud.ts:1656 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/icons/brandAssets.ts:91 | `handel` | T | identyfikator / klucz / import / klasa CSS — poza zakresem |
| gra/src/ui/interHumanDiplomacyHud.ts:147 | `" placeholder="np. chcę handlować"></label>` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/ui/minimapHud.ts:431 | `Pokaż trasy handlowe (klik)` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/newGameFlow.ts:645 | `Hartowane ostrza, potezne legiony, szlaki handlowe. Start: cale Kamien + caly Braz juz zbadane.` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/newGameFlow.ts:1824 | `Dopóki wisi oferta handlowa od AI, nie zakończysz tury — przyjmij, zmodyfikuj lub odrzuć. Wyłączone: oferty AI nie blokują końca tury.` | B | trasy / szlaki / umowy handlowe — prawdziwy handel |
| gra/src/ui/sidePanelEventTabs.ts:49 | `[a-z-]+ handluje z ` | B | dyplomacja / umowy handlowe / wymiana surowców / AI — prawdziwy handel |
| gra/src/ui/sidePanelHud.ts:248 | `px);}\n.civ-side-panel .sp-header{font-size:10px;color:var(--civ-text-muted);text-transform:uppercase;\n  letter-spacing:.24em;text-align:ri` | T | słowo angielskie „handle” — nie dotyczy |
| gra/src/ui/techIcons.ts:22 | `Handel` | B | etykieta UI „Handel”: HUD = dochód z tras; diploListHud = kategoria dyplomacji; techIcons = nazwa technologii „Handel” |
