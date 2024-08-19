import React from "react";
import { MAIN_NAVIGATION } from "@src/consts";

interface Props {
  path:string,
}

const Header: React.FC<Props> = (props:Props) => {
  return (
    <header className="global">
      <nav className="global">
        <a href="/">
          <img
            className="logo responsive"
            src="/images/global/eric-carlisle-logo.svg"
            alt="Eric Carlisle : UI, UX Engineer"
            width="90"
            height="32"
          />
        </a>
        <ul>
        {
          MAIN_NAVIGATION.map((page, index) => (
          <li key={index}>
            <a className={page.url === props.path ? "active": ""} href={ page.url }>{ page.title }</a>
          </li>
          ))
        }
        </ul>
      </nav>
    </header>
  );
};

export default Header;
