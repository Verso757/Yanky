import React from 'react';
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Car } from "lucide-react";
import axios from "@/src/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error de inicio de sesión");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl shadow-blue-900/5 border-slate-200/60 rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <CardHeader className="text-center space-y-2 mt-4">
          <div className="mx-auto bg-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-blue-600/20">
            <Car className="text-white h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Yanky Taller</CardTitle>
          <CardDescription className="text-slate-500">Ingresa al sistema de gestión</CardDescription>
        </CardHeader>
        <CardContent className="mt-2">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@taller.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-blue-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-semibold">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-blue-600"
              />
            </div>
            <Button type="submit" className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 h-11 transition-all">
              Ingresar al panel
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 mt-2 bg-slate-50/50 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">Demo de Prueba</p>
          <p className="text-xs text-slate-400">admin@taller.com / 123456</p>
        </CardFooter>
      </Card>
    </div>
  );
}
