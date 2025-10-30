// src/page/AdminLotsPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Modal,
  Row,
  Table,
  Toast,
  ToastContainer,
  Spinner,
} from "react-bootstrap";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../service/Firebase";
import AdminSidebar from "../componnets/AdminSideBar";

// ---------- ตัวช่วย ----------
const THB = (n) =>
  typeof n === "number"
    ? n.toLocaleString("th-TH", { style: "currency", currency: "THB" })
    : "-";

const statusMeta = {
  available: { label: "ว่าง", variant: "success" },
  occupied: { label: "ถูกเช่า", variant: "secondary" },
  inactive: { label: "ปิดใช้งาน", variant: "dark" },
};

// ---------- ฟอร์มเริ่มต้น ----------
const emptyForm = {
  lotNo: "",
  // name: "",           // ❌ ตัดออกตามคำขอ
  zone: "",
  size: "",
  pricePerDay: "",
  status: "available",
  amenities: {
    electric: false,
    water: false,
  },
  imageUrl: "", // ✅ เพิ่มช่องลิงก์รูป
  notes: "",
};

export default function AdminLotsPage() {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // ค้นหา/กรอง
  const [qText, setQText] = useState("");
  const [qStatus, setQStatus] = useState("");
  const [qZone, setQZone] = useState("");

  // ฟอร์ม + โมดัล
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // ลบ
  const [delTarget, setDelTarget] = useState(null);

  // Toast
  const [toast, setToast] = useState({ show: false, msg: "", bg: "success" });
  const pushToast = (msg, bg = "success") =>
    setToast({ show: true, msg, bg });

  // โหลดแบบเรียลไทม์จาก /lots
  useEffect(() => {
    const q = query(collection(db, "lots"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
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

  // กรองข้อมูล
  useEffect(() => {
    const t = qText.trim().toLowerCase();
    const data = items.filter((x) => {
      const hitText =
        !t ||
        [x.lotNo, x.name, x.zone, x.size, x.notes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(t);

      const hitStatus = !qStatus || x.status === qStatus;
      const hitZone = !qZone || (x.zone || "") === qZone;
      return hitText && hitStatus && hitZone;
    });
    setFiltered(data);
  }, [items, qText, qStatus, qZone]);

  const zones = useMemo(() => {
    const s = new Set(items.map((i) => i.zone).filter(Boolean));
    return Array.from(s);
  }, [items]);

  // เปิดเพิ่มใหม่
  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  // เปิดแก้ไข
  const handleOpenEdit = (row) => {
    setEditingId(row.id);
    setForm({
      lotNo: row.lotNo || "",
      zone: row.zone || "",
      size: row.size || "",
      pricePerMonth: row.pricePerMonth ?? "",
      status: row.status || "available",
      amenities: {
        electric: !!row?.amenities?.electric,
        water: !!row?.amenities?.water,
      },
      imageUrl: row.imageUrl || "", // ✅ โหลดค่ารูปเดิม
      notes: row.notes || "",
    });
    setShowModal(true);
  };

  // เปลี่ยนค่าฟอร์ม
  const setAmenity = (key, val) =>
    setForm((p) => ({ ...p, amenities: { ...p.amenities, [key]: val } }));

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.lotNo) {
      pushToast("กรุณากรอก เลขที่ล็อต", "warning");
      return;
    }

    // เตรียมข้อมูลก่อนบันทึก
    const payload = {
      ...form,
      imageUrl: (form.imageUrl || "").trim(), // ✅ ตัดช่องว่างหัว-ท้าย
      pricePerDay: form.pricePerDay === "" ? null : Number(form.pricePerDay),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "lots", editingId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        pushToast("บันทึกการแก้ไขสำเร็จ");
      } else {
        await addDoc(collection(db, "lots"), {
          ...payload,
          status: form.status || "available",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        pushToast("เพิ่มล็อตสำเร็จ");
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      pushToast("บันทึกไม่สำเร็จ", "danger");
    }
  };

  const confirmDelete = (row) => setDelTarget(row);
  const handleDelete = async () => {
    if (!delTarget) return;
    try {
      await deleteDoc(doc(db, "lots", delTarget.id));
      pushToast("ลบข้อมูลสำเร็จ");
    } catch (err) {
      console.error(err);
      pushToast("ลบไม่สำเร็จ", "danger");
    } finally {
      setDelTarget(null);
    }
  };

  const toggleStatus = async (row) => {
    const next =
      row.status === "available"
        ? "occupied"
        : row.status === "occupied"
        ? "available"
        : "available";
    try {
      await updateDoc(doc(db, "lots", row.id), {
        status: next,
        updatedAt: serverTimestamp(),
      });
      pushToast(`อัปเดตสถานะเป็น ${statusMeta[next].label}`);
    } catch (e) {
      console.error(e);
      pushToast("อัปเดตสถานะไม่สำเร็จ", "danger");
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* ซ้าย: Sidebar */}
      <AdminSidebar />

      {/* ขวา: เนื้อหาหลัก */}
      <div className="flex-grow-1" style={{ marginLeft: 260 }}>
        <Container fluid className="py-4 px-4">
          <Row className="align-items-center mb-3">
            <Col>
              <h4 className="mb-0">จัดการพื้นที่ล็อตตลาด</h4>
            </Col>
            <Col xs="auto">
              <Button onClick={handleOpenCreate}>+ เพิ่มพื้นที่ตลาด</Button>
            </Col>
          </Row>

          {/* แผงค้นหา/กรอง */}
          <Card className="mb-3">
            <Card.Body>
              <Row className="g-2">
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text>ค้นหา</InputGroup.Text>
                    <Form.Control
                      placeholder="ค้นหา เลขที่ล็อต / ชื่อล็อต / โซน / หมายเหตุ"
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={qStatus}
                    onChange={(e) => setQStatus(e.target.value)}
                  >
                    <option value="">ทุกสถานะ</option>
                    <option value="available">ว่าง</option>
                    <option value="occupied">ถูกเช่า</option>
                    <option value="inactive">ปิดใช้งาน</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={qZone}
                    onChange={(e) => setQZone(e.target.value)}
                  >
                    <option value="">ทุกโซน</option>
                    {zones.map((z) => (
                      <option key={z} value={z}>
                        โซน {z}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* ตารางข้อมูล */}
          <Card className="overflow-auto">
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ whiteSpace: "nowrap" }}>เลขที่ล็อต</th>
                  <th>รูป</th> {/* ✅ คอลัมน์ใหม่ */}
                
                  <th>โซน</th>
                  <th>ขนาด</th>
                  <th>ราคา/วัน</th>
                  <th>สิ่งอำนวยความสะดวก</th>
                  <th>สถานะ</th>
                  <th style={{ width: 180 }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <Spinner animation="border" size="sm" /> กำลังโหลด...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id}>
                      <td className="fw-semibold">{row.lotNo || "-"}</td>
                      <td style={{ width: 72 }}>
                        {row.imageUrl ? (
                          <img
                            src={row.imageUrl}
                            alt={row.lotNo || "lot-img"}
                            style={{
                              width: 60,
                              height: 60,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "1px solid #eee",
                            }}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src =
                                "data:image/svg+xml;charset=UTF-8," +
                                encodeURIComponent(
                                  `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><rect width='100%' height='100%' fill='#f3f3f3'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#bbb' font-size='10'>no img</text></svg>`
                                );
                            }}
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                   
                      <td>{row.zone || "-"}</td>
                      <td>{row.size || "-"}</td>
                      <td>
                        {row.pricePerMonth != null ? THB(row.pricePerMonth) : "-"}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {row?.amenities?.electric && (
                          <Badge bg="info" className="me-1">
                            ไฟฟ้า
                          </Badge>
                        )}
                        {row?.amenities?.water && (
                          <Badge bg="primary" className="me-1">
                            น้ำประปา
                          </Badge>
                        )}
                        {!row?.amenities && "-"}
                        {row?.amenities &&
                          !row?.amenities?.electric &&
                          !row?.amenities?.water &&
                          "-"}
                      </td>
                      <td>
                        <Badge bg={statusMeta[row.status]?.variant || "light"}>
                          {statusMeta[row.status]?.label || row.status || "-"}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => handleOpenEdit(row)}
                          >
                            แก้ไข
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => confirmDelete(row)}
                          >
                            ลบ
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => toggleStatus(row)}
                          >
                            {row.status === "available"
                              ? "ทำเป็นถูกเช่า"
                              : "ทำเป็นว่าง"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card>

          {/* Modal เพิ่ม/แก้ไข */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Form onSubmit={onSubmit}>
              <Modal.Header closeButton>
                <Modal.Title>
                  {editingId ? "แก้ไขข้อมูลล็อต" : "เพิ่มพื้นที่ตลาด"}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Row className="g-2">
                  <Col md={4}>
                    <Form.Label>เลขที่ล็อต *</Form.Label>
                    <Form.Control
                      value={form.lotNo}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, lotNo: e.target.value }))
                      }
                      placeholder="เช่น A-12"
                      required
                    />
                  </Col>

                  <Col md={4}>
                    <Form.Label>โซน</Form.Label>
                    <Form.Control
                      value={form.zone}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, zone: e.target.value }))
                      }
                      placeholder="เช่น A / B / C"
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label>ขนาด</Form.Label>
                    <Form.Control
                      value={form.size}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, size: e.target.value }))
                      }
                      placeholder="เช่น 2x3 ม."
                    />
                  </Col>

                  <Col md={4}>
                    <Form.Label>ราคา/เดือน (บาท)</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      value={form.pricePerMonth}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          pricePerMonth:
                            e.target.value === "" ? "" : Number(e.target.value),
                        }))
                      }
                      placeholder="เช่น 300"
                    />
                  </Col>

                  <Col md={8}>
                    <Form.Label>ลิงก์รูปภาพ</Form.Label> {/* ✅ ช่องกรอกลิงก์รูป */}
                    <Form.Control
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, imageUrl: e.target.value }))
                      }
                      placeholder="เช่น https://.../image.jpg"
                    />
                    {/* ✅ พรีวิวรูปทันที */}
                    {form.imageUrl?.trim() && (
                      <div className="mt-2">
                        <div className="small text-muted mb-1">พรีวิวรูป</div>
                        <img
                          src={form.imageUrl.trim()}
                          alt="preview"
                          style={{
                            width: "100%",
                            maxHeight: 180,
                            objectFit: "cover",
                            borderRadius: 8,
                            border: "1px solid #eee",
                          }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              "data:image/svg+xml;charset=UTF-8," +
                              encodeURIComponent(
                                `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='180'><rect width='100%' height='100%' fill='#f3f3f3'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#bbb' font-size='14'>ไม่สามารถแสดงรูปจากลิงก์นี้</text></svg>`
                              );
                          }}
                        />
                      </div>
                    )}
                  </Col>

                  <Col md={6}>
                    <Form.Label>สถานะ</Form.Label>
                    <Form.Select
                      value={form.status}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, status: e.target.value }))
                      }
                    >
                      <option value="available">ว่าง</option>
                      <option value="occupied">ถูกเช่า</option>
                      <option value="inactive">ปิดใช้งาน</option>
                    </Form.Select>
                  </Col>
                  <Col md={6}>
                    <Form.Label>สิ่งอำนวยความสะดวก</Form.Label>
                    <div className="d-flex flex-wrap gap-3 pt-1">
                      <Form.Check
                        type="checkbox"
                        label="ไฟฟ้า"
                        checked={form.amenities.electric}
                        onChange={(e) =>
                          setAmenity("electric", e.target.checked)
                        }
                      />
                      <Form.Check
                        type="checkbox"
                        label="น้ำประปา"
                        checked={form.amenities.water}
                        onChange={(e) => setAmenity("water", e.target.checked)}
                      />
                    </div>
                  </Col>
                  <Col xs={12}>
                    <Form.Label>หมายเหตุ</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={form.notes}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, notes: e.target.value }))
                      }
                      placeholder="รายละเอียดเพิ่มเติม"
                    />
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit">{editingId ? "บันทึก" : "เพิ่ม"}</Button>
              </Modal.Footer>
            </Form>
          </Modal>

          {/* Modal ลบ */}
          <Modal
            show={!!delTarget}
            onHide={() => setDelTarget(null)}
            centered
            backdrop="static"
          >
            <Modal.Header closeButton>
              <Modal.Title>ยืนยันการลบ</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              ต้องการลบ <strong>{delTarget?.lotNo || delTarget?.name}</strong>{" "}
              ใช่หรือไม่? การลบนี้ไม่สามารถย้อนกลับได้
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setDelTarget(null)}>
                ยกเลิก
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                ลบ
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Toast */}
          <ToastContainer position="bottom-end" className="p-3">
            <Toast
              bg={toast.bg}
              onClose={() => setToast((p) => ({ ...p, show: false }))}
              show={toast.show}
              delay={2600}
              autohide
            >
              <Toast.Body
                className={toast.bg === "warning" ? "text-dark" : ""}
              >
                {toast.msg}
              </Toast.Body>
            </Toast>
          </ToastContainer>
        </Container>
      </div>
    </div>
  );
}
