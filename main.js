import { initCanvas } from './modules/canvas.js';
import { loadData } from './modules/data.js';
import { drawMap } from './modules/map.js';
import { drawTimeAxis } from './modules/timeline.js';
import { drawEvents } from './modules/events.js';
import { animateMover } from './modules/animation.js';
import { initTooltip } from './modules/tooltip.js';
import { initCareerPath, updateCareerPath, highlightJobsByYear } from './modules/job.js'; 
import { drawring } from './modules/ring.js';
import { loadLiteratureData, drawLiteratureByYear, revealLiteratureBarsTill, highlightLiteratureByYear } from './modules/literature.js';
import { highlightLocationsByYear } from './modules/map.js';
import { initFamily, loadFamilyData, drawFamilyEvents, updateFamilyEvents } from './modules/family.js';
import { initFriends, loadFriendsData, drawFriends, updateFriends } from './modules/friends.js';
import { initLove, loadLoveData, drawLove, updateLove } from './modules/love.js';


window.isPaused = false;

let storyData = [];
let lastSpokenDate = null;
let currentStoryText = null;
let currentStoryDate = null;
window.currentStoryText = null;
window.currentStoryDate = null;

function speak(text, onend) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    utter.rate = 2; 
    utter.pitch = 1;
    utter.volume = 1;
    if (onend) utter.onend = onend;

     // 获取 voice 并设置
     const voices = window.speechSynthesis.getVoices();
     
     // 你可以根据名字、lang、gender等筛选
     const zhVoice = voices.find(v => v.lang.startsWith('zh'));
     if (zhVoice) utter.voice = zhVoice;
 
    window.speechSynthesis.speak(utter);
  } else if (onend) {
    onend();
  }
}

function showStory(text) {
  let box = document.getElementById('story-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'story-box';
    box.style.position = 'absolute';
    box.style.top = '20px';
    box.style.left = '20px';
    box.style.background = '#fff';
    box.style.padding = '10px';
    box.style.borderRadius = '8px';
    box.style.display = 'block';
    box.style.zIndex = 1000;
    box.style.maxWidth = '350px';
    box.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    document.body.appendChild(box);
  }
  box.textContent = text;
  box.style.display = 'block';
}

function trySpeakStory(currentDate, storyData, next) {
  const currDateStr = d3.timeFormat('%Y-%m-%d')(currentDate);
  if (lastSpokenDate === currDateStr) { if (next) next(); return; }
  const story = storyData.find(d => d.date === currDateStr);
  if (story) {
    // showStory(story.text);
    window.isPaused = true;
    currentStoryText = story.text;
    currentStoryDate = currDateStr;
    window.currentStoryText = story.text;
    window.currentStoryDate = currDateStr;
    speak(story.text, () => {
      window.isPaused = false;
      currentStoryText = null;
      currentStoryDate = null;
      window.currentStoryText = null;
      window.currentStoryDate = null;
      if (next) next();
    });
    lastSpokenDate = currDateStr;
  } else {
    if (next) next();
  }
}

