import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { alternateMirrorEmail, decideEmailConflict } from "./student-mirror-account";

describe("계정 이메일이 겹칠 때", () => {
  it("지워진 예전 기록이 같은 이름이면 예전 계정을 이어받는다", () => {
    assert.equal(decideEmailConflict("노규원", [{ name: "노규원", is_deleted: true }]), "link");
  });
  it("이름 공백 차이는 같은 이름으로 본다", () => {
    assert.equal(decideEmailConflict("노규원", [{ name: "노 규원 ", is_deleted: true }]), "link");
  });
  it("살아 있는 형제 계정이면 새 계정을 따로 만든다", () => {
    assert.equal(
      decideEmailConflict("최유나", [{ name: "최낙윤", is_deleted: false }]),
      "separate",
    );
  });
  it("지워진 형제 계정도 이어받지 않고 따로 만든다", () => {
    assert.equal(decideEmailConflict("손여진", [{ name: "손한슬", is_deleted: true }]), "separate");
  });
  it("같은 이름 학생이 아직 살아 있으면(중복 등록) 건드리지 않는다", () => {
    assert.equal(decideEmailConflict("이나경", [{ name: "이나경", is_deleted: false }]), "skip");
  });
  it("지워진 기록과 살아 있는 형제 기록이 섞이면 따로 만든다", () => {
    assert.equal(
      decideEmailConflict("조이환", [
        { name: "장예린", is_deleted: true },
        { name: "장예린", is_deleted: false },
      ]),
      "separate",
    );
  });
  it("주인 기록이 없는 계정은 가져오지 않고 따로 만든다", () => {
    assert.equal(decideEmailConflict("양가을", []), "separate");
  });
});

describe("두 번째 이메일", () => {
  it("번호 뒤에 학생 id 앞 8자리를 붙인다", () => {
    assert.equal(
      alternateMirrorEmail("fb22f03d-42e9-4ef4-8447-c164eef22d1a", "01012347699"),
      "student-01012347699-fb22f03d@mirror.local",
    );
  });
});
