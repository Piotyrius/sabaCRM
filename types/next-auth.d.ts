import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      officeId?: string | null
      departmentId?: string | null
      deskId?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    officeId?: string | null
    departmentId?: string | null
    deskId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    officeId?: string | null
    departmentId?: string | null
    deskId?: string | null
  }
}

