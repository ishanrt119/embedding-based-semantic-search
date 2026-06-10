"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Shield, Lock, Database, ArrowDown, FileText, CheckCircle2, X, Check, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")

  // Real-time validations
  const isFirstNameValid = firstName.length >= 2 && /^[a-zA-Z\s]+$/.test(firstName)
  const isLastNameValid = lastName.length >= 2 && /^[a-zA-Z\s]+$/.test(lastName)
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const reqs = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  }

  const isPasswordValid = Object.values(reqs).every(Boolean)
  const isConfirmPasswordValid = confirmPassword.length > 0 && confirmPassword === password
  const isFormValid = isFirstNameValid && isLastNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid

  // Strength Calculation
  const getStrength = () => {
    if (password.length === 0) return { score: 0, label: "", color: "bg-gray-100" }
    const passedChecks = Object.values(reqs).filter(Boolean).length
    
    if (passedChecks <= 2) return { score: 25, label: "Weak", color: "bg-red-500", textClass: "text-red-600" }
    if (passedChecks === 3 || passedChecks === 4) return { score: 50, label: "Medium", color: "bg-orange-500", textClass: "text-orange-600" }
    if (passedChecks === 5 && password.length >= 12) return { score: 100, label: "Very Strong", color: "bg-green-500", textClass: "text-green-600" }
    if (passedChecks === 5) return { score: 75, label: "Strong", color: "bg-blue-500", textClass: "text-blue-600" }
    
    return { score: 0, label: "", color: "bg-gray-100", textClass: "text-gray-500" }
  }

  const strength = getStrength()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setServerError("")
    setIsSubmitting(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password,
          confirm_password: confirmPassword,
          first_name: firstName,
          last_name: lastName
        })
      })
      
      const data = await res.json()
      if (!res.ok || data.success === false) {
        throw new Error(data.message || data.detail || "Registration failed")
      }
      
      router.push("/login?registered=true")
    } catch (err: any) {
      setServerError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const RequirementItem = ({ isValid, label }: { isValid: boolean, label: string }) => (
    <div className={`flex items-center gap-2 text-xs font-medium transition-colors ${isValid ? 'text-green-600' : 'text-red-600'}`}>
      {isValid ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-white">
      
      {/* Left: Product Branding & Workflow */}
      <div className="hidden lg:flex flex-col flex-1 bg-[#F8FAFC] border-r border-gray-200 p-12 justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative z-10 flex flex-col h-full justify-between">
          <Link href="/" className="flex items-center gap-2 w-fit hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">A</div>
            <span className="font-bold text-lg tracking-tight text-gray-900">DocIntel</span>
          </Link>

          <div className="max-w-lg space-y-8 my-auto py-12">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                Build your organization's searchable knowledge hub.
              </h1>
              <p className="mt-4 text-base text-gray-600 leading-relaxed">
                Upload documents, generate embeddings, search intelligently, and collaborate with your team's knowledge.
              </p>
            </div>
            
            {/* Visual Workflow Diagram */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm my-8">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4 bg-[#F8FAFC] border border-gray-200 p-3 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">1. Documents</span>
                </div>
                <ArrowDown className="w-4 h-4 text-gray-300 mx-auto" />
                <div className="flex items-center gap-4 bg-[#F8FAFC] border border-gray-200 p-3 rounded-lg">
                  <Database className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">2. Chunking & Embeddings</span>
                </div>
                <ArrowDown className="w-4 h-4 text-gray-300 mx-auto" />
                <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">3. Citation-Aware Answers</span>
                </div>
              </div>
            </div>

            {/* Benefits List */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm text-gray-700">
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Multi-Dataset Management</div>
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Semantic Search</div>
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Secure Document Storage</div>
              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> Analytics & Insights</div>
            </div>
          </div>

          <div className="text-sm text-gray-500 flex items-center justify-between mt-auto">
            <span>© 2026 DocIntel Search Inc.</span>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-900">Terms</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Registration Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 relative bg-white py-12 overflow-y-auto">
        <div className="w-full max-w-[500px] mx-auto">
          
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2 mb-10 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">A</div>
            <span className="font-bold text-lg tracking-tight text-gray-900">DocIntel</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Create an account</h2>
            <p className="text-sm text-gray-500 mt-2">Get started with DocIntel for free.</p>
          </div>

          {serverError && (
            <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200 flex items-start gap-2">
              <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-[10px]">!</div>
              {serverError}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Row 1: First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName"
                    type="text" 
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className={`h-10 ${firstName && !isFirstNameValid ? 'border-red-500 focus-visible:ring-red-500' : firstName && isFirstNameValid ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
                  />
                  {firstName && !isFirstNameValid && <p className="text-[10px] text-red-500 font-medium">Min 2 chars, letters only</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName"
                    type="text" 
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Doe"
                    className={`h-10 ${lastName && !isLastNameValid ? 'border-red-500 focus-visible:ring-red-500' : lastName && isLastNameValid ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
                  />
                  {lastName && !isLastNameValid && <p className="text-[10px] text-red-500 font-medium">Min 2 chars, letters only</p>}
                </div>
              </div>

              {/* Row 2: Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email"
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={`h-10 ${email && !isEmailValid ? 'border-red-500 focus-visible:ring-red-500' : email && isEmailValid ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
                />
                {email && !isEmailValid && <p className="text-[10px] text-red-500 font-medium">Please enter a valid email format</p>}
              </div>

              {/* Row 3: Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`h-10 pr-10 ${password && !isPasswordValid ? 'border-red-500 focus-visible:ring-red-500' : password && isPasswordValid ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {password.length > 0 && (
                  <div className="pt-2 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-gray-700">Password Strength</span>
                        <span className={`font-bold ${strength.textClass}`}>{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full transition-all duration-300 ease-out ${strength.color}`} 
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                      <RequirementItem isValid={reqs.length} label="Minimum 8 characters" />
                      <RequirementItem isValid={reqs.upper} label="One uppercase letter" />
                      <RequirementItem isValid={reqs.lower} label="One lowercase letter" />
                      <RequirementItem isValid={reqs.number} label="One number" />
                      <RequirementItem isValid={reqs.special} label="One special character" />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 4: Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={!password}
                    className={`h-10 pr-10 ${
                      confirmPassword && !isConfirmPasswordValid ? 'border-red-500 text-red-600 focus-visible:ring-red-500' : 
                      confirmPassword && isConfirmPasswordValid ? 'border-green-500 text-green-600 focus-visible:ring-green-500' : ''
                    }`}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    disabled={!password}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && !isConfirmPasswordValid && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 mt-1">
                    <X className="w-3.5 h-3.5" /> Passwords do not match
                  </div>
                )}
                {confirmPassword && isConfirmPasswordValid && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 mt-1">
                    <Check className="w-3.5 h-3.5" /> Passwords match
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium transition-all"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isSubmitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </div>

          <p className="text-sm text-center text-gray-600 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </p>

          {/* Trust Indicators */}
          <div className="mt-8 flex items-center justify-center gap-6 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Secure Auth</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Encrypted Storage</span>
            <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Enterprise Search</span>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-gray-400">Built with ❤️ by Ishan Toraskar</p>
          </div>

        </div>
      </div>

    </div>
  )
}
