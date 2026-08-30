"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  OPTIONS,
  evaluateAusbildungProfile
} = require("../../acceptation/ausbildung-profile.js");

function completeProfile(overrides) {
  return Object.assign({
    age: "18_24",
    education: "no_diploma",
    germanLevel: "a0",
    fieldRelation: "field_not_selected"
  }, overrides);
}

test("under 18 remains refused with the strongest segmentation answers", function () {
  const result = evaluateAusbildungProfile(completeProfile({
    age: "under_18",
    education: "master_engineer_doctorate",
    germanLevel: "c1_plus",
    fieldRelation: "related_studies_and_experience"
  }));

  assert.equal(result.completed, true);
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "AGE_OUTSIDE_TARGET_RANGE");
});

test("18 to 24 is accepted with no diploma, A0 and no selected field", function () {
  assert.equal(evaluateAusbildungProfile(completeProfile({ age: "18_24" })).accepted, true);
});

test("25 to 29 is accepted with secondary school, A1 and a new field", function () {
  assert.equal(evaluateAusbildungProfile(completeProfile({
    age: "25_29",
    education: "secondary_without_bac",
    germanLevel: "a1",
    fieldRelation: "new_field"
  })).accepted, true);
});

test("30 to 34 is accepted with bac, A0 and a new field", function () {
  assert.equal(evaluateAusbildungProfile(completeProfile({
    age: "30_34",
    education: "bac",
    germanLevel: "a0",
    fieldRelation: "new_field"
  })).accepted, true);
});

test("35 to 39 is accepted with no diploma, A0 and no selected field", function () {
  assert.equal(evaluateAusbildungProfile(completeProfile({ age: "35_39" })).accepted, true);
});

test("40 to 44 is accepted with no diploma, A0 and no selected field", function () {
  assert.equal(evaluateAusbildungProfile(completeProfile({ age: "40_44" })).accepted, true);
});

test("45 to 49 remains refused with the strongest segmentation answers", function () {
  assert.equal(evaluateAusbildungProfile(completeProfile({
    age: "45_49",
    education: "master_engineer_doctorate",
    germanLevel: "c1_plus",
    fieldRelation: "related_studies_and_experience"
  })).accepted, false);
});

test("50 plus remains refused with the strongest segmentation answers", function () {
  assert.equal(evaluateAusbildungProfile(completeProfile({
    age: "50_plus",
    education: "master_engineer_doctorate",
    germanLevel: "c1_plus",
    fieldRelation: "related_studies_and_experience"
  })).accepted, false);
});

test("an incomplete profile does not produce a public decision", function () {
  const result = evaluateAusbildungProfile(completeProfile({ education: "" }));

  assert.deepEqual(result, {
    completed: false,
    accepted: null,
    reason: "INCOMPLETE_PROFILE"
  });
});

test("all 1,680 complete combinations produce the exact required distribution", function () {
  let total = 0;
  let accepted = 0;
  let refused = 0;

  for (const age of OPTIONS.age) {
    for (const education of OPTIONS.education) {
      for (const germanLevel of OPTIONS.germanLevel) {
        for (const fieldRelation of OPTIONS.fieldRelation) {
          const result = evaluateAusbildungProfile({
            age: age.value,
            education: education.value,
            germanLevel: germanLevel.value,
            fieldRelation: fieldRelation.value
          });

          assert.equal(result.completed, true);
          total += 1;
          if (result.accepted) accepted += 1;
          else refused += 1;
        }
      }
    }
  }

  assert.equal(total, 1680);
  assert.equal(accepted, 1050);
  assert.equal(refused, 630);
});
