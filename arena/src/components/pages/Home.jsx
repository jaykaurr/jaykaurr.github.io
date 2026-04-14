import { useNavigate } from 'react-router-dom';
import { Badge, Card, BtnPrimary, BtnSecondary, StatCard, Avatar, ProgressBar, SectionTitle, Meta } from '../UI';
import styles from './Pages.module.css';

const SUGGESTIONS = [
  { initials: 'AJ', color: 'blue',   name: 'Aisha Johnson', sub: "Systems Engineer · Raytheon · Class of '26" },
  { initials: 'MR', color: 'green',  name: 'Marcus Reed',   sub: "Software Eng · Boeing · Class of '25" },
  { initials: 'SP', color: 'purple', name: 'Sara Park',     sub: "Avionics · Lockheed · Class of '26" },
];

const EVENTS = [
  { month: 'JUN', day: '13', title: 'INCOSE IS 2026',    sub: 'Yokohama, Japan · Systems Engineering' },
  { month: 'OCT', day: '27', title: 'Grace Hopper 2026', sub: 'Anaheim, CA · Women in Tech' },
  { month: 'JAN', day: '12', title: 'AIAA SciTech 2027', sub: 'Orlando, FL · Aerospace R&D' },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.heroHeading}>Welcome back, Yash 👋</h1>
          <p className={styles.heroSub}>
            The Arena is your professional playground — compete in challenges, find your cohort,
            and build the network you had in college, but for real life.
          </p>
          <div className={styles.heroCta}>
            <BtnPrimary onClick={() => navigate('/challenges')}>Browse challenges</BtnPrimary>
            <BtnSecondary onClick={() => navigate('/cohorts')}>Find my cohort</BtnSecondary>
          </div>
        </div>
        <div className={styles.heroStats}>
          <StatCard number="4" label="Challenges joined" />
          <StatCard number="12" label="Connections" />
          <StatCard number="1" label="Active cohort" />
          <StatCard number="3" label="Events RSVP'd" />
        </div>
      </div>

      <div className={styles.grid2}>
        <Card>
          <SectionTitle>Upcoming events</SectionTitle>
          {EVENTS.map((e, i) => (
            <div key={i} className={styles.eventRow}>
              <div className={styles.dateBlock}>
                <div className={styles.dateMonth}>{e.month}</div>
                <div className={styles.dateDay}>{e.day}</div>
              </div>
              <div>
                <div className={styles.eventTitle}>{e.title}</div>
                <div className={styles.eventSub}>{e.sub}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>People you may know</SectionTitle>
          {SUGGESTIONS.map((u, i) => (
            <div key={i} className={styles.userRow}>
              <Avatar initials={u.initials} color={u.color} />
              <div className={styles.userInfo}>
                <div className={styles.userName}>{u.name}</div>
                <div className={styles.userSub}>{u.sub}</div>
              </div>
              <button className={styles.connectBtn}>Connect</button>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <div className={styles.challengeTop}>
          <div>
            <Badge variant="amber">48 hrs left</Badge>
            <h3 className={styles.challengeTitle}>Autonomous Navigation Hackathon</h3>
          </div>
          <span className={styles.prize}>$500 + mentor intro</span>
        </div>
        <p className={styles.challengeDesc}>
          Design a lightweight path-planning algorithm for urban UAV delivery. Submit a working simulation + writeup.
        </p>
        <ProgressBar value={62} />
        <Meta>62% of time elapsed · Team: Yash + 2 others</Meta>
      </Card>
    </div>
  );
}
