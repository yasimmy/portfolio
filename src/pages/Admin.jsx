import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Admin.css'

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [projects, setProjects] = useState([])
  const [contacts, setContacts] = useState([])
  const [skills, setSkills] = useState([])
  const [heroDescription, setHeroDescription] = useState('')
  const [contactsInfo, setContactsInfo] = useState({
    email: '',
    telegram: '',
    github: '',
    linkedin: ''
  })
  const [activeTab, setActiveTab] = useState('projects')
  const [unreadCount, setUnreadCount] = useState(0)
  const [animatingContacts, setAnimatingContacts] = useState(new Set())
  const [deletingContacts, setDeletingContacts] = useState(new Set())
  const [editingProject, setEditingProject] = useState(null)
  const [editingSkill, setEditingSkill] = useState(null)
  const [skillFormData, setSkillFormData] = useState({
    name: '',
    level: '',
    color: '#667eea',
    sortOrder: ''
  })
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    link: '',
    image: ''
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      checkAuth(token)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects()
      fetchContacts()
      fetchSkills()
      fetchHeroDescription()
      fetchContactsInfo()
      fetchUnreadCount()
      const interval = setInterval(() => {
        fetchContacts()
        fetchUnreadCount()
      }, 30000) // Обновление каждые 30 секунд
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  const checkAuth = async (token) => {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('adminToken')
      }
    } catch (err) {
      console.error('Auth check failed:', err)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('adminToken', data.token)
        setIsAuthenticated(true)
        setUsername('')
        setPassword('')
      } else {
        setError(data.message || 'Ошибка входа')
      }
    } catch (err) {
      setError('Ошибка соединения с сервером')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
    navigate('/')
  }

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setProjects(data)
    } catch (err) {
      console.error('Error fetching projects:', err)
    }
  }

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setContacts(data)
    } catch (err) {
      console.error('Error fetching contacts:', err)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/contacts/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setUnreadCount(data.count)
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('adminToken')
      
      // Добавляем ID в набор анимирующихся контактов для анимации исчезновения
      setAnimatingContacts(prev => new Set(prev).add(id))
      
      // Плавная задержка для начала анимации исчезновения
      setTimeout(() => {
        // Обновляем локальное состояние с плавной анимацией перехода
        setContacts(prevContacts => 
          prevContacts.map(contact => 
            contact.id === id ? { ...contact, read: true } : contact
          )
        )
        
        // Убираем из набора анимирующихся после завершения анимации
        setTimeout(() => {
          setAnimatingContacts(prev => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
        }, 1200) // Увеличено время для более плавной анимации
      }, 50) // Уменьшена задержка для более плавного перехода
      
      // Затем отправляем запрос на сервер
      const response = await fetch(`/api/contacts/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        // Если не получилось, откатываем изменение
        setAnimatingContacts(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
        await fetchContacts()
      }
      await fetchUnreadCount()
    } catch (err) {
      console.error('Error marking as read:', err)
      setAnimatingContacts(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      // В случае ошибки обновляем все контакты
      await fetchContacts()
    }
  }

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить это сообщение?')) {
      return
    }

    try {
      // Добавляем ID в набор удаляющихся контактов для анимации
      setDeletingContacts(prev => new Set(prev).add(id))
      
      // Небольшая задержка для начала анимации удаления
      setTimeout(async () => {
        const token = localStorage.getItem('adminToken')
        const response = await fetch(`/api/contacts/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          // Ждем завершения анимации перед удалением из DOM
          setTimeout(async () => {
            await fetchContacts()
            await fetchUnreadCount()
            setDeletingContacts(prev => {
              const newSet = new Set(prev)
              newSet.delete(id)
              return newSet
            })
          }, 600) // Время анимации удаления
        } else {
          setDeletingContacts(prev => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
          setError('Ошибка удаления сообщения')
        }
      }, 50)
    } catch (err) {
      setDeletingContacts(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      setError('Ошибка соединения с сервером')
    }
  }

  const fetchSkills = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/skills', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setSkills(data)
    } catch (err) {
      console.error('Error fetching skills:', err)
    }
  }

  const fetchHeroDescription = async () => {
    try {
      const response = await fetch('/api/settings/heroDescription')
      const data = await response.json()
      if (data.value) {
        setHeroDescription(data.value)
      }
    } catch (err) {
      console.error('Error fetching description:', err)
    }
  }

  const fetchContactsInfo = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/contacts-info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setContactsInfo({
        email: data.email || '',
        telegram: data.telegram || '',
        github: data.github || '',
        linkedin: data.linkedin || ''
      })
    } catch (err) {
      console.error('Error fetching contacts info:', err)
    }
  }

  const handleUpdateContacts = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/contacts-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(contactsInfo)
      })

      if (response.ok) {
        setError('')
        alert('Контакты успешно обновлены!')
      } else {
        setError('Ошибка обновления контактов')
      }
    } catch (err) {
      setError('Ошибка соединения с сервером')
    }
  }

  const handleSkillSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const token = localStorage.getItem('adminToken')
      const url = editingSkill 
        ? `/api/skills/${editingSkill.id}`
        : '/api/skills'
      
      const method = editingSkill ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: skillFormData.name,
          level: parseInt(skillFormData.level) || 0,
          color: skillFormData.color,
          sortOrder: parseInt(skillFormData.sortOrder) || 0
        })
      })

      if (response.ok) {
        await fetchSkills()
        resetSkillForm()
      } else {
        const data = await response.json()
        setError(data.message || 'Ошибка сохранения навыка')
      }
    } catch (err) {
      setError('Ошибка соединения с сервером')
    }
  }

  const handleDeleteSkill = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот навык?')) {
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/skills/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchSkills()
      } else {
        setError('Ошибка удаления навыка')
      }
    } catch (err) {
      setError('Ошибка соединения с сервером')
    }
  }

  const handleEditSkill = (skill) => {
    setEditingSkill(skill)
    setSkillFormData({
      name: skill.name || '',
      level: skill.level || '',
      color: skill.color || '#667eea',
      sortOrder: skill.sortOrder || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetSkillForm = () => {
    setEditingSkill(null)
    setSkillFormData({
      name: '',
      level: '',
      color: '#667eea',
      sortOrder: ''
    })
    setError('')
  }

  const handleUpdateDescription = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/settings/heroDescription', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ value: heroDescription })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Description updated successfully:', data)
        setHeroDescription(data.value) // Обновляем локальное состояние
        setError('')
        alert('Описание успешно обновлено!')
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка обновления описания' }))
        setError(errorData.message || 'Ошибка обновления описания')
        console.error('Error updating description:', errorData)
      }
    } catch (err) {
      console.error('Error updating description:', err)
      setError('Ошибка соединения с сервером')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)

    const projectData = {
      ...formData,
      tags: tagsArray
    }

    try {
      const token = localStorage.getItem('adminToken')
      const url = editingProject 
        ? `/api/projects/${editingProject.id}`
        : '/api/projects'
      
      const method = editingProject ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      })

      if (response.ok) {
        await fetchProjects()
        resetForm()
      } else {
        const data = await response.json()
        setError(data.message || 'Ошибка сохранения проекта')
      }
    } catch (err) {
      setError('Ошибка соединения с сервером')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот проект?')) {
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchProjects()
      } else {
        setError('Ошибка удаления проекта')
      }
    } catch (err) {
      setError('Ошибка соединения с сервером')
    }
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setFormData({
      title: project.title || '',
      description: project.description || '',
      tags: project.tags ? project.tags.join(', ') : '',
      link: project.link || '',
      image: project.image || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setEditingProject(null)
    setFormData({
      title: '',
      description: '',
      tags: '',
      link: '',
      image: ''
    })
    setError('')
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="login-container">
          <div className="login-card">
            <h2 className="login-title">Админ панель</h2>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Логин</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Введите логин"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Пароль</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Введите пароль"
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="submit-button">Войти</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <h1>Панель управления</h1>
          <button onClick={handleLogout} className="logout-button">Выйти</button>
        </header>

        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Проекты
          </button>
          <button 
            className={`admin-tab ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            Навыки
          </button>
          <button 
            className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Настройки
          </button>
          <button 
            className={`admin-tab ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            Сообщения
            {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
          </button>
        </div>

        <div className="admin-content">
          {activeTab === 'projects' ? (
            <>
              <div className="admin-form-section">
                <h2>{editingProject ? 'Редактировать проект' : 'Добавить новый проект'}</h2>
                <form onSubmit={handleSubmit} className="project-form">
                  <div className="form-group">
                    <label htmlFor="title">Название проекта *</label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="Название проекта"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Описание *</label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows="4"
                      placeholder="Описание проекта"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="tags">Теги (через запятую)</label>
                    <input
                      type="text"
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="React, Node.js, MongoDB"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="link">Ссылка на проект</label>
                    <input
                      type="url"
                      id="link"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="image">URL изображения</label>
                    <input
                      type="url"
                      id="image"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {error && <div className="error-message">{error}</div>}

                  <div className="form-actions">
                    <button type="submit" className="submit-button">
                      {editingProject ? 'Сохранить изменения' : 'Добавить проект'}
                    </button>
                    {editingProject && (
                      <button type="button" onClick={resetForm} className="cancel-button">
                        Отмена
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="admin-projects-section">
                <h2>Список проектов ({projects.length})</h2>
                {projects.length === 0 ? (
                  <div className="no-projects">Нет проектов. Добавьте первый проект!</div>
                ) : (
                  <div className="projects-list">
                    {projects.map(project => (
                      <div key={project.id} className="project-item">
                        {project.image && (
                          <img src={project.image} alt={project.title} className="project-item-image" />
                        )}
                        <div className="project-item-content">
                          <h3>{project.title}</h3>
                          <p>{project.description}</p>
                          {project.tags && project.tags.length > 0 && (
                            <div className="project-item-tags">
                              {project.tags.map((tag, index) => (
                                <span key={index} className="tag">{tag}</span>
                              ))}
                            </div>
                          )}
                          {project.link && (
                            <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-item-link">
                              Открыть проект →
                            </a>
                          )}
                        </div>
                        <div className="project-item-actions">
                          <button onClick={() => handleEdit(project)} className="edit-button">
                            Редактировать
                          </button>
                          <button onClick={() => handleDelete(project.id)} className="delete-button">
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'skills' ? (
            <>
              <div className="admin-form-section">
                <h2>{editingSkill ? 'Редактировать навык' : 'Добавить новый навык'}</h2>
                <form onSubmit={handleSkillSubmit} className="project-form">
                  <div className="form-group">
                    <label htmlFor="skill-name">Название навыка *</label>
                    <input
                      type="text"
                      id="skill-name"
                      value={skillFormData.name}
                      onChange={(e) => setSkillFormData({ ...skillFormData, name: e.target.value })}
                      required
                      placeholder="Например: React"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="skill-level">Уровень (0-100) *</label>
                    <input
                      type="number"
                      id="skill-level"
                      value={skillFormData.level}
                      onChange={(e) => setSkillFormData({ ...skillFormData, level: e.target.value })}
                      required
                      min="0"
                      max="100"
                      placeholder="90"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="skill-color">Цвет *</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input
                        type="color"
                        id="skill-color"
                        value={skillFormData.color}
                        onChange={(e) => setSkillFormData({ ...skillFormData, color: e.target.value })}
                        required
                        style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={skillFormData.color}
                        onChange={(e) => setSkillFormData({ ...skillFormData, color: e.target.value })}
                        placeholder="#667eea"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="skill-sortOrder">Порядок сортировки</label>
                    <input
                      type="number"
                      id="skill-sortOrder"
                      value={skillFormData.sortOrder}
                      onChange={(e) => setSkillFormData({ ...skillFormData, sortOrder: e.target.value })}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  {error && <div className="error-message">{error}</div>}

                  <div className="form-actions">
                    <button type="submit" className="submit-button">
                      {editingSkill ? 'Сохранить изменения' : 'Добавить навык'}
                    </button>
                    {editingSkill && (
                      <button type="button" onClick={resetSkillForm} className="cancel-button">
                        Отмена
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="admin-projects-section">
                <h2>Список навыков ({skills.length})</h2>
                {skills.length === 0 ? (
                  <div className="no-projects">Нет навыков. Добавьте первый навык!</div>
                ) : (
                  <div className="projects-list">
                    {skills.map(skill => (
                      <div key={skill.id} className="project-item">
                        <div style={{ 
                          width: '60px', 
                          height: '60px', 
                          borderRadius: '8px', 
                          background: skill.color,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}>
                          {skill.name.charAt(0)}
                        </div>
                        <div className="project-item-content">
                          <h3>{skill.name}</h3>
                          <p>Уровень: {skill.level}%</p>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Цвет:</span>
                            <div style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '4px',
                              background: skill.color,
                              border: '1px solid rgba(255,255,255,0.2)'
                            }} />
                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{skill.color}</span>
                          </div>
                        </div>
                        <div className="project-item-actions">
                          <button onClick={() => handleEditSkill(skill)} className="edit-button">
                            Редактировать
                          </button>
                          <button onClick={() => handleDeleteSkill(skill.id)} className="delete-button">
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'settings' ? (
            <div className="admin-settings-section">
              <h2>Настройки сайта</h2>
              
              <div className="settings-form">
                <h3 style={{ color: '#ffffff', marginBottom: '20px', fontSize: '1.2rem' }}>Описание</h3>
                <div className="form-group">
                  <label htmlFor="hero-description">Описание под заголовком *</label>
                  <textarea
                    id="hero-description"
                    value={heroDescription}
                    onChange={(e) => setHeroDescription(e.target.value)}
                    required
                    rows="4"
                    placeholder="Создаю современные веб-приложения с красивым дизайном и отличным пользовательским опытом"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#ffffff',
                      fontFamily: 'inherit',
                      fontSize: '1rem',
                      width: '100%',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <button onClick={handleUpdateDescription} className="submit-button" style={{ marginTop: '16px' }}>
                  Сохранить описание
                </button>
              </div>

              <div className="settings-form" style={{ marginTop: '40px' }}>
                <h3 style={{ color: '#ffffff', marginBottom: '20px', fontSize: '1.2rem' }}>Контакты</h3>
                
                <div className="form-group">
                  <label htmlFor="contact-email">Email *</label>
                  <input
                    type="email"
                    id="contact-email"
                    value={contactsInfo.email}
                    onChange={(e) => setContactsInfo({ ...contactsInfo, email: e.target.value })}
                    required
                    placeholder="contact@esteria.com"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#ffffff',
                      fontFamily: 'inherit',
                      fontSize: '1rem',
                      width: '100%'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-telegram">Telegram</label>
                  <input
                    type="text"
                    id="contact-telegram"
                    value={contactsInfo.telegram}
                    onChange={(e) => setContactsInfo({ ...contactsInfo, telegram: e.target.value })}
                    placeholder="@esteria или https://t.me/esteria"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#ffffff',
                      fontFamily: 'inherit',
                      fontSize: '1rem',
                      width: '100%'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-github">GitHub</label>
                  <input
                    type="text"
                    id="contact-github"
                    value={contactsInfo.github}
                    onChange={(e) => setContactsInfo({ ...contactsInfo, github: e.target.value })}
                    placeholder="github.com/esteria или https://github.com/esteria"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#ffffff',
                      fontFamily: 'inherit',
                      fontSize: '1rem',
                      width: '100%'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-linkedin">LinkedIn</label>
                  <input
                    type="text"
                    id="contact-linkedin"
                    value={contactsInfo.linkedin}
                    onChange={(e) => setContactsInfo({ ...contactsInfo, linkedin: e.target.value })}
                    placeholder="linkedin.com/in/esteria или https://linkedin.com/in/esteria"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#ffffff',
                      fontFamily: 'inherit',
                      fontSize: '1rem',
                      width: '100%'
                    }}
                  />
                </div>

                {error && <div className="error-message">{error}</div>}
                <button onClick={handleUpdateContacts} className="submit-button" style={{ marginTop: '16px' }}>
                  Сохранить контакты
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-contacts-section">
              <h2>Сообщения от посетителей ({contacts.length})</h2>
              {contacts.length === 0 ? (
                <div className="no-contacts">Нет сообщений</div>
              ) : (
                <div className="contacts-list">
                  {contacts.map(contact => (
                    <div 
                      key={contact.id} 
                      className={`contact-item ${contact.read ? '' : 'unread'} ${deletingContacts.has(contact.id) ? 'deleting' : ''}`}
                    >
                      <div className="contact-item-header">
                        <div className="contact-item-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <h3>{contact.name}</h3>
                            <div className="status-badge-container">
                              {!contact.read ? (
                                <span 
                                  key={`new-${contact.id}`} 
                                  className={`status-badge status-new ${animatingContacts.has(contact.id) ? 'status-transition-out' : 'status-transition-in'}`}
                                >
                                  <span className="badge-icon">✨</span>
                                  <span className="badge-text">NEW</span>
                                </span>
                              ) : (
                                <span 
                                  key={`successful-${contact.id}`} 
                                  className={`status-badge status-successful ${animatingContacts.has(contact.id) ? 'status-transition-in' : 'status-transition-in'}`}
                                >
                                  <span className="badge-icon">✓</span>
                                  <span className="badge-text">SUCCESSFUL</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="contact-email">{contact.email}</span>
                          {contact.contactMethod && (
                            <span className="contact-method">Способ связи: {contact.contactMethod}</span>
                          )}
                          <span className="contact-date">
                            {new Date(contact.createdAt).toLocaleString('ru-RU')}
                          </span>
                        </div>
                        <div className="contact-item-actions">
                          {!contact.read && (
                            <button 
                              onClick={() => handleMarkAsRead(contact.id)} 
                              className="mark-read-button"
                            >
                              Отметить прочитанным
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteContact(contact.id)} 
                            className="delete-button"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                      <div className="contact-message">
                        <p>{contact.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Admin

