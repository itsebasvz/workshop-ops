/**
 * Mide el contraste real de los pares texto/fondo tal y como quedan pintados,
 * no los que creemos haber definido. Resuelve el fondo subiendo por el árbol
 * hasta encontrar uno opaco, que es lo que ve el ojo.
 */
// Se ejecuta contra el servidor de desarrollo:
//   pnpm dev        (en una terminal)
//   pnpm contrast   (en otra)
import { chromium } from "playwright";

const TARGETS = [
  [".hero__title", "Titular del hero"],
  [".hero__lead", "Entradilla del hero"],
  [".hero__eyebrow", "Distintivo del hero"],
  [".hero__meta", "Créditos del hero"],
  [".ticket__kicker", "Antetítulo del billete"],
  [".ticket__value", "Dato del billete"],
  [".ticket__note", "Nota del billete"],
  [".ticket__label", "Etiqueta del billete"],
  [".countdown__n", "Cifra de cuenta atrás"],
  [".countdown__label", "Etiqueta de cuenta atrás"],
  [".stats__value", "Cifra destacada"],
  [".stats__label", "Etiqueta de cifra"],
  [".stats__note", "Procedencia de cifra"],
  [".section__kicker", "Antetítulo de sección"],
  [".section__lead", "Entradilla de sección"],
  [".panel__summary", "Resumen del track"],
  [".panel__aside-title", "Título del diagrama"],
  [".flow__service", "Servicio en el flujo"],
  [".flow__what", "Descripción en el flujo"],
  [".flow__role", "Rol en el flujo"],
  [".flow__index", "Número del flujo"],
  [".phase__label", "Nombre de bloque"],
  [".phase__min", "Minutos del bloque"],
  [".phase__detail", "Detalle del bloque"],
  [".chip", "Chip de servicio"],
  [".role__n", "Número de rol"],
  [".role__hint", "Descripción de rol"],
  [".deliverables li", "Entregable"],
  [".cta__note", "Nota del cierre"],
  [".btn--primary", "Botón primario"],
  [".btn--ghost", "Botón secundario"],
  ["button[data-open-modal] > span", "Marcador del buscador"],
  [".topbar__search kbd kbd", "Tecla del atajo"],
  [".footer", "Pie"],
  [".sidebar-content a", "Enlace de la barra lateral"],
  [".sl-markdown-content p", "Párrafo de documentación"],
  [".terminal__out", "Salida en terminal"],
  [".terminal__title", "Título de terminal"],
];

const script = (targets) => {
  const lum = ([r, g, b]) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const over = (fg, bg) => fg.slice(0, 3).map((c, i) => c * (fg[3] ?? 1) + bg[i] * (1 - (fg[3] ?? 1)));
  const bgOf = (el) => {
    let node = el;
    let acc = null;
    while (node) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c.length && (c[3] ?? 1) > 0) acc = acc ? over(acc, c) : c;
      if (acc && (acc[3] ?? 1) >= 1) return acc.slice(0, 3);
      node = node.parentElement;
    }
    return (acc || [255, 255, 255]).slice(0, 3);
  };
  return targets.map(([sel, label]) => {
    const el = document.querySelector(sel);
    if (!el) return { label, ratio: null };
    const style = getComputedStyle(el);
    const fg = over(parse(style.color), bgOf(el));
    const bg = bgOf(el);
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    const size = parseFloat(style.fontSize);
    const bold = parseInt(style.fontWeight, 10) >= 700;
    return {
      label,
      ratio: +(((a + 0.05) / (b + 0.05)).toFixed(2)),
      large: size >= 24 || (bold && size >= 18.66),
    };
  });
};

(async () => {
  const browser = await chromium.launch();
  let failures = 0;

  for (const theme of ["dark", "light"]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await ctx.newPage();
    const rows = [];

    for (const url of ["http://localhost:4321/", "http://localhost:4321/empezar/requisitos"]) {
      await page.goto(url, { waitUntil: "networkidle" });
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      await page.waitForTimeout(250);
      for (const r of await page.evaluate(script, TARGETS)) {
        if (r.ratio && !rows.some((x) => x.label === r.label)) rows.push(r);
      }
    }

    console.log(`\n=== tema ${theme} ===`);
    for (const r of rows) {
      const min = r.large ? 3 : 4.5;
      const ok = r.ratio >= min;
      if (!ok) failures++;
      console.log(`  ${ok ? "PASA" : "FALLA"}  ${String(r.ratio).padStart(6)}:1  (mínimo ${min})  ${r.label}`);
    }
    await ctx.close();
  }

  await browser.close();
  console.log(failures ? `\n${failures} par(es) por debajo del mínimo` : "\nTodos los pares cumplen WCAG AA");
  process.exitCode = failures ? 1 : 0;
})();
