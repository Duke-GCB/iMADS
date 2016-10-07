//Creates url for connecting to the UCSC genome browser.

const BASE_URL = 'https://genome.ucsc.edu/cgi-bin/hgTracks';

const PREDICTION_VIEW_OFFSET = 20;
const UCSC_START_OFFSET = 1;

class GenomeBrowserURL {
    constructor(org = 'human', trackHubUrlList = []) {
        this.org = org;
        this.trackHubUrlList = trackHubUrlList;
    }

    makePosition(chrom, start, end) {
        let actualStart = parseInt(start) + UCSC_START_OFFSET;
        return chrom + ":" + actualStart  + '-' + end;
    }

    getPredictionURL(db, chrom, start, end, isPreference) {
        let actualStart = parseInt(start) - PREDICTION_VIEW_OFFSET;
        let actualEnd = parseInt(end) + PREDICTION_VIEW_OFFSET;
        let trackHubUrl = this.getTrackHubUrl(isPreference);
        return this.get(db, this.makePosition(chrom, actualStart, actualEnd), trackHubUrl);
    }

    getTrackHubUrl(isPreference) {
        for (let trackHubUrl of this.trackHubUrlList) {
            if (isPreference && trackHubUrl.preferences) {
                return trackHubUrl.preferences;
            }
            if (!isPreference && trackHubUrl.predictions) {
                return trackHubUrl.predictions;
            }
        }
        return '';
    }

    getGeneURL(db, chrom, start, end, isPreference) {
        let trackHubUrl = this.getTrackHubUrl(isPreference);
        return this.get(db, this.makePosition(chrom, start, end), trackHubUrl);
    }

    get(db, position, trackHubUrl) {
        let url = BASE_URL + '?org=' + this.org + '&db=' + db + '&position=' + position;
        if (trackHubUrl) {
            url += '&hubUrl=' + trackHubUrl;
        }
        return url;
    }

}

export default GenomeBrowserURL;