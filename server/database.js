import initSqlJs from 'sql.js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'portfolio.db')
let SQL = null
let db = null

// Инициализация базы данных
export const initDatabase = async () => {
  if (!SQL) {
    SQL = await initSqlJs()
  }

  // Загрузка или создание базы данных
  try {
    const buffer = await fs.readFile(dbPath)
    db = new SQL.Database(new Uint8Array(buffer))
    console.log('Database loaded from file:', dbPath)
  } catch (error) {
    db = new SQL.Database()
    console.log('New database created')
  }

  // Создание таблицы проектов
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      tags TEXT,
      link TEXT,
      image TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    )
  `)

  // Создание таблицы админов
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `)

  // Создание таблицы контактов/сообщений
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      contactMethod TEXT,
      message TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      read INTEGER DEFAULT 0
    )
  `)

  // Создание таблицы навыков
  db.run(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      level INTEGER NOT NULL CHECK(level >= 0 AND level <= 100),
      color TEXT NOT NULL,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `)

  // Создание таблицы настроек
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)

  // Инициализация настроек по умолчанию
  const defaultDescStmt = db.prepare('SELECT * FROM settings WHERE key = ?')
  defaultDescStmt.bind(['heroDescription'])
  const defaultDescription = defaultDescStmt.getAsObject()
  defaultDescStmt.free()
  
  if (!defaultDescription || Object.keys(defaultDescription).length === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)')
    insertSetting.run([
      'heroDescription',
      'Создаю современные веб-приложения с красивым дизайном и отличным пользовательским опытом.',
      new Date().toISOString()
    ])
    insertSetting.free()
  }

  // Инициализация контактов по умолчанию
  const defaultContacts = [
    { key: 'contactEmail', value: 'contact@esteria.com' },
    { key: 'contactTelegram', value: '@virtssy' },
    { key: 'contactGitHub', value: 'github.com/yasimmy' },
    { key: 'contactLinkedIn', value: 'linkedin.com/in/esteria' }
  ]

  defaultContacts.forEach(contact => {
    const checkStmt = db.prepare('SELECT * FROM settings WHERE key = ?')
    checkStmt.bind([contact.key])
    const existing = checkStmt.getAsObject()
    checkStmt.free()
    
    if (!existing || Object.keys(existing).length === 0) {
      const insertContact = db.prepare('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)')
      insertContact.run([contact.key, contact.value, new Date().toISOString()])
      insertContact.free()
    }
  })

  // Инициализация навыков по умолчанию
  const skillsCountStmt = db.prepare('SELECT COUNT(*) as count FROM skills')
  const skillsCountResult = skillsCountStmt.getAsObject()
  skillsCountStmt.free()
  const skillsCount = skillsCountResult.count || 0
  
  if (skillsCount === 0) {
    const defaultSkills = [
      ['React', 90, '#61DAFB', 0],
      ['Node.js', 85, '#339933', 1],
      ['JavaScript', 95, '#F7DF1E', 2],
      ['TypeScript', 80, '#3178C6', 3],
      ['HTML/CSS', 95, '#E34F26', 4],
      ['MongoDB', 75, '#47A248', 5],
      ['Express', 85, '#000000', 6],
      ['Git', 90, '#F05032', 7]
    ]
    const insertSkill = db.prepare('INSERT INTO skills (name, level, color, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?)')
    defaultSkills.forEach(skill => {
      insertSkill.run([...skill, new Date().toISOString()])
    })
    insertSkill.free()
    console.log('Default skills initialized')
  }

  // Проверка существования админа
  const adminStmt = db.prepare('SELECT * FROM admins WHERE username = ?')
  adminStmt.bind(['root'])
  const admin = adminStmt.getAsObject()
  adminStmt.free()
  
  if (!admin || Object.keys(admin).length === 0) {
    // Создание админа root/root
    const hashedPassword = await bcrypt.hash('root', 10)
    const insertAdmin = db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)')
    insertAdmin.run(['root', hashedPassword])
    insertAdmin.free()
    console.log('Admin user created: root/root')
  }

  // Сохранение базы данных
  await saveDatabase()
}

