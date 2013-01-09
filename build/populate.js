var async      = require('async'); // NOT "asyncjs" (used elsewhere)

var options    = require('../lib/config'),
    store      = require('../lib/store')(options.store),
    routes     = require('../lib/routes'),
    handlers   = require('../lib/handlers'),
    utils      = require('../lib/utils');

// Get the full bin from an entry in the owners table

var getBin = function (ownerBin, cb) {
  // the 'id' used in the store.getBin is not acutually the id but the url. helpful.
  var data = {
    id: ownerBin.url,
    revision: ownerBin.revision
  };
  store.getBin(data, cb);
};

// Populate the summary field of the owner table

var populateBin = function (ownerBin, done) {
  console.log("%d", ownerBin.id);
  
  getBin(ownerBin, function (err, sandboxBin) {
    if (err) return done(err);
    if (!sandboxBin) return done();

    ownerBin.summary = utils.titleForBin(sandboxBin);

    if (!ownerBin.last_updated || isNaN(ownerBin.last_updated.getTime())) ownerBin.date = new Date(sandboxBin.created);

    store.touchOwnership(ownerBin, done);
  });
};

// Start

var start = 0,
    completed = 0,
    blocksize = 150;

var populate = function () {
  store.getOwnersBlock(start, blocksize, function (err, owners) {
    if (err) return console.error('getAllOwners:', err);

    async.forEachSeries(owners, populateBin, function (err) {
      if (err) return console.error('async done:', err);

      completed += owners.length;

      if (owners.length < blocksize) {
        console.log('===== done %d', completed);
      } else {
        console.log('===== block %d', completed);
        start += blocksize;
        setTimeout(populate, 1000 * 0.5);
      }
    });
  });
};

populate();