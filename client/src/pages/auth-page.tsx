import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Brain, BookOpen, Users, TrendingUp, Loader2 } from "lucide-react";
import { USER_ROLES, GRADE_LEVELS } from "@/lib/constants";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "student",
    grade: "",
    subjects: [] as string[],
  });

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Brain className="h-10 w-10 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">EduMind AI</h1>
            </div>
            <p className="text-gray-600">Intelligent Learning Platform</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>
                    Sign in to your account to continue learning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        type="text"
                        placeholder="Enter your username"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Register Tab */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join EduMind AI and start your learning journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          value={registerData.firstName}
                          onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          value={registerData.lastName}
                          onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="johndoe"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a strong password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={registerData.role} onValueChange={(value) => setRegisterData({ ...registerData, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          {USER_ROLES.map((role) => (
                            <SelectItem key={role.id} value={role.value}>
                              {role.icon} {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {registerData.role === 'student' && (
                      <div>
                        <Label htmlFor="grade">Grade Level</Label>
                        <Select value={registerData.grade} onValueChange={(value) => setRegisterData({ ...registerData, grade: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADE_LEVELS.map((grade) => (
                              <SelectItem key={grade.id} value={grade.value}>
                                {grade.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 p-8 text-white items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-4xl font-bold mb-6">Transform Education with AI</h2>
          <p className="text-xl mb-8 text-blue-100">
            Experience personalized learning, intelligent tutoring, and comprehensive analytics 
            designed for modern education.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-8 w-8 text-green-300" />
              <div className="text-left">
                <h3 className="font-semibold">AI-Powered Content</h3>
                <p className="text-sm text-blue-100">Generate flashcards, quizzes, and lessons instantly</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Users className="h-8 w-8 text-yellow-300" />
              <div className="text-left">
                <h3 className="font-semibold">Role-Based Access</h3>
                <p className="text-sm text-blue-100">Tailored experiences for students, teachers, and administrators</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <TrendingUp className="h-8 w-8 text-pink-300" />
              <div className="text-left">
                <h3 className="font-semibold">Smart Analytics</h3>
                <p className="text-sm text-blue-100">Track progress and get AI-driven insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
