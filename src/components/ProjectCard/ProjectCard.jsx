import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'
import './ProjectCard.css'

function ProjectCard({ project }) {
  const cardRef = useRef(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -10,
        scale: 1.02,
        duration: 0.3,
        ease: 'power2.out'
      })
    }

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      })
    }

    card.addEventListener('mouseenter', handleMouseEnter)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div ref={cardRef} className="project-card">
      {project.image && (
        <div className="project-image-container">
          <img src={project.image} alt={project.title} className="project-image" />
          <div className="project-overlay" />
        </div>
      )}
      <div className="project-content">
        <h3 className="project-title">{project.title}</h3>
        <p className="project-description">{project.description}</p>
        <div className="project-tags">
          {project.tags && project.tags.map((tag, index) => (
            <span key={index} className="project-tag">{tag}</span>
          ))}
        </div>
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="project-link"
          >
            Посмотреть проект →
          </a>
        )}
      </div>
    </div>
  )
}

export default ProjectCard

