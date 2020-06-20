import React from 'react';
import PropTypes from 'prop-types';
import './Genre.css';

const Genre = ({ label, value }) => {
  Genre.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
  };

  return (
    <div className="genre-item">
      <div className="genre-name">{label}</div>
      <div className="genre-value" style={{ width: `${value}%` }} />
    </div>
  );
};

export default Genre;
