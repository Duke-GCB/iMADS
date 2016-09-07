import React from 'react';
import PageTitle from '../common/PageTitle.jsx'
import DataGrid from '../common/DataGrid.jsx';
require('./DataSource.css');

export default class DataSource extends React.Component {

    makeDownloadURL = (item) => {
        let {fullUrl, cleanUrl} = item;
        return <a href={fullUrl} title={fullUrl}>{cleanUrl}</a>;
    };

    render() {
        let {title, content} = this.props;
        let gridColumnInfo = [
            {fieldName: 'description', title: 'Description', type: 'text'},
            {fieldName: 'downloaded', title: 'Downloaded', type: 'text'},
            {fieldName: 'fullUrl', title: 'URL', type: 'link', makeControlFunc: this.makeDownloadURL},
        ];
        return <div>
            <PageTitle>{title}</PageTitle>
            <DataGrid
                classNamePrefix="DataSource_DataGrid_"
                columnInfo={gridColumnInfo}
                rows={content}
            />
        </div>
    }
}
