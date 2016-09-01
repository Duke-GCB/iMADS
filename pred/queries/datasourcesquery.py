FETCH_DATA_SOURCES_SQL = "select description, downloaded, url, data_source_type " \
                         "from data_source " \
                         "order by description;"


class DataSourcesQueryNames(object):
    DESCRIPTION = 'description'
    DOWNLOADED = 'downloaded'
    URL = 'url'
    DATA_SOURCE_TYPE = 'data_source_type'


class DataSourcesQuery(object):
    def make_query_and_params(self):
        return FETCH_DATA_SOURCES_SQL, []