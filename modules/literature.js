// modules/literature.js

// 1. 加载
export async function loadLiteratureData() {
  return await d3.json('data/文学数据.json');
}

/**
 * @param svg
 * @param literature
 * @param angleScale 时间轴用的比例尺
 * @param centerX
 * @param centerY
 * @param innerRadius
 */


export function drawLiteratureByYear(svg, literature, angleScale, centerX, centerY, innerRadius) {
  // 2. 聚合到年份


  const yearAgg = d3.rollups(
  literature.filter(d => d.date),
  v => ({
    amount: d3.sum(v, d => d.amount || 0),
    rank: d3.mean(v, d => d.rank || 0),
    count: v.length,
    year: +d3.timeFormat('%Y')(new Date(v[0].date)),
    // desc 统一输出为数组
    desc: v.flatMap(d =>
      Array.isArray(d.desc) ? d.desc : d.desc ? [d.desc] : []
    ),
    // mp3 统一输出为数组
    mp3: v.flatMap(d =>
      Array.isArray(d.mp3) ? d.mp3 : d.mp3 ? [d.mp3] : []
    ),
    items: v
  }),
  d => +d3.timeFormat('%Y')(new Date(d.date))
);

let yearData = yearAgg.map(([year, d]) => ({...d, year}));
yearData.sort((a, b) => a.year - b.year);



  // 3. 柱子参数
  const n = yearData.length;
  const barAngle = (2 * Math.PI) / n;

  // amount→长度
  const amountExtent = d3.extent(yearData, d => d.amount);
  const barLengthScale = d3.scaleLinear()
    .domain([0, amountExtent[1]])
    .range([0, 80]);

  // rank→颜色
  const rankExtent = d3.extent(yearData, d => d.rank);
  const colorScale = d3.scaleLinear()
    .domain(rankExtent)
    .range([0.2, 0.8]);

  // Tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'literature-tooltip')
    .style('position', 'absolute')
    .style('padding', '6px 8px').style('background', 'rgba(64,64,64,0.9)')
    .style('color', '#fff').style('border-radius', '4px')
    .style('pointer-events', 'none').style('display', 'none')
    .style('font-size', '13px').style('z-index', 999);

  // 4. 柱子 g
  const barGroup = svg.append('g').attr('class','literature-bars');

  // 5. 画柱子，每根默认opacity=0，准备做逐年揭示
  barGroup.selectAll('path')
    .data(yearData)
    .enter()
    .append('path')
    .attr('class', 'literature-bar')
    .attr('data-year', d => d.year)
    .attr('d', (d, i) => {
      const angle = angleScale(new Date(d.year, 0, 1)) - Math.PI/2;
      const angleL = angle - barAngle / 2 * 0.8; // 柱宽=0.8
      const angleR = angle + barAngle / 2 * 0.8;
      // 外圆
      const x0L = centerX + Math.cos(angleL) * innerRadius;
      const y0L = centerY + Math.sin(angleL) * innerRadius;
      const x0R = centerX + Math.cos(angleR) * innerRadius;
      const y0R = centerY + Math.sin(angleR) * innerRadius;
      // 长度/内圆
      const L = barLengthScale(d.amount);
      const x1L = centerX + Math.cos(angleL) * (innerRadius - L);
      const y1L = centerY + Math.sin(angleL) * (innerRadius - L);
      const x1R = centerX + Math.cos(angleR) * (innerRadius - L);
      const y1R = centerY + Math.sin(angleR) * (innerRadius - L);
      return `M${x0L},${y0L} L${x0R},${y0R} L${x1R},${y1R} L${x1L},${y1L} Z`;
    })
    .attr('fill', d => d3.interpolateGreens(colorScale(d.rank)))
    .attr('opacity', 0) // 初始全部不可见
    .style('cursor','pointer')
    .on('mousemove', function(event, d) {
      tooltip.style('display', 'block')
        .html(`<b>${d.year}</b><br>总量: ${d.amount}<br>平均rank: ${d.rank && d.rank.toFixed ? d.rank.toFixed(2) : d.rank}<br>条数: ${d.count}`)
        .style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY - 20) + 'px');
      d3.select(this).attr('stroke', '#333').attr('stroke-width', 2);
    })
    .on('mouseleave', function() {
      tooltip.style('display', 'none');
      d3.select(this).attr('stroke', 'none');
    })
 
    .on('click', function(event, d) {
  // 无内容则不弹出
  if ((!d.desc || d.desc.length === 0) && (!d.mp3 || d.mp3.length === 0)) return;

  let popup = d3.select("#literature-popup");
  
  let content = `<b>${d.year}年</b>`;
  if (d.desc && d.desc.length) {
    // 多条说明，每条 <p>
    d.desc.forEach(txt => { content += `<p>${txt}</p>`; });
  }
  if (d.mp3 && d.mp3.length) {
    d.mp3.forEach(src => {
      content += `<audio src="${src}" controls style="width:100%;margin-bottom:6px;"></audio>`;
    });
  }

  d3.select("#literature-popup-content").html(content);
  popup.style('display', 'block');
});

  return { barLengthScale };
}

/**
 * 自动播放时逐年揭示
 * @param {number} year  当前年份，<=year的柱子全部显现，其它隐藏
 */
export function revealLiteratureBarsTill(year) {
  d3.selectAll('.literature-bars path')
    .transition()
    .duration(400)
    .attr('opacity', d => d.year <= year ? 1 : 0);
}

export function highlightLiteratureByYear(year, angleScale, centerX, centerY, innerRadius, barLengthScale) {
  d3.selectAll('.literature-bar')
    .attr('transform', d => {
      if (d.year === year) {
        const angle = angleScale(new Date(d.year, 0, 1)) - Math.PI/2;
        const L = barLengthScale(d.amount);
        const r = innerRadius - L / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        return `translate(${x},${y}) scale(1.5) translate(${-x},${-y})`;
      }
      return null;
    })
    .attr('stroke', d => d.year === year ? '#333' : 'none')
    .attr('stroke-width', d => d.year === year ? 2 : 0);
}
