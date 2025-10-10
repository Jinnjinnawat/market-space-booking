import { Routes, Route } from "react-router-dom";
import NavbarComponent from "./componnets/Navbar";
import Footer from "./componnets/Footer";
import Home from "./page/Home";
import FromRegister from "./componnets/Formregister";

export default function App() {
  return (
    <>
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fromregister" element={<FromRegister />} />
      </Routes>
     
    </>
  );
}
