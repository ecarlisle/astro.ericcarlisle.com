import React from "react";
import { MAIN_NAVIGATION, SITE_NAME } from "@src/consts";

interface Props {
  path:string,
}

const Header: React.FC<Props> = (props:Props) => {
  return (
    <header className="global">
      <nav className="global" id="main-nav" aria-label="global navigation">
        <a href="/" title={SITE_NAME}>
					<svg width="90" height="32" viewBox="0 0 90 32">
          	<use href="#logo-eric-carlisle" />
          </svg>
        </a>
        <ul>
        {
          MAIN_NAVIGATION.map((page, index) => (
          <li key={index}>
            <a className={page.url === props.path ? "active": ""} href={`${page.url}/`}>{ page.title }</a>
          </li>
          ))
        }
        </ul>
      </nav>
    </header>
  );
};

export default Header;
