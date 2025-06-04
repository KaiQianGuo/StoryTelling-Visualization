// modules/animation.js，控制地图上的运动轨迹

export function animateMover(svg, sorted, projection, centerX, centerY, onStepCallback) {
  const [startX, startY] = projection(sorted[0].coords);

  const mover = svg.append("image")
    .attr("href", "images/baijuyi.svg")
    .attr("width", 24)
    .attr("height", 24)
    .attr("x", startX - 12)
    .attr("y", startY - 12);

  const traceGroup = svg.append("g").attr("class", "trace-group");

  let idx = 0;
  let stopped = false;

  // 暂停/继续按钮
  if (!document.getElementById('toggle-btn')) {
    d3.select("body").append("button")
      .attr("id", "toggle-btn")
      .style("position", "absolute")
      .style("top", "20px")
      .style("right", "20px")
      .style("z-index", 1000)
      .text("⏸ 暂停")
      .on("click", () => {
        stopped = !stopped;
        d3.select("#toggle-btn").text(stopped ? "▶️ 继续" : "⏸ 暂停");
        // 控制音乐播放/暂停
        const bgm = document.getElementById('bgm');
        if (bgm) {
          if (stopped) {
            bgm.pause();
          } else {
            bgm.play();
          }
        }
        // 暂停时停止朗读
        if (stopped && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        // 继续时自动朗读当前 story（从头朗读）并恢复动画
        if (!stopped) {
          if (window.currentStoryText && window.speak) {
            window.speechSynthesis.cancel();
            window.speak(window.currentStoryText, () => {
              stopped = false;
              window.stopped = false;
              window.currentStoryText = null;
              window.currentStoryDate = null;
              if (window._resumePlayStep) window._resumePlayStep();
            });
          } else {
            if (window._resumePlayStep) window._resumePlayStep();
          }
        }
      });
  }

  // 音量调节滑块
  if (!document.getElementById('volume-slider')) {
    const volumeDiv = document.createElement('div');
    volumeDiv.style.position = 'absolute';
    volumeDiv.style.top = '60px';
    volumeDiv.style.right = '30px';
    volumeDiv.style.zIndex = 1000;
    volumeDiv.style.background = 'rgba(255,255,255,0.9)';
    volumeDiv.style.borderRadius = '6px';
    volumeDiv.style.padding = '6px 12px';
    volumeDiv.style.display = 'flex';
    volumeDiv.style.alignItems = 'center';
    volumeDiv.innerHTML = `
      <span style="margin-right:6px;">🔊</span>
      <input id="volume-slider" type="range" min="0" max="1" step="0.01" value="1" style="width:80px;">
    `;
    document.body.appendChild(volumeDiv);
    const slider = document.getElementById('volume-slider');
    slider.addEventListener('input', function() {
      const bgm = document.getElementById('bgm');
      if (bgm) {
        bgm.volume = parseFloat(this.value);
      }
    });
  }

  const stepDelay = 1000;
  const MAX_TRACE = 20; // 只保留最近20步轨迹

  function playStep() {
    if (window.stopped || stopped) return;

    const prev = sorted[idx];
    const nextIdx = (idx + 1) % sorted.length;
    const curr = sorted[nextIdx];

    const [x1, y1] = projection(prev.coords);
    const [x2, y2] = projection(curr.coords);

    // 历史轨迹全部淡化
    traceGroup.selectAll("line")
      .attr("stroke", "steelblue")
      .attr("opacity", 0.3)
      .attr("stroke-width", 1);

    // 添加当前高亮轨迹
    const newLine = traceGroup.append("line")
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y2)
      .attr("stroke", "#ff9800")
      .attr("stroke-dasharray", "3,3")
      .attr("stroke-width", 2)
      .attr("opacity", 1)
      .on("mouseover", function() {
        d3.select(this)
          .attr("stroke", "#d7263d")
          .attr("stroke-width", 3)
          .attr("opacity", 1);
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("stroke", "#ff9800")
          .attr("stroke-width", 2)
          .attr("opacity", 1);
      });

    // 只保留最近MAX_TRACE条线
    const lines = traceGroup.selectAll("line");
    if (lines.size() > MAX_TRACE) {
      lines.nodes()[0].remove();
    }

    mover.transition()
      .duration(stepDelay * 0.8)
      .attr("x", x2 - 12)
      .attr("y", y2 - 12)
      .on("start", () => {
        d3.select("#year-cell").text(d3.timeFormat("%Y")(curr.date));
        d3.select("#location-cell").text(curr.location);
        d3.select("#job-cell").text(curr.job || '');
      })
      .on("end", () => {
        if (onStepCallback) {
          onStepCallback(curr.date, () => {
            idx = nextIdx;
            setTimeout(playStep, 200); // 200ms间隔
          });
        } else {
          idx = nextIdx;
          setTimeout(playStep, 200);
        }
      });
  }

  // 启动动画
  playStep();

  // 跳转到指定年份
  function jumpToYear(year) {
    const newIdx = sorted.findIndex(d => d.date.getFullYear() >= year);
    idx = newIdx !== -1 ? newIdx : 0;
    // 立即刷新到该状态
    const curr = sorted[idx];
    const [x, y] = projection(curr.coords);
    mover.attr("x", x - 12).attr("y", y - 12);
    // 清除轨迹
    traceGroup.selectAll("line").remove();
    // 更新右侧表格
    d3.select("#year-cell").text(d3.timeFormat("%Y")(curr.date));
    d3.select("#location-cell").text(curr.location);
    d3.select("#job-cell").text(curr.job || '');
    if (onStepCallback) {
      onStepCallback(curr.date, () => {});
    }
  }
  window.jumpToYear = jumpToYear;
  window._resumePlayStep = playStep;
}
