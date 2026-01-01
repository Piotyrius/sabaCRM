const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testLogin() {
  try {
    const email = 'admin@sabacrm.com'
    const password = 'admin123'

    console.log('Testing login...')
    console.log('Email:', email)
    console.log('Password:', password)

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        office: true,
        department: true,
        desk: true
      }
    })

    if (!user) {
      console.log('❌ User not found!')
      return
    }

    console.log('✅ User found')
    console.log('Role:', user.role)

    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('Password valid:', isPasswordValid)

    if (isPasswordValid) {
      console.log('\n✅ Login should work!')
      console.log('User data:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        officeId: user.officeId,
        departmentId: user.departmentId,
        deskId: user.deskId,
      })
    } else {
      console.log('❌ Password is incorrect')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()

