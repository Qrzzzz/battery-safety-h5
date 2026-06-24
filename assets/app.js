"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const pages = $$(".page");
const state = {
  page: 0,
  maxVisited: 0,
  completed: [true, true, false, false, false, false, true, true],
  signals: new Set(),
  signalScore: 0,
  scenarioScore: 0,
  trendScore: 0,
  actionScore: 0
};

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
    button.addEventListener("click", () => {
      if (index <= state.maxVisited) goToPage(index);
      else showToast("请按顺序完成前面的内容");
    });
    dots.appendChild(button);
  });
}

function updateNavigation() {
  pageName.textContent = pages[state.page].dataset.title;
  pageNumber.textContent = String(state.page + 1);
  prevButton.disabled = state.page === 0;
  nextButton.disabled = state.page === pages.length - 1;
  nextButton.innerHTML = state.page === 6 ? '查看来源 <span aria-hidden="true">→</span>' : '下一页 <span aria-hidden="true">→</span>';
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
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}

function tryNext() {
  if (!state.completed[state.page]) {
    const messages = {
      2: "先提交风险信号判断",
      3: "先选出最该停用的场景",
      4: "先拖动滑杆看完整个升温过程",
      5: "先做出你的处置选择"
    };
    showToast(messages[state.page] || "请先完成当前页面");
    return;
  }
  goToPage(state.page + 1);
}

buildDots();
updateNavigation();

prevButton.addEventListener("click", () => goToPage(state.page - 1));
nextButton.addEventListener("click", tryNext);
$$('[data-next]').forEach((button) => button.addEventListener("click", tryNext));
$("#homeButton").addEventListener("click", () => goToPage(0));
$("#restartButton").addEventListener("click", resetState);

document.addEventListener("keydown", (event) => {
  const tag = event.target.tagName;
  if (["INPUT", "BUTTON", "A"].includes(tag)) return;
  if (["ArrowRight", "PageDown"].includes(event.key)) {
    event.preventDefault();
    tryNext();
  }
  if (["ArrowLeft", "PageUp"].includes(event.key)) {
    event.preventDefault();
    goToPage(state.page - 1);
  }
});

// 第 3 页：信号识别
const signalButtons = $$("[data-signal]");
signalButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.signal;
    const selected = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(selected));
    if (selected) state.signals.add(key);
    else state.signals.delete(key);
  });
});

$("#checkSignals").addEventListener("click", () => {
  const hazards = ["bulge", "odor", "hot", "smoke"];
  const hits = hazards.filter((key) => state.signals.has(key)).length;
  const pickedWarm = state.signals.has("warm");
  const feedback = $("#signalFeedback");

  state.completed[2] = true;
  if (hits === 4 && !pickedWarm) {
    state.signalScore = 30;
    feedback.className = "feedback correct";
    feedback.innerHTML = "<b>全对。</b> 鼓包、异味或异响、停用后仍持续发烫，以及喷气冒烟，都不能当成普通发热。";
  } else {
    state.signalScore = Math.max(8, hits * 5 - (pickedWarm ? 2 : 0));
    feedback.className = "feedback partial";
    feedback.innerHTML = `<b>你找到了 ${hits}/4 个关键信号。</b> 轻微温热要结合使用状态判断；鼓包、异味、异响、持续升温和烟气更值得立即警惕。`;
  }
  $("#phoneScene").classList.toggle("danger", hits >= 3);
  $(".phone span").textContent = hits >= 3 ? "!" : "?";
  $(".phone small").textContent = hits >= 3 ? "异常信号" : "继续观察";
  showToast("已记录，可以进入下一页");
});

// 第 4 页：场景判断
const scenarioText = {
  warm: {
    score: 12,
    label: "先降负载",
    className: "wrong",
    text: "手机温热需要改善使用方式，但它停下高负载后能够降温，也没有其他异常，不是本题中最急的一项。"
  },
  bulge: {
    score: 30,
    label: "立即停用",
    className: "selected",
    text: "对。鼓包说明电池或设备外形已经异常。不要继续使用、充电、挤压或拆解，应通过厂家、学校、社区或规范回收渠道处理。"
  },
  hall: {
    score: 20,
    label: "高风险",
    className: "wrong",
    text: "楼道充电会堵塞疏散通道，还叠加了可燃物风险，必须纠正；本题中已经鼓包的电池更需要马上停用。"
  }
};

$$('[data-scenario]').forEach((button) => {
  button.addEventListener("click", () => {
    const result = scenarioText[button.dataset.scenario];
    state.completed[3] = true;
    state.scenarioScore = result.score;
    $$('[data-scenario]').forEach((item) => {
      item.classList.remove("selected", "wrong");
      $("i", item).textContent = "待判断";
    });
    button.classList.add(result.className);
    $("i", button).textContent = result.label;
    const feedback = $("#scenarioFeedback");
    feedback.className = `feedback feedback--wide ${result.className === "selected" ? "correct" : "partial"}`;
    feedback.textContent = result.text;
  });
});

