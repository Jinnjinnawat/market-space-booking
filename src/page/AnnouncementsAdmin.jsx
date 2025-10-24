// src/page/AdminAnnouncementsPage.jsx
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
import AdminSidebar from "../componnets/AdminSideBar";

export default function AdminAnnouncementsPage() {
  // --- Mock data (เชื่อม Firestore/MSSQL ภายหลังได้) ---
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
  const [showRead, setShowRead] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    category: "ประกาศด่วน",
    pinned: false,
  });

  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
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

  useEffect(() => setPage(1), [q, category]);

  // --- Helpers ---
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

  const openRead = (it) => {
    setActiveItem(it);
    setShowRead(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      title: "",
      summary: "",
      content: "",
      category: "ประกาศด่วน",
      pinned: false,
    });
    setShowForm(true);
  };

  const openEdit = (it) => {
    setEditingId(it.id);
    setForm({
      title: it.title,
      summary: it.summary,
      content: it.content,
      category: it.category,
      pinned: it.pinned,
    });
    setShowForm(true);
  };

  const saveForm = (e) => {
    e.preventDefault();
    const nowIso = new Date().toISOString();

    if (editingId == null) {
      const nextId = items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1;
      const newItem = {
        id: nextId,
        title: form.title || "Untitled",
        summary: form.summary || "",
        content: form.content || "",
        category: form.category || "ประกาศด่วน",
        date: nowIso,
        pinned: !!form.pinned,
        attachments: [],
      };
      setItems((prev) => [newItem, ...prev]);
      setToast({ show: true, text: "สร้างประกาศใหม่เรียบร้อย" });
    } else {
      setItems((prev) =>
        prev.map((it) =>
          it.id === editingId
            ? {
                ...it,
                title: form.title,
                summary: form.summary,
                content: form.content,
                category: form.category,
                pinned: !!form.pinned,
                date: nowIso, // ถ้าต้องคงเวลาเดิม ให้ลบบรรทัดนี้
              }
            : it
        )
      );
      setToast({ show: true, text: "บันทึกการแก้ไขเรียบร้อย" });
    }

    setShowForm(false);
    setEditingId(null);
  };

  const confirmDeleteItem = (id) => setConfirmDelete({ show: true, id });
  const doDelete = () => {
    setItems((prev) => prev.filter((x) => x.id !== confirmDelete.id));
    setConfirmDelete({ show: false, id: null });
    setToast({ show: true, text: "ลบประกาศเรียบร้อย" });
  };

  const togglePin = (id) => {
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x))
    );
  };

  const exportCSV = () => {
    const header = ["id", "title", "summary", "content", "category", "date", "pinned"];
    const rows = [header.join(",")].concat(
      items.map((it) =>
        [
          it.id,
          JSON.stringify(it.title ?? ""),
          JSON.stringify(it.summary ?? ""),
          JSON.stringify(it.content ?? ""),
          JSON.stringify(it.category ?? ""),
          it.date,
          it.pinned,
        ].join(",")
      )
    );
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `announcements_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // --- Render ---
  return (
    <>
      <AdminSidebar />
      <Container
        className="py-4"
        // ถ้า AdminSidebar เป็น fixed กว้าง ~240px ให้เผื่อระยะซ้าย
        style={{ marginLeft: 240 }}
      >
        <Row className="align-items-center g-2 mb-3">
          <Col md>
            <h2 className="mb-0">📣 จัดการประกาศ (ผู้ดูแล)</h2>
            <div className="text-muted">สร้าง/แก้ไข/ลบ และปักหมุดประกาศของระบบเช่าพื้นที่ตลาดนัด</div>
          </Col>
          <Col md="auto">
            <ButtonGroup>
              <Button variant="primary" onClick={openCreate}>+ สร้างประกาศ</Button>
              <Dropdown as={ButtonGroup}>
                <Button variant="outline-secondary" onClick={exportCSV}>ส่งออก CSV</Button>
                <Dropdown.Toggle split variant="outline-secondary" id="export" />
                <Dropdown.Menu align="end">
                  <Dropdown.Item onClick={exportCSV}>ดาวน์โหลด CSV</Dropdown.Item>
                  <Dropdown.Item onClick={() => window.print()}>พิมพ์หน้า</Dropdown.Item>
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
              label="แจ้งเตือนผู้ใช้ (ตัวอย่าง)"
              onChange={(e) =>
                setToast({
                  show: true,
                  text: e.target.checked ? "เปิดการแจ้งเตือน (ตัวอย่าง)" : "ปิดการแจ้งเตือน (ตัวอย่าง)",
                })
              }
            />
          </Col>
        </Row>

        {/* รายการข่าวสารแบบ Card Grid (แก้ทับกันแล้ว) */}
        <Row xs={1} md={2} lg={3} className="g-3 gy-4">
          {paged.map((it) => (
            <Col key={it.id} className="d-flex">
              <Card className="shadow-sm w-100 h-100 d-flex flex-column">
                <Card.Body className="d-flex flex-column">
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

                  <Stack direction="horizontal" gap={8} className="justify-content-between mt-auto">
                    <Stack direction="horizontal" gap={2}>
                      <Button size="sm" variant="primary" onClick={() => openRead(it)}>อ่าน</Button>
                      <Button size="sm" variant="outline-secondary" onClick={() => openEdit(it)}>แก้ไข</Button>
                      <Button
                        size="sm"
                        variant={it.pinned ? "secondary" : "outline-dark"}
                        onClick={() => togglePin(it.id)}
                      >
                        {it.pinned ? "ยกเลิกปักหมุด" : "ปักหมุด"}
                      </Button>
                    </Stack>
                    <Button size="sm" variant="outline-danger" onClick={() => confirmDeleteItem(it.id)}>ลบ</Button>
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

        {/* Modal: อ่านประกาศ */}
        <Modal show={showRead} onHide={() => setShowRead(false)} centered size="lg">
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
            <Button variant="secondary" onClick={() => setShowRead(false)}>ปิด</Button>
          </Modal.Footer>
        </Modal>

        {/* Offcanvas: ฟอร์มสร้าง/แก้ไข */}
        <Offcanvas show={showForm} onHide={() => setShowForm(false)} placement="end">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>{editingId == null ? "สร้างประกาศใหม่" : "แก้ไขประกาศ"}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Form onSubmit={saveForm}>
              <Form.Group className="mb-3">
                <Form.Label>หัวข้อ</Form.Label>
                <Form.Control
                  required
                  placeholder="เช่น แจ้งปิดปรับปรุงระบบ"
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>สรุปย่อ</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="เนื้อหาย่อเพื่อแสดงบนการ์ด"
                  value={form.summary}
                  onChange={(e) => setForm((s) => ({ ...s, summary: e.target.value }))}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>เนื้อหา</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  placeholder="รายละเอียดเต็มของประกาศ"
                  value={form.content}
                  onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
                />
              </Form.Group>

              <Row className="g-2">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>หมวดหมู่</Form.Label>
                    <Form.Select
                      value={form.category}
                      onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                    >
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
                    <Form.Check
                      type="switch"
                      id="pin-switch"
                      label="ปักหมุดไว้ด้านบน"
                      checked={form.pinned}
                      onChange={(e) => setForm((s) => ({ ...s, pinned: e.target.checked }))}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Stack direction="horizontal" gap={2}>
                <Button type="submit" variant="primary">
                  {editingId == null ? "บันทึกประกาศ" : "บันทึกการแก้ไข"}
                </Button>
                <Button variant="outline-secondary" onClick={() => setShowForm(false)}>ยกเลิก</Button>
              </Stack>
            </Form>

            <hr className="my-4" />
            <small className="text-muted">
              *เชื่อมต่อฐานข้อมูล: เปลี่ยนส่วน saveForm(), doDelete(), togglePin() ให้เรียก Firestore/MSSQL และโหลดรายการด้วย useEffect() แทน mock data
            </small>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Modal: ยืนยันการลบ */}
        <Modal
          show={confirmDelete.show}
          onHide={() => setConfirmDelete({ show: false, id: null })}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>ยืนยันการลบ</Modal.Title>
          </Modal.Header>
          <Modal.Body>คุณต้องการลบประกาศนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setConfirmDelete({ show: false, id: null })}>ยกเลิก</Button>
            <Button variant="danger" onClick={doDelete}>ลบประกาศ</Button>
          </Modal.Footer>
        </Modal>

        {/* Toast */}
        <ToastContainer position="bottom-end" className="p-3">
          <Toast onClose={() => setToast({ show: false, text: "" })} show={toast.show} delay={2000} autohide>
            <Toast.Body>{toast.text}</Toast.Body>
          </Toast>
        </ToastContainer>
      </Container>
    </>
  );
}
