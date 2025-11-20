import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import {
  initDatabase,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  verifyAdmin,
  createContact,
  getAllContacts,
  getContactById,
  markContactAsRead,
  deleteContact,
  getUnreadCount,
  getAllSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
  getSetting,
  setSetting
} from './database.js'

const app = express()
const PORT = 3001
const JWT_SECRET = 'your-secret-key-change-in-production'

// Middleware
app.use(cors())
app.use(express.json())

// Логирование запросов для отладки
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Middleware для проверки авторизации
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ message: 'Недействительный токен' })
  }
}

// API Routes

// Проверка авторизации
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user })
})

// Вход
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // Проверка логина и пароля
    if (username === 'root' && password === 'root') {
      const token = jwt.sign({ username: 'root' }, JWT_SECRET, { expiresIn: '24h' })
      return res.json({ token, message: 'Успешный вход' })
    }

    // Проверка через базу данных
    const admin = await verifyAdmin(username, password)
    
    if (!admin) {
      return res.status(401).json({ message: 'Неверный логин или пароль' })
    }

    const token = jwt.sign({ username: admin.username }, JWT_SECRET, { expiresIn: '24h' })
    res.json({ token, message: 'Успешный вход' })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Получить все проекты (публичный доступ)
app.get('/api/projects', (req, res) => {
  try {
    const projects = getAllProjects()
    res.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    res.status(500).json({ message: 'Ошибка загрузки проектов' })
  }
})

// Получить все проекты (требуется авторизация для админки)
app.get('/api/admin/projects', authenticateToken, (req, res) => {
  try {
    const projects = getAllProjects()
    res.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    res.status(500).json({ message: 'Ошибка загрузки проектов' })
  }
})

// Создать проект
app.post('/api/projects', authenticateToken, (req, res) => {
  try {
    const newProject = {
      id: Date.now().toString(),
      title: req.body.title,
      description: req.body.description,
      tags: req.body.tags || [],
      link: req.body.link || '',
      image: req.body.image || '',
      createdAt: new Date().toISOString()
    }
    const project = createProject(newProject)
    res.status(201).json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    res.status(500).json({ message: 'Ошибка создания проекта' })
  }
})

// Обновить проект
app.put('/api/projects/:id', authenticateToken, (req, res) => {
  try {
    const existingProject = getProjectById(req.params.id)
    
    if (!existingProject) {
      return res.status(404).json({ message: 'Проект не найден' })
    }

    const updatedProject = {
      title: req.body.title,
      description: req.body.description,
      tags: req.body.tags || [],
      link: req.body.link || '',
      image: req.body.image || '',
      updatedAt: new Date().toISOString()
    }

    const project = updateProject(req.params.id, updatedProject)
    res.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    res.status(500).json({ message: 'Ошибка обновления проекта' })
  }
})

// Удалить проект
app.delete('/api/projects/:id', authenticateToken, (req, res) => {
  try {
    const project = getProjectById(req.params.id)
    
    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' })
    }

    deleteProject(req.params.id)
    res.json({ message: 'Проект удален' })
  } catch (error) {
    console.error('Error deleting project:', error)
    res.status(500).json({ message: 'Ошибка удаления проекта' })
  }
})

// Создать контакт/сообщение (публичный доступ)
app.post('/api/contacts', (req, res) => {
  try {
    console.log('POST /api/contacts - Received data:', req.body)
    
    if (!req.body.name || !req.body.email || !req.body.message) {
      return res.status(400).json({ message: 'Не заполнены обязательные поля' })
    }

    const contact = {
      name: req.body.name,
      email: req.body.email,
      contactMethod: req.body.contactMethod || '',
      message: req.body.message,
      createdAt: new Date().toISOString()
    }
    
    const savedContact = createContact(contact)
    console.log('Contact created successfully:', savedContact.id)
    res.status(201).json({ ...savedContact, message: 'Сообщение успешно отправлено' })
  } catch (error) {
    console.error('Error creating contact:', error)
    res.status(500).json({ message: 'Ошибка отправки сообщения: ' + error.message })
  }
})

// Получить все сообщения (требуется авторизация)
app.get('/api/contacts', authenticateToken, (req, res) => {
  try {
    const contacts = getAllContacts()
    res.json(contacts)
  } catch (error) {
    console.error('Error fetching contacts:', error)
    res.status(500).json({ message: 'Ошибка загрузки сообщений' })
  }
})

// Получить количество непрочитанных сообщений
app.get('/api/contacts/unread-count', authenticateToken, (req, res) => {
  try {
    const count = getUnreadCount()
    res.json({ count })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    res.status(500).json({ message: 'Ошибка загрузки' })
  }
})

// Отметить сообщение как прочитанное
app.put('/api/contacts/:id/read', authenticateToken, (req, res) => {
  try {
    markContactAsRead(req.params.id)
    res.json({ message: 'Сообщение отмечено как прочитанное' })
  } catch (error) {
    console.error('Error marking contact as read:', error)
    res.status(500).json({ message: 'Ошибка обновления' })
  }
})

// Удалить сообщение
app.delete('/api/contacts/:id', authenticateToken, (req, res) => {
  try {
    deleteContact(req.params.id)
    res.json({ message: 'Сообщение удалено' })
  } catch (error) {
    console.error('Error deleting contact:', error)
    res.status(500).json({ message: 'Ошибка удаления сообщения' })
  }
})

