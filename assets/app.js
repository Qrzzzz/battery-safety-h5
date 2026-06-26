"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const data = window.BatterySafetyData;

const pages = $$(".page");
const state = { page: 0, maxVisited: 0, completed: [true, true, false, false, false, false, true, true], signals: new Set(), signalScore: 0, scenarioScore: 0, trendScore: 0, actionScore: 0 };
const pageName = $("#pageName");
const pageNumber = $("#pageNumber");
const prevButton = $("#prevButton");
const nextButton = $("#nextButton");
const dots = $("#pageDots");

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function showRuntimeWarning(reason) {
  const warning = $("#runtimeWarning");
  if (!warning || !warning.hidden) return;
  warning.hidden = false;
  if (reason) warning.dataset.reason = reason;
}

function verifyRuntimeResources() {
  if (location.protocol === "file:") {
    showRuntimeWarning("file-protocol");
    return;
  }
  const requiredImages = [
    "assets/images/cover-hero.png",
    "assets/images/signal-device.png",
    "assets/images/scene-warm.png",
    "assets/images/scene-bulge.png",
    "assets/images/scene-hall.png",
    "assets/images/trend-base.png"
  ];
  let settled = false;
  requiredImages.forEach((src) => {
    const image = new Image();
    image.onload = () => {};
    image.onerror = () => {
      if (settled) return;
      settled = true;
      showRuntimeWarning("asset-load-failed");
    };
    image.src = src;
  });
}

function buildDots() {
  pages.forEach((page, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `第 ${index + 1} 页：${page.dataset.title}`);
    button.addEventListener("click", () => index <= state.maxVisited ? goToPage(index) : showToast("请按顺序完成前面的内容"));
    dots.appendChild(button);
  });
}

function updateNavigation() {
  pageName.textContent = pages[state.page].dataset.title;
  pageNumber.textContent = String(state.page + 1);
  prevButton.disabled = state.page === 0;
  nextButton.disabled = state.page === pages.length - 1;
  nextButton.innerHTML = state.page === 6 ? '查看资料依据 <span aria-hidden="true">→</span>' : '下一页 <span aria-hidden="true">→</span>';
  $$("button", dots).forEach((dot, index) => {
    dot.classList.toggle("active", index === state.page);
    dot.setAttribute("aria-current", index === state.page ? "page" : "false");
  });
}

function goToPage(index) {
  if (index < 0 || index >= pages.length || index === state.page) return;
  const oldPage = pages[state.page];
  const newPage = pages[index];
  const forward = index > state.page;
  pages.forEach((page) => page.classList.remove("page--enter-forward", "page--enter-back", "page--leave-forward", "page--leave-back", "page--leaving"));
  oldPage.classList.remove("page--active");
  if (!reduceMotion) oldPage.classList.add("page--leaving", forward ? "page--leave-forward" : "page--leave-back");
  oldPage.setAttribute("aria-hidden", "true");
  oldPage.inert = true;
  state.page = index;
  state.maxVisited = Math.max(state.maxVisited, index);
  newPage.classList.add("page--active");
  if (!reduceMotion) newPage.classList.add(forward ? "page--enter-forward" : "page--enter-back");
  newPage.removeAttribute("aria-hidden");
  newPage.inert = false;
  newPage.scrollTop = 0;
  location.hash = `page-${index}`;
  updateNavigation();
  setTimeout(() => {
    oldPage.classList.remove("page--leaving", "page--leave-forward", "page--leave-back");
    newPage.classList.remove("page--enter-forward", "page--enter-back");
  }, 440);
  const heading = $("h1, h2", newPage);
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
}

function tryNext() {
  if (!state.completed[state.page]) {
    const messages = { 2: "先提交风险信号判断", 3: "先完成风险分诊", 4: "先拖动滑杆看完整个升温过程", 5: "先做出你的处置选择" };
    showToast(messages[state.page] || "请先完成当前页面");
    return;
  }
  goToPage(state.page + 1);
}

function renderSignals() {
  const container = $("#signalChoices");
  container.innerHTML = data.signals.map((item) => `<button type="button" data-signal="${item.key}" data-hazard="${item.hazard}" aria-pressed="false"><i aria-hidden="true">✓</i><span><b>${item.title}</b><small>${item.desc}</small></span><em>${item.tag}</em></button>`).join("");
  $$('[data-signal]').forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(selected));
      selected ? state.signals.add(button.dataset.signal) : state.signals.delete(button.dataset.signal);
      updateSignalPanel(false);
    });
  });
}