// Сохранение базы данных в файл
const saveDatabase = async () => {
  if (!db) {
    console.error('Cannot save database: database not initialized')
    return
  }
  
  try {
    const data = db.export()
    const buffer = Buffer.from(data)
    await fs.writeFile(dbPath, buffer)
    console.log('Database saved successfully to:', dbPath)
  } catch (error) {
    console.error('Error saving database:', error)
  }
}

// Проекты
export const getAllProjects = () => {
  const result = db.exec('SELECT * FROM projects ORDER BY createdAt DESC')
  if (result.length === 0) return []
  
  return result[0].values.map(row => {
    const cols = result[0].columns
    const project = {}
    cols.forEach((col, idx) => {
      project[col] = row[idx]
    })
    project.tags = project.tags ? JSON.parse(project.tags) : []
    return project
  })
}

export const getProjectById = (id) => {
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?')
  stmt.bind([id])
  const result = stmt.getAsObject()
  stmt.free()
  
  if (!result || Object.keys(result).length === 0) return null
  
  const project = { ...result }
  project.tags = project.tags ? JSON.parse(project.tags) : []
  return project
}

export const createProject = async (project) => {
  const stmt = db.prepare(`
    INSERT INTO projects (id, title, description, tags, link, image, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run([
    project.id,
    project.title,
    project.description,
    JSON.stringify(project.tags || []),
    project.link || '',
    project.image || '',
    project.createdAt
  ])
  stmt.free()
  await saveDatabase()
  return getProjectById(project.id)
}

export const updateProject = async (id, project) => {
  const stmt = db.prepare(`
    UPDATE projects 
    SET title = ?, description = ?, tags = ?, link = ?, image = ?, updatedAt = ?
    WHERE id = ?
  `)
  stmt.run([
    project.title,
    project.description,
    JSON.stringify(project.tags || []),
    project.link || '',
    project.image || '',
    project.updatedAt,
    id
  ])
  stmt.free()
  await saveDatabase()
  return getProjectById(id)
}

export const deleteProject = async (id) => {
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?')
  stmt.run([id])
  stmt.free()
  await saveDatabase()
}

// Админы
export const getAdminByUsername = (username) => {
  const stmt = db.prepare('SELECT * FROM admins WHERE username = ?')
  stmt.bind([username])
  const result = stmt.getAsObject()
  stmt.free()
  
  if (!result || Object.keys(result).length === 0) return null
  return result
}

export const verifyAdmin = async (username, password) => {
  // Прямая проверка для root/root
  if (username === 'root' && password === 'root') {
    const admin = getAdminByUsername('root')
    if (!admin) {
      // Создаем админа если его нет
      const hashedPassword = await bcrypt.hash('root', 10)
      const insertAdmin = db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)')
      insertAdmin.run(['root', hashedPassword])
      insertAdmin.free()
      await saveDatabase()
    }
    return { username: 'root', id: 1 }
  }

  const admin = getAdminByUsername(username)
  if (!admin) {
    return null
  }

  const isValid = await bcrypt.compare(password, admin.password)
  return isValid ? { username: admin.username, id: admin.id } : null
}

// Контакты/Сообщения
export const createContact = async (contact) => {
  const stmt = db.prepare(`
    INSERT INTO contacts (name, email, contactMethod, message, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `)
  stmt.run([
    contact.name,
    contact.email,
    contact.contactMethod || '',
    contact.message,
    contact.createdAt
  ])
  stmt.free()
  await saveDatabase()
  
  const result = db.exec('SELECT * FROM contacts ORDER BY id DESC LIMIT 1')
  if (result.length === 0 || result[0].values.length === 0) return null
  
  const row = result[0].values[0]
  const cols = result[0].columns
  const savedContact = {}
  cols.forEach((col, idx) => {
    savedContact[col] = row[idx]
  })
  return savedContact
}

export const getAllContacts = () => {
  const result = db.exec('SELECT * FROM contacts ORDER BY createdAt DESC')
  if (result.length === 0) return []
  
  return result[0].values.map(row => {
    const cols = result[0].columns
    const contact = {}
    cols.forEach((col, idx) => {
      contact[col] = row[idx]
    })
    return contact
  })
}

export const getContactById = (id) => {
  const stmt = db.prepare('SELECT * FROM contacts WHERE id = ?')
  stmt.bind([id])
  const result = stmt.getAsObject()
  stmt.free()
  
  if (!result || Object.keys(result).length === 0) return null
  return result
}

export const markContactAsRead = async (id) => {
  const stmt = db.prepare('UPDATE contacts SET read = 1 WHERE id = ?')
  stmt.run([id])
  stmt.free()
  await saveDatabase()
}

export const deleteContact = async (id) => {
  const stmt = db.prepare('DELETE FROM contacts WHERE id = ?')
  stmt.run([id])
  stmt.free()
  await saveDatabase()
}

export const getUnreadCount = () => {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE read = 0')
  const result = stmt.getAsObject()
  stmt.free()
  return result.count || 0
}

// Навыки
export const getAllSkills = () => {
  const result = db.exec('SELECT * FROM skills ORDER BY sortOrder ASC, createdAt ASC')
  if (result.length === 0) return []
  
  return result[0].values.map(row => {
    const cols = result[0].columns
    const skill = {}
    cols.forEach((col, idx) => {
      skill[col] = row[idx]
    })
    return skill
  })
}

export const getSkillById = (id) => {
  const stmt = db.prepare('SELECT * FROM skills WHERE id = ?')
  stmt.bind([id])
  const result = stmt.getAsObject()
  stmt.free()
  
  if (!result || Object.keys(result).length === 0) return null
  return result
}

export const createSkill = async (skill) => {
  const stmt = db.prepare(`
    INSERT INTO skills (name, level, color, sortOrder, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `)
  stmt.run([
    skill.name,
    skill.level,
    skill.color,
    skill.sortOrder || 0,
    skill.createdAt
  ])
  stmt.free()
  await saveDatabase()
  
  const result = db.exec('SELECT * FROM skills ORDER BY id DESC LIMIT 1')
  if (result.length === 0 || result[0].values.length === 0) return null
  
  const row = result[0].values[0]
  const cols = result[0].columns
  const savedSkill = {}
  cols.forEach((col, idx) => {
    savedSkill[col] = row[idx]
  })
  return savedSkill
}

export const updateSkill = async (id, skill) => {
  const stmt = db.prepare(`
    UPDATE skills 
    SET name = ?, level = ?, color = ?, sortOrder = ?, updatedAt = ?
    WHERE id = ?
  `)
  stmt.run([
    skill.name,
    skill.level,
    skill.color,
    skill.sortOrder || 0,
    new Date().toISOString(),
    id
  ])
  stmt.free()
  await saveDatabase()
  return getSkillById(id)
}

export const deleteSkill = async (id) => {
  const stmt = db.prepare('DELETE FROM skills WHERE id = ?')
  stmt.run([id])
  stmt.free()
  await saveDatabase()
}

// Настройки
export const getSetting = (key) => {
  if (!db) {
    console.error('Cannot get setting: database not initialized')
    return null
  }
  
  const stmt = db.prepare('SELECT * FROM settings WHERE key = ?')
  stmt.bind([key])
  const result = stmt.getAsObject()
  stmt.free()
  
  if (!result || Object.keys(result).length === 0) {
    console.log(`Setting ${key} not found in database`)
    return null
  }
  
  console.log(`Retrieved setting ${key}:`, result.value)
  return result.value
}

export const setSetting = async (key, value) => {
  if (!db) {
    throw new Error('Database not initialized')
  }
  
  if (value === undefined || value === null) {
    throw new Error('Value cannot be undefined or null')
  }
  
  const stmt = db.prepare('SELECT * FROM settings WHERE key = ?')
  stmt.bind([key])
  const existing = stmt.getAsObject()
  stmt.free()
  
  if (existing && Object.keys(existing).length > 0) {
    console.log(`Updating existing setting: ${key}`)
    const updateStmt = db.prepare('UPDATE settings SET value = ?, updatedAt = ? WHERE key = ?')
    updateStmt.run([value, new Date().toISOString(), key])
    updateStmt.free()
  } else {
    console.log(`Inserting new setting: ${key}`)
    const insertStmt = db.prepare('INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)')
    insertStmt.run([key, value, new Date().toISOString()])
    insertStmt.free()
  }
  
  await saveDatabase()
  console.log(`Setting ${key} saved to database`)
  
  const result = getSetting(key)
  console.log(`Retrieved setting ${key} from database:`, result)
  
  return result
}

export default db
