const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("Creating test users...")

  const users = [
    {
      email: "admin@test.com",
      password: "admin123",
      name: "Admin User",
      role: "ADMIN",
    },
    {
      email: "executive@test.com",
      password: "executive123",
      name: "Executive User",
      role: "EXECUTIVE",
    },
    {
      email: "teamleader@test.com",
      password: "teamleader123",
      name: "Team Leader User",
      role: "TEAM_LEADER",
    },
    {
      email: "manager@test.com",
      password: "manager123",
      name: "Manager User",
      role: "MANAGER",
    },
  ]

  for (const userData of users) {
    try {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      if (existing) {
        console.log(`User ${userData.email} already exists, skipping...`)
        continue
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10)

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
        },
      })

      console.log(`✅ Created ${userData.role} user: ${userData.email}`)
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message)
    }
  }

  console.log("\n📋 Test Users Created:")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("ADMIN:")
  console.log("  Email: admin@test.com")
  console.log("  Password: admin123")
  console.log("\nEXECUTIVE:")
  console.log("  Email: executive@test.com")
  console.log("  Password: executive123")
  console.log("\nTEAM LEADER:")
  console.log("  Email: teamleader@test.com")
  console.log("  Password: teamleader123")
  console.log("\nMANAGER:")
  console.log("  Email: manager@test.com")
  console.log("  Password: manager123")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

main()
  .catch((e) => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

