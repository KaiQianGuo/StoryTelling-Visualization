// modules/relationships.js

// //分数越高表示情感冲击或重要性越强
let loveGroup, impactScale;

export function initLove(svg, centerX, centerY, innerRadius) {
  loveGroup = svg.append("g").attr("class", "love-group");

  impactScale = d3.scaleSqrt()
    .domain([1, 20]) // 根据数据范围设置
    .range([10, 30]); // 图标尺寸范围
}

export async function loadLoveData() {
  return await d3.json("./data/love.json").then(data => {
    return data
      .filter(d => d.category && d.description) // 过滤有效数据
      .map(d => ({
        ...d,
        date: new Date(d.year),
        category: d.category || "其他" // 默认分类
      }));
  });
}

export function drawLove(loveEvents, angleScale, centerX, centerY, loveRadius) {
  // 定义滤镜（增强爱情事件视觉效果）
  const filter = loveGroup.append("defs")
    .append("filter")
    .attr("id", "love-filter")
    .append("feColorMatrix")
    .attr("type", "matrix")
    .attr("values", "1.5 0 0 0 0   0 1 0 0 0   0 0 1 0 0   0 0 0 1 0");

  loveGroup.selectAll("image")
    .data(loveEvents)
    .join("image")
      .attr("xlink:href", d => {
        switch(d.category) {
          case "爱情": return "./images/爱情.svg"; // 爱情图标
        }
      })
      .attr("x", d => {
        const angle = angleScale(d.date) - Math.PI / 2;
        return centerX + loveRadius * Math.cos(angle) - (impactScale(d.impact) / 2);
      })
      .attr("y", d => {
        const angle = angleScale(d.date) - Math.PI / 2;
        return centerY + loveRadius * Math.sin(angle) - (impactScale(d.impact) / 2);
      })
      .attr("width", d => impactScale(d.impact))
      .attr("height", d => impactScale(d.impact))
      .attr("opacity", 0.8)
      .attr("filter", d => d.category === "爱情" ? "url(#love-filter)" : null) // 仅爱情事件应用滤镜
      .on("mouseover", showTooltip)
      .on("mouseout", hideTooltip);
}

function showTooltip(event, d) {
  d3.select(this).attr("opacity", 1);

  const tooltipHtml = `
    <strong>${d3.timeFormat('%Y-%m-%d')(d.date)}</strong><br>
    <b>类型：</b>${d.category}<br>
    <div style="margin-top:6px; max-width:200px; white-space:pre-line;">${d.description}</div>
  `;

  d3.select("#tooltip")
    .style("left", `${event.pageX + 10}px`)
    .style("top", `${event.pageY - 20}px`)
    .html(tooltipHtml)
    .style("display", "block");
}

function hideTooltip() {
  d3.select(this).attr("opacity", 0.8);
  d3.select("#tooltip").style("display", "none");
}

export function updateLove(currentDate) {
  if (!loveGroup) return;
  loveGroup.selectAll("image")
    .attr("display", d => {
      if (!d || !d.date) return "none";
      return d.date <= currentDate ? null : "none";
    });
}