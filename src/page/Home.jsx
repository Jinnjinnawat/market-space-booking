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

// 🔥 Firestore
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../service/Firebase";

// ✅ ตัวช่วยฟอร์แมตวันที่สั้น ๆ
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("th-TH") : "-");

export default function Home() {
  // ---- state หลัก ----
  const [lots, setLots] = useState([]);          // มาจาก /lots
  const [bookings, setBookings] = useState([]);  // มาจาก /bookings
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [showRegister, setShowRegister] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);

  const toTHB = (n) =>
    n?.toLocaleString("th-TH", { style: "currency", currency: "THB" });

  // ---- subscribe Firestore: /lots และ /bookings ----
  useEffect(() => {
    try {
      const unsubLots = onSnapshot(
        query(collection(db, "lots"), orderBy("name", "asc")),
        (snap) => {
          const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setLots(rows || []);
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

  // ---- รวม lots + bookings เป็น lotsWithRenters ----
  const lotsWithRenters = useMemo(() => {
    if (!lots.length) return [];
    const today = new Date();

    // group bookings by lotId
    const byLot = bookings.reduce((acc, b) => {
      const { lotId } = b;
      if (!lotId) return acc;
      acc[lotId] = acc[lotId] || [];
      acc[lotId].push(b);
      return acc;
    }, {});

    return lots.map((l) => {
      const r = (byLot[l.id] || []).map((b) => ({
        name: b.name || b.renterName || "-",
        phone: b.phone || "-",
        from: b.from || null,
        to: b.to || null,
        status: b.status || "pending",
      }));

      // คิดสถานะล็อตจากรายการที่ยัง active
      const hasActive = (byLot[l.id] || []).some((b) => {
        const to = b.to ? new Date(b.to) : null;
        // active = ไม่มีวันสิ้นสุด หรือ to >= วันนี้ และ (ถ้ามีสถานะ) ไม่ใช่ cancelled
        const notCancelled = (b.status || "").toLowerCase() !== "cancelled";
        return notCancelled && (!to || to >= today);
      });

      return {
        ...l,
        renters: r,
        status: hasActive ? "ถูกเช่าแล้ว" : (l.status || "ว่าง"),
      };
    });
  }, [lots, bookings]);

  // ✅ ฟังก์ชันเลือกผู้เช่าปัจจุบัน (ยังเช่าอยู่ ณ วันนี้)
  const getActiveRenters = (lot) => {
    if (!lot?.renters?.length) return [];
    const today = new Date();
    return lot.renters.filter((r) => {
      if (!r.to) return true; // ไม่มีวันสิ้นสุด = ยังเช่าอยู่
      return new Date(r.to) >= today;
    });
  };

  // ✅ บันทึกเป็น booking ใหม่ไปที่ /bookings
  const addBooking = async (lotId, renter) => {
    // คาดหวังค่า: renter = { name, phone, from, to }
    try {
      await addDoc(collection(db, "bookings"), {
        lotId,
        name: renter.name,
        phone: renter.phone || "",
        from: renter.from || null,   // "YYYY-MM-DD"
        to: renter.to || null,       // "YYYY-MM-DD" | null
        status: "pending",           // หรือ "confirmed" ตาม flow ของคุณ
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      setErr("บันทึกการลงทะเบียนไม่สำเร็จ");
    }
  };

  // ---- modal handlers ----
  const openRegister = (lot) => {
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
    setShowDetails(false);
    setShowRegister(true);
    setSelectedLot(lot);
  };

  return (
    <>
      <NavbarComponent />

      <Container className="mt-4 mb-5">
        <h2 className="text-center mb-4">รายการพื้นที่ให้เช่า</h2>

        {err && <Alert variant="danger" className="mb-3">{err}</Alert>}

        {loading ? (
          <div className="d-flex justify-content-center my-5">
            <Spinner animation="border" role="status" />
          </div>
        ) : (
          <Row className="g-4 justify-content-center">
            {lotsWithRenters.map((lot) => (
              <Col key={lot.id} xs={12} sm={6} md={4}>
                <Card className="shadow-sm text-center h-100 border-0">
                  <Card.Img
                    variant="top"
                    src={lot.image || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    className="p-3"
                    style={{ width: "150px", margin: "0 auto" }}
                    alt={lot.name}
                  />
                  <Card.Body>
                    <Card.Title className="d-flex justify-content-center align-items-center gap-2">
                      {lot.name}
                      <Badge bg={lot.status === "ว่าง" ? "success" : "secondary"}>
                        {lot.status}
                      </Badge>
                    </Card.Title>

                    <Card.Text className="mb-2">
                      <strong>ราคา:</strong>{" "}
                      {toTHB(lot.pricePerDay) || "-"} /วัน
                    </Card.Text>
                    <Card.Text className="text-muted" style={{ minHeight: 48 }}>
                      {lot.desc || "-"}
                    </Card.Text>

                    <div className="d-flex justify-content-center gap-2">
                      <Button variant="outline-primary" onClick={() => openDetails(lot)}>
                        รายละเอียด
                      </Button>
                      <Button variant="success" onClick={() => openRegister(lot)}>
                        ลงทะเบียนเข้าร่วมประมูล
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
                  src={selectedLot.image || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                  alt={selectedLot.name}
                  style={{ width: "70%", maxWidth: 220 }}
                  className="mb-3"
                />
                <div className="d-inline-block">
                  <Badge bg={selectedLot.status === "ว่าง" ? "success" : "secondary"}>
                    {selectedLot.status}
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
                    <strong>ราคา/วัน:</strong> {toTHB(selectedLot.pricePerDay) || "-"}
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

                  {/* ✅ ผู้เช่า (ปัจจุบัน) */}
                  <ListGroup.Item>
                    <strong>ผู้เช่า (ปัจจุบัน):</strong>{" "}
                    {(() => {
                      const actives = getActiveRenters(selectedLot);
                      const count = actives.length;
                      if (count === 0) {
                        return "ไม่มี (ล็อตว่างหรือไม่มีผู้เช่าปัจจุบัน)";
                      }
                      return (
                        <>
                          {count} คน
                          <div className="mt-2 d-flex flex-wrap gap-2">
                            {actives.map((r, idx) => (
                              <Badge key={idx} bg="info" className="fw-normal">
                                {r.name}
                              </Badge>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </ListGroup.Item>

                  {/* ✅ ผู้เช่าทั้งหมดของล็อตนี้ */}
                  <ListGroup.Item>
                    <strong>ผู้เช่าทั้งหมด:</strong>{" "}
                    {selectedLot.renters?.length ? (
                      <div className="mt-2">
                        {selectedLot.renters.map((r, i) => {
                          const today = new Date();
                          const isActive = !r.to || new Date(r.to) >= today;
                          const statusText = !r.to
                            ? "ไม่กำหนดสิ้นสุด"
                            : isActive
                            ? "กำลังเช่า"
                            : "สิ้นสุดแล้ว";
                          const badgeBg = !r.to
                            ? "warning"
                            : isActive
                            ? "success"
                            : "secondary";

                          return (
                            <div
                              key={i}
                              className="d-flex align-items-center justify-content-between border rounded p-2 mb-2"
                            >
                              <div>
                                <div className="fw-semibold">{r.name}</div>
                                <div className="text-muted small">
                                  โทร: {r.phone || "-"} | จาก {fmtDate(r.from)} ถึง {fmtDate(r.to)}
                                </div>
                              </div>
                              <Badge bg={badgeBg}>{statusText}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      "ยังไม่มีรายชื่อผู้เช่า/ผู้เข้าร่วมประมูล"
                    )}
                  </ListGroup.Item>
                </ListGroup>
              </Col>
            </Row>
          )}
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between">
          <div className="text-muted small">
            *โปรดเตรียมบัตรประชาชน (ถ่ายรูป) และเบอร์โทรติดต่อ สำหรับยืนยันการเช่า
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={closeDetails}>
              ปิด
            </Button>
            <Button variant="success" onClick={rentFromDetails}>
              ลงทะเบียนเข้าร่วมประมูล
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* ✅ Modal: ฟอร์มลงทะเบียนเช่า */}
      <Modal show={showRegister} onHide={closeRegister} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            ลงทะเบียนเข้าร่วมประมูล {selectedLot ? `- ${selectedLot.name}` : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* ส่ง onSave เพื่อให้ฟอร์มคืนข้อมูลผู้เช่า แล้วเขียนเข้า /bookings */}
          <FromRegister
            selectedLot={selectedLot}
            onClose={closeRegister}
            onSave={async (renter) => {
              if (!selectedLot) return;
              await addBooking(selectedLot.id, renter);
              closeRegister();
            }}
          />
        </Modal.Body>
      </Modal>

      <Footer />
    </>
  );
}
