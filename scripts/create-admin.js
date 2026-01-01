const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const email = 'admin@sabacrm.com'
    const password = 'admin123'
    const name = 'Admin User'

    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log('Admin user already exists!')
      console.log(`Email: ${email}`)
      console.log('You can update the password if needed.')
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN',
      },
    })

    console.log('✅ Admin user created successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('Role: ADMIN')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('⚠️  Please change the password after first login!')
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    if (error.message && error.message.includes('P1001')) {
      console.error('\n💡 Database connection error!')
      console.error('Please check your DATABASE_URL in .env file')
      console.error('Make sure PostgreSQL is running and the database exists')
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

