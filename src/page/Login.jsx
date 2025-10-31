// src/components/Login.jsx
import { useEffect, useState } from 'react';
import { Button, Card, Col, Container, Form, InputGroup, Row, Alert } from 'react-bootstrap';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../service/Firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import NavbarComponent from '../componnets/Navbar';

function mapFirebaseError(code) {
  const map = {
    'auth/invalid-email': 'อีเมลไม่ถูกต้อง',
    'auth/missing-password': 'กรุณากรอกรหัสผ่าน',
    'auth/user-not-found': 'ไม่พบบัญชีผู้ใช้',
    'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
    'auth/too-many-requests': 'พยายามหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง',
    'auth/popup-closed-by-user': 'ปิดหน้าต่างก่อนลงชื่อเข้าใช้',
  };
  return map[code] || 'เกิดข้อผิดพลาด ไม่สามารถลงชื่อเข้าใช้ได้';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const from = location.state?.from?.pathname;

  useEffect(() => {
    if (user && from) {
      navigate(from, { replace: true });
    }
  }, [user, from, navigate]);

  async function handleEmailLogin(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const q = query(
        collection(db, 'admin'),
        where('email', '==', email.trim()),
        where('pass', '==', password)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        return;
      }

      const docData = snapshot.docs[0].data();
      const role = docData.role || 'admin';

      const adminPayload = {
        email: email.trim(),
        role,
        displayName: docData.displayName || docData.name || '',
        provider: 'password',
        loggedInAt: new Date().toISOString(),
      };
      sessionStorage.setItem('adminUser', JSON.stringify(adminPayload));

      if (role === 'admin') {
        navigate('/lots', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาด ไม่สามารถเข้าสู่ระบบได้');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setSubmitting(true);
    setError('');
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const u = cred.user;

      let role = 'user';
      try {
        const q = query(collection(db, 'admin'), where('email', '==', u.email || ''));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const adminDoc = snap.docs[0].data();
          role = adminDoc.role || 'admin';
        }
      } catch {
        // ignore
      }

      const payload = {
        email: u.email || '',
        role,
        displayName: u.displayName || '',
        provider: 'google',
        loggedInAt: new Date().toISOString(),
      };
      sessionStorage.setItem('adminUser', JSON.stringify(payload));

      navigate(role === 'admin' ? '/lots' : '/home', { replace: true });
    } catch (err) {
      setError(mapFirebaseError(err.code));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <NavbarComponent />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-3">
                  <h3 className="fw-bold mb-1">เข้าสู่ระบบ</h3>
                  <div className="text-muted">ระบบเช่าพื้นที่ตลาด</div>
                </div>

                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

                {/* ✅ คำอธิบายสำหรับผู้ดูแล */}
                <div className="text-center mb-2">
                  <small className=" fw-semibold">
                    สำหรับผู้ดูแลระบบ
                  </small>
                </div>

                <Form onSubmit={handleEmailLogin}>
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>อีเมล</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>รหัสผ่าน</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowPassword((v) => !v)}
                        type="button"
                      >
                        {showPassword ? 'ซ่อน' : 'แสดง'}
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <div className="d-grid gap-2 mt-3">
                    <Button type="submit" disabled={submitting} className="rounded-3" size="lg">
                      {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </Button>
                  </div>
                </Form>

                {/* ✅ คำอธิบายสำหรับผู้เช่า */}
                <div className="text-center mt-4 mb-2">
                  <small className=" fw-semibold">
                    สำหรับผู้เช่า
                  </small>
                </div>

                <div className="d-grid gap-2">
                  <Button
                    variant="outline-dark"
                    onClick={handleGoogleLogin}
                    disabled={submitting}
                    className="rounded-3"
                    type="button"
                  >
                    ลงชื่อเข้าใช้ด้วย Google
                  </Button>
                </div>

                <div className="text-center mt-3">
                  <small className="text-muted">
                    ลืมรหัสผ่าน? <Link to="#">ติดต่อผู้ดูแลระบบ</Link>
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
