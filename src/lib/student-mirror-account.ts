// 마스터(studymate) 학생을 이러닝 로그인 계정에 연결할 때 쓰는 규칙.
// 학생 로그인은 "이름 + 전화번호"로 하고, 계정 이메일은 내부 식별용이라 겹치지만 않으면 된다.

export type EmailOwnerRow = { name: string | null; is_deleted: boolean | null };

/**
 * 만들려는 계정 이메일을 이미 다른 계정이 쓰고 있을 때 어떻게 할지 정한다.
 * - link: 같은 학생이 studymate에서 지워졌다 다시 등록된 경우 → 예전 계정을 이어받는다(학습 기록 유지).
 * - separate: 형제 등 다른 학생의 계정 → 이메일을 바꿔 새 계정을 만든다.
 * - skip: 같은 이름의 학생이 아직 살아 있음(studymate 중복 등록) → 그 학생이 이미 로그인할 수 있으니 두지 않는다.
 */
export function decideEmailConflict(
  studentName: string,
  ownerRows: EmailOwnerRow[],
): "link" | "separate" | "skip" {
  const me = normName(studentName);
  if (ownerRows.length === 0) return "separate";
  const active = ownerRows.filter((r) => r.is_deleted !== true);
  if (active.some((r) => normName(r.name) === me)) return "skip";
  if (active.length > 0) return "separate";
  return ownerRows.every((r) => normName(r.name) === me) ? "link" : "separate";
}

/** 형제 등으로 기본 이메일이 겹칠 때 쓰는 두 번째 이메일. 같은 학생은 항상 같은 값이 나온다. */
export function alternateMirrorEmail(externalId: string, loginPhone: string | null): string {
  const suffix = externalId.replace(/-/g, "").slice(0, 8);
  const local = loginPhone ?? externalId.replace(/-/g, "").slice(0, 12);
  return `student-${local}-${suffix}@mirror.local`;
}

function normName(v: string | null): string {
  return (v ?? "").replace(/\s+/g, "").trim();
}
