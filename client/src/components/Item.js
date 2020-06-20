import React from 'react';
import PropTypes from 'prop-types';

const Item = ({ itemRank, itemImage, itemName, itemSubName }) => {
  Item.propTypes = {
    itemRank: PropTypes.number.isRequired,
    itemImage: PropTypes.string.isRequired,
    itemName: PropTypes.string.isRequired,
    itemSubName: PropTypes.string.isRequired,
  };

  return (
    <div className="showcase-object">
      <div className="showcase-item">
        <img
          className="showcase-img"
          src={itemImage}
          alt={`${itemName} album cover`}
        />
        <div className="showcase-text">{itemName}</div>
        <div className="showcase-sub">{itemSubName}</div>
      </div>
    </div>
  );
};

export default Item;
