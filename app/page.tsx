import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="z-10 max-w-4xl w-full items-center justify-center">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">sabaCRM</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Comprehensive CRM System for Managing Clients, Teams, and Sales
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Create a new account to access the CRM system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/register">
                <Button className="w-full" size="lg">
                  Register Now
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Already have an account?</CardTitle>
              <CardDescription>
                Sign in to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/login">
                <Button className="w-full" size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Or go directly to{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Login
            </Link>
            {" "}or{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

