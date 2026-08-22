import React from 'react';
import { Link } from 'react-router-dom';

const FloatingNavbarItem = ({ item, active, onClick }) => {
  const { Icon, label, path } = item;

  return (
    <Link
      to={path}
      className={`floating-navbar-item${active ? ' active' : ''}`}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      onClick={onClick}
    >
      <span className="floating-navbar-item-icon">
        <Icon size={18} />
      </span>
      <span className="floating-navbar-item-label">{label}</span>
    </Link>
  );
};

export default FloatingNavbarItem;
