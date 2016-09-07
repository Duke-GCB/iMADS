// Splits a batch of items up into pages.
import {ITEMS_PER_PAGE, NUM_PAGE_BUTTONS} from './AppSettings.js'

class PageBatch {
    constructor(pagesInBatch, itemPerPage) {
        this.pagesInBatch = pagesInBatch || NUM_PAGE_BUTTONS;
        this.itemPerPage = itemPerPage || ITEMS_PER_PAGE;
        this.pageToItems = {}
        this.hasMore = false;
    }

    clearData() {
        this.pageToItems = {}
        this.hasMore = false;
    }

    setItems(batchPageNum, items, hasMore) {
        this.hasMore = hasMore;
        this.pageToItems = {}
        let pageNum = (batchPageNum - 1)* this.pagesInBatch;
        for (let i = 0; i < this.pagesInBatch; i++) {
            let idx = (i * this.itemPerPage);
            let endIdx = idx + this.itemPerPage;
            pageNum += 1;
            let pageItems = [];
            if (endIdx >= items.length) {
                pageItems = items.slice(idx)
            } else {
                pageItems = items.slice(idx, endIdx)
            }
            this.pageToItems[pageNum] = pageItems;
        }
    }

    getItems(pageNum) {
        return this.pageToItems[pageNum];
    }

    hasPage(pageNum) {
        return pageNum in this.pageToItems;
    }

    isPageEmpty(pageNum) {
        return this.getItems(pageNum).length == 0;
    }

    getBatchPageNum(page) {
        if (page == -1) {
            return page;
        }
        return parseInt((page - 1)/ this.pagesInBatch) + 1;
    }

    getItemsPerBatch() {
        return this.pagesInBatch * this.itemPerPage;
    }

    getPageNums() {
        return Object.keys(this.pageToItems);
    }

    getStartPage() {
        return this.getPageNums()[0];
    }

    getEndPage() {
        let pageNums = this.getPageNums();
        let lastPage = pageNums[0];
        for (let i = 1; i < pageNums.length; i++) {
            let somePage = pageNums[i];
            if (!this.isPageEmpty(somePage)) {
                lastPage = somePage;
            }
        }
        return lastPage;
    }

    canNext(page) {
        if (page == -1) {
            return false;
        }
        let nextPage = page + 1;
        if (this.hasPage(nextPage + 1)) {
            if (this.isPageEmpty(nextPage)) {
                return false;
            } else {
                return true;
            }
        } else {
            return this.hasMore;
        }
    }

    getStartAndEndPages(page) {
        let numPages = this.pagesInBatch;
        let startPage = parseInt((page - 1)/ numPages) * numPages + 1;
        let endPage = startPage + numPages - 1;
        return {
            startPage: startPage,
            endPage: endPage
        }
    }
}

export default PageBatch;