//Creates url for connecting to the UCSC genome browser.

const BASE_URL = 'https://genome.ucsc.edu/cgi-bin/hgTracks';

const PREDICTION_VIEW_OFFSET = 20;
const UCSC_START_OFFSET = 1;

class GenomeBrowserURL {
    constructor(org = 'human', trackHubUrl = '') {
        this.org = org;
        this.trackHubUrl = trackHubUrl;
    }

    makePosition(chrom, start, end) {
        let actualStart = parseInt(start) + UCSC_START_OFFSET;
        return chrom + ":" + actualStart  + '-' + end;
    }

    getPredictionURL(db, chrom, start, end) {
        let actualStart = parseInt(start) - PREDICTION_VIEW_OFFSET;
        let actualEnd = parseInt(end) + PREDICTION_VIEW_OFFSET;
        return this.get(db, this.makePosition(chrom, actualStart, actualEnd));
    }

    getGeneURL(db, chrom, start, end) {
        return this.get(db, this.makePosition(chrom, start, end));
    }

    get(db, position) {
        let url = BASE_URL + '?org=' + this.org + '&db=' + db + '&position=' + position;
        if (this.trackHubUrl) {
            url += '&hubUrl=' + this.trackHubUrl;
        }
        return url;
    }

}

export default GenomeBrowserURL;