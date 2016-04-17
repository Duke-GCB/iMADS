//Creates url for connecting to the UCSC genome browser.

const BASE_URL = 'https://genome.ucsc.edu/cgi-bin/hgTracks';

class GenomeBrowserURL {
    constructor(org = 'human') {
        this.org = org;
    }

    get(db, position) {
        return BASE_URL + '?org=' + this.org + '&db=' + db + '&position=' + position;
    }

}

export default GenomeBrowserURL;