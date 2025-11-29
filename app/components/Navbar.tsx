import React from "react";
import {Link} from "react-router";

const Navbar: () => React.JSX.Element = () => {
  return (
    <div className="navbar">
      <Link to="/">
        <p className="text-2xl font-bold text-gradient">Smart CV</p>
      </Link>
      <Link to="/upload" className="primary-button w-fit">
        Subir CV
      </Link>
    </div>
  )
}

export default Navbar