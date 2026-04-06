const MenuBar = () => {
  const menus = ['File', 'Edit', 'View', 'Navigate', 'Tools', 'Help'];

  return (
    <div className="menu-bar">
      {menus.map(menu => (
        <span key={menu} className="menu-bar-item">{menu}</span>
      ))}
    </div>
  );
};

export default MenuBar;
