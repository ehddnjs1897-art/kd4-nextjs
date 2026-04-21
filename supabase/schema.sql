-- ============================================
-- KD4 액팅 스튜디오 Supabase 스키마
-- Supabase SQL Editor에서 전체 실행
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES (auth.users 확장)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'actor', 'crew_pending', 'crew', 'editor', 'director', 'admin')),
  actor_id UUID,  -- actors 테이블 참조 (순환 참조 방지위해 FK 나중에 추가)
  matched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 신규 가입 시 profile 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 2. ACTORS (배우 DB)
-- ============================================
CREATE TABLE IF NOT EXISTS actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  gender TEXT CHECK (gender IN ('남', '여')),
  age_group TEXT CHECK (age_group IN ('20대', '30대', '40대', '50대 이상')),
  height INT,
  weight INT,
  skills TEXT[],                  -- 특기 배열 (예: ARRAY['댄스', '무술'])

  phone TEXT,
  email TEXT,
  instagram TEXT,
  profile_photo TEXT,           -- 메인 9:16 사진 URL
  drive_photo_id TEXT,          -- 드라이브 초기 임포트용 파일 ID
  drive_photo_position TEXT DEFAULT 'center top',
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'drive_import')),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- actors FK to profiles
ALTER TABLE profiles ADD CONSTRAINT profiles_actor_id_fk
  FOREIGN KEY (actor_id) REFERENCES actors(id) ON DELETE SET NULL;

-- actors RLS
ALTER TABLE actors ENABLE ROW LEVEL SECURITY;

-- 공개 배우 조회 (비로그인 포함)
CREATE POLICY "actors_public_read" ON actors
  FOR SELECT USING (is_public = TRUE);

-- 관리자 전체 접근
CREATE POLICY "actors_admin_all" ON actors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 본인(editor) 수정
CREATE POLICY "actors_editor_update" ON actors
  FOR UPDATE USING (
    id IN (
      SELECT actor_id FROM profiles
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER actors_updated_at
  BEFORE UPDATE ON actors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 3. ACTOR_PHOTOS
-- ============================================
CREATE TABLE IF NOT EXISTS actor_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES actors(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  drive_file_id TEXT,
  drive_photo_id TEXT,           -- 드라이브 파일 ID (썸네일 URL 생성용)
  caption TEXT,
  sort_order INT DEFAULT 0,
  is_profile BOOLEAN DEFAULT FALSE
);

ALTER TABLE actor_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "actor_photos_public_read" ON actor_photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM actors WHERE id = actor_id AND is_public = TRUE)
  );

CREATE POLICY "actor_photos_editor_write" ON actor_photos
  FOR ALL USING (
    actor_id IN (
      SELECT actor_id FROM profiles
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 4. ACTOR_VIDEOS
-- ============================================
CREATE TABLE IF NOT EXISTS actor_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES actors(id) ON DELETE CASCADE,
  title TEXT,
  youtube_id TEXT,
  sort_order INT DEFAULT 0
);

ALTER TABLE actor_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "actor_videos_public_read" ON actor_videos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM actors WHERE id = actor_id AND is_public = TRUE)
  );

CREATE POLICY "actor_videos_editor_write" ON actor_videos
  FOR ALL USING (
    actor_id IN (
      SELECT actor_id FROM profiles
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 5. ACTOR_FILMOGRAPHY
-- ============================================
CREATE TABLE IF NOT EXISTS actor_filmography (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES actors(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('drama', 'film', 'cf', 'musical', 'theater', 'etc')),
  year INT,
  title TEXT,
  role TEXT,
  production TEXT,               -- 제작사 / 방송사
  sort_order INT DEFAULT 0
);

ALTER TABLE actor_filmography ENABLE ROW LEVEL SECURITY;

CREATE POLICY "filmography_public_read" ON actor_filmography
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM actors WHERE id = actor_id AND is_public = TRUE)
  );

