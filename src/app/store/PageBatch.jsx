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
        var pageNum = (batchPageNum - 1)* this.pagesInBatch;
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
        var pageNums = this.getPageNums();
        var lastPage = pageNums[0];
        for (var i = 1; i < pageNums.length; i++) {
            var somePage = pageNums[i];
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
        var nextPage = page + 1;
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

}

export default PageBatch;