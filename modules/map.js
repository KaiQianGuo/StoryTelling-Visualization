// map.js，地图绘制逻辑
// 设置地理投影 + 绘制地图路径

export function drawMap(svg, geoData, centerX, centerY, innerRadius) {
  const projection = d3.geoMercator()
    .fitExtent(
      [
        [centerX - 0.68*innerRadius, centerY - 0.68*innerRadius],
        [centerX + 0.68*innerRadius, centerY + 0.68*innerRadius]
      ],
      geoData
    );

  const path = d3.geoPath().projection(projection);

  // 记录当前高亮的省份
  let selected = null;

  svg.append("g")
    .selectAll("path")
    .data(geoData.features)
    .join("path")
    .attr("d", path)
    // .attr("fill", "#bfd3e6")  // 默认颜色
    .attr("fill", "#D6CDC0") 
    // .attr("stroke", "#9ebcda")  // 默认边框颜色
    .attr("stroke", "#CEC5B8") 
    .attr("stroke-width", 1.5)  // 默认边框宽度
    .attr("cursor", "pointer")  // 新增：添加鼠标悬停效果
    .on("click", function(event, d) {
      // 取消所有高亮
      d3.select(this.parentNode).selectAll("path")
        // .attr("fill", "#bfd3e6")
        .attr("fill", "#D6CDC0") 
        // .attr("stroke", "#9ebcda")
        .attr("stroke", "#CEC5B8") 
        .attr("stroke-width", 1.5);

      // 如果点击的是同一个省份，则取消高亮
      if (selected === this) {
        selected = null;
        return;
      }

      // 高亮当前省份
      d3.select(this)
        .attr("fill", "#ffcc80") // 高亮色
        .attr("stroke", "#ff9800")
        .attr("stroke-width", 3);

      selected = this;
    });

  // 新增：为每个省份添加省名文本，放在地理中心（投影后）
  const geoPathWithProj = d3.geoPath().projection(projection);
  svg.append("g")
    .attr("class", "province-labels")
    .selectAll("text")
    .data(geoData.features)
    .enter()
    .append("text")
    .attr("x", d => geoPathWithProj.centroid(d)[0])
    .attr("y", d => geoPathWithProj.centroid(d)[1])
    .text(d => d.properties.name_zh || d.properties.name)
    .attr("text-anchor", "middle")  // 新增：设置文本对齐方式
    .attr("alignment-baseline", "middle")  // 新增：设置文本基线对齐方式
    .attr("font-size", "10px") // 新增：设置字体大小
    .attr("fill", "#6baed6")  // 新增：设置文本颜色
    .attr("stroke", "#fff")  // 新增：设置文本边框颜色
    .attr("stroke-width", 0)  // 新增：设置文本边框宽度
    .attr("paint-order", "stroke")  // 新增：设置文本绘制顺序
    .attr("pointer-events", "none");  // 新增：设置文本不可点击

  return projection;
}

export function highlightLocationsByYear(year) {
  d3.selectAll('.location-dots circle')
    .attr('r', d => d.date && d.date.getFullYear && d.date.getFullYear() === year ? 8 : 3)
    .attr('fill', '#3182bd'); // 保持原色
}






