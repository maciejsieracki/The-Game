# Cuda świata (przegląd)

## Metadane

| id | `cuda-swiata` |
| tytuł | Cuda świata (przegląd) |
| kategoria | Kultura i cuda |
| poradnik_ref | `docs/PORADNIK-GRACZA/91-katalog-cudow-antyk.md` |
| json_ref | `wonders.json` |

---

## Wiki‑S

**19 cudów** epoki Antyk (Kamień/Brąz/Żelazo), budowane jako **heks w terytorium** (nie slot miasta) z puli **Pracy**. Każdy cud ma **max 1 egzemplarz na całym świecie**. Dwa typy dostępu: **E (wyłączny)** — tylko wskazane cywilizacje widzą go w panelu; **R (wyścigowy)** — widzą i mogą budować wszystkie 15 cywilizacji, wygrywa kto pierwszy. Osobny **ekran galerii** pokazuje karty cudów w pasmach wg epoki wejścia.

---

## Wiki‑M

### Ekran galerii

Pełnoekranowy ekran „Cuda świata" — karty pogrupowane w pasma wg **epoki wejścia** (Kamień/Brąz/Żelazo), karta → szczegóły cudu (Esc zamyka). Cud typu R ma widoczne oznaczenie „wyścig".

### Dostęp E vs R

- **E — wyłączny:** lista `cywilizacje` w danych cudu (np. Piramidy tylko dla Egiptu); inni gracze nie widzą go w ogóle w swoim panelu.
- **R — wyścigowy:** dokładnie **3 cuda** są wyścigowe, po jednym na epokę Antyku — **Wyrocznia** (Kamień), **Kamień Ha'amonga** (Brąz), **Brama wszystkich narodów** (Żelazo). Wszystkich 15 typów cywilizacji je widzi i może budować; wygrywa pierwszy budowniczy, reszта traci możliwość.
- **Zasada wspólna:** max **1 egzemplarz na świecie** niezależnie od typu dostępu.

### Bonusy (kanon 2026)

Cztery kategorie bonusów w `wonders.json`: **miasto** (yield/turę × KAŻDE miasto imperium, mnożnik ×3 vs v0.1), **teren** (modyfikator pól danego typu w terytorium), **specjalne/cywilizacja** (jednorazowe lub % na poziomie całego imperium — wpływ dyplomatyczny, zaufanie, wsparcie wojenne, % handlu/nauki/produkcji…), **hex** (tylko pole samego cudu). Cuda **NIE dają Mocy** — Moc pochodzi wyłącznie z odkryć technologii (decyzja Maciej 2026-06-26).

### Wygaśnięcie po „absolut"

Domyślnie **absolut = epoka 6** (koniec Średniowiecza): od epoki absolut+1 wszystkie bonusy z JSON wygasają, ale **cud zostaje na mapie** jako ruina (nie jest niszczony). Utrzymanie spada do **50%** (zaokrąglone w dół, min. 0). Jedyny ocalały efekt: **+10 do handlu** (atrakcja turystyczna).

**Powiązane:** poszczególne karty cudów (Piramidy, Wyrocznia, Koloseum…) · [[Drzewko technologii]] (techUnlock cudu E)

---

## Przykład liczbowy

**19 cudów, koszty budowy od 140 (Posąg Peruna) do 320 pracy (Terakotowa armia)** — przy stolicy produkującej **12 pracy/t** to od **12 do 27 tur** bez rush. Zobacz kartę konkretnego cudu dla dokładnego kosztu i bonusów.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/91-katalog-cudow-antyk.md` · `docs/PORADNIK-GRACZA/15-kultura-religia-cuda.md`

---

## Historia / decyzje

Kanon cudów: Maciej 2026-06-26 (dostęp E/R, brak Mocy, wygaśnięcie po absolut) + 2026-07-03 (kanon bonusów ×3, techUnlock cudu E). Ekran galerii — TEMAT #16 (`wondersView.ts`), makieta KANON Design. Hasło zbiorcze dodane 2026-07-23 (audyt CIVPEDII) — poszczególne 19 kart cudów już istniały, brakowało strony zbierającej zasady E/R i ekran.
