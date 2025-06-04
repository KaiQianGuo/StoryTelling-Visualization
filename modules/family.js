// modules/family.js

// 分数越高表示情感冲击或重要性越强
let familyGroup, impactScale;

export function initFamily(svg, centerX, centerY, innerRadius) {
  familyGroup = svg.append("g").attr("class", "family-group");

  impactScale = d3.scaleSqrt()
    .domain([1, 10]) // 根据你的数据范围
    .range([10, 30]); // 图标的最小和最大尺寸
}

export async function loadFamilyData() {
  return await d3.json("./data/family.json").then(data => {
    return data
      .filter(d => d.category && d.description) // 过滤无效数据
      .map(d => ({
        ...d,
        date: new Date(d.year),
        category: d.category || "其他" // 默认分类
      }));
  });
}

export function drawFamilyEvents(familyEvents, angleScale, centerX, centerY, familyRadius) {
  // 定义滤镜
  const filter = familyGroup.append("defs")
    .append("filter")
    .attr("id", "adjust-green-filter")
    .append("feColorMatrix")
    .attr("type", "matrix")
    .attr("values", "1 0 0 0 0   0 0.6 0 0 0   0 0 1 0 0   0 0 0 1 0"); // 加深颜色

  familyGroup.selectAll("image")
    .data(familyEvents)
    .join("image")
      .attr("xlink:href", d => {
        switch(d.category) {
          case "亲情": return "./images/亲情.svg"; // 树叶
        }
      })
      .attr("x", d => {
        const angle = angleScale(d.date) - Math.PI / 2;
        return centerX + 0.95*familyRadius * Math.cos(angle) - (impactScale(d.impact) / 2); // 调整位置
      })
      .attr("y", d => {
        const angle = angleScale(d.date) - Math.PI / 2;
        return centerY + 0.95*familyRadius * Math.sin(angle) - (impactScale(d.impact) / 2); // 调整位置
      })
      .attr("width", d => impactScale(d.impact)) // 根据 impact 调整宽度
      .attr("height", d => impactScale(d.impact)) // 根据 impact 调整高度
      .attr("opacity", 0.8)
      .attr("filter", d => d.category === "亲情" ? "url(#adjust-green-filter)" : null) // 仅对爱情应用滤镜
      .on("mouseover", showTooltip)
      .on("mouseout", hideTooltip);
}

function showTooltip(event, d) {
  d3.select(this).attr("opacity", 1);

  // 构建分行显示的HTML内容
  let tooltipHtml = `<strong>${d3.timeFormat('%Y-%m-%d')(d.date)}</strong><br>`;
  if (d.category) {
    tooltipHtml += `<b>类型：</b>${d.category}<br>`;
  }
  if (d.description) {
    tooltipHtml += `<div style="margin-top:6px; max-width:200px; white-space:pre-line;">${d.description}</div>`;
  }

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

export function updateFamilyEvents(currentDate) {
  familyGroup.selectAll("image")
    .attr("display", d => d.date <= currentDate ? null : "none");
}