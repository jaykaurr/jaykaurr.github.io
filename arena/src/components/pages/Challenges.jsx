import { Badge, Card, BtnPrimary, ProgressBar, SectionTitle, Meta } from '../UI';
import styles from './Pages.module.css';

const CHALLENGES = [
  { badge: 'amber', label: '48 hrs left',    title: 'Autonomous Navigation Hackathon',  prize: '$500 + mentor intro',    desc: 'Design a lightweight path-planning algorithm for urban UAV delivery. Submit simulation + writeup. Judged on efficiency, safety, and documentation.', progress: 62, meta: '34 teams registered · Aerospace + Software' },
  { badge: 'green', label: 'Open',           title: 'Satellite Comms Protocol Design',  prize: '$300 + LinkedIn feature', desc: 'Propose and prototype a fault-tolerant communication protocol for low-earth orbit cubesats under bandwidth constraints.',                         progress: 20, meta: '12 teams registered · 10 days left · Systems + Software' },
  { badge: 'blue',  label: 'Cross-industry', title: 'Supply Chain Resilience Sprint',   prize: '$200 + company intro',   desc: 'Model and optimize a multi-tier aerospace supply chain for disruption resilience. Open to all engineering backgrounds.',                          progress: 5,  meta: '3 teams registered · 21 days left · All sectors' },
];

export default function Challenges() {
  return (
    <div className={styles.page}>
      <SectionTitle>Active challenges</SectionTitle>
      <div className={styles.challengeList}>
        {CHALLENGES.map((c, i) => (
          <Card key={i}>
            <div className={styles.challengeTop}>
              <div>
                <Badge variant={c.badge}>{c.label}</Badge>
                <h3 className={styles.challengeTitle}>{c.title}</h3>
              </div>
              <span className={styles.prize}>{c.prize}</span>
            </div>
            <p className={styles.challengeDesc}>{c.desc}</p>
            <ProgressBar value={c.progress} />
            <Meta>{c.meta}</Meta>
            <div style={{ marginTop: '14px' }}>
              <BtnPrimary>Enter challenge</BtnPrimary>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
