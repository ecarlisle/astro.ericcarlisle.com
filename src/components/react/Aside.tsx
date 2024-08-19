import { SOCIAL_PROFILES } from "@src/consts";

const Aside= () => {
  return (
    <aside>
      <picture className="profile-image">
        <source srcSet="/images/global/eric-carlisle_512.webp 2x, /images/global/eric-carlisle_512.webp" type="image/webp" />
        <source srcSet="/images/global/eric-carlisle_512.avif 2x, /images/global/eric-carlisle_512.avif" type="image/avif" />
        <img alt="Eric Carlisle" height="256" loading="lazy" srcSet="/images/global/eric-carlisle_512.jpg 2x, /images/profile/eric-carlisle_512.jpg" width="256" />
      </picture>

      <nav className="social">
        <ul>
          {
            SOCIAL_PROFILES.map((profile, index) => (
              <li key={index}>
                <a href={ profile.url} aria-label={`${profile.name} Profile`}>
                  <svg width="24" height="24" className="social-icon" viewBox="0 0 32 32">
                    <use href={`#icon-${profile.name.toLowerCase()}`}></use>
                  </svg>
                </a>
              </li>
            ))
          }
          <li>
            <a href="/feed.xml" aria-label="RSS Feed">
              <svg width="24" height="24" className="social-icon" viewBox="0 0 32 32">
                <use href="#icon-rss"></use>
              </svg>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Aside;
