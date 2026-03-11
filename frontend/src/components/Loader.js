import React from 'react';

const Loader = ({ size = 'md', text = 'Loading...' }) => {
  const sizes = { sm: 24, md: 40, lg: 60 };
  return (
    <div className="spinner-container">
      <div className="text-center">
        <div
          className="spinner-border"
          style={{ width: sizes[size], height: sizes[size], borderColor: '#e44d26', borderRightColor: 'transparent' }}
          role="status"
        />
        {text && <p className="mt-3 text-muted">{text}</p>}
      </div>
    </div>
  );
};

export default Loader;