function updateSignalPanel(submitted) {
  const hazards = data.signals.filter((item) => item.hazard).map((item) => item.key);
  const hits = hazards.filter((key) => state.signals.has(key)).length;
  const level = hits >= 4 ? "高度危险" : hits >= 2 ? "需要警惕" : "等待判断";
  $("#signalCount").textContent = `已识别风险：${hits} 项`;
  $("#signalLevel").textContent = level;
  $("#signalMark").textContent = hits >= 2 ? "!" : "?";
  $("#phoneScene").classList.toggle("danger", hits >= 2);
  if (submitted) showToast("已记录，可以进入下一页");
  return { hazards, hits };
}

function checkSignals() {
  const { hits } = updateSignalPanel(true);
  const pickedWarm = state.signals.has("warm");
  const feedback = $("#signalFeedback");
  state.completed[2] = true;
  if (hits === 4 && !pickedWarm) {
    state.signalScore = 30;
    feedback.className = "feedback correct";
    feedback.innerHTML = "<b>判断正确。</b> 鼓包、异味或异响、停用后仍持续发烫、喷气冒烟，都不能当成普通发热。";
  } else {
    state.signalScore = Math.max(8, hits * 5 - (pickedWarm ? 2 : 0));
    feedback.className = "feedback partial";
    feedback.innerHTML = `<b>你找到了 ${hits}/4 个关键信号。</b> 轻微温热要结合使用状态判断；鼓包、异味、异响、持续升温和烟气更值得立即警惕。`;
  }
}

function bindScenarios() {
  $$('[data-scenario]').forEach((button) => {
    button.addEventListener("click", () => {
      const result = data.scenarios[button.dataset.scenario];
      state.completed[3] = true;
      state.scenarioScore = result.score;
      $$('[data-scenario]').forEach((item) => { item.classList.remove("selected", "wrong"); $("i", item).textContent = "待判断"; });
      button.classList.add(result.className);
      $("i", button).textContent = result.label;
      const feedback = $("#scenarioFeedback");
      feedback.className = `feedback feedback--wide ${result.className === "selected" ? "correct" : "partial"}`;
      feedback.innerHTML = result.text;
    });
  });
}

const trendSlider = $("#trendSlider");
const trendSliderShell = $("#trendSliderShell");
function updateTrend() {
  const rawValue = Number(trendSlider.value);
  const progress = Math.max(0, Math.min(1, rawValue / Number(trendSlider.max || 300)));
  const stage = Math.min(3, Math.floor(progress * 4));
  const item = data.trend[stage];
  const visual = $("#trendVisual");
  visual.dataset.stage = String(stage);
  visual.style.setProperty("--trend-progress", progress.toFixed(3));
  visual.style.setProperty("--heat-progress", Math.max(0, (progress - .08) / .92).toFixed(3));
  visual.style.setProperty("--smoke-progress", Math.max(0, (progress - .68) / .32).toFixed(3));
  trendSliderShell?.style.setProperty("--slider-progress", `${(progress * 100).toFixed(1)}%`);
  $("#trendCode").textContent = item.code;
  $("#trendName").textContent = item.name;
  $("#batteryMark").textContent = item.mark;
  $("#trendText").innerHTML = `<b>${item.title}</b>${item.text}`;
  trendSlider.setAttribute("aria-valuetext", `${item.code}：${item.title}`);
  if (progress >= .96) { state.completed[4] = true; state.trendScore = 10; }
}

function setTrendFromPointer(event) {
  const rect = trendSliderShell.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  trendSlider.value = String(Math.round(ratio * Number(trendSlider.max || 300)));
  updateTrend();
}

function bindTrendSliderDrag() {
  if (!trendSliderShell) return;
  let activePointer = false;
  const startDrag = (event) => {
    activePointer = true;
    try {
      trendSliderShell.setPointerCapture(event.pointerId);
    } catch {
      // Some mobile browsers do not allow capture on the wrapper when the input is the target.
    }
    setTrendFromPointer(event);
    event.preventDefault();
  };
  const moveDrag = (event) => {
    if (!activePointer) return;
    setTrendFromPointer(event);
    event.preventDefault();
  };
  const endDrag = (event) => {
    if (!activePointer) return;
    activePointer = false;
    if (event.pointerId && trendSliderShell.hasPointerCapture(event.pointerId)) trendSliderShell.releasePointerCapture(event.pointerId);
  };
  trendSliderShell.addEventListener("pointerdown", startDrag, { capture: true });
  window.addEventListener("pointermove", moveDrag, { passive: false });
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
}