CREATE POLICY "filmography_editor_write" ON actor_filmography
  FOR ALL USING (
    actor_id IN (
      SELECT actor_id FROM profiles
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 6. POSTS (게시판)
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT '일반' CHECK (category IN ('일반', '공지', '질문', '자유', '수업')),
  author_id UUID REFERENCES profiles(id),
  author_name TEXT,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_public_read" ON posts FOR SELECT USING (TRUE);
CREATE POLICY "posts_auth_write" ON posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "posts_own_update" ON posts
  FOR UPDATE USING (author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "posts_own_delete" ON posts
  FOR DELETE USING (author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 7. COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  author_name TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_public_read" ON comments FOR SELECT USING (TRUE);
CREATE POLICY "comments_auth_write" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "comments_own_delete" ON comments
  FOR DELETE USING (author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- 8. APPLICATIONS (수강신청)
-- ============================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT,
  email TEXT,
  class_name TEXT,
  experience TEXT,
  motivation TEXT,
  status TEXT DEFAULT '대기' CHECK (status IN ('대기', '확인', '완료', '취소')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- 수강신청은 누구나 INSERT, 관리자만 SELECT
CREATE POLICY "applications_insert_all" ON applications
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "applications_admin_read" ON applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "applications_admin_update" ON applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 9. Supabase Storage 버킷 생성
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('actor-photos', 'actor-photos', TRUE, 5242880,  -- 5MB
   ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('actor-videos', 'actor-videos', TRUE, 104857600, -- 100MB
   ARRAY['video/mp4', 'video/webm'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "actor_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'actor-photos');

CREATE POLICY "actor_photos_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'actor-photos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "actor_photos_own_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'actor-photos'
    AND auth.uid() IS NOT NULL
  );

-- ============================================
-- 10. GAME_SCORES (OFF THE PLASTIC 게임)
-- ============================================
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 0),
  duration_ms INT NOT NULL CHECK (duration_ms > 0),
  stage INT DEFAULT 1,
  items_collected INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_game_scores_score ON game_scores(score DESC);
CREATE INDEX idx_game_scores_weekly ON game_scores(created_at, score DESC);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_scores_public_read" ON game_scores
  FOR SELECT USING (TRUE);

CREATE POLICY "game_scores_auth_insert" ON game_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 11. GAME_PRIZES (게임 상품)
-- ============================================
CREATE TABLE IF NOT EXISTS game_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_type TEXT CHECK (period_type IN ('weekly', 'monthly')),
  rank INT NOT NULL,
  prize_type TEXT NOT NULL,
  prize_description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE game_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_prizes_public_read" ON game_prizes
  FOR SELECT USING (TRUE);

CREATE POLICY "game_prizes_admin_write" ON game_prizes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 12. 조회수 atomic increment 함수
-- ============================================
CREATE OR REPLACE FUNCTION increment_views(post_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET views = views + 1 WHERE id = post_id;
END;
$$;

-- ============================================
-- HELPER: auth.user_role() — RLS 성능 최적화
-- ============================================
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- ============================================
-- 13. CLASSES (클래스 마스터)
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  step TEXT NOT NULL,
  category TEXT CHECK (category IN ('step1', 'step2', 'step3', 'extra')),
  name_ko TEXT NOT NULL,
  name_en TEXT,
  quote TEXT,
  subtitle TEXT,
  note TEXT,
  bullets TEXT[] DEFAULT ARRAY[]::TEXT[],
  schedule_label TEXT,
  duration_label TEXT,
  capacity_label TEXT,
  capacity INT,
  course_label TEXT,
  price BIGINT NOT NULL CHECK (price >= 0),
  original_price BIGINT CHECK (original_price >= 0),
  promo_label TEXT,
  remaining_seats INT CHECK (remaining_seats >= 0),
  is_highlight BOOLEAN DEFAULT FALSE,
  is_new_member_open BOOLEAN DEFAULT FALSE,
  is_hobby BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  instructor_label TEXT,
  settlement_rate NUMERIC(5,2) DEFAULT 50.00 CHECK (settlement_rate BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_classes_active_sort ON classes(is_active, sort_order);
CREATE INDEX idx_classes_instructor ON classes(instructor_id);
CREATE INDEX idx_classes_category ON classes(category);

CREATE TRIGGER classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes_public_read" ON classes FOR SELECT USING (is_active = TRUE);
CREATE POLICY "classes_admin_all" ON classes FOR ALL USING (auth.user_role() = 'admin');
CREATE POLICY "classes_instructor_read" ON classes FOR SELECT USING (
  instructor_id = auth.uid() AND auth.user_role() IN ('director', 'admin')
);

-- ============================================
-- 14. CLASS_SCHEDULES (수업 일정)
-- ============================================
CREATE TABLE IF NOT EXISTS class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_no INT,
  title TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  CHECK (ends_at > starts_at),
  recurrence_rule TEXT,
  recurrence_parent_id UUID REFERENCES class_schedules(id) ON DELETE SET NULL,
  location TEXT DEFAULT 'KD4 스튜디오',
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schedules_class ON class_schedules(class_id, starts_at);
CREATE INDEX idx_schedules_starts_at ON class_schedules(starts_at);
CREATE INDEX idx_schedules_instructor ON class_schedules(instructor_id, starts_at);

CREATE TRIGGER class_schedules_updated_at
  BEFORE UPDATE ON class_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules_admin_all" ON class_schedules FOR ALL USING (auth.user_role() = 'admin');
CREATE POLICY "schedules_instructor_rw" ON class_schedules FOR ALL USING (
  (instructor_id = auth.uid() OR EXISTS (
    SELECT 1 FROM classes c WHERE c.id = class_id AND c.instructor_id = auth.uid()
  )) AND auth.user_role() IN ('director', 'admin')
);
CREATE POLICY "schedules_enrollee_read" ON class_schedules FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.class_id = class_schedules.class_id
      AND e.user_id = auth.uid()
      AND e.status IN ('active', 'completed')
  )
);

-- ============================================
-- 15. ENROLLMENTS (수강 등록 — 동료 배우)
-- ============================================
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  enrollee_name TEXT NOT NULL,
  enrollee_phone TEXT,
  enrollee_email TEXT,
  started_on DATE NOT NULL,
  ends_on DATE,
  price_at_enroll BIGINT NOT NULL CHECK (price_at_enroll >= 0),
  discount_amount BIGINT DEFAULT 0 CHECK (discount_amount >= 0),
  CHECK (discount_amount <= price_at_enroll),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'refunded')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX enrollments_unique_user ON enrollments(class_id, user_id, started_on) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX enrollments_unique_guest ON enrollments(class_id, enrollee_phone, started_on) WHERE user_id IS NULL AND enrollee_phone IS NOT NULL;
CREATE UNIQUE INDEX enrollments_unique_application ON enrollments(application_id) WHERE application_id IS NOT NULL;

CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

CREATE TRIGGER enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments_own_read" ON enrollments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "enrollments_admin_all" ON enrollments FOR ALL USING (auth.user_role() = 'admin');
CREATE POLICY "enrollments_instructor_read" ON enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM classes c WHERE c.id = class_id AND c.instructor_id = auth.uid())
  AND auth.user_role() IN ('director', 'admin')
);

-- ============================================
-- 16. ATTENDANCE (출석)
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent', 'excused', 'makeup')),
  makeup_for_schedule_id UUID REFERENCES class_schedules(id) ON DELETE SET NULL,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  checked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT,
  UNIQUE (schedule_id, enrollment_id)
);

CREATE INDEX idx_attendance_schedule ON attendance(schedule_id);
CREATE INDEX idx_attendance_enrollment ON attendance(enrollment_id);
CREATE INDEX idx_attendance_user ON attendance(user_id, checked_at DESC);
CREATE INDEX idx_attendance_class_status ON attendance(class_id, status);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_own_read" ON attendance FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "attendance_admin_all" ON attendance FOR ALL USING (auth.user_role() = 'admin');
CREATE POLICY "attendance_instructor_all" ON attendance FOR ALL USING (
  EXISTS (
    SELECT 1 FROM class_schedules cs
    WHERE cs.id = schedule_id
      AND (cs.instructor_id = auth.uid() OR EXISTS (
        SELECT 1 FROM classes c WHERE c.id = cs.class_id AND c.instructor_id = auth.uid()
      ))
  ) AND auth.user_role() IN ('director', 'admin')
);

-- ============================================
-- 17. SETTLEMENTS (강사 정산)
-- ============================================
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  CHECK (period_end >= period_start),
  gross_revenue BIGINT NOT NULL DEFAULT 0 CHECK (gross_revenue >= 0),
  settlement_rate NUMERIC(5,2) NOT NULL CHECK (settlement_rate BETWEEN 0 AND 100),
  adjustments BIGINT DEFAULT 0,
  payout_amount BIGINT NOT NULL CHECK (payout_amount >= 0),
  session_count INT DEFAULT 0,
  attendance_count INT DEFAULT 0,
  calculation_snapshot JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid', 'disputed')),
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX settlements_unique_class ON settlements(instructor_id, class_id, period_start, period_end) WHERE class_id IS NOT NULL;
CREATE UNIQUE INDEX settlements_unique_all ON settlements(instructor_id, period_start, period_end) WHERE class_id IS NULL;
CREATE INDEX idx_settlements_instructor_period ON settlements(instructor_id, period_start DESC);
CREATE INDEX idx_settlements_status ON settlements(status);

CREATE TRIGGER settlements_updated_at
  BEFORE UPDATE ON settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settlements_admin_all" ON settlements FOR ALL USING (auth.user_role() = 'admin');
CREATE POLICY "settlements_instructor_read" ON settlements FOR SELECT USING (
  instructor_id = auth.uid() AND auth.user_role() IN ('director', 'admin')
);

-- ============================================
-- 18. PAYMENTS (결제 내역)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  amount BIGINT NOT NULL CHECK (amount <> 0),
  method TEXT CHECK (method IN ('card', 'transfer', 'kakaopay', 'tosspay', 'naverpay', 'cash', 'other')),
  provider TEXT,
  provider_tx_id TEXT,
  receipt_url TEXT,
  type TEXT NOT NULL DEFAULT 'payment' CHECK (type IN ('payment', 'installment', 'refund', 'partial_refund')),
  CHECK (
    (type IN ('payment', 'installment') AND amount > 0) OR
    (type IN ('refund', 'partial_refund') AND amount < 0)
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,
  settlement_id UUID REFERENCES settlements(id) ON DELETE SET NULL,
  payer_name TEXT,
  payer_phone TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX payments_provider_tx ON payments(provider, provider_tx_id) WHERE provider_tx_id IS NOT NULL;
CREATE INDEX idx_payments_enrollment ON payments(enrollment_id);
CREATE INDEX idx_payments_user ON payments(user_id, paid_at DESC);
CREATE INDEX idx_payments_class ON payments(class_id, paid_at);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_settlement ON payments(settlement_id);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_own_read" ON payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "payments_admin_all" ON payments FOR ALL USING (auth.user_role() = 'admin');
CREATE POLICY "payments_instructor_read" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM classes c WHERE c.id = class_id AND c.instructor_id = auth.uid())
  AND auth.user_role() IN ('director', 'admin')
);

-- ============================================
-- 19. 정산 자동 계산 함수
-- ============================================
CREATE OR REPLACE FUNCTION compute_settlement(
  p_instructor_id UUID,
  p_class_id UUID,
  p_period_start DATE,
  p_period_end DATE
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_gross BIGINT;
  v_rate NUMERIC(5,2);
  v_sessions INT;
  v_attendance INT;
  v_payout BIGINT;
  v_id UUID;
  v_snapshot JSONB;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_gross
  FROM payments
  WHERE class_id = p_class_id AND status = 'completed'
    AND paid_at::DATE BETWEEN p_period_start AND p_period_end
    AND type IN ('payment', 'installment');

  SELECT settlement_rate INTO v_rate FROM classes WHERE id = p_class_id;

  SELECT COUNT(*) INTO v_sessions
  FROM class_schedules
  WHERE class_id = p_class_id AND status = 'completed'
    AND starts_at::DATE BETWEEN p_period_start AND p_period_end;

  SELECT COUNT(*) INTO v_attendance
  FROM attendance a
  JOIN class_schedules cs ON cs.id = a.schedule_id
  WHERE cs.class_id = p_class_id
    AND a.status IN ('present', 'late', 'makeup')
    AND cs.starts_at::DATE BETWEEN p_period_start AND p_period_end;

  v_payout := FLOOR(v_gross * v_rate / 100);
  v_snapshot := jsonb_build_object(
    'gross_revenue', v_gross,
    'rate', v_rate,
    'sessions', v_sessions,
    'attendance', v_attendance,
    'calculated_at', NOW()
  );

  INSERT INTO settlements (
    instructor_id, class_id, period_start, period_end,
    gross_revenue, settlement_rate, payout_amount,
    session_count, attendance_count, status, calculation_snapshot
  ) VALUES (
    p_instructor_id, p_class_id, p_period_start, p_period_end,
    v_gross, v_rate, v_payout, v_sessions, v_attendance, 'draft', v_snapshot
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ============================================
-- 20. SEED: lib/classes.ts → classes 테이블
-- ============================================
INSERT INTO classes (
  slug, step, category, name_ko, name_en, quote, subtitle, note, bullets,
  schedule_label, duration_label, capacity_label, capacity, course_label,
  price, original_price, promo_label, remaining_seats,
  is_highlight, is_new_member_open, is_hobby, sort_order, instructor_label
) VALUES
(
  'basic-class', 'STEP 1', 'step1', '베이직 클래스', 'Basic Class',
  '막혀있던 감정의 둑을 터뜨리는 수업', '감정 해방 / 연기 입문',
  '연기 경험 없어도 OK · 취미 참여 환영',
  ARRAY['감정 해방 훈련 / 충동·본능 회복', '마이즈너 테크닉 기초 / 이바나 처벅 테크닉 입문', '독백 / 장면연기', '소수정예'],
  '월 4회', '3시간', '6명', 6, NULL,
  250000, NULL, NULL, NULL, FALSE, TRUE, TRUE, 10, '박우진 리더'
),
(
  'meisner-class', 'STEP 1', 'step1', '마이즈너 테크닉 정규 클래스', 'Meisner Technique Class',
  '진짜 배우로 다시 태어나는 시간', '마이즈너 테크닉 / 장면연기', NULL,
  ARRAY['Repetition · Activity&door 7단계 실습', '메모라이징 / 마이즈너식 텍스트 분석', '감정 해방 / 충동·본능 회복 / 연기하지 않는 연기'],
  '월 4회', '4시간', '8명', 8, '4개월 코스',
  250000, 350000, '🌸 봄맞이 스페셜 · 첫 달 10만원 할인', 3, TRUE, TRUE, FALSE, 20, '권동원 대표'
),
(
  'intensive-class', 'STEP 1', 'step1', '출연영상 클래스', 'Intensive Class',
  '실제 영화 현장의 퀄리티로 당신의 포트폴리오를 만듭니다.', '마이즈너 테크닉 / 포트폴리오 제작', NULL,
  ARRAY['마이즈너 / 이바나 처벅 테크닉', '맞춤형 시나리오 / 전문 영화팀 제작', '현직 배우 100여명 참여한 시그니처 클래스', '완성된 출연영상으로 캐스팅 연계'],
  '월 4회', '4시간', '6명', 6, '3개월 코스',
  300000, 400000, '🌸 봄맞이 스페셜 · 첫 달 10만원 할인', 2, TRUE, TRUE, FALSE, 30, NULL
),
(
  'advanced-class', 'STEP 2', 'step2', '출연영상 심화 클래스', 'Advanced Class',
  '수료자만 선택할 수 있는 두 가지 트랙', NULL, NULL,
  ARRAY['고급 장면 연기', '이바나 처벅 테크닉 심화', '맞춤형 시나리오 / 전문 영화팀 제작', '캐스팅 연계'],
  '월 4회', '4시간', '6명', 6, '2개월',
  450000, NULL, NULL, NULL, FALSE, FALSE, FALSE, 40, NULL
),
(
  '1month-film-class', 'STEP 2', 'step2', '출연영상 1달 완성 클래스', '1 Month Film Class',
  '수업 없이 영상만 — 1개월 완성', '1month · 영상만 제작', NULL,
  ARRAY['수업 없이 영상만 제작', '레퍼런스 취합', '시나리오 전달', '현장 촬영'],
  '상시', '영상 제작 전용', '소수정예', NULL, NULL,
  400000, NULL, NULL, NULL, FALSE, FALSE, FALSE, 50, NULL
),
(
  'leader-class', 'STEP 3', 'step3', '액터스 리더 클래스', 'Actor''s Leader Class',
  'KD4가 엄선한 정예 멤버 10명, 캐스팅 전폭 지원', NULL, NULL,
  ARRAY['선별된 인원 참여 / 장면연기 Competition', '캐스팅 디렉터·조감독 비공식 오디션', '지속적 성장 지원'],
  '월 4회', '3시간', '10명', 10, '5개월 시즌제',
  200000, NULL, NULL, NULL, FALSE, FALSE, FALSE, 60, NULL
),
(
  'audition-class', 'STEP 3', 'step3', '오디션 클래스', 'Audition Class',
  '캐스팅 디렉터의 시선을 멈추게 할 독백 만들기', NULL, NULL,
  ARRAY['오디션 독백 만들기 / 오디션 테크닉', '캐스팅 연계', '독백 영상 촬영 제공'],
  '월 4회', '3시간', '6명', 6, NULL,
  250000, NULL, NULL, NULL, FALSE, FALSE, FALSE, 70, '주세빈 강사'
),
(
  'movement-class', '별도', 'extra', '움직임 클래스', 'Movement Class',
  '몸과 마음의 연동', NULL, NULL,
  ARRAY['바디컨디셔닝 / 이완된 몸', '감정 해방 / 마음과 몸의 연동'],
  '월 3회', '3시간', '8명', 8, NULL,
  150000, NULL, NULL, NULL, FALSE, FALSE, FALSE, 80, '고서현 리더'
),
(
  'personal-class', '별도', 'extra', '개인 레슨', 'Personal Class',
  '나만을 위한 집중 훈련', NULL, NULL,
  ARRAY['오디션 준비 / 감정의 해방', '집중 연기 훈련 / 완전한 1:1 맞춤 지도'],
  '월 4회', '2시간 (1:1)', '1:1', 1, NULL,
  400000, NULL, NULL, NULL, FALSE, FALSE, FALSE, 90, NULL
)
ON CONFLICT (slug) DO NOTHING;
