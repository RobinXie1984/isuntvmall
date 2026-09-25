import { describe, expect, it } from "vitest";
import { reviewSelectionKey } from "./review-selection";
describe("review selections", () => {
  it("does not carry an approval selection across a polled edit", () => {
    const reviewed = { id: "same-product", revision: 1 };
    const selected = [reviewSelectionKey(reviewed)];
    const afterPoll = [{ ...reviewed, revision: 2, status: "review" }];
    expect(afterPoll.filter(item => selected.includes(reviewSelectionKey(item)))).toEqual([]);
    expect(selected.includes(reviewSelectionKey(reviewed))).toBe(true);
  });
});
