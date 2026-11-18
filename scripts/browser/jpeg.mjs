import assert from 'node:assert/strict';

export function jpegSize(bytes) {
  assert.equal(bytes.readUInt16BE(0), 0xffd8, 'Screenshot is a JPEG');
  let offset = 2;
  while (offset + 8 < bytes.length) {
    assert.equal(bytes[offset++], 0xff);
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++], length = bytes.readUInt16BE(offset);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
    offset += length;
  }
  throw new Error('JPEG has no image dimensions');
}
export function checkScreenshot(bytes) {
  const dimensions = jpegSize(bytes), { width, height } = dimensions;
  assert.ok(bytes.length <= 256 * 1024, 'Screenshot is at most 256 KiB');
  assert.ok(Math.max(width, height) <= 1280, 'Long side is at most 1280');
  assert.ok(Math.min(width, height) >= 480, 'Short side is at least 480');
  return dimensions;
}
