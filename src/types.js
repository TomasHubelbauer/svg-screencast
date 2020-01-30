/** @typedef {{
 * x: number;
 * y: number;
 * width: number;
 * height: number;
 * }} Region */
/** @typedef {{
 * extension: string;
 * prolog: (name: string, width: number, height: number, dataUrl: string) => string;
 * frameProlog: (stamp: number, regions: Region[]) => string;
 * frame: (frame: number, stamp: number, region: Region, dataUrl: string) => string;
 * frameEpilog: (dataUrl: string) => string;
 * epilog: (name: string) => string;
 * }} Fluff */
