(function (root, factory) {
  "use strict";

  var api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.AurelAusbildung = api;
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var OPTIONS = Object.freeze({
    age: Object.freeze([
      Object.freeze({ value: "under_18", label: "أقل من 18 سنة" }),
      Object.freeze({ value: "18_24", label: "من 18 إلى 24 سنة" }),
      Object.freeze({ value: "25_29", label: "من 25 إلى 29 سنة" }),
      Object.freeze({ value: "30_34", label: "من 30 إلى 34 سنة" }),
      Object.freeze({ value: "35_39", label: "من 35 إلى 39 سنة" }),
      Object.freeze({ value: "40_44", label: "من 40 إلى 44 سنة" }),
      Object.freeze({ value: "45_49", label: "من 45 إلى 49 سنة" }),
      Object.freeze({ value: "50_plus", label: "50 سنة فما فوق" })
    ]),
    education: Object.freeze([
      Object.freeze({ value: "no_diploma", label: "بدون شهادة / مستوى متوسط فقط" }),
      Object.freeze({ value: "secondary_without_bac", label: "ثانوي بدون بكالوريا" }),
      Object.freeze({ value: "bac", label: "بكالوريا" }),
      Object.freeze({ value: "vocational_under_2_years", label: "تكوين مهني أقل من سنتين" }),
      Object.freeze({ value: "vocational_2_years_or_more", label: "تكوين مهني سنتين أو أكثر / تقني سامي" }),
      Object.freeze({ value: "licence", label: "Licence", dir: "ltr" }),
      Object.freeze({ value: "master_engineer_doctorate", label: "Master / Ingénieur / Doctorat", dir: "ltr" })
    ]),
    germanLevel: Object.freeze([
      Object.freeze({ value: "a0", label: "A0", dir: "ltr" }),
      Object.freeze({ value: "a1", label: "A1", dir: "ltr" }),
      Object.freeze({ value: "a2", label: "A2", dir: "ltr" }),
      Object.freeze({ value: "b1", label: "B1", dir: "ltr" }),
      Object.freeze({ value: "b2", label: "B2", dir: "ltr" }),
      Object.freeze({ value: "c1_plus", label: "C1 أو أكثر" })
    ]),
    fieldRelation: Object.freeze([
      Object.freeze({ value: "field_not_selected", label: "ما زلت ما اخترتش المجال" }),
      Object.freeze({ value: "new_field", label: "حاب نبدأ مجال جديد" }),
      Object.freeze({ value: "related_studies", label: "عندي دراسة أو تكوين في نفس المجال" }),
      Object.freeze({ value: "related_experience", label: "عندي خبرة في نفس المجال" }),
      Object.freeze({ value: "related_studies_and_experience", label: "عندي دراسة/تكوين وخبرة في نفس المجال" })
    ])
  });

  var ACCEPTED_AGE_GROUPS = new Set([
    "18_24",
    "25_29",
    "30_34",
    "35_39",
    "40_44"
  ]);

  function evaluateAusbildungProfile(profile) {
    var requiredFields = [
      profile.age,
      profile.education,
      profile.germanLevel,
      profile.fieldRelation
    ];
    var completed = requiredFields.every(Boolean);

    if (!completed) {
      return {
        completed: false,
        accepted: null,
        reason: "INCOMPLETE_PROFILE"
      };
    }

    var accepted = ACCEPTED_AGE_GROUPS.has(profile.age);

    return {
      completed: true,
      accepted: accepted,
      reason: accepted ? "AGE_WITHIN_TARGET_RANGE" : "AGE_OUTSIDE_TARGET_RANGE"
    };
  }

  return Object.freeze({
    OPTIONS: OPTIONS,
    ACCEPTED_AGE_GROUPS: ACCEPTED_AGE_GROUPS,
    evaluateAusbildungProfile: evaluateAusbildungProfile
  });
});
