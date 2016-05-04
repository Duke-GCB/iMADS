class GenomeData {
    constructor(data) {
        this.data = data;
    }

    getTrackHubUrl(genomeVersion) {
        return this.data[genomeVersion].trackhubUrl;
    }

}

export default GenomeData;
