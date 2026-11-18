// Mont Ventoux Online — comportements communs du site (aucun traceur, aucune bibliothèque externe).
(function () {
  var lang = document.documentElement.lang === "en" ? "en" : "fr";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ------------------------------------------------------------------
  // Menu du téléphone
  // ------------------------------------------------------------------
  var top = document.getElementById("top"), btn = document.getElementById("menu"), nav = document.getElementById("nav");
  if (top && btn && nav) {
    btn.addEventListener("click", function () {
      var open = top.classList.toggle("open");
      btn.setAttribute("aria-expanded", open); btn.textContent = open ? "✕" : "☰";
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { top.classList.remove("open"); btn.setAttribute("aria-expanded", false); btn.textContent = "☰"; }
    });
  }

  // ------------------------------------------------------------------
  // Apparition au défilement et compteurs animés
  // ------------------------------------------------------------------
  var reveals = document.querySelectorAll(".reveal");
  var counters = document.querySelectorAll("[data-count]");
  function count(el) {
    var target = parseFloat(el.getAttribute("data-count")), start = null, dur = 1400;
    var fmt = function (n) { return Math.round(n).toLocaleString(lang === "en" ? "en-GB" : "fr-FR"); };
    if (reduce) { el.textContent = fmt(target) + (el.getAttribute("data-suffix") || ""); return; }
    function step(t) {
      if (!start) start = t;
      var k = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(target * e) + (el.getAttribute("data-suffix") || "");
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        if (en.target.hasAttribute("data-count")) count(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.18 });
    [].forEach.call(reveals, function (el) { io.observe(el); });
    [].forEach.call(counters, function (el) { io.observe(el); });
  } else {
    [].forEach.call(reveals, function (el) { el.classList.add("in"); });
    [].forEach.call(counters, count);
  }

  // Bandeau d'accueil : léger défilement de l'image (parallaxe), coupé si l'utilisateur limite les animations.
  var heroImg = document.querySelector(".hero > img.bg");
  if (heroImg && !reduce) {
    window.addEventListener("scroll", function () {
      var y = Math.min(window.scrollY, 900);
      heroImg.style.transform = "translate3d(0," + (y * 0.25).toFixed(1) + "px,0) scale(1.06)";
    }, { passive: true });
  }

  // ------------------------------------------------------------------
  // Défi du mois (même calendrier que le jeu)
  // ------------------------------------------------------------------
  var box = document.getElementById("defi-widget");
  if (box && window.DEFIS) {
    var months = lang === "en"
      ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
      : ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    var now = new Date(), m = now.getMonth();
    var d = window.DEFIS[m];
    var last = new Date(now.getFullYear(), m + 1, 0).getDate(), left = last - now.getDate();
    var html = '<div class="defi-now"><span class="ico">' + d.ico + '</span><div><div class="kicker">' +
      (lang === "en" ? "Challenge of " + months[m] : "Défi de " + months[m]) + '</div><h3>' + d[lang] + '</h3><p>' + d[lang + "_t"] + '</p>' +
      '<p class="left">' + (lang === "en" ? left + " day" + (left === 1 ? "" : "s") + " left · +500 XP and a dated badge"
        : "Encore " + left + " jour" + (left === 1 ? "" : "s") + " · +500 XP et un badge daté") + '</p></div></div><ol class="defi-next">';
    for (var i = 1; i <= 3; i++) {
      var k = (m + i) % 12, n = window.DEFIS[k];
      html += '<li><span class="ico">' + n.ico + '</span><strong>' + months[k] + '</strong> · ' + n[lang] + '</li>';
    }
    box.innerHTML = html + "</ol>";
  }

  // ------------------------------------------------------------------
  // Formulaire de contact (serveur Cloudflare, aucun e-mail exposé)
  // ------------------------------------------------------------------
  var form = document.getElementById("contact-form");
  if (form) {
    var SERVER = "https://mvo-abonnement.montventouxonline.workers.dev/v1/contact";
    var sel = form.elements.rubrique, tech = document.getElementById("tech"), status = document.getElementById("form-status");
    var q = new URLSearchParams(location.search).get("rubrique");
    if (q && sel.querySelector('option[value="' + q + '"]')) sel.value = q;
    var sync = function () { tech.hidden = sel.value !== "technique"; };
    sel.addEventListener("change", sync); sync();
    var msgs = lang === "en"
      ? { ok: "Thank you! Your message has been sent. We will reply by e-mail.", email: "Please check your e-mail address.",
          message: "Your message is a little short (10 characters minimum).", nom: "Please give your name.",
          trop: "Too many messages in a short time: please try again in an hour.", err: "Sending failed: please try again in a moment." }
      : { ok: "Merci ! Votre message est bien parti. Nous vous répondrons par e-mail.", email: "Vérifiez votre adresse e-mail.",
          message: "Votre message est un peu court (10 caractères au moins).", nom: "Indiquez votre nom.",
          trop: "Trop de messages en peu de temps : réessayez dans une heure.", err: "L'envoi n'a pas abouti : réessayez dans un instant." };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements, details = "";
      if (sel.value === "technique") {
        details = [["Version", f.version.value], ["Home trainer", f.trainer.value], ["Cardio", f.cardio.value], ["Windows", f.windows.value]]
          .filter(function (x) { return x[1].trim(); }).map(function (x) { return x[0] + " : " + x[1].trim(); }).join(" | ");
      }
      var body = { rubrique: sel.value, nom: f.nom.value, email: f.email.value, sujet: f.sujet.value, message: f.message.value,
        details: details, langue: lang, site: f.site.value };
      var send = form.querySelector("button[type=submit]");
      send.disabled = true; status.className = "form-status"; status.textContent = lang === "en" ? "Sending…" : "Envoi…";
      fetch(SERVER, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (r) {
          send.disabled = false;
          if (r.ok) { form.reset(); sync(); status.className = "form-status ok"; status.textContent = msgs.ok; return; }
          status.className = "form-status err"; status.textContent = msgs[r.erreur] || msgs.err;
        })
        .catch(function () { send.disabled = false; status.className = "form-status err"; status.textContent = msgs.err; });
    });
  }

  // ------------------------------------------------------------------
  // Pages des versants : profil coloré par kilomètre, repères, chiffres
  // ------------------------------------------------------------------
  var vbox = document.getElementById("versant");
  if (vbox && window.VERSANTS) {
    var v = window.VERSANTS[vbox.getAttribute("data-key")];
    var num = function (n, dec) { return n.toLocaleString(lang === "en" ? "en-GB" : "fr-FR", { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }); };
    var color = function (g) { return g < 3 ? "#5fe07a" : g < 6 ? "#f2c418" : g < 8 ? "#f27a18" : g < 10 ? "#e8362c" : "#8f1d22"; };
    // Zone du profil de y = 90 à y = H ; au-dessus, les étiquettes des repères (étagées quand elles se touchent).
    var W = 1000, H = 340, TOP = 90, zmin = Math.floor(v.depart / 100) * 100 - 50, zmax = 1930;
    var X = function (km) { return km / v.km * W; }, Y = function (z) { return H - (z - zmin) / (zmax - zmin) * (H - TOP); };
    var svg = '<svg viewBox="0 0 ' + W + ' ' + (H + 34) + '" class="vprofile" role="img" aria-label="' +
      (lang === "en" ? "Elevation profile" : "Profil de la montée") + '">';
    v.kms.forEach(function (g, k) {
      var pts = v.profil.filter(function (p) { return p[0] >= k && p[0] <= k + 1; });
      if (pts.length < 2) return;
      var d = "M" + X(pts[0][0]).toFixed(1) + " " + H + " " + pts.map(function (p) { return "L" + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join(" ") +
        " L" + X(pts[pts.length - 1][0]).toFixed(1) + " " + H + " Z";
      svg += '<path d="' + d + '" fill="' + color(g) + '"><title>km ' + (k + 1) + ' : ' + num(g, 1) + ' %</title></path>';
      svg += '<text x="' + X(k + 0.5).toFixed(1) + '" y="' + (H + 16) + '" class="kmg">' + num(g, 0) + '</text>';
    });
    // Étiquettes de droite à gauche : une étiquette trop proche de la précédente monte d'un cran.
    var lastX = Infinity, level = 0, labels = [];
    v.reperes.slice().reverse().forEach(function (r) {
      var x = X(r.km);
      level = lastX - x < 230 ? level + 1 : 0;
      lastX = x;
      labels.push({ r: r, x: x, y: Y(r.alt), ty: Math.max(16, Y(r.alt) - 34 - level * 22) });
    });
    labels.forEach(function (l) {
      var anchor = l.x > W - 200 ? "end" : (l.x < 120 ? "start" : "middle");
      svg += '<line x1="' + l.x.toFixed(1) + '" x2="' + l.x.toFixed(1) + '" y1="' + (l.y - 4).toFixed(1) + '" y2="' + (l.ty + 6).toFixed(1) + '" class="mark"/>' +
        '<circle cx="' + l.x.toFixed(1) + '" cy="' + l.y.toFixed(1) + '" r="5" class="dot"/>' +
        '<text x="' + (anchor === "end" ? l.x - 8 : l.x).toFixed(1) + '" y="' + l.ty.toFixed(1) + '" class="lbl" text-anchor="' + anchor + '">' + l.r[lang] + '</text>';
    });
    svg += '<text x="0" y="' + (H + 32) + '" class="axis">' + (lang === "en" ? "gradient of each km (%)" : "pente de chaque km (%)") + '</text></svg>';
    var stats = [[num(v.km, 1) + " km", lang === "en" ? "distance" : "distance"], ["+" + num(v.dplus) + " m", lang === "en" ? "climbing" : "dénivelé"],
      [num(v.pente, 1) + " %", lang === "en" ? "average gradient" : "pente moyenne"], [num(v.pente_max_km, 1) + " %", lang === "en" ? "hardest km" : "kilomètre le plus dur"],
      [num(v.depart) + " → " + num(1912) + " m", lang === "en" ? "from the village to the top" : "du village au sommet"]];
    vbox.innerHTML = '<div class="vstats">' + stats.map(function (s) { return '<div><strong>' + s[0] + '</strong><span>' + s[1] + '</span></div>'; }).join("") +
      '</div>' + svg + '<ul class="vmarks">' + v.reperes.map(function (r) {
        return '<li><strong>km ' + num(r.km, 1) + '</strong> · ' + r[lang] + ' <span>(' + num(r.alt) + ' m)</span></li>';
      }).join("") + '</ul>';
  }
})();
