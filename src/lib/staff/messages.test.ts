import { describe, expect, it } from "vitest";
import { translate, LOCALES } from "@/lib/i18n";
import { roleLabels } from "./messages";
import { STAFF_ROLES } from "./permissions";
describe("staff role names", () => {
 it("places Admin below Super administrator and above Operator", () => { expect(STAFF_ROLES.slice(0, 3)).toEqual(["super_admin", "admin", "operator"]); });
 it("localizes Admin and CSR in each supported language while preserving the CSR membership key", () => {
  expect(LOCALES.map(locale => translate(...roleLabels.admin, locale))).toEqual(["Admin", "管理員", "管理员", "管理者"]);
  expect(LOCALES.map(locale => translate(...roleLabels.order_operator, locale))).toEqual(["CSR", "客服人員", "客服人员", "カスタマーサポート"]);
 });
});
