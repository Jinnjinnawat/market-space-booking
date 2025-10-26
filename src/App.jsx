// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom"; 
import NavbarComponent from "./componnets/Navbar";
import Footer from "./componnets/Footer";
import Home from "./page/Home";
import FromRegister from "./componnets/Formregister";
import AnnouncementsPage from "./page/AnnouncementsAdmin";
import AnnouncementsUser from "./page/AnnouncementsUser";
import RentalCheck from "./page/RentalCheck";
import AdminDashboard from "./page/AdminDashboard"

import Login from "./page/Login";

import AdminLotsPage from "./page/AdminLotsPage";
import AuthProvider from "./context/AuthProvider";
import ProtectedRoute from "./componnets/ProtectedRoute";
import RentalRequestsTable from "./page/RentalRequestsTable";
export default function App() {
  return (
    
      <AuthProvider>
      

        <Routes>
          {/* หน้า public */}
          <Route path="/login" element={<Login />} />
          <Route path="/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/" element={<AnnouncementsUser />} />
          <Route path="/fromregister" element={<FromRegister />} />
          <Route path="/home" element={<Home />} />
          <Route path="/rentalCheck" element={<RentalCheck />} />
          <Route path="/lots" element={<AdminLotsPage />} />
          <Route path="/requeststable" element={<RentalRequestsTable />} />
          {/* หน้า private (ต้องล็อกอินก่อน) */}
        
        </Routes>

        
      </AuthProvider>
  );
}
