import React from 'react';
import PropTypes from 'prop-types';
import './CustomNode.css';

const CustomNode = ({ artist }) => {
  CustomNode.propTypes = {
    artist: PropTypes.shape({
      id: PropTypes.string.isRequired,
      img: PropTypes.string.isRequired,
    }).isRequired,
  };

  return (
    <div className="node">
      <div
        className="node-img"
        style={{ backgroundImage: `url(${artist.img})` }}
      />
      <div className="node-tooltip">
        <div className="tooltip-arrow" />
        <div className="node-label">{artist.id}</div>
      </div>
    </div>
  );
};

export default CustomNode;
