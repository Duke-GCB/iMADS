import React from 'react';
import Modal from 'react-modal';

class Popup extends React.Component {
    render() {
        let {title, isOpen, onRequestClose, children} = this.props;
        return <Modal className="Modal__Bootstrap modal-dialog modal-lg"
                      isOpen={isOpen}
                      onRequestClose={onRequestClose}
                      style={customStyles}>
            <div>
                <div className="modal-header">
                    <button type="button" className="close" onClick={onRequestClose}>
                        <span aria-hidden="true">&times;</span>
                        <span className="sr-only">Close</span>
                    </button>
                    <h4 className="modal-title">{title}</h4>
                </div>
                <div style={childrenDivStyle}>
                    {children}
                </div>
            </div>
        </Modal>
    }
}

// this component requires react styles
const customStyles = {
    content: {
        minHeight: '450px',
        bottom: 'none'
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        //lower z index so loading spinner is visible
        zIndex: 100,
    }
};

const childrenDivStyle = {
    margin: '20px'
};

export default Popup;
