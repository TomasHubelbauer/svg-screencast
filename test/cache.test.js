import cache from '../cache.js';

async function* produce() {
  for (let index = 0; index < 10; index++) {
    // await wait(100);
    console.log('Producing', index);
    yield index;
  }
}

async function* consume(array) {
  for await (const item of array) {
    // await wait(100);
    console.log('Consuming', item);
    yield item;
  }
}

// TODO: Toggle wait comments to test these producer/consumer scenarios:
// 1. No delay in either: overhead rises, peaks, falls (pyramid/sawtooth)
// 2. Fast producer, slow consumer: overhead peaks fast, falls slow
// 3. Slow producer, fast consumer: no overhead
// 4. Similar delay in both: overhead stays at one
void async function () {
  const overhead = {};
  for await (const item of consume(cache(produce(), overhead))) {
    void item;
    console.log('Overhead', overhead.overhead, '|'.repeat(overhead.overhead));
  }
}()

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