function initDotField() {
  const canvas = $("#appDotField");
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  const dots = [];
  const mouse = { x: -9999, y: -9999, px: -9999, py: -9999, speed: 0 };
  const config = {
    dotRadius: 2.4,
    dotSpacing: 13,
    cursorRadius: 320,
    bulgeStrength: 18,
    gradientFrom: "rgba(238,112,91,.34)",
    gradientTo: "rgba(244,151,120,.24)"
  };
  let dpr = 1;
  let width = 0;
  let height = 0;
  let raf = 0;
  let speedTimer = 0;
  let resizeTimer = 0;

  function buildDots() {
    dots.length = 0;
    const step = config.dotRadius + config.dotSpacing;
    const cols = Math.ceil(width / step) + 1;
    const rows = Math.ceil(height / step) + 1;
    const padX = ((width % step) - step) / 2;
    const padY = ((height % step) - step) / 2;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ax = padX + col * step + step / 2;
        const ay = padY + row * step + step / 2;
        dots.push({ ax, ay, sx: ax, sy: ay });
      }
    }
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildDots();
  }

  function scheduleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }

  function moveMouse(event) {
    const rect = canvas.parentElement.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
  }

  function updateSpeed() {
    const dx = mouse.x - mouse.px;
    const dy = mouse.y - mouse.py;
    const dist = Math.hypot(dx, dy);
    mouse.speed += (Math.min(dist / 9, 1) - mouse.speed) * .18;
    if (mouse.speed < .004) mouse.speed = 0;
    mouse.px = mouse.x;
    mouse.py = mouse.y;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, config.gradientFrom);
    gradient.addColorStop(1, config.gradientTo);
    ctx.fillStyle = gradient;
    const radius = config.dotRadius * .5;
    const cursorSq = config.cursorRadius * config.cursorRadius;
    const engagement = mouse.speed;

    ctx.beginPath();
    for (const dot of dots) {
      const dx = mouse.x - dot.ax;
      const dy = mouse.y - dot.ay;
      const distSq = dx * dx + dy * dy;
      if (distSq < cursorSq && engagement > .01) {
        const dist = Math.sqrt(distSq) || 1;
        const t = 1 - dist / config.cursorRadius;
        const push = t * t * config.bulgeStrength * engagement;
        dot.sx += (dot.ax - (dx / dist) * push - dot.sx) * .12;
        dot.sy += (dot.ay - (dy / dist) * push - dot.sy) * .12;
      } else {
        dot.sx += (dot.ax - dot.sx) * .08;
        dot.sy += (dot.ay - dot.sy) * .08;
      }
      ctx.moveTo(dot.sx + radius, dot.sy);
      ctx.arc(dot.sx, dot.sy, radius, 0, Math.PI * 2);
    }
    ctx.fill();
    raf = requestAnimationFrame(draw);
  }

  resize();
  speedTimer = window.setInterval(updateSpeed, 32);
  window.addEventListener("resize", scheduleResize);
  window.addEventListener("pointermove", moveMouse, { passive: true });
  raf = requestAnimationFrame(draw);

  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(raf);
    clearInterval(speedTimer);
    clearTimeout(resizeTimer);
  }, { once: true });
}

const actionButtons = $$('[data-action]');
function chooseAction(button) {
  const result = data.actions[button.dataset.action];
  state.completed[5] = true;
  state.actionScore = result.score;
  actionButtons.forEach((item) => { item.setAttribute("aria-checked", "false"); item.classList.remove("wrong"); });
  button.setAttribute("aria-checked", "true");
  if (!result.good) button.classList.add("wrong");
  const outcome = $("#actionOutcome");
  outcome.className = `outcome${result.good ? "" : " danger"}`;
  outcome.innerHTML = `<span>${result.mark}</span><div><b>${result.title}</b><p><strong>风险原因：</strong>${result.reason}</p><p><strong>推荐动作：</strong>${result.action}</p></div>`;
}

function renderSources() {
  $("#sourceList").innerHTML = data.sources.map((source) => `<li class="source-card"><span class="source-type">${source.type}</span><div><h3>${source.title}</h3><p><b>发布机构：</b>${source.org}</p><p><b>年份：</b>${source.year}</p><p><b>用途：</b>${source.use}</p><small>${source.url}</small></div><a class="button button--secondary" href="${source.url}" target="_blank" rel="noopener noreferrer">查看来源</a></li>`).join("");
}

function totalScore() { return Math.min(100, state.signalScore + state.scenarioScore + state.trendScore + state.actionScore); }

function scoreLevel(score) {
  if (score >= 90) return "safe";
  if (score >= 70) return "warning";
  return "danger";
}

