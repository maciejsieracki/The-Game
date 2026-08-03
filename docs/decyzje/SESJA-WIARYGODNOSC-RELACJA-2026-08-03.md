# SESJA — Wiarygodność / Relacja / Zaufanie (cloud 2026-08-03 wieczór)

**Branch docs:** `cursor/docs-sesja-wiarygodnosc-2026-08-03-63a1`  
**Kontekst:** Maciej potwierdził model kanoniczny i serię decyzji po playteście mechaniki dyplomacji. Sesja cloud: analiza luk, PR-y kodowe #47–#50, dokumentacja bez deploy.

---

## A. Model kanoniczny (Maciej potwierdził)

```
Wiarygodność → (tempo) Zaufanie
Zaufanie + Respekt = Relacja (0–200)
Relacja → decyzje AI + wycena deala PN (±% , balans przy 100, clamp ±90%)
```

| Pojęcie | Zakres | Rola |
|---------|--------|------|
| **Wiarygodność (W)** | −100…+100, globalna per cywilizacja | Historia dotrzymywania słowa; wpływa na **tempo** zmian Zaufania (Dźwignia 1) |
| **Zaufanie** | 0…100, per para | Nastawienie do konkretnego partnera |
| **Respekt** | per para | Siła względna tu i teraz |
| **Relacja** | 0…200 | `Zaufanie + Respekt`; balans deala przy **100**; modyfikator PN **clamp ±90%** |

**Źródło prawdy spec:** `dyspozycje/WIARYGODNOSC-SPECYFIKACJA.md` (notka NADRZĘDNE 2026-08-03 przy §5 Dźwignia 1).

---

## B. Decyzje / ustalenia sesji

