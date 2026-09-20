import type { AboutContent } from "../types";

export function About({ about }: { about: AboutContent }) {
  return (
    <section id="nosotros" className="section section--alt about">
      <div className="container about__grid">
        <div className="about__media">
          <img src={about.imageUrl} alt={about.title} loading="lazy" />
        </div>
        <div className="about__copy">
          <h2>{about.title}</h2>
          <p>{about.story}</p>
          <p>{about.approach}</p>
          <dl className="about__trust">
            {about.trustPoints.map((tp) => (
              <div key={tp.label} className="about__trust-item">
                <dt>{tp.value}</dt>
                <dd>{tp.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
