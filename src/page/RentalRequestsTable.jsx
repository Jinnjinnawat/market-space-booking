import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Modal,
  Pagination,
  Row,
  Table,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import AdminSidebar from "../componnets/AdminSideBar";

// ---------- กำหนดความกว้าง sidebar ให้ตรงกับของคุณ ----------
const SIDEBAR_WIDTH = 260; // px

const statusVariant = (status) => {
  switch (status) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "cancelled":
      return "secondary";
    default:
      return "light";
  }
};

export default function RentalRequestsTable() {
  // --------- mock data ----------
  const [items, setItems] = useState([
    { id: "REQ-0001", renterName: "สมชาย ใจดี", phone: "0812345678", lot: "A-01", requestDate: "2025-10-20", status: "pending" },
    { id: "REQ-0002", renterName: "กมลทิพย์ แสงทอง", phone: "0899991111", lot: "B-05", requestDate: "2025-10-21", status: "approved" },
    { id: "REQ-0003", renterName: "อนันต์ สายชล", phone: "0822223333", lot: "C-12", requestDate: "2025-10-22", status: "pending" },
    { id: "REQ-0004", renterName: "ศิริวรรณ ธรรมดี", phone: "0866667777", lot: "A-02", requestDate: "2025-10-23", status: "cancelled" },
  ]);

  // --------- ค้นหา + แบ่งหน้า ----------
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      it.id.toLowerCase().includes(q) ||
      it.renterName.toLowerCase().includes(q) ||
      it.phone.toLowerCase().includes(q) ||
      it.lot.toLowerCase().includes(q) ||
      it.status.toLowerCase().includes(q)
    );
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  // --------- Modal/Toast ----------
  const [confirm, setConfirm] = useState({ type: null, item: null });
  const [cancelNote, setCancelNote] = useState("");
  const [toast, setToast] = useState({ show: false, title: "", body: "" });

  const openApprove = (item) => setConfirm({ type: "approve", item });
  const openCancel = (item) => setConfirm({ type: "cancel", item });
  const closeConfirm = () => { setConfirm({ type: null, item: null }); setCancelNote(""); };

  const handleApprove = () => {
    if (!confirm.item) return;
    setItems((prev) => prev.map((it) => it.id === confirm.item.id ? { ...it, status: "approved" } : it));
    setToast({ show: true, title: "สำเร็จ", body: `อนุมัติคำขอ ${confirm.item.id} แล้ว` });
    closeConfirm();
  };

  const handleCancel = () => {
    if (!confirm.item) return;
    setItems((prev) => prev.map((it) => it.id === confirm.item.id ? { ...it, status: "cancelled", cancelNote } : it));
    setToast({ show: true, title: "สำเร็จ", body: `ยกเลิกคำขอ ${confirm.item.id} แล้ว` });
    closeConfirm();
  };

  return (
    <>
      {/* ถ้า AdminSidebar เป็นแบบ fixed ทางซ้าย โค้ดนี้จะกันไม่ให้ทับกัน */}
      <div
        className="admin-shell"
        style={{
          paddingLeft: SIDEBAR_WIDTH,       // เว้นที่ให้ sidebar
          minHeight: "100vh",
        }}
      >
        <AdminSidebar />

        <Container fluid className="py-4">
          <Row className="mb-3">
            <Col>
              <h4 className="fw-bold">จัดการคำขอเช่าพื้นที่</h4>
              <div className="text-muted">มุมมองตาราง พร้อมช่องค้นหาและปุ่มอนุมัติ/ยกเลิก</div>
            </Col>
          </Row>

          <Card className="shadow-sm">
            <Card.Body>
              <Row className="g-2 align-items-center mb-3">
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text>ค้นหา</InputGroup.Text>
                    <Form.Control
                      placeholder="พิมพ์ รหัสคำขอ / ชื่อผู้เช่า / เบอร์ / ล็อต / สถานะ"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col className="text-md-end text-start mt-2 mt-md-0">
                  <div className="small text-muted">
                    ทั้งหมด {filtered.length} รายการ | หน้า {page}/{totalPages}
                  </div>
                </Col>
              </Row>

              {/* ทำให้ตารางสกรอลล์ได้ครบ + คอลัมน์ปุ่ม sticky ขวา */}
              <div className="table-responsive overflow-auto" style={{ maxHeight: "70vh" }}>
                <Table hover className="align-middle mb-0" style={{ minWidth: 900 }}>
                  <thead className="table-light">
                    <tr>
                      <th className="text-nowrap" style={{ minWidth: 130 }}>เลขที่คำขอ</th>
                      <th style={{ minWidth: 240 }}>ผู้เช่า</th>
                      <th className="text-nowrap" style={{ minWidth: 130 }}>เบอร์โทร</th>
                      <th className="text-nowrap" style={{ minWidth: 90 }}>ล็อต</th>
                      <th className="text-nowrap" style={{ minWidth: 130 }}>วันที่ขอ</th>
                      <th className="text-nowrap" style={{ minWidth: 120 }}>สถานะ</th>
                      <th
                        className="text-center text-nowrap"
                        style={{
                          minWidth: 210,
                          position: "sticky",
                          right: 0,
                          background: "var(--bs-body-bg)",
                          zIndex: 1,
                        }}
                      >
                        การจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-4">
                          ไม่พบข้อมูลที่ตรงกับคำค้นหา
                        </td>
                      </tr>
                    ) : (
                      paged.map((it) => {
                        const isPending = it.status === "pending";
                        return (
                          <tr key={it.id}>
                            <td className="fw-semibold text-nowrap">{it.id}</td>
                            <td style={{ maxWidth: 280 }}>
                              <div className="fw-semibold text-truncate" title={it.renterName}>{it.renterName}</div>
                              <div className="text-muted small text-truncate" title={it.phone}>{it.phone}</div>
                            </td>
                            <td className="text-nowrap">{it.phone}</td>
                            <td className="text-nowrap">{it.lot}</td>
                            <td className="text-nowrap">{new Date(it.requestDate).toLocaleDateString("th-TH")}</td>
                            <td>
                              <Badge bg={statusVariant(it.status)} className="px-2 py-1 text-uppercase">
                                {it.status}
                              </Badge>
                            </td>
                            <td
                              className="text-center"
                              style={{
                                position: "sticky",
                                right: 0,
                                background: "var(--bs-body-bg)",
                              }}
                            >
                              <ButtonGroup>
                                <Button
                                  variant="success"
                                  size="sm"
                                  disabled={!isPending}
                                  onClick={() => openApprove(it)}
                                >
                                  อนุมัติ
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  disabled={it.status === "cancelled"}
                                  onClick={() => openCancel(it)}
                                >
                                  ยกเลิก
                                </Button>
                              </ButtonGroup>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>

              <div className="d-flex justify-content-end pt-3">
                <Pagination className="mb-0">
                  <Pagination.First disabled={page === 1} onClick={() => setPage(1)} />
                  <Pagination.Prev disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
                  <Pagination.Item active>{page}</Pagination.Item>
                  <Pagination.Next disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
                  <Pagination.Last disabled={page === totalPages} onClick={() => setPage(totalPages)} />
                </Pagination>
              </div>
            </Card.Body>
          </Card>

          {/* Confirm Modal */}
          <Modal show={!!confirm.type} onHide={closeConfirm} centered>
            <Modal.Header closeButton>
              <Modal.Title>
                {confirm.type === "approve" ? "ยืนยันการอนุมัติ" : confirm.type === "cancel" ? "ยืนยันการยกเลิก" : "ดำเนินการ"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {confirm.item && (
                <>
                  <div className="mb-2">เลขที่คำขอ: <strong>{confirm.item.id}</strong></div>
                  <div className="mb-3">ผู้เช่า: <strong>{confirm.item.renterName}</strong> ({confirm.item.phone})</div>
                  {confirm.type === "cancel" && (
                    <Form.Group>
                      <Form.Label>เหตุผลในการยกเลิก (ไม่บังคับ)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="เช่น ผู้เช่าขอยกเลิก / เอกสารไม่ครบ / ชำระเงินไม่สำเร็จ"
                        value={cancelNote}
                        onChange={(e) => setCancelNote(e.target.value)}
                      />
                    </Form.Group>
                  )}
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={closeConfirm}>ปิด</Button>
              {confirm.type === "approve" ? (
                <Button variant="success" onClick={handleApprove}>ยืนยันอนุมัติ</Button>
              ) : confirm.type === "cancel" ? (
                <Button variant="danger" onClick={handleCancel}>ยืนยันยกเลิก</Button>
              ) : null}
            </Modal.Footer>
          </Modal>

          {/* Toast */}
          <ToastContainer position="bottom-end" className="p-3">
            <Toast
              show={toast.show}
              onClose={() => setToast({ show: false, title: "", body: "" })}
              delay={2200}
              autohide
              bg="light"
            >
              <Toast.Header closeButton>
                <strong className="me-auto">{toast.title}</strong>
              </Toast.Header>
              <Toast.Body>{toast.body}</Toast.Body>
            </Toast>
          </ToastContainer>
        </Container>
      </div>

      {/* ทำให้จอเล็กลด padding-left อัตโนมัติ ถ้า sidebar ซ่อน/ยุบ */}
      <style>{`
        @media (max-width: 991.98px) {
          .admin-shell { padding-left: 0 !important; }
        }
      `}</style>
    </>
  );
}
