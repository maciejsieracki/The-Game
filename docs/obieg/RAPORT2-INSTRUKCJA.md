# Hasło `raport2` — audyt ABC + handoff Master (3 sekcje)

> **Maciej wpisuje w czacie grupy A–E:** **`raport2`** (alias: **`raport 2`**)  
> **Master (hub):** **`start`** — zbiorczy skrypt · lub **`raport2`** per grupa w dyspozycji

---

## Hasło

```
raport2
```

Działa też: `raport 2` · stary alias `audyt wdrożenia` (to samo).

---

## Co robi agent grupy (natychmiast, bez dopytywania)

**Filtr OBOWIĄZ-ZAKRES:** tylko decyzje **tej grupy** z `REJESTR-DECYZJI.md` · **bez** statusu innych lane'ów · **bez** audytu całej gry ([`OBOWIAZ-ZAKRES-RAPORTU.md`](OBOWIAZ-ZAKRES-RAPORTU.md)).

Odpowiedź **dokładnie w 3 sekcjach**:

### 1. ✅ ABC wdrożone
Decyzje Macieja z `REJESTR-DECYZJI.md` **tej grupy** — status 🟢/✅ + **dowód** (plik · funkcja · test · md5).

### 2. 🔜 Nie wdrożone / w toku
🟡 · 🔵 · 🟠 bez dowodu w kodzie. **Co blokuje** (ABC? Integrator?).

### 3. 📤 Przekazane Masterowi
Per temat gotowy: handoff `dyspozycje/_handoff/*-do-MASTER*` · `→ MASTER: GOTOWE` · Slack #master — **TAK/NIE**.  
Brakuje → agent **sam dopisuje** w tej sesji.

**Na końcu (1 linia):** `Gotowe u Mastera: TAK/NIE · brakuje: …`

**ZAKAZ:** „Wklej w czacie MASTER" · **ZAKAZ** playtest w odpowiedzi do Macieja — kandydat tylko w [`REJESTR-PLAYTESTOW.md`](../master/REJESTR-PLAYTESTOW.md) §2

---

## 🚫 OBOWIĄZ playtest — cisza w czacie

Grupy **nie** wspominają playtest w `raport2`. Po kanonie → dopisz **REJESTR §2**. Trigger: **`rejestr`** · **`obowiaż`**

**Zakazane frazy w odpowiedzi:** playtest · przetestuj · zaległy · PT- · scenariusz · checklist · gotowe do testu — pełna lista: [`KOMUNIKACJA-PLAYTEST-LANE.md`](KOMUNIKACJA-PLAYTEST-LANE.md)

---

## 🎯 OBOWIĄZ zakres raportu

**ZAKAZ** sekcji o całej grze, innych grupach, kolejce F (poza 1-liniowym blokiem). Trigger: **`zakres`**.

---

## Maciej — jak używać

| Gdzie | Wpisujesz |
|-------|-----------|
| Czat **Grupa A** | `raport2` |
| Czat **Grupa B** | `raport2` |
| Czat **Grupa C** | `raport2` |
| Czat **Grupa D** | `raport2` |
| Czat **Grupa E** | `raport2` |
| Czat **Master (hub)** | `start` (zbiorczy audyt) |

Nic nie kopiujesz między czatami.

---

## Master — skrypt (przy `start`)

```powershell
cd gra
.\tools\audyt-abc-handoff.ps1
.\tools\audyt-abc-handoff.ps1 -Grupa C
```

---

## Gdzie wpisane instrukcje dla agentów

| Plik |
|------|
| `.cursor/rules/komendy-raport.mdc` § `raport2` |
| `docs/obieg/KOMENDY-MACIEJA.md` |
| `docs/obieg/A-mapa.md` … `E-start.md` — sekcja **⌨️ raport2** |
| `docs/obieg/C-walka.md` (wzór dla wszystkich) |

*Ostatnia aktualizacja: 2026-07-02 · OBOWIĄZ-PT · OBOWIĄZ-ZAKRES*
