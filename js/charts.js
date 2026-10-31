const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

export function renderLineChart(container, values, labels, options = {}) {
  container.replaceChildren();
  const valid = values.map((value, index) => ({ value, index })).filter((item) => Number.isFinite(item.value));
  if (!valid.length) {
    const message = document.createElement("p");
    message.className = "empty-note";
    message.textContent = "Chart data is not available right now.";
    container.append(message);
    return;
  }

  const width = 620;
  const height = 170;
  const left = 35;
  const right = 10;
  const top = 14;
  const bottom = 25;
  const graphWidth = width - left - right;
  const graphHeight = height - top - bottom;
  let minimum = Math.min(...valid.map((item) => item.value));
  let maximum = Math.max(...valid.map((item) => item.value));
  if (minimum === maximum) {
    minimum -= 1;
    maximum += 1;
  }
  const padding = (maximum - minimum) * 0.12;
  minimum -= padding;
  maximum += padding;
  const x = (index) => left + (values.length < 2 ? 0 : (index / (values.length - 1)) * graphWidth);
  const y = (value) => top + (1 - (value - minimum) / (maximum - minimum)) * graphHeight;
  const svg = svgElement("svg", {
    viewBox: `0 0 ${width} ${height}`,
    role: "img",
    "aria-label": options.ariaLabel || "Weather forecast chart"
  });
  const title = svgElement("title");
  title.textContent = options.ariaLabel || "Weather forecast chart";
  svg.append(title);
  const description = svgElement("desc");
  description.textContent = valid.length
    ? `Values range from ${options.formatValue(minimum + padding)} to ${options.formatValue(maximum - padding)}.`
    : "Chart values are unavailable.";
  svg.append(description);

  for (let i = 0; i < 3; i += 1) {
    const lineY = top + (graphHeight / 2) * i;
    svg.append(svgElement("line", { x1: left, y1: lineY, x2: width - right, y2: lineY, class: "chart-grid-line" }));
  }

  const points = valid.map((item) => `${x(item.index)},${y(item.value)}`).join(" ");
  const first = valid[0];
  const last = valid[valid.length - 1];
  const area = svgElement("path", {
    d: `M ${x(first.index)} ${height - bottom} L ${points.replaceAll(" ", " L ")} L ${x(last.index)} ${height - bottom} Z`,
    class: "chart-area"
  });
  const gradient = svgElement("linearGradient", { id: `chart-fill-${options.id}`, x1: "0", x2: "0", y1: "0", y2: "1" });
  gradient.append(svgElement("stop", { offset: "0%", "stop-color": "var(--accent)", "stop-opacity": ".23" }));
  gradient.append(svgElement("stop", { offset: "100%", "stop-color": "var(--accent)", "stop-opacity": "0" }));
  const defs = svgElement("defs");
  defs.append(gradient);
  svg.insertBefore(defs, svg.children[1] || null);
  area.setAttribute("fill", `url(#chart-fill-${options.id})`);
  svg.append(area);
  svg.append(svgElement("polyline", { points, class: "chart-line" }));

  for (const item of valid.filter((point, index) =>
    index === 0 || index === valid.length - 1 || point.index % 6 === 0
  )) {
    svg.append(svgElement("circle", { cx: x(item.index), cy: y(item.value), r: 3.2, class: "chart-point" }));
  }

  const labelIndexes = new Set([0, Math.round((values.length - 1) / 3), Math.round((values.length - 1) * 2 / 3), values.length - 1]);
  for (const index of labelIndexes) {
    if (!labels[index]) continue;
    const label = svgElement("text", { x: x(index), y: height - 5, "text-anchor": index === 0 ? "start" : index === values.length - 1 ? "end" : "middle", class: "chart-label" });
    label.textContent = labels[index];
    svg.append(label);
  }

  const high = Math.max(...valid.map((item) => item.value));
  const low = Math.min(...valid.map((item) => item.value));
  const summary = document.createElement("p");
  summary.className = "chart-data-summary";
  summary.textContent = `Range: ${options.formatValue(low)} to ${options.formatValue(high)}.`;
  container.append(svg, summary);
}
