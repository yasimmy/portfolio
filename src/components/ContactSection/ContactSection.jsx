import { useState, useEffect } from 'react'
import './ContactSection.css'

function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactMethod: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [contactsInfo, setContactsInfo] = useState({
    email: 'contact@esteria.com',
    telegram: '@esteria',
    github: 'github.com/esteria',
    linkedin: 'linkedin.com/in/esteria'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSubmitted(true)
        setTimeout(() => {
          setSubmitted(false)
          setFormData({ name: '', email: '', contactMethod: '', message: '' })
        }, 3000)
      } else {
        try {
          const data = await response.json()
          setError(data.message || 'Ошибка отправки сообщения')
        } catch (parseError) {
          setError(`Ошибка сервера: ${response.status} ${response.statusText}`)
        }
      }
    } catch (err) {
      console.error('Contact form error:', err)
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Ошибка соединения с сервером. Проверьте, что сервер запущен на порту 3001')
      } else {
        setError(`Ошибка: ${err.message}`)
      }
    }
  }

  const fetchContactsInfo = () => {
    fetch('/api/contacts-info')
      .then(res => res.json())
      .then(data => {
        setContactsInfo(prev => {
          // Обновляем только если данные изменились
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            return data
          }
          return prev
        })
      })
      .catch(err => console.error('Error fetching contacts info:', err))
  }

  useEffect(() => {
    // Первоначальная загрузка
    fetchContactsInfo()

    // Автоматическое обновление каждые 2 секунды
    const interval = setInterval(() => {
      fetchContactsInfo()
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const contacts = [
    {
      icon: '📧',
      label: 'Email',
      value: contactsInfo.email || 'contact@esteria.com',
      link: `mailto:${contactsInfo.email || 'contact@esteria.com'}`
    },
    {
      icon: '💬',
      label: 'Telegram',
      value: contactsInfo.telegram || '@esteria',
      link: contactsInfo.telegram?.startsWith('http') 
        ? contactsInfo.telegram 
        : `https://t.me/${(contactsInfo.telegram || '@esteria').replace('@', '')}`
    },
    {
      icon: '💼',
      label: 'GitHub',
      value: contactsInfo.github || 'github.com/esteria',
      link: contactsInfo.github?.startsWith('http') 
        ? contactsInfo.github 
        : `https://${contactsInfo.github || 'github.com/esteria'}`
    },
    {
      icon: '💼',
      label: 'LinkedIn',
      value: contactsInfo.linkedin || 'linkedin.com/in/esteria',
      link: contactsInfo.linkedin?.startsWith('http') 
        ? contactsInfo.linkedin 
        : `https://${contactsInfo.linkedin || 'linkedin.com/in/esteria'}`
    }
  ]

  return (
    <div className="contact-section" id="contacts">
      <h2 className="section-title">Контакты</h2>
      <div className="contact-container">
        <div className="contact-info">
          <p className="contact-description">
            Свяжитесь со мной, если хотите обсудить проект или просто поздороваться!
          </p>
          <div className="contact-links">
            {contacts.map((contact, index) => (
              <a
                key={index}
                href={contact.link}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link-item"
              >
                <span className="contact-icon">{contact.icon}</span>
                <div className="contact-link-content">
                  <span className="contact-link-label">{contact.label}</span>
                  <span className="contact-link-value">{contact.value}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
        <div className="contact-form-wrapper">
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Имя</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ваше имя"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="contactMethod">Способы связи: Введите способ связи с вами</label>
              <input
                type="text"
                id="contactMethod"
                name="contactMethod"
                value={formData.contactMethod}
                onChange={handleChange}
                placeholder="Например: Telegram, WhatsApp, Discord и т.д."
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Сообщение</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                placeholder="Ваше сообщение..."
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="submit-button" disabled={submitted}>
              {submitted ? 'Отправлено!' : 'Отправить сообщение'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ContactSection

