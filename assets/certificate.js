"use strict";

window.BatteryCertificate = (() => {
  function level(score) {
    if (score >= 90) return "Safety Observer";
    if (score >= 70) return "Safety Responder";
    return "Safety Learner";
  }

  function wrapped(ctx, text, x, y, maxWidth, lineHeight) {
    let line = "";
    let currentY = y;
    [...text].forEach((char, index) => {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, currentY);
        line = char;
        currentY += lineHeight;
      } else line = test;
      if (index === text.length - 1) ctx.fillText(line, x, currentY);
    });
    return currentY;
  }

  function draw(canvas, score) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const grade = level(score);
    const date = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(new Date());

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#05070A");
    bg.addColorStop(0.55, "#0B1117");
    bg.addColorStop(1, "#17232D");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(232,236,234,.16)";
    ctx.lineWidth = 1;
    for (let x = 80; x < w; x += 80) { ctx.beginPath(); ctx.moveTo(x, 80); ctx.lineTo(x, h - 80); ctx.stroke(); }
    for (let y = 80; y < h; y += 80) { ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(w - 80, y); ctx.stroke(); }

    ctx.strokeStyle = "#4FC3C7";
    ctx.lineWidth = 4;
    ctx.strokeRect(58, 58, w - 116, h - 116);
    ctx.strokeStyle = "rgba(232,236,234,.22)";
    ctx.lineWidth = 2;
    ctx.strokeRect(86, 86, w - 172, h - 172);

    ctx.fillStyle = "#4FC3C7";
    ctx.font = '700 28px ui-monospace, "Microsoft YaHei", sans-serif';
    ctx.fillText("BATTERY SAFETY BRIEF", 120, 160);
    ctx.fillStyle = "#E8ECEA";
    ctx.font = '800 68px "Microsoft YaHei", sans-serif';
    ctx.fillText("锂电池异常风险识别摘要", 120, 285);
    ctx.fillStyle = "#A7B0AD";
    ctx.font = '400 31px "Microsoft YaHei", sans-serif';
    ctx.fillText("看信号，不试探，先避险。", 120, 350);

    ctx.fillStyle = "rgba(79,195,199,.09)";
    ctx.fillRect(120, 445, w - 240, 330);
    ctx.strokeStyle = "rgba(79,195,199,.35)";
    ctx.strokeRect(120, 445, w - 240, 330);
    ctx.fillStyle = "#E8ECEA";
    ctx.font = '900 148px ui-monospace, "Microsoft YaHei", sans-serif';
    ctx.fillText(String(score), 180, 655);
    ctx.fillStyle = "#A7B0AD";
    ctx.font = '700 30px ui-monospace, "Microsoft YaHei", sans-serif';
    ctx.fillText("Risk Awareness Score", 185, 710);
    ctx.fillStyle = "#D8A742";
    ctx.font = '800 42px ui-monospace, "Microsoft YaHei", sans-serif';
    ctx.fillText(`Level: ${grade}`, 620, 620);

    const notes = ["看信号 / 鼓包、异味、异响、持续异常发烫、冒烟", "不试探 / 不继续充电，不拆、不刺、不压、不冰冻", "先避险 / 停止使用，保持距离，按规范渠道处理"];
    ctx.font = '500 32px "Microsoft YaHei", sans-serif';
    notes.forEach((note, i) => {
      const y = 920 + i * 135;
      ctx.fillStyle = i === 0 ? "#E15A46" : i === 1 ? "#D8A742" : "#4FC3C7";
      ctx.fillRect(120, y - 35, 12, 52);
      ctx.fillStyle = "#E8ECEA";
      wrapped(ctx, note, 165, y, 880, 46);
    });

    ctx.strokeStyle = "rgba(232,236,234,.18)";
    ctx.beginPath(); ctx.moveTo(120, 1385); ctx.lineTo(w - 120, 1385); ctx.stroke();
    ctx.fillStyle = "#6F7A78";
    ctx.font = '400 24px "Microsoft YaHei", sans-serif';
    ctx.fillText(`生成日期  ${date}`, 120, 1450);
    ctx.textAlign = "right";
    ctx.fillText("《失控之前》公共安全交互指南", w - 120, 1450);
    ctx.textAlign = "left";
    return canvas.toDataURL("image/png");
  }

  return { level, draw };
})();
