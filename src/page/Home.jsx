// src/page/Home.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Badge,
  ListGroup,
  Spinner,
  Alert,
} from "react-bootstrap";
import NavbarComponent from "../componnets/Navbar";
import FromRegister from "../componnets/Formregister";
import Footer from "../componnets/Footer";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../service/Firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider"; // ✅ ดึง user จาก Auth

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("th-TH") : "-");

const normalizeLot = (l) => {
  const amenitiesArr = Array.isArray(l.amenities)
    ? l.amenities
    : Object.entries(l.amenities || {})
        .filter(([, v]) => !!v)
        .map(([k]) => k);
  const statusTH =
    l.status === "available"
      ? "ว่าง"
      : l.status === "occupied"
      ? "ถูกเช่า"
      : l.status === "inactive"
      ? "ปิดใช้งาน"
      : l.status || "ว่าง";
  return {
    ...l,
    name: l.name || l.lotNo || l.lot || "-",
    image: l.image || l.imageUrl || "",
    desc: l.desc || l.notes || "",
    amenities: amenitiesArr,
    status: statusTH,
  };
};

export default function Home() {
  const [lots, setLots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);

  // ✅ NEW: state สำหรับแจ้งเตือนให้ล็อกอินก่อน
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // ✅ user จาก Auth

  const toTHB = (n) =>
    typeof n === "number"
      ? n.toLocaleString("th-TH", { style: "currency", currency: "THB" })
      : n
      ? `${n}`
      : undefined;

  // ---------- Firestore subscriptions ----------
  useEffect(() => {
    try {
      const unsubLots = onSnapshot(
        query(collection(db, "lots"), orderBy("createdAt", "desc")),
        (snap) => {
          const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setLots(rows.map(normalizeLot));
          setLoading(false);
        },
        (e) => {
          console.error(e);
          setErr("โหลดรายการพื้นที่ไม่สำเร็จ");
          setLoading(false);
        }
      );

      const unsubBookings = onSnapshot(
        query(collection(db, "bookings"), orderBy("from", "desc")),
        (snap) => {
          const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setBookings(rows || []);
        },
        (e) => {
          console.error(e);
          setErr("โหลดข้อมูลการจองไม่สำเร็จ");
        }
      );

      return () => {
        unsubLots?.();
        unsubBookings?.();
      };
    } catch (e) {
      console.error(e);
      setErr("ไม่สามารถเชื่อมต่อฐานข้อมูลได้");
      setLoading(false);
    }
  }, []);

  // ---------- derive lots with renters ----------
  const lotsWithRenters = useMemo(() => {
    if (!lots.length) return [];
    const today = new Date();
    const byLot = bookings.reduce((acc, b) => {
      if (!b?.lotId) return acc;
      (acc[b.lotId] ||= []).push(b);
      return acc;
    }, {});

    return lots.map((l) => {
      const lotBookings = byLot[l.id] || [];
      const renters = lotBookings.map((b) => ({
        name: b.name || b.renterName || b?.createdBy?.displayName || "-",
        phone: b.phone || b?.createdBy?.phone || "-",
        from: b.from || null,
        to: b.to || null,
        status: b.status || "pending",
        uid: b.uid || b.userId || b?.createdBy?.uid || null,
      }));

      const hasActive = lotBookings.some((b) => {
        const to = b.to ? new Date(b.to) : null;
        const notCancelled = (b.status || "").toLowerCase() !== "cancelled";
        return notCancelled && (!to || to >= today);
      });

      const isPaid = lotBookings.some(
        (b) => (b.status || "").toLowerCase() === "paid"
      );

      // นโยบายแสดงผล: ถ้าจ่ายแล้วขึ้น "ชำระแล้ว" มิฉะนั้น "ว่าง" (พร้อมให้กดเช่า)
      const displayStatus = isPaid ? "ชำระแล้ว" : "ว่าง";
      const actionLabel = "เช่าพื้นที่";

      return {
        ...l,
        renters,
        hasActive,
        isPaid,
        displayStatus,
        actionLabel,
      };
    });
  }, [lots, bookings]);

  const getActiveRenters = (lot) => {
    if (!lot?.renters?.length) return [];
    const today = new Date();
    return lot.renters.filter((r) => {
      if (!r.to) return true;
      return new Date(r.to) >= today;
    });
  };

  // ---------- create booking: attach current user info ----------
  const addBooking = async (lot, renter) => {
    // ✅ ถ้ายังไม่ล็อกอินให้เด้ง Modal แจ้งเตือนก่อน
    if (!user) {
      setShowLoginAlert(true);
      return;
    }

    if (lot?.isPaid) {
      setErr("ล็อตนี้ถูกชำระแล้ว ไม่สามารถลงทะเบียน/เช่าต่อได้");
      return;
    }

    try {
      await addDoc(collection(db, "bookings"), {
        lotId: lot.id,
        lotName: lot.name || lot.lotNo || lot.lot || "",
        pricePerMonth: Number(lot.pricePerMonth ?? 0),
        deposit: Number(lot.deposit ?? 0),

        name: renter.name || user.displayName || "",
        phone: renter.phone || "",

        from: renter.from || null,
        to: renter.to || null,

        status: "pending",

        // ✅ แนบข้อมูลผู้ใช้จากการล็อกอิน
        uid: user.uid,
        userEmail: user.email || "",
        userDisplayName: user.displayName || "",
        userPhotoURL: user.photoURL || "",
        createdBy: {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          at: serverTimestamp(),
        },

        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      setErr("บันทึกการลงทะเบียนไม่สำเร็จ");
    }
  };

  // ---------- modal handlers ----------
  const openRegister = (lot) => {
    if (lot?.isPaid) {
      setErr("ล็อตนี้ถูกชำระแล้ว ไม่สามารถลงทะเบียน/เช่าต่อได้");
      return;
    }
    // ✅ ถ้ายังไม่ล็อกอิน → แสดง Modal แจ้งเตือน (ไม่ redirect ทันที)
    if (!user && !authLoading) {
      setSelectedLot(lot);
      setShowLoginAlert(true);
      return;
    }
    setSelectedLot(lot);
    setShowRegister(true);
  };

  const closeRegister = () => {
    setShowRegister(false);
    setSelectedLot(null);
  };

  const openDetails = (lot) => {
    setSelectedLot(lot);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedLot(null);
  };

  const rentFromDetails = () => {
    const lot = selectedLot;
    if (lot?.isPaid) {
      setErr("ล็อตนี้ถูกชำระแล้ว ไม่สามารถลงทะเบียน/เช่าต่อได้");
      return;
    }
    // ✅ ถ้ายังไม่ล็อกอิน → แสดง Modal แจ้งเตือน
    if (!user && !authLoading) {
      setShowLoginAlert(true);
      return;
    }
    setShowDetails(false);
    setShowRegister(true);
    setSelectedLot(lot);
  };

  // ---------- UI ----------
  return (
    <>
      <NavbarComponent />
      <Container className="mt-4 mb-5">
        <h2 className="text-center mb-4">รายการพื้นที่ให้เช่า</h2>
        {err && <Alert variant="danger">{err}</Alert>}
        {loading ? (
          <div className="d-flex justify-content-center my-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <Row className="g-4 justify-content-center">
            {lotsWithRenters.map((lot) => (
              <Col key={lot.id} xs={12} sm={6} md={4}>
                <Card className="shadow-sm text-center h-100 border-0">
                  <Card.Img
                    variant="top"
                    src={
                      lot.image ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    className="p-3"
                    style={{ width: "150px", margin: "0 auto" }}
                    alt={lot.name}
                  />
                  <Card.Body>
                    <Card.Title className="d-flex justify-content-center align-items-center gap-2">
                      {lot.name}
                      <Badge bg={lot.isPaid ? "primary" : "success"}>
                        {lot.displayStatus}
                      </Badge>
                    </Card.Title>
                    <Card.Text className="mb-2">
                      <strong>ราคา:</strong>{" "}
                      {toTHB(lot.pricePerMonth) || "-"} /เดือน
                    </Card.Text>
                    <Card.Text className="text-muted" style={{ minHeight: 48 }}>
                      {lot.desc || "-"}
                    </Card.Text>
                    <div className="d-flex justify-content-center gap-2">
                      <Button
                        variant="outline-primary"
                        onClick={() => openDetails(lot)}
                      >
                        รายละเอียด
                      </Button>
                      <Button
                        variant={lot.isPaid ? "secondary" : "success"}
                        disabled={!!lot.isPaid}
                        onClick={() => openRegister(lot)}
                      >
                        {lot.actionLabel}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* ✅ Modal: รายละเอียดการเช่า */}
      <Modal show={showDetails} onHide={closeDetails} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            รายละเอียดการเช่า {selectedLot ? `- ${selectedLot.name}` : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLot && (
            <Row className="g-3">
              <Col md={4} className="text-center">
                <img
                  src={
                    selectedLot.image ||
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  alt={selectedLot.name}
                  style={{ width: "70%", maxWidth: 220 }}
                  className="mb-3"
                />
                <div>
                  <Badge bg={selectedLot.isPaid ? "primary" : "success"}>
                    {selectedLot.displayStatus}
                  </Badge>
                </div>
              </Col>
              <Col md={8}>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>ขนาดพื้นที่:</strong> {selectedLot.size || "-"}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>โซน:</strong> {selectedLot.zone || "-"}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>ราคา/เดือน:</strong>{" "}
                    {toTHB(selectedLot.pricePerMonth) || "-"}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>มัดจำ:</strong> {toTHB(selectedLot.deposit) || "-"}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>สิ่งอำนวยความสะดวก:</strong>{" "}
                    {selectedLot.amenities?.length
                      ? selectedLot.amenities.join(" • ")
                      : "-"}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>คำอธิบาย:</strong> {selectedLot.desc || "-"}
                  </ListGroup.Item>

                  {/* ✅ ผู้เช่าปัจจุบัน: แสดง “จำนวนคน” */}
                  <ListGroup.Item>
                    <strong>ผู้เช่าปัจจุบัน:</strong>{" "}
                    {(() => {
                      const actives = getActiveRenters(selectedLot);
                      const count = actives.length;
                      return count === 0
                        ? "ไม่มีผู้เช่าปัจจุบัน"
                        : `${count} คน`;
                    })()}
                  </ListGroup.Item>

                  {/* ✅ ผู้เช่าทั้งหมด: แสดง “จำนวนคน” */}
                  <ListGroup.Item>
                    <strong>ผู้เช่าทั้งหมด:</strong>{" "}
                    {selectedLot.renters?.length
                      ? `${selectedLot.renters.length} คน`
                      : "ไม่มีข้อมูลผู้เช่า"}
                  </ListGroup.Item>
                </ListGroup>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={closeDetails}>
            ปิด
          </Button>
          <Button
            variant={selectedLot?.isPaid ? "secondary" : "success"}
            disabled={!!selectedLot?.isPaid}
            onClick={rentFromDetails}
          >
            {selectedLot?.actionLabel || "ลงทะเบียนเข้าร่วมประมูล"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ Modal: ฟอร์มลงทะเบียนเช่า */}
      <Modal show={showRegister} onHide={closeRegister} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedLot?.hasActive ? "เช่าต่อ" : "ลงทะเบียนเข้าร่วมประมูล"}{" "}
            {selectedLot ? `- ${selectedLot.name}` : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FromRegister
            selectedLot={selectedLot}
            onClose={closeRegister}
            onSave={async (renter) => {
              if (!selectedLot) return;
              if (selectedLot.isPaid) {
                setErr("ล็อตนี้ถูกชำระแล้ว ไม่สามารถลงทะเบียน/เช่าต่อได้");
                return;
              }
              await addBooking(selectedLot, renter); // ✅ แนบ user ใน addBooking แล้ว
              closeRegister();
            }}
          />
        </Modal.Body>
      </Modal>

      {/* ✅ NEW: Modal แจ้งเตือนให้ล็อกอินก่อน */}
      <Modal
        show={showLoginAlert}
        onHide={() => setShowLoginAlert(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>ต้องเข้าสู่ระบบก่อน</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-0">
            กรุณาเข้าสู่ระบบก่อนดำเนินการเช่าพื้นที่
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowLoginAlert(false)}>
            ปิด
          </Button>
          <Button
            variant="primary"
            onClick={() =>
              navigate("/login", {
                replace: true,
                state: { from: { pathname: "/home" } }, // ถ้าหน้าหลักคือ "/" เปลี่ยนเป็น pathname: "/"
              })
            }
          >
            ไปหน้าเข้าสู่ระบบ
          </Button>
        </Modal.Footer>
      </Modal>

      <Footer />
    </>
  );
}
