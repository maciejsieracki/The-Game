// Wygenerowano przez: node tools/dom-harness/verify-k09a-copies.mjs --gen  (rewizja ręczna = FAIL bramki TEXT)
// Hunki = różnice LCS między pinem 86d510c66 (A..B) a blokiem portu; każda zmiana względem pinu jest tu zapisana.
// R-RUSTPORT-REPIN-UI-2-G-Q1 r2: regenerowane po przepięciu na web 86d510c66; jedyna zmiana hunków = linia `pinnedGarrisonCityId !== city.id` w k09a-paint (K09B r2 0a1761d80, id miasta = number; bramka K09A była czerwona na bazie 2198eaf7e).
export const K09A_HUNKS = {
 "k09a-paint.ts:11997-12094": [
  {
   "pin": [
    "  if (pinnedGarrisonCityId !== null && pinnedGarrisonCityId !== city.id) {"
   ],
   "port": [
    "  const st = getK06aState();",
    "  // pin: `pinnedGarrisonCityId` (string) vs `city.id` (number w v2, K08D-Z10): porównanie tożsame z K06B.",
    "  if (st.pinnedGarrisonCityId !== null && st.pinnedGarrisonCityId !== city.id) {"
   ]
  },
  {
   "pin": [
    "  uxSectionRefresh = refresh;",
    "  activeCity = city;",
    "  activeMap = map;",
    "  if (onClose) activeOnClose = onClose;",
    "  ensureStyles();"
   ],
   "port": [
    "  setK07aUxSectionRefresh(refresh);",
    "  setK07aActiveCity(city as unknown as CityK07);",
    "  setK06aActive(city as unknown as CityK06, map, onClose ?? st.activeOnClose);",
    "  ensureCityPanelStyles();"
   ]
  },
  {
   "pin": [
    "  setHoverDetailDocks("
   ],
   "port": [
    "  requireK09aDeps().setHoverDetailDocks("
   ]
  },
  {
   "pin": [
    "  mounts.top.style.fontSize = scalePx + 'px';",
    "  mounts.left.style.fontSize = scalePx + 'px';",
    "  if (mounts.leftIconRail) mounts.leftIconRail.style.fontSize = scalePx + 'px';",
    "  if (mounts.rightIconRail) mounts.rightIconRail.style.fontSize = scalePx + 'px';",
    "  if (mounts.leftDetailDock) mounts.leftDetailDock.style.fontSize = scalePx + 'px';",
    "  if (mounts.detailDock) mounts.detailDock.style.fontSize = scalePx + 'px';",
    "  mounts.right.style.fontSize = scalePx + 'px';"
   ],
   "port": [
    "  const sp = getK07aScalePx() + 'px';",
    "  mounts.top.style.fontSize = sp;",
    "  mounts.left.style.fontSize = sp;",
    "  if (mounts.leftIconRail) mounts.leftIconRail.style.fontSize = sp;",
    "  if (mounts.rightIconRail) mounts.rightIconRail.style.fontSize = sp;",
    "  if (mounts.leftDetailDock) mounts.leftDetailDock.style.fontSize = sp;",
    "  if (mounts.detailDock) mounts.detailDock.style.fontSize = sp;",
    "  mounts.right.style.fontSize = sp;"
   ]
  },
  {
   "pin": [
    "  const data = gameData();",
    "  const view = data ? computeView(city, map, data) : null;"
   ],
   "port": [
    "  const data = readGameDataK09a();",
    "  const view = data ? computeViewK09a(city, map, data) : null;"
   ]
  },
  {
   "pin": [
    "    renderOkolica(mounts.mapChrome, city, map);"
   ],
   "port": [
    "    renderOkolica(mounts.mapChrome, city as unknown as CityK07, map);"
   ]
  },
  {
   "pin": [
    "  renderProd(appendPanel(leftScope, 'cs-prod'), city, view);"
   ],
   "port": [
    "  renderProd(appendPanel(leftScope, 'cs-prod'), city as unknown as CityK07, view);"
   ]
  },
  {
   "pin": [
    "  if (isProductionPanelTab(activeCityPanelTab)) {",
    "    renderLeftPanelTab(leftMainEl, activeCityPanelTab, city, map, view, data);"
   ],
   "port": [
    "  const tab = getK08aActiveCityPanelTab();",
    "  if (isProductionPanelTab(tab)) {",
    "    renderLeftPanelTab(leftMainEl, tab, city, map, view, data);"
   ]
  },
  {
   "pin": [
    "  if (activeCityPanelTab === 'budowa') {"
   ],
   "port": [
    "  if (tab === 'budowa') {"
   ]
  },
  {
   "pin": [
    "  } else if (isProductionPanelTab(activeCityPanelTab)) {"
   ],
   "port": [
    "  } else if (isProductionPanelTab(tab)) {"
   ]
  },
  {
   "pin": [
    "    renderRightPanelTab(mainEl, activeCityPanelTab, city, map, view, data);"
   ],
   "port": [
    "    renderRightPanelTab(mainEl, tab, city, map, view, data);"
   ]
  }
 ],
 "k09a-paint.ts:12189-12202": [
  {
   "pin": [
    "  if (rootEl) rootEl.style.display = 'none';",
    "  activeCity = city;",
    "  activeMap = map;",
    "  activeOnClose = onClose;",
    "  ensureStyles();",
    "  setMapHudChromeSuppressed(true);"
   ],
   "port": [
    "  const root = getK06bRootEl();",
    "  if (root) root.style.display = 'none';",
    "  setK07aActiveCity(city as unknown as CityK07);",
    "  setK06aActive(city as unknown as CityK06, map, onClose);",
    "  ensureCityPanelStyles();",
    "  requireK09aDeps().setMapHudChromeSuppressed(true);"
   ]
  },
  {
   "pin": [
    "    const c = resolveActiveCity();",
    "    if (!c || activeMap === null) return;",
    "    refreshCityUxFrame(c, activeMap, refresh);"
   ],
   "port": [
    "    const c = resolveK08aActiveCity();",
    "    if (!c || getK06aState().activeMap === null) return;",
    "    // K09A-Z4: pin `refreshCityUxFrame(c, activeMap, refresh)` — mapa pozostaje w stanie K06A, v2 jej nie przyjmuje.",
    "    requireK09aDeps().refreshCityUxFrame(c as unknown as CityRefDto, refresh);"
   ]
  },
  {
   "pin": [
    "  showCityUxFrame(city, map, refresh, onClose);"
   ],
   "port": [
    "  requireK09aDeps().showCityUxFrame(city as unknown as CityRefDto, refresh, onClose);"
   ]
  }
 ],
 "k09a-paint.ts:12205-12209": [
  {
   "pin": [
    "  hideCityUxFrame();",
    "  setMapHudChromeSuppressed(false);",
    "  if (rootEl) rootEl.style.display = 'none';"
   ],
   "port": [
    "  requireK09aDeps().hideCityUxFrame();",
    "  requireK09aDeps().setMapHudChromeSuppressed(false);",
    "  const root = getK06bRootEl();",
    "  if (root) root.style.display = 'none';"
   ]
  }
 ],
 "k09a-rerender.ts:10456-10468": [
  {
   "pin": [
    "  if (activeCity === null) return;",
    "  const list = ownerCitiesForNav(activeCity);"
   ],
   "port": [
    "  const cur = readActiveCityK09a();",
    "  if (cur === null) return;",
    "  const list = ownerCitiesForNav(cur as unknown as CityK06) as unknown as City[];"
   ]
  },
  {
   "pin": [
    "  const idx = list.findIndex(c => c.id === activeCity!.id);"
   ],
   "port": [
    "  const idx = list.findIndex(c => c.id === cur.id);"
   ]
  },
  {
   "pin": [
    "  if (!next || next.id === activeCity.id) return;"
   ],
   "port": [
    "  if (!next || next.id === cur.id) return;"
   ]
  },
  {
   "pin": [
    "  activeCity = next;",
    "  cfg.onSwitchCity?.(next.id);"
   ],
   "port": [
    "  writeActiveCityK09a(next);",
    "  getK09aHooks().onSwitchCity?.(next.id);"
   ]
  }
 ],
 "k09a-rerender.ts:12096-12182": [
  {
   "pin": [
    "  if (uxSectionRefresh) {",
    "    uxSectionRefresh();"
   ],
   "port": [
    "  const refresh = getK07aUxSectionRefresh();",
    "  if (refresh) {",
    "    refresh();"
   ]
  },
  {
   "pin": [
    "  setHoverDetailDocks(null);",
    "  if (rootEl === null || activeMap === null) return;",
    "  const city = resolveActiveCity();"
   ],
   "port": [
    "  requireK09aDeps().setHoverDetailDocks(null);",
    "  const root = getK06bRootEl();",
    "  const mapNow = getK06aState().activeMap;",
    "  if (root === null || mapNow === null) return;",
    "  const city = resolveK08aActiveCity() as unknown as City | null;"
   ]
  },
  {
   "pin": [
    "  const map = activeMap, data = gameData();"
   ],
   "port": [
    "  const map = mapNow, data = readGameDataK09a();"
   ]
  },
  {
   "pin": [
    "  rootEl.style.fontSize = scalePx + 'px';",
    "  rootEl.innerHTML = skeleton(city, view);"
   ],
   "port": [
    "  root.style.fontSize = getK07aScalePx() + 'px';",
    "  root.innerHTML = skeleton(city as unknown as CityK07, view);"
   ]
  },
  {
   "pin": [
    "  rootEl.querySelectorAll('.civ-cs-tab').forEach(btn => {"
   ],
   "port": [
    "  root.querySelectorAll('.civ-cs-tab').forEach(btn => {"
   ]
  },
  {
   "pin": [
    "      if (tab && tab !== activeDrawerTab) {",
    "        activeDrawerTab = tab;"
   ],
   "port": [
    "      if (tab && tab !== getK07aDrawerTab()) {",
    "        setK07aDrawerTab(tab);"
   ]
  },
  {
   "pin": [
    "  const q = (id: string) => rootEl!.querySelector('#' + id) as HTMLElement | null;"
   ],
   "port": [
    "  const q = (id: string) => root.querySelector('#' + id) as HTMLElement | null;"
   ]
  },
  {
   "pin": [
    "  const imp = q('cs-imperium'); if (imp) renderImperiumZywnosc(imp, city);",
    "  const prod = q('cs-prod'); if (prod) renderProd(prod, city, view);"
   ],
   "port": [
    "  const imp = q('cs-imperium'); if (imp) renderImperiumZywnosc(imp, city as unknown as Parameters<typeof renderImperiumZywnosc>[1]);",
    "  const prod = q('cs-prod'); if (prod) renderProd(prod, city as unknown as CityK07, view);"
   ]
  },
  {
   "pin": [
    "  const spol = q('cs-spoleczenstwo'); if (spol && data) renderSpoleczenstwo(spol, city, data);",
    "  const zdr = q('cs-zdrowie'); if (zdr && data) renderZdrowie(zdr, city, map, data);",
    "  renderOkolica(rootEl, city, map);",
    "  const kult = q('cs-kultura'); if (kult) renderKultura(kult, city, view);",
    "  const relig = q('cs-religia'); if (relig) renderReligia(relig, city, view);"
   ],
   "port": [
    "  const spol = q('cs-spoleczenstwo'); if (spol && data) renderSpoleczenstwo(spol, city as unknown as CityK07, data);",
    "  const zdr = q('cs-zdrowie'); if (zdr && data) renderZdrowie(zdr, city as unknown as CityK07, map, data);",
    "  renderOkolica(root, city as unknown as CityK07, map);",
    "  const kult = q('cs-kultura'); if (kult) renderKultura(kult, city as unknown as CityK07, view);",
    "  const relig = q('cs-religia'); if (relig) renderReligia(relig, city, view, data);"
   ]
  },
  {
   "pin": [
    "  const close = q('cs-close'); if (close) close.addEventListener('click', () => { activeOnClose(); hideCityPanel(); });"
   ],
   "port": [
    "  const close = q('cs-close'); if (close) close.addEventListener('click', () => { getK06aState().activeOnClose(); requireK09aDeps().hideCityPanel(); });"
   ]
  },
  {
   "pin": [
    "      if (cfg.onOpenMapForOkolica) {",
    "        cfg.onOpenMapForOkolica(city.id);"
   ],
   "port": [
    "      const hooks = getK09aHooks();",
    "      if (hooks.onOpenMapForOkolica) {",
    "        hooks.onOpenMapForOkolica(city.id);"
   ]
  },
  {
   "pin": [
    "        activeOnClose();",
    "        hideCityPanel();"
   ],
   "port": [
    "        getK06aState().activeOnClose();",
    "        requireK09aDeps().hideCityPanel();"
   ]
  },
  {
   "pin": [
    "    const nn = window.prompt('Nowa nazwa miasta:', city.name);",
    "    if (nn && nn.trim()) { cfg.onRename?.(city.id, nn.trim()); rerender(); }"
   ],
   "port": [
    "    // K09A-Z6: `City.name` w v2 jest opcjonalne; pin ma pole zawsze (`?? ''` tylko dla typu).",
    "    const nn = window.prompt('Nowa nazwa miasta:', city.name ?? '');",
    "    if (nn && nn.trim()) { getK09aHooks().onRename?.(city.id, nn.trim()); rerender(); }"
   ]
  },
  {
   "pin": [
    "    if (cfg.isAutoManageEnabled?.(city.id)) {"
   ],
   "port": [
    "    if (getK09aHooks().isAutoManageEnabled?.(city.id)) {"
   ]
  },
  {
   "pin": [
    "    manager.addEventListener('click', () => { cfg.onAutoManage?.(city.id); rerender(); });"
   ],
   "port": [
    "    manager.addEventListener('click', () => { getK09aHooks().onAutoManage?.(city.id); rerender(); });"
   ]
  },
  {
   "pin": [
    "  const artview = q('cs-artview'); if (artview) artview.addEventListener('click', () => { cfg.onArtView?.(city.id); });",
    "  rootEl.querySelectorAll('.fsbtn').forEach(b => {"
   ],
   "port": [
    "  const artview = q('cs-artview'); if (artview) artview.addEventListener('click', () => { getK09aHooks().onArtView?.(city.id); });",
    "  root.querySelectorAll('.fsbtn').forEach(b => {"
   ]
  },
  {
   "pin": [
    "      if (Number.isFinite(px) && px > 0) { scalePx = px; rerender(); }"
   ],
   "port": [
    "      if (Number.isFinite(px) && px > 0) { setK07aScalePx(px); rerender(); }"
   ]
  }
 ],
 "k09a-rerender.ts:11040-11056": [],
 "k09a-tabs.ts:11836-11844": [
  {
   "pin": [
    "  renderOkolica(mount, city, map);"
   ],
   "port": [
    "  renderOkolica(mount, city as unknown as CityK07, map);"
   ]
  }
 ],
 "k09a-tabs.ts:11909-11937": [
  {
   "pin": [
    "      renderBuildSplitPanel(mount, city, data, view);"
   ],
   "port": [
    "      renderBuildSplitPanel(mount, city as unknown as CityK07, data, view);"
   ]
  }
 ],
 "k09a-tabs.ts:11939-11991": [
  {
   "pin": [
    "        withW4TabCard(mount, 'cs-spoleczenstwo', city, body => renderSpoleczenstwo(body, city, data));"
   ],
   "port": [
    "        withW4TabCard(mount, 'cs-spoleczenstwo', city, body => renderSpoleczenstwo(body, city as unknown as CityK07, data));"
   ]
  },
  {
   "pin": [
    "        withW4TabCard(mount, 'cs-zdrowie', city, body => renderZdrowie(body, city, map, data));"
   ],
   "port": [
    "        withW4TabCard(mount, 'cs-zdrowie', city, body => renderZdrowie(body, city as unknown as CityK07, map, data));"
   ]
  },
  {
   "pin": [
    "      withW4TabCard(mount, 'cs-kultura', city, body => renderKultura(body, city, view));"
   ],
   "port": [
    "      withW4TabCard(mount, 'cs-kultura', city, body => renderKultura(body, city as unknown as CityK07, view));"
   ]
  },
  {
   "pin": [
    "      withW4TabCard(mount, 'cs-religia', city, body => renderReligia(body, city, view));"
   ],
   "port": [
    "      withW4TabCard(mount, 'cs-religia', city, body => renderReligia(body, city, view, data));"
   ]
  }
 ]
};
export const K09A_UNITS = [
 {
  "name": "switchCity",
  "a": 10456,
  "b": 10468
 },
 {
  "name": "rerender",
  "a": 12096,
  "b": 12182
 },
 {
  "name": "renderCityIconRightRail",
  "a": 11040,
  "b": 11056
 },
 {
  "name": "renderOkolicaPanel",
  "a": 11836,
  "b": 11844
 },
 {
  "name": "renderLeftPanelTab",
  "a": 11909,
  "b": 11937
 },
 {
  "name": "renderRightPanelTab",
  "a": 11939,
  "b": 11991
 },
 {
  "name": "paintCityPanelSections",
  "a": 11997,
  "b": 12094
 },
 {
  "name": "showCityPanel",
  "a": 12189,
  "b": 12202
 },
 {
  "name": "hideCityPanel",
  "a": 12205,
  "b": 12209
 }
];
export const K09A_LOCAL_EXPORTS = [
 "readGameDataK09a",
 "setK09aDeps",
 "requireK09aDeps",
 "setK09aHooks",
 "getK09aHooks",
 "K09aHooks",
 "K09aDeps",
 "CityK09a"
];