// Получить все навыки (публичный доступ)
app.get('/api/skills', (req, res) => {
  try {
    const skills = getAllSkills()
    res.json(skills)
  } catch (error) {
    console.error('Error fetching skills:', error)
    res.status(500).json({ message: 'Ошибка загрузки навыков' })
  }
})

// Получить все навыки (требуется авторизация для админки)
app.get('/api/admin/skills', authenticateToken, (req, res) => {
  try {
    const skills = getAllSkills()
    res.json(skills)
  } catch (error) {
    console.error('Error fetching skills:', error)
    res.status(500).json({ message: 'Ошибка загрузки навыков' })
  }
})

// Создать навык
app.post('/api/skills', authenticateToken, (req, res) => {
  try {
    const newSkill = {
      name: req.body.name,
      level: parseInt(req.body.level) || 0,
      color: req.body.color || '#667eea',
      sortOrder: parseInt(req.body.sortOrder) || 0,
      createdAt: new Date().toISOString()
    }
    const skill = createSkill(newSkill)
    res.status(201).json(skill)
  } catch (error) {
    console.error('Error creating skill:', error)
    res.status(500).json({ message: 'Ошибка создания навыка' })
  }
})

// Обновить навык
app.put('/api/skills/:id', authenticateToken, (req, res) => {
  try {
    const existingSkill = getSkillById(req.params.id)
    
    if (!existingSkill) {
      return res.status(404).json({ message: 'Навык не найден' })
    }

    const updatedSkill = {
      name: req.body.name,
      level: parseInt(req.body.level) || 0,
      color: req.body.color || '#667eea',
      sortOrder: parseInt(req.body.sortOrder) || 0
    }

    const skill = updateSkill(req.params.id, updatedSkill)
    res.json(skill)
  } catch (error) {
    console.error('Error updating skill:', error)
    res.status(500).json({ message: 'Ошибка обновления навыка' })
  }
})

// Удалить навык
app.delete('/api/skills/:id', authenticateToken, (req, res) => {
  try {
    const skill = getSkillById(req.params.id)
    
    if (!skill) {
      return res.status(404).json({ message: 'Навык не найден' })
    }

    deleteSkill(req.params.id)
    res.json({ message: 'Навык удален' })
  } catch (error) {
    console.error('Error deleting skill:', error)
    res.status(500).json({ message: 'Ошибка удаления навыка' })
  }
})

// Получить настройку
app.get('/api/settings/:key', (req, res) => {
  try {
    const { key } = req.params
    const value = getSetting(key)
    console.log(`Fetching setting ${key}:`, value)
    res.json({ key, value: value !== null && value !== undefined ? value : '' })
  } catch (error) {
    console.error('Error fetching setting:', error)
    res.status(500).json({ message: 'Ошибка загрузки настройки: ' + error.message })
  }
})

// Обновить настройку
app.put('/api/settings/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params
    const { value } = req.body
    
    console.log(`Updating setting ${key} with value:`, value)
    
    if (value === undefined || value === null) {
      return res.status(400).json({ message: 'Значение не может быть пустым' })
    }
    
    const updatedValue = await setSetting(key, value)
    console.log(`Setting ${key} updated successfully. New value:`, updatedValue)
    
    res.json({ key, value: updatedValue })
  } catch (error) {
    console.error('Error updating setting:', error)
    res.status(500).json({ message: 'Ошибка обновления настройки: ' + error.message })
  }
})

// Получить все контакты (публичный доступ)
app.get('/api/contacts-info', (req, res) => {
  try {
    const contacts = {
      email: getSetting('contactEmail') || 'contact@esteria.com',
      telegram: getSetting('contactTelegram') || '@virtssy',
      github: getSetting('contactGitHub') || 'github.com/yasimmy',
      linkedin: getSetting('contactLinkedIn') || 'linkedin.com/in/esteria'
    }
    res.json(contacts)
  } catch (error) {
    console.error('Error fetching contacts info:', error)
    res.status(500).json({ message: 'Ошибка загрузки контактов' })
  }
})

// Обновить контакты (требуется авторизация)
app.put('/api/contacts-info', authenticateToken, async (req, res) => {
  try {
    const { email, telegram, github, linkedin } = req.body
    const updated = {}
    
    if (email !== undefined) {
      updated.email = await setSetting('contactEmail', email)
    }
    if (telegram !== undefined) {
      updated.telegram = await setSetting('contactTelegram', telegram)
    }
    if (github !== undefined) {
      updated.github = await setSetting('contactGitHub', github)
    }
    if (linkedin !== undefined) {
      updated.linkedin = await setSetting('contactLinkedIn', linkedin)
    }
    
    res.json(updated)
  } catch (error) {
    console.error('Error updating contacts info:', error)
    res.status(500).json({ message: 'Ошибка обновления контактов' })
  }
})

// Инициализация и запуск сервера
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
    console.log(`Database initialized: portfolio.db`)
    console.log(`SQL.js loaded successfully`)
  })
}).catch((error) => {
  console.error('Database initialization error:', error)
  process.exit(1)
})
