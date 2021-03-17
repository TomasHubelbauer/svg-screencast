export default async function* cache(array, status) {
  const values = [];
  let done = defer();

  void async function () {
    if (typeof array === 'function') {
      array = array();
    }

    for await (const item of array) {
      //console.log('Caching', item);
      values.push(item);
      status.overhead = values.length;
      done.resolve(false);
      done = defer();
    }

    done.resolve(true);
  }()

  while (values.length > 0 || !await done.promise) {
    if (values.length > 0) {
      //console.log('Retrieving', values[0]);
      status.overhead = values.length - 1;
      yield values.shift();
    }
  }
}

function defer() {
  let resolve;
  let reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return { resolve, reject, promise };
}
