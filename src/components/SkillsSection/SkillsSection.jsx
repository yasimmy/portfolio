import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import './SkillsSection.css'

function SkillsSection() {
  const skillsRef = useRef(null)
  const [skills, setSkills] = useState([])

  const fetchSkills = () => {
    fetch('/api/skills')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch skills')
        }
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data)) {
          setSkills(data)
        } else {
          console.error('Invalid skills data format:', data)
          setSkills([])
        }
      })
      .catch(err => {
        console.error('Error fetching skills:', err)
        setSkills([])
      })
  }

  useEffect(() => {
    // Первоначальная загрузка
    fetchSkills()

    // Автоматическое обновление каждые 2 секунды
    const interval = setInterval(() => {
      fetchSkills()
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (skillsRef.current && skills.length > 0) {
      const bars = skillsRef.current.querySelectorAll('.skill-bar-fill')
      bars.forEach((bar, index) => {
        gsap.fromTo(
          bar,
          { width: '0%' },
          {
            width: `${bar.dataset.level}%`,
            duration: 1.5,
            delay: index * 0.1,
            ease: 'power3.out'
          }
        )
      })
    }
  }, [skills])

  return (
    <div className="skills-section" id="skills">
      <h2 className="section-title">Навыки</h2>
      {skills.length > 0 ? (
        <div className="skills-grid" ref={skillsRef}>
          {skills.map((skill) => (
            <div key={skill.id} className="skill-item">
              <div className="skill-header">
                <span className="skill-name">{skill.name}</span>
                <span className="skill-percentage">{skill.level}%</span>
              </div>
              <div className="skill-bar">
                <div
                  className="skill-bar-fill"
                  data-level={skill.level}
                  style={{ 
                    '--skill-color': skill.color || '#667eea',
                    width: '0%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-skills">
          <p>Навыки загружаются... Если они не появились, добавьте их через админ панель!</p>
        </div>
      )}
    </div>
  )
}

export default SkillsSection

