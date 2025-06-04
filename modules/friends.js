// modules/friends.js

// 分数越高表示情感冲击或重要性越强
let friendsGroup, impactScale;

export function initFriends(svg, centerX, centerY, innerRadius) {
  friendsGroup = svg.append("g").attr("class", "friends-group");

  impactScale = d3.scaleSqrt()
    .domain([1, 10]) // 根据你的数据范围
    .range([10, 30]); // 图标的最小和最大尺寸
}

export async function loadFriendsData() {
  return await d3.json("./data/friends.json").then(data => {
    return data
      .filter(d => d.category && d.description) // 过滤无效数据
      .map(d => ({
        ...d,
        date: new Date(d.year),
        category: d.category || "其他" // 默认分类
      }));
  });
}

export function drawFriends(friends, angleScale, centerX, centerY, friendsRadius) {
  // 定义滤镜
  const filter = friendsGroup.append("defs")
    .append("filter")
    .attr("id", "adjust-filter")
    .append("feColorMatrix")
    .attr("type", "matrix")
    .attr("values", "1 0 0 0 0   0 01 0 0 0   0 0 1 0 0   0 0 0 1 0"); // 加深颜色

  friendsGroup.selectAll("image")
    .data(friends)
    .join("image")
      .attr("xlink:href", d => {
        switch(d.category) {
          case "友情": return "./images/友情.svg"; // 杯子
          default: return "./images/其他.png"; // 默认图形
        }
      })
      .attr("x", d => {
        const angle = angleScale(d.date) - Math.PI / 2;
        return centerX + 1.05*friendsRadius * Math.cos(angle) - (impactScale(d.impact) / 2); // 调整位置
      })
      .attr("y", d => {
        const angle = angleScale(d.date) - Math.PI / 2;
        return centerY + 1.05*friendsRadius * Math.sin(angle) - (impactScale(d.impact) / 2); // 调整位置
      })
      .attr("width", d => impactScale(d.impact)) // 根据 impact 调整宽度
      .attr("height", d => impactScale(d.impact)) // 根据 impact 调整高度
      .attr("opacity", 0.8)
      .attr("filter", d => d.category === "爱情" ? "url(#adjust-filter)" : null) // 仅对爱情应用滤镜
      .on("mouseover", showTooltip)
      .on("mouseout", hideTooltip)
      .on("click", function(event, d) {
        event.stopPropagation(); // 防止冒泡
        showFriendDetail(event, d);
      });

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

export function updateFriends(currentDate) {
  friendsGroup.selectAll("image")
    .attr("display", d => d.date <= currentDate ? null : "none");
}

function showFriendDetail(event, d) {
  // 构建要显示的详细内容HTML
  let html = "";

  // 显示图片（若有）
  if (d.image) {
    html += `<img src="${d.image}" style="width:100%;border-radius:8px;margin-bottom:10px;">`;
  }
  
  // 标题/姓名（若有）和年份
  html += `<div style="font-weight: bold; font-size: 17px; margin-bottom: 6px;">${d.friendName ? d.friendName : ""} (${d3.timeFormat('%Y')(d.date)})</div>`;
 
  // 描述
  if (d.description) {
    html += `<div style="margin-bottom: 6px;">${d.description}</div>`;
  }
  // 更长文本
  if (d.moreText) {
    html += `<div style="font-size:14px; color:#666;">${d.moreText}</div>`;
  }

  // 插入内容并显示弹窗div
  const box = document.getElementById('friend-detail-box');
  box.innerHTML = html;
  box.style.display = 'block';

  // 定位到鼠标点/点击点附近（可选，或者始终固定某一侧）
  box.style.left = (event.pageX + 20) + 'px'; 
  box.style.top = (event.pageY - 10) + 'px';

  // 点击其它区域隐藏
  if (!box._closeBound) {
    document.body.addEventListener('click', function() {
      box.style.display = 'none';
    });
    box.addEventListener('click', function(ev){ev.stopPropagation()});
    box._closeBound = true;
  }
}
