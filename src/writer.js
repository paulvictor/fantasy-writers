var daggy = require('daggy'),
    combinators = require('fantasy-combinators'),

    Tuple2 = require('fantasy-tuples').Tuple2,
    identity = combinators.identity,

    Writer = daggy.tagged('run');

Writer.of = function(x) {
  return Writer(function() {
    return Tuple2(x, {concat: identity});
  });
};

Writer.prototype.chain = function(f) {
  var self = this;
  return Writer(function() {
    var result = self.run(),
        t = f(result._1).run();
    return Tuple2(t._1, result._2.concat(t._2));
  });
};

Writer.prototype.tell = function(y) {
  var self = this;
  return Writer(function () {
    var result = self.run();
    return Tuple2(null, result._2.concat(y));
  });
};

Writer.prototype.map = function(f) {
  return this.chain(function(a) {
    return Writer(function() {
      return Tuple2(f(a), { concat: identity });
    });
  });
};

Writer.prototype.ap = function(b) {
  return this.chain(function(a) {
    return b.map(a);
  });
};

Writer.WriterT = function(M) {

  var WriterT = function(x, y) {
    this.run = function() {
      return Tuple2(x, y || { concat: id });
    };
  };

  WriterT.of = function(x) {
    return new WriterT(M.of(x), { concat: id });
  };

  WriterT.lift = function(m) {
    return new WriterT(m, { concat: id } );
  };

  WriterT.prototype.chain = function(f) {
    var self = this;
    return overrideMethod(new WriterT(), 'run', function() {
      var result = self.run();
      var m = result._1.chain(f);
      return Tuple2(m, result._2);
    });
  };

  WriterT.prototype.map = function(f) {
    return this.chain(function(a) {
      return WriterT.of(a._1.map(f), { concat: id });
    });
  };

  WriterT.prototype.ap = function(b) {
    return this.chain(function(f) {
      return b.map(f);
    });
  };

  return WriterT;
};

if (typeof module != 'undefined')
  module.exports = Writer;