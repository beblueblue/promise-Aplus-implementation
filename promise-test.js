const MyPromise = require('./promise');

MyPromise.deferred = function () {
  let def = {};
  def.promise = new MyPromise(function (resolve, reject) {
    def.resolve = resolve;
    def.reject = reject;
  });
  return def;
};
module.exports = MyPromise;
