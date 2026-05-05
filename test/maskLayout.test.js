import assert from "node:assert/strict";
import test from "node:test";

import { computeMaskLayout } from "../src/maskLayout.js";

test("centers masks as one line", () => {
  const layout = computeMaskLayout(
    [
      { text: "one", width: 50 },
      { text: "two", width: 70 }
    ],
    {
      frameWidth: 300,
      frameHeight: 200,
      y: 150,
      maskHeight: 40,
      minPaddingX: 10,
      relativePadding: 0,
      wordGap: 10
    }
  );

  assert.deepEqual(layout, [
    { text: "one", x: 65, y: 150, width: 70, height: 40 },
    { text: "two", x: 145, y: 150, width: 90, height: 40 }
  ]);
});

test("keeps masks inside frame bounds", () => {
  const layout = computeMaskLayout([{ text: "long", width: 500 }], {
    frameWidth: 320,
    frameHeight: 180,
    y: 999,
    maskHeight: 50
  });

  assert.equal(layout[0].x, 0);
  assert.equal(layout[0].y, 130);
  assert.equal(layout[0].width, 320);
});

test("rejects missing word measurements", () => {
  assert.throws(
    () => computeMaskLayout([{ text: "missing width" }]),
    /positive width/
  );
});
