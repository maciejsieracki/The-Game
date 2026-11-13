# Wypowiadanie wojny

## Metadane

| Pole | Wartość |
|------|---------|
| id | `wypowiedzenie-wojny` |
| tytuł | Wypowiadanie wojny |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII §79.1 |
| json_ref | `diplomacy-war-peace-params.json`, `diplomacy-military-strength-params.json`, `diplomacy-tick-params.json`, `war-rules-params.json`, `diplomacy.json` |
| stan | Stan na 2026-11-13 (weryfikacja w kodzie) |

---

## Wiki‑S

**Wojnę wypowiada się** wobec innej cywilizacji. Gracz decyduje sam. AI wypowiada wojnę, gdy ma wrogie nastawienie, **Zaufanie** pary spadło poniżej **30** i ma **przewagę siły militarnej** nad drugą stroną (armia, rekruci i wygrane bitwy, patrz hasło **Siła militarna**). Gdy Zaufanie pary utrzymuje się na **zerze** przez kilka tur, silniejsza strona wypowiada wojnę po tym czasie, a gracz nigdy nie zostaje wciągnięty w wojnę automatycznie. Wojna wymuszona przez epokę ma własne zasady startu.

---

## Wiki‑M

### Kiedy AI może wypowiedzieć wojnę (przypadek zwykły)

AI wybiera wojnę (priorytet 4 w `decideAIDiplomacy`, `ai.ts`, ok. linii 7340), gdy jednocześnie:
- nie toczy już wojny z tą cywilizacją, nie ma z nią zablokowanego pokoju i nie ma paktu o nieagresji;
- nie działa okno wczesnej fazy: przez pierwsze **25** tur (`AI_MAJOR_EARLY_NO_WAR_TURNS`) AI nie wypowiada wojny drugiej głównej cywilizacji AI (wojny z graczem i ataki na miasta-państwa nie są objęte tym oknem);
- ma wrogie nastawienie (`willingnessWar > 0`);
- **Zaufanie pary jest poniżej 30** (`wypowiedzenieZaufanie.progZaufaniaWojny`);
- **jej przewaga siły militarnej wynosi co najmniej próg**: bazowo **20%** (`progPrzewagiProc`), przesunięty o charakter cywilizacji i obcięty do zakresu **10–35%** (agresywna AI wypowiada przy mniejszej przewadze, ostrożna przy większej);
- jej agresja archetypu wynosi co najmniej **0,5** (`ai.ts`, `PROG_WOJNA_AGRESJA`, z mnożnikiem trudności).

Relacja i zwykły wskaźnik siły (respekt względny) nie wchodzą już do tej bramki.

### Hamulec zerowego Zaufania (wojna po N turach)

- Licznik kryzysu liczy **kolejne tury, w których Zaufanie pary wynosi 0** (`p6.kryzysProgZaufania = 0`). Relacja nie steruje licznikiem.
- Liczba tur **N** pochodzi z profilu cywilizacji: `clamp(round(8 − 0,5 × dip_prog_wojny), 3, 7)`, czyli **od 3 do 7 tur** (dla wartości bazowej `dip_prog_wojny = 5` wychodzi **6**). Dla pary brane jest wyższe N z dwóch profili; gracz ma profil bazowy.
- Gdy licznik dojdzie do N, wojnę wypowiada **silniejsza strona wg siły militarnej** (remis rozstrzyga armia, potem kolejność identyfikatorów).
- **Gracz nigdy nie wypowiada wojny automatycznie z hamulca.** Gdy silniejszą stroną jest AI, gracz dostaje jedno ostrzeżenie na epizod zerowego Zaufania (komunikat z liczbą tur do wojny).
- Hamulec wyłącza się, gdy Zaufanie wzrośnie powyżej zera albo gdy para już jest w wojnie.
- Uwaga do pliku `diplomacy-tick-params.json`: pole `p6.kryzysTurDoWojny = 5` jest nadpisywane przez N z profilu (`main.ts`, `diploBrakeCrisisStep`), a pole `flagaDomyslna: false` jest nieaktualne. Flaga w kodzie (`DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT`, `diplomacy-tick-war-brake.ts`) ma wartość **włączoną**.

### Bramki wojen wymuszonych przez epokę

- Wojny wymuszone przez epoki (Kamień, Brąz, Żelazo) startują dopiero od **tury 40** (licząc od wejścia właściciela w epokę).
- W epoce **Kamienia** może trwać tylko **jedna** wojna naraz.
- Każda cywilizacja może mieć **jedną** wymuszoną wojnę na epokę.

### Plusy i minusy

