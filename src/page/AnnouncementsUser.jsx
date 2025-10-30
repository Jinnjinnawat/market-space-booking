// src/page/Announcements.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Image,
  InputGroup,
  Modal,
  Pagination,
  Placeholder,
  Row,
  Stack,
  Toast,
  ToastContainer,
  Offcanvas,
} from "react-bootstrap";

import NavbarComponent from "../componnets/Navbar";
import Footer from "../componnets/Footer";

// 🔥 Firestore
import { db } from "../service/Firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function AnnouncementsPage() {
  // ---------- state ----------
  const [items, setItems] = useState([]); // ← ดึงจาก /announcements
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(6);
  const [showSubscribeToast, setShowSubscribeToast] = useState(false);

  // ---------- subscribe Firestore ----------
  useEffect(() => {
    const colRef = collection(db, "announcements");
    // เรียง pinned ก่อน แล้วตาม createdAt ล่าสุด
    const qRef = query(
      colRef,
      orderBy("pinned", "desc"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const rows = snap.docs.map((d) => normalizeAnnouncement(d.id, d.data()));
        setItems(rows);
        setLoading(false);
      },
      (err) => {
        console.error("announcements onSnapshot error:", err);
        setItems([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // ---------- หมวดหมู่จากข้อมูลจริง ----------
  const categories = useMemo(() => {
    const set = new Set(items.map((x) => x.category).filter(Boolean));
    return ["ทั้งหมด", ...Array.from(set)];
  }, [items]);

  // ---------- filter/sort ----------
  const filtered = useMemo(() => {
    let data = [...items];

    // คำค้น
    const q = queryText.trim().toLowerCase();
    if (q) {
      data = data.filter(
        (x) =>
          x.title.toLowerCase().includes(q) ||
          x.content.toLowerCase().includes(q) ||
          (x.summary || "").toLowerCase().includes(q) ||
          x.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // หมวด
    if (category && category !== "ทั้งหมด") {
      data = data.filter((x) => x.category === category);
    }

    // sort ตามตัวเลือก (pin จะถูกจัดไว้แล้วจาก query แต่อีกครั้งเผื่อความชัวร์)
    data.sort((a, b) => Number(b.pin) - Number(a.pin));
    if (sort === "newest") {
      data.sort((a, b) => b.createdAtMs - a.createdAtMs);
    } else {
      data.sort((a, b) => a.createdAtMs - b.createdAtMs);
    }

    return data;
  }, [items, queryText, category, sort]);

  // ---------- pagination ----------
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [queryText, category, sort, perPage]);

  return (
    <>
      <NavbarComponent />
      <Container className="py-4">
        {/* Header */}
        <Stack direction="horizontal" className="mb-3" gap={3}>
          <div>
            <h2 className="mb-0">แจ้งข่าวสาร</h2>
            <div className="text-muted">อัปเดตล่าสุดสำหรับผู้ใช้งานตลาดนัด</div>
          </div>
          <div className="ms-auto" />
        </Stack>

        {/* Controls */}
        <Row className="g-2 align-items-end mb-3">
          <Col md={5}>
            <Form.Label htmlFor="search">ค้นหาข่าว</Form.Label>
            <InputGroup>
              <InputGroup.Text id="search-label" aria-label="search-icon">🔎</InputGroup.Text>
              <Form.Control
                id="search"
                placeholder="พิมพ์คำค้นหา เช่น เทศกาล, ปิดปรับปรุง"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col md={3}>
            <Form.Label>หมวดหมู่</Form.Label>
            <Form.Select
              aria-label="เลือกหมวดหมู่"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c === "ทั้งหมด" ? "" : c}>
                  {c}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Label>เรียงลำดับ</Form.Label>
            <Form.Select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">ใหม่ล่าสุด</option>
              <option value="oldest">เก่าสุด</option>
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Label>ต่อหน้า</Form.Label>
            <Form.Select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
            >
              {[6, 9, 12].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        {/* Grid */}
        <Row className="g-3">
          {loading
            ? Array.from({ length: perPage }).map((_, i) => (
                <Col md={6} lg={4} key={`ph-${i}`}>
                  <Card className="h-100">
                    <Placeholder as={Card.Img} variant="top" style={{ height: 180 }} />
                    <Card.Body>
                      <Placeholder as={Card.Title} animation="glow">
                        <Placeholder xs={7} />
                      </Placeholder>
                      <Placeholder as={Card.Text} animation="glow">
                        <Placeholder xs={10} /> <Placeholder xs={9} /> <Placeholder xs={6} />
                      </Placeholder>
                      <Placeholder.Button xs={4} />
                    </Card.Body>
                  </Card>
                </Col>
              ))
            : pageItems.length > 0
            ? pageItems.map((n) => (
                <Col md={6} lg={4} key={n.id}>
                  <Card className="h-100 shadow-sm" role="article" aria-labelledby={`title-${n.id}`}>
                    <div className="ratio ratio-16x9">
                      <Image
                        src={n.cover}
                        alt={n.title}
                        loading="lazy"
                        style={{ objectFit: "cover" }}
                        rounded={false}
                        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                      />
                    </div>
                    <Card.Body>
                      <Stack gap={2}>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          {n.pin && (
                            <Badge bg="warning" text="dark" aria-label="ปักหมุด">
                              ปักหมุด
                            </Badge>
                          )}
                          {n.category && <Badge bg="secondary">{n.category}</Badge>}
                          <span className="text-muted small ms-auto">
                            {formatDate(n.createdAtIso)}
                          </span>
                        </div>

                        <Card.Title id={`title-${n.id}`} className="mb-1">
                          {n.title}
                        </Card.Title>

                        <Card.Text
                          className="text-truncate"
                          style={{
                            WebkitLineClamp: 2,
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {n.summary || n.content}
                        </Card.Text>

                        <div className="d-flex gap-2 flex-wrap">
                          {n.tags?.map((t) => (
                            <Badge bg="light" text="dark" key={t}>
                              #{t}
                            </Badge>
                          ))}
                        </div>

                        <div className="d-flex gap-2 mt-1">
                          <Button size="sm" variant="primary" onClick={() => setSelected(n)}>
                            อ่านเพิ่มเติม
                          </Button>
                        </div>
                      </Stack>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            : (
              <Col xs={12} className="text-center py-5">
              
                <h5 className="mt-3">ไม่พบบทความที่ตรงกับคำค้น</h5>
                <p className="text-muted">ลองลบตัวกรอง หรือใช้คำที่สั้นลง</p>
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    setQueryText("");
                    setCategory("");
                    setSort("newest");
                  }}
                >
                  รีเซ็ตการค้นหา
                </Button>
              </Col>
            )}
        </Row>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination aria-label="เปลี่ยนหน้า">
              <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
              <Pagination.Prev onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} />
              {Array.from({ length: totalPages }).map((_, i) => (
                <Pagination.Item
                  key={i + 1}
                  active={page === i + 1}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
              <Pagination.Last onClick={() => setPage(totalPages)} disabled={page === totalPages} />
            </Pagination>
          </div>
        )}

        {/* Modal แสดงรายละเอียด */}
        <Modal size="lg" show={!!selected} onHide={() => setSelected(null)} aria-labelledby="modal-title" centered>
          <Modal.Header closeButton>
            <Modal.Title id="modal-title">{selected?.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selected && (
              <>
                <div className="mb-3 d-flex align-items-center gap-2 flex-wrap">
                  {selected.pin && <Badge bg="warning" text="dark">ปักหมุด</Badge>}
                  {selected.category && <Badge bg="secondary">{selected.category}</Badge>}
                  <span className="text-muted small ms-auto">{formatDate(selected.createdAtIso)}</span>
                </div>

                {/* แกลเลอรี */}
                <Row className="g-2 mb-3">
                  {[selected.cover, ...(selected.images ?? [])]
                    .filter(Boolean)
                    .map((src, idx) => (
                      <Col xs={12} md={idx === 0 ? 12 : 6} key={idx}>
                        <div className="ratio ratio-16x9">
                          <Image src={src} alt={`${selected.title} - ${idx + 1}`} style={{ objectFit: "cover" }} rounded />
                        </div>
                      </Col>
                    ))}
                </Row>

                <p style={{ whiteSpace: "pre-wrap" }}>{selected.content}</p>

                <div className="d-flex gap-2 flex-wrap">
                  {selected.tags?.map((t) => (
                    <Badge bg="light" text="dark" key={t}>#{t}</Badge>
                  ))}
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelected(null)}>ปิด</Button>
            <Button
              variant="primary"
              onClick={() => copyToClipboard(`${selected?.title} — ${selected?.content}`)}
            >
              คัดลอกข้อความ
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Offcanvas ข่าวปักหมุดล่าสุด */}
        <PinnedPreview data={items.filter((x) => x.pin)} />

        {/* Toast */}
        <ToastContainer position="bottom-end" className="p-3">
          <Toast
            onClose={() => setShowSubscribeToast(false)}
            show={showSubscribeToast}
            bg="light"
            autohide
            delay={2400}
          >
            <Toast.Header closeButton={false}>
              <span className="me-2">🔔</span>
              <strong className="me-auto">ติดตามข่าวสาร</strong>
              <small>ตอนนี้</small>
            </Toast.Header>
            <Toast.Body>เปิดการติดตามเรียบร้อย! คุณจะเห็นการแจ้งเตือนเมื่อมีข่าวใหม่</Toast.Body>
          </Toast>
        </ToastContainer>
      </Container>
      <Footer />
    </>
  );
}

function PinnedPreview({ data = [] }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (data.length > 0) {
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
  }, [data.length]);

  if (data.length === 0) return null;
  const last = data[0];

  return (
    <Offcanvas placement="start" show={show} onHide={() => setShow(false)}>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>ข่าวแนะนำ</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Card className="shadow-sm">
          <div className="ratio ratio-16x9">
            <Image src={last.cover} alt={last.title} style={{ objectFit: "cover" }} />
          </div>
          <Card.Body>
            <Stack gap={2}>
              <div className="d-flex align-items-center gap-2">
                <Badge bg="warning" text="dark">ปักหมุด</Badge>
                {last.category && <Badge bg="secondary">{last.category}</Badge>}
                <span className="text-muted small ms-auto">{formatDate(last.createdAtIso)}</span>
              </div>
              <Card.Title className="mb-1">{last.title}</Card.Title>
              <Card.Text className="text-muted">{last.summary || last.content}</Card.Text>
            </Stack>
          </Card.Body>
        </Card>
      </Offcanvas.Body>
    </Offcanvas>
  );
}

// ---------- Utils ----------
function normalizeAnnouncement(id, data) {
  // map ชื่อฟิลด์และกัน null
  const createdAt =
    data?.createdAt?.toDate?.() ??
    data?.updatedAt?.toDate?.() ??
    new Date(); // fallback

  return {
    id,
    title: data?.title ?? "-",
    summary: data?.summary ?? "",
    content: data?.content ?? "",
    category: data?.category ?? "",
    cover:
      data?.cover ??
      "https://upload.wikimedia.org/wikipedia/th/thumb/5/51/Logo_ku_th.svg/1200px-Logo_ku_th.svg.png",
    images: Array.isArray(data?.images) ? data.images : [],
    tags: Array.isArray(data?.tags) ? data.tags : [],
    pin: Boolean(data?.pinned ?? data?.pin ?? false),
    createdAtIso: createdAt.toISOString(),
    createdAtMs: createdAt.getTime(),
  };
}

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
  } catch (e) {
    return iso;
  }
}
