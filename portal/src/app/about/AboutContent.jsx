import React from 'react';
import PageTitle from '../common/PageTitle.jsx'
require('./AboutContent.css');

class AboutContent extends React.Component {
    makeAnchor(url) {
        let urlRef = "https://" + url;
        return <a href={urlRef}>{url}</a>;
    }

    render() {
        let websiteSource = this.makeAnchor("github.com/Duke-GCB/iMADS");
        let predictionSource = this.makeAnchor("github.com/Duke-GCB/Predict-TF-Binding");
        let preferenceSource = this.makeAnchor("github.com/Duke-GCB/Predict-TF-Preference");
        return <div className="AboutContent_container"><div>
            <PageTitle>About</PageTitle>
            <p className="AboutContent_paragraph">
                iMADS (<u>i</u>ntegrative <u>M</u>odeling and <u>A</u>nalysis of <u>D</u>ifferential <u>S</u>pecificity) is a combined
                computational-experimental strategy to identify and study the differences in DNA-binding specificity
                between transcription factor (TF) family members, i.e. paralogous TFs.
            </p>
            <p className="AboutContent_paragraph">
                The iMADS web application and database offers easy access to predictions made using the two types of
                models implemented in our framework:
                <br />
                1) quantitative TF-DNA binding specificity models for individual factors, trained on genomic-context
                protein-binding microarray (gcPBM) data using a core-stratified support vector regression approach.
                <br />
                2) models of differential specificity between paralogous TFs, trained on gcPBM data using weighted
                least squares regression (WLSR). The WLSR approach allows us to identify genomic sites differentially
                preferred by paralogous TFs, i.e. sites for which the difference in binding between TFs is larger than
                the variability observed in replicate experiments.
            </p>
            <div>
                <p className="AboutContent_paragraph">
                    SEARCH GENOME tab: The iMADS database contains genome-wide predictions for human genome versions
                    hg19 and hg38, for eleven TFs and ten TF pairs. These predictions can be visualized in the UCSC
                    Genome Browser, using the track hubs <a href="http://trackhub.genome.duke.edu/gordanlab/tf-dna-binding-predictions/hub.txt">
                        trackhub.genome.duke.edu/gordanlab/tf-dna-binding-predictions/hub.txt
                    </a> and <a href="http://trackhub.genome.duke.edu/gordanlab/tf-dna-preferences/hub.txt">
                        trackhub.genome.duke.edu/gordanlab/tf-dna-preferences/hub.txt
                    </a>, or directly in the iMADS
                    web application, using the graphical interface. Users can explore predictions around transcription
                    start sites (TSSs) of gene, using preloaded or custom gene lists, as well as custom lists of
                    genomic coordinates. When using preloaded gene lists, only the genes/transcripts with predicted
                    binding sites in the selected interval will be shown. When using custom gene lists, all
                    genes/transcripts will be shown, regardless of whether or not they contain predicted binding
                    sites in the selected interval.
                </p>
            </div>
            <div>
                <p className="AboutContent_paragraph">
                MAKE PREDICTIONS tab: Users can also provide custom sequences as input to obtain predictions according
                    to any binding specificity or differential binding specificity (preference) model in our framework.
                </p>
            </div>
            <p className="AboutContent_paragraph">
                All predictions can be downloaded in tab-delimited and csv formats. All data sources used in the iMADS
                web application are described in the DATA SOURCES tab.
            </p>
            <div>
                <h5 className="AboutContent_group_label">TECHNOLOGY</h5>
                <ul>
                    <li>Database management system: <a href="https://www.postgresql.org/">PostgreSQL 9.5</a></li>
                    <li>Programming languages: <a href="https://www.python.org/">python 2.7.11</a>
                        , <a href="https://www.r-project.org/">R 3.3.2</a>, <a href="http://babeljs.io">JavaScript es2015</a></li>
                    <li>Web framework: <a href="http://flask.pocoo.org/">Flask 0.10.1</a></li>
                    <li>Technical documentation also available at <a href="https://github.com/Duke-GCB/iMADS/blob/master/README.md">
                        github.com/Duke-GCB/iMADS/blob/master/README.md
                        </a>
                    </li>
                </ul>
            </div>
            <div>
                <h5 className="AboutContent_group_label">SOURCE CODE</h5>
                <ul>
                    <li>Website: <a href="https://github.com/Duke-GCB/iMADS">github.com/Duke-GCB/iMADS</a></li>
                    <li>Worker for prediction server: <a href="https://github.com/Duke-GCB/iMADS-worker">
                        github.com/Duke-GCB/iMADS-worker</a>
                    </li>
                    <li>Binding predictions for individual TFs: <a href="https://github.com/Duke-GCB/Predict-TF-Binding">
                            github.com/Duke-GCB/Predict-TF-Binding
                        </a>
                    </li>
                    <li>Preference predictions for TF1 vs. TF2: <a href="https://github.com/Duke-GCB/Predict-TF-Preference">
                            github.com/Duke-GCB/Predict-TF-Preference
                        </a></li>
                </ul>
            </div>
            <div>
                <h5 className="AboutContent_group_label">CREDITS</h5>
                <ul>
                    <li>Concept, content, and scientific requirements: Raluca Gordan (Duke University)</li>
                    <li>Computational modeling: Ning Shen, Jingkang Zhao (Duke Unviersity)</li>
                    <li>Data generation: Ning Shen, Josh Schipper, Tristan Bepler, John Horton</li>
                    <li>Database and application programming: Dan Leehr, John Bradley, Hilmar Lapp (Duke University)</li>
                    <li>Funding: NSF grant MCB-14-12045 (to Raluca Gordan); Duke Center for Genomics and Computational Biology.</li>
                </ul>
            </div>
            <div>
                <h5 className="AboutContent_group_label">CITATION</h5>
                <p  className="AboutContent_paragraph">“Integrative modeling of differential DNA-binding specificity among paralogous transcription factors”.
                    Ning Shen, Jingkang Zhao, Josh Schipper, Tristan Bepler, Dan Leehr, John Bradley, John Horton,
                    Hilmar Lapp, Raluca Gordan. <i>Submitted</i>.</p>
            </div>
            </div>
        </div>;
    }
}

export default AboutContent;
