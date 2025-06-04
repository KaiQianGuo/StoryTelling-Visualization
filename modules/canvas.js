// canvas.js
// 设置常量与画布

export function initCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const svg = d3.select("#viz")
                .attr("viewBox", [0, 0, width, height]);

  const centerX = width / 2;
  const centerY = height / 2;
  const innerRadius = Math.min(width, height) * 0.26;
  const outerRadius = Math.min(width, height) * 0.45;

  return { svg, width, height, centerX, centerY, innerRadius, outerRadius };
}