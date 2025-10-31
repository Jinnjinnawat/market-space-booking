// src/page/AdminUsersPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Badge, Button, Card, Col, Container, Form, InputGroup, Modal,
  Row, Table, Toast, ToastContainer, Spinner
} from "react-bootstrap";
import {
  addDoc, collection, deleteDoc, doc, onSnapshot,
  serverTimestamp, updateDoc
} from "firebase/firestore";
import { db } from "../service/Firebase";
import AdminSidebar from "../componnets/AdminSideBar";

const SIDEBAR_WIDTH = 260;
const COL = "admin";

// ฟอร์มเริ่มต้น
const emptyForm = { email: "", pass: "", role: "admin", note: "" };

// แปลง Timestamp → ข้อความไทย
const fmtTS = (ts) => {
  try {
    const d = typeof ts?.toDate === "function" ? ts.toDate()
      : ts?.seconds ? new Date(ts.seconds * 1000) : null;
    return d ? d.toLocaleString("th-TH") : "-";
  } catch { return "-"; }
};

// ชื่อบทบาทภาษาไทย (เก็บค่าในฐานข้อมูลเป็นอังกฤษ แต่แสดงผลเป็นไทย)
const ROLE_LABEL = {
  admin: "ผู้ดูแลระบบ",
  staff: "เจ้าหน้าที่",
  viewer: "ผู้ชม",
};
const displayRole = (role) => ROLE_LABEL[role] || role || "-";