// 第 5 页：升温趋势
const trendData = [
  { name: "正常产热", mark: "✓", title: "先观察", text: "使用或充电时轻微温热并不少见。保持通风，不要用被褥、衣物盖住设备。" },
  { name: "出现异常", mark: "!", title: "停止使用", text: "明显发烫，或者伴随鼓包、异味、异响，就不该继续充电或运行。" },
  { name: "持续升温", mark: "!", title: "拉开距离", text: "停用后温度仍在上升，说明风险没有解除。减少接触，不要搬动、拆解或尝试修复。" },
  { name: "烟气或明火", mark: "×", title: "撤离并求助", text: "立即远离现场，提醒周围人员避开；按照场所规定和当地应急要求报警求助。" }
];

const trendSlider = $("#trendSlider");
function updateTrend() {
  const value = Number(trendSlider.value);
  const item = trendData[value];
  $("#trendVisual").dataset.stage = String(value);
  $("#trendName").textContent = item.name;
  $("#batteryMark").textContent = item.mark;
  $("#trendText").innerHTML = `<b>${item.title}</b>${item.text}`;
  trendSlider.setAttribute("aria-valuetext", `${item.name}：${item.title}`);
  if (value === 3) {
    state.completed[4] = true;
    state.trendScore = 10;
  }
}
trendSlider.addEventListener("input", updateTrend);
updateTrend();

// 第 6 页：处置选择
const actionText = {
  freeze: { score: 2, good: false, mark: "×", title: "不要放进冰箱", text: "搬动异常电池和不当降温都可能带来新的碰撞、受潮或短路风险。" },
  drain: { score: 0, good: false, mark: "×", title: "不要继续使用", text: "“把电用完”仍在让异常电池工作，可能让产热继续增加。" },
  safe: { score: 30, good: true, mark: "✓", title: "先停用，再避险", text: "停止使用和充电，人员保持距离，避开可燃物，再联系学校、社区、厂家、消防或规范回收渠道。" },
  pierce: { score: 0, good: false, mark: "×", title: "不要拆、刺、压", text: "这些动作可能损坏内部结构，引发短路、泄漏或突然失稳。" }
};

const actionButtons = $$("[data-action]");
function chooseAction(button) {
  const result = actionText[button.dataset.action];
  state.completed[5] = true;
  state.actionScore = result.score;
  actionButtons.forEach((item) => {
    item.setAttribute("aria-checked", "false");
    item.classList.remove("wrong");
  });
  button.setAttribute("aria-checked", "true");
  if (!result.good) button.classList.add("wrong");
  const outcome = $("#actionOutcome");
  outcome.className = `outcome${result.good ? "" : " danger"}`;
  outcome.innerHTML = `<span>${result.mark}</span><div><b>${result.title}</b><p>${result.text}</p></div>`;
}

actionButtons.forEach((button, index) => {
  button.addEventListener("click", () => chooseAction(button));
  button.addEventListener("keydown", (event) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const step = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
    const next = actionButtons[(index + step + actionButtons.length) % actionButtons.length];
    next.focus();
    chooseAction(next);
  });
});

function totalScore() {
  return Math.min(100, state.signalScore + state.scenarioScore + state.trendScore + state.actionScore);
}

function resetState() {
  state.maxVisited = 0;
  state.completed = [true, true, false, false, false, false, true, true];
  state.signals.clear();
  state.signalScore = 0;
  state.scenarioScore = 0;
  state.trendScore = 0;
  state.actionScore = 0;

  signalButtons.forEach((button) => button.setAttribute("aria-pressed", "false"));
  const signalFeedback = $("#signalFeedback");
  signalFeedback.className = "feedback";
  signalFeedback.textContent = "选好后提交。答错也没关系，解释比得分更重要。";
  $("#phoneScene").classList.remove("danger");
  $(".phone span").textContent = "?";
  $(".phone small").textContent = "等待判断";

  $$('[data-scenario]').forEach((button) => {
    button.classList.remove("selected", "wrong");
    $("i", button).textContent = "待判断";
  });
  const scenarioFeedback = $("#scenarioFeedback");
  scenarioFeedback.className = "feedback feedback--wide";
  scenarioFeedback.textContent = "请选择一个场景。";

  trendSlider.value = "0";
  updateTrend();

  actionButtons.forEach((button) => {
    button.setAttribute("aria-checked", "false");
    button.classList.remove("wrong");
  });
  const outcome = $("#actionOutcome");
  outcome.className = "outcome";
  outcome.innerHTML = '<span>?</span><div><b>等待选择</b><p>你的第一步，会影响接下来的风险。</p></div>';

  $("#scoreValue").textContent = "--";
  $("#certificateTitle").textContent = "锂电池安全学习结业卡";
  $("#certificateLine").textContent = "完成前面的判断后生成";
  $("#generateCertificate").textContent = "生成结业卡";
  const download = $("#downloadCertificate");
  download.hidden = true;
  download.href = "#";
  $("#certificatePreview")?.remove();
  const canvas = $("#certificateCanvas");
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

  goToPage(0);
  showToast("已清空记录，重新开始");
}

