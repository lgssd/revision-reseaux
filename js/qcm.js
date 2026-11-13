(function () {
  const stage = document.getElementById("stage");
  if (!stage) return;

  const $ = (s) => document.querySelector(s);
  let tab = "classful";
  let exam = false;
  let locked = false;
  let current = null;
  let picked = null;
  const stats = { ok: 0, bad: 0, streak: 0 };

  const THEORY = [
    {
      q: "Combien de bits contient une adresse IPv4 ?",
      choices: ["16 bits, soit 2 octets", "32 bits, soit 4 octets", "48 bits, soit 6 octets", "128 bits, soit 8 octets"],
      answer: 1,
      why: "IPv4 = 32 bits, écrits en 4 octets de 0 à 255. 128 bits, c’est IPv6. 48 bits, c’est une adresse MAC.",
    },
    {
      q: "Par quels bits commence une adresse de classe B ?",
      choices: ["0", "10", "110", "1110"],
      answer: 1,
      why: "A commence par 0, B par 10, C par 110, D par 1110, E par 1111. Ces bits sont dans le premier octet.",
    },
    {
      q: "Quelle est la plage du premier octet en classe C ?",
      choices: ["1 à 126", "128 à 191", "192 à 223", "224 à 239"],
      answer: 2,
      why: "192 à 223, c’est la classe C. 1 à 126 = A (127 est le loopback). 128 à 191 = B. 224 à 239 = D, le multicast.",
    },
    {
      q: "Quel est le masque par défaut d’une classe B ?",
      choices: ["255.0.0.0 (/8)", "255.255.0.0 (/16)", "255.255.255.0 (/24)", "255.255.255.128 (/25)"],
      answer: 1,
      why: "Classe A : /8. Classe B : /16, les deux premiers octets identifient le réseau. Classe C : /24. /25 est déjà un découpage, pas un masque de classe.",
    },
    {
      q: "Combien d’hôtes utiles dans un réseau de classe C ?",
      choices: ["256", "255", "254", "128"],
      answer: 2,
      why: "Il y a 2⁸ = 256 adresses au total. On retire l’adresse réseau (.0) et le broadcast (.255). Il reste 254 machines. 256 compte ces deux adresses spéciales comme si on pouvait les donner à un PC.",
    },
    {
      q: "Laquelle de ces adresses est privée ?",
      choices: ["172.15.4.8", "172.16.4.8", "172.32.4.8", "192.169.1.4"],
      answer: 1,
      why: "La plage privée « 172 » va de 172.16.0.0 à 172.31.255.255. 172.15 et 172.32 sont publiques. 192.168.x.x est privée, mais 192.169 ne l’est pas.",
    },
    {
      q: "Que vaut le 200ᵉ hôte utilisable du réseau 10.0.0.0 ?",
      choices: ["10.0.0.200", "10.0.0.201", "10.0.1.200", "10.0.0.199"],
      answer: 0,
      why: "Le 1ᵉʳ hôte est réseau + 1. Le N-ième hôte est donc réseau + N. 10.0.0.0 + 200 = 10.0.0.200. Ajouter 201 compte le +1 une deuxième fois. 199 oublie que le .1 est déjà le premier.",
    },
    {
      q: "Pourquoi retranche-t-on 2 dans la formule 2ⁿ − 2 ?",
      choices: [
        "Pour retirer le sous-réseau zéro et le sous-réseau tout-à-1",
        "Pour retirer l’adresse réseau et l’adresse de broadcast",
        "Pour retirer la passerelle et le serveur DNS",
        "Parce qu’un octet commence à 0 et finit à 254",
      ],
      answer: 1,
      why: "Les deux adresses inutilisables pour une machine sont l’adresse du réseau (hôtes à 0) et le broadcast (hôtes à 1). Le nombre de sous-réseaux, lui, vaut 2^bits empruntés, sans retirer 2.",
    },
    {
      q: "On veut 31 machines dans un sous-réseau. Quel CIDR choisir ?",
      choices: ["/27 (30 hôtes)", "/26 (62 hôtes)", "/28 (14 hôtes)", "/25 (126 hôtes) est obligatoire"],
      answer: 1,
      why: "/27 donne 2⁵ − 2 = 30 hôtes : une machine de trop ne rentre pas. /26 donne 62 hôtes, c’est le plus petit bloc suffisant. /25 marche aussi mais gaspille davantage : en VLSM on prend le plus petit bloc qui contient le besoin.",
    },
    {
      q: "On veut au moins 5 sous-réseaux dans un classe C. Quel masque ?",
      choices: ["255.255.255.192 (/26)", "255.255.255.224 (/27)", "255.255.255.240 (/28)", "255.255.255.128 (/25)"],
      answer: 1,
      why: "/26 emprunte 2 bits : 2² = 4 sous-réseaux, trop juste. /27 emprunte 3 bits : 2³ = 8 ≥ 5. On ne retire pas 2 au nombre de sous-réseaux.",
    },
    {
      q: "Dans un plan VLSM, dans quel ordre place-t-on les besoins ?",
      choices: [
        "Du plus petit nombre d’hôtes au plus grand",
        "Dans l’ordre des noms de salles",
        "Du plus grand nombre d’hôtes au plus petit",
        "L’ordre n’a aucune importance",
      ],
      answer: 2,
      why: "On classe du plus gros besoin au plus petit. Sinon un petit bloc se place au milieu de l’espace et le gros bloc suivant n’est plus aligné : les plages se chevauchent ou débordent.",
    },
    {
      q: "Quelle route résume 172.16.8.0/24, .9.0/24, .10.0/24 et .11.0/24 ?",
      choices: ["172.16.8.0/22", "172.16.8.0/23", "172.16.0.0/16", "172.16.8.0/21"],
      answer: 0,
      why: "Quatre /24 contigus demandent 2 bits de moins : /24 − 2 = /22. En binaire, 8 à 11 partagent 000010. Le réseau aligné est 172.16.8.0/22. /23 n’en couvre que deux. /21 en couvre huit, jusqu’à .15.",
    },
    {
      q: "192.168.4.158/27 et 192.168.4.161/27 peuvent-ils se parler directement ?",
      choices: [
        "Oui, ils ont le même masque /27",
        "Oui, parce que 161 − 158 = 3, ils sont voisins",
        "Non : .158 est dans 192.168.4.128/27 et .161 dans 192.168.4.160/27",
        "Non, parce que .158 est une adresse de broadcast",
      ],
      answer: 2,
      why: "Un /27 avance de 32 en 32 : …128, 160, 192. 158 est le dernier hôte de 192.168.4.128/27 (broadcast .159). 161 est le premier hôte de 192.168.4.160/27. Même masque écrit à côté de l’IP, deux réseaux différents.",
    },
    {
      q: "Quelle affirmation décrit le CIDR ?",
      choices: [
        "Il impose les masques /8, /16 et /24 uniquement",
        "Il indique, avec un suffixe /n, combien de bits de gauche forment le réseau",
        "Il remplace l’adresse IP par un nom",
        "Il réserve les classes D et E aux particuliers",
      ],
      answer: 1,
      why: "CIDR = Classless Inter-Domain Routing. /n dit que les n bits de gauche sont le réseau. On peut donc couper où on veut, et agréger plusieurs routes en une seule.",
    },
    {
      q: "127.0.0.1 correspond à quoi ?",
      choices: ["Au réseau privé de classe A", "À l’adresse de loopback de la machine", "Au multicast", "À la passerelle par défaut"],
      answer: 1,
      why: "Tout le bloc 127.0.0.0/8 est le loopback : le paquet revient sur la machine elle-même. Le motif binaire est celui d’une classe A, mais ce bloc n’est pas un réseau d’entreprise.",
    },
    {
      q: "Un lien entre deux routeurs demande 2 adresses utiles. Quel masque est ajusté ?",
      choices: ["/24", "/30", "/31 est le seul possible en cours", "/16"],
      answer: 1,
      why: "/30 donne 2² − 2 = 2 hôtes. C’est le bloc du cours pour une liaison point à point. /24 en fournirait 254, presque toutes perdues.",
    },
    {
      q: "Combien de réseaux de classe A le tableau du cours retient-il ?",
      choices: ["256", "128", "126", "127"],
      answer: 2,
      why: "Le premier bit vaut 0, ce qui donne 128 valeurs (0 à 127). Le cours retire 0.0.0.0/8 et 127.0.0.0/8. Il reste les réseaux 1 à 126, donc 126 réseaux.",
    },
    {
      q: "Quelle est l’adresse de broadcast de 172.16.5.40/16 ?",
      choices: ["172.16.5.255", "172.16.255.255", "172.16.5.40", "172.255.255.255"],
      answer: 1,
      why: "En /16, les deux premiers octets sont le réseau (172.16) et les deux derniers sont les hôtes. Le broadcast met les hôtes à 1 : 172.16.255.255. 172.16.5.255 serait le broadcast d’un /24.",
    },
  ];

  let theoryOrder = shuffle(THEORY.map((_, i) => i));
  let theoryPos = 0;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function fold(s) {
    return String(s).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function rand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  function makeClassful() {
    const roll = rand(0, 2);
    let oct, cls;
    if (roll === 0) { cls = "A"; oct = [rand(1, 126), rand(0, 255), rand(0, 255), rand(0, 255)]; }
    else if (roll === 1) { cls = "B"; oct = [rand(128, 191), rand(0, 255), rand(0, 255), rand(0, 255)]; }
    else { cls = "C"; oct = [rand(192, 223), rand(0, 255), rand(0, 255), rand(0, 255)]; }
    const prefix = Net.classPrefix(cls);
    const a = Net.analyze(oct.join("."), prefix);
    const n = cls === "C" ? rand(2, 253) : rand(2, 400);
    const fields = ["classe", "masque", "reseau", "broadcast", "premier", "dernier"];
    const level = $("#diff").value;
    if (level !== "facile") fields.push("nieme");
    if (level === "difficile") fields.push("cidr", "visibilite");
    return {
      kind: "classful",
      ip: a.ip,
      oct,
      cls,
      prefix,
      n,
      fields,
      answers: {
        classe: cls,
        masque: a.mask,
        cidr: "/" + prefix,
        reseau: a.network,
        broadcast: a.broadcast,
        premier: a.first,
        dernier: a.last,
        visibilite: a.private ? "privée" : "publique",
        nieme: Net.nthHost(a.networkInt, n),
      },
    };
  }

  function makeVlsm(kind) {
    const a = rand(0, 255);
    const b = rand(0, 255);
    const c = rand(0, 255);
    const base = `192.${a}.${b}.${c}.0`;
    if (kind === "lire") {
      const cidr = rand(25, 30);
      const borrowed = cidr - 24;
      const hostBits = 32 - cidr;
      return {
        kind: "vlsm-lire",
        title: "Lecture d’un masque",
        prompt: `Réseau ${base}, masque ${Net.maskToDotted(cidr)} (/${cidr}).`,
        fields: [
          { id: "hosts", label: "Hôtes utiles par sous-réseau", answer: String(Net.hostsForBits(hostBits)) },
          { id: "subs", label: "Nombre de sous-réseaux", answer: String(2 ** borrowed) },
        ],
        meta: { cidr, borrowed, hostBits, base },
      };
    }
    if (kind === "subs") {
      const borrowed = rand(1, 6);
      const cidr = 24 + borrowed;
      const hi = 2 ** borrowed;
      const lo = 2 ** (borrowed - 1) + 1;
      const roll = Math.random();
      const want = roll < 0.4 ? lo : roll < 0.7 ? hi : rand(lo, hi);
      return {
        kind: "vlsm-subs",
        title: "Trouver le masque à partir des sous-réseaux",
        prompt: `Depuis ${base}/24, on veut au moins ${want} sous-réseaux.`,
        fields: [
          { id: "mask", label: "Masque décimal", answer: Net.maskToDotted(cidr) },
          { id: "cidr", label: "Notation CIDR (avec le /)", answer: "/" + cidr, slash: true },
        ],
        meta: { cidr, borrowed, want, base },
      };
    }
    const hostBits = rand(2, 7);
    const cidr = 32 - hostBits;
    const hi = 2 ** hostBits - 2;
    const lo = Math.max(2, 2 ** (hostBits - 1) - 1);
    const roll = Math.random();
    const want = roll < 0.4 ? lo : roll < 0.7 ? hi : rand(lo, hi);
    return {
      kind: "vlsm-hosts",
      title: "Trouver le masque à partir des machines",
      prompt: `Depuis ${base}/24, chaque sous-réseau doit accueillir au moins ${want} machines.`,
      fields: [
        { id: "mask", label: "Masque décimal", answer: Net.maskToDotted(cidr) },
        { id: "cidr", label: "Notation CIDR (avec le /)", answer: "/" + cidr, slash: true },
        { id: "subs", label: "Sous-réseaux obtenus", answer: String(2 ** (cidr - 24)) },
        { id: "bits", label: "Bits empruntés au classe C", answer: String(cidr - 24) },
      ],
      meta: { cidr, hostBits, want, base, borrowed: cidr - 24 },
    };
  }

  function nextQuestion() {
    locked = false;
    picked = null;
    if (tab === "classful") current = makeClassful();
    else if (tab === "vlsm") {
      const kinds = ["lire", "subs", "hosts"];
      current = makeVlsm(kinds[rand(0, 2)]);
    } else {
      if (theoryPos >= theoryOrder.length) {
        theoryOrder = shuffle(THEORY.map((_, i) => i));
        theoryPos = 0;
      }
      current = { kind: "theory", item: THEORY[theoryOrder[theoryPos++]], index: theoryPos, total: THEORY.length };
    }
    render();
  }

  function fieldOk(field, raw) {
    const ans = current.answers[field];
    const v = String(raw || "");
    if (field === "classe") return fold(v) === fold(ans);
    if (field === "masque" || field === "reseau" || field === "broadcast" || field === "premier" || field === "dernier" || field === "nieme") {
      return Net.sameIp(v, ans);
    }
    if (field === "cidr") return Net.normCidr(v) === Net.normCidr(ans);
    if (field === "visibilite") {
      const f = fold(v);
      if (ans === "privée") return f.startsWith("priv");
      return f.startsWith("pub");
    }
    return fold(v) === fold(ans);
  }

  function vlsmFieldOk(field, raw) {
    if (field.slash) {
      const t = String(raw).trim();
      if (!/^\/\d{1,2}$/.test(t)) return false;
      return Net.normCidr(t) === Net.normCidr(field.answer);
    }
    if (field.answer.includes(".")) return Net.sameIp(raw, field.answer);
    return String(raw).trim() === String(field.answer);
  }

  function explainClassful(field, raw) {
    const a = current.answers;
    const o = current.oct;
    const you = String(raw || "").trim() || "vide";
    const good = a[field];
    const head = `<p><b>Ta réponse :</b> <span class="mine">${esc(you)}</span><br><b>Réponse attendue :</b> <span class="mine">${esc(good)}</span></p>`;
    const bin = Net.toBin(o[0], 8);
    if (field === "classe") {
      return head + `<p>Le premier octet vaut <b>${o[0]}</b> (<code>${bin}</code>). ${
        current.cls === "A" ? "Il commence par 0, et il est entre 1 et 126 : classe A." :
        current.cls === "B" ? "Il commence par 10, et il est entre 128 et 191 : classe B." :
        "Il commence par 110, et il est entre 192 et 223 : classe C."
      } La classe ne se devine pas avec les octets du milieu.</p>`;
    }
    if (field === "masque" || field === "cidr") {
      return head + `<p>En adressage par classes, le masque suit la classe, pas l’adresse précise. Classe ${current.cls} → <b>${a.masque}</b>, soit <b>${a.cidr}</b>. ${
        field === "cidr" && Net.normCidr(you) === current.prefix
          ? "Le nombre est le bon : écris-le avec le slash si l’énoncé montre la notation /n."
          : "Un /25, /26 ou /27 serait un découpage VLSM. Ici le QCM demande le masque d’origine de la classe."
      }</p>`;
    }
    if (field === "reseau") {
      let hint = "On recopie les octets réseau et on met les octets hôte à 0.";
      if (current.cls === "A") hint = `Classe A : seul ${o[0]} reste. Les trois autres octets passent à 0 → ${good}.`;
      if (current.cls === "B") hint = `Classe B : ${o[0]}.${o[1]} reste. Les deux derniers octets passent à 0 → ${good}.`;
      if (current.cls === "C") hint = `Classe C : ${o[0]}.${o[1]}.${o[2]} reste. Le dernier octet passe à 0 → ${good}.`;
      if (Net.sameIp(you, current.ip)) hint += " Tu as recopié l’adresse de la machine : ce n’est l’adresse réseau que si la partie hôte est déjà à 0.";
      if (current.cls === "A" && Net.sameIp(you, `${o[0]}.${o[1]}.${o[2]}.0`)) hint += " Tu as appliqué un /24. Sur une classe A, les octets 2, 3 et 4 sont des hôtes.";
      if (current.cls === "A" && Net.sameIp(you, `${o[0]}.${o[1]}.0.0`)) hint += " Tu as appliqué un /16. Sur une classe A, un seul octet identifie le réseau.";
      if (current.cls === "B" && Net.sameIp(you, `${o[0]}.${o[1]}.${o[2]}.0`)) hint += " Tu as appliqué un /24. En classe B, le 3ᵉ octet fait encore partie des hôtes.";
      return head + `<p>${hint}</p>`;
    }
    if (field === "broadcast") {
      let hint = "Le broadcast met toute la partie hôte à 1, donc à 255 sur chaque octet hôte.";
      if (Net.sameIp(you, a.dernier)) hint += " Tu as donné le dernier hôte. Le broadcast est une adresse plus loin.";
      if (Net.sameIp(you, a.reseau)) hint += " Tu as donné l’adresse réseau, celle où les hôtes valent 0.";
      if (current.cls !== "C" && Net.sameIp(you, `${o[0]}.${o[1]}.${o[2]}.255`)) hint += " Mettre seulement le dernier octet à 255, c’est le réflexe du /24.";
      return head + `<p>${hint} Ici : <b>${good}</b>.</p>`;
    }
    if (field === "premier" || field === "dernier") {
      let hint = field === "premier"
        ? `Le premier hôte est l’adresse réseau plus 1 : ${a.reseau} + 1 = ${a.premier}. L’adresse réseau elle-même n’est pas attribuable.`
        : `Le dernier hôte est le broadcast moins 1 : ${a.broadcast} − 1 = ${a.dernier}. Le broadcast sert à parler à tout le réseau, pas à une machine.`;
      if (field === "premier" && Net.sameIp(you, a.reseau)) hint = "Tu as rendu l’adresse réseau. Elle désigne le réseau entier, aucun PC ne la porte.";
      if (field === "dernier" && Net.sameIp(you, a.broadcast)) hint = "Tu as rendu le broadcast. On le retire des hôtes utiles, d’où le −2 de la formule.";
      return head + `<p>${hint}</p>`;
    }
    if (field === "visibilite") {
      const priv = a.visibilite === "privée";
      return head + `<p>${priv
        ? `Cette adresse tombe dans une plage privée : 10.0.0.0/8, 172.16.0.0–172.31.255.255, ou 192.168.0.0/16. Ici ${current.ip} est privée.`
        : `${current.ip} n’entre dans aucune des trois plages privées. 172.x n’est privé que de 172.16 à 172.31, et 192.x n’est privé que pour 192.168.`
      }</p>`;
    }
    const base = Net.ipToInt(a.reseau);
    const yours = Net.ipToInt(you);
    let extra = `Le ${current.n}ᵉ hôte = adresse réseau + ${current.n}. ${a.reseau} + ${current.n} = ${good}.`;
    if (yours !== null && yours === (base + current.n + 1) >>> 0) {
      extra += " Tu as ajouté 1 de trop : le premier hôte est déjà « réseau + 1 », donc le N-ième est « réseau + N ».";
    } else if (yours !== null && yours === (base + current.n - 1) >>> 0) {
      extra += " Tu es un cran trop tôt : tu as compté l’adresse réseau comme si c’était le premier hôte.";
    } else if (/\.(\d{3,})/.test(you) || (you.split(".").pop() && Number(you.split(".").pop()) > 255)) {
      extra += " Un octet s’arrête à 255. Le surplus se reporte sur l’octet de gauche (retenue).";
    } else if (current.cls === "A" && current.n >= 256) {
      extra += ` ${current.n} dépasse 255 : ${Math.floor(current.n / 256)} passe sur l’octet d’à côté, et il reste ${current.n % 256}.`;
    }
    return head + `<p>${extra}</p>`;
  }

  function explainVlsm(field, raw) {
    const m = current.meta;
    const you = String(raw || "").trim() || "vide";
    const good = field.answer;
    const head = `<p><b>Ta réponse :</b> <span class="mine">${esc(you)}</span><br><b>Réponse attendue :</b> <span class="mine">${esc(good)}</span></p>`;
    if (current.kind === "vlsm-lire" && field.id === "hosts") {
      const total = 2 ** m.hostBits;
      return head + `<p>Bits hôtes = 32 − ${m.cidr} = ${m.hostBits}. Adresses du bloc = 2^${m.hostBits} = ${total}. Hôtes utiles = ${total} − 2 = ${good}. Le −2 retire le réseau et le broadcast. ${
        String(you).trim() === String(total) ? "Tu as donné la taille du bloc, pas le nombre de machines." : ""
      }</p>`;
    }
    if ((current.kind === "vlsm-lire" && field.id === "subs") || field.id === "subs" || field.id === "bits") {
      return head + `<p>Sur un /24, les bits empruntés = CIDR − 24 = ${m.borrowed}. Nombre de sous-réseaux = 2^${m.borrowed} = ${2 ** m.borrowed}. On ne retire pas 2 : le premier et le dernier sous-réseau sont utilisables. ${
        String(you).trim() === String(2 ** m.borrowed - 2) ? "Tu as appliqué le −2 des hôtes au nombre de sous-réseaux." : ""
      }</p>`;
    }
    if (field.id === "cidr" && /^\d{1,2}$/.test(you.trim()) && Number(you.trim()) === m.cidr) {
      return head + `<p>Le nombre ${m.cidr} est juste. Dans ce type de question, la notation attendue s’écrit avec le slash : /${m.cidr}.</p>`;
    }
    if (field.id === "mask" || field.id === "cidr") {
      if (current.kind === "vlsm-subs") {
        const tooSmall = m.borrowed - 1;
        return head + `<p>Il faut 2^n ≥ ${m.want}. 2^${tooSmall} = ${2 ** tooSmall}, ce n’est pas assez. 2^${m.borrowed} = ${2 ** m.borrowed}, ça couvre le besoin. On emprunte ${m.borrowed} bits au /24, donc le masque passe à /${m.cidr} (${Net.maskToDotted(m.cidr)}).</p>`;
      }
      const capPrev = Net.hostsForBits(m.hostBits - 1);
      return head + `<p>Il faut 2^n − 2 ≥ ${m.want}. Avec ${m.hostBits - 1} bits hôtes, on n’a que ${capPrev} machines. Avec ${m.hostBits} bits, on en a ${Net.hostsForBits(m.hostBits)}. Le CIDR vaut 32 − ${m.hostBits} = /${m.cidr}, masque ${Net.maskToDotted(m.cidr)}.</p>`;
    }
    return head + "<p>Repars de la formule affichée dans l’énoncé, avec les nombres de cette question.</p>";
  }

  function grade() {
    if (locked) return;
    if (current.kind === "theory") {
      if (picked === null) return;
      locked = true;
      const ok = picked === current.item.answer;
      settle(ok, current.item.q, current.item.choices[picked], current.item.choices[current.item.answer], current.item.why);
      render();
      return;
    }
    const inputs = [...stage.querySelectorAll("[data-field]")];
    if (inputs.some((el) => !el.value.trim())) {
      let note = document.getElementById("need");
      if (!note) {
        note = document.createElement("p");
        note.id = "need";
        note.className = "callout trap";
        note.innerHTML = "<span class=\"tag\">Il manque des cases</span>Chaque zone compte. Une case vide n’est pas une réponse, le correcteur ne peut pas t’expliquer une erreur que tu n’as pas encore écrite.";
        stage.appendChild(note);
      }
      return;
    }
    locked = true;
    const details = [];
    let allOk = true;
    if (current.kind === "classful") {
      inputs.forEach((el) => {
        const ok = fieldOk(el.dataset.field, el.value);
        if (!ok) allOk = false;
        details.push({ field: el.dataset.field, label: el.dataset.label, raw: el.value, ok, why: ok ? "" : explainClassful(el.dataset.field, el.value) });
      });
    } else {
      inputs.forEach((el) => {
        const field = current.fields[Number(el.dataset.field)];
        const ok = vlsmFieldOk(field, el.value);
        if (!ok) allOk = false;
        details.push({ field: field.id, label: field.label, raw: el.value, ok, why: ok ? "" : explainVlsm(field, el.value) });
      });
    }
    current.details = details;
    const wrong = details.filter((d) => !d.ok);
    settle(allOk, promptText(), wrong.map((d) => d.label + " : " + d.raw).join(" | "), wrong.map((d) => d.label).join(", "), wrong.map((d) => d.why.replace(/<[^>]+>/g, " ")).join(" "));
    render();
  }

  function promptText() {
    if (current.kind === "classful") return "Adresse " + current.ip;
    if (current.kind === "theory") return current.item.q;
    return current.prompt;
  }

  function settle(ok, enonce, yours, correct, why) {
    if (ok) { stats.ok++; stats.streak++; }
    else {
      stats.bad++;
      stats.streak = 0;
      Journal.logError({
        topic: tab === "classful" ? "IPv4 classes" : tab === "vlsm" ? "VLSM / CIDR" : "Cours",
        prompt: enonce,
        yours: yours || "—",
        correct: correct || "—",
        why: why || "",
      });
    }
  }

  function renderStats() {
    const errWord = stats.bad > 1 ? "erreurs" : "erreur";
    $("#stats").textContent = `${stats.ok} juste${stats.ok > 1 ? "s" : ""} · ${stats.bad} ${errWord} · série ${stats.streak}`;
  }

  function render() {
    renderStats();
    if (current.kind === "theory") {
      const item = current.item;
      stage.innerHTML = `
        <div class="q-head"><span class="pill">Théorie ${current.index}/${current.total}</span></div>
        <h2>${esc(item.q)}</h2>
        <div class="choices">${item.choices.map((c, i) => {
          let cls = "choice";
          if (locked && i === item.answer) cls += " good";
          else if (locked && i === picked && i !== item.answer) cls += " bad";
          else if (!locked && i === picked) cls += " sel";
          return `<button class="${cls}" data-choice="${i}" ${locked ? "disabled" : ""}>${esc(c)}</button>`;
        }).join("")}</div>
        ${locked ? `<div class="callout ${picked === item.answer ? "rule" : "trap"}"><span class="tag">${picked === item.answer ? "Juste" : "Pourquoi"}</span>${item.why}</div>
        <div class="row" style="margin-top:12px"><button class="btn primary" id="next">Question suivante</button></div>` : `<button class="btn primary" id="check" ${picked === null ? "disabled" : ""}>Vérifier</button>`}`;
      return;
    }

    if (current.kind === "classful") {
      const netCount = current.cls === "A" ? 1 : current.cls === "B" ? 2 : 3;
      const ipHtml = exam
        ? esc(current.ip)
        : current.oct.map((v, i) => `<span style="color:${i < netCount ? "var(--blue)" : "var(--teal)"}">${v}</span>`).join('<span class="muted">.</span>');
      const blocks = current.fields.map((id) => {
        const labels = {
          classe: "Classe (A, B ou C)",
          masque: "Masque par défaut",
          cidr: "CIDR",
          reseau: "Adresse réseau",
          broadcast: "Broadcast",
          premier: "Premier hôte",
          dernier: "Dernier hôte",
          visibilite: "Publique ou privée",
          nieme: current.n + "ᵉ hôte utilisable",
        };
        const det = current.details?.find((d) => d.field === id);
        const cls = det ? (det.ok ? "ok" : "bad") : "";
        const shown = det ? det.raw : (current.draft?.[id] || "");
        return `<label class="field" style="flex:1;min-width:220px">${labels[id]}
          <input data-field="${id}" data-label="${labels[id]}" class="${cls}" ${locked ? "disabled" : ""} value="${esc(shown)}">
        </label>`;
      }).join("");
      const why = locked ? current.details.filter((d) => !d.ok).map((d) =>
        `<div class="callout trap"><span class="tag">${esc(d.label)}</span>${d.why}</div>`
      ).join("") : "";
      const okBanner = locked && current.details.every((d) => d.ok)
        ? `<div class="callout rule"><span class="tag">Tout est juste</span>Classe ${current.cls}, réseau ${current.answers.reseau}, broadcast ${current.answers.broadcast}, hôtes ${current.answers.premier} → ${current.answers.dernier}.</div>` : "";
      stage.innerHTML = `
        <div class="q-head"><span class="pill">${exam ? "Examen" : "Entraînement"} · ${esc($("#diff").selectedOptions[0].textContent)}</span></div>
        <p class="kicker">Adresse proposée</p>
        <h2 style="font-family:var(--mono)">${ipHtml}</h2>
        ${exam ? "" : '<p class="small muted">Bleu = octets réseau de la classe, vert = octets hôte. Décoche « indices visuels » pour le mode examen.</p>'}
        <div class="row" style="margin-top:12px">${blocks}</div>
        ${okBanner}${why}
        <div class="row" style="margin-top:14px">
          ${locked ? '<button class="btn primary" id="next">Adresse suivante</button>' : '<button class="btn primary" id="check">Vérifier et m’expliquer</button>'}
        </div>`;
      return;
    }

    const blocks = current.fields.map((f, i) => {
      const det = current.details?.find((d) => d.field === f.id);
      return `<label class="field" style="flex:1;min-width:220px">${esc(f.label)}
        <input data-field="${i}" class="${det ? (det.ok ? "ok" : "bad") : ""}" ${locked ? "disabled" : ""} value="${det ? esc(det.raw) : ""}">
      </label>`;
    }).join("");
    const why = locked ? current.details.filter((d) => !d.ok).map((d) =>
      `<div class="callout trap"><span class="tag">${esc(d.label)}</span>${d.why}</div>`
    ).join("") : "";
    const okBanner = locked && current.details.every((d) => d.ok)
      ? `<div class="callout rule"><span class="tag">Tout est juste</span>Les formules collent aux nombres de l’énoncé.</div>` : "";
    stage.innerHTML = `
      <div class="q-head"><span class="pill">VLSM</span></div>
      <h2>${esc(current.title)}</h2>
      <p>${esc(current.prompt)}</p>
      <div class="row">${blocks}</div>
      ${okBanner}${why}
      <div class="row" style="margin-top:14px">
        ${locked ? '<button class="btn primary" id="next">Autre calcul</button>' : '<button class="btn primary" id="check">Vérifier et m’expliquer</button>'}
      </div>`;
  }

  stage.addEventListener("click", (e) => {
    const choice = e.target.closest("[data-choice]");
    if (choice && !locked) {
      picked = Number(choice.dataset.choice);
      render();
      return;
    }
    if (e.target.id === "check") grade();
    if (e.target.id === "next") nextQuestion();
  });
  stage.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const btn = $("#check");
      if (btn) grade();
    }
  });

  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      tab = btn.dataset.tab;
      document.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
      $("#diff-wrap").style.display = tab === "classful" ? "flex" : "none";
      $("#exam-wrap").style.display = tab === "classful" ? "flex" : "none";
      nextQuestion();
    });
  });
  $("#diff").addEventListener("change", nextQuestion);
  $("#exam").addEventListener("change", () => {
    exam = $("#exam").checked;
    if (current?.kind === "classful" && !locked) {
      current.draft = {};
      stage.querySelectorAll("[data-field]").forEach((el) => { current.draft[el.dataset.field] = el.value; });
      render();
    }
  });

  nextQuestion();
})();
