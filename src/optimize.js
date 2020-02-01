require('./types');

// TODO: Prototype the various optimizations here and set up benchmarks for them
module.exports = function optimize(/** @type {Region[]} */ ...regions) {
  // TODO: Fix the below optimization borking everything
  return regions;

  const merged = [];
  const merges = [];
  for (let index = 0; index < regions.length - 1 /* Last has nowhere to advance to */; index++) {
    // Try each subsequent region for any given region
    for (let advance = index + 1; advance < regions.length; advance++) {
      const region1 = regions[index];

      // TODO: Remove this and instead post-process the merges to merge overlapping merges
      if (merged.includes(region1)) {
        continue;
      }

      const area1 = region1.width * region1.height;
      const region2 = regions[advance];

      // TODO: Remove this and instead post-process the merges to merge overlapping merges
      if (merged.includes(region2)) {
        continue;
      }

      const area2 = region2.width * region2.height;

      const x1 = Math.min(region1.x, region2.x);
      const x2 = Math.max(region1.x, region2.x);
      const y1 = Math.min(region1.y, region2.y);
      const y2 = Math.max(region1.y, region2.y);
      const area = (x2 - x1) * (y2 - y1);

      if (area / (area1 + area2) < 2) {
        merged.push(region1);
        merged.push(region2);
        merges.push({ x: x1, y: y1, width: x2 - x1, height: y2 - y1 });
      }
    }
  }

  // Stop if there are no more merges
  if (merges.length === 0) {
    return regions;
  }

  // Take only the unmerged regions and concatenate the resulting merged regions
  const length = regions.length;
  regions = regions.filter(region => !merged.includes(region)).concat(merges);
  console.log('Reduced', length, 'regions into', regions.length, 'regions');

  // TODO: Retry so that merges which now could also merge among themselves can
  //return optimize(...merges);

  return regions;
};
