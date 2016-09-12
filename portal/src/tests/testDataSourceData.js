import DataSourceData from './../app/models/DataSourceData.js';
var assert = require('chai').assert;

describe('DataSourceData', function () {
    describe('formatData()', function () {
        it('return expected fields for list filtering by dataSourceType', function () {
            let fileUrl = 'http://trackhub.genome.duke.edu/gordanlab/tf-dna-binding-predictions/hg19/hg19-0003-E2F1.bb';
            let dsd = new DataSourceData();
            let inputData = [{
                dataSourceType: 'model',
                description: 'some model',
                downloaded: '2015-10-01',
                url: fileUrl
            }, {
                dataSourceType: 'prediciton',
                description: 'some prediciton',
                downloaded: '2015-10-01',
                url: fileUrl
            }];
            let expected = [{
                description: "some model",
                downloaded: '2015-10-01',
                filename: 'hg19-0003-E2F1.bb',
                url: fileUrl,
                host: 'trackhub.genome.duke.edu'
            }];
            assert.deepEqual(expected, dsd.formatData('model', inputData));
        });

        it('return expected fields for two items in a list', function () {
            let fileUrl1 = 'http://trackhub.genome.duke.edu/gordanlab/tf-dna-binding-predictions/hg19/hg19-0003-E2F0.bb';
            let fileUrl2 = 'https://trackhub.genome.duke.edu/gordanlab/tf-dna-binding-predictions/hg19/hg19-0003-E2F1.bb';
            let dsd = new DataSourceData();
            let inputData = [{
                dataSourceType: 'model',
                description: 'E2F0 classic',
                downloaded: '2015-10-01',
                url: fileUrl1
            }, {
                dataSourceType: 'model',
                description: 'E2F1 awesome',
                downloaded: '2015-10-01',
                url: fileUrl2
            }];
            let expected = [{
                description: "E2F0 classic",
                downloaded: '2015-10-01',
                filename: 'hg19-0003-E2F0.bb',
                url: fileUrl1,
                host: 'trackhub.genome.duke.edu'
            },{
                description: "E2F1 awesome",
                downloaded: '2015-10-01',
                filename: 'hg19-0003-E2F1.bb',
                url: fileUrl2,
                host: 'trackhub.genome.duke.edu'
            },
            ];
            assert.deepEqual(expected, dsd.formatData('model', inputData));
        });

        it('adds https to url if missing', function () {
            let fileUrl1 = 'trackhub.genome.duke.edu/gordanlab/tf-dna-binding-predictions/hg19/hg19-0003-E2F0.bb';
            let dsd = new DataSourceData();
            let inputData = [{
                dataSourceType: 'model',
                description: 'E2F0 classic',
                downloaded: '2015-10-01',
                url: fileUrl1
            }];
            let expected = [{
                description: "E2F0 classic",
                downloaded: '2015-10-01',
                filename: 'hg19-0003-E2F0.bb',
                url: 'https://' + fileUrl1,
                host: 'trackhub.genome.duke.edu'
            }];
            assert.deepEqual(expected, dsd.formatData('model', inputData));
        });
    });
});