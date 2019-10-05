import React, {Component} from 'react';

class Item extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        return(
            <div className="showcase-object">
                <div className="showcase-item">
                    <img className="showcase-img" src={this.props.itemImage}></img>
                    <div className="showcase-text">{this.props.itemName}</div>
                    <div className="showcase-sub">{this.props.itemSubName}</div>
                </div>
            </div>
            
        )
    }

    
}

export default Item;