// Splits a batch of items up into pages.

class PageBatch {
    constructor(pagesInBatch, itemPerPage) {
        this.pagesInBatch = pagesInBatch;
        this.itemPerPage = itemPerPage;
        this.pageToItems = {}
        this.hasMore = false;
    }

    setItems(batchPageNum, items, hasMore) {
        this.hasMore = hasMore;
        this.pageToItems = {}
        var pageNum = batchPageNum * this.pagesInBatch;
        for (var i = 0; i < this.pagesInBatch; i++) {
            var idx = (i * this.itemPerPage);
            var endIdx = idx + this.itemPerPage;
            pageNum += 1;
            var pageItems = [];
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
        return parseInt((page - 1)/ this.pagesInBatch) + 1;
    }

    getItemsPerBatch() {
        return this.pagesInBatch * this.itemPerPage;
    }
}

export default PageBatch;