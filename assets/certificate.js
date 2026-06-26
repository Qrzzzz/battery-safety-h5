"use strict";

window.BatteryCertificate = (() => {
  function level(score) {
    if (score >= 90) return "安全观察员";
    if (score >= 70) return "安全行动者";
    return "安全学习者";
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    let line = "";
    let currentY = y;
    for (const char of text) {
      const next = line + char;
      if (line && ctx.measureText(next).width > maxWidth) {
        ctx.fillText(line, x, currentY);
        line = char;
        currentY += lineHeight;
      } else {
        line = next;
      }
    }
    if (line) ctx.fillText(line, x, currentY);
    return currentY;
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawScoreRing(ctx, x, y, radius) {
    ctx.save();
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(217,74,56,.16)";
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, Math.PI * 1.5);
    ctx.stroke();
    ctx.strokeStyle = "#D94A38";
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2 + Math.PI * .6, Math.PI * 1.5);
    ctx.stroke();
    ctx.strokeStyle = "#D99A2B";
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2 + Math.PI * .2, -Math.PI / 2 + Math.PI * .6);
    ctx.stroke();
    ctx.strokeStyle = "#3E8F5B";
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * .2);
    ctx.stroke();
    ctx.restore();
  }

  function drawBackground(ctx, width, height) {
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#FFF8EC");
    bg.addColorStop(.56, "#F7F1E7");
    bg.addColorStop(1, "#EEF7F8");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = .18;
    ctx.fillStyle = "#EE705B";
    for (let y = 92; y < height - 70; y += 44) {
      for (let x = 78; x < width - 70; x += 44) {
        ctx.beginPath();
        ctx.arc(x, y, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    const heat = ctx.createRadialGradient(width * .78, height * .22, 18, width * .78, height * .22, 520);
    heat.addColorStop(0, "rgba(238,112,91,.2)");
    heat.addColorStop(1, "rgba(238,112,91,0)");
    ctx.fillStyle = heat;
    ctx.fillRect(0, 0, width, height);
  }

  function draw(canvas, score) {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const grade = level(score);
    const date = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(new Date());

    ctx.clearRect(0, 0, width, height);
    drawBackground(ctx, width, height);

    roundedRect(ctx, 72, 72, width - 144, height - 144, 46);
    ctx.fillStyle = "rgba(255,255,255,.74)";
    ctx.fill();
    ctx.strokeStyle = "rgba(29,37,44,.14)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#256D85";
    ctx.font = '800 30px "Microsoft YaHei", sans-serif';
    ctx.fillText("锂电池安全提示卡", 120, 165);
    ctx.fillStyle = "#1D252C";
    ctx.font = '900 72px "Microsoft YaHei", sans-serif';
    ctx.fillText("看信号，不试探，先避险", 120, 290);
    ctx.fillStyle = "#6F7B83";
    ctx.font = '400 30px "Microsoft YaHei", sans-serif';
    ctx.fillText("《失控之前》锂电池热失控安全科普 H5", 120, 350);

    roundedRect(ctx, 120, 455, width - 240, 330, 30);
    ctx.fillStyle = "rgba(255,255,255,.86)";
    ctx.fill();
    ctx.strokeStyle = "rgba(37,109,133,.24)";
    ctx.stroke();

    ctx.fillStyle = "#D94A38";
    ctx.font = '900 150px "Microsoft YaHei", sans-serif';
    ctx.fillText(String(score), 180, 655);
    ctx.fillStyle = "#41505C";
    ctx.font = '700 31px "Microsoft YaHei", sans-serif';
    ctx.fillText("安全识别指数", 185, 720);
    drawScoreRing(ctx, 765, 630, 116);
    ctx.fillStyle = "#256D85";
    ctx.font = '800 48px "Microsoft YaHei", sans-serif';
    ctx.fillText(grade, 650, 635);

    const notes = [
      "看信号：鼓包、异味、异响、持续异常发热、冒烟，都值得警惕",
      "别试探：不继续充电，不拆、不刺、不压、不冰冻",
      "先避险：停止使用，保持距离，按规范渠道处理"
    ];
    ctx.font = '500 34px "Microsoft YaHei", sans-serif';
    notes.forEach((note, index) => {
      const y = 935 + index * 135;
      ctx.fillStyle = ["#D94A38", "#D99A2B", "#256D85"][index];
      roundedRect(ctx, 120, y - 42, 14, 64, 7);
      ctx.fill();
      ctx.fillStyle = "#1D252C";
      wrapText(ctx, note, 165, y, 880, 48);
    });

    ctx.strokeStyle = "rgba(29,37,44,.14)";
    ctx.beginPath();
    ctx.moveTo(120, 1385);
    ctx.lineTo(width - 120, 1385);
    ctx.stroke();
    ctx.fillStyle = "#6F7B83";
    ctx.font = '400 25px "Microsoft YaHei", sans-serif';
    ctx.fillText(`完成日期：${date}`, 120, 1450);
    ctx.textAlign = "right";
    ctx.fillText("失控之前｜锂电池热失控安全科普 H5", width - 120, 1450);
    ctx.textAlign = "left";

    return canvas.toDataURL("image/png");
  }

  return { level, draw };
})();
