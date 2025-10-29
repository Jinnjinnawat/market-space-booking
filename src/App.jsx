// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavbarComponent from "./componnets/Navbar";
import Footer from "./componnets/Footer";
import Home from "./page/Home";
import FromRegister from "./componnets/Formregister";
import AnnouncementsPage from "./page/AnnouncementsAdmin";
import AnnouncementsUser from "./page/AnnouncementsUser";
import RentalCheck from "./page/RentalCheck";
import AdminDashboard from "./page/AdminDashboard";

import Login from "./page/Login";
import UtilityPayStandalone from "./page/UtilityPayStandalone";
import AdminLotsPage from "./page/AdminLotsPage";
import AuthProvider from "./context/AuthProvider";
import ProtectedRoute from "./componnets/ProtectedRoute";
import RentalRequestsTable from "./page/RentalRequestsTable";
import PaymentPage from "./page/PaymentPage";
import PaymentsPageAdmin from "./page/PaymentsPageAdmin";
import AdminUtilitiesPage from "./page/AdminUtilitiesPage";
import UtilitiesUserPage from "./page/UtilitiesUserPage";
import PayUtilities from "./page/PayUtilities";
import ExpenseSummaryPage from "./page/ExpenseSummaryPage";
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* หน้า public */}
         <Route path="/ExpenseSummaryPage" element={<ExpenseSummaryPage />} />
         <Route path="/utility-pay/:id" element={<UtilityPayStandalone />} />
        <Route path="/payutilities" element={<PayUtilities />} />
        <Route path="/utilitiesuser" element={<UtilitiesUserPage  />} />
        <Route path="/utilities" element={<AdminUtilitiesPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/" element={<AnnouncementsUser />} />
        <Route path="/fromregister" element={<FromRegister />} />
        <Route path="/home" element={<Home />} />
        <Route path="/rentalCheck" element={<RentalCheck />} />
        <Route path="/lots" element={<AdminLotsPage />} />
        <Route path="/requeststable" element={<RentalRequestsTable />} />
        <Route path="/paymentspageadmin" element={<PaymentsPageAdmin  />} />
        <Route path="/payments/:id" element={<PaymentPage />} />
        {/* หน้า private (ต้องล็อกอินก่อน) */}
      </Routes>
    </AuthProvider>
  );
}
