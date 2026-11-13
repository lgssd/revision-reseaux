(function () {
  const PLAN = [
    { name: "Clientèle", need: 480, prefix: 23, network: "172.16.0.0", first: "172.16.0.1", last: "172.16.1.254", broadcast: "172.16.1.255" },
    { name: "Administration", need: 115, prefix: 25, network: "172.16.2.0", first: "172.16.2.1", last: "172.16.2.126", broadcast: "172.16.2.127" },
    { name: "DMZ", need: 28, prefix: 27, network: "172.16.2.128", first: "172.16.2.129", last: "172.16.2.158", broadcast: "172.16.2.159" },
    { name: "Liaison", need: 2, prefix: 30, network: "172.16.2.160", first: "172.16.2.161", last: "172.16.2.162", broadcast: "172.16.2.163" },
  ];

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function box(ok, why) {
    return `<div class="callout ${ok ? "rule" : "trap"}"><span class="tag">${ok ? "Juste" : "À corriger"}</span>${why}</div>`;
  }

  function checkAgg() {
    const raw = document.getElementById("agg").value.trim().replace(/\s+/g, "");
    const m = raw.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d{1,2})$/);
    const good = "192.168.32.0/22";
    let html;
    if (m && Net.sameIp(m[1], "192.168.32.0") && Number(m[2]) === 22) {
      html = box(true, "192.168.32.0/22 couvre exactement .32, .33, .34 et .35.");
    } else {
      let why = "Les quatre réseaux tiennent dans un bloc de 4 × /24, donc deux bits de moins : /22. Le début du bloc est aligné sur un multiple de 4 : 32, pas 0 ni 33.";
      if (m && Number(m[2]) === 23) why = "/23 ne couvre que deux /24 (.32 et .33). .34 et .35 restent dehors.";
      if (m && Number(m[2]) === 21) why = "/21 couvre huit /24, de .32 à .39. Tu résumes plus que les quatre routes demandées.";
      if (m && Number(m[2]) === 22 && !Net.sameIp(m[1], "192.168.32.0")) why = "Le /22 est la bonne taille, mais l’adresse réseau est le début du bloc. 32 en binaire se termine par 00, c’est déjà aligné : 192.168.32.0/22.";
      html = box(false, why + ` Réponse : <b>${good}</b>.`);
      Journal.logError({ topic: "Agrégation", prompt: "Agréger 192.168.32.0/24 à 192.168.35.0/24", yours: raw || "vide", correct: good, why });
    }
    document.getElementById("agg-why").innerHTML = html;
  }

  function checkPlan() {
    const notes = [];
    let bad = 0;
    PLAN.forEach((sn, i) => {
      const read = (key) => document.querySelector(`[data-sn="${i}"][data-k="${key}"]`).value;
      const pairs = [
        ["network", "Adresse réseau", sn.network],
        ["prefix", "CIDR", "/" + sn.prefix],
        ["first", "Premier hôte", sn.first],
        ["last", "Dernier hôte", sn.last],
        ["broadcast", "Broadcast", sn.broadcast],
      ];
      pairs.forEach(([key, label, good]) => {
        const el = document.querySelector(`[data-sn="${i}"][data-k="${key}"]`);
        const raw = el.value.trim();
        const ok = key === "prefix"
          ? /^\/\d{1,2}$/.test(raw) && Net.normCidr(raw) === sn.prefix
          : Net.sameIp(raw, good);
        el.classList.toggle("ok", ok);
        el.classList.toggle("bad", !ok && raw !== "");
        if (!ok) {
          bad++;
          const fit = Net.prefixForHosts(sn.need);
          let why = `${sn.name} demande ${sn.need} hôtes. 2^${fit.hostBits} − 2 = ${fit.hosts}, donc /${sn.prefix}, bloc de ${fit.block} adresses.`;
          if (key === "network") why += ` Le réseau de ce bloc est ${sn.network}. Le bloc suivant commence toujours au broadcast précédent + 1, et il tombe sur un multiple de la taille du bloc.`;
          if (key === "first") why += ` Premier hôte = ${sn.network} + 1.`;
          if (key === "broadcast") why += ` Broadcast = dernière adresse du bloc, ${sn.broadcast}.`;
          if (key === "last") why += ` Dernier hôte = broadcast − 1 = ${sn.last}.`;
          if (key === "prefix" && /^\d+$/.test(raw)) why += " Écris le slash : /" + sn.prefix + ".";
          notes.push(`<p><b>${esc(sn.name)} · ${esc(label)}.</b> ${why}</p>`);
          if (raw) {
            Journal.logError({
              topic: "VLSM " + sn.name,
              prompt: sn.name + " — " + label,
              yours: raw,
              correct: key === "prefix" ? "/" + sn.prefix : good,
              why,
            });
          }
        }
      });
    });
    document.getElementById("plan-why").innerHTML = bad
      ? box(false, notes.join("") + "<p>Les besoins se traitent dans cet ordre : 480, puis 115, puis 28, puis 2. Le réseau de départ est 172.16.0.0/22, qui finit à 172.16.3.255.</p>")
      : box(true, "Les quatre zones sont placées sans trou et sans chevauchement, de 172.16.0.0 jusqu’à 172.16.2.163. Il reste de la place jusqu’à 172.16.3.255.");
  }

  function checkPanne() {
    const choice = document.querySelector("input[name=panne]:checked");
    const n1 = document.getElementById("panne-a").value;
    const n2 = document.getElementById("panne-b").value;
    const choiceOk = choice && choice.value === "split";
    const aOk = Net.sameIp(n1, "192.168.4.128");
    const bOk = Net.sameIp(n2, "192.168.4.160");
    let why;
    if (choiceOk && aOk && bOk) {
      why = box(true, "158 est le dernier hôte de 192.168.4.128/27. 161 est le premier hôte du réseau suivant, 192.168.4.160/27. Ils ont besoin d’un routeur pour se joindre.");
    } else {
      why = box(false, `Un /27 coupe de 32 en 32 : 0, 32, 64, 96, <b>128</b>, <b>160</b>, 192, 224. 158 est encore dans le bloc 128–159. 161 est déjà dans le bloc 160–191. Le masque écrit est le même, le réseau ne l’est pas. ${
        choice && choice.value === "bc" ? "158 n’est pas le broadcast : le broadcast du bloc est .159." : ""
      } ${
        choice && choice.value === "same" ? "Deux adresses avec /27 ne sont dans le même réseau que si elles tombent dans le même bloc de 32." : ""
      } Réseau du serveur : 192.168.4.128. Réseau de la passerelle : 192.168.4.160.`);
      Journal.logError({
        topic: "Panne /27",
        prompt: "192.168.4.158/27 et 192.168.4.161/27",
        yours: `${choice ? choice.value : "aucun choix"} | ${n1 || "?"} | ${n2 || "?"}`,
        correct: "réseaux différents | 192.168.4.128 | 192.168.4.160",
        why: "Blocs de 32 : 158 dans 128–159, 161 dans 160–191.",
      });
    }
    document.getElementById("panne-why").innerHTML = why;
  }

  document.getElementById("agg-btn").addEventListener("click", checkAgg);
  document.getElementById("plan-btn").addEventListener("click", checkPlan);
  document.getElementById("panne-btn").addEventListener("click", checkPanne);
})();
