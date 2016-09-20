// Storage of data that is just for this session.
// Allows per tab settings to be persisted as user switches between them.

export const PREDICTION_PAGE_KEY = 'predicitonPage';
export const SEARCH_PAGE_KEY = 'searchPage';

export class SessionStorage {
    getValue(key) {
        return JSON.parse(sessionStorage.getItem(key));
    }

    putValue(key, value) {
        sessionStorage.setItem(key, JSON.stringify(value));
    }
};
