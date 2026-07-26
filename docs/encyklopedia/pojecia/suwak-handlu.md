# Suwak handlu (podatki)

## Metadane

| id | `suwak-handlu` |
| tytuł | Suwak handlu |
| poradnik_ref | Część VI §38.1 |

---

> **Nazwa historyczna.** Ten plik i jego adres (`suwak-handlu.md`) noszą starą nazwę „handel" — świadomie **nie zmieniamy nazwy pliku** (mogą do niego prowadzić linki z innych dokumentów). Treść dotyczy jednak podziału **Daniny** (nazwa strumienia po odkryciu Waluty i budowie Mennicy w stolicy: **Podatek**), nie handlu międzycywilizacyjnego — handel między cywilizacjami to osobna mechanika szlaków handlowych (Część VIII §53.3, Część XII).

## Wiki‑S

Suwak **Daniny** dzieli Daninę netto miasta na trzy kierunki: domyślnie **60% skarbiec (złoto) · 20% nauka · 20% zamożność (luksus)**. Ten domyślny podział jest identyczny na wszystkich trzech poziomach trudności. Więcej zamożności = wyższe szczęście, mniej złota i nauki **z tego miasta**.

---

## Wiki‑M

Ustawiasz **per miasto** w zakładce Miasto. **Zamożność** (trzeci segment) wpływa na:
- pulę **bogactwa** imperium,
- bonus/karę szczęścia wg **10 przedziałów po 10 punktów procentowych** udziału zamożności (patrz tabela niżej — łatwy/normalny/trudny mają różne wartości),
- przy niskim udziale (0–19% na normal) ta sama tabela daje **karę** („wysokie podatki").

**Trade-off:** miasto stołeczne **20/20/60** (skarbiec/nauka/zamożność) → dużo szczęścia, wolniejszy skarbiec. Miasto graniczne **80/10/10** → więcej złota na wojsko, ryzyko buntu.

### Tabela pełna — Szczęście od udziału Zamożności w Daninie (pkt Szczęścia miasta na turę)

| Udział Zamożności w Daninie | Łatwy | Normalny | Trudny |
|---|---|---|---|
| 0–9% | **+1** | **−1** | **−2** |
| 10–19% | **+2** | **0** | **−1** |
| 20–29% | **+3** | **+1** | **0** |
| 30–39% | **+4** | **+2** | **+1** |
| 40–49% | **+5** | **+3** | **+2** |
| 50–59% | **+6** | **+4** | **+3** |
| 60–69% | **+7** | **+5** | **+4** |
| 70–79% | **+8** | **+6** | **+5** |
| 80–89% | **+9** | **+7** | **+6** |
| 90–100% | **+10** | **+8** | **+7** |

Przy domyślnym udziale **20%** zamożności miasto dostaje na normalnej trudności **+1 pkt** Szczęścia z tego tytułu.

---

## Co jeszcze wchodzi do puli Daniny

**Pieniądz z budynków** (np. Targowisko) oraz **Pieniądz z zamiany Pracy przez Targowisko** nie trafiają wprost do skarbca — wpadają do tej samej puli Daniny netto miasta i dzielą się identycznym suwakiem, zamiast omijać podział.

## Danina → Podatek, Mennica i Waluta

Gdy cywilizacja odkryje **Walutę** i zbuduje **Mennicę w stolicy**, strumień zmienia nazwę z **Danina** na **Podatek** dla **całej** cywilizacji (nazwa, nie liczby) i cała Danina/Podatek netto cywilizacji dostaje **mnożnik Mennicy**: ×2,0 (łatwy) / ×1,5 (normalny) / ×1,0 (trudny). Mennica dodatkowo wymaga **dostępu do złota** (własna Kopalnia złota albo szlak handlowy z posiadaczem złota) — po utracie dostępu mnożnik znika i nazwa wraca na Daninę, choć budynek zostaje i budzi się sam po odzyskaniu dostępu. Pełny opis: Część VIII §49.3b.

## Korupcja dotyka tylko Daniny/Podatku

Korupcja obniża procent Daniny/Podatku miasta (rośnie z odległością od stolicy i liczbą miast właściciela, sufit straty 38/50/62% łatwy/normalny/trudny) — **Praca nigdy nie jest tym objęta**. Sąd, Pretorium i Pałac redukują korupcję po 30 punktów procentowych każdy, addytywnie (realne maksimum 60, bo żadne miasto nie ma naraz Pałacu i Pretorium). Pełny opis: Część VIII §49.3a.

---

## Przykład liczbowy

**Miasto** generuje **10 jednostek Daniny netto/t** (z pól + budynków).

| Ustawienie | Skarbiec/t | Nauka/t | Luksus/t | Bonus szczęścia (normal) |
|------------|---------|---------|----------|---------------------------|
| **60/20/20** (domyślne) | 6 | 2 | 2 | **+1** (20–29%) |
| **50/20/30** | 5 | 2 | 3 | **+2** (30–39%) |
| **40/20/40** | 4 | 2 | 4 | **+3** (40–49%) |
| **30/20/50** | 3 | 2 | 5 | **+4** (50–59%) |

**Scenariusz:** po podboju masz szczęście **25%**. Przesuwasz na **40/20/40** (+3 pkt zamiast +1, czyli **+2** więcej). Przy SzMax 18 i innych plusach te dodatkowe **+2** pkt netto mogą dać kilka punktów procentowych więcej szczęścia — sprawdź w panelu miasta dokładną rozpiskę.

**Koszt:** z **6** na **4** skarbca/t = **−2 ¤/t** = **−20 ¤** w 10 turach — płacisz spokojem społecznym skarbcem.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/06-miasto-spoleczenstwo.md` §38
