const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const email = 'admin@sabacrm.com'
    
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log('❌ User not found!')
      return
    }

    console.log('✅ User found!')
    console.log('Email:', user.email)
    console.log('Name:', user.name)
    console.log('Role:', user.role)
    console.log('Password hash:', user.password.substring(0, 20) + '...')
    console.log('Created at:', user.createdAt)

    // Test password
    const testPassword = 'admin123'
    const isValid = await bcrypt.compare(testPassword, user.password)
    console.log('Password "admin123" is valid:', isValid)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()

