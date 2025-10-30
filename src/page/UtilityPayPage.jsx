// src/page/UtilityPayPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Container, Spinner, Alert } from "react-bootstrap";
import { db } from "../service/Firebase";
import { doc, getDoc } from "firebase/firestore";
import NavbarComponent from "../componnets/Navbar";
import Footer from "../componnets/Footer";
import UtilityPayModal from "../componnets/UtilityPayModal"; // path ให้ตรงกับของจริง

export default function UtilityPayPage() {
  const { id } = useParams();          // utility id
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [utility, setUtility] = useState(null);
  const [lotNo, setLotNo] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const snap = await getDoc(doc(db, "utilities", id));
        if (!snap.exists()) {
          setUtility(null);
        } else {
          const data = { id: snap.id, ...snap.data() };
          setUtility(data);

          // ถ้าอยากโชว์ lotNo ในหัวโมดอล (มี lotId เป็น string)
          const lotId =
            typeof data.lotId === "string" ? data.lotId :
            data.lotId?.id || null;
          if (lotId) {
            const lotSnap = await getDoc(doc(db, "lots", lotId));
            setLotNo(
              lotSnap.exists()
                ? (lotSnap.data().lotNo || lotSnap.data().code || lotSnap.id)
                : ""
            );
          }
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  // ปิดโมดอล -> กลับหน้าเดิม (หรือจะไป /payutilities ก็ได้)
  const closeModal = () => navigate(-1);

  return (
    <>
      <NavbarComponent />
      <Container className="py-4">
        <Card className="shadow-sm">
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            ) : !utility ? (
              <Alert variant="danger">ไม่พบรายการค่าสาธารณูปโภค</Alert>
            ) : (
              // เปิดโมดอลชำระ
              <UtilityPayModal
                show={true}
                onHide={closeModal}
                utility={utility}
                lotNo={lotNo}
              />
            )}
          </Card.Body>
        </Card>
      </Container>
      <Footer />
    </>
  );
}
