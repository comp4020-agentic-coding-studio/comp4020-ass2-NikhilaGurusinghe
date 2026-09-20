import type { CourseMetaInput } from "astro-course-university";
import { z } from "astro/zod";

// The level digits ANU uses: 1000--4000 undergraduate, 6000 and 8000
// postgraduate. Both the code pattern and the level field derive from this.
const LEVELS = [1, 2, 3, 4, 6, 8] as const;
const allowedCode = new RegExp(`^SLOP[${LEVELS.join("")}]\\d{3}$`);

export const slopCourseMetaSchema = z
  .strictObject({
    code: z.string().regex(allowedCode, {
      message: "use SLOP plus a 1000–4000, 6000 or 8000 level code",
    }),
    title: z.string().trim().min(1).max(100),
    session: z.string().trim().min(1).max(40),
    year: z.number().int().min(2026).max(2200),
    level: z.literal(LEVELS),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    description: z.string().trim().min(80).max(300),
    tags: z.array(z.string().trim().min(2).max(24)).min(1).max(3),
  })
  .superRefine((course, ctx) => {
    const codeLevel = Number(course.code.at(4));
    if (course.level !== codeLevel) {
      ctx.addIssue({
        code: "custom",
        path: ["level"],
        message: `must match ${course.code}'s first digit (${codeLevel})`,
      });
    }
    if (course.startDate > course.endDate) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "must not be after endDate",
      });
    }
  });

// The single source of truth for the course record. The generated homepage,
// navigation label and /api/index.json all read this object.
// Replace every placeholder value, but keep the shape: the catalogue ingests
// this API contract when the course is published.
//
// The code's last three digits were assigned to this repo when it was
// provisioned, and no other course in the cohort has them. Change the first
// digit to your course's level (and `level` to match); keep the other three.
// STARTER_CONTENT: replace this course record, then remove this comment.
export const courseMeta = slopCourseMetaSchema.parse({
  code: "SLOP1836",
  title: "Advanced Topics in Human Computer Interaction: Human-Bionic Interaction",
  session: "Semester 2",
  year: 2027,
  level: 1,
  // ANU 2027 academic calendar: Semester 2 begins 26 July and teaching ends
  // 29 October (a 2-week break from 6 September sits in the middle). The
  // record runs to the close of the examination period on 20 November, so
  // assessment due dates after the last teaching day still fall inside it.
  startDate: "2027-07-26",
  endDate: "2027-11-20",
  description:
    "CCS-based augmentations -- cybernetic organisms that alter your brain’s " +
    "activity and chemistry -- are a powerful new tool allowing you to think " +
    "faster and smarter. Moving beyond its obvious uses in solving difficult " +
    "problems in academia, this course will teach you the skills you need to " +
    "harness your new second inner monologue in the most optimal way " +
    "possible. Although this is a skill transferrable to any domain, we will " +
    "do so chiefly for the creation of art: visual, literary, and auditory. " +
    "In the weekly lectures you’ll learn fundamental concepts and practical " +
    "skills for harnessing your cybernetic organ including how best to " +
    "communicate with them. Then in the weekly workshops, you’ll give a brief " +
    "presentation on the art that you’ve created and receive constructive " +
    "criticism from your peers and tutor. However, the goal is to evaluate " +
    "your interactions with the CCS rather than the artwork itself -- so no " +
    "prior art experience is required. Hence, by the end of the course you’ll " +
    "have created multiple artworks, but you’ll have gained a significantly " +
    "better understanding of using your organ toward any mean.",
  tags: ["cybernetics", "art practice", "CCS communication"],
}) satisfies CourseMetaInput;
