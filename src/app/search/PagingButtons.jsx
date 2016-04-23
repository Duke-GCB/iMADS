import React from 'react';

class PagingButtons extends React.Component {
    constructor(props) {
        super(props);
    }

    onClickPage(page, evt) {
        evt.preventDefault();
        if (page > 0 || page === -1) {
            this.props.change_page(page);
        }
    }

    make_number_button(page_num, selected) {
        var props = {};
        var child = '';
        if (selected) {
            props['className'] = 'active';
            child = <span className="sr-only">(current)</span>;
        }
        var func = this.onClickPage.bind(this, page_num);
        return <li {...props} key={page_num} ><a href="#" style={{width: '3em', textAlign: 'center'}} onClick={func}>{page_num} {child}</a></li>;
    }

    make_labeled_button(label, disabled, page_num) {
        var props = {};
        var func = this.onClickPage.bind(this, page_num);
        if (disabled) {
            return <li className="disabled" key={label}><span>{label}</span></li>;
        } else {
            return <li {...props} key={label}><a href="#" onClick={func}><span>{label}</span></a></li>;
        }
    }

    make_buttons(start_page, current_page, end_page) {
        var disable_prev = current_page === 1;
        var disable_next = !this.props.pageBatch.canNext(current_page);
        var buttons = [];
        buttons.push(this.make_labeled_button('<<', disable_prev, 1));
        buttons.push(this.make_labeled_button('<', disable_prev, current_page - 1));
        for (var i = start_page; i <= end_page; i++) {
            buttons.push(this.make_number_button(i, i === current_page))
        }
        buttons.push(this.make_labeled_button('>', disable_next, current_page + 1));
        buttons.push(this.make_labeled_button('>>', disable_next, -1));
        return buttons;
    }

    render() {
        var buttons = this.make_buttons(
            parseInt(this.props.pageBatch.getStartPage()),
            parseInt(this.props.current_page),
            parseInt(this.props.pageBatch.getEndPage()));

        return <ul className="pagination">
            {buttons}
        </ul>

    }
}

export default PagingButtons;