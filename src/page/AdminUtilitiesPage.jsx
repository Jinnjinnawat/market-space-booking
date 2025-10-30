// src/page/AdminUtilitiesPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Container,
  Form,
  Modal,
  Table,
  Spinner,
  Toast,
  ToastContainer,
  Row,
  Col,
  InputGroup,
} from "react-bootstrap";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db, storage } from "../service/Firebase"; // ✅ เพิ่ม storage
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"; // ✅ ฟังก์ชันที่ใช้
import AdminSidebar from "../componnets/AdminSideBar";

const SIDEBAR_WIDTH = 260;

// ✅ ชื่อรายการและหน่วยอัตโนมัติ (เหลือเฉพาะค่าน้ำ/ค่าไฟ)
const NAME_TO_UNIT = {
  ค่าน้ำ: "ลบ.ม.",
  ค่าไฟ: "kWh",
};
const NAME_OPTIONS = Object.keys(NAME_TO_UNIT); // ["ค่าน้ำ", "ค่าไฟ"]

const fmtTHB = (n) =>
  typeof n === "number"
    ? n.toLocaleString("th-TH", { style: "currency", currency: "THB" })
    : "-";

// ✅ helper: ทำชื่อไฟล์ปลอดภัย
const safe = (s = "") => String(s).replace(/[^a-zA-Z0-9._-]/g, "_");

