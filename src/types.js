/** @typedef {{
 * x: number;
 * y: number;
 * width: number;
 * height: number;
 * }} Region */
/** @typedef {{
 * extension: string;
 * prolog: (name: string, width: number, height: number, dataUrl: string) => string;
 * frame: (frame: number, stamp: number, region: Region, dataUrl: string) => string;
 * epilog: () => string;
 * }} Fluff */
