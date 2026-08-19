# CLAUDE.md — Civ „The Game"

**Status:** aktywny punkt wejścia. Pełna mapa procesu: [`docs/procesy/INDEX-PROCESU.md`](docs/procesy/INDEX-PROCESU.md).

## ZACZNIJ TUTAJ

1. Przeczytaj indeks procesu, następnie aktywne reguły `.cursor/rules/*.mdc`.
2. Dla pracy nad AutoBotem przeczytaj [`docs/decyzje/R-PROC-AUTOBOT.md`](docs/decyzje/R-PROC-AUTOBOT.md),
   skill [`.claude/skills/civ-autobot/SKILL.md`](.claude/skills/civ-autobot/SKILL.md) i właściwy playbook.
3. Stan tematu sprawdzaj w źródłach wskazanych przez indeks; stary tekst ani sam czat nie są dowodem.

## ⛔ BARIERY BEZPIECZEŃSTWA

1. **Każda praca agenta idzie przez AutoBot:** Operator (**GPT-5.6 Luna High**) →
   Evaluator (**GPT-5.6 Luna High**) → Final Control (**GPT-5.6 Luna High**, osobny
   subagent) → integracja przez głównego orkiestratora (**GPT-5.6 Luna Medium**) →
   `READY_FOR_DEPLOY`.
2. Raport Operatora uruchamia Evaluatora bez czekania. `FAIL`, techniczny `BLOCK`,
   `TIMEOUT`, `INFRA` i `ZWIS` wracają do tej samej pętli i tego samego ID.
   Jedyną pauzą jest ABC wymagające decyzji właściciela.
3. Każdy temat ma jawny `GOAL`, kryteria końca, allowlistę i izolację worktree.
   Nie wystarcza „gotowe”, status, branch, commit ani komunikat UI.
4. C-043: właściciel komunikuje się wyłącznie w głównym czacie orkiestratora;
   kanały Operatora, Evaluatora i Final Control są techniczne.
5. ABC pozostaje obowiązkowe dla decyzji właściciela: pełne ID, sytuacja, cel, powód,
   A/B/C, za/przeciw i rekomendacja. Po odpowiedzi: ECHO → zapis → dalsza praca.
6. Operator, Evaluator i Final Control nie integrują, nie deployują i nie pushują.
   `READY_FOR_DEPLOY` wystawia orkiestrator dopiero po faktycznej integracji.
   Deploy/push to osobna bramka i wymaga wyraźnego polecenia właściciela.
7. Nie mieszaj tematów. Nie zmieniaj rejestru, `PYTANIA-OTWARTE.md`, handoffów ani logów
   bez jawnego zakresu. Dla pakietu dokumentacyjnego nie dotykaj `gra/`.
8. Przed commitem sprawdź faktyczny `git status`, allowlistę i diff; nie ufaj samemu
   raportowi agenta. Każda zmiana zapisana do repozytorium przechodzi niezależną kontrolę.

## SKRÓT AUTOBOT

```text
GOAL → izolacja/allowlista → Operator High → Evaluator High
→ Final Control High → integracja orkiestratora Medium
→ READY_FOR_DEPLOY → osobna bramka deploy/push
```

Raport terminalny używa pól: `STATUS`, `TEMAT`, `GOAL`, `ZMIANY/COMMIT`,
`TESTY`, `BLOKADY`, `NASTĘPNY KROK`, `DEPLOY/PUSH`.

## HIERARCHIA ŹRÓDEŁ

- proces i routing: [`docs/procesy/INDEX-PROCESU.md`](docs/procesy/INDEX-PROCESU.md);
- pełny opis dla człowieka: [`docs/decyzje/R-PROC-AUTOBOT.md`](docs/decyzje/R-PROC-AUTOBOT.md);
- aktywne reguły techniczne: [`.cursor/rules/`](.cursor/rules/);
- instrukcja skill: [`.claude/skills/civ-autobot/SKILL.md`](.claude/skills/civ-autobot/SKILL.md);
- referencyjny schemat: [`dyspozycje/AUTOBOT-SCHEMAT-DZIALANIA.md`](dyspozycje/AUTOBOT-SCHEMAT-DZIALANIA.md);
- runtime AutoBot: [`dyspozycje/autobot/README.md`](dyspozycje/autobot/README.md).

Przy konflikcie wróć do indeksu, sprawdź najnowszą decyzję właściciela i zgłoś rozjazd.
Historyczne snapshoty Pakietu 2 są oznaczone w [`docs/archiwum-procesu/`](docs/archiwum-procesu/)
i nie są aktywnym routingiem.

## SZYBKA KONTROLA

W zakresie dokumentacji uruchom audyt linków, `git diff --check` oraz smoke/generator, jeśli
zmiana dotyczy narzędzi AutoBot. Nie wykonuj deployu ani pushu bez osobnej bramki.
