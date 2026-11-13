# Wypowiadanie wojny

## Metadane

| Pole | Wartość |
|------|---------|
| id | `wypowiedzenie-wojny` |
| tytuł | Wypowiadanie wojny |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII §79.1 |
| json_ref | `diplomacy-war-peace-params.json`, `war-rules-params.json`, `diplomacy.json` |
| stan | Stan na 2026-11-13 (weryfikacja w kodzie) |

---

## Wiki‑S

**Wojnę wypowiada się** wobec innej cywilizacji. Gracz decyduje sam; AI wypowiada wojnę, gdy spełni swoje warunki (relacja poniżej progu wojny, przewaga siły względnej i wysoka agresja, patrz niżej). Wojna wymuszona przez epokę ma własne zasady startu.

---

## Wiki‑M

### Kiedy AI może wypowiedzieć wojnę

Próg wojny zależy od profilu cywilizacji: wzór z `diplomacy-war-peace-params.json:progWojnyRelacji` (rośnie wraz z wysoką skłonnością do wojny, ekspansją i podboju) jest zawsze w granicach **10–70**; gdy profilu brak, próg wynosi **30**. Próg kryzysu to próg wojny **minus 15**; przy parze cywilizacji brany jest wyższy z dwóch progów. Gdy łączna Relacja spada poniżej progu kryzysu, rozpoczyna się **hamulec relacji**: licznik kryzysu trwa od 3 do 7 tur (zależnie od profilu) i dopiero po nim AI może wypowiedzieć wojnę.

### Przesłanki AI obecnie w grze

AI wypowiada wojnę tylko wtedy, gdy jednocześnie:
- nie toczy już wojny z tą cywilizacją i nie ma z nią pokoju zablokowanego ani paktu o nieagresji;
- nie działa okno wczesnej fazy: przez pierwsze **25** tur (`ai.ts`, `AI_MAJOR_EARLY_NO_WAR_TURNS`) AI nie wypowiada wojny drugiej głównej cywilizacji AI (wojny z graczem i atak na miasto-państwo nie są objęte tym oknem);
- ma wrogie nastawienie (`willingnessWar > 0`);
- jej względna siła (respekt względny) wynosi co najmniej **0,6** (`ai.ts:6229`, `PROG_WOJNA_SILA`; obniżane o 0,12 przy skłonności do podboju ≥ 4);
- jej agresja archetypu wynosi co najmniej **0,5** (`ai.ts:6235`, `PROG_WOJNA_AGRESJA`, z mnożnikiem trudności);
- Relacja jest poniżej progu wojny tej cywilizacji (hamulec relacji jak wyżej).

Gracz nie jest wciągany w wojnę automatycznie przez te przesłanki; wypowiada ją sam.

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

**Dla AI**
- Plus: AI, która ma przewagę siły i wysoką agresję, może wypowiedzieć wojnę, gdy relacja jest zbyt niska.
- Minus: hamulec relacji opóźnia wojnę o kilka tur od chwili spadku Relacji poniżej progu kryzysu.

### Etykiety nastawienia przy wypowiadaniu wojny

Etykieta nastawienia przy niskim Zaufaniu: Wrogi poniżej Zaufania 10, Nieufny przy Zaufaniu 10–29 (szczegóły: hasło **Relacja**).

### Zasady zatwierdzone, jeszcze niewdrożone

> **DECYZJA WŁAŚCICIELA 2026-11-13, wdrożenie w toku.** Ten blok NIE opisuje obecnego stanu gry.

- Wypowiedzenie wojny możliwe przy Zaufaniu poniżej **30**; silniejsza strona może, ale nie musi.
- Przy Zaufaniu **0** silniejsza strona wypowiada wojnę (po kilku turach od zera, z ostrzeżeniem).
- Cywilizacja słabsza o ponad **20%** siły militarnej nigdy sama nie wypowiada wojny (poza wojną epoki).
- Gracz nigdy nie zostaje wciągnięty automatycznie.

---

## Przykład liczbowy

Dwie cywilizacje z progiem wojny 30 (brak danych profilu) mają próg kryzysu 15. Relacja spada z 18 na 14, czyli poniżej 15: hamulec startuje i AI może wypowiedzieć wojnę dopiero po zakończeniu kryzysu (3–7 tur wg profilu). Przy Relacji 25 (powyżej progu kryzysu) hamulec nie działa.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md` §79.1

---

## Parametry

| Wartość | Skąd (plik:klucz) |
|--------:|-------------------|
| 10 | `diplomacy-war-peace-params.json:progWojnyRelacji.baza` |
| 5 | `diplomacy-war-peace-params.json:progWojnyRelacji.wagaProgWojny` |
| 10 | `diplomacy-war-peace-params.json:progWojnyRelacji.min` |
| 70 | `diplomacy-war-peace-params.json:progWojnyRelacji.max` |
| 30 | `diplomacy-war-peace-params.json:progWojnyRelacji.bazaBrakDanych` |
| 15 | `diplomacy-war-peace-params.json:hamulecRelacji.progKryzysuMinusPunkty` |
| 0.6 | `kod:ai-prog-wojna-sila` |
| 0.5 | `kod:ai-prog-wojna-agresja` |
| 25 | `kod:ai-early-no-war-turns` |
| 8 | `diplomacy-war-peace-params.json:hamulecRelacji.bazaN` |
| 3 | `diplomacy-war-peace-params.json:hamulecRelacji.minN` |
| 7 | `diplomacy-war-peace-params.json:hamulecRelacji.maxN` |
| 40 | `war-rules-params.json:delayInterCivWarsUntilTurn` |
| 1 | `war-rules-params.json:maxConcurrentWarsStone` |
| 1 | `war-rules-params.json:maxEraForcedWarsPerCivPerEra` |
| -10 | `diplomacy.json:params.wiarygodnoscN1BezOstrzezenia` |
| 1 | `diplomacy.json:params.wiarygodnoscN1KarencjaTur` |

---

## Historia / decyzje

Hasło zweryfikowane w kodzie 2026-11-13 (R-WEB-DIPLO-CIVPEDIA-Q1). Progi (30 Zaufania, 10 przy zerze) z DECYZJI WŁAŚCICIELA 2026-11-13 są w bloku niewdrożonym. Runda 2 (obrona, zarzut 5): dopisano przesłanki AI z kodu (`ai.ts`), usunięto „wiek gry” z Wiki-S i poprawiono przykład (hamulec według progu kryzysu = próg wojny − 15).
