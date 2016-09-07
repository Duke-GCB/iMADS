import GenomeBrowserURL from './../app/models/GenomeBrowserURL.js';
var assert = require('chai').assert;

describe('GenomeBrowserURL', function () {
    describe('get()', function () {
        it('should return UCSC url for a db and location', function () {
            var genomeBrowserUrl = new GenomeBrowserURL();
            var expected = 'https://genome.ucsc.edu/cgi-bin/hgTracks?org=human&db=hg38&position=chr20:33675683-33686404'
            assert.equal(expected, genomeBrowserUrl.get('hg38', 'chr20:33675683-33686404'));
        });
    });
});