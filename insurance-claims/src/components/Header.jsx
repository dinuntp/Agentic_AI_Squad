import React from 'react';

function Header({ onNavigate }) {
  return (
    <header className="header">
      <h1
        className="header-title"
        onClick={() => onNavigate('dashboard')}
        style={{ cursor: 'pointer' }}
      >
        Insurance Claim Management Dashboard
      </h1>
      <button
        className="btn btn-primary"
        onClick={() => onNavigate('new-claim')}
      >
        + New Claim
      </button>
    </header>
  );
}

export default Header;