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
  oldPage.classList.remove("page--active");
  if (!reduceMotion) oldPage.classList.add("page--leaving");
  oldPage.setAttribute("aria-hidden", "true");
  oldPage.inert = true;
  state.page = index;
  state.maxVisited = Math.max(state.maxVisited, index);
  newPage.classList.remove("page--leaving");
  newPage.classList.add("page--active");
  newPage.removeAttribute("aria-hidden");
  newPage.inert = false;
  newPage.scrollTop = 0;
  newPage.style.animationName = forward ? "pageIn" : "pageInBack";
  location.hash = `page-${index}`;
  updateNavigation();
  setTimeout(() => oldPage.classList.remove("page--leaving"), 250);
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
function updateTrend() {
  const value = Number(trendSlider.value);
  const item = data.trend[value];
  $("#trendVisual").dataset.stage = String(value);
  $("#trendCode").textContent = item.code;
  $("#trendName").textContent = item.name;
  $("#batteryMark").textContent = item.mark;
  $("#trendText").innerHTML = `<b>${item.title}</b>${item.text}`;
  trendSlider.setAttribute("aria-valuetext", `${item.code}：${item.title}`);
  if (value === 3) { state.completed[4] = true; state.trendScore = 10; }
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
  $("#certificateTitle").textContent = "锂电池安全提示卡";
  $("#certificateLine").textContent = "完成前面的判断后生成安全提示卡";
  $("#generateCertificate").textContent = "生成安全提示卡";
  const download = $("#downloadCertificate"); download.hidden = true; download.href = "#";
  $("#certificatePreview")?.remove();
  const canvas = $("#certificateCanvas"); canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  goToPage(0); showToast("已清空记录，重新开始");
}

function generateCertificate() {
  const score = totalScore();
  const canvas = $("#certificateCanvas");
  const dataUrl = window.BatteryCertificate.draw(canvas, score);
  const level = window.BatteryCertificate.level(score);
  $("#scoreValue").textContent = String(score);
  $("#certificateTitle").textContent = "锂电池安全提示卡";
  $("#certificateLine").textContent = `安全识别指数：${score} · 等级：${level}`;
  $("#generateCertificate").textContent = "重新生成安全提示卡";
  const download = $("#downloadCertificate"); download.href = dataUrl; download.hidden = false;
  let preview = $("#certificatePreview");
  if (!preview) { preview = document.createElement("img"); preview.id = "certificatePreview"; $("#certificateCard").appendChild(preview); }
  preview.src = dataUrl;
  preview.alt = `锂电池安全提示卡，安全识别指数 ${score}，等级 ${level}`;
  showToast("安全提示卡 PNG 已生成");
}

buildDots(); renderSignals(); renderSources(); bindScenarios(); updateNavigation(); updateSignalPanel(false); updateTrend();
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
