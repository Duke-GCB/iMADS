//Creates url for connecting to the UCSC genome browser.

const BASE_URL = 'https://genome.ucsc.edu/cgi-bin/hgTracks';

class GenomeBrowserURL {
    constructor(org = 'human', trackHubUrl = '') {
        this.org = org;
        this.trackHubUrl = trackHubUrl;
    }

    get(db, position) {
        var url = BASE_URL + '?org=' + this.org + '&db=' + db + '&position=' + position;
        if (this.trackHubUrl) {
            url += '&hubUrl=' + this.trackHubUrl;
        }
        return url;
    }

}

export default GenomeBrowserURL;