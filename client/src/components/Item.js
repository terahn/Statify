import React, { Component } from 'react';

class Item extends Component {
  render() {
    return (
      <div className="showcase-object">
        <div className="showcase-item">
          <img
            className="showcase-img"
            src={this.props.itemImage}
            alt={`${this.props.itemName} album cover`}
          />
          <div className="showcase-text">{this.props.itemName}</div>
          <div className="showcase-sub">{this.props.itemSubName}</div>
        </div>
      </div>
    );
  }
}

export default Item;
