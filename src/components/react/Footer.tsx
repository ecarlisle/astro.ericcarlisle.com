const Footer = () => {

  const today = new Date();

  return (
    <footer className="global">
      <ul className="stack">
        <li>
          <a href="https://astro.build/">
            Built with Astro
          </a>
        </li>
      </ul>
      <ul className="stack">
        <li>COPYRIGHT © {today.getFullYear()}, Eric Carlisle</li>
      </ul>
    </footer>
  );
};

export default Footer;