export default function AdminUtilitiesPage() {
  const [items, setItems] = useState([]); // utilities ทั้งหมด
  const [lots, setLots] = useState([]); // lots ทั้งหมด
  const [loading, setLoading] = useState(true);

  // ฟิลเตอร์ในหน้า (ดู/ค้นหา)
  // หมายเหตุ: ถ้าอยากมีตัวกรอง lot เพิ่มได้ภายหลัง
  const [search, setSearch] = useState("");

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: "" });

  // ฟอร์ม
  const [form, setForm] = useState({
    name: "",
    unit: "",
    pricePerUnit: "",
    lotId: "",
    usage: "",
    billingMonth: "", // YYYY-MM
  });
  const [proofFile, setProofFile] = useState(null); // ไฟล์ที่เลือก (ใหม่)
  const [uploading, setUploading] = useState(false); // สถานะอัปโหลดไฟล์

  // map lotId -> lotNo
  const lotMap = useMemo(
    () =>
      Object.fromEntries(
        lots.map((l) => [
          l.id,
          l.lotNo || l.code || l.number || l.name || l.id.slice(0, 6),
        ])
      ),
    [lots]
  );

  const total = useMemo(() => {
    const price = parseFloat(form.pricePerUnit || 0);
    const use = parseFloat(form.usage || 0);
    return price * use || 0;
  }, [form.pricePerUnit, form.usage]);

  // ---- load utilities ----
  useEffect(() => {
    const qU = query(collection(db, "utilities"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(qU, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ---- load lots (ทั้งหมด) ----
  useEffect(() => {
    const qLots = query(collection(db, "lots"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(qLots, (snap) => {
      setLots(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      unit: "",
      pricePerUnit: "",
      lotId: "",
      usage: "",
      billingMonth: "",
    });
    setProofFile(null);
  };

  // ✅ อัปโหลดไฟล์หลักฐานขึ้น Storage แล้วคืนข้อมูล url/path/name
  const uploadProofIfNeeded = async (lotId, billingMonth) => {
    if (!proofFile) return null; // ไม่ได้เลือกไฟล์
    setUploading(true);
    try {
      const lotNo = lotMap[lotId] || lotId || "unknown";
      const basePath = `utilities/${safe(lotId)}_${safe(lotNo)}/${safe(billingMonth || "no-month")}`;
      const filename = `${Date.now()}_${safe(proofFile.name)}`;
      const fullPath = `${basePath}/${filename}`;
      const storageRef = ref(storage, fullPath);
      await uploadBytes(storageRef, proofFile);
      const url = await getDownloadURL(storageRef);
      return { proofUrl: url, proofPath: fullPath, proofName: proofFile.name };
    } finally {
      setUploading(false);
    }
  };

  // ✅ ลบไฟล์เก่าจาก Storage (ถ้ามี path)
  const deleteOldProofIfAny = async (path) => {
    if (!path) return;
    try {
      await deleteObject(ref(storage, path));
    } catch (err) {
      // เงียบไว้ (กรณีไฟล์ไม่เจอ)
      console.warn("deleteOldProofIfAny:", err?.message || err);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.unit || !form.pricePerUnit || !form.lotId || !form.billingMonth) {
      setToast({
        show: true,
        msg: "กรุณากรอกข้อมูลให้ครบ (ชื่อ, หน่วย, ราคา/หน่วย, ล็อต, เดือน)",
      });
      return;
    }
    try {
      // 1) ถ้ามีไฟล์ใหม่ → อัปโหลดก่อน
      let proof = null;
      if (proofFile) {
        proof = await uploadProofIfNeeded(form.lotId, form.billingMonth);
      }

      const payload = {
        name: form.name.trim(),
        unit: form.unit,
        pricePerUnit: Number(form.pricePerUnit),
        usage: Number(form.usage || 0),
        total,
        lotId: form.lotId, // อ้างถึง lots/{id}
        billingMonth: form.billingMonth, // YYYY-MM
        ...(proof ? proof : {}), // proofUrl, proofPath, proofName (ถ้ามีอัปโหลด)
      };

      if (editing) {
        // ถ้ามีไฟล์ใหม่ และเอกสารเก่ามี proofPath → ลบไฟล์เก่า
        if (proof && editing.proofPath && editing.proofPath !== proof.proofPath) {
          await deleteOldProofIfAny(editing.proofPath);
        }
        await updateDoc(doc(db, "utilities", editing.id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        setToast({ show: true, msg: "แก้ไขข้อมูลเรียบร้อย" });
      } else {
        await addDoc(collection(db, "utilities"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setToast({ show: true, msg: "เพิ่มข้อมูลเรียบร้อย" });
      }

      setShowModal(false);
      resetForm();
      setEditing(null);
    } catch (err) {
      console.error(err);
      setToast({ show: true, msg: "เกิดข้อผิดพลาด" });
    }
  };

  const handleDelete = async (id) => {
    const it = items.find((x) => x.id === id);
    if (!window.confirm("ต้องการลบรายการนี้หรือไม่?")) return;
    try {
      // ลบไฟล์หลักฐานใน Storage ด้วยถ้ามี
      if (it?.proofPath) {
        await deleteOldProofIfAny(it.proofPath);
      }
      await deleteDoc(doc(db, "utilities", id));
      setToast({ show: true, msg: "ลบข้อมูลเรียบร้อย" });
    } catch (err) {
      console.error(err);
      setToast({ show: true, msg: "ลบไม่สำเร็จ" });
    }
  };

  const openEdit = (item) => {
    const autoUnit = NAME_TO_UNIT[item.name] || item.unit || "";
    setEditing(item);
    setForm({
      name: item.name || "",
      unit: autoUnit,
      pricePerUnit: item.pricePerUnit ?? "",
      lotId: item.lotId || "",
      usage: item.usage ?? "",
      billingMonth: item.billingMonth || "",
    });
    setProofFile(null); // เริ่มต้นว่าง
    setShowModal(true);
  };

  // ✅ เมื่อเลือก "ชื่อรายการ" ให้ตั้ง "หน่วย" อัตโนมัติ
  const onSelectName = (nameValue) => {
    const nextUnit = NAME_TO_UNIT[nameValue] || "";
    setForm((f) => ({ ...f, name: nameValue, unit: nextUnit }));
  };

  // กรองรายการสำหรับแสดงในตาราง
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter((it) =>
      !s
        ? true
        : [
            it.name,
            lotMap[it.lotId],
            it.unit,
            String(it.pricePerUnit),
            String(it.usage),
            it.billingMonth,
          ]
            .join(" ")
            .toLowerCase()
            .includes(s)
    );
  }, [items, search, lotMap]);

  return (
    <div className="d-flex">
      <AdminSidebar width={SIDEBAR_WIDTH} />
      <div style={{ marginLeft: SIDEBAR_WIDTH, flex: 1, padding: "1rem" }}>
        <Container fluid>
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0">จัดการค่าสาธารณูปโภค</h5>
              </div>

              <div className="d-flex align-items-center gap-2">
                <InputGroup style={{ width: "300px" }}>
                  <InputGroup.Text>
                    <i className="bi bi-search" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="ค้นหา..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>

                <Button
                  onClick={() => {
                    resetForm();
                    setEditing(null);
                    setShowModal(true);
                  }}
                >
                  + แจ้งค่าน้ำ/ค่าไฟ
                </Button>
              </div>
            </Card.Header>

            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />{" "}
                  <span className="ms-2">กำลังโหลดข้อมูล…</span>
                </div>
              ) : (
                <Table bordered hover responsive className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>ลำดับ</th>
                      <th>ชื่อรายการ</th>
                      <th>ล็อต (lotNo)</th>
                      <th>เดือน</th>
                      <th>หน่วย</th>
                      <th className="text-end">จำนวนที่ใช้</th>
                      <th className="text-end">ราคาต่อหน่วย</th>
                      <th className="text-end">รวม (บาท)</th>
                      <th>หลักฐาน</th>
                      <th className="text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center text-muted">
                          ไม่มีข้อมูล
                        </td>
                      </tr>
                    ) : (
                      filtered.map((it, i) => (
                        <tr key={it.id}>
                          <td>{i + 1}</td>
                          <td>{it.name || "-"}</td>
                          <td>{lotMap[it.lotId] || "-"}</td>
                          <td>{it.billingMonth || "-"}</td>
                          <td>{it.unit || "-"}</td>
                          <td className="text-end">
                            {typeof it.usage === "number"
                              ? it.usage.toLocaleString("th-TH")
                              : "-"}
                          </td>
                          <td className="text-end">
                            {typeof it.pricePerUnit === "number"
                              ? it.pricePerUnit.toLocaleString("th-TH")
                              : "-"}
                          </td>
                          <td className="text-end">
                            {typeof it.total === "number"
                              ? it.total.toLocaleString("th-TH", {
                                  minimumFractionDigits: 2,
                                })
                              : "-"}
                          </td>
                          <td>
                            {it.proofUrl ? (
                              <a href={it.proofUrl} target="_blank" rel="noreferrer">
                                {it.proofName || "เปิดไฟล์"}
                              </a>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-2 justify-content-center">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => openEdit(it)}
                              >
                                แก้ไข
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(it.id)}
                              >
                                ลบ
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* Modal เพิ่ม/แก้ไข */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {editing ? "แก้ไขค่าสาธารณูปโภค" : "แจ้งค่าน้ำ/ค่าไฟ"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              {/* ✅ ชื่อรายการเป็น Dropdown (ค่าน้ำ/ค่าไฟ) */}
              <Form.Group className="mb-3">
                <Form.Label>ชื่อรายการ</Form.Label>
                <Form.Select
                  value={form.name}
                  onChange={(e) => onSelectName(e.target.value)}
                >
                  <option value="">เลือกชื่อรายการ...</option>
                  {NAME_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* ✅ เลือกล็อตจาก lotNo — แสดง “ทั้งหมด” */}
              <Form.Group className="mb-3">
                <Form.Label>เลือกล็อต (lotNo)</Form.Label>
                <Form.Select
                  value={form.lotId}
                  onChange={(e) => setForm({ ...form, lotId: e.target.value })}
                >
                  <option value="">เลือกล็อต...</option>
                  {lots
                    .slice()
                    .sort((a, b) =>
                      (a.lotNo || "").localeCompare(b.lotNo || "")
                    )
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.lotNo || l.code || l.number || l.name || l.id}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>

              {/* ✅ เดือนที่ออกบิล */}
              <Form.Group className="mb-3">
                <Form.Label>เดือนที่ออกบิล</Form.Label>
                <Form.Control
                  type="month"
                  value={form.billingMonth}
                  onChange={(e) =>
                    setForm({ ...form, billingMonth: e.target.value })
                  }
                />
                <Form.Text className="text-muted">
                  ตัวอย่าง: 2025-10
                </Form.Text>
              </Form.Group>

              <Row>
                <Col md={6}>
                  {/* ✅ หน่วย auto + readOnly */}
                  <Form.Group className="mb-3">
                    <Form.Label>หน่วย</Form.Label>
                    <Form.Control
                      type="text"
                      value={form.unit}
                      readOnly
                      placeholder="เลือกชื่อรายการก่อน"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>ราคาต่อหน่วย (บาท)</Form.Label>
                    <Form.Control
                      type="number"
                      value={form.pricePerUnit}
                      onChange={(e) =>
                        setForm({ ...form, pricePerUnit: e.target.value })
                      }
                      placeholder="เช่น 10"
                      min="0"
                      step="0.01"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>จำนวนที่ใช้</Form.Label>
                    <Form.Control
                      type="number"
                      value={form.usage}
                      onChange={(e) =>
                        setForm({ ...form, usage: e.target.value })
                      }
                      placeholder="เช่น 15"
                      min="0"
                      step="0.01"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>รวม (บาท)</Form.Label>
                    <Form.Control
                      type="text"
                      value={total.toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                      readOnly
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* ✅ หลักฐานบิล (อัปโหลดรูป/PDF) */}
              <Form.Group className="mb-2">
                <Form.Label>หลักฐานบิล (รูปภาพ/PDF)</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                />
                {editing?.proofUrl && !proofFile && (
                  <div className="mt-2">
                    <a href={editing.proofUrl} target="_blank" rel="noreferrer">
                      ดูไฟล์เดิม: {editing.proofName || "เปิดไฟล์"}
                    </a>
                  </div>
                )}
                {proofFile && (
                  <div className="mt-2 text-muted small">
                    ไฟล์ที่จะอัปโหลดใหม่: {proofFile.name}
                  </div>
                )}
                {uploading && (
                  <div className="mt-2 text-info small">กำลังอัปโหลดไฟล์…</div>
                )}
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={uploading}>
              บันทึก
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Toast */}
        <ToastContainer position="bottom-end" className="p-3">
          <Toast
            bg="light"
            onClose={() => setToast({ show: false })}
            show={toast.show}
            delay={2000}
            autohide
          >
            <Toast.Body>{toast.msg}</Toast.Body>
          </Toast>
        </ToastContainer>
      </div>
    </div>
  );
}
