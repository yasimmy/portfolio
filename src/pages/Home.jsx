import { useEffect, useState } from 'react'
import Particles from '../components/Particles/Particles'
import CardNav from '../components/CardNav/CardNav'
import ProjectCard from '../components/ProjectCard/ProjectCard'
import ProfileCard from '../components/ProfileCard/ProfileCard'
import SkillsSection from '../components/SkillsSection/SkillsSection'
import ExperienceSection from '../components/ExperienceSection/ExperienceSection'
import ContactSection from '../components/ContactSection/ContactSection'
import './Home.css'

const logo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='40'%3E%3Ctext x='10' y='25' font-size='20' font-weight='bold' fill='%23000'%3EPortfolio%3C/text%3E%3C/svg%3E"

const navItems = [
  {
    label: "Обо мне",
    bgColor: "#0D0716",
    textColor: "#fff",
    links: [
      { label: "Навыки", href: "#skills", ariaLabel: "Мои навыки" },
      { label: "Опыт", href: "#experience", ariaLabel: "Опыт работы" }
    ]
  },
  {
    label: "Проекты",
    bgColor: "#170D27",
    textColor: "#fff",
    links: [
      { label: "Все проекты", href: "#projects", ariaLabel: "Все проекты" },
      { label: "GitHub", href: "https://github.com/yasimmy", ariaLabel: "GitHub профиль" }
    ]
  },
  {
    label: "Контакты",
    bgColor: "#271E37",
    textColor: "#fff",
    links: [
      { label: "Email", href: "mailto:contact@esteria.com", ariaLabel: "Email" },
      { label: "Telegram", href: "https://t.me/virtssy", ariaLabel: "Telegram" }
    ]
  }
]

function Home() {
  const [projects, setProjects] = useState([])
  const [heroDescription, setHeroDescription] = useState('Создаю современные веб-приложения с красивым дизайном и отличным пользовательским опытом.')

  const fetchHeroDescription = () => {
    fetch('/api/settings/heroDescription')
      .then(res => res.json())
      .then(data => {
        if (data.value) {
          setHeroDescription(prev => {
            // Обновляем только если значение изменилось
            if (prev !== data.value) {
              return data.value
            }
            return prev
          })
        }
      })
      .catch(err => console.error('Error fetching description:', err))
  }

  const fetchProjects = () => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error('Error fetching projects:', err))
  }

  useEffect(() => {
    // Первоначальная загрузка
    fetchProjects()
    fetchHeroDescription()

    // Автоматическое обновление каждые 2 секунды
    const interval = setInterval(() => {
      fetchProjects()
      fetchHeroDescription()
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="home-page">
      <div className="particles-background">
        <Particles
          particleColors={['#ffffff', '#ffffff']}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>
      
      <CardNav
        logo={logo}
        logoAlt="Portfolio Logo"
        items={navItems}
        baseColor="#fff"
        menuColor="#000"
        buttonBgColor="#111"
        buttonTextColor="#fff"
        ease="power3.out"
      />

      <main className="main-content">
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Привет, я <span className="gradient-text">Разработчик</span>
              </h1>
              <p className="hero-description">
                {heroDescription}
              </p>
            </div>
            <div className="hero-profile">
              <ProfileCard
                name="esteria"
                title="Full Stack Разработчик"
                handle="esteria"
                status="Доступен для работы"
                contactText="Связаться"
                avatarUrl=""
                showUserInfo={true}
                enableTilt={true}
                enableMobileTilt={false}
                behindGlowEnabled={false}
                onContactClick={() => {
                  window.location.href = '#contacts'
                  setTimeout(() => {
                    const contactsSection = document.getElementById('contacts')
                    if (contactsSection) {
                      contactsSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }, 100)
                }}
              />
            </div>
          </div>
        </section>

        <SkillsSection />

        <section id="projects" className="projects-section">
          <h2 className="section-title">Мои проекты</h2>
          <div className="projects-grid">
            {projects.length > 0 ? (
              projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <div className="no-projects">
                <p>Пока нет проектов. Добавьте их через админ панель!</p>
              </div>
            )}
          </div>
        </section>
        
        <ExperienceSection />

        <ContactSection />
      </main>
    </div>
  )
}

export default Home

