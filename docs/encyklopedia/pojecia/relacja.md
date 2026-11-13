# Relacja (dyplomacja)

## Metadane

| Pole | Wartość |
|------|---------|
| id | `relacja` |
| tytuł | Relacja |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII §74, §77 |
| json_ref | `diplomacy.json` (params), kod etykiet `diplomacy-display.ts` |
| stan | Stan na 2026-11-13 (weryfikacja w kodzie) |

---

## Wiki‑S

**Relacja** to suma **Zaufania** i **Respektu** w parze cywilizacji (0–200). Na jej podstawie gra nadaje nastawieniu etykietę (od Wrogi do Przyjazny) i decyduje, które umowy są dostępne.

---

## Wiki‑M

### Skala i etykiety

Relacja = Zaufanie + Respekt, zaokrąglona do pełnej liczby i ograniczona do 0–200.

| Relacja | Etykieta nastawienia |
|--------:|----------------------|
| poniżej 30 | Wrogi |
| 30–44 | Nieufny |
| 45–59 | Neutralny |
| 60–119 | Życzliwy |
| 120 i więcej | Przyjazny |

W wojnie etykieta jest **zawsze Wrogi**, niezależnie od liczby.

### Plusy i minusy

**Dla gracza**
- Plus: wysoka Relacja otwiera umowy (handel od 0, pakt o nieagresji od 110, sojusz od 130).
- Plus: Relacja jest widoczna w panelu dyplomacji i od razu pokazuje, czego możesz się spodziewać.
- Minus: wojna zeruje Zaufanie, więc Relacja w wojnie spada prawie do samego Respektu.

**Dla AI**
- Progi w tabeli opisują umowy dostępne w grze; osobne progi decyzji AI (np. gotowość do sojuszu) nie są w tym haśle opisane.
- Minus: w wojnie etykieta to zawsze Wrogi, niezależnie od liczby.

### Progi umów

| Umowa | Relacja | Zaufanie |
|-------|--------:|---------:|
| Handel | ≥ 0 | — |
| Pakt o nieagresji | ≥ 110 | ≥ 30 |
| Sojusz | ≥ 130 | ≥ 90 |
| Pakt bezterminowy | ≥ 151 | — |
| Złoże: dostęp przez Relację | ≥ 100 | — |

Szczegóły zaufania: hasło **Zaufanie**. Szczegóły respektu: hasło **Respekt**.

### Zasady zatwierdzone, jeszcze niewdrożone

> **DECYZJA WŁAŚCICIELA 2026-11-13, wdrożenie w toku.** Ten blok NIE opisuje obecnego stanu gry.

- Etykiety nastawienia zmieniają progi: Wrogi poniżej 10, Nieufny 10–29, od 30 Relacja jak dziś.

---

## Przykład liczbowy

Zaufanie 85 i Respekt 60 dają Relację 145 (etykieta Przyjazny). Sojusz wymaga Relacji 130 i Zaufania 90, więc przy Zaufaniu 85 sojusz jest jeszcze niedostępny, mimo wysokiej Relacji.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md` §74 i §77

---

## Parametry

| Wartość | Skąd (plik:klucz) |
|--------:|-------------------|
| 30 | `kod:etykieta-wrogi` (próg Wrogi/Nieufny, `diplomacy-display.ts`) |
| 45 | `kod:etykieta-nieufny` (próg Nieufny/Neutralny, `diplomacy-display.ts`) |
| 60 | `kod:etykieta-neutralny` (próg Neutralny/Życzliwy, `diplomacy-display.ts`) |
| 120 | `kod:etykieta-zyczliwy` (próg Życzliwy/Przyjazny, `diplomacy-display.ts`) |
| 200 | `kod:relacja-max` (górna granica Relacji, `diplomacy-display.ts`) |
| 110 | `diplomacy.json:params.progNapRelacja` |
| 30 | `diplomacy.json:params.progNapZaufanie` |
| 130 | `diplomacy.json:params.progSojuszRelacja` |
| 90 | `diplomacy.json:params.progSojuszZaufanie` |
| 151 | `diplomacy.json:params.progNapBezterminowyRelacja` |
| 0 | `diplomacy.json:params.progHandelRelacja` |
| 100 | `diplomacy.json:handel_zloze.prog_relacja_min` |

---

## Historia / decyzje

Hasło zweryfikowane w kodzie 2026-11-13 (R-WEB-DIPLO-CIVPEDIA-Q1). Etykiety i progi w kodzie: `diplomacy-display.ts` (funkcja etykiety nastawienia).