| ID | Decyzja | Skrót | PR / branch |
|----|---------|-------|-------------|
| **WIAR-Q3** | **C** (TEMPO + PROGI) | Oryginalna Dźwignia 1 = **mnożnik tempa**, nie strumień W/20. Progi: sojusz W≥0, NAP W≥−40 | część w PR #47 |
| **R-WIARYGODNOSC-TEMPO-PRZYWROCENIE** | Maciej 2026-08-03 „Przywrócić TEMPO" | `wzrostMult=1+(W/100)×0.5`, `spadekMult=1−(W/100)×0.5`; skasować zamiennik W/20 z `tickDiplomacy` | **PR #49** · `cursor/wiarygodnosc-tempo-q3-63a1` |
| **R-WIARYGODNOSC-DZWIGNIA2-Q1** | **A** | Bez Dźwigni 2 (sufit darów od W). Paczka: NAP-BEZTERMIN=A, START-ETAP=A | **PR #47** · `cursor/wiarygodnosc-dzwignia2-a-63a1` |
| **WIAR-Q6** | start W | Łatwy **+40**, Normalny **+20**, Trudny **0** (nie „wszyscy 70"). Maciej potwierdził pamięć +20 = Normalny | spec §1 · PR #47 (badge) |
| **Relacja ±90%** | — | Relacja 100 = balans; >100 tańszy deal; <100 droższy; clamp ±90. Maciej: „o to mi chodziło" | logika w silniku; UI w PR #50 |
| **R-UI-RELACJA-DEAL-MOD** | — | Wiersz „Wpływ Relacji na deal" w panelu PW (propozycja wymiany) | **PR #50** · `cursor/ui-relacja-deal-mod-63a1` |
| **R-MANPOWER-EPOKA1-500** | — | `manpowerNaJednostke` epoka 1 (Kamień): 1000→500 | **PR #48** · `cursor/manpower-epoka1-500-63a1` |

### Szczegóły WIAR-Q3 = C

- **Dźwignia 1 (tempo):** mnożnik na istniejące składniki `dZ` w `tickDiplomacy`, nie dodatkowy strumień `W/20` co turę.
- **Dźwignia 3 (progi):** twarde bramki w `evaluateProposal` — sojusz wymaga W≥0, NAP wymaga W≥−40.
- Strumień `W/20` był **błędnym zamiennikiem** tempa (wdrożony wcześniej jako C-WIAR-SKALA=20) — Maciej: „nie ma tego co ustalił".

### Szczegóły paczki PR #47

- NAP bezterminowy (NAP-BEZTERMIN=A).
- Start etapowy (START-ETAP=A).
- Badge Wiarygodności w UI dyplomacji (D3).
- **Luka:** Dźwignia 2 nadal w kodzie `main` mimo decyzji A — do usunięcia przy merge tempa / osobny fix.

---

## C. Problemy / luki (otwarte — NIE naprawione w pełni w tej sesji)

| # | Problem | Status |
|---|---------|--------|
| 1 | **Strumień W/20** zamiast mnożnika tempa — gracz czuł brak „tempa" | Fix w PR #49, **bez merge/deploy na main** |
| 2 | **Dźwignia 3** (progi W≥0 / W≥−40) — parametry w `DIPLOMACY_PARAMS`; egzekucja w `evaluateProposal` tylko na PR #47 | **Nie na main** do czasu merge |
| 3 | **Dźwignia 2** nadal w kodzie `main` mimo **R-WIARYGODNOSC-DZWIGNIA2-Q1=A** | Usunąć przy okazji merge #47/#49 |
| 4 | **Wycena deala:** Relacja waży PN (±%); sam **NAP nie tipuje bilansu „na plus"** przy dobrej Relacji (oczekiwanie Macieja) | Przyszłe ABC — poza tą sesją |
| 5 | **D1 strumień** (przed przywróceniem tempa): tylko W gracza, tylko pary gracz↔AI — asymetria vs „ze wszystkimi" | Do weryfikacji po merge tempa |
| 6 | **REJESTR-PROSB** `R-WIARYGODNOSC` status „CZEKA-NA-DECYZJĘ" był nieaktualny | Zaktualizowano w tej sesji docs |

---

## D. Tabela PR (sesja)

| PR | Branch | Temat | Merge main | Deploy ROBOCZA |
|----|--------|-------|------------|----------------|
| **#47** | `cursor/wiarygodnosc-dzwignia2-a-63a1` | DZWIGNIA2=A, NAP, START, badge W, D3 progi | ⏸ czeka | ⏸ |
| **#48** | `cursor/manpower-epoka1-500-63a1` | Manpower epoka 1: 500 | ⏸ czeka | ⏸ |
| **#49** | `cursor/wiarygodnosc-tempo-q3-63a1` | Przywrócenie mnożnika tempa WIAR-Q3 | ⏸ czeka | ⏸ |
| **#50** | `cursor/ui-relacja-deal-mod-63a1` | UI „Wpływ Relacji na deal" ±% | ⏸ czeka | ⏸ |

---

## E. Co dalej dla agentów

1. **Merge PR #47 → #49 → #48 → #50** (kolejność zalecana: najpierw wiarygodność/tempo, potem UI i manpower) — po review Macieja.
2. **Deploy** tylko na hasło Macieja `deploy` — wpis `dyspozycje/WERSJE.md` + `KANAL-PRACA.md`.
3. Po merge **#49:** usunąć strumień `W/20` z `tickDiplomacy`; zostawić `round(W/20)` tylko na **start kontaktu** (Dźwignia 4).
4. Po merge **#47:** potwierdzić brak Dźwigni 2 w kodzie; jeśli żyje — osobny fix.
5. **Przyszłe:** NAP jako „tip na plus" w bilansie deala przy dobrej Relacji — zapisać w `PYTANIA-OTWARTE.md`, nie mieszać z deployem tempa.
6. Decyzje pomocnicze z wcześniejszej spec (jeśli brakowało w rejestrze): **C-WIAR-SKALA** (dzielnik 20 — **do wycofania** po tempie), **C-WIAR-SUMA=A**, **C-WIAR-WOJNA=B**, **C-WIAR-WROG=A** — patrz `WIARYGODNOSC-SPECYFIKACJA.md` §5 i tabela §10.

---

## F. Pliki powiązane (ta sesja docs)

| Plik | Rola |
|------|------|
| `docs/decyzje/R-WIARYGODNOSC-TEMPO-PRZYWROCENIE-2026-08-03.md` | ECHO „Przywrócić TEMPO" |
| `docs/decyzje/R-WIARYGODNOSC-PACZKA-2026-08-03.md` | Paczka DZWIGNIA2=A |
| `docs/decyzje/R-UI-RELACJA-DEAL-MOD-2026-08-03.md` | UI ±% Relacji |
| `docs/decyzje/R-MANPOWER-EPOKA1-500-2026-08-03.md` | Manpower 500 |
| `docs/obieg/REJESTR-DECYZJI.md` | Wiersze 2026-08-03 |
| `dyspozycje/REJESTR-PROSB-I-ZADAN.md` | Status R-WIARYGODNOSC |
| `dyspozycje/WIARYGODNOSC-SPECYFIKACJA.md` | Notka NADRZĘDNE §5 |
| `STAN-PRACY-HANDOFF.md` | Sekcja Wiarygodność 2026-08-03 |
