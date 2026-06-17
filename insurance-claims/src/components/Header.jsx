import React from 'react';

function Header({ onNavigate }) {
  return (
    <header className="header">
      <h1>Insurance Claim Management Dashboard</h1>
      <button
        className="btn-new-claim"
        onClick={() => onNavigate('newClaim')}
      >
        + New Claim
      </button>
    </header>
  );
}

export default Header;