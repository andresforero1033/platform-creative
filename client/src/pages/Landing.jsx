import Navbar from '../components/landing/Navbar.jsx'
import Hero from '../components/landing/Hero.jsx'
import LeadCapture from '../components/landing/LeadCapture.jsx'
import Team from '../components/landing/Team.jsx'

function Landing() {
  return (
    <main className="app-shell">
      <Navbar />
      <Hero />
      <LeadCapture />
      <Team />
    </main>
  )
}

export default Landing
