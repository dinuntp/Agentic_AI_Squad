import React from 'react';

function Header({ onNewClaim }) {
  return (
    <header className="app-header">
      <h1 className="app-header__title">Insurance Claim Management Dashboard</h1>
      <button className="app-header__btn" onClick={onNewClaim}>
        + New Claim
      </button>
    </header>
  );
}

export default Header;