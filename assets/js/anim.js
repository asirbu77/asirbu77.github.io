/* Canvas animations for the research entries.
   Each <canvas data-anim="fauna|sudoku"> mounts one engine. Engines pause when
   the canvas scrolls out of view, and render a single settled frame when the
   visitor has asked for reduced motion. */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var BONE = "242,237,228";
  var HOT = "#a970ff";
  var HOT_RGB = "169,112,255";

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function wrap(v, m) { return ((v % m) + m) % m; }

  function bump(x, c, w) {
    var d = (((x - c + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    return Math.exp(-d * d / (2 * w * w));
  }

  function fit(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return [ctx, w, h];
  }

  /* ----- creatures ------------------------------------------------------- */

  function quadLeg(ctx, ox, oy, p, len, amp, kneeSign, alpha, lw) {
    var hipA = amp * Math.sin(p);
    var knee = (0.16 + 0.85 * bump(p, 0, 0.62)) * kneeSign;
    var kx = ox + Math.sin(hipA) * len * 0.52, ky = oy + Math.cos(hipA) * len * 0.52;
    var sa = hipA - knee;
    var fx = kx + Math.sin(sa) * len * 0.48, fy = ky + Math.cos(sa) * len * 0.48;
    ctx.strokeStyle = "rgba(" + BONE + "," + alpha + ")";
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(ox, oy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy);
    ctx.stroke();
  }

  function rodent(ctx, x, ground, U, ph, a) {
    /* U is body height. A rat is low-slung: hips at 0.6 U, short legs, one
       continuous silhouette from rump to snout. */
    var lw = clamp(U * 0.085, 1.3, 4.6);
    var hipY = ground - 0.46 * U - 0.018 * U * Math.cos(2 * ph);
    var hipX = x, shoX = x + 1.10 * U, shoY = hipY - 0.03 * U;
    var hindLen = 0.50 * U, foreLen = 0.51 * U;
    var tailX = hipX - 0.36 * U, tailY = hipY - 0.16 * U;

    quadLeg(ctx, shoX, shoY, ph + Math.PI, foreLen, 0.38, 1, a * 0.32, lw);
    quadLeg(ctx, hipX, hipY, ph, hindLen, 0.42, 1, a * 0.32, lw);

    /* tail: tapering, trailing the stride */
    var px = tailX, py = tailY;
    ctx.strokeStyle = "rgba(" + BONE + "," + a * 0.85 + ")";
    ctx.lineCap = "round";
    for (var i = 1; i <= 8; i++) {
      var nx = px - 0.19 * U;
      var ny = tailY + 0.055 * U * i + Math.sin(ph * 1.15 - i * 0.55) * 0.028 * U * i;
      ctx.lineWidth = Math.max(lw * (1 - i * 0.09), 0.7);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke();
      px = nx; py = ny;
    }

    /* body */
    ctx.fillStyle = "rgba(" + BONE + "," + a * 0.94 + ")";
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.bezierCurveTo(hipX - 0.26 * U, hipY - 0.46 * U, hipX + 0.44 * U, hipY - 0.44 * U, shoX - 0.18 * U, shoY - 0.38 * U);
    ctx.bezierCurveTo(shoX + 0.06 * U, shoY - 0.36 * U, shoX + 0.20 * U, shoY - 0.28 * U, shoX + 0.27 * U, shoY - 0.13 * U);
    ctx.bezierCurveTo(shoX + 0.22 * U, shoY + 0.04 * U, shoX + 0.02 * U, shoY + 0.11 * U, shoX - 0.26 * U, shoY + 0.11 * U);
    ctx.bezierCurveTo(hipX + 0.34 * U, hipY + 0.13 * U, hipX - 0.16 * U, hipY + 0.04 * U, tailX, tailY);
    ctx.closePath();
    ctx.fill();

    /* head, snout, ear */
    ctx.beginPath(); ctx.ellipse(shoX + 0.42 * U, shoY - 0.13 * U, 0.26 * U, 0.18 * U, 0.18, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(shoX + 0.66 * U, shoY - 0.06 * U, 0.13 * U, 0.085 * U, 0.26, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(shoX + 0.26 * U, shoY - 0.29 * U, 0.11 * U, 0, 7); ctx.fill();

    ctx.strokeStyle = "rgba(" + BONE + "," + a * 0.4 + ")";
    ctx.lineWidth = Math.max(lw * 0.3, 0.5);
    for (var k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(shoX + 0.75 * U, shoY - 0.06 * U);
      ctx.lineTo(shoX + 1.02 * U, shoY - 0.06 * U + k * 0.12 * U);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(" + HOT_RGB + "," + a + ")";
    ctx.beginPath(); ctx.arc(shoX + 0.48 * U, shoY - 0.19 * U, Math.max(0.042 * U, 1), 0, 7); ctx.fill();

    quadLeg(ctx, shoX, shoY, ph, foreLen, 0.38, 1, a * 0.95, lw);
    quadLeg(ctx, hipX, hipY, ph + Math.PI, hindLen, 0.42, 1, a * 0.95, lw);
  }

  function fly(ctx, x, y, U, t, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.10 + Math.sin(t * 1.7) * 0.05);

    for (var g = 0; g < 3; g++) {
      var s = Math.abs(Math.sin(t * 30 - g * 0.42));
      ctx.fillStyle = "rgba(" + BONE + "," + a * (0.20 - g * 0.055) + ")";
      for (var i = 0; i < 2; i++) {
        var side = i ? 1 : -1;
        ctx.save();
        ctx.translate(-0.04 * U, -0.16 * U);
        ctx.rotate(side * (0.30 + 0.62 * s) + Math.PI);
        ctx.beginPath();
        ctx.ellipse(0.52 * U, 0, 0.52 * U, 0.15 * U * (0.35 + 0.65 * s), 0, 0, 7);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.strokeStyle = "rgba(" + BONE + "," + a * 0.75 + ")";
    ctx.lineWidth = clamp(U * 0.05, 0.9, 2.4);
    ctx.lineCap = "round";
    for (var j = 0; j < 3; j++) {
      var bx = -0.16 * U + j * 0.17 * U;
      ctx.beginPath();
      ctx.moveTo(bx, 0.14 * U);
      ctx.lineTo(bx - 0.12 * U, 0.36 * U);
      ctx.lineTo(bx + 0.04 * U, 0.48 * U);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(" + BONE + "," + a * 0.95 + ")";
    ctx.beginPath(); ctx.ellipse(-0.54 * U, 0.03 * U, 0.47 * U, 0.21 * U, 0.10, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, 0.33 * U, 0.25 * U, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0.34 * U, -0.05 * U, 0.21 * U, 0.19 * U, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(" + HOT_RGB + "," + a * 0.95 + ")";
    ctx.beginPath(); ctx.ellipse(0.43 * U, -0.08 * U, 0.12 * U, 0.14 * U, 0, 0, 7); ctx.fill();
    ctx.restore();
  }

  function wormBody(u, t) {
    /* u = 0 is the tail, u = 1 the head. The wave travels tail-ward (+t), which is
       what drives the animal forwards; flipping that sign swims it backwards. */
    return Math.sin(u * Math.PI * 2.7 + t * 7.0) * Math.sin(Math.PI * (0.25 + 0.75 * u));
  }

  function worm(ctx, x, y, U, len, t, a) {
    var N = 30;
    ctx.fillStyle = "rgba(" + BONE + "," + a * 0.92 + ")";
    for (var i = 0; i <= N; i++) {
      var u = i / N;
      var r = U * Math.pow(Math.sin(Math.PI * clamp(u * 1.01, 0, 1)), 0.5) * (1 - 0.22 * u);
      ctx.beginPath();
      ctx.arc(x + u * len, y + wormBody(u, t) * U * 1.7, Math.max(r, 0.4), 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(" + HOT_RGB + "," + a * 0.9 + ")";
    ctx.beginPath();
    ctx.arc(x + 0.95 * len, y + wormBody(0.95, t) * U * 1.7, Math.max(U * 0.30, 0.8), 0, 7);
    ctx.fill();
  }

  function groundLine(ctx, w, y) {
    ctx.strokeStyle = "rgba(35,46,57,1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }

  /* ----- engine: rodent, fly, worm --------------------------------------- */

  function faunaEngine(canvas) {
    var mode = canvas.dataset.mode || "scene";
    var T = mode === "cycle" ? 1.2 : 0, dR = 0, dF = 0, dW = 0, placed = false;

    return function (dt) {
      var box = fit(canvas), ctx = box[0], w = box[1], h = box[2];
      T += dt;

      if (mode === "lanes") {
        var lane = h / 3;
        var U = clamp(lane * 0.62, 14, 58), stride = 1.05 * U;
        if (!placed) { placed = true; dR = w * 0.32 + 1.8 * U; dF = w * 0.62 + 1.5 * U; dW = w * 0.40; }
        dR += (stride / 0.8) * dt; dF += (w * 0.20) * dt; dW += (w * 0.060) * dt;
        var gR = lane - 6, gW = lane * 3 - 10;
        groundLine(ctx, w, gR);
        groundLine(ctx, w, gW);
        rodent(ctx, wrap(dR, w + 3.6 * U) - 1.8 * U, gR, U, (dR / stride) * Math.PI * 2, 1);
        fly(ctx, wrap(dF, w + 3 * U) - 1.5 * U, lane * 1.5 + Math.sin(T * 1.9) * lane * 0.20, clamp(lane * 0.42, 10, 38), T, 1);
        worm(ctx, wrap(dW, w * 1.4) - w * 0.34, gW - 4, clamp(lane * 0.10, 2.2, 8), w * 0.30, T, 1);
        return;
      }

      if (mode === "cycle") {
        var WIN = 5.0;
        var idx = Math.floor(T / WIN) % 3, local = T % WIN;
        var a = REDUCED ? 1 : clamp(Math.min(local / 0.55, (WIN - local) / 0.55), 0, 1);
        if (idx === 0) {
          var cU = clamp(h * 0.55, 22, 120), cStride = 1.05 * cU, cMargin = 2 * cU;
          var cDist = (local / WIN) * (w + 2 * cMargin);
          groundLine(ctx, w, h * 0.80);
          rodent(ctx, cDist - cMargin, h * 0.80, cU, (cDist / cStride) * Math.PI * 2, a);
        } else if (idx === 1) {
          var fU = clamp(h * 0.20, 12, 46), fMargin = 2.4 * fU;
          var fDist = (local / WIN) * (w + 2 * fMargin);
          fly(ctx, fDist - fMargin, h * 0.50 + Math.sin(T * 2.4) * h * 0.13, fU, T, a);
        } else {
          var len = w * 0.46, wMargin = len * 0.6;
          var wDist = (local / WIN) * (w + 2 * wMargin);
          worm(ctx, wDist - wMargin - len * 0.5, h * 0.58, clamp(h * 0.035, 2.5, 11), len, T, a);
        }
        return;
      }

      /* scene: one ground plane, three depths */
      var ground = h * 0.78;
      groundLine(ctx, w, ground);
      var sU = clamp(h * 0.30, 16, 78), sStride = 1.05 * sU;
      if (!placed) { placed = true; dR = w * 0.34 + 1.8 * sU; dF = w * 0.70 + 2 * sU; dW = w * 0.41; }
      dR += (sStride / 0.85) * dt; dF += (w * 0.160) * dt; dW += (w * 0.055) * dt;
      fly(ctx, wrap(dF, w + 4 * sU) - 2 * sU, h * 0.19 + Math.sin(T * 2.2) * h * 0.06, clamp(h * 0.09, 7, 22), T, 0.85);
      rodent(ctx, wrap(dR, w + 3.6 * sU) - 1.8 * sU, ground, sU, (dR / sStride) * Math.PI * 2, 1);
      worm(ctx, wrap(dW, w * 1.44) - w * 0.36, h * 0.92, clamp(h * 0.026, 2, 8), w * 0.22, T, 0.95);
    };
  }

  /* ----- engine: sudoku -------------------------------------------------- */

  function sudokuEngine(canvas) {
    var solution = [];
    for (var r = 0; r < 9; r++) {
      solution[r] = [];
      for (var q = 0; q < 9; q++) solution[r][q] = ((3 * (r % 3) + Math.floor(r / 3) + q) % 9) + 1;
    }

    var DURATION = 6.4, HOLD = 1.8;
    var threshold = [], noise = [], elapsed = 0, tick = 0;

    function reseed() {
      threshold = []; noise = [];
      for (var i = 0; i < 81; i++) {
        threshold.push(Math.pow(Math.random(), 1.35));
        noise.push(1 + Math.floor(Math.random() * 9));
      }
    }
    reseed();

    return function (dt) {
      var box = fit(canvas), ctx = box[0], w = box[1], h = box[2];
      elapsed += dt;
      var p = REDUCED ? 1 : clamp(elapsed / DURATION, 0, 1);
      if (!REDUCED && elapsed > DURATION + HOLD) { elapsed = 0; reseed(); p = 0; }
      if (++tick % 5 === 0) {
        for (var n = 0; n < 81; n++) if (Math.random() < 0.5) noise[n] = 1 + Math.floor(Math.random() * 9);
      }

      var size = Math.min(w, h) - 30, cell = size / 9;
      var ox = (w - size) / 2, oy = (h - size) / 2;
      ctx.font = "500 " + (cell * 0.6) + 'px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (var row = 0; row < 9; row++) {
        for (var col = 0; col < 9; col++) {
          var i = row * 9 + col, x = ox + col * cell, y = oy + row * cell;
          if (p >= threshold[i]) {
            var age = clamp((p - threshold[i]) / 0.05, 0, 1);
            if (age < 1) {
              ctx.fillStyle = "rgba(" + HOT_RGB + "," + 0.32 * (1 - age) + ")";
              ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
            }
            ctx.fillStyle = age < 1 ? HOT : "rgb(" + BONE + ")";
            ctx.fillText(solution[row][col], x + cell / 2, y + cell / 2);
          } else {
            ctx.fillStyle = "rgba(139,154,168," + (0.15 + 0.22 * Math.random()) + ")";
            ctx.fillText(noise[i], x + cell / 2, y + cell / 2);
          }
        }
      }

      for (var g = 0; g <= 9; g++) {
        var major = g % 3 === 0;
        ctx.strokeStyle = major ? "rgba(96,112,128,.9)" : "rgba(35,46,57,.95)";
        ctx.lineWidth = major ? 1.2 : 1;
        ctx.beginPath(); ctx.moveTo(ox + g * cell, oy); ctx.lineTo(ox + g * cell, oy + size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox, oy + g * cell); ctx.lineTo(ox + size, oy + g * cell); ctx.stroke();
      }
    };
  }

  /* ----- mounting -------------------------------------------------------- */

  var ENGINES = { fauna: faunaEngine, sudoku: sudokuEngine };

  function mount(canvas) {
    var build = ENGINES[canvas.dataset.anim];
    if (!build || !canvas.getContext) return;

    var step = build(canvas);
    var last = performance.now();
    var raf = null;
    var visible = true;

    function frame(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      step(dt);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf !== null || REDUCED) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      if (raf === null) return;
      cancelAnimationFrame(raf);
      raf = null;
    }

    step(0); /* settled first frame, drawn even under reduced motion */

    if (REDUCED) return;

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !document.hidden) start(); else stop();
      }, { rootMargin: "120px" }).observe(canvas);
    } else {
      start();
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden || !visible) stop(); else start();
    });

    window.addEventListener("resize", function () { step(0); });
  }

  function init() {
    var nodes = document.querySelectorAll("canvas[data-anim]");
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
