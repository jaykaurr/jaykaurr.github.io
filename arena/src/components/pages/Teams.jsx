import { Badge, Card, BtnPrimary, SectionTitle, Meta } from '../UI';
import styles from './Pages.module.css';

const TEAMS = [
  { badge: 'amber',  label: 'Looking for members', title: 'UAV Path Planning',             desc: '2 engineers working on the Autonomous Nav Hackathon. Need 1 more — preferably controls or ML background.',                           meta: 'Yash K. + 1 other · Closes in 2 days',  cta: 'Apply to join' },
  { badge: 'green',  label: 'Open',                title: 'Defense Systems Study Group',   desc: 'Weekly async sessions dissecting real defense system architectures. No competition — just learning together.',                         meta: '5 members · All levels welcome',         cta: 'Request to join' },
  { badge: 'blue',   label: 'Forming now',         title: 'GHC 2026 Carpool',             desc: 'Looking for 3–4 engineers driving from Phoenix/Tempe area to Anaheim for Grace Hopper in October.',                                  meta: '0 / 4 seats filled · Free to join',     cta: 'Join' },
  { badge: 'purple', label: 'Ongoing',             title: 'Systems Eng Reading Club',     desc: 'Monthly deep-dives into INCOSE standards, case studies and SE best practices. Currently reading SE Handbook V5.',                     meta: '9 members · Next meet: May 18',          cta: 'Request to join' },
];

export default function Teams() {
  return (
    <div className={styles.page}>
      <SectionTitle>Find or form a team</SectionTitle>
      <div className={styles.grid2}>
        {TEAMS.map((t, i) => (
          <Card key={i}>
            <Badge variant={t.badge}>{t.label}</Badge>
            <h3 className={styles.cardTitle}>{t.title}</h3>
            <p className={styles.cardDesc}>{t.desc}</p>
            <Meta>{t.meta}</Meta>
            <div style={{ marginTop: '12px' }}>
              <BtnPrimary>{t.cta}</BtnPrimary>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
