import React from 'react';

import GeneSearchPanel from './GeneSearchPanel.jsx'
import SearchResultsPanel from './SearchResultsPanel.jsx'


var GENOME_DATA2 = {
  "genomes": {
    "hg19": {
      "gene_lists": [
        "knowngene_19",
        "refgene_19"
      ],
      "models": [
        "E2F1",
        "E2F4"
      ]
    },
    "hg38": {
      "gene_lists": [
        "knowngene",
        "refgene",
        "wgEncodeGencodeBasicV23",
        "wgEncodeGencodeCompV23"
      ],
      "models": [
        "E2F1",
        "E2F4"
      ]
    }
  }
};

class SearchScreen extends React.Component {
     constructor(props) {
         super(props);
         this.state = {
             editMode: false,
             genome_data: {},
             search_results: [],
             search_settings: {},
             current_page: 1,
             next_pages: 0,
         };
         this.search = this.search.bind(this);
         this.edit = this.edit.bind(this);
         this.download_all = this.download_all.bind(this);
         this.change_page = this.change_page.bind(this);
    }

    componentDidMount() {
        console.log('fetching genome data');
        $.ajax({
          url: this.props.url,
          dataType: 'json',
            type: 'GET',
          cache: false,
          success: function(data) {
              console.log('got genome data');
            this.setState({
                genome_data: data.genomes,
            });
          }.bind(this),
          error: function(xhr, status, err) {
              console.log('done');
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        });
      }

    search(search_settings, per_page, page) {
        /*
        location.hash = '#search_results?' +
            'genome=' + state.genome +
             '&all=' + state.all +
            '&upstream=' + state.upstream +
            '&downstream=' + state.downstream +
            '&maxPredictionSort=' + state.maxPredictionSort;
        */
        this.setState({
            editMode: false,
            //search_results: [],
            search_settings: search_settings,
            page: page,
            per_page: per_page,
        });
        console.log('searching for stuff genome data' + Date.now());
        $.ajax({
          url: this.search_url(search_settings, per_page, page),
          type: 'POST',
          dataType: 'json',
          cache: false,
          success: function(data) {
              console.log('got for stuff genome data' + Date.now());
            this.setState({
                search_results: data.predictions,
                next_pages: data.next_pages,
            });
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        });
    }

    search_url(search_settings, per_page, page) {
        var url ='/genomes/' + search_settings.genome +
            '/prediction2?protein=' + search_settings.model +
            '&gene_list=' + search_settings.gene_list +
             '&upstream=' + search_settings.upstream +
            '&downstream='  + search_settings.downstream +
            '&per_page=' + per_page +
            '&page=' + page +
            '&max_prediction_sort=' + search_settings.maxPredictionSort;
        return url;
    }

    change_page(page) {
        this.search(this.state.search_settings, this.state.per_page, page)
    }

    edit() {
        this.setState({
            editMode: true,
        });
    }

    download_all(format) {
        var search_settings = this.state.search_settings;
        var url ='/genomes/' + search_settings.genome +
            '/prediction?protein=' + search_settings.model +
            '&gene_list=' + search_settings.gene_list +
             '&upstream=' + search_settings.upstream +
            '&downstream='  + search_settings.downstream +
            '&format=' + format;
        window.location.assign(url);
    }

    render () {
        if (this.state.editMode) {
            return <GeneSearchPanel genome_data={this.state.genome_data}
                                    search={this.search}
                                    search_settings={this.state.search_settings}
                                     />
        } else {
            return <SearchResultsPanel edit={this.edit}
                                       search_settings={this.state.search_settings}
                                       search_results={this.state.search_results}
                                       download_all={this.download_all}
                                       page={this.state.page}
                                       next_pages={this.state.next_pages}
                                       change_page={this.change_page}
                                       genome_data={this.state.genome_data}
                                       search={this.search}
            />
        }
    }

}

export default SearchScreen;