/** RGBA pixel data in the layout a canvas `ImageData` uses. */
export interface ImageLike {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Number of RGB channels ("slots") available to carry payload bits. */
export function slotCount(image: ImageLike): number {
  return image.width * image.height * 3;
}

/**
 * Copies pixel data with alpha forced to opaque. Browsers premultiply alpha
 * on canvas, which would corrupt hidden bits in translucent pixels.
 */
export function opaqueCopy(data: Uint8ClampedArray): Uint8ClampedArray {
  const copy = new Uint8ClampedArray(data);
  for (let i = 3; i < copy.length; i += 4) copy[i] = 255;
  return copy;
}
