export function drawring(svg, centerX, centerY, innerRadius) {
  const totalDays = 27211;
  const segmentDefs = [
    { days: 2864,  color: "#A4D8E1", label: "乱世童年" },
    { days: 7350,  color: "#B2E0E6", label: "少而勤学" },
    { days: 5600,  color: "#A0D3E8", label: "锐意仕进" },
    { days: 4231,  color: "#8CC4D9", label: "贬谪沉浮" },
    { days: 5479,  color: "#7FB2D9", label: "东都闲职" },
    { days: 1687,  color: "#A3C1D4", label: "暮年遗响" }
  ].map(def => ({
    ...def,
    angle: (def.days / totalDays) * 2 * Math.PI
  }));

  const segments = [];
  let currentAngle = 0;

  segmentDefs.forEach(def => {
    const segment = {
      startAngle: currentAngle,
      endAngle: currentAngle + def.angle,
      color: def.color,
      label: def.label
    };
    segments.push(segment);
    currentAngle = segment.endAngle;
  });

  const defaultInnerRadius = innerRadius + 10;
  const defaultOuterRadius = innerRadius + 30;
  const hoverExpand = 5;
  const rotationAngle = 0; // 整体旋转角度

  segments.forEach((segment, index) => {
    const arc = d3.arc()
      .innerRadius(defaultInnerRadius)
      .outerRadius(defaultOuterRadius)
      .startAngle(segment.startAngle)
      .endAngle(segment.endAngle);

    const path = svg.append("path")
      .attr("transform", `translate(${centerX},${centerY}) rotate(${rotationAngle})`)
      .attr("d", arc())
      .attr("fill", segment.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("class", `ring-segment segment-${index}`)
      .attr("data-index", index);

      path.on("mouseover", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", d3.arc()
            .innerRadius(defaultInnerRadius - hoverExpand)
            .outerRadius(defaultOuterRadius + hoverExpand)
            .startAngle(segment.startAngle)
            .endAngle(segment.endAngle));
        // 修改对应的文本样式：加粗并增大字体
        d3.select(`.segment-label-${index}`)
          .transition()
          .duration(200)
          .attr("font-weight", "bold")
          .attr("font-size", "16px"); // 放大字体大小
      }).on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc());
        // 鼠标移开时恢复原来的文本样式
        d3.select(`.segment-label-${index}`)
          .transition()
          .duration(200)
          .attr("font-weight", "normal")
          .attr("font-size", "12px"); // 恢复原始字体大小
      });

    // 计算文字位置和旋转角度
    const arcForText = d3.arc()
      .innerRadius((defaultInnerRadius + defaultOuterRadius) / 2)
      .outerRadius((defaultInnerRadius + defaultOuterRadius) / 2)
      .startAngle(segment.startAngle)
      .endAngle(segment.endAngle);

    const [x, y] = arcForText.centroid();

    // 计算从原点指向该点的角度（相对于 translate 后的坐标系）
    const angleToCenter = Math.atan2(y, x); // 弧度值
    const degrees = angleToCenter * 180 / Math.PI;

    // 添加文本并设置旋转以朝向圆心
    svg.append("text")
      .attr("x", centerX + x)
      .attr("y", centerY + y)
      .attr("transform", () => {
        return `
          rotate(${rotationAngle}, ${centerX + x}, ${centerY + y})
          rotate(${90+degrees}, ${centerX + x}, ${centerY + y})
        `;
      })
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("class", `segment-label-${index}`)
      .attr("fill", "#333")
      .attr("font-size", "12px")
      .text(segment.label);
  });

  return { segments };
}