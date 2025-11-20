import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './ExperienceSection.css'

function ExperienceSection() {
  const experienceRef = useRef(null)

  const experiences = [
    {
      title: 'Full Stack Разработчик',
      company: 'Компания',
      period: '2022 - Настоящее время',
      description: 'Разработка современных веб-приложений с использованием React, Node.js и современных технологий.',
      technologies: ['React', 'Node.js', 'MongoDB', 'TypeScript']
    },
    {
      title: 'Frontend Разработчик',
      company: 'Стартап',
      period: '2020 - 2022',
      description: 'Создание пользовательских интерфейсов и улучшение пользовательского опыта.',
      technologies: ['React', 'JavaScript', 'CSS', 'HTML']
    },
    {
      title: 'Junior Разработчик',
      company: 'Агентство',
      period: '2019 - 2020',
      description: 'Разработка веб-сайтов и изучение современных технологий разработки.',
      technologies: ['HTML', 'CSS', 'JavaScript', 'PHP']
    }
  ]

  useEffect(() => {
    if (experienceRef.current) {
      const items = experienceRef.current.querySelectorAll('.experience-item')
      items.forEach((item, index) => {
        gsap.fromTo(
          item,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: index * 0.2,
            ease: 'power3.out'
          }
        )
      })
    }
  }, [])

  return (
    <div className="experience-section" id="experience">
      <h2 className="section-title">Опыт работы</h2>
      <div className="experience-timeline" ref={experienceRef}>
        {experiences.map((exp, index) => (
          <div key={index} className="experience-item">
            <div className="experience-dot" />
            <div className="experience-content">
              <div className="experience-header">
                <h3 className="experience-title">{exp.title}</h3>
                <span className="experience-period">{exp.period}</span>
              </div>
              <div className="experience-company">{exp.company}</div>
              <p className="experience-description">{exp.description}</p>
              <div className="experience-technologies">
                {exp.technologies.map((tech, techIndex) => (
                  <span key={techIndex} className="tech-tag">{tech}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ExperienceSection

