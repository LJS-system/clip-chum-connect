-- 조교(assistant) 역할 추가: 같은 기수 수강반·학습현황 조회만 가능 (권한 확인은 서버 코드에서)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'assistant';
--> statement-breakpoint
-- 영상별 학생 숨기기: 쓰기는 관리자 또는 (강사·교육원 관리자 역할 + 접근 가능한 수강반)만.
-- instructor_can_access_class는 '같은 기수'도 통과시키므로, 역할 확인이 없으면 조교도 쓸 수 있게 된다.
DROP POLICY IF EXISTS "관리자/강사 추가" ON public.video_student_exclusions;
--> statement-breakpoint
CREATE POLICY "관리자/강사 추가"
  ON public.video_student_exclusions FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'branch_admin'))
      AND EXISTS (
        SELECT 1 FROM public.videos v
        WHERE v.id = video_id
          AND public.instructor_can_access_class(auth.uid(), v.class_id)
      )
    )
  );
--> statement-breakpoint
DROP POLICY IF EXISTS "관리자/강사 수정" ON public.video_student_exclusions;
--> statement-breakpoint
CREATE POLICY "관리자/강사 수정"
  ON public.video_student_exclusions FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'branch_admin'))
      AND EXISTS (
        SELECT 1 FROM public.videos v
        WHERE v.id = video_id
          AND public.instructor_can_access_class(auth.uid(), v.class_id)
      )
    )
  );