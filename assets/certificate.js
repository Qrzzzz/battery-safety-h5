"use strict";

window.BatteryCertificate = (() => {
  function level(score) {
    if (score >= 90) return "安全观察员";
    if (score >= 70) return "安全行动者";
    return "安全学习者";
  }
  function wrapped(ctx, text, x, y, maxWidth, lineHeight) {
    let line = ""; let currentY = y;
    [...text].forEach((char, index) => {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line, x, currentY); line = char; currentY += lineHeight; }
      else line = test;
      if (index === text.length - 1) ctx.fillText(line, x, currentY);
    });
    return currentY;
  }
  function draw(canvas, score) {
    const ctx = canvas.getContext("2d"); const w = canvas.width; const h = canvas.height;
    const grade = level(score);
    const date = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(new Date());
    ctx.fillStyle = "#F5F1E8"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#FFF8EC"; ctx.fillRect(72, 72, w - 144, h - 144);
    ctx.strokeStyle = "rgba(29,37,44,.16)"; ctx.lineWidth = 3; ctx.strokeRect(72, 72, w - 144, h - 144);
    ctx.fillStyle = "#256D85"; ctx.font = '800 30px "Microsoft YaHei", sans-serif'; ctx.fillText("锂电池安全提示卡", 120, 165);
    ctx.fillStyle = "#1D252C"; ctx.font = '900 72px "Microsoft YaHei", sans-serif'; ctx.fillText("看信号，不试探，先避险", 120, 290);
    ctx.fillStyle = "#6F7B83"; ctx.font = '400 30px "Microsoft YaHei", sans-serif'; ctx.fillText("《失控之前》锂电池热失控安全科普 H5", 120, 350);
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(120, 455, w - 240, 330); ctx.strokeStyle = "rgba(37,109,133,.28)"; ctx.strokeRect(120, 455, w - 240, 330);
    ctx.fillStyle = "#D94A38"; ctx.font = '900 150px "Microsoft YaHei", sans-serif'; ctx.fillText(String(score), 180, 655);
    ctx.fillStyle = "#41505C"; ctx.font = '700 31px "Microsoft YaHei", sans-serif'; ctx.fillText("安全识别指数", 185, 720);
    ctx.fillStyle = "#256D85"; ctx.font = '800 48px "Microsoft YaHei", sans-serif'; ctx.fillText(grade, 650, 635);
    const notes = ["看信号｜鼓包、异味、异响、持续异常发烫、冒烟", "别试探｜不继续充电，不拆、不刺、不压、不冰冻", "先避险｜停止使用，保持距离，按规范渠道处理"];
    ctx.font = '500 34px "Microsoft YaHei", sans-serif';
    notes.forEach((note, i) => { const y = 935 + i * 135; ctx.fillStyle = ["#D94A38", "#D99A2B", "#256D85"][i]; ctx.fillRect(120, y - 40, 14, 58); ctx.fillStyle = "#1D252C"; wrapped(ctx, note, 165, y, 880, 48); });
    ctx.strokeStyle = "rgba(29,37,44,.14)"; ctx.beginPath(); ctx.moveTo(120, 1385); ctx.lineTo(w - 120, 1385); ctx.stroke();
    ctx.fillStyle = "#6F7B83"; ctx.font = '400 25px "Microsoft YaHei", sans-serif'; ctx.fillText(`完成日期：${date}`, 120, 1450); ctx.textAlign = "right"; ctx.fillText("失控之前｜锂电池热失控安全科普 H5", w - 120, 1450); ctx.textAlign = "left";
    return canvas.toDataURL("image/png");
  }
  return { level, draw };
})();
