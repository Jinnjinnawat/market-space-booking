// src/page/UtilityPayStandalone.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Spinner } from "react-bootstrap";
import NavbarComponent from "../componnets/Navbar";
import Footer from "../componnets/Footer";
import { db } from "../service/Firebase";
import { doc, getDoc } from "firebase/firestore";
import UtilityPayModal from "../componnets/UtilityPayModal";

export default function UtilityPayStandalone() {
  const { id } = useParams();          // utility id
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [utility, setUtility] = useState(null);
  const [lotNo, setLotNo] = useState("");
  const [open, setOpen] = useState(true); // เปิดโมดอลทันที

  useEffect(() => {
    const run = async () => {
      try {
        if (!id) return;
        const snap = await getDoc(doc(db, "utilities", id));
        if (!snap.exists()) {
          navigate("/utilities", { replace: true });
          return;
        }
        const data = { id: snap.id, ...snap.data() };
        setUtility(data);

        // ดึง lotNo ถ้ามี lotId
        let lotId = data.lotId;
        if (lotId && typeof lotId === "object" && lotId.id) lotId = lotId.id;
        if (lotId) {
          const lotSnap = await getDoc(doc(db, "lots", lotId));
          if (lotSnap.exists()) {
            const l = lotSnap.data();
            setLotNo(l.lotNo || l.code || l.number || l.name || lotSnap.id);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, navigate]);

  const handleHide = () => {
    setOpen(false);
    navigate("/utilities", { replace: true });
  };

  return (
    <>
      <NavbarComponent />
      <Container className="py-4">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <UtilityPayModal
            show={open}
            onHide={handleHide}
            utility={utility}
            lotNo={lotNo}
          />
        )}
      </Container>
      <Footer />
    </>
  );
}
