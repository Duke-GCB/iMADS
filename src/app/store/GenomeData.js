class GenomeData {
    constructor(data) {
        this.data = data;
    }

    getTrackHubUrl(genome_version) {
        return this.data[genome_version].trackhub_url;
    }

}

export default GenomeData;