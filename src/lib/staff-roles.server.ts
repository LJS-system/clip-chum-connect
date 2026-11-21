// 조교(assistant) 역할 판정 도우미
// 조교: 같은 기수 수강반·학습현황 "조회만" 가능. 업로드·생성·수정·배정·문자 전송은 불가.

type Ctx = { supabase: any; userId: string };

export async function loadMyRoles(context: Ctx): Promise<Set<string>> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  return new Set(((data ?? []) as any[]).map((r: any) => r.role as string));
}

/** 조교 역할만 가진 계정인지 (관리자·교육원 관리자·강사 역할이 함께 있으면 false) */
export function isAssistantOnlyRoles(roles: Set<string>) {
  return (
    roles.has("assistant") &&
    !roles.has("admin") &&
    !roles.has("branch_admin") &&
    !roles.has("instructor")
  );
}

export async function isAssistantOnly(context: Ctx) {
  return isAssistantOnlyRoles(await loadMyRoles(context));
}

/** 쓰기 작업 앞에 둔다: 조교 계정이면 막는다. */
export async function assertNotAssistant(context: Ctx) {
  if (await isAssistantOnly(context)) {
    throw new Error("조교 계정은 조회만 할 수 있습니다.");
  }
}

/** 조교 역할만 가진 사용자 id 목록 (강사 검색·명부에서 빼기 위해) */
export async function assistantOnlyUserIds(supabaseAdmin: any) {
  // 조교 수는 적으므로 조교 역할부터 찾고, 그 사람들의 다른 역할을 확인한다 (주소 길이 초과 방지)
  const { data: rows, error: aErr } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "assistant")
    .is("deleted_at", null);
  if (aErr) throw new Error(aErr.message);
  const ids = Array.from(new Set(((rows ?? []) as any[]).map((r: any) => r.user_id as string)));
  if (ids.length === 0) return new Set<string>();
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("user_id, role")
    .in("user_id", ids)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  const byUser = new Map<string, Set<string>>();
  for (const r of (data ?? []) as any[]) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, new Set());
    byUser.get(r.user_id)!.add(r.role);
  }
  const out = new Set<string>();
  byUser.forEach((roles, id) => {
    if (isAssistantOnlyRoles(roles)) out.add(id);
  });
  return out;
}
