# OBOWIĄZ — brama playtestu (KANON 2026-07-02)

> **Decyzja Macieja:** playtest **dopiero przy ~100% gry** · zbiorczy rejestr: [`../master/REJESTR-PLAYTESTOW.md`](../master/REJESTR-PLAYTESTOW.md)
> **Trigger:** wpisz **`obowiaż`** w czacie grupy A–E (lub hub Master) — agent **natychmiast** stosuje ten plik.

---

## Kto co robi (koniec zamieszania)

| Rola | Twoje zadanie | Czego NIE robisz |
|------|-----------------|------------------|
| **Maciej** | **`playtest OK`/`BUG:`** tylko po prośbie **Mastera** | Słucha o playtest od lane A–F |
| **Grupy A–E** | **ZAKAZ** informować Macieja o playtestach | → **REJESTR §2** (cicho) |
| **Integrator F** | **ZAKAZ** | → **REJESTR §2** + F-do-MASTER |
| **Master** | **Jedyny** informuje Macieja o playtestach (kolejka, zaległości, prośba o test) · §0–§4 rejestru | Delegować playtest grupom · wspominać playtest w czatach lane |

---

## Łańcuch (jedyna ścieżka do playtestu)

```
Grupa: ABC → kod → testy lane → przekaż do Mastera
   ↓
Master: dyspozycja Integrator F
   ↓
Integrator F: wpięcie → bramka → meldunek F-do-MASTER (GOTOWE-ROBOCZA)
   ↓
Master: review + promocja kanon → **dopis REJESTR §2** (⏸ KOLEJKA)
   ↓
[~100% gry] Master otwiera REJESTR §0 → prosi Macieja w hubie
   ↓
Maciej: playtest OK / BUG:
```

**Bez meldunku F i bez ACK Mastera = brak playtestu.** Moduł „gotowy u grupy" ≠ gotowy do testu Macieja.

---

## ZAKAZY (Grupy A–E + F — NIENEGOCJOWALNE)

- ❌ **Jakakolwiek wzmianka o playtest w czacie z Maciejem** (start, raport2, checklisty PT-*, scenariusze)
- ❌ „Maciej, przetestuj …" / „playtest OK?" / „sprawdź w grze …"
- ❌ Kończyć meldunek: „czeka playtest Macieja"
- ❌ W `raport2`: playtest jako zadanie u Macieja

**Dozwolone (cicho — Maciej tego nie widzi w czacie):**

- ✅ Dopisz [`REJESTR-PLAYTESTOW.md`](../master/REJESTR-PLAYTESTOW.md) **§2** (⏸ KOLEJKA)
- ✅ Handoff Master: `PLAYTEST-KANDYDAT: PT-XXX → rejestr §2`
- ✅ „→ MASTER: GOTOWE" + testy lane PASS

**Przed v1.0:** sekcja **4 Playtesty** w hubie Mastera **nie pokazuj Maciejowi** w `start`.

---

## Trigger `obowiaż` — co robi agent

Gdy Maciej (lub Master) wpisze **`obowiaż`**:

1. Przeczytaj ten plik (już czytasz).
2. Odpowiedz **3 linie:** „Stosuję OBOWIĄZ-PT · zero playtest w czacie · kandydat → REJESTR §2."
3. Usuń z bieżącej odpowiedzi / 🎯 TERAZ wszelkie prośby o playtest Macieja.
4. W pliku obiegu grupy dopisz: `POTWIERDZENIE OBOWIĄZ-PT: 2026-07-02`

---

## Powiązane

- [`OBOWIAZ-PLAYTEST-REJESTR.md`](OBOWIAZ-PLAYTEST-REJESTR.md) · trigger **`rejestr`**
- [`../master/REJESTR-PLAYTESTOW.md`](../master/REJESTR-PLAYTESTOW.md) · **jedno miejsce** §1–§4
- [`MACIEJ-ROLA-MINIMAL.md`](MACIEJ-ROLA-MINIMAL.md)
- [`_ZASADY.md`](_ZASADY.md) §3 · §7.1f
- [`KOMENDY-MACIEJA.md`](KOMENDY-MACIEJA.md)
- `.cursor/rules/komendy-raport.mdc` · `.cursor/rules/decyzje-echo.mdc`