**Dla gracza**
- Plus: wojnę możesz wypowiedzieć, kiedy chcesz, więc masz pełną kontrolę nad momentem ataku.
- Plus: bramki epokowe chronią przed falą wojen na starcie gry.
- Minus: wypowiedzenie wojny bez ostrzeżenia kosztuje **−10 Wiarygodności** i karencję jednej tury.
- Minus: wojna zeruje Zaufanie wobec wroga, więc odbudowa relacji trwa długo.
- Minus: długie zerowe Zaufanie z silniejszym AI kończy się wojną, której nie wypowiedziałeś sam; zostaje tylko ostrzeżenie.

**Dla AI**
- Plus: AI z przewagą siły i niskim Zaufaniem może wypowiedzieć wojnę bez czekania na wrogość gracza.
- Minus: hamulec zerowego Zaufania opóźnia wojnę o N tur od chwili, gdy Zaufanie spadło do zera.

### Etykiety nastawienia przy niskim Zaufaniu

Wrogi poniżej Zaufania 10, Nieufny przy Zaufaniu 10–29 (szczegóły: hasło **Relacja**). W wojnie etykieta to zawsze Wrogi.

### Zasady wdrożone z decyzji właściciela (2026-11-13)

- Wypowiedzenie wojny przez AI wymaga Zaufania poniżej **30** i przewagi siły militarnej co najmniej progu (20%, z przesunięciem charakteru 10–35%). Samo Power ani Relacja nie wystarczają.
- Przy Zaufaniu **0** przez N tur (3–7 wg profilu) silniejsza strona wypowiada wojnę. Gracz nigdy automatycznie.
- Słabsza strona o więcej niż próg siły nie wypowiada wojny sama (poza wojną epoki): bramka wymaga przewagi AI, więc słabsze AI nie spełnia warunku.

---

## Przykład liczbowy

Dwie cywilizacje, AI ma przewagę siły 25% (powyżej progu 20%), Zaufanie pary spada z 12 na 8 w jednej turze, potem na 0. Licznik zerowego Zaufania rośnie co turę. Po N = 6 turach (profil bazowy) silniejsza AI wypowiada wojnę, a gracz dostaje wcześniej jedno ostrzeżenie. Gdyby Zaufanie wzrosło do 1 przed upływem N tur, licznik się zeruje.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md` §79.1

---

## Parametry

| Wartość | Skąd (plik:klucz) |
|--------:|-------------------|
| 30 | `diplomacy-war-peace-params.json:wypowiedzenieZaufanie.progZaufaniaWojny` |
| 20 | `diplomacy-military-strength-params.json:progPrzewagiProc.wartosc` |
| 10 | `diplomacy-war-peace-params.json:przesuniecieProguWojnyCharakter.min` |
| 35 | `diplomacy-war-peace-params.json:przesuniecieProguWojnyCharakter.max` |
| 0 | `diplomacy-tick-params.json:p6.kryzysProgZaufania` |
| 0.5 | `kod:ai-prog-wojna-agresja` |
| 25 | `kod:ai-early-no-war-turns` |
| 8 | `diplomacy-war-peace-params.json:hamulecRelacji.bazaN` |
| 0.5 | `diplomacy-war-peace-params.json:hamulecRelacji.wagaProgWojny` |
| 3 | `diplomacy-war-peace-params.json:hamulecRelacji.minN` |
| 7 | `diplomacy-war-peace-params.json:hamulecRelacji.maxN` |
| 40 | `war-rules-params.json:delayInterCivWarsUntilTurn` |
| 1 | `war-rules-params.json:maxConcurrentWarsStone` |
| 1 | `war-rules-params.json:maxEraForcedWarsPerCivPerEra` |
| -10 | `diplomacy.json:params.wiarygodnoscN1BezOstrzezenia` |
| 1 | `diplomacy.json:params.wiarygodnoscN1KarencjaTur` |

Wiersze o progach Relacji (`progWojnyRelacji`, `hamulecRelacji.progKryzysuMinusPunkty`) zostały w JSON jako informacja. Nie sterują już wojną.

---

## Historia / decyzje

Hasło zweryfikowane w kodzie 2026-11-13 (R-WEB-DIPLO-CIVPEDIA-Q1, runda 3). Zasady „Zaufanie 30 / przewaga siły / zero przez N tur” są wdrożone (R-WEB-DIPLO-WAR-DECLARE-ZERO-TRUST-Q1, R-WEB-DIPLO-WAR-CHARACTER-THRESHOLD-Q1), zgodnie z DECYZJĄ WŁAŚCICIELA 2026-11-13. Bramka AI (`ai.ts`) nie używa już progu rw ani Relacji <30. Stara wersja hasła opisywała hamulec po Relacji i wczesne okno 25 tur; nie była zgodna z kodem.

Rozbieżność do zgłoszenia: `diplomacy-tick-params.json` ma `flagaDomyslna: false` i `kryzysTurDoWojny: 5`, a w kodzie flaga jest włączona i N pochodzi z profilu (6 dla bazowego). Hasło podaje stan faktyczny z kodu.
