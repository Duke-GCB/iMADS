import {DataGridContent, TEXT_TYPE, HEATMAP_TYPE} from './../app/store/DataGridContent.js';
var assert = require('chai').assert;

describe('DataGridContent', function () {
    describe('getColumnHeaders()', function () {
        it('default to empty', function () {
            let dataGridContent = new DataGridContent();
            assert.deepEqual(dataGridContent.getColumnHeaders(), []);
        });
        it('work with single text header', function () {
            let dataGridContent = new DataGridContent();
            dataGridContent.addColumn("Seq Name", "name", TEXT_TYPE);
            let expected = [
                {
                    fieldName: 'name',
                    title: 'Seq Name',
                    type: 'text',
                }
            ];
            assert.deepEqual(dataGridContent.getColumnHeaders(), expected);
        });
        it('work with multiple text header', function () {
            let dataGridContent = new DataGridContent();
            dataGridContent.addColumn("Seq Name", "name", TEXT_TYPE);
            dataGridContent.addColumn("Chrom", "chrom", TEXT_TYPE);
            let expected = [
                {
                    fieldName: 'name',
                    title: 'Seq Name',
                    type: 'text',
                },
                {
                    fieldName: 'chrom',
                    title: 'Chrom',
                    type: 'text',
                },
            ];
            assert.deepEqual(dataGridContent.getColumnHeaders(), expected);
        });
        it('work with text and heatmap', function () {
            let dataGridContent = new DataGridContent();
            dataGridContent.addColumn("Seq Name", "name", TEXT_TYPE);
            dataGridContent.addColumn("Values", "values", HEATMAP_TYPE);
            let expected = [
                {
                    fieldName: 'name',
                    title: 'Seq Name',
                    type: 'text',
                },
                {
                    fieldName: 'values',
                    title: 'Values',
                    type: 'heatmap',
                },
            ];
            assert.deepEqual(dataGridContent.getColumnHeaders(), expected);
        });
    });
    describe('getRows()', function () {
        it('default to empty', function () {
            let dataGridContent = new DataGridContent();
            assert.deepEqual(dataGridContent.getRows(), []);
        });
        it('work with two rows of single text', function () {
            let dataGridContent = new DataGridContent();
            dataGridContent.addColumn("Seq Name", "name", TEXT_TYPE);
            dataGridContent.addData({
                name:'seq01'
            });
            dataGridContent.addData({
                name: 'otherseq'
            });
            let rows = dataGridContent.getRows();
            assert.equal(rows.length, 2);
            assert.equal(rows[0].length, 1);
            assert.equal(rows[1].length, 1);

            assert.equal(rows[0][0].value, "seq01");
            assert.equal(rows[0][0].column.title, "Seq Name");
            assert.equal(rows[1][0].value, "otherseq");
            assert.equal(rows[1][0].column.type, TEXT_TYPE);
        });
        it('work with two rows of text and heatmap', function () {
            let dataGridContent = new DataGridContent();
            dataGridContent.addColumn("Seq Name", "name", TEXT_TYPE);
            dataGridContent.addColumn("Values", "values", HEATMAP_TYPE);
            dataGridContent.addData({
                name:'seq01',
                values: 'HEATMAPDATA1'
            });
            dataGridContent.addData({
                name: 'otherseq',
                values: 'HEATMAPDATA2'
            });
            let rows = dataGridContent.getRows();
            assert.equal(rows.length, 2);
            assert.equal(rows[0].length, 2);
            assert.equal(rows[1].length, 2);

            assert.equal(rows[0][0].value, "seq01");
            assert.equal(rows[0][0].column.title, "Seq Name");
            assert.equal(rows[0][1].value, "HEATMAPDATA1");
            assert.equal(rows[0][1].column.title, "Values");

            assert.equal(rows[1][0].value, "otherseq");
            assert.equal(rows[1][0].column.type, TEXT_TYPE);
            assert.equal(rows[1][1].value, "HEATMAPDATA2");
            assert.equal(rows[1][1].column.type, HEATMAP_TYPE);

        });
    });

});