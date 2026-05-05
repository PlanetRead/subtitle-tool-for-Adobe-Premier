# Subtitle Tool for Adobe Premiere

Utilities for building subtitle masks with predictable alignment and spacing.

The first module in this repository focuses on the layout problem from issue #2:
subtitle masks should stay centered, respect video bounds, and keep readable
spacing between words even when word widths vary.

## Mask layout

`src/maskLayout.js` exports `computeMaskLayout(words, options)`.

It accepts measured words:

```js
const words = [
  { text: "hello", width: 92 },
  { text: "world", width: 110 }
];
```

and returns mask rectangles with `x`, `y`, `width`, and `height` values that can
be mapped into a Premiere/ExtendScript overlay layer later.

```js
import { computeMaskLayout } from "./src/maskLayout.js";

const layout = computeMaskLayout(words, {
  frameWidth: 1920,
  frameHeight: 1080,
  y: 900,
  maskHeight: 72
});
```

The layout engine supports:

- fixed or word-relative horizontal padding
- centered line alignment
- bounded positioning inside the video frame
- stable gap handling for variable-width words

## Development

```bash
npm install
npm test
```

The tests use Node's built-in `node:test` runner and do not require Adobe
Premiere.
