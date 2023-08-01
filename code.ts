// Interfaces and Functions

interface ColorObject {
  tints: { [key: string]: string };
  shades: { [key: string]: string };
}

interface CustomRGB {
  r: number;
  g: number;
  b: number;
  hex?: string;
}

const componentToHex = (c: number): string => {
  const hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};

const hexToRgb = (hex: string): CustomRGB | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const getTint = (color: number, factor: number): number => {
  return Math.round(color + (255 - color) * 1 * factor);
};

const getShade = (color: number, factor: number): number => {
  return Math.round(color * factor);
};

const generateTintsAndShades = (colorHex: string): ColorObject | null => {
  const color = hexToRgb(colorHex);

  if (color === null) return null;

  const colorObject: ColorObject = { tints: {}, shades: {} };
  let j = 0;

  for (let i = 0; i <= 1; i += 0.1) {
    j = Math.round(j * 10) / 10;

    const rgb: { tint: CustomRGB; shade: CustomRGB } = {
      tint: {
        r: getTint(color.r, j),
        g: getTint(color.g, j),
        b: getTint(color.b, j),
      },
      shade: {
        r: getShade(color.r, j),
        g: getShade(color.g, j),
        b: getShade(color.b, j),
      },
    };

    rgb.tint.hex = rgbToHex(rgb.tint.r, rgb.tint.g, rgb.tint.b);
    rgb.shade.hex = rgbToHex(rgb.shade.r, rgb.shade.g, rgb.shade.b);

    colorObject.tints[`${j * 10}`] = rgb.tint.hex;
    colorObject.shades[`${j * 10}`] = rgb.shade.hex;

    j += 0.1;
  }

  return colorObject;
};

// Figma plugin

figma.showUI(__html__);

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-colors') {
    const colorObject = generateTintsAndShades(msg.color);
    if (colorObject === null) {
      figma.ui.postMessage({ type: 'error', message: 'Invalid color' });
    } else {
      figma.ui.postMessage({ type: 'color-object', colorObject });

      // Create rectangles for each color in the palette
      const parentNode = figma.currentPage;
      let yOffset = 0;

      for (const tint in colorObject.tints) {
        const color = hexToRgb(colorObject.tints[tint]);
        if (color !== null) {
          const rect = figma.createRectangle();
          rect.y = yOffset;
          rect.fills = [{ type: 'SOLID', color: {r: color.r / 255, g: color.g / 255, b: color.b / 255} }];
          rect.cornerRadius = 8;
          parentNode.appendChild(rect);
          yOffset += rect.height + 10;
        }
      }

      for (const shade in colorObject.shades) {
        const color = hexToRgb(colorObject.shades[shade]);
        if (color !== null) {
          const rect = figma.createRectangle();
          rect.y = yOffset;
          rect.fills = [{ type: 'SOLID', color: {r: color.r / 255, g: color.g / 255, b: color.b / 255} }];
          parentNode.appendChild(rect);
          yOffset += rect.height + 10;
        }
      }
    }
  }
};
