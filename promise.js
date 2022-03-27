// 构造时，接收一个函数
function MyPromise(executor) {
  const that = this;
  that.status = 'pending'; // 2.1
  that.value = undefined; // 2.1.2.2
  that.reason = undefined; // 2.1.3.2
  that.onFulfilledCallBacks = []; // 2.2.6
  that.onRejectedCallBacks = []; // 2.2.6

  function resolve(value) {
    if (that.status === 'pending') {
      that.status = 'fulfilled'; // 2.1
      that.value = value; // 2.1.2.2
      // 2.2.6.1
      that.onFulfilledCallBacks.forEach(function (fn) {
        return fn(value);
      });
    }
  }
  function reject(reason) {
    if (that.status === 'pending') {
      that.status = 'rejected'; // 2.1
      that.reason = reason; // 2.1.3.2
      // 2.2.6.2
      that.onRejectedCallBacks.forEach(function (fn) {
        return fn(reason);
      });
    }
  }

  // 捕获构造异常
  try {
    executor(resolve, reject);
  } catch (e) {
    reject(e);
  }
}

MyPromise.prototype.then = function (onFulfilled, onRejected) {
  let that = this,
    promise2; //2.2.7

  const innerOnFulfilled =
    typeof onFulfilled === 'function'
      ? onFulfilled
      : function (x) {
          return x;
        }; // 2.2.1 & 2.2.7.3
  const innerOnRejected =
    typeof onRejected === 'function'
      ? onRejected
      : function (e) {
          throw e;
        }; // 2.2.1 & 2.2.7.4

  switch (this.status) {
    case 'pending':
      // 2.2.4 & 2.2.7
      promise2 = new MyPromise((resolve, reject) => {
        // 2.2.6
        that.onFulfilledCallBacks.push(function () {
          setTimeout(function () {
            try {
              const x = innerOnFulfilled(that.value); // 2.2.2.1
              promiseResolutionProcedure(promise2, x, resolve, reject); // 2.2.7.1
            } catch (e) {
              reject(e); // 2.2.7.2
            }
          }, 0);
        });
        // 2.2.6
        that.onRejectedCallBacks.push(function () {
          setTimeout(function () {
            try {
              const x = innerOnRejected(that.reason); // 2.2.3.1
              promiseResolutionProcedure(promise2, x, resolve, reject); // 2.2.7.1
            } catch (e) {
              reject(e); // 2.2.7.2
            }
          }, 0);
        });
      });
      break;
    case 'fulfilled':
      // 2.2.4 & 2.2.7
      promise2 = new MyPromise((resolve, reject) => {
        setTimeout(function () {
          try {
            const x = innerOnFulfilled(that.value); // 2.2.2.1
            promiseResolutionProcedure(promise2, x, resolve, reject); // 2.2.7.1
          } catch (e) {
            reject(e); // 2.2.7.2
          }
        }, 0);
      });
      break;
    case 'rejected':
      // 2.2.4 & 2.2.7
      promise2 = new MyPromise((resolve, reject) => {
        setTimeout(function () {
          try {
            const x = innerOnRejected(that.reason); // 2.2.3.1
            promiseResolutionProcedure(promise2, x, resolve, reject); // 2.2.7.1
          } catch (e) {
            reject(e); // 2.2.7.2
          }
        }, 0);
      });
      break;
    default:
      break;
  }

  // 2.2.7
  return promise2;
};

function promiseResolutionProcedure(promise, x, resolve, reject) {
  // 2.3.1
  if (promise === x) {
    reject(new TypeError('Chaining cycle detected for promise'));
    return;
  }
  // 2.3.2
  if (x instanceof MyPromise) {
    x.then(
      function (xValue) {
        promiseResolutionProcedure(promise, xValue, resolve, reject);
      },
      function (xReason) {
        reject(xReason);
      }
    );
    return;
  }

  // 2.3.3
  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    try {
      const xThen = x.then; // 2.3.3.1
      // 2.3.3.3
      if (typeof xThen === 'function') {
        let multipleCalledFlag = false; // 2.3.3.3.3
        try {
          xThen.call(
            x,
            function resolvepromise(y) {
              // 2.3.3.3.3
              if (!multipleCalledFlag) {
                multipleCalledFlag = true;
                promiseResolutionProcedure(promise, y, resolve, reject); // 2.3.3.3.1
              }
            },
            function rejectPromise(r) {
              // 2.3.3.3.3
              if (!multipleCalledFlag) {
                multipleCalledFlag = true;
                reject(r); // 2.3.3.3.1
              }
            }
          );
        } catch (e) {
          // 2.3.3.3.4.1
          if (!multipleCalledFlag) {
            multipleCalledFlag = true;
            reject(e); // 2.3.3.4.2
          }
        }
      } else {
        resolve(x); // 2.3.3.4
      }
    } catch (e) {
      reject(e); // 2.3.3.2
    }
    return;
  }

  resolve(x); // 2.3.4
}

module.exports = MyPromise;
