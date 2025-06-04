// 模块：初始化并管理 tooltip 容器（悬浮块）
export function initTooltip() {
  const tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(135, 140, 193, 0.7)")
    .style("color", "#fff")
    .style("padding", "4px 8px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);
  return tooltip;
}