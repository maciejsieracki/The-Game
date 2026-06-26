# AI → MASTER : pytania / zależności (handoff)

Data: 2026-06-24 21:15 | Od: **Civ-AI** | Status: **CZEKA** na rozdysponowanie/odpowiedź.

Kontekst: AI zostało przy Civ-AI (decyzja Maciej). Profil/charakter cyw. = w panelu AI (`ai-params.json`,
`archetype_*`), NIE `civs.json`/`civ-ai`. Poniżej zależności od innych działów + sprawy integracji —
proszę o routing do właściwych działów i/lub decyzję.

---

## 1. [MAPA → AI] Startowe rozmieszczenie klastrów (pkt 3 — ekspansja świadoma typu)
`ai.ts` ma rozwijać osadnictwo w klastrze ~9 miast tego samego typu (Spec-generator-mapy §0.1, min_dystans 9).
W `_handoff/` widzę już `MAPA-do-MASTER_nazwy-klastrow.md` i `MAPA-do-MASTER_posterunki.md`.
**PYTANIE:** czy startowe pozycje klastrów per typ (i ich „przynależność typowa") są już w którymś z tych
handoffów, czy potrzebny nowy kontrakt MAPA→AI? W jakim formacie AI dostanie te dane (struktura/plik)?
Bez tego osadnicy AI nie wiedzą, gdzie jest „ich" klaster.

## 2. [EKONOMIA → AI] Kontrakt kosztu / budżetu (pkt 5)
`ai.ts` kolejkuje produkcję BEZ sprawdzania kosztu/stać-go-czy-nie.
**PYTANIE:** jakie pola/API z `economy.ts`/`turn-economy.ts` AI ma CZYTAĆ, by ocenić budżet gracza-AI
(skarbiec gracza AI, koszt budynku/jednostki, utrzymanie)? AI tylko czyta, nie edytuje ekonomii.
(W `_handoff/` są `EKONOMIA-do-SILNIK-*` — proszę wskazać, co z tego jest stykiem dla AI.)

## 3. [INTEGRACJA] Wpięcie modułów AI do pętli tury
`ai.ts` / `victory.ts` / `barbarians.ts` istnieją, są NIEwpięte (wpięcie do `main.ts` = master).
**PYTANIE/DECYZJA:** chcesz już teraz handoff „gotowe do wpięcia" z instrukcją
(handler tury AI: `decideAITurn` → wykonać `AICommand[]`; `checkVictory` co turę; `spawnCamps`/`tickCamps`/
`decideBarbarianMoves`) + DoD — czy najpierw domykam pkt 2–6 i wpinamy całość raz?

## 4. [DYSPOZYCJE / spójność] Stale wpisy o „profilu z DANE"
`CYWILIZACJE.md` nadal mówi „ai.ts = osobny dział AI (czyta civ-ai/civ-params)" i wymienia `ai.ts` pod CYWILIZACJE;
`AI.md` ma stare wpisy „profil cyw. CZYTASZ z DANE/civs.json". To koliduje z decyzją „AI u Civ-AI, profil w panelu AI".
**PROŚBA:** zaktualizować dyspozycje tak, by **jeden właściciel `ai.ts` = Civ-AI** i profil = `ai-params.json`
(uniknąć podwójnej własności pliku / powrotu do przenoszenia profilu do DANE przy kolejnym „start").
(Zgłoszone już częściowo 2026-06-24 19:36; ponawiam łącznie.)

## 5. [DANE/tech → AI] Heurystyka nauki (pkt 6)
Wybór technologii przez AI będzie potrzebował drzewka technologii.
**PYTANIE:** czy mogę czytać `gra/data/tech.json` bezpośrednio jako dane współdzielone (read-only),
czy potrzebny kontrakt/handoff od DANE?

---
Pilność: 1 i 2 blokują pkt 3 i 5. 3 i 4 do decyzji. 5 najpewniej „czytaj wprost" — proszę o potwierdzenie.