function certificateLevel(score) {
  if (score >= 90) return "安全观察员";
  if (score >= 70) return "安全行动者";
  return "安全学习者";
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
  let line = "";
  let currentY = y;
  [...text].forEach((character, index) => {
    const test = line + character;
    if (context.measureText(test).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = character;
      currentY += lineHeight;
    } else {
      line = test;
    }
    if (index === text.length - 1) context.fillText(line, x, currentY);
  });
  return currentY;
}

function drawCertificate(score) {
  const canvas = $("#certificateCanvas");
  const ctx = canvas.getContext("2d");
  const level = certificateLevel(score);
  const w = canvas.width;
  const h = canvas.height;
  const completionDate = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date());

  const background = ctx.createLinearGradient(0, 0, w, h);
  background.addColorStop(0, "#071015");
  background.addColorStop(1, "#10252a");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(200,255,61,.4)";
  ctx.lineWidth = 3;
  ctx.strokeRect(54, 54, w - 108, h - 108);
  ctx.strokeStyle = "rgba(239,248,246,.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(76, 76, w - 152, h - 152);

  ctx.fillStyle = "#c8ff3d";
  ctx.font = '700 26px "Microsoft YaHei", sans-serif';
  ctx.letterSpacing = "4px";
  ctx.fillText("BATTERY SAFETY / 2026", 110, 150);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = "#eff8f6";
  ctx.font = '800 76px "Microsoft YaHei", sans-serif';
  ctx.fillText("锂电池安全学习结业卡", 110, 285);
  ctx.fillStyle = "#9db0ac";
  ctx.font = '400 30px "Microsoft YaHei", sans-serif';
  ctx.fillText("已完成《失控之前》互动学习", 110, 350);

  ctx.beginPath();
  ctx.arc(w / 2, 655, 200, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(239,248,246,.1)";
  ctx.lineWidth = 28;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, 655, 200, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * score / 100);
  ctx.strokeStyle = "#c8ff3d";
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.lineCap = "butt";

  ctx.textAlign = "center";
  ctx.fillStyle = "#eff8f6";
  ctx.font = '900 150px "Microsoft YaHei", sans-serif';
  ctx.fillText(String(score), w / 2, 695);
  ctx.fillStyle = "#9db0ac";
  ctx.font = '500 28px "Microsoft YaHei", sans-serif';
  ctx.fillText("安全指数", w / 2, 760);

  ctx.fillStyle = "#c8ff3d";
  ctx.font = '800 52px "Microsoft YaHei", sans-serif';
  ctx.fillText(level, w / 2, 930);
  ctx.textAlign = "left";

  const notes = [
    "看信号：鼓包、异味、异响、持续异常发烫、冒烟。",
    "别试探：不继续充电，不拆、不刺、不压、不冰冻。",
    "先避险：停止使用，保持距离，按规范渠道处理。"
  ];
  ctx.font = '500 31px "Microsoft YaHei", sans-serif';
  notes.forEach((note, index) => {
    const y = 1050 + index * 105;
    ctx.fillStyle = "#c8ff3d";
    ctx.beginPath();
    ctx.arc(125, y - 10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#dce9e6";
    drawWrappedText(ctx, note, 155, y, 900, 44);
  });

  ctx.strokeStyle = "rgba(239,248,246,.13)";
  ctx.beginPath();
  ctx.moveTo(110, 1400);
  ctx.lineTo(w - 110, 1400);
  ctx.stroke();
  ctx.fillStyle = "#788b87";
  ctx.font = '400 23px "Microsoft YaHei", sans-serif';
  ctx.fillText(`完成日期  ${completionDate}`, 110, 1460);
  ctx.textAlign = "right";
  ctx.fillText("《失控之前》锂电池安全互动科普", w - 110, 1460);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}

$("#generateCertificate").addEventListener("click", () => {
  const score = totalScore();
  const dataUrl = drawCertificate(score);
  const level = certificateLevel(score);
  $("#scoreValue").textContent = String(score);
  $("#certificateTitle").textContent = level;
  $("#certificateLine").textContent = "锂电池安全学习已完成";
  $("#generateCertificate").textContent = "重新生成结业卡";
  const download = $("#downloadCertificate");
  download.href = dataUrl;
  download.hidden = false;

  let preview = $("#certificatePreview");
  if (!preview) {
    preview = document.createElement("img");
    preview.id = "certificatePreview";
    preview.alt = `锂电池安全学习结业卡，安全指数 ${score} 分，等级 ${level}`;
    preview.style.width = "100%";
    preview.style.marginTop = "18px";
    preview.style.borderRadius = "10px";
    preview.style.border = "1px solid rgba(239,248,246,.14)";
    $("#certificateCard").appendChild(preview);
  }
  preview.src = dataUrl;
  preview.alt = `锂电池安全学习结业卡，安全指数 ${score} 分，等级 ${level}`;
  showToast("结业卡图片已生成");
});

// 允许直接打开带页码的链接，但不能跳过尚未访问的页面。
const initialMatch = location.hash.match(/^#page-(\d)$/);
if (initialMatch && Number(initialMatch[1]) === 0) goToPage(0);

// 反向翻页动画
const style = document.createElement("style");
style.textContent = "@keyframes pageInBack{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:none}}";
document.head.appendChild(style);