function resetState() {
  state.maxVisited = 0;
  state.completed = [true, true, false, false, false, false, true, true];
  state.signals.clear();
  state.signalScore = 0; state.scenarioScore = 0; state.trendScore = 0; state.actionScore = 0;
  $$('[data-signal]').forEach((button) => button.setAttribute("aria-pressed", "false"));
  $("#signalFeedback").className = "feedback";
  $("#signalFeedback").textContent = "选好后提交。答错也没关系，解释比得分更重要。";
  updateSignalPanel(false);
  $$('[data-scenario]').forEach((button) => { button.classList.remove("selected", "wrong"); $("i", button).textContent = "待判断"; });
  $("#scenarioFeedback").className = "feedback feedback--wide";
  $("#scenarioFeedback").textContent = "请选择一个场景。";
  trendSlider.value = "0"; updateTrend();
  actionButtons.forEach((button) => { button.setAttribute("aria-checked", "false"); button.classList.remove("wrong"); });
  $("#actionOutcome").className = "outcome";
  $("#actionOutcome").innerHTML = '<span>?</span><div><b>等待选择</b><p>你的第一步，会影响接下来的风险。</p></div>';
  $("#scoreValue").textContent = "--";
  $("#scoreRing").dataset.level = "danger";
  $("#certificateTitle").textContent = "锂电池安全提示卡";
  $("#certificateLine").textContent = "完成前面的判断后生成安全提示卡";
  $("#generateCertificate").textContent = "生成安全提示卡";
  const download = $("#downloadCertificate"); download.hidden = true; download.href = "#";
  $("#certificatePreview")?.remove();
  const canvas = $("#certificateCanvas"); canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  goToPage(0); showToast("已清空记录，重新开始");
}

async function generateCertificate() {
  const score = totalScore();
  const canvas = $("#certificateCanvas");
  const button = $("#generateCertificate");
  try {
    button.disabled = true;
    button.textContent = "正在生成...";
    const dataUrl = await window.BatteryCertificate.draw(canvas, score);
    const level = window.BatteryCertificate.level(score);
    $("#scoreValue").textContent = String(score);
    $("#scoreRing").dataset.level = scoreLevel(score);
    $("#certificateTitle").textContent = "锂电池安全提示卡";
    $("#certificateLine").textContent = `安全识别指数：${score} · 等级：${level}`;
    button.textContent = "重新生成安全提示卡";
    const download = $("#downloadCertificate"); download.href = dataUrl; download.hidden = false;
    let preview = $("#certificatePreview");
    if (!preview) { preview = document.createElement("img"); preview.id = "certificatePreview"; $("#certificateCard").appendChild(preview); }
    preview.src = dataUrl;
    preview.alt = `锂电池安全提示卡，安全识别指数 ${score}，等级 ${level}`;
    showToast("安全提示卡 PNG 已生成");
  } catch (error) {
    console.error(error);
    button.textContent = "重新生成安全提示卡";
    showToast("生成失败，请刷新页面后重试");
  } finally {
    button.disabled = false;
  }
}

buildDots(); renderSignals(); renderSources(); bindScenarios(); bindTrendSliderDrag(); initDotField(); verifyRuntimeResources(); updateNavigation(); updateSignalPanel(false); updateTrend();
prevButton.addEventListener("click", () => goToPage(state.page - 1));
nextButton.addEventListener("click", tryNext);
$$('[data-next]').forEach((button) => button.addEventListener("click", tryNext));
$("#homeButton").addEventListener("click", () => goToPage(0));
$("#restartButton").addEventListener("click", resetState);
$("#checkSignals").addEventListener("click", checkSignals);
trendSlider.addEventListener("input", updateTrend);
actionButtons.forEach((button, index) => {
  button.addEventListener("click", () => chooseAction(button));
  button.addEventListener("keydown", (event) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const step = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
    const next = actionButtons[(index + step + actionButtons.length) % actionButtons.length];
    next.focus(); chooseAction(next);
  });
});
$("#generateCertificate").addEventListener("click", generateCertificate);
document.addEventListener("keydown", (event) => {
  if (["INPUT", "BUTTON", "A"].includes(event.target.tagName)) return;
  if (["ArrowRight", "PageDown"].includes(event.key)) { event.preventDefault(); tryNext(); }
  if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); goToPage(state.page - 1); }
});
const initialMatch = location.hash.match(/^#page-(\d)$/);
if (initialMatch && Number(initialMatch[1]) === 0) goToPage(0);

$$(`[data-jump]`).forEach((button) => button.addEventListener("click", () => goToPage(Number(button.dataset.jump))));
