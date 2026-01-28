import { HashRouter, Route, Routes } from "react-router-dom"
import Lander from './pages/Lander'
import Home from './pages/Home'
import AuthLander from "./pages/AuthLander";
import Register from "./pages/Register";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import SignInPage from "./pages/SignInPage";
import Ai from "./pages/AiPanel/AiPanel";

export default function App() {
  return (
    <HashRouter>
      <Toaster richColors />
      <Routes>
        <Route path="/" element={<Lander />} />
        <Route path="/home" element={<Home />} />
        <Route path="/ai-panel" element={<Ai />} />
        <Route path="/auth/lander" element={<AuthLander />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/sign-in" element={<SignInPage />} />
      </Routes>
    </HashRouter>
  );
}
