# Gr-D3 — Wymiana i relacje — pytania A / B / C

> **Status:** **ZAMKNIĘTE** 2026-06-30 (Maciej — odpowiedzi w czacie + formularz).

---

## D3-W1 — Bonus Zaufania przy zawarciu handlu

**O co chodzi:** Czy samo podpisanie deala daje stałe +2 Zaufania, czy relacje z handlu idą **tylko** przez nadmiar punktów wartości?

| | Opcja |
|---|--------|
| **A** | **Tylko nadmiar PN** — fair deal = 0 z tego mechanizmu *(rekomendacja lane D)* |
| **B** | **+2 Zaufania** przy każdym zawartym handlu **oraz** nadmiar |
| **C** | **+1 Zaufania** przy zawarciu (łagodniejszy kompromis) + nadmiar |

---

## D3-W2 — „Dobra wola" po hojnym handlu

**O co chodzi:** Po wymianie z nadmiarem — dodatkowo +1 Zaufania/turę przez 5 tur?

| | Opcja |
|---|--------|
| **A** | **Nie** — tylko jednorazowy skok z nadmiaru (max 5/turę) *(rekomendacja lane D)* |
| **B** | **Tak** — +1 Zaufania/turę × 5 tur gdy nadmiar > 0 |
| **C** | **Słabsza dobra wola** — +1/turę × **3 tury** tylko gdy nadmiar ≥ 100 PN |

---

## D3-W3 — Próg czystego daru (prezent)

**O co chodzi:** Kiedy można dać prezent **bez** towaru w zamian?

| | Opcja |
|---|--------|
| **A** | **Relacja ≥ 100** — jak handel *(rekomendacja lane D)* |
| **B** | **Wcześniej** — np. Relacja ≥ 30 (przy kontakcie) |
| **C** | **Relacja ≥ 50** — środek |

---

## D3-W4 — Tolerancja uczciwej wymiany

**O co chodzi:** Kiedy partner (AI) akceptuje handel?

| | Opcja |
|---|--------|
| **A** | **Ścisłe sumy PN** — musisz dać co najmniej fair po kursie Relacji *(rekomendacja lane D)* |
| **B** | **±20%** — „prawie fair" wystarczy (stary kod) |
| **C** | **±10%** — kompromis |

---

## D3-W5 — Próg wymiany technologii

**O co chodzi:** Od jakiej Relacji tech może być w koszyku?

| | Opcja |
|---|--------|
| **A** | **Relacja ≥ 100** — jak reszta handlu *(rekomendacja lane D)* |
| **B** | **Relacja ≥ 120** — tech drożej politycznie |
| **C** | **Relacja ≥ 110** — jak pakt o nieagresji |

---

## D3-W6b — Kurs żywności (doprecyzowanie W6=Tak)

**O co chodzi:** Ile żywności = 1 punkt wartości? (W kodzie dziś: **3**)

| | Opcja |
|---|--------|
| **A** | **1 PN = 2 żywności** (droższa żywność w wymianie) |
| **B** | **1 PN = 3 żywności** *(rekomendacja — już w JSON)* |
| **C** | **1 PN = 4 żywności** (tańsza żywność w wymianie) |

---

## D3-W10 — Dostęp do złoża: trwały czy najem

| | Opcja |
|---|--------|
| **A** | **Tylko trwały** dostęp (tak/nie) — jak dziś *(rekomendacja lane D)* |
| **B** | **Najem na N tur** (np. 10/20) z tańszą ceną PN |
| **C** | **Obie formy** w UI — gracz wybiera przy negocjacji |

---

## D3-W11 — Przetworzone dobra (cegła, stal…)

| | Opcja |
|---|--------|
| **A** | **Nie v1.0** — bez worków w magazynie *(rekomendacja lane D)* |
| **B** | **v2** — dopiero z magazynem ilościowym |
| **C** | **v1.0 ze stałą tabelą PN** (bez magazynu — uproszczenie, więcej ryzyka balansu) |

---

## Tabela odpowiedzi

| ID | A | B | C | Twoja | Data |
|----|---|---|---|-------|------|
| D3-W1 | Tylko nadmiar | +2 + nadmiar | +1 + nadmiar | **A** | 2026-06-30 |
| D3-W2 | Bez dobrej woli | +1×5 tur | +1×3 tur ≥100 PN | **C** | 2026-06-30 |
| D3-W3 | Rel ≥100 | Rel ≥30 | Rel ≥50 | **B** | 2026-06-30 |
| D3-W4 | Ścisłe PN | ±20% | ±10% | **A** | 2026-06-30 |
| D3-W5 | Rel ≥100 | Rel ≥120 | Rel ≥110 | **A** | 2026-06-30 |
| D3-W6b | 1 PN=2 żyw. | 1 PN=3 żyw. | 1 PN=4 żyw. | **C→korekta: 1 PN=1** | 2026-06-30 |

> **Korekta Macieja (2026-06-30):** kurs **1 PN = 1 żywność** (zamiast wcześniejszego C = 4). Obowiązuje w `diplomacy.json` → `pn_zywnosc.jednostki_na_pn: 1`.
| D3-W10 | Trwały (+wojna) | Najem | Obie | **A+** | 2026-06-30 |
| D3-W11 | Nie v1.0 | v2 | v1 tabela | **A** | 2026-06-30 |

**Maciej W10 (dopisek):** dostęp trwały, ale **w trakcie wojny traci ważność** — po pokoju trzeba **zawrzeć na nowo**.

**Pakiet Macieja:** `D3-W1=A, D3-W2=C, D3-W3=B, D3-W4=A, D3-W5=A, D3-W6b=C, D3-W10=A+, D3-W11=A`
