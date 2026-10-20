/**
 * Traced from /media/hero/nails.webp (736 x 1104). Outlines run a few pixels
 * past each nail so clipping never trims the soft edge of the shade map.
 * Strokes run from `start` to `end`, always toward the lower left, so the
 * brush handle can stay on one side of the hand.
 */
export type NailShape = {
  id: string;
  start: [number, number];
  end: [number, number];
  width: number;
  outline: number[];
};

/** Where nails-shade.webp sits inside the photo: x, y, width, height. */
export const NAIL_SHADE_BOX = [227, 60, 245, 815] as const;

export const NAILS: NailShape[] = [
  { id: "thumb", start: [368, 67], end: [246, 220], width: 45, outline: [377, 63, 371, 61, 359, 66, 353, 65, 342, 71, 322, 87, 291, 118, 283, 128, 260, 162, 237, 211, 238, 220, 242, 222, 249, 230, 254, 231, 269, 223, 301, 189, 349, 129, 362, 118, 368, 107, 369, 96, 376, 84, 378, 66] },
  { id: "index", start: [369, 319], end: [286, 452], width: 80, outline: [369, 312, 354, 309, 331, 318, 314, 329, 296, 350, 284, 373, 279, 393, 274, 395, 271, 401, 270, 443, 272, 448, 282, 457, 287, 459, 305, 458, 346, 436, 354, 429, 378, 389, 386, 365, 386, 331, 384, 326] },
  { id: "middle", start: [386, 514], end: [246, 644], width: 85, outline: [399, 518, 392, 511, 378, 502, 369, 498, 363, 498, 344, 501, 322, 512, 304, 525, 279, 548, 265, 558, 255, 578, 250, 584, 237, 610, 235, 617, 235, 640, 239, 647, 249, 654, 262, 658, 275, 659, 312, 643, 319, 635, 331, 629, 374, 588, 395, 562, 401, 536, 401, 524] },
  { id: "ring", start: [402, 668], end: [238, 771], width: 93, outline: [408, 665, 398, 654, 388, 649, 369, 649, 304, 660, 298, 663, 288, 675, 283, 684, 272, 695, 265, 707, 256, 715, 232, 747, 228, 756, 229, 772, 236, 779, 253, 788, 268, 789, 298, 784, 347, 761, 399, 723, 412, 708, 415, 699, 415, 689] },
  { id: "pinky", start: [464, 808], end: [302, 853], width: 65, outline: [469, 806, 465, 797, 458, 789, 448, 784, 423, 783, 365, 797, 338, 808, 318, 819, 298, 839, 296, 844, 296, 856, 299, 862, 308, 868, 333, 873, 340, 873, 345, 871, 371, 872, 379, 871, 388, 867, 396, 867, 412, 862, 444, 847, 463, 834, 470, 823] },
];
