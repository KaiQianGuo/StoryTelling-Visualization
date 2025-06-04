// events.js，事件圆点绘制
// 绘制事件圆点 

export function drawEvents(svg, events, angleScale, centerX, centerY, innerRadius) {
  const colorByType = d3.scaleOrdinal()
    .domain([...new Set(events.map(d => d.type))])
    .range(d3.schemeCategory10);

  svg.append("g")
    .selectAll("circle")
    .data(events)
    .join("circle")
      .attr("cx", d => centerX + 1.2*(innerRadius + 10) * Math.cos(angleScale(d.date) - Math.PI / 2))
      .attr("cy", d => centerY + 1.2*(innerRadius + 10) * Math.sin(angleScale(d.date) - Math.PI / 2))
      .attr("r", 5)
      .attr("fill", d => colorByType(d.type))
      .on("mouseover", (event, d) => {
        d3.select("#tooltip")
          .style("left",  (event.pageX + 5) + "px")
          .style("top",   (event.pageY + 5) + "px")
          .text(`${d3.timeFormat("%Y-%m-%d")(d.date)} ${d.title}`)
          .style("opacity", 1);
      })
      .on("mouseout", () => {
        d3.select("#tooltip").style("opacity", 0);
      });
}
