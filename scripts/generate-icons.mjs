import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to create a CRC32 table and compute CRC32
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

// Generate an RGBA buffer of size x size depicting a modern teal shield with inner check/lock
function drawShield(size) {
  const buf = Buffer.alloc(size * size * 4);
  const center = size / 2;
  const radius = size * 0.44;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Normalized coordinates -1 to 1
      const nx = (x - center) / radius;
      const ny = (y - center * 0.85) / radius;

      // Shield boundary calculation
      // Top curved or flat, bottom tapering to a point (ny = 1 - nx^2)
      const inTop = ny >= -0.75 && ny <= 0.1 && Math.abs(nx) <= 0.82;
      const inBottom = ny > 0.1 && ny <= 1.05 && Math.abs(nx) <= (1.05 - ny * 0.75);
      const isShield = (inTop || inBottom) && Math.abs(nx) <= 0.85;

      if (isShield) {
        // Gradient from bright teal (#14b8a6) to deep ocean blue (#0f766e)
        const t = (ny + 0.75) / 1.8;
        const r = Math.round(13 * (1 - t) + 15 * t);
        const g = Math.round(184 * (1 - t) + 118 * t);
        const b = Math.round(166 * (1 - t) + 110 * t);

        // Draw inner white checkmark / emblem
        // Checkmark points: (-0.35, 0.05) -> (-0.05, 0.35) -> (0.35, -0.2)
        const d1 = distToSegment(nx, ny, -0.32, 0.08, -0.06, 0.36);
        const d2 = distToSegment(nx, ny, -0.06, 0.36, 0.36, -0.22);
        const minD = Math.min(d1, d2);

        if (minD < 0.1) {
          // White checkmark with antialiasing
          const alphaCheck = Math.max(0, Math.min(1, (0.1 - minD) / 0.03));
          buf[idx] = Math.round(255 * alphaCheck + r * (1 - alphaCheck));
          buf[idx + 1] = Math.round(255 * alphaCheck + g * (1 - alphaCheck));
          buf[idx + 2] = Math.round(255 * alphaCheck + b * (1 - alphaCheck));
          buf[idx + 3] = 255;
        } else {
          // Subtle border highlight
          const borderDist = Math.min(Math.abs(Math.abs(nx) - 0.82), Math.abs(ny + 0.75));
          if (borderDist < 0.06) {
            buf[idx] = Math.min(255, r + 40);
            buf[idx + 1] = Math.min(255, g + 40);
            buf[idx + 2] = Math.min(255, b + 40);
          } else {
            buf[idx] = r;
            buf[idx + 1] = g;
            buf[idx + 2] = b;
          }
          buf[idx + 3] = 255;
        }
      } else {
        // Transparent outside shield
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0;
      }
    }
  }
  return buf;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function encodePNG(width, height, rgbaBuffer) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = writeChunk('IHDR', ihdr);

  // Scanlines with filter type 0 (None)
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0; // Filter None
    rgbaBuffer.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idatData = zlib.deflateSync(scanlines);
  const idatChunk = writeChunk('IDAT', idatData);

  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createICO(pngBuffers) {
  // ICONDIR header
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const entries = [];
  const images = [];

  for (const { size, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry[2] = 0; // color palette
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset of image data
    entries.push(entry);
    images.push(buffer);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...entries, ...images]);
}

const buildDir = path.resolve(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

console.log('Generating crisp multi-size shield icons...');
const sizes = [16, 32, 48, 64, 128, 256];
const pngEntries = sizes.map((size) => {
  const rgba = drawShield(size);
  const png = encodePNG(size, size, rgba);
  return { size, buffer: png };
});

// Save 256x256 as icon.png
const png256 = pngEntries.find((e) => e.size === 256).buffer;
fs.writeFileSync(path.join(buildDir, 'icon.png'), png256);

// Save 32x32 as tray.png
const png32 = pngEntries.find((e) => e.size === 32).buffer;
fs.writeFileSync(path.join(buildDir, 'tray.png'), png32);

// Save ICO containing all sizes
const icoData = createICO(pngEntries);
fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoData);
fs.writeFileSync(path.join(buildDir, 'tray.ico'), icoData);

console.log('Icons generated successfully in build/');
