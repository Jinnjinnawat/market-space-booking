import { useMemo, useState, useEffect } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Dropdown,
  Form,
  InputGroup,
  ListGroup,
  Modal,
  Offcanvas,
  Pagination,
  Row,
  Stack,
  Toast,
  ToastContainer,
} from "react-bootstrap";

// 🔔 หมายเหตุ: ให้ใส่ CSS ของ Bootstrap ใน main.jsx / index.jsx ด้วย
// import 'bootstrap/dist/css/bootstrap.min.css'

export default function AnnouncementsPage() {
  // --- Mock data (สามารถเชื่อม Firestore/MSSQL ทีหลังได้) ---
  const [items, setItems] = useState([
    {
      id: 1,
      title: "ระบบเช่าพื้นที่ตลาดนัด เปิดใช้งานเวอร์ชัน 1.2",
      summary: "ปรับปรุงความเร็วการค้นหาล็อต + เพิ่มตัวกรองสิ่งอำนวยความสะดวก",
      content:
        "เราได้อัปเดตระบบเป็นเวอร์ชัน 1.2 โดยมุ่งเน้นเพิ่มประสิทธิภาพการค้นหาและปรับปรุง UI ให้ใช้งานง่ายขึ้น ทั้งนี้มีการเปลี่ยนแปลงโครงสร้างข้อมูลบางส่วนในฝั่งผู้ดูแล โปรดตรวจสอบคู่มือ",
      category: "อัปเดตระบบ",
      date: "2025-10-16T10:30:00+07:00",
      pinned: true,
      attachments: [
        { name: "Release Notes v1.2.pdf", url: "#" },
        { name: "Admin Guide (TH).pdf", url: "#" },
      ],
    },
    {
      id: 2,
      title: "แจ้งปิดปรับปรุงระบบ 22 ต.ค. 2568 (01:00–03:00)",
      summary: "เพื่ออัปเกรดฐานข้อมูลและสำรองข้อมูล",
      content:
        "ขออภัยในความไม่สะดวก ระบบจะไม่สามารถใช้งานได้ชั่วคราวในวันที่ 22 ต.ค. 2568 เวลา 01:00–03:00 น. เพื่ออัปเกรดฐานข้อมูลและสำรองข้อมูล",
      category: "ปิดปรับปรุง",
      date: "2025-10-18T09:00:00+07:00",
      pinned: false,
      attachments: [],
    },
    {
      id: 3,
      title: "กิจกรรมอบรมผู้ค้าใหม่ ประจำเดือน พ.ย.",
      summary: "สอนใช้งานระบบจอง การชำระเงิน และข้อปฏิบัติภายในตลาด",
      content:
        "เปิดรับสมัครผู้ค้าใหม่ (จำนวนจำกัด) สำหรับเวิร์กช็อปสอนใช้งานระบบเช่าและข้อปฏิบัติภายในตลาด จัดวันที่ 9 พ.ย. 2568 ลงทะเบียนภายใน 3 พ.ย.",
      category: "กิจกรรม",
      date: "2025-10-12T13:00:00+07:00",
      pinned: false,
      attachments: [{ name: "กำหนดการ.pdf", url: "#" }],
    },
    {
      id: 4,
      title: "ประกาศด่วน: ปรับปรุงกติกาการชำระค่าเช่า",
      summary: "ชำระล่วงหน้าอย่างน้อย 3 วันก่อนวันใช้งาน",
      content:
        "เพื่อความเป็นระเบียบและลดการยกเลิกกะทันหัน ตั้งแต่ 1 พ.ย. 2568 เป็นต้นไป ขอให้ผู้เช่าชำระเงินล่วงหน้าอย่างน้อย 3 วันก่อนวันใช้งาน หากไม่ชำระตามกำหนด ระบบจะยกเลิกการจองโดยอัตโนมัติ",
      category: "ประกาศด่วน",
      date: "2025-10-10T08:00:00+07:00",
      pinned: false,
      attachments: [],
    },
  ]);

  // --- UI States ---
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");
  const [showModal, setShowModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState({ show: false, text: "" });
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const categories = ["ทั้งหมด", "ประกาศด่วน", "ปิดปรับปรุง", "อัปเดตระบบ", "กิจกรรม"]; 

  // --- Derived list ---
  const filtered = useMemo(() => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const now = new Date();

    return items
      .filter((it) => {
        const matchQ = [it.title, it.summary, it.content]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase());
        const matchCat = category === "ทั้งหมด" ? true : it.category === category;
        return matchQ && matchCat;
      })
      .sort((a, b) => {
        // ติดปักหมุดมาก่อน แล้วค่อยเรียงวันที่ใหม่ก่อน
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .map((it) => ({
        ...it,
        isNew: now - new Date(it.date).getTime() <= sevenDaysMs,
      }));
  }, [items, q, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [q, category]);

  // --- Handlers ---
  const openItem = (it) => {
    setActiveItem(it);
    setShowModal(true);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const newItem = {
      id: Math.max(...items.map((i) => i.id)) + 1,
      title: fd.get("title")?.toString() || "Untitled",
      summary: fd.get("summary")?.toString() || "",
      content: fd.get("content")?.toString() || "",
      category: fd.get("category")?.toString() || "ประกาศด่วน",
      date: new Date().toISOString(),
      pinned: fd.get("pinned") === "on",
      attachments: [],
    };
    setItems((prev) => [newItem, ...prev]);
    setShowCreate(false);
    setToast({ show: true, text: "บันทึกประกาศใหม่เรียบร้อย" });
    form.reset();
  };

  const badgeVariant = (cat) => {
    switch (cat) {
      case "ประกาศด่วน":
        return "danger";
      case "ปิดปรับปรุง":
        return "warning";
      case "อัปเดตระบบ":
        return "info";
      case "กิจกรรม":
        return "success";
      default:
        return "secondary";
    }
  };

  return (
    <Container className="py-4">
      <Row className="align-items-center g-2 mb-3">
        <Col md>
          <h2 className="mb-0">📣 หน้าแจ้งข่าวสาร</h2>
          <div className="text-muted">อัปเดตล่าสุด ข่าวสาร และกิจกรรมของระบบเช่าพื้นที่ตลาดนัด</div>
        </Col>
        <Col md="auto">
          <ButtonGroup>
            <Button variant="primary" onClick={() => setShowCreate(true)}>+ สร้างประกาศ</Button>
            <Dropdown as={ButtonGroup}>
              <Button variant="outline-secondary">ส่งออก</Button>
              <Dropdown.Toggle split variant="outline-secondary" id="export" />
              <Dropdown.Menu align="end">
                <Dropdown.Item href="#">ส่งออกเป็น CSV</Dropdown.Item>
                <Dropdown.Item href="#">พิมพ์หน้า</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item href="#">สร้างลิงก์ RSS</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </ButtonGroup>
        </Col>
      </Row>

      {/* ค้นหา + ตัวกรอง */}
      <Row className="g-2 mb-3">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>ค้นหา</InputGroup.Text>
            <Form.Control
              placeholder="หัวข้อ/เนื้อหา/หมวดหมู่"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Check
            type="switch"
            id="subSwitch"
            label="รับการแจ้งเตือนข่าวสาร"
            onChange={(e) => setToast({ show: true, text: e.target.checked ? "เปิดการแจ้งเตือนแล้ว" : "ปิดการแจ้งเตือนแล้ว" })}
          />
        </Col>
      </Row>

      {/* รายการข่าวสารแบบ Card Grid */}
      <Row xs={1} md={2} xl={3} className="g-3">
        {paged.map((it) => (
          <Col key={it.id}>
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <Stack direction="horizontal" gap={2} className="mb-2">
                  <Badge bg={badgeVariant(it.category)}>{it.category}</Badge>
                  {it.pinned && <Badge bg="dark">ปักหมุด</Badge>}
                  {it.isNew && <Badge bg="success">ใหม่</Badge>}
                </Stack>
                <Card.Title className="mb-1">{it.title}</Card.Title>
                <Card.Subtitle className="text-muted" style={{ fontSize: 14 }}>
                  {new Date(it.date).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                </Card.Subtitle>
                <Card.Text className="mt-2" style={{ minHeight: 60 }}>
                  {it.summary}
                </Card.Text>
                <Stack direction="horizontal" gap={2}>
                  <Button size="sm" variant="primary" onClick={() => openItem(it)}>อ่านเพิ่มเติม</Button>
                  <Button size="sm" variant="outline-secondary">แชร์</Button>
                </Stack>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Pagination */}
      <div className="d-flex justify-content-center mt-4">
        <Pagination>
          <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
          <Pagination.Prev onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} />
          {[...Array(totalPages)].map((_, i) => (
            <Pagination.Item key={i + 1} active={page === i + 1} onClick={() => setPage(i + 1)}>
              {i + 1}
            </Pagination.Item>
          ))}
          <Pagination.Next onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
          <Pagination.Last onClick={() => setPage(totalPages)} disabled={page === totalPages} />
        </Pagination>
      </div>

      {/* Modal อ่านประกาศ */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{activeItem?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Stack direction="horizontal" gap={2} className="mb-2">
            {activeItem && <Badge bg={badgeVariant(activeItem.category)}>{activeItem.category}</Badge>}
            {activeItem?.pinned && <Badge bg="dark">ปักหมุด</Badge>}
          </Stack>
          <div className="text-muted mb-3">
            {activeItem && new Date(activeItem.date).toLocaleString("th-TH", { dateStyle: "full", timeStyle: "short" })}
          </div>
          <p style={{ whiteSpace: "pre-wrap" }}>{activeItem?.content}</p>

          {activeItem?.attachments?.length ? (
            <>
              <hr />
              <h6>ไฟล์แนบ</h6>
              <ListGroup>
                {activeItem.attachments.map((f, idx) => (
                  <ListGroup.Item key={idx} action href={f.url}>
                    📎 {f.name}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>ปิด</Button>
          <Button variant="primary">แชร์</Button>
        </Modal.Footer>
      </Modal>

      {/* Offcanvas สร้างประกาศใหม่ */}
      <Offcanvas show={showCreate} onHide={() => setShowCreate(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>สร้างประกาศใหม่</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form onSubmit={handleCreate}>
            <Form.Group className="mb-3">
              <Form.Label>หัวข้อ</Form.Label>
              <Form.Control name="title" required placeholder="เช่น แจ้งปิดปรับปรุงระบบ" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>สรุปย่อ</Form.Label>
              <Form.Control as="textarea" rows={2} name="summary" placeholder="เนื้อหาย่อเพื่อแสดงบนการ์ด" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>เนื้อหา</Form.Label>
              <Form.Control as="textarea" rows={6} name="content" placeholder="รายละเอียดเต็มของประกาศ" />
            </Form.Group>

            <Row className="g-2">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>หมวดหมู่</Form.Label>
                  <Form.Select name="category" defaultValue="ประกาศด่วน">
                    <option>ประกาศด่วน</option>
                    <option>ปิดปรับปรุง</option>
                    <option>อัปเดตระบบ</option>
                    <option>กิจกรรม</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>ตัวเลือก</Form.Label>
                  <Form.Check type="switch" id="pin-switch" name="pinned" label="ปักหมุดไว้ด้านบน" />
                </Form.Group>
              </Col>
            </Row>

            <Stack direction="horizontal" gap={2}>
              <Button type="submit" variant="primary">บันทึกประกาศ</Button>
              <Button variant="outline-secondary" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
            </Stack>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Toast แจ้งเตือนสั้น ๆ */}
      <ToastContainer position="bottom-end" className="p-3">
        <Toast onClose={() => setToast({ show: false, text: "" })} show={toast.show} delay={2000} autohide>
          <Toast.Body>{toast.text}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