export default function AdminUsersPage() {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // ค้นหา / กรอง
  const [qText, setQText] = useState("");
  const [qRole, setQRole] = useState("");

  // โมดอลฟอร์ม
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // โมดอลลบ
  const [delTarget, setDelTarget] = useState(null);

  // Toast
  const [toast, setToast] = useState({ show: false, msg: "", bg: "success" });
  const pushToast = (msg, bg = "success") => setToast({ show: true, msg, bg });

  // โหลดเรียลไทม์จาก /admin และเรียงล่าสุดก่อน
  useEffect(() => {
    const ref = collection(db, COL);
    const unsub = onSnapshot(ref,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        rows.sort((a, b) => (b?.createdAt?.seconds ?? 0) - (a?.createdAt?.seconds ?? 0));
        setItems(rows);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        pushToast("ดึงข้อมูลไม่สำเร็จ", "danger");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // คัดกรองตามข้อความและบทบาท
  useEffect(() => {
    const needle = qText.trim().toLowerCase();
    const data = items.filter((u) => {
      const hitText =
        !needle ||
        [u.email, u.role, u.note].filter(Boolean).join(" ").toLowerCase().includes(needle);
      const hitRole = !qRole || (u.role || "") === qRole;
      return hitText && hitRole;
    });
    setFiltered(data);
  }, [items, qText, qRole]);

  // รายการบทบาท (ค่าจริงเป็นอังกฤษ, ป้ายแสดงผลเป็นไทย)
  const roleOptions = useMemo(() => {
    const s = new Set(["admin", "staff", "viewer"]);
    items.forEach((u) => u.role && s.add(u.role));
    return Array.from(s);
  }, [items]);

  // เปิดฟอร์มเพิ่ม
  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  // เปิดฟอร์มแก้ไข
  const handleOpenEdit = (row) => {
    setEditingId(row.id);
    setForm({
      email: row.email || "",
      pass: "", // แก้ไขไม่บังคับเปลี่ยนรหัสผ่าน
      role: row.role || "staff",
      note: row.note || "",
    });
    setShowModal(true);
  };

  // ตรวจสอบฟอร์ม
  const validate = () => {
    if (!form.email?.trim()) return "กรุณากรอกอีเมล";
    if (!/\S+@\S+\.\S+/.test(form.email.trim())) return "รูปแบบอีเมลไม่ถูกต้อง";
    if (!editingId && (!form.pass || String(form.pass).length < 6))
      return "กรุณากรอกรหัสผ่านอย่างน้อย 6 ตัวอักษร";
    if (!form.role) return "กรุณาเลือกบทบาท";
    return "";
  };

  // บันทึกฟอร์ม
  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return pushToast(err, "warning");

    const payload = {
      email: form.email.trim(),
      role: form.role,
      note: (form.note || "").trim(),
      ...(form.pass ? { pass: form.pass } : {}), // แก้ไขโดยไม่บังคับส่งรหัสผ่าน
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, COL, editingId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        pushToast("บันทึกการแก้ไขสำเร็จ");
      } else {
        await addDoc(collection(db, COL), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        pushToast("เพิ่มผู้ใช้งานสำเร็จ");
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (e2) {
      console.error(e2);
      pushToast("บันทึกไม่สำเร็จ", "danger");
    }
  };

  // ลบผู้ใช้
  const confirmDelete = (row) => setDelTarget(row);
  const handleDelete = async () => {
    if (!delTarget) return;
    try {
      await deleteDoc(doc(db, COL, delTarget.id));
      pushToast("ลบผู้ใช้งานสำเร็จ");
    } catch (e) {
      console.error(e);
      pushToast("ลบไม่สำเร็จ", "danger");
    } finally {
      setDelTarget(null);
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <AdminSidebar />
      <div className="flex-grow-1" style={{ marginLeft: SIDEBAR_WIDTH }}>
        <Container fluid className="py-4 px-4">
          <Row className="align-items-center mb-3">
            <Col><h4 className="mb-0">จัดการผู้ใช้งาน</h4></Col>
            <Col xs="auto">
              <Button onClick={handleOpenCreate}>+ เพิ่มผู้ใช้งาน</Button>
            </Col>
          </Row>

          <Card className="mb-3">
            <Card.Body>
              <Row className="g-2">
                <Col md={8}>
                  <InputGroup>
                    <InputGroup.Text>ค้นหา</InputGroup.Text>
                    <Form.Control
                      placeholder="ค้นหาอีเมล / บทบาท / หมายเหตุ"
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={4}>
                  <Form.Select
                    value={qRole}
                    onChange={(e) => setQRole(e.target.value)}
                    aria-label="กรองตามบทบาท"
                  >
                    <option value="">ทุกบทบาท</option>
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>{displayRole(r)}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="overflow-auto">
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>อีเมล</th>
                  <th>รหัสผ่าน</th>
                  <th>บทบาท</th>
                  <th>หมายเหตุ</th>
                  <th>สร้างเมื่อ</th>
                  <th>แก้ไขล่าสุด</th>
                  <th style={{ width: 180 }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <Spinner animation="border" size="sm" /> กำลังโหลด...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">ไม่พบข้อมูล</td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id}>
                      <td className="fw-semibold">{row.email}</td>
                      <td>{row.pass ? "•".repeat(Math.min(String(row.pass).length, 12)) : "-"}</td>
                      <td>
                        <Badge
                          bg={
                            row.role === "admin"
                              ? "danger"
                              : row.role === "staff"
                              ? "primary"
                              : "secondary"
                          }
                        >
                          {displayRole(row.role)}
                        </Badge>
                      </td>
                      <td>{row.note || "-"}</td>
                      <td>{fmtTS(row.createdAt)}</td>
                      <td>{fmtTS(row.updatedAt)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button size="sm" variant="outline-secondary" onClick={() => handleOpenEdit(row)}>
                            แก้ไข
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => confirmDelete(row)}>
                            ลบ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card>

          {/* โมดอล เพิ่ม/แก้ไข */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Form onSubmit={onSubmit}>
              <Modal.Header closeButton>
                <Modal.Title>{editingId ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งาน"}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Row className="g-2">
                  <Col md={7}>
                    <Form.Label>อีเมล *</Form.Label>
                    <Form.Control
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="เช่น jinnawat.y@ku.th"
                      required
                    />
                  </Col>
                  <Col md={5}>
                    <Form.Label>บทบาท *</Form.Label>
                    <Form.Select
                      value={form.role}
                      onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>{displayRole(r)}</option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col md={7}>
                    <Form.Label>
                      รหัสผ่าน {editingId ? "(ปล่อยว่างหากไม่ต้องการเปลี่ยน)" : "*"}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={form.pass}
                      onChange={(e) => setForm((p) => ({ ...p, pass: e.target.value }))}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      required={!editingId}
                    />
                  </Col>
                  <Col md={5}>
                    <Form.Label>หมายเหตุ</Form.Label>
                    <Form.Control
                      value={form.note}
                      onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                      placeholder="เช่น ผู้ดูแลหลัก"
                    />
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>ยกเลิก</Button>
                <Button type="submit">{editingId ? "บันทึก" : "เพิ่ม"}</Button>
              </Modal.Footer>
            </Form>
          </Modal>

          {/* โมดอลยืนยันการลบ */}
          <Modal show={!!delTarget} onHide={() => setDelTarget(null)} centered backdrop="static">
            <Modal.Header closeButton>
              <Modal.Title>ยืนยันการลบ</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              ต้องการลบผู้ใช้งาน <strong>{delTarget?.email}</strong> ใช่หรือไม่? การลบนี้ไม่สามารถย้อนกลับได้
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setDelTarget(null)}>ยกเลิก</Button>
              <Button variant="danger" onClick={handleDelete}>ลบ</Button>
            </Modal.Footer>
          </Modal>

          {/* กล่องแจ้งเตือนสั้น (Toast) */}
          <ToastContainer position="bottom-end" className="p-3">
            <Toast
              bg={toast.bg}
              onClose={() => setToast((p) => ({ ...p, show: false }))}
              show={toast.show}
              delay={2600}
              autohide
            >
              <Toast.Body className={toast.bg === "warning" ? "text-dark" : ""}>
                {toast.msg}
              </Toast.Body>
            </Toast>
          </ToastContainer>
        </Container>
      </div>
    </div>
  );
}
