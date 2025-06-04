// timeline.js
// 模块：负责径向时间刻度、外圈背景、年份与年龄标签的绘制


export function drawTimeAxis(svg, timeExtent, centerX, centerY, innerRadius, outerRadius) {
  // 角度比例尺
  const angleScale = d3.scaleTime()
    .domain(timeExtent)
    .range([0, 2 * Math.PI]);

  // 年度刻度线（可改为 every(n) 以调整间隔）
  const ticks = d3.timeYear.range(timeExtent[0], timeExtent[1]);
  svg.append("g")
    .selectAll("line")
    .data(ticks)
    .join("line")
      .attr("x1", d => centerX + 1.2*innerRadius * Math.cos(angleScale(d) - Math.PI/2))
      .attr("y1", d => centerY + 1.2*innerRadius * Math.sin(angleScale(d) - Math.PI/2))
      .attr("x2", d => centerX + outerRadius * Math.cos(angleScale(d) - Math.PI/2))
      .attr("y2", d => centerY + outerRadius * Math.sin(angleScale(d) - Math.PI/2))
      .attr("stroke", "#9ebcda")
      .attr("cursor", "pointer")
      .on("click", function(event, d) {
        if (window.highlightByYear) window.highlightByYear(d.getFullYear());
      });

  // 外圈浅灰色圆环
  const ring = d3.arc()
    .innerRadius(outerRadius + 10)
    .outerRadius(outerRadius + 30)
    .startAngle(0)
    .endAngle(2 * Math.PI);
  svg.append("path")
    .attr("transform", `translate(${centerX},${centerY})`)
    .attr("d", ring())
    // .attr("fill", "#8c96c6");
    .attr("fill", "#C2E1F0");
  // 年份与年龄标签
  const yearTicks = ticks;
  svg.append("g")
    .attr("transform", `translate(${centerX},${centerY})`)
    .selectAll("text.age-label")
    .data(yearTicks)
    .join("text")
      .attr("class", "age-label")
      .each(function(d) {
        const angle = angleScale(d);
        const arcForText = d3.arc()
          .innerRadius(outerRadius + 23)
          .outerRadius(outerRadius + 23)
          .startAngle(angle - 0.0001)
          .endAngle(angle + 0.0001);
        const [x, y] = arcForText.centroid();
        const angleToCenter = Math.atan2(y, x);
        const degrees = angleToCenter * 180 / Math.PI;
        d3.select(this)
          .attr("x", x)
          .attr("y", y)
          .attr("transform", `rotate(0, ${x}, ${y}) rotate(${90+degrees}, ${x}, ${y})`)
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "middle")
          .attr("font-size", "8px")
          .attr("fill", "#333")
          .text((d.getFullYear() - timeExtent[0].getFullYear()) + '岁');
      });

  svg.append("g")
    .attr("transform", `translate(${centerX},${centerY})`)
    .selectAll("text.year-label")
    .data(yearTicks)
    .join("text")
      .attr("class", "year-label")
      .each(function(d) {
        const angle = angleScale(d);
        const arcForText = d3.arc()
          .innerRadius(outerRadius + 15)
          .outerRadius(outerRadius + 15)
          .startAngle(angle - 0.0001)
          .endAngle(angle + 0.0001);
        const [x, y] = arcForText.centroid();
        const angleToCenter = Math.atan2(y, x);
        const degrees = angleToCenter * 180 / Math.PI;
        d3.select(this)
          .attr("x", x)
          .attr("y", y)
          .attr("transform", `rotate(0, ${x}, ${y}) rotate(${90+degrees}, ${x}, ${y})`)
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "middle")
          .attr("font-size", "8px")
          .attr("fill", "#333")
          .text(d.getFullYear());
      })
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        if (window.highlightByYear) window.highlightByYear(d.getFullYear());
      });

  return { angleScale, timeExtent };
}
