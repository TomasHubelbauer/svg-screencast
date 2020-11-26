/** @typedef {{
 * x: number;
 * y: number;
 * width: number;
 * height: number;
 * }} Region */
/** @typedef {{
 * region: Region;
 * dataUrl: string;
 * }} Patch */
/** @typedef {{
 * extension: string;
 * prolog: (name: string, width: number, height: number, dataUrl: string) => string;
 * frame: (frame: number, stamp: number, patches: Patch[]) => string;
 * epilog: () => string;
 * }} Fluff */
