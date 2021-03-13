export default function patch(/** @type {number} */ width, /** @type {number} */ height, /** @type {Buffer} */ buffer1, /** @type {Buffer} */ buffer2, log = false) {
  // Ensure the buffers are of the same length so we can rely on same dimensions
  if (buffer1.length !== buffer2.length) {
    throw new Error(`Buffers are not the same length: ${buffer1.length} versus ${buffer2.length}!`);
  }

  // Ensure the buffers are both 4 bytes (RGBA) so we can use it for formulas
  const length = width * height * 4;
  if (buffer1.length !== length || buffer2.length !== length) {
    throw new Error(`Buffers are not RGBA: ${buffer1.length}, ${buffer2.length} versus ${length}!`);
  }

  // Keep an array of distinct regions which have changed pixels within them
  const regions = [];

  // Walk the pixels top to bottom vertically
  for (let y = 0; y < height; y++) {
    // Walk the pixels left to right horizontally
    for (let x = 0; x < width; x++) {
      // Calculate the 4 byte buffer index of x/y (left to right, top to bottom)
      const index = y * width * 4 + x * 4;

      // Skip over the current pixel if it does not differ between the buffers
      if (
        buffer1[index + 0] === buffer2[index + 0] && // R
        buffer1[index + 1] === buffer2[index + 1] && // G
        buffer1[index + 2] === buffer2[index + 2] && // B
        buffer1[index + 3] === buffer2[index + 3] // A
      ) {
        continue;
      }

      // Find all of the regions whose bounds are touched or crossed by pixel
      const _regions = regions
        // Determine the relationship of the point and the region
        .map(region => ({ region, relationship: calculateRelationship(x, y, region) }))
        // Throw out regions which are neither touched not crossed by pixel
        .filter(region => region.relationship !== 'miss')
        ;

      switch (_regions.length) {
        // Start a new region for this new area changed pixels for the future
        case 0: {
          const region = { left: x, top: y, right: x, bottom: y };
          regions.push(region);
          log && logCreate(x, y, region);
          break;
        }

        // Skip pixel or extend region in direction of pixel if touching bounds
        case 1: {
          const { region, relationship } = _regions[0];
          switch (relationship) {
            case 'touch-t': region.top--; break;
            case 'touch-tr': region.top--; region.right++; break;
            case 'touch-r': region.right++; break;
            case 'touch-br': region.bottom++; region.right++; break;
            case 'touch-b': region.bottom++; break;
            case 'touch-bl': region.bottom++; region.left--; break;
            case 'touch-tl': region.top--; region.left--; break;
            case 'cross': break;
            default: throw new Error(`Unexpected relationship '${relationship}'!`);
          }

          log && logUpdate(x, y, region, relationship);
          break;
        }

        // Merge multiple regions if the pixel becomes their direct connection
        default: {
          const left = Math.min(..._regions.map(region => region.region.left));
          const top = Math.min(..._regions.map(region => region.region.top));
          const right = Math.max(..._regions.map(region => region.region.right));
          const bottom = Math.max(..._regions.map(region => region.region.bottom));

          // Remove the existing regions being merged into once from the array
          for (const region of _regions) {
            regions.splice(regions.indexOf(region.region), 1);
          }

          // Add the new, combined region merging connected regions into one
          regions.push({ left, top, right, bottom });
          log && logMerge(x, y, _regions.map(region => region.region));
          break;
        }
      }
    }
  }

  // Convert regions from LTRB to XY with adjusted dimensions
  return regions.map(region => ({ x: region.left, y: region.top, width: region.right - region.left + 1, height: region.bottom - region.top + 1 }));
}

// Note that for region size 1x1, left === right and top === bottom!
function calculateRelationship(/** @type {number} */ x, /** @type {number} */ y, /** @type {{ left: number; top: number; right: number; bottom: number; }} */ region) {
  if (~~x !== x || ~~y !== y || ~~region.left !== region.left || ~~region.top !== region.top || ~~region.right !== region.right || ~~region.bottom !== region.bottom) {
    throw new Error('Fractional coordinates are not allowed in bitmaps!');
  }

  /** Note that signs have values of: 2 = missing; 1 = touching; 0 = crossing */

  // Positive = point is to the left of the region
  // Negative / zero = point crosses the region's left boundary
  const diffL = region.left - x;
  const signL = diffL <= 0 ? 0 : (diffL === 1 ? 1 : 2);

  // Positive = point is to the right of the region
  // Negative / zero = point crosses the region's right boundary
  const diffR = x - region.right;
  const signR = diffR <= 0 ? 0 : (diffR === 1 ? 1 : 2);

  // Positive = point is above the region
  // Negative / zero = point crosses the region's top boundary
  const diffT = region.top - y;
  const signT = diffT <= 0 ? 0 : (diffT === 1 ? 1 : 2);

  // Positive = point is below the region
  // Negative / zero = point crosses the region's bottom boundary
  const diffB = y - region.bottom;
  const signB = diffB <= 0 ? 0 : (diffB === 1 ? 1 : 2);

  /*
   * Note that there are several relationships the point and region may have:
   * 
   * miss | miss     | miss    | miss     | miss
   * miss | touch-tl | touch-t | touch-tr | miss
   * miss | touch-l  | crosss  | touch-r  | miss
   * miss | touch-bl | touch-b | touch-br | miss
   * miss | miss     | miss    | miss     | miss
   */
  switch (`L${signL}T${signT}R${signR}B${signB}`) {
    case 'L0T0R0B0': return 'cross';
    case 'L0T1R0B0': return 'touch-t';
    case 'L0T1R1B0': return 'touch-tr';
    case 'L0T0R1B0': return 'touch-r';
    case 'L0T0R1B1': return 'touch-br';
    case 'L0T0R0B1': return 'touch-b';
    case 'L1T0R0B1': return 'touch-bl';
    case 'L1T0R0B0': return 'touch-l';
    case 'L1T1R0B0': return 'touch-tl';
    default: return 'miss';
  }
}

function printRegion(region) {
  return `${region.left}×${region.top}-${region.right + 1}×${region.bottom + 1} (${region.right - region.left + 1}×${region.bottom - region.top + 1})`;
}

function logCreate(x, y, region) {
  console.log(`${x}×${y}: create region ${printRegion(region)}`);
}

function logUpdate(x, y, region, relationship) {
  console.log(`${x}×${y}: ${relationship === 'cross' ? 'skip' : relationship.replace('touch', 'extend')} region ${printRegion(region)}`);
}

function logMerge(x, y, regions) {
  console.log(`${x}×${y}: merge ${regions.length} now connected regions into one: ${regions.map(printRegion).join(', ')}`);
}
