// src/pages/admin/AdminDashboard.jsx
import { Button, Container } from 'react-bootstrap';
import { useAuth } from '../context/AuthProvider';
import AdminSidebar from '../componnets/AdminSideBar';
export default function AdminDashboard() {
  const { auth, logout } = useAuth();
  return (
    <>
    <AdminSidebar></AdminSidebar>
   
    </>
  );
}
