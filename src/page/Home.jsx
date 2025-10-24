import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Badge,
  ListGroup,
} from "react-bootstrap";
import NavbarComponent from "../componnets/Navbar";
import FromRegister from "../componnets/Formregister";

// ✅ ตัวช่วยฟอร์แมตวันที่สั้น ๆ
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("th-TH") : "-");

// ✅ ข้อมูลตั้งต้น (ย้ายออกมานอกคอมโพเนนต์)
const initialLots = [
  {
    id: 1,
    name: "ล็อตที่ 1",
    status: "ว่าง",
    size: "2x2 ม.",
    pricePerDay: 300,
    deposit: 500,
    zone: "A",
    amenities: ["ปลั๊กไฟ", "หลังคา", "ใกล้ทางเข้า"],
    desc: "ทำเลดี เหมาะขายของกินและของแห้ง คนเดินผ่านเยอะ",
    image: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    renters: [
      { name: "คุณเอ็ม", phone: "08x-xxx-xxxx", from: "2025-10-01", to: "2025-10-10" },
    ],
  },
  {
    id: 2,
    name: "ล็อตที่ 2",
    status: "ถูกเช่าแล้ว",
    size: "3x2 ม.",
    pricePerDay: 350,
    deposit: 500,
    zone: "B",
    amenities: ["ปลั๊กไฟ", "ใกล้ห้องน้ำ"],
    desc: "เหมาะขายเสื้อผ้า/เครื่องประดับ",
    image: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    renters: [
      { name: "คุณเอ", phone: "08x-xxx-xxxx", from: "2025-10-20" },
      { name: "คุณบี", phone: "09x-xxx-xxxx", from: "2025-10-15", to: "2025-10-18" },
    ],
  },
  {
    id: 3,
    name: "ล็อตที่ 3",
    status: "ว่าง",
    size: "2x2 ม.",
    pricePerDay: 280,
    deposit: 500,
    zone: "A",
    amenities: ["ปลั๊กไฟ"],
    desc: "ทำเลกลางตลาด มองเห็นชัดจากหลายทาง",
    image: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    renters: [],
  },
];

export default function Home() {
  const [lots, setLots] = useState(initialLots);
  const [showRegister, setShowRegister] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);

  const toTHB = (n) =>
    n?.toLocaleString("th-TH", { style: "currency", currency: "THB" });

  // ✅ ฟังก์ชันเลือกผู้เช่าปัจจุบัน (ยังเช่าอยู่ ณ วันนี้)
  const getActiveRenters = (lot) => {
    if (!lot?.renters?.length) return [];
    const today = new Date();
    return lot.renters.filter((r) => {
      if (!r.to) return true; // ไม่มีวันสิ้นสุด = ยังเช่าอยู่
      return new Date(r.to) >= today;
    });
  };

  // ✅ เพิ่มผู้เช่าลงในล็อต (ใช้ตอนบันทึกฟอร์ม)
  const addRenterToLot = (lotId, renter) => {
    setLots((prev) =>
      prev.map((l) =>
        l.id === lotId ? { ...l, renters: [...(l.renters || []), renter] } : l
      )
    );
  };

  // เปิด/ปิดฟอร์มลงทะเบียน
  const openRegister = (lot) => {
    setSelectedLot(lot);
    setShowRegister(true);
  };
  const closeRegister = () => {
    setShowRegister(false);
    setSelectedLot(null);
  };

  // เปิด/ปิดรายละเอียด
  const openDetails = (lot) => {
    setSelectedLot(lot);
    setShowDetails(true);
  };
  const closeDetails = () => {
    setShowDetails(false);
    setSelectedLot(null);
  };

  // จาก modal รายละเอียด -> เปิดฟอร์มลงทะเบียน
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

        <Row className="g-4 justify-content-center">
          {lots.map((lot) => (
            <Col key={lot.id} xs={12} sm={6} md={4}>
              <Card className="shadow-sm text-center h-100 border-0">
                <Card.Img
                  variant="top"
                  src={lot.image}
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
                    <strong>ราคา:</strong> {toTHB(lot.pricePerDay)}/วัน
                  </Card.Text>
                  <Card.Text className="text-muted" style={{ minHeight: 48 }}>
                    {lot.desc}
                  </Card.Text>

                  <div className="d-flex justify-content-center gap-2">
                    <Button variant="outline-primary" onClick={() => openDetails(lot)}>
                      รายละเอียด
                    </Button>
                    {/* ✅ เปิดให้กดเสมอ เพื่อใช้เป็นการลงทะเบียนเข้าร่วมประมูล/คิวเช่า */}
                    <Button
                      variant="success"
                      onClick={() => openRegister(lot)}
                    >
                      ลงทะเบียนเข้าร่วมประมูล
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
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
                  src={selectedLot.image}
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
                    <strong>ขนาดพื้นที่:</strong> {selectedLot.size}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>โซน:</strong> {selectedLot.zone}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>ราคา/วัน:</strong> {toTHB(selectedLot.pricePerDay)}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>มัดจำ:</strong> {toTHB(selectedLot.deposit)}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>สิ่งอำนวยความสะดวก:</strong>{" "}
                    {selectedLot.amenities?.length
                      ? selectedLot.amenities.join(" • ")
                      : "-"}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>คำอธิบาย:</strong> {selectedLot.desc}
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
                          // ตีความสถานะ
                          const today = new Date();
                          const isActive =
                            !r.to || new Date(r.to) >= today;
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
          {/* สำคัญ: ส่ง onSave เพื่อให้ฟอร์มคืนข้อมูลผู้เช่า */}
          <FromRegister
            selectedLot={selectedLot}
            onClose={closeRegister}
            onSave={(renter) => {
              if (!selectedLot) return;
              addRenterToLot(selectedLot.id, renter);
              closeRegister();
            }}
          />
        </Modal.Body>
      </Modal>
    </>
  );
}
