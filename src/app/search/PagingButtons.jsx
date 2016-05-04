import React from 'react';

class PagingButtons extends React.Component {
    constructor(props) {
        super(props);
    }

    onClickPage(page, evt) {
        evt.preventDefault();
        if (page > 0 || page === -1) {
            this.props.changePage(page);
        }
    }

    makeNumberButton(pageNum, selected) {
        var props = {};
        var child = '';
        if (selected) {
            props['className'] = 'active';
            child = <span className="sr-only">(current)</span>;
        }
        var func = this.onClickPage.bind(this, pageNum);
        return <li {...props} key={pageNum} >
            <a href="#" style={{width: '4em', textAlign: 'center'}} onClick={func}>{pageNum} {child}</a>
        </li>;
    }

    makeLabeledButton(label, disabled, pageNum) {
        var props = {};
        var func = this.onClickPage.bind(this, pageNum);
        if (disabled) {
            return <li className="disabled" key={label}><span>{label}</span></li>;
        } else {
            return <li {...props} key={label}><a href="#" onClick={func}><span>{label}</span></a></li>;
        }
    }

    makeButtons(startPage, currentPage, endPage) {
        var disablePrev = currentPage === 1;
        var disableNext = !this.props.pageBatch.canNext(currentPage);
        var buttons = [];
        buttons.push(this.makeLabeledButton('<<', disablePrev, 1));
        buttons.push(this.makeLabeledButton('<', disablePrev, currentPage - 1));
        for (var i = startPage; i <= endPage; i++) {
            buttons.push(this.makeNumberButton(i, i === currentPage))
        }
        buttons.push(this.makeLabeledButton('>', disableNext, currentPage + 1));
        buttons.push(this.makeLabeledButton('>>', disableNext, -1));
        return buttons;
    }

    render() {
        var buttons = this.makeButtons(
            parseInt(this.props.pageBatch.getStartPage()),
            parseInt(this.props.currentPage),
            parseInt(this.props.pageBatch.getEndPage()));

        return <ul className="pagination">
            {buttons}
        </ul>

    }
}

export default PagingButtons;