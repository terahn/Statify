import React from 'react';
import PropTypes from 'prop-types';
import { ListItem, ListItemText } from '@material-ui/core';

const Item = ({ itemRank, itemImage, itemName, itemSubName }) => {
  Item.propTypes = {
    itemRank: PropTypes.number.isRequired,
    itemImage: PropTypes.string.isRequired,
    itemName: PropTypes.string.isRequired,
    itemSubName: PropTypes.string.isRequired,
  };

  return (
    <ListItem>
      <div className="list-rank">{itemRank}</div>
      <img
        className="showcase-img"
        src={itemImage}
        alt={`${itemName} album cover`}
      />
      <ListItemText primary={itemName} secondary={itemSubName} />
    </ListItem>
  );
};

export default Item;
