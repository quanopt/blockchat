import React from "react";

class TextItem extends React.Component {
    render() {
        return (
            <div style={{
              width: '100%',
              fontSize: '0.7em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              paddingTop: '1em'
            }}>
                {this.props.text.toUpperCase()}
            </div>
        );
    }
}

export default TextItem;
