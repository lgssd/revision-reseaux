/* Calculs IPv4 partagés par le cours, le QCM et les exercices. */
(function (global) {
  function ipToInt(ip) {
    const p = String(ip).trim().split(".").map((n) => parseInt(n, 10));
    if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
    return (((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0);
  }

  function intToIp(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  }

  function prefixToMaskInt(prefix) {
    if (prefix <= 0) return 0;
    if (prefix >= 32) return 0xffffffff;
    return (0xffffffff << (32 - prefix)) >>> 0;
  }

  function maskToDotted(prefix) {
    return intToIp(prefixToMaskInt(prefix));
  }

  function maskToPrefix(mask) {
    const n = ipToInt(mask);
    if (n === null) return null;
    let bits = 0;
    let seenZero = false;
    for (let i = 31; i >= 0; i--) {
      const on = (n >>> i) & 1;
      if (on) {
        if (seenZero) return null;
        bits++;
      } else seenZero = true;
    }
    return bits;
  }

  function classOf(ip) {
    const n = typeof ip === "number" ? ip : ipToInt(ip);
    if (n === null) return null;
    const o = (n >>> 24) & 255;
    if (o <= 127) return "A";
    if (o <= 191) return "B";
    if (o <= 223) return "C";
    if (o <= 239) return "D";
    return "E";
  }

  function classPrefix(cls) {
    return { A: 8, B: 16, C: 24 }[cls] || null;
  }

  function isPrivate(ip) {
    const n = typeof ip === "number" ? ip : ipToInt(ip);
    if (n === null) return false;
    const a = (n >>> 24) & 255;
    const b = (n >>> 16) & 255;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }

  function networkInt(ipInt, prefix) {
    return (ipInt & prefixToMaskInt(prefix)) >>> 0;
  }

  function broadcastInt(ipInt, prefix) {
    const mask = prefixToMaskInt(prefix);
    return (networkInt(ipInt, prefix) | (~mask >>> 0)) >>> 0;
  }

  function analyze(ip, prefix) {
    const ipInt = typeof ip === "number" ? ip : ipToInt(ip);
    if (ipInt === null || prefix < 0 || prefix > 32) return null;
    const net = networkInt(ipInt, prefix);
    const bc = broadcastInt(ipInt, prefix);
    const total = 2 ** (32 - prefix);
    const hosts = prefix >= 31 ? 0 : total - 2;
    const cls = classOf(ipInt);
    return {
      ip: intToIp(ipInt),
      ipInt,
      prefix,
      mask: maskToDotted(prefix),
      cls,
      network: intToIp(net),
      networkInt: net,
      broadcast: intToIp(bc),
      broadcastInt: bc,
      first: prefix >= 31 ? null : intToIp(net + 1),
      last: prefix >= 31 ? null : intToIp(bc - 1),
      total,
      hosts,
      hostBits: 32 - prefix,
      private: isPrivate(ipInt),
    };
  }

  function nthHost(networkIp, n) {
    const base = typeof networkIp === "number" ? networkIp : ipToInt(networkIp);
    if (base === null) return null;
    return intToIp((base + n) >>> 0);
  }

  function sameIp(a, b) {
    const x = ipToInt(a);
    const y = ipToInt(b);
    return x !== null && x === y;
  }

  function normCidr(v) {
    const t = String(v).trim().replace(/\s/g, "");
    const m = t.match(/^\/?(\d{1,2})$/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    if (n < 0 || n > 32) return null;
    return n;
  }

  function toBin(n, bits) {
    return (n >>> 0).toString(2).padStart(bits, "0");
  }

  function bitsOfIp(ip, prefix) {
    const n = typeof ip === "number" ? ip : ipToInt(ip);
    const bin = toBin(n, 32);
    return bin.split("").map((bit, i) => ({
      bit,
      kind: i < prefix ? "net" : "host",
      index: i,
    }));
  }

  function hostsForBits(hostBits) {
    if (hostBits <= 1) return 0;
    return 2 ** hostBits - 2;
  }

  function prefixForHosts(needed) {
    let hostBits = 1;
    while (hostsForBits(hostBits) < needed) {
      hostBits++;
      if (hostBits > 24) return null;
    }
    return { hostBits, prefix: 32 - hostBits, block: 2 ** hostBits, hosts: hostsForBits(hostBits) };
  }

  function prefixForSubnets(needed, basePrefix) {
    let borrowed = 0;
    while (2 ** borrowed < needed) borrowed++;
    return { borrowed, prefix: basePrefix + borrowed, subnets: 2 ** borrowed, hosts: hostsForBits(32 - (basePrefix + borrowed)) };
  }

  function formatFr(n) {
    return Number(n).toLocaleString("fr-FR");
  }

  global.Net = {
    ipToInt, intToIp, prefixToMaskInt, maskToDotted, maskToPrefix,
    classOf, classPrefix, isPrivate, analyze, nthHost, sameIp, normCidr,
    toBin, bitsOfIp, hostsForBits, prefixForHosts, prefixForSubnets, formatFr,
  };
})(window);
