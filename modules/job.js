// // modules/job.js

let linePath, circleGroup; // 保存线和圆点，供更新使用

export function initCareerPath(svg, centerX, centerY, innerRadius) {
  
  // 初始化容器
  linePath = svg.append("path")
    .attr("fill", "none")
    .attr("stroke", "#FF69B4") // 直接使用粉色
    .attr("stroke-width", 2)
    .attr("opacity", 0.9)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round");

  circleGroup = svg.append("g");
}

export function updateCareerPath(positions, angleScale, centerX, centerY, innerRadius, currentDate) {
  const rankLineRadius = innerRadius + 0;
  const rankScale = d3.scaleLinear()
    .domain([0, d3.max(positions, d => d.rankIndex)])
    .range([0, 25]);

  // 过滤出当前时间之前的职位
  const visible = positions.filter(d => d.date <= currentDate);

  const radialPoints = visible.map(d => {
    const angle = angleScale(d.date) - Math.PI / 2;
    const radius = rankLineRadius + rankScale(d.rankIndex);
    return [
      centerX + 1.2 * radius * Math.cos(angle),
      centerY + 1.2 * radius * Math.sin(angle)
    ];
  });

  const radialLine = d3.line()
    .curve(d3.curveCardinal)
    .x(d => d[0])
    .y(d => d[1]);

  // 更新路径
  linePath.datum(radialPoints).attr("d", radialLine);

  // 更新点
  const points = circleGroup.selectAll("circle").data(visible, d => d.date);
  points.join(
    enter => enter.append("circle")
      .attr("r", 0)
      .attr("fill", "#FF1493")
      .attr("cx", d => {
        const angle = angleScale(d.date) - Math.PI / 2;
        const radius = rankLineRadius + rankScale(d.rankIndex);
        return centerX + 1.2 * radius * Math.cos(angle);
      })
      .attr("cy", d => {
        const angle = angleScale(d.date) - Math.PI / 2;
        const radius = rankLineRadius + rankScale(d.rankIndex);
        return centerY + 1.2 * radius * Math.sin(angle);
      })
      .on("mouseover", (event, d) => {
        d3.select("#tooltip")
          .style("left", (event.pageX + 5) + "px")
          .style("top", (event.pageY + 5) + "px")
          .html(`
            <strong>${d3.timeFormat("%Y-%m-%d")(d.date)}</strong><br>
            官职指数: ${d.rankIndex}<br>
            ${d.description ? `<em>${d.description}</em>` : ''}
          `)
          .style("opacity", 1);
      }),
    update => update,
    exit => exit.remove()
  );
}

export function highlightJobsByYear(year) {
  circleGroup.selectAll('circle')
    .attr('r', d => d.date.getFullYear() === year ? 8 : 2)
    .attr('fill', '#FF1493'); // 保持原色
}

