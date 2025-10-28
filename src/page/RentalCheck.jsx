// src/page/RentalCheck.jsx
import { useMemo, useState, useEffect } from "react";
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
  Pagination,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import NavbarComponent from "../componnets/Navbar";

// 🔗 Firebase
import { db } from "../service/Firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function RentalCheck() {
  // ---------- state ----------
  const [bookingsRaw, setBookingsRaw] = useState([]);
  const [lotsRaw, setLotsRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const pageSize = 8;
  const navigate = useNavigate();

  // ---------- utils ----------
  const toTHB = (n) =>
    typeof n === "number" && !Number.isNaN(n)
      ? n.toLocaleString("th-TH", { style: "currency", currency: "THB" })
      : "-";

  // ---------- fetch Firestore ----------
  // 1) lots
  useEffect(() => {
    const qLots = query(collection(db, "lots"));
    const unsub = onSnapshot(
      qLots,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setLotsRaw(rows);
      },
      (err) => console.error("lots onSnapshot error:", err)
    );
    return () => unsub();
  }, []);

  // 2) bookings
  useEffect(() => {
    const qBookings = query(
      collection(db, "bookings"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      qBookings,
      (snap) => {
        const rows = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setBookingsRaw(rows);
        setLoading(false);
      },
      (err) => {
        console.error("bookings onSnapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ทำ map สำหรับหา lot จาก lotId ได้ไว
  const lotsMap = useMemo(() => {
    const m = new Map();
    for (const l of lotsRaw) m.set(l.id, l);
    return m;
  }, [lotsRaw]);

  // รวมข้อมูล bookings + lots
  const bookings = useMemo(() => {
    return bookingsRaw.map((b) => {
      const lot = lotsMap.get(b.lotId || b.lotID || b.lotRef) || {};
      const lotNo = lot.lotNo ?? lot.name ?? `ล็อต ${b.lotId ?? "-"}`;
      const zone = lot.zone ?? b.zone ?? "-";

      // 🔸 ราคา/เดือน: ดึงจาก /bookings ก่อน แล้วค่อย fallback ไปที่ /lots
      const rawPerMonth =
        b.pricePerMonth ??
        b.monthlyPrice ??
        b.ratePerMonth ??
        lot.pricePerMonth ??
        lot.monthlyPrice ??
        0;
      const pricePerMonth = Number(rawPerMonth) || 0;

      const deposit = Number(b.deposit ?? lot.deposit ?? 0);

      // สถานะ normalize ให้เทียบได้ทั้งไทย/อังกฤษ
      const statusRaw = String(b.status || "").trim().toLowerCase();
      const statusDisplay = b.status ?? "-";

      return {
        id: b.code || b.bookingCode || b.id,
        lotId: b.lotId ?? null,
        lotNo,
        zone,
        renter: b.renter ?? b.renterName ?? b.name ?? "-",
        phone: b.phone ?? b.tel ?? "-",
        pricePerMonth, // ✅ ใช้แสดงในตาราง/โมดอล
        deposit,
        statusDisplay,
        statusRaw,
        note: b.note ?? b.remark ?? "",
      };
    });
  }, [bookingsRaw, lotsMap]);

  // ---------- filter/search ----------
  useEffect(() => setPage(1), [q, statusFilter]);

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return bookings.filter((r) => {
      const hay = [r.id, r.lotNo, r.zone, r.renter, r.phone, r.note]
        .join(" ")
        .toLowerCase();
      const matchQ = !qLower || hay.includes(qLower);

      const sf = statusFilter.trim().toLowerCase();
      const matchStatus =
        !sf ||
        r.statusRaw === sf ||
        (sf === "อนุมัติ" && r.statusRaw === "approved") ||
        (sf === "approved" && r.statusRaw === "อนุมัติ");

      return matchQ && matchStatus;
    });
  }, [bookings, q, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ---------- view helpers ----------
  const badgeVariant = (statusText) => {
    const s = String(statusText || "").toLowerCase();
    if (s === "approved" || s === "อนุมัติ" || s === "ยืนยันแล้ว") return "success";
    if (s === "pending" || s === "รอชำระ") return "warning";
    if (s === "cancelled" || s === "ยกเลิก") return "secondary";
    return "light";
  };

  // ---------- actions ----------
  const handlePay = (record) => {
    navigate(`/payments/${record.id}`);
  };

  return (
    <>
      <NavbarComponent />

      <Container className="mt-4 mb-5">
        <Card className="shadow-sm border-0">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col xs={12} md={5}>
                <Form.Label>ค้นหา</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="ชื่อผู้เช่า / เบอร์โทร / ล็อต / โซน / หมายเหตุ"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </InputGroup>
              </Col>

              <Col xs={12} md={3}>
                <Form.Label>สถานะ</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">ทั้งหมด</option>
                  <option value="approved">approved</option>
                  <option value="อนุมัติ">อนุมัติ</option>
                  <option value="รอชำระ">รอชำระ</option>
                  <option value="ยืนยันแล้ว">ยืนยันแล้ว</option>
                  <option value="ยกเลิก">ยกเลิก</option>
                </Form.Select>
              </Col>

              <Col xs={12} md={2}>
                <Button
                  className="w-100"
                  variant="outline-secondary"
                  onClick={() => {
                    setQ("");
                    setStatusFilter("");
                  }}
                >
                  ล้าง
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="shadow-sm border-0 mt-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0">ผลการค้นหา</h5>
              <small className="text-muted">
                {loading ? (
                  <>
                    กำลังโหลดข้อมูล… <Spinner animation="border" size="sm" />
                  </>
                ) : (
                  <>ทั้งหมด {filtered.length} รายการ • หน้า {page}/{totalPages}</>
                )}
              </small>
            </div>

            <Table hover responsive className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>เลขที่เช่า</th>
                  <th>ล็อต (lotNo)</th>
                  <th>โซน</th>
                  {/* ✅ เปลี่ยนเป็นราคา/เดือน */}
                  <th className="text-end">ราคา/เดือน</th>
                  <th>ผู้เช่า</th>
                  {/* ❌ เอาช่วงเช่าออก */}
                  {/* ❌ เอารวมค่าเช่าออก */}
                  <th className="text-center">สถานะ</th>
                  <th className="text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <Spinner animation="border" role="status" />
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      ไม่พบข้อมูลที่ตรงเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  pageItems.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.lotNo}</td>
                      <td>{r.zone}</td>
                      {/* ✅ แสดงราคา/เดือน */}
                      <td className="text-end">{toTHB(r.pricePerMonth)}</td>
                      <td>
                        <div>{r.renter}</div>
                        <small className="text-muted">{r.phone}</small>
                      </td>
                      <td className="text-center">
                        <Badge bg={badgeVariant(r.statusDisplay)}>
                          {r.statusDisplay}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => {
                              setDetail(r);
                              setShowDetail(true);
                            }}
                          >
                            รายละเอียด
                          </Button>

                          {(r.statusRaw === "approved" ||
                            r.statusRaw === "อนุมัติ") && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handlePay(r)}
                            >
                              ชำระเงิน
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            {!loading && totalPages > 1 && (
              <div className="d-flex justify-content-center">
                <Pagination className="m-0">
                  <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
                  <Pagination.Prev
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  />
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Pagination.Item
                      key={i + 1}
                      active={i + 1 === page}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  />
                  <Pagination.Last
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                  />
                </Pagination>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Modal รายละเอียด */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            รายละเอียดการเช่า {detail ? `• ${detail.id}` : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detail && (
            <Row className="g-3">
              <Col md={6}>
                <dl className="row mb-0">
                  <dt className="col-5">ผู้เช่า</dt>
                  <dd className="col-7">{detail.renter}</dd>

                  <dt className="col-5">เบอร์ติดต่อ</dt>
                  <dd className="col-7">{detail.phone}</dd>

                  <dt className="col-5">ล็อต / โซน</dt>
                  <dd className="col-7">
                    {detail.lotNo} / {detail.zone}
                  </dd>

                  {/* ❌ เอาช่วงวันที่ออก */}
                  <dt className="col-5">ราคา/เดือน</dt>
                  <dd className="col-7">{toTHB(detail.pricePerMonth)}</dd>
                </dl>
              </Col>
              <Col md={6}>
                <dl className="row mb-0">
                  {/* ❌ เอาค่าเช่ารวมออก */}
                  <dt className="col-5">มัดจำ</dt>
                  <dd className="col-7">{toTHB(detail.deposit)}</dd>

                  {/* ❌ เอายอดชำระรวมออก */}
                  <dt className="col-5">สถานะ</dt>
                  <dd className="col-7">
                    <Badge bg={badgeVariant(detail.statusDisplay)}>
                      {detail.statusDisplay}
                    </Badge>
                  </dd>

                  <dt className="col-5">หมายเหตุ</dt>
                  <dd className="col-7">{detail.note || "-"}</dd>
                </dl>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          {(detail?.statusRaw === "approved" || detail?.statusRaw === "อนุมัติ") && (
            <Button variant="success" onClick={() => handlePay(detail)}>
              ชำระเงิน
            </Button>
          )}
          <Button variant="outline-secondary" onClick={() => setShowDetail(false)}>
            ปิด
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
