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

// 🔥 Firestore
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../service/Firebase"; 

export default function AdminAnnouncementsPage() {
  // --- Data states ---
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // ---------- Firestore Realtime ----------
  useEffect(() => {
    setLoading(true);
    // เรียง: ปักหมุดก่อน แล้วตามด้วย updatedAt ใหม่ไปเก่า (fallback createdAt)
    const colRef = collection(db, "announcements");
    const qRef = query(
      colRef,
      orderBy("pinned", "desc"),
      orderBy("updatedAt", "desc")
    );
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const data = snap.docs.map((d) => {
          const v = d.data();
          const dateObj =
            v.updatedAt?.toDate?.() ??
            v.createdAt?.toDate?.() ??
            (v.date ? new Date(v.date) : new Date());
        return {
            id: d.id,
            title: v.title || "",
            summary: v.summary || "",
            content: v.content || "",
            category: v.category || "ประกาศด่วน",
            pinned: !!v.pinned,
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
            attachments: v.attachments || [],
            // สำหรับ UI
            dateDisplay: dateObj,
            isNew: now - dateObj.getTime() <= sevenDays,
          };
        });
        setItems(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setToast({ show: true, text: "โหลดข้อมูลไม่สำเร็จ" });
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // --- Derived list (filter + paginate เฉพาะฝั่งหน้าบ้าน) ---
  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchQ = [it.title, it.summary, it.content]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase());
      const matchCat = category === "ทั้งหมด" ? true : it.category === category;
      return matchQ && matchCat;
    });
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
      title: it.title ?? "",
      summary: it.summary ?? "",
      content: it.content ?? "",
      category: it.category ?? "ประกาศด่วน",
      pinned: !!it.pinned,
    });
    setShowForm(true);
  };

  // ---------- Create / Update ----------
  const saveForm = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title?.trim() || "Untitled",
        summary: form.summary || "",
        content: form.content || "",
        category: form.category || "ประกาศด่วน",
        pinned: !!form.pinned,
        updatedAt: serverTimestamp(),
      };

      if (editingId == null) {
        await addDoc(collection(db, "announcements"), {
          ...payload,
          createdAt: serverTimestamp(),
          // attachments: [] // ถ้าจะรองรับไฟล์แนบในอนาคต
        });
        setToast({ show: true, text: "สร้างประกาศใหม่เรียบร้อย" });
      } else {
        await updateDoc(doc(db, "announcements", editingId), payload);
        setToast({ show: true, text: "บันทึกการแก้ไขเรียบร้อย" });
      }

      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setToast({ show: true, text: "บันทึกไม่สำเร็จ" });
    }
  };

  // ---------- Delete ----------
  const confirmDeleteItem = (id) => setConfirmDelete({ show: true, id });
  const doDelete = async () => {
    try {
      const id = confirmDelete.id;
      if (!id) return;
      await deleteDoc(doc(db, "announcements", id));
      setToast({ show: true, text: "ลบประกาศเรียบร้อย" });
    } catch (e) {
      console.error(e);
      setToast({ show: true, text: "ลบไม่สำเร็จ" });
    } finally {
      setConfirmDelete({ show: false, id: null });
    }
  };

  // ---------- Pin toggle ----------
  const togglePin = async (id) => {
    try {
      const target = items.find((x) => x.id === id);
      if (!target) return;
      // optimistic UI
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x)));
      await updateDoc(doc(db, "announcements", id), {
        pinned: !target.pinned,
        updatedAt: serverTimestamp(),
      });
      // ไม่ต้องรีโหลด เพราะ onSnapshot จะเด้งกลับมาเอง
    } catch (e) {
      console.error(e);
      setToast({ show: true, text: "อัปเดตปักหมุดไม่สำเร็จ" });
    }
  };

  // ---------- Export CSV ----------
  const exportCSV = () => {
    const header = ["id", "title", "summary", "content", "category", "updatedAt", "pinned"];
    const rows = [header.join(",")].concat(
      items.map((it) =>
        [
          it.id,
          JSON.stringify(it.title ?? ""),
          JSON.stringify(it.summary ?? ""),
          JSON.stringify(it.content ?? ""),
          JSON.stringify(it.category ?? ""),
          it.dateDisplay?.toISOString?.() ?? "",
          it.pinned ?? false,
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
      <Container className="py-4" style={{ marginLeft: 240 }}>
        <Row className="align-items-center g-2 mb-3">
          <Col md>
            <h2 className="mb-0">📣 จัดการประกาศ (ผู้ดูแล)</h2>
           
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

        {/* รายการข่าวสาร */}
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
                    {it.dateDisplay?.toLocaleString?.("th-TH", { dateStyle: "medium", timeStyle: "short" })}
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
              {activeItem?.dateDisplay?.toLocaleString?.("th-TH", { dateStyle: "full", timeStyle: "short" })}
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
