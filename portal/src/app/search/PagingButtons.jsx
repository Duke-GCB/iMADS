import React from 'react';
require('./PagingButtons.css');

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
        let props = {};
        let child = '';
        if (selected) {
            props['className'] = 'active';
            child = <span className="sr-only">(current)</span>;
        }
        let func = this.onClickPage.bind(this, pageNum);
        return <li {...props} key={pageNum} >
            <a href="#" className="PagingButtons_number_buttons" onClick={func}>{pageNum} {child}</a>
        </li>;
    }

    makeLabeledButton(label, disabled, pageNum) {
        let props = {};
        let func = this.onClickPage.bind(this, pageNum);
        if (disabled) {
            return <li className="disabled" key={label}><span>{label}</span></li>;
        } else {
            return <li {...props} key={label}><a href="#" onClick={func}><span>{label}</span></a></li>;
        }
    }

    makeButtons(startPage, currentPage, endPage) {
        let disablePrev = currentPage === 1;
        let disableNext = !this.props.pageBatch.canNext(currentPage);
        let buttons = [];
        buttons.push(this.makeLabeledButton('<<', disablePrev, 1));
        buttons.push(this.makeLabeledButton('<', disablePrev, currentPage - 1));
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(this.makeNumberButton(i, i === currentPage))
        }
        buttons.push(this.makeLabeledButton('>', disableNext, currentPage + 1));
        buttons.push(this.makeLabeledButton('>>', disableNext, -1));
        return buttons;
    }

    render() {
        let buttons = this.makeButtons(
            parseInt(this.props.pageBatch.getStartPage()),
            parseInt(this.props.currentPage),
            parseInt(this.props.pageBatch.getEndPage()));

        return <ul className="pagination">
            {buttons}
        </ul>

    }
}

export default PagingButtons;