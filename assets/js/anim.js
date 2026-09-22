/* Canvas animations for the research entries.
   Each <canvas data-anim="fauna|sudoku|nca|phip"> mounts one engine. Engines pause
   when the canvas scrolls out of view, and render a single settled frame when
   the visitor has asked for reduced motion. An engine that needs an asset is
   handed a repaint callback and fetches it from the canvas's data-src. */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var BONE = "242,237,228";
  var HOT = "#a970ff";
  var HOT_RGB = "169,112,255";
  var DIM = "#8b9aa8";   /* --dim */
  var EDGE = "#232e39";  /* --line */
  var EDGE_LIT = "#3a4a5c"; /* the card's own hover border, for the lead panel */
  var LIQ = "#6fc3e8", LIQ_RGB = "111,195,232"; /* precursor-catalyst solution */
  var N2C = "#7d8b99";   /* nitrogen, the working gas that is not the point */

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

  /* ----- engine: nca ----------------------------------------------------- */

  /* The ARC-AGI palette, indexed by cell value, exactly as the paper's figures
     use it. A rollout frame is one digit per cell, row-major. */
  var ARC = ["#000000", "#0074D9", "#FF4136", "#2ECC40", "#FFDC00",
             "#AAAAAA", "#F012BE", "#FF851B", "#7FDBFF", "#870C25"];

  /* One square grid panel. `cells` may be null, which draws the empty frame the
     card shows while the rollout is still in flight. Interior rules are dropped
     once a cell is small enough that the rule would outweigh it — which is what
     happens to the two thumbnails. */
  function arcPanel(ctx, x, y, size, n, cells, edge) {
    var cs = size / n, g, gx, gy;

    ctx.fillStyle = "#000";
    ctx.fillRect(x, y, size, size);

    if (cells) {
      for (var r = 0; r < n; r++) {
        for (var q = 0; q < n; q++) {
          var v = cells.charCodeAt(r * n + q) - 48;
          if (v < 1 || v > 9) continue; /* 0 is the background, already black */
          ctx.fillStyle = ARC[v];
          ctx.fillRect(Math.round(x + q * cs), Math.round(y + r * cs),
                       Math.ceil(cs), Math.ceil(cs));
        }
      }

      if (cs >= 5.5) {
        ctx.strokeStyle = "rgba(105,105,105,.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (g = 0; g <= n; g++) {
          gx = Math.round(x + g * cs) + 0.5; gy = Math.round(y + g * cs) + 0.5;
          ctx.moveTo(gx, y); ctx.lineTo(gx, y + size);
          ctx.moveTo(x, gy); ctx.lineTo(x + size, gy);
        }
        ctx.stroke();
      }
    }

    ctx.strokeStyle = edge;
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5,
                   Math.round(size) - 1, Math.round(size) - 1);
  }

  /* Canvas has no letter-spacing, so the panel captions are set a glyph at a
     time to carry the same tracking as the mono labels in the page's CSS.
     Passing measure:true walks the string without drawing, to right-align. */
  function tracked(ctx, x, y, text, color, px, measure) {
    ctx.font = "500 " + px + 'px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = color;
    var cx = x;
    for (var i = 0; i < text.length; i++) {
      if (!measure) ctx.fillText(text.charAt(i), cx, y);
      cx += ctx.measureText(text.charAt(i)).width + px * 0.11;
    }
    return cx - x;
  }

  function ncaEngine(canvas, repaint) {
    /* Layout: input and target stacked as thumbnails on the left, the rollout
       large on the right, each under a caption band. The trio is square-ish and
       the canvas is wide, so it is centred rather than stretched — same
       treatment the sudoku board gets. */
    var CAP = 13;             /* caption band above each panel, px */
    var FPS = 11;             /* the source figure was rendered at 10 fps */
    var HOLD = 1.3;           /* beat on the solved grid before looping, s */
    var CAP_PX = 8.5;

    /* The rollout is a recorded trajectory, not a simulation, so it arrives as
       an asset. It is only fetched for cards that name one, and the card draws
       its empty frames until it lands. */
    var data = null, clock = 0;
    var src = canvas.dataset.src;
    if (src && window.fetch) {
      fetch(src, { credentials: "same-origin" })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (json) {
          if (!json || !json.frames || !json.frames.length) return;
          data = json;
          repaint();
        })
        .catch(function () { /* the card keeps its empty panels */ });
    }

    return function (dt) {
      var box = fit(canvas), ctx = box[0], w = box[1], h = box[2];

      /* Spacing scales off the short side, so the trio keeps its proportions
         in a letterbox card and in the tall square figure on /research/. */
      var U = Math.min(w, h);
      var pad = Math.round(U * 0.055);
      var gap = Math.max(4, Math.round(U * 0.035));
      var gapX = Math.round(U * 0.075);
      /* Both columns are CAP + big tall, so the thumbnails split what is left
         of the right-hand column once their own captions are taken out:
         small = (big - CAP - gap) / 2. Substituting that into the trio's width
         gives 1.5 * big - (CAP + gap) / 2 + gapX, which is the second bound —
         without it a canvas taller than it is wide runs off the right edge. */
      var big = Math.min(h - 2 * pad - CAP,
                         (w - 2 * pad - gapX + (CAP + gap) / 2) / 1.5);
      var small = (big - CAP - gap) / 2;
      var ox = Math.max(pad, (w - (small + gapX + big)) / 2);
      var oy = Math.max(pad, (h - big - CAP) / 2);
      var bx = ox + small + gapX;
      var baseline = oy + CAP - 4;

      var n = data ? data.grid : 1;
      var last = data ? data.frames.length - 1 : 0;
      var i = last;

      if (data && !REDUCED) {
        clock += dt;
        if (clock > last / FPS + HOLD) clock = 0;
        i = clamp(Math.floor(clock * FPS), 0, last);
      }

      tracked(ctx, ox, baseline, "INPUT", DIM, CAP_PX);
      arcPanel(ctx, ox, oy + CAP, small, n, data && data.input, EDGE);

      var ty = oy + CAP + small + gap;
      tracked(ctx, ox, ty + CAP - 4, "TARGET", DIM, CAP_PX);
      arcPanel(ctx, ox, ty + CAP, small, n, data && data.target, EDGE);

      tracked(ctx, bx, baseline, "ROLLOUT", DIM, CAP_PX);
      if (data) {
        var step = "STEP " + (i < 10 ? "0" + i : i);
        var sw = tracked(ctx, 0, 0, step, HOT, CAP_PX, true);
        tracked(ctx, bx + big - sw, baseline, step, HOT, CAP_PX);
      }
      arcPanel(ctx, bx, oy + CAP, big, n, data && data.frames[i], EDGE_LIT);
    };
  }

  /* ----- engine: phip ----------------------------------------------------- */

  /* The portable PHIP polarizer of the Nature Communications paper, running the
     automated routine of its Fig. 8d: eleven steps, each naming the valves it
     switches. S4 is the one normally open valve, so it starts and ends open;
     every other S valve is normally closed. Valve states below are the paper's;
     which trunk line is drawn live is a simplification, since the real manifold
     carries more branches than survive at card size. */

  var PHIP_STAGES = ["SAMPLE INJECTION", "pH2 BUBBLING & SOT", "SAMPLE EJECTION"];
  var PHIP_START = { M1: 0, M2: 0, S1: 0, S2: 0, S3: 0, S4: 1, S5: 0, S6: 0, S7: 0 };

  var PHIP_STEPS = [
    { st: 0, name: "OPEN S5, S7, M2",      t: 0.8, set: { S5: 1, S7: 1, M2: 1 }, gas: "vent" },
    { st: 0, name: "ACTUATE SYRINGE",      t: 1.8, set: {}, act: "fill", gas: "inject" },
    { st: 0, name: "CLOSE S5, S7, M2",     t: 0.7, set: { S5: 0, S7: 0, M2: 0 } },
    { st: 1, name: "pH2 EQUALIZATION",     t: 1.1, set: { S1: 1, S6: 1 }, gas: "ph2" },
    { st: 1, name: "START BUBBLING",       t: 2.8, set: { S3: 1, S5: 1, S4: 0, S6: 0 }, act: "bubble", gas: "ph2" },
    { st: 1, name: "STOP BUBBLING",        t: 1.0, set: { S1: 0, S3: 0, S5: 0, S4: 1 } },
    { st: 1, name: "APPLY SOT",            t: 1.6, set: {}, act: "sot" },
    { st: 2, name: "pH2 DEPRESSURIZATION", t: 1.0, set: { S5: 1, S6: 1, S7: 1 }, gas: "vent" },
    { st: 2, name: "SAMPLE EJECTION",      t: 1.8, set: { M1: 1, S2: 1, S3: 1, S5: 0, S6: 0 }, act: "eject", gas: "n2" },
    { st: 2, name: "DEPRESSURIZE N2",      t: 1.0, set: { M1: 0, S2: 0, S5: 1, S6: 1 }, gas: "vent" },
    { st: 2, name: "POWER OFF ALL VALVES", t: 0.9, set: PHIP_START }
  ];

  var PHIP_TOTAL = 0;
  (function () {
    for (var i = 0; i < PHIP_STEPS.length; i++) {
      var prev = i ? PHIP_STEPS[i - 1].state : PHIP_START, state = {}, k;
      for (k in prev) state[k] = prev[k];
      for (k in PHIP_STEPS[i].set) state[k] = PHIP_STEPS[i].set[k];
      PHIP_STEPS[i].state = state;
      PHIP_STEPS[i].t0 = PHIP_TOTAL;
      PHIP_TOTAL += PHIP_STEPS[i].t;
    }
  })();

  function phipAt(clock) {
    var c = wrap(clock, PHIP_TOTAL), idx = PHIP_STEPS.length - 1;
    for (var j = 0; j < PHIP_STEPS.length; j++) {
      if (c < PHIP_STEPS[j].t0 + PHIP_STEPS[j].t) { idx = j; break; }
    }
    var step = PHIP_STEPS[idx], p = (c - step.t0) / step.t;
    /* Solution is in the tube from the moment the syringe fires until it is
       pushed back out; both edges ramp so the level reads as a movement. */
    var level = 0;
    if (idx === 1) level = p;
    else if (idx > 1 && idx < 8) level = 1;
    else if (idx === 8) level = 1 - Math.min(1, p * 1.25);
    return {
      idx: idx, step: step, level: level,
      bubbling: step.act === "bubble", sot: step.act === "sot",
      valves: step.state, gas: step.gas || null
    };
  }

  /* --- parts ------------------------------------------------------------- */

  /* Contain-fit a design box into the canvas, so one set of coordinates serves
     the letterbox card on the homepage and the square figure on /research/. */
  function contain(w, h, dw, dh, pad) {
    var s = Math.min((w - 2 * pad) / dw, (h - 2 * pad) / dh);
    return { s: s, ox: (w - dw * s) / 2, oy: (h - dh * s) / 2 };
  }

  function centred(ctx, cx, y, text, color, px) {
    tracked(ctx, cx - tracked(ctx, 0, 0, text, color, px, true) / 2, y, text, color, px);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* A valve as a labelled chip, lit while the routine holds it open. */
  function chip(ctx, x, y, w, h, label, on, px) {
    roundRect(ctx, x, y, w, h, Math.min(2.5, h / 4));
    ctx.fillStyle = on ? "rgba(" + HOT_RGB + ",0.20)" : "rgba(17,24,32,0.9)";
    ctx.fill();
    ctx.strokeStyle = on ? HOT : EDGE;
    ctx.lineWidth = 1;
    ctx.stroke();
    if (px >= 5) centred(ctx, x + w / 2, y + h / 2 + px * 0.36, label, on ? HOT : DIM, px);
  }

  /* A run of pipe. Live runs carry a marching dash in the gas's own colour. */
  function pipe(ctx, pts, lw, live, colour, t) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([]);
    ctx.strokeStyle = EDGE;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    if (!live) return;
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.max(lw - 0.6, 1);
    ctx.setLineDash([lw * 1.6, lw * 2.2]);
    ctx.lineDashOffset = -t * lw * 26;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function cylinder(ctx, cx, cy, w, h, label, live, px) {
    var x = cx - w / 2, y = cy - h / 2, r = w / 2;
    ctx.beginPath();
    ctx.moveTo(x, y + h - r * 0.4);
    ctx.lineTo(x, y + r);
    ctx.arc(cx, y + r, r, Math.PI, 0);
    ctx.lineTo(x + w, y + h - r * 0.4);
    ctx.arcTo(x + w, y + h, cx, y + h, r * 0.5);
    ctx.arcTo(x, y + h, x, y + h - r * 0.4, r * 0.5);
    ctx.closePath();
    ctx.fillStyle = live ? "rgba(" + HOT_RGB + ",0.14)" : "rgba(17,24,32,0.9)";
    ctx.fill();
    ctx.strokeStyle = live ? HOT : EDGE;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, y - h * 0.10); ctx.lineTo(cx, y);
    ctx.stroke();
    if (px >= 5) centred(ctx, cx, cy + h * 0.16, label, live ? HOT : DIM, px);
  }

  /* The 10 mm high-pressure tube: glass, solution, pH2 bubbles. */
  function reactorTube(ctx, x, y, w, h, level, bub, t) {
    /* Half the width exactly: any less and the bottom arc starts inboard of the
       walls, so the path corners across to reach it and the round bottom reads
       as a notched one. */
    var r = w / 2;

    function outline() {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + h - r);
      ctx.arc(x + w / 2, y + h - r, r, Math.PI, 0, true);
      ctx.lineTo(x + w, y);
    }

    outline();
    ctx.strokeStyle = EDGE_LIT;
    ctx.lineWidth = Math.max(1, w * 0.045);
    ctx.lineJoin = "round";
    ctx.stroke();

    var fillH = (h - r * 0.4) * 0.62 * level;
    if (fillH > 0.5) {
      ctx.save();
      outline();
      ctx.closePath();
      ctx.clip();
      var top = y + h - fillH;
      ctx.fillStyle = "rgba(" + LIQ_RGB + ",0.55)";
      ctx.fillRect(x, top, w, fillH);
      ctx.strokeStyle = LIQ;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, top + 0.5); ctx.lineTo(x + w, top + 0.5);
      ctx.stroke();

      if (bub) {
        for (var b = 0; b < 9; b++) {
          var ph = (t * 1.5 + b * 0.31) % 1;
          var by = y + h - r * 0.6 - ph * fillH;
          var bx = x + w * (0.26 + 0.48 * ((b * 0.37) % 1)) + Math.sin(ph * 7 + b) * w * 0.07;
          ctx.beginPath();
          ctx.arc(bx, by, Math.max(0.8, w * (0.06 + 0.05 * ((b * 0.53) % 1))), 0, 7);
          ctx.fillStyle = "rgba(" + HOT_RGB + "," + (0.85 * (1 - ph * 0.45)) + ")";
          ctx.fill();
        }
      }
      ctx.restore();
    }

    /* cap, and the two capillaries that reach down into the solution */
    ctx.strokeStyle = EDGE_LIT;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.22, y); ctx.lineTo(x + w + w * 0.22, y);
    ctx.stroke();
    ctx.strokeStyle = EDGE;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.32, y); ctx.lineTo(x + w * 0.32, y + h * 0.82);
    ctx.moveTo(x + w * 0.68, y); ctx.lineTo(x + w * 0.68, y + h * 0.55);
    ctx.stroke();
  }

  /* --- the schematic ------------------------------------------------------ */

  var PHIP_DW = 200, PHIP_DH = 124; /* the last 8 units are the caption band */

  function phipEngine(canvas) {
    var T = REDUCED ? PHIP_STEPS[4].t0 + 1.2 : 0;

    return function (dt) {
      var box = fit(canvas), ctx = box[0], w = box[1], h = box[2];
      T += dt;
      var s = phipAt(T);

      var f = contain(w, h, PHIP_DW, PHIP_DH, 6), k = f.s;
      function X(v) { return f.ox + v * k; }
      function Y(v) { return f.oy + v * k; }
      var px = clamp(k * 5.2, 4.2, 7.5);
      var lw = Math.max(1, k * 0.9);
      var gas = s.gas;

      /* trunk runs. The syringe pump sits off-frame, so its line enters at the
         edge — the ordinary schematic convention, and the only thing that fits. */
      pipe(ctx, [[X(138), Y(30)], [X(160), Y(30)]], lw, gas === "ph2", HOT, T);
      pipe(ctx, [[X(138), Y(74)], [X(160), Y(74)]], lw, gas === "n2", N2C, T);
      pipe(ctx, [[X(86), Y(52)], [X(70), Y(52)], [X(70), Y(22)], [X(55), Y(22)]],
           lw, gas === "ph2" || gas === "n2", gas === "n2" ? N2C : HOT, T);
      pipe(ctx, [[X(112), Y(96)], [X(112), Y(106)], [X(176), Y(106)]], lw, gas === "vent", N2C, T);
      pipe(ctx, [[X(47), Y(22)], [X(47), Y(10)], [X(64), Y(10)]], lw, s.valves.M1 === 1, LIQ, T);
      pipe(ctx, [[X(2), Y(22)], [X(41), Y(22)]], lw, gas === "inject", LIQ, T);

      cylinder(ctx, X(172), Y(30), 18 * k, 30 * k, "pH2", gas === "ph2", px);
      cylinder(ctx, X(172), Y(74), 18 * k, 30 * k, "N2", gas === "n2" || gas === "vent", px);
      if (px >= 5) tracked(ctx, X(178), Y(103), "EX.", DIM, px);

      /* the gas supply unit's seven solenoid valves */
      roundRect(ctx, X(86), Y(24), 52 * k, 72 * k, 3);
      ctx.fillStyle = "rgba(17,24,32,0.55)";
      ctx.fill();
      ctx.strokeStyle = EDGE;
      ctx.lineWidth = 1;
      ctx.stroke();
      for (var v = 0; v < 7; v++) {
        var col = v % 2, row = (v - col) / 2;
        chip(ctx, X(90) + col * 24 * k, Y(28) + row * 16 * k, 20 * k, 12 * k,
             "S" + (v + 1), s.valves["S" + (v + 1)] === 1, px);
      }

      /* magnet, reactor tube, and the two manual valves */
      roundRect(ctx, X(16), Y(38), 44 * k, 60 * k, 3);
      ctx.fillStyle = "rgba(17,24,32,0.9)";
      ctx.fill();
      ctx.strokeStyle = EDGE;
      ctx.stroke();
      reactorTube(ctx, X(41), Y(22), 14 * k, 66 * k, s.level, s.bubbling, T);

      if (s.sot) {
        ctx.strokeStyle = "rgba(" + HOT_RGB + "," + (0.55 + 0.45 * Math.sin(T * 18)) + ")";
        ctx.lineWidth = 1.2;
        for (var g = 0; g < 3; g++) {
          ctx.beginPath();
          ctx.ellipse(X(48), Y(66), (10 + g * 7) * k, (14 + g * 6) * k, 0, 0, 7);
          ctx.stroke();
        }
      }

      chip(ctx, X(64) - 1, Y(4), 18 * k, 12 * k, "M1", s.valves.M1 === 1, px);
      chip(ctx, X(6), Y(16), 18 * k, 12 * k, "M2", s.valves.M2 === 1, px);
      if (px >= 5) tracked(ctx, X(84), Y(9), "MRI", DIM, px * 0.92);

      /* caption band */
      if (px >= 5) {
        tracked(ctx, X(2), Y(122), PHIP_STAGES[s.step.st], DIM, px * 0.92);
        var nw = tracked(ctx, 0, 0, s.step.name, HOT, px * 0.92, true);
        tracked(ctx, X(198) - nw, Y(122), s.step.name, HOT, px * 0.92);
      }
    };
  }

  /* ----- mounting -------------------------------------------------------- */

  var ENGINES = { fauna: faunaEngine, sudoku: sudokuEngine, nca: ncaEngine, phip: phipEngine };

  function mount(canvas) {
    var build = ENGINES[canvas.dataset.anim];
    if (!build || !canvas.getContext) return;

    function repaint() { step(0); }

    var step = build(canvas, repaint);
    var last = performance.now();
    var raf = null;
    var visible = true;

    /* rAF hands back the frame's own timestamp, which can predate the
       performance.now() seeded above, so the first dt is floored at zero. */
    function frame(now) {
      var dt = clamp((now - last) / 1000, 0, 0.05);
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
