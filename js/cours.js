(function () {
  const ipEl = document.getElementById("tool-ip");
  const preEl = document.getElementById("tool-prefix");
  const classy = document.getElementById("tool-classful");
  const out = document.getElementById("tool-out");
  const badge = document.getElementById("tool-prefix-val");
  if (!ipEl || !out) return;

  function render() {
    const n = Net.ipToInt(ipEl.value);
    if (n === null) {
      out.innerHTML = '<p class="muted">Quatre nombres de 0 à 255, séparés par des points.</p>';
      return;
    }
    const cls = Net.classOf(n);
    const classPrefix = Net.classPrefix(cls);
    const classful = classy.checked && classPrefix;
    preEl.disabled = !!classful;
    const prefix = classful ? classPrefix : parseInt(preEl.value, 10);
    badge.textContent = "/" + prefix;
    if (!classPrefix && classy.checked) {
      out.innerHTML = `<p>Le premier octet <b>${(n >>> 24) & 255}</b> place cette adresse en classe <b>${cls}</b>. Les classes D et E ne se découpent pas en hôtes.</p>`;
      return;
    }
    const a = Net.analyze(n, prefix);
    const bits = Net.bitsOfIp(n, prefix);
    let htmlBits = '<div class="bits">';
    for (let o = 0; o < 4; o++) {
      htmlBits += '<div class="octet">';
      for (let b = 0; b < 8; b++) {
        const bit = bits[o * 8 + b];
        htmlBits += `<span class="bit ${bit.kind}">${bit.bit}</span>`;
      }
      htmlBits += "</div>";
    }
    htmlBits += "</div>";
    const firstBin = Net.toBin((n >>> 24) & 255, 8);
    out.innerHTML = `
      <p class="small muted">Bleu = partie réseau · Vert = partie hôte · Premier octet : <code>${firstBin}</code></p>
      ${htmlBits}
      <div class="stats">
        <div class="stat"><span>Classe</span><b>${a.cls}</b></div>
        <div class="stat"><span>Masque</span><b>${a.mask}</b></div>
        <div class="stat"><span>CIDR</span><b>/${a.prefix}</b></div>
        <div class="stat"><span>Réseau</span><b>${a.network}</b></div>
        <div class="stat"><span>Broadcast</span><b>${a.broadcast}</b></div>
        <div class="stat"><span>Premier hôte</span><b>${a.first || "—"}</b></div>
        <div class="stat"><span>Dernier hôte</span><b>${a.last || "—"}</b></div>
        <div class="stat"><span>Hôtes utiles</span><b>${Net.formatFr(a.hosts)}</b></div>
        <div class="stat"><span>Visibilité</span><b>${a.private ? "privée" : "publique"}</b></div>
      </div>
      <p class="small">Hôtes utiles = 2<sup>${a.hostBits}</sup> − 2 = ${Net.formatFr(a.hosts)}. Le bloc complet fait ${Net.formatFr(a.total)} adresses.</p>`;
  }

  [ipEl, preEl, classy].forEach((el) => el.addEventListener("input", render));
  classy.addEventListener("change", render);
  render();
})();
