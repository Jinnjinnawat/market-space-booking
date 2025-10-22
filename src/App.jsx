import { Routes, Route } from "react-router-dom";
import NavbarComponent from "./componnets/Navbar";
import Footer from "./componnets/Footer";
import Home from "./page/Home";
import FromRegister from "./componnets/Formregister";
import AnnouncementsPage from "./page/Announcements";
import AnnouncementsUser from "./page/AnnouncementsUser";
import RentalCheck from "./page/RentalCheck";
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<AnnouncementsUser />} />
        <Route path="/fromregister" element={<FromRegister />} />
        <Route path="/home" element={<Home />} />
        <Route path="/rentalCheck" element={<RentalCheck />} />
      </Routes>
    </>
  );
}
