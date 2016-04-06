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
             genome_data_loaded: false,
             search_data_loaded: false,
         };
         this.search = this.search.bind(this);
         this.edit = this.edit.bind(this);
         this.download_all = this.download_all.bind(this);
         this.change_page = this.change_page.bind(this);
    }

    componentDidMount() {
        $.ajax({
          url: this.props.url,
          dataType: 'json',
            type: 'GET',
          cache: false,
          success: function(data) {
            this.setState({
                genome_data: data.genomes,
                genome_data_loaded: true,
            });
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        });
      }

    search(search_settings, page) {
        this.setState({
            editMode: false,
            //search_results: [],
            search_settings: search_settings,
            page: page,
            per_page: this.props.items_per_page,
            search_data_loaded: false,
        });
        $.ajax({
          url: this.search_url(search_settings, this.props.items_per_page, page),
          type: 'POST',
          dataType: 'json',
          cache: false,
          success: function(data) {
            this.setState({
                search_results: data.predictions,
                next_pages: data.next_pages,
                search_data_loaded: true,
            });
          }.bind(this),
          error: function(xhr, status, err) {
              console.error(this.props.url, status, err.toString());
          }.bind(this)
        });
    }

    search_url(search_settings, per_page, page) {
        var url ='/api/v1/genomes/' + search_settings.genome +
            '/prediction?protein=' + search_settings.model +
            '&gene_list=' + search_settings.gene_list +
             '&upstream=' + search_settings.upstream +
            '&downstream='  + search_settings.downstream +
            '&per_page=' + per_page +
            '&page=' + page +
            '&include_all=' + search_settings.all +
            '&max_prediction_sort=' + search_settings.maxPredictionSort;
        if (search_settings.maxPredictionSort) {
            url += "&max_prediction_guess=0.4";
        }
        return url;
    }

    change_page(page) {
        this.search(this.state.search_settings, page)
    }

    edit() {
        this.setState({
            editMode: true,
        });
    }

    download_all(format) {
        var search_settings = this.state.search_settings;
        var url ='/api/v1/genomes/' + search_settings.genome +
            '/prediction?protein=' + search_settings.model +
            '&gene_list=' + search_settings.gene_list +
            '&upstream=' + search_settings.upstream +
            '&downstream='  + search_settings.downstream +
            '&include_all=' + search_settings.all +
            '&max_prediction_sort=' + search_settings.maxPredictionSort +
            '&format=' + format;
        //window.open(url, '_self')
        return url;
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
                                       genome_data_loaded={this.state.genome_data_loaded}
                                       search_data_loaded={this.state.search_data_loaded}
            />
        }
    }

}

export default SearchScreen;