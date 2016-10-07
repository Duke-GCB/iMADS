import React from 'react';
import PageTitle from '../common/PageTitle.jsx';
import DataGrid from '../common/DataGrid.jsx';
require('./DataSource.css');

export default class DataSource extends React.Component {

    makeDownloadURL = (item) => {
        let {url, filename, host} = item;
        return <span>
            <a href={url} title={url}>{filename}</a> at {host}
        </span>;
    };

    render() {
        let {title, content, hasGroups} = this.props;
        let gridColumnInfo = [
            {fieldName: 'description', title: 'Description', type: 'text'},
            {fieldName: 'downloaded', title: 'Downloaded', type: 'text'},
            {fieldName: 'url', title: 'URL', type: 'link', makeControlFunc: this.makeDownloadURL},
        ];
        return <div>
            <PageTitle>{title}</PageTitle>
            <DataGrid
                fullScreen={false}
                classNamePrefix="DataSource_DataGrid_"
                columnInfo={gridColumnInfo}
                rows={content}
                hasGroups={hasGroups}
                searchDataLoaded={true}
            />
        </div>
    }
}
