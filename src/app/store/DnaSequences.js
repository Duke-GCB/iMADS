const ENDPOINT = '/api/v1/genomes/';

class DnaSequences {
    constructor(genome) {
        this.genome = genome;
        this.ranges = [];
    }

    add_range_request(name, chrom, start, end) {
        this.ranges.push({
            name: name,
            chrom: chrom,
            start: start.toString(),
            end: end.toString(),
        });
    }

    fetch_ranges(onData, onError) {
        let ranges = this.ranges;
        let url = ENDPOINT + this.genome + '/sequences';
        $.ajax({
            url: url,
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            type: 'POST',
            cache: false,
            data: JSON.stringify({
                ranges: ranges,
            }),
            success: function (data) {
                onData(data.sequences);
            }.bind(this),
            error: function (xhr, status, err) {
                onError('Error fetching dna sequences' + err);
                console.log('Error fetching dna sequences' + err);
            }.bind(this)
        });
    }

}

export default DnaSequences;