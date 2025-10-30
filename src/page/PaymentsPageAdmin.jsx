// src/page/PaymentsPage.jsx
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
  Pagination,
  Row,
  Table,
  Toast,
  ToastContainer,
  Spinner,
} from "react-bootstrap";
import AdminSidebar from "../componnets/AdminSideBar";

// 🔥 Firestore
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../service/Firebase";

const SIDEBAR_WIDTH = 260;

// ---------- ตัวช่วย ----------
const THB = (n) =>
  typeof n === "number"
    ? n.toLocaleString("th-TH", { style: "currency", currency: "THB" })
    : "-";

const fmtDate = (tsOrDate) => {
  if (!tsOrDate) return "-";
  const d =
    typeof tsOrDate?.toDate === "function" ? tsOrDate.toDate() : new Date(tsOrDate);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const methodBadge = (m) => {
  const t = String(m || "").toLowerCase();
  if (t === "card") return "primary";
  if (t === "cash") return "success";
  if (t === "transfer") return "warning";
  return "secondary";
};

export default function PaymentsPageAdmin() {
  // ---------- โหลดข้อมูลจาก /payments ----------
  const [rowsRaw, setRowsRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    // เรียงตาม paidAt ถ้าไม่มี ให้รองรับ createdAt
    const qPay = query(collection(db, "payments"), orderBy("paidAt", "desc"));
    const unsub = onSnapshot(
      qPay,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRowsRaw(arr);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "ไม่สามารถโหลดข้อมูลได้");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ---------- map ข้อมูลสำหรับ UI ----------
  const items = useMemo(() => {
    return rowsRaw.map((x) => ({
      id: x.id,                  // paymentId = docId
      bookingId: x.bookingId || "-",
      renterName: x.renterName || "-",
      phone: x.phone || "-",
      lot: x.lotName || x.lotId || "-",
      method: x.method || "-",
      amount: typeof x.amount === "number" ? x.amount : Number(x.amount) || 0,
      currency: x.currency || "THB",
      paidAt: x.paidAt || x.createdAt || null,
      slipUrl: x.slipUrl || null,
      _raw: x,
    }));
  }, [rowsRaw]);

  // ---------- ค้นหา + แบ่งหน้า ----------
  const [qtext, setQtext] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      [
        it.id,
        it.bookingId,
        it.renterName,
        it.phone,
        String(it.lot),
        String(it.method),
        String(it.amount),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, qtext]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  // ---------- ตัวช่วยดูสลิป ----------
  const [slipView, setSlipView] = useState({ show: false, url: null, title: "" });

  return (
    <>
      <div className="admin-shell" style={{ paddingLeft: SIDEBAR_WIDTH, minHeight: "100vh" }}>
        <AdminSidebar />

        <Container fluid className="py-4">
          <Row className="mb-3">
            <Col>
              <h4 className="fw-bold">ข้อมูลการชำระเงิน</h4>
            </Col>
          </Row>

          <Card className="shadow-sm">
            <Card.Body>
              <Row className="g-2 align-items-center mb-3">
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text>ค้นหา</InputGroup.Text>
                    <Form.Control
                      placeholder="พิมพ์ รหัสชำระเงิน / Booking ID / ชื่อผู้เช่า / เบอร์ / ล็อต / วิธีชำระ / จำนวนเงิน"
                      value={qtext}
                      onChange={(e) => setQtext(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col className="text-md-end text-start mt-2 mt-md-0">
                  <div className="small text-muted">
                    ทั้งหมด {filtered.length} รายการ | หน้า {page}/{totalPages}
                  </div>
                </Col>
              </Row>

              {error ? (
                <div className="text-danger">{error}</div>
              ) : loading ? (
                <div className="py-5 text-center">
                  <Spinner animation="border" />
                </div>
              ) : (
                <>
                  <div className="table-responsive overflow-auto" style={{ maxHeight: "70vh" }}>
                    <Table hover className="align-middle mb-0" style={{ minWidth: 1000 }}>
                      <thead className="table-light">
                        <tr>
                          <th className="text-nowrap" style={{ minWidth: 140 }}>รหัสชำระเงิน</th>
                          <th className="text-nowrap" style={{ minWidth: 140 }}>Booking ID</th>
                          <th style={{ minWidth: 220 }}>ผู้เช่า</th>
                          <th className="text-nowrap" style={{ minWidth: 130 }}>เบอร์โทร</th>
                          <th className="text-nowrap" style={{ minWidth: 90 }}>ล็อต</th>
                          <th className="text-nowrap" style={{ minWidth: 110 }}>วิธีชำระ</th>
                          <th className="text-nowrap" style={{ minWidth: 120 }}>จำนวนเงิน</th>
                          <th className="text-nowrap" style={{ minWidth: 170 }}>ชำระเมื่อ</th>
                          <th className="text-center text-nowrap" style={{ minWidth: 120 }}>สลิป</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paged.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center text-muted py-4">
                              ไม่พบข้อมูลที่ตรงกับคำค้นหา
                            </td>
                          </tr>
                        ) : (
                          paged.map((it) => (
                            <tr key={it.id}>
                              <td className="fw-semibold text-nowrap">{it.id}</td>
                              <td className="text-nowrap">{it.bookingId}</td>
                              <td style={{ maxWidth: 260 }}>
                                <div className="fw-semibold text-truncate" title={it.renterName}>
                                  {it.renterName}
                                </div>
                                <div className="text-muted small text-truncate" title={it.phone}>
                                  {it.phone}
                                </div>
                              </td>
                              <td className="text-nowrap">{it.phone}</td>
                              <td className="text-nowrap">{it.lot}</td>
                              <td className="text-nowrap">
                                <Badge bg={methodBadge(it.method)} className="px-2 py-1">
                                  {it.method || "-"}
                                </Badge>
                              </td>
                              <td className="text-nowrap">{THB(it.amount)}</td>
                              <td className="text-nowrap">{fmtDate(it.paidAt)}</td>
                              <td className="text-center">
                                {it.slipUrl ? (
                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() =>
                                      setSlipView({ show: true, url: it.slipUrl, title: `สลิป: ${it.id}` })
                                    }
                                  >
                                    ดูสลิป
                                  </Button>
                                ) : (
                                  <span className="text-muted small">-</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>

                  <div className="d-flex justify-content-end pt-3">
                    <Pagination className="mb-0">
                      <Pagination.First disabled={page === 1} onClick={() => setPage(1)} />
                      <Pagination.Prev disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
                      <Pagination.Item active>{page}</Pagination.Item>
                      <Pagination.Next
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      />
                      <Pagination.Last disabled={page === totalPages} onClick={() => setPage(totalPages)} />
                    </Pagination>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>

      {/* Modal แสดงสลิป */}
      <Modal show={slipView.show} onHide={() => setSlipView({ show: false, url: null, title: "" })} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{slipView.title || "สลิปการชำระเงิน"}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {slipView.url ? (
            <img
              src={slipView.url}
              alt="Payment slip"
              style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
            />
          ) : (
            <div className="text-muted">ไม่พบรูปสลิป</div>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        @media (max-width: 991.98px) {
          .admin-shell { padding-left: 0 !important; }
        }
      `}</style>
    </>
  );
}
