const DEFAULTS = {
  frameWidth: 1920,
  frameHeight: 1080,
  y: 880,
  maskHeight: 68,
  minPaddingX: 18,
  relativePadding: 0.12,
  wordGap: 10
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeWords(words) {
  if (!Array.isArray(words) || words.length === 0) {
    throw new Error("words must be a non-empty array");
  }

  return words.map((word, index) => {
    const width = Number(word.width);

    if (!Number.isFinite(width) || width <= 0) {
      throw new Error(`word at index ${index} must include a positive width`);
    }

    return {
      text: String(word.text ?? ""),
      width
    };
  });
}

export function computeMaskLayout(words, options = {}) {
  const normalizedWords = normalizeWords(words);
  const settings = { ...DEFAULTS, ...options };

  if (settings.frameWidth <= 0 || settings.frameHeight <= 0) {
    throw new Error("frame dimensions must be positive");
  }

  const masks = normalizedWords.map((word) => {
    const paddingX = Math.max(
      settings.minPaddingX,
      Math.round(word.width * settings.relativePadding)
    );

    return {
      text: word.text,
      width: word.width + paddingX * 2,
      height: settings.maskHeight
    };
  });

  const totalWidth =
    masks.reduce((sum, mask) => sum + mask.width, 0) +
    settings.wordGap * (masks.length - 1);
  const boundedTotalWidth = Math.min(totalWidth, settings.frameWidth);
  let cursorX = Math.round((settings.frameWidth - boundedTotalWidth) / 2);
  const y = clamp(
    settings.y,
    0,
    Math.max(0, settings.frameHeight - settings.maskHeight)
  );

  return masks.map((mask) => {
    const width = Math.min(mask.width, settings.frameWidth);
    const x = clamp(cursorX, 0, Math.max(0, settings.frameWidth - width));
    cursorX = x + width + settings.wordGap;

    return {
      text: mask.text,
      x,
      y,
      width,
      height: mask.height
    };
  });
}
