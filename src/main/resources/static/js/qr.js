// Standards-compliant QR Code generator (ISO/IEC 18004, Byte mode, ECC Level M, Versions 1-6)
// Renders scannable crisp SVG directly from ticketCode without external API dependencies.

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
}

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function rsComputeEcc(data, ecCount) {
  const gen = rsGeneratorPoly(ecCount);
  const rem = new Uint8Array(ecCount);
  for (const b of data) {
    const factor = b ^ rem[0];
    rem.copyWithin(0, 1);
    rem[ecCount - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < ecCount; j++) {
        rem[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }
  return rem;
}

// Version specs for ECC Level M: [version, size, totalDataCodewords, ecPerBlock, numBlocks, alignCenters]
const VERSION_SPECS = [
  { v: 1, size: 21, dataBytes: 16, ecPerBlock: 10, blocks: 1, align: [] },
  { v: 2, size: 25, dataBytes: 28, ecPerBlock: 16, blocks: 1, align: [6, 18] },
  { v: 3, size: 29, dataBytes: 44, ecPerBlock: 26, blocks: 1, align: [6, 22] },
  { v: 4, size: 33, dataBytes: 64, ecPerBlock: 18, blocks: 2, align: [6, 26] },
  { v: 5, size: 37, dataBytes: 86, ecPerBlock: 24, blocks: 2, align: [6, 30] },
  { v: 6, size: 41, dataBytes: 108, ecPerBlock: 16, blocks: 4, align: [6, 34] }
];

function encodeCodewords(bytes, spec) {
  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  // Mode indicator: Byte (0100), length (8 bits for versions 1-9)
  pushBits(0b0100, 4);
  pushBits(bytes.length, 8);
  for (const b of bytes) pushBits(b, 8);

  const capacityBits = spec.dataBytes * 8;
  const terminator = Math.min(4, capacityBits - bits.length);
  pushBits(0, terminator);
  while (bits.length % 8 !== 0) bits.push(0);

  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    let val = 0;
    for (let j = 0; j < 8; j++) val = (val << 1) | bits[i + j];
    data.push(val);
  }
  const padBytes = [0xec, 0x11];
  let p = 0;
  while (data.length < spec.dataBytes) {
    data.push(padBytes[p % 2]);
    p++;
  }

  // Split into equal blocks (all v1..v6 M have uniform block sizes)
  const blockLen = spec.dataBytes / spec.blocks;
  const dataBlocks = [];
  const eccBlocks = [];
  for (let b = 0; b < spec.blocks; b++) {
    const slice = data.slice(b * blockLen, (b + 1) * blockLen);
    dataBlocks.push(slice);
    eccBlocks.push(rsComputeEcc(slice, spec.ecPerBlock));
  }

  const out = [];
  for (let i = 0; i < blockLen; i++) {
    for (let b = 0; b < spec.blocks; b++) out.push(dataBlocks[b][i]);
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (let b = 0; b < spec.blocks; b++) out.push(eccBlocks[b][i]);
  }
  return out;
}

function buildMatrix(text) {
  const bytes = new TextEncoder().encode(String(text));
  const spec =
    VERSION_SPECS.find((s) => bytes.length + 2 <= s.dataBytes) ||
    VERSION_SPECS[VERSION_SPECS.length - 1];
  const n = spec.size;
  const codewords = encodeCodewords(bytes.slice(0, spec.dataBytes - 2), spec);

  const grid = Array.from({ length: n }, () => new Int8Array(n)); // 0 = white, 1 = black
  const isFunc = Array.from({ length: n }, () => new Uint8Array(n));

  const setFunc = (r, c, val) => {
    if (r >= 0 && r < n && c >= 0 && c < n) {
      grid[r][c] = val ? 1 : 0;
      isFunc[r][c] = 1;
    }
  };

  const drawFinder = (tr, tc) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = tr + dr;
        const c = tc + dc;
        if (r < 0 || r >= n || c < 0 || c >= n) continue;
        const dist = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
        setFunc(r, c, dist !== 2 && dist !== 4);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);

  // Timing patterns
  for (let i = 8; i < n - 8; i++) {
    setFunc(6, i, i % 2 === 0);
    setFunc(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  for (const r of spec.align) {
    for (const c of spec.align) {
      if ((r === 6 && c === 6) || (r === 6 && c === n - 7) || (r === n - 7 && c === 6)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          setFunc(r + dr, c + dc, dist !== 1);
        }
      }
    }
  }

  // Reserve format info & dark module
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      setFunc(8, i, 0);
      setFunc(i, 8, 0);
    }
  }
  for (let i = 0; i < 8; i++) {
    setFunc(8, n - 1 - i, 0);
    setFunc(n - 1 - i, 8, 0);
  }
  setFunc(n - 8, 8, 1);

  // Place data bits (mask 0: (r + c) % 2 === 0)
  const bitStream = [];
  for (const cw of codewords) {
    for (let i = 7; i >= 0; i--) bitStream.push((cw >>> i) & 1);
  }

  let idx = 0;
  let upward = true;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let step = 0; step < n; step++) {
      const r = upward ? n - 1 - step : step;
      for (let dx = 0; dx < 2; dx++) {
        const c = right - dx;
        if (!isFunc[r][c]) {
          const bit = idx < bitStream.length ? bitStream[idx++] : 0;
          const masked = (r + c) % 2 === 0 ? bit ^ 1 : bit;
          grid[r][c] = masked;
        }
      }
    }
    upward = !upward;
  }

  // Format bits for ECC Level M (00) + Mask 0 (000) -> 15-bit BCH + XOR 0x5412 = 0x5412
  const formatBits = 0x5412;
  const fbit = (i) => (formatBits >>> i) & 1;
  // Around top-left
  for (let i = 0; i <= 5; i++) grid[8][i] = fbit(14 - i);
  grid[8][7] = fbit(8);
  grid[8][8] = fbit(7);
  grid[7][8] = fbit(6);
  for (let i = 9; i < 15; i++) grid[14 - i][8] = fbit(14 - i);
  // Bottom-left and top-right
  for (let i = 0; i < 7; i++) grid[n - 1 - i][8] = fbit(14 - i);
  for (let i = 7; i < 15; i++) grid[8][n - 15 + i] = fbit(14 - i);

  return grid;
}

export function renderQrSvg(text, label = "Mã QR vé điện tử") {
  const grid = buildMatrix(text);
  const n = grid.length;
  const quiet = 3;
  const view = n + quiet * 2;
  let path = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c]) {
        path += `M${c + quiet},${r + quiet}h1v1h-1z`;
      }
    }
  }
  return `<svg viewBox="0 0 ${view} ${view}" role="img" aria-label="${label}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="${view}" height="${view}" fill="#ffffff"/><path d="${path}" fill="#11181c"/></svg>`;
}
