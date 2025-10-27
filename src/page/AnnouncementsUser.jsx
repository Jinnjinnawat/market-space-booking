import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Form,
  Image,
  InputGroup,
  Modal,
  Offcanvas,
  Pagination,
  Placeholder,
  Row,
  Stack,
  Toast,
  ToastContainer,
} from "react-bootstrap";

import NavbarComponent from "../componnets/Navbar";
import Footer from "../componnets/Footer";
export default function AnnouncementsPage() {
  // ----------- ตัวอย่างข้อมูลข่าวสาร (mock) -----------
  const seed = [
    {
      id: "n1",
      title: "ประกาศปิดซ่อมบำรุงพื้นที่โซน A ชั่วคราว",
      category: "ระบบ/สถานที่",
      cover:
        "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1200&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop",
      ],
      tags: ["ซ่อมบำรุง", "โครงสร้างพื้นฐาน"],
      content:
        "เพื่อความปลอดภัยของผู้ใช้งาน โซน A จะปิดปรับปรุงระหว่างวันที่ 20–25 ต.ค. 2568 ขออภัยในความไม่สะดวก",
      createdAt: "2025-10-18T09:00:00+07:00",
      pin: true,
    },
    {
      id: "n2",
      title: "เปิดจองพื้นที่งานเทศกาลอาหารประจำปี",
      category: "กิจกรรม",
      cover:
        "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1200&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop",
      ],
      tags: ["เปิดจอง", "เทศกาล", "อาหาร"],
      content:
        "ขอเชิญผู้สนใจร่วมออกบูธงานเทศกาลอาหาร ประจำปี สมัครได้ตั้งแต่วันนี้ถึง 10 พ.ย. 2568 จำนวนจำกัด!",
      createdAt: "2025-10-15T15:30:00+07:00",
    },
    {
      id: "n3",
      title: "ประกาศอัปเดตระบบชำระเงิน รองรับ QR PromptPay",
      category: "ระบบ/สถานที่",
      cover:
        "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=1200&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop",
      ],
      tags: ["อัปเดตระบบ", "การชำระเงิน", "PromptPay"],
      content:
        "เพื่อเพิ่มความสะดวกในการชำระเงิน ระบบได้รองรับการจ่ายผ่าน QR PromptPay แล้วตั้งแต่วันนี้",
      createdAt: "2025-10-10T10:00:00+07:00",
    },
    {
      id: "n4",
      title: "แนวทางความปลอดภัยร้านค้าและผู้เช่า (อัปเดต)",
      category: "ประกาศสำคัญ",
      cover:
        "https://images.unsplash.com/photo-1584634731339-252c581abfc5?q=80&w=1200&auto=format&fit=crop",
      images: [
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop",
      ],
      tags: ["ความปลอดภัย", "แนวทางปฏิบัติ"],
      content:
        "โปรดปฏิบัติตามแนวทางความปลอดภัย เช่น การตรวจเช็คอุปกรณ์ไฟฟ้า ปิดแก๊สทุกครั้ง และเว้นช่องทางเดินฉุกเฉิน",
      createdAt: "2025-09-30T08:00:00+07:00",
    },
  ];

  // ----------- state -----------
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null); // ข่าวที่เปิดอ่าน
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(6);
  const [showSubscribeToast, setShowSubscribeToast] = useState(false);

  // จำลองโหลดข้อมูล
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const categories = useMemo(
    () => ["ทั้งหมด", "ประกาศสำคัญ", "กิจกรรม", "ระบบ/สถานที่"],
    []
  );

  const filtered = useMemo(() => {
    let data = [...seed];

    // sort pin ขึ้นก่อน
    data.sort((a, b) => Number(b.pin ?? false) - Number(a.pin ?? false));

    // filter คีย์เวิร์ด
    const q = query.trim().toLowerCase();
    if (q) {
      data = data.filter(
        (x) =>
          x.title.toLowerCase().includes(q) ||
          x.content.toLowerCase().includes(q) ||
          x.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // filter หมวด
    if (category && category !== "ทั้งหมด") {
      data = data.filter((x) => x.category === category);
    }

    // sort ตามวันที่
    if (sort === "newest") {
      data.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sort === "oldest") {
      data.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    return data;
  }, [seed, query, category, sort]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  useEffect(() => {
    // รีเซ็ตหน้าเมื่อ filter เปลี่ยน
    setPage(1);
  }, [query, category, sort]);

  return (
    <>
    <NavbarComponent></NavbarComponent>
    <Container className="py-4">
      {/* Header */}
      <Stack direction="horizontal" className="mb-3" gap={3}>
        <div>
          <h2 className="mb-0">แจ้งข่าวสาร</h2>
          <div className="text-muted">อัปเดตล่าสุดสำหรับผู้ใช้งานตลาดนัด</div>
        </div>
        <div className="ms-auto">
          
        </div>
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
                        <Badge bg="secondary">{n.category}</Badge>
                        <span className="text-muted small ms-auto">
                          {formatDate(n.createdAt)}
                        </span>
                      </div>

                      <Card.Title id={`title-${n.id}`} className="mb-1">
                        {n.title}
                      </Card.Title>

                      <Card.Text className="text-truncate" style={{ WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {n.content}
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
              <Image
                src="https://images.unsplash.com/photo-1520975661595-6453be3f7070?q=80&w=1200&auto=format&fit=crop"
                alt="No results"
                style={{ maxWidth: 420 }}
                rounded
              />
              <h5 className="mt-3">ไม่พบบทความที่ตรงกับคำค้น</h5>
              <p className="text-muted">ลองลบตัวกรอง หรือใช้คำที่สั้นลง</p>
              <Button variant="outline-primary" onClick={() => { setQuery(""); setCategory(""); setSort("newest"); }}>
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

      {/* Modal แสดงรายละเอียดข่าว */}
      <Modal
        size="lg"
        show={!!selected}
        onHide={() => setSelected(null)}
        aria-labelledby="modal-title"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="modal-title">{selected?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <>
              <div className="mb-3 d-flex align-items-center gap-2 flex-wrap">
                {selected.pin && <Badge bg="warning" text="dark">ปักหมุด</Badge>}
                <Badge bg="secondary">{selected.category}</Badge>
                <span className="text-muted small ms-auto">{formatDate(selected.createdAt)}</span>
              </div>

              {/* แกลเลอรีรูป */}
              <Row className="g-2 mb-3">
                {[selected.cover, ...(selected.images ?? [])].filter(Boolean).map((src, idx) => (
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
          <Button variant="secondary" onClick={() => setSelected(null)}>
            ปิด
          </Button>
          <Button
            variant="primary"
            onClick={() => copyToClipboard(`${selected?.title} — ${selected?.content}`)}
          >
            คัดลอกข้อความ
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Offcanvas ตัวอย่างข่าวปักหมุดล่าสุด (แนะนำ) */}
      <PinnedPreview data={seed.filter((x) => x.pin)} />

      {/* Toast ติดตามข่าวสาร */}
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
          <Toast.Body>
            เปิดการติดตามเรียบร้อย! คุณจะเห็นการแจ้งเตือนเมื่อมีข่าวใหม่
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
    <Footer></Footer>
    </>
  );
}

function PinnedPreview({ data = [] }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (data.length > 0) {
      // เปิดแนะนำหลังโหลดหน้า 1.2s
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
                <Badge bg="secondary">{last.category}</Badge>
                <span className="text-muted small ms-auto">{formatDate(last.createdAt)}</span>
              </div>
              <Card.Title className="mb-1">{last.title}</Card.Title>
              <Card.Text className="text-muted">{last.content}</Card.Text>
            </Stack>
          </Card.Body>
        </Card>
      </Offcanvas.Body>
    </Offcanvas>
  );
}

// ----------- Utils -----------
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
    return d.toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch (e) {
    return iso;
  }
}