(async function () {
  const { svg, width, height, centerX, centerY, innerRadius, outerRadius } = initCanvas();

  const { events, geoData, sorted, positions } = await loadData();

  // 合并职位信息到sorted
  const dateToJob = {};
  positions.forEach(d => {
    dateToJob[+d.date] = d.job || d["仕途以及相关的事件描述（纬度1）"] || '';
  });
  sorted.forEach(d => {
    d.job = dateToJob[+d.date] || '';
  });

  // const timeExtent = d3.extent(events.concat(positions), d => d.date);
  const minYear = d3.min(sorted, d => d.date.getFullYear());
  const maxYear = d3.max(sorted, d => d.date.getFullYear());
  const timeExtent = [new Date(minYear, 0, 1), new Date(maxYear + 1, 0, 1)];
  // 1. 新建一个g.map-group分组，所有地图和点都加到这个分组下
  const mapGroup = svg.append("g").attr("class", "map-group");

  // 修改drawMap调用，把svg改为mapGroup
  const projection = drawMap(mapGroup, geoData, centerX, centerY, innerRadius);
  const { angleScale } = drawTimeAxis(svg, timeExtent, centerX, centerY, innerRadius, outerRadius);

  const literature = await loadLiteratureData();
  const { barLengthScale } = drawLiteratureByYear(svg, literature, angleScale, centerX, centerY, innerRadius); // 获取 barLengthScale

  drawring(svg, centerX, centerY, innerRadius);// 新增：绘制内圈环

  initCareerPath(svg, centerX, centerY, innerRadius); // ✅ 初始化职位路径

  let selectedIndex = null; // 记录当前高亮点索引
  const locationDots = mapGroup.append("g")
    .attr("class", "location-dots")
    .selectAll("circle")
    .data(sorted)
    .enter()
    .append("circle")
    .attr("cx", d => projection([+d.coords[0], +d.coords[1]])[0])
    .attr("cy", d => projection([+d.coords[0], +d.coords[1]])[1])
    .attr("r", 3) // 设置点的大小
    .attr("fill", "#3182bd") // 设置点的颜色
    .attr("stroke", "#fff") // 设置点的边框颜色
    .attr("stroke-width", 0) // 设置点的边框宽度
    .attr("opacity", 0.7) // 设置点的透明度
    .on("mouseover", function(event, d) {
      d3.select("#tooltip")
        .style("display", "block")
        .html(`<b>${d.location}</b><br>${d3.timeFormat('%Y-%m-%d')(d.date)}<br>${d.title || ''}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
      d3.select(this).attr("fill", "#3182bd");
    })
    .on("mousemove", function(event) {
      d3.select("#tooltip")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", function() {
      d3.select("#tooltip").style("display", "none");
      d3.select(this).attr("fill", "#3182bd");
    })
    .on("click", function(event, d, i) {
      // 判断是否重复点击同一个点
      if (selectedIndex === i) {
        // 恢复原状
        mapGroup.selectAll("path").attr("transform", null).attr("fill", "#bfd3e6").attr("stroke", "#9ebcda").attr("stroke-width", 1.5);
        mapGroup.selectAll(".province-labels text").attr("transform", null).attr("font-size", "10px").style("display", null);
        mapGroup.selectAll(".location-dots circle").attr("transform", null).attr("r", 3).style("display", null);
        selectedIndex = null;
        return;
      }
      selectedIndex = i;
      // 1. 用d3.geoContains判断该点属于哪个省份
      let matchedFeature = null;
      geoData.features.forEach(f => {
        if (d3.geoContains(f, [+d.coords[0], +d.coords[1]])) {
          matchedFeature = f;
        }
      });
      if (!matchedFeature) return;
      // 2. 找到省份path和label
      let matchedPath = null;
      mapGroup.selectAll("path").each(function(p) {
        if (p === matchedFeature) matchedPath = this;
      });
      let matchedLabel = null;
      mapGroup.selectAll(".province-labels text").each(function(p) {
        if (p === matchedFeature) matchedLabel = this;
      });
      // 3. 省份中心（像素坐标）
      const geoPathWithProj = d3.geoPath().projection(projection);
      const [cx, cy] = geoPathWithProj.centroid(matchedFeature);
      // 4. 全部恢复原状
      mapGroup.selectAll("path").attr("transform", null).attr("fill", "#bfd3e6").attr("stroke", "#9ebcda").attr("stroke-width", 1.5);
      mapGroup.selectAll(".province-labels text").attr("transform", null).attr("font-size", "10px");
      mapGroup.selectAll(".location-dots circle").attr("transform", null).attr("r", 3);
      // 5. 统一以省份中心为锚点放大（不放大点）
      if (matchedPath) d3.select(matchedPath)
        .raise()
        .attr("transform", `translate(${cx},${cy}) scale(2) translate(${-cx},${-cy})`)
        .attr("fill", "#ffcc80").attr("stroke", "#ff9800").attr("stroke-width", 3);
      // 只显示该省份的location点，其它点隐藏
      mapGroup.selectAll(".location-dots circle")
        .style("display", p => d3.geoContains(matchedFeature, [+p.coords[0], +p.coords[1]]) ? null : "none");
      // 只显示该省份的label，其它label隐藏
      mapGroup.selectAll(".province-labels text")
        .style("display", p => p === matchedFeature ? null : "none");
      if (selectedIndex === null) {
        // 恢复所有点显示
        mapGroup.selectAll(".location-dots circle").style("display", null);
      }
    });

  storyData = await d3.json('data/story.json');

  animateMover(mapGroup, sorted, projection, centerX, centerY, (currentDate, next) => {
    updateCareerPath(positions, angleScale, centerX, centerY, innerRadius, currentDate); // ✅ 每帧更新
    const currYear = +d3.timeFormat("%Y")(currentDate);
    revealLiteratureBarsTill(currYear);
    // 先更新人际关系
    updateFamilyEvents(currentDate);    // 人际关系
    updateFriends(currentDate);         // 友情关系 
    updateLove(currentDate);            // 爱情关系 
    // 再讲故事
    trySpeakStory(currentDate, storyData, next); // 自动讲解故事，朗读完毕后 next()
  });

// 初始化家庭关系模块
initFamily(svg, centerX, centerY, innerRadius);
const familyEvents = await loadFamilyData();

// 计算 job 圈最大半径
const rankLineRadius = innerRadius + 35;
const familyRadius = rankLineRadius + 60; // 可微调

// 使用新的 family 模块函数绘制家庭事件
drawFamilyEvents(familyEvents, angleScale, centerX, centerY, familyRadius);

// 初始化友情关系模块
initFriends(svg, centerX, centerY, innerRadius);
const friendsEvents = await loadFriendsData();

// 计算 job 圈最大半径
const FriendsLineRadius = innerRadius + 50;
const friendsRadius = FriendsLineRadius + 60; // 可微调

// 使用新的 friends 模块函数绘制友情事件
drawFriends(friendsEvents, angleScale, centerX, centerY, friendsRadius);

// 初始化爱情关系模块
initLove(svg, centerX, centerY, innerRadius);
const loveEvents = await loadLoveData();

// 计算爱情圈半径（命名统一为loveLineRadius）
const loveLineRadius = innerRadius + 40;
const loveRadius = loveLineRadius + 60; // 可微调

// 绘制爱情事件
drawLove(loveEvents, angleScale, centerX, centerY, loveRadius);
  initTooltip();
})();

function tryPlayBGM() {
  const bgm = document.getElementById('bgm');
  if (bgm) {
    const playPromise = bgm.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // 用户未与页面交互时，部分浏览器会阻止自动播放
        // 可在用户首次点击页面时再尝试播放
        const resume = () => {
          bgm.play();
          document.removeEventListener('click', resume);
        };
        document.addEventListener('click', resume);
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', tryPlayBGM);

window.highlightByYear = function(year) {
  if (window.jumpToYear) window.jumpToYear(year);
  window.isPaused = false;
  highlightJobsByYear(year);
  highlightLiteratureByYear(year, angleScale, centerX, centerY, innerRadius, barLengthScale);
  highlightRelationshipsByYear(year);
  highlightLocationsByYear(year);
};

d3.select('svg').on('click', function(event) {
  const target = event.target;
  if (
    target.tagName === 'line' ||
    target.classList.contains('literature-bar') ||
    target.classList.contains('career-point') ||
    target.classList.contains('location-dots')
  ) {
    return;
  }
  if (!isAutoPlaying) {
    isAutoPlaying = true;
    // 恢复所有元素样式
    d3.selectAll('.literature-bars path')
      .attr('fill', d => d3.interpolateGreens(0.6))
      .attr('opacity', 1)
      .attr('stroke', 'none')
      .attr('stroke-width', 0);
    d3.selectAll('.career-point').attr('fill', '#a259ff').attr('r', 2);
    d3.selectAll('.location-dots circle').attr('fill', '#3182bd').attr('r', 3);
    d3.selectAll('path').filter(function() { return d3.select(this).attr('fill') === '#8c96c6'; }).attr('stroke', null).attr('stroke-width', null);
    startAutoPlay();
  }
});

window.speak = speak;

d3.select("#literature-popup-close").on("click", () => {
  d3.select("#literature-popup").style("display", "none");
});






