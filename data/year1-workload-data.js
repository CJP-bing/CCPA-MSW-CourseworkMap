(function () {
  const semesterLabels = {
    fall: "Fall",
    spring: "Spring",
  };

  const termLabels = {
    "y1-fall": "Fall Year 1",
    "y1-spring": "Spring Year 1",
    "y2-fall": "Fall Year 2",
    "y2-spring": "Spring Year 2",
  };

  const metadata = {
    title: "Social Work Program Pressure Map",
    version: "proof-of-concept-1",
    weekCount: 14,
    fieldHoursPerWeek: 18.2,
    outsideEffortDefaults: {
      jobHoursPerWeek: 20,
      lifeHoursPerWeek: 6,
    },
    fieldAssumption:
      "Estimated from a 510-hour field placement spread across two consecutive semesters: 510 / 28 instructional weeks = 18.2 hours per week. Year 1 includes Field Instruction I/II and Year 2 includes an advanced field-placement baseline. Adjust the field-hours control if the program uses a different weekly distribution.",
    outsideEffortAssumption:
      "Optional student reality overlay for recurring paid work, caregiving, commuting, extracurricular, family, and life-administration commitments. Adjust the weekly job and outside-hours controls for part-time, full-time, or custom interview scenarios.",
    scoringNote:
      "Effort values are estimated workload hours, inferred from syllabus descriptions, page lengths, group coordination, presentation/media production, quizzes, and recurring module engagement. They are planning estimates, not official credit-hour calculations.",
    twoYearNote:
      "The proof of concept now includes Year 1 and Year 2. Term filters keep Fall/Spring Year 1 separate from Fall/Spring Year 2.",
    extractionNotes: [
      "The PDFs were image-based, so assignment data was manually extracted from rendered pages.",
      "Z512 lists Final Presentation as 35 points in the assignment table, while the later planned-change project rubric says 40 points. The assignment table value is used for the card weight note.",
      "Some assignments are marked 'as assigned' in the syllabus. These are placed in a reasonable default week and flagged as movable.",
      "Z523 and Z524 contained summer-session or incomplete calendar details. Their Year 2 placement uses relative 14-week defaults and flags student-specific group/facilitation items as assigned/movable.",
    ],
  };

  const courses = [
    { id: "Z504", year: 1, semester: "fall", title: "Foundations of Scientific Inquiry", color: "#2364aa" },
    { id: "Z505", year: 1, semester: "fall", title: "Human Behavior in the Social Environment", color: "#2f7d32" },
    { id: "Z510", year: 1, semester: "fall", title: "Generalist Social Work Practice I", color: "#b35c1e" },
    { id: "Z515", year: 1, semester: "fall", title: "Social Welfare Policy and Programs", color: "#8b5a2b" },
    { id: "Z591", year: 1, semester: "fall", title: "Field Instruction I", color: "#5b6770", field: true },
    { id: "Z503", year: 1, semester: "spring", title: "Diversity and Oppression", color: "#007c89" },
    { id: "Z506", year: 1, semester: "spring", title: "Psychopathology and Psychopharmacology", color: "#7b4f9d" },
    { id: "Z511", year: 1, semester: "spring", title: "Generalist Social Work Practice II", color: "#c04b5a" },
    { id: "Z512", year: 1, semester: "spring", title: "Generalist Practice with Organizations and Communities", color: "#2f6f73" },
    { id: "Z592", year: 1, semester: "spring", title: "Field Instruction II", color: "#5b6770", field: true },
    { id: "Z521", year: 2, semester: "fall", title: "Advanced Direct Practice with Individuals", color: "#5b5fc7" },
    { id: "Z522", year: 2, semester: "fall", title: "Advanced Social Work Practice with Organizations", color: "#a35f00" },
    { id: "Z523", year: 2, semester: "fall", title: "Advanced Social Work Practice with Groups", color: "#7a5c21" },
    { id: "Z593", year: 2, semester: "fall", title: "Advanced Field Instruction I", color: "#5b6770", field: true },
    { id: "Z520", year: 2, semester: "spring", title: "Evaluation of Social Work Practice", color: "#005f8f" },
    { id: "Z524", year: 2, semester: "spring", title: "Advanced Social Work Practice with Families", color: "#9c4f7a" },
    { id: "Z525", year: 2, semester: "spring", title: "Advanced Social Work Practice with Communities", color: "#557a1f" },
    { id: "Z594", year: 2, semester: "spring", title: "Advanced Field Instruction II", color: "#5b6770", field: true },
  ];

  const typeColors = {
    "Field Hours": "#56616b",
    Discussion: "#2c7a7b",
    Quiz: "#9f6b00",
    Paper: "#b8325f",
    "Research Project": "#4f46a5",
    "Group Work": "#007a5a",
    Presentation: "#c2410c",
    "Clinical/Case Practice": "#8b3a62",
    Reflection: "#52721f",
    "Applied Activity": "#1f6f8b",
    "Admin/Planning": "#6b7280",
    Engagement: "#3a6b35",
    "Paid Work": "#334155",
    "Life/Outside Commitments": "#6d6f3f",
  };

  const assignments = [];

  function effortLabel(effort) {
    if (effort <= 2) return "Low";
    if (effort <= 5) return "Medium";
    if (effort <= 9) return "High";
    return "Very high";
  }

  function add({
    semester,
    course,
    week,
    title,
    type,
    effort,
    mode = "individual",
    graded = true,
    major,
    source = "syllabus",
    notes = "",
    due = "",
    tags = [],
    locked = false,
    asAssigned = false,
    year,
  }) {
    const courseMeta = courses.find((item) => item.id === course);
    const item = {
      id: `${course}-${week}-${assignments.length + 1}`,
      year: year ?? courseMeta?.year ?? 1,
      semester,
      courseId: course,
      week,
      originalWeek: week,
      title,
      type,
      effort,
      effortLabel: effortLabel(effort),
      mode,
      graded,
      major: major ?? effort >= 6,
      source,
      notes,
      due,
      tags,
      locked,
      asAssigned,
    };
    assignments.push(item);
  }

  function addField(semester, course) {
    for (let week = 1; week <= 14; week += 1) {
      add({
        semester,
        course,
        week,
        title: "Field placement hours",
        type: "Field Hours",
        effort: metadata.fieldHoursPerWeek,
        mode: "field",
        graded: false,
        major: true,
        source: "program field-hour assumption",
        notes: metadata.fieldAssumption,
        tags: ["field", "baseline"],
        locked: true,
      });
    }
  }

  function addWeeklyEngagement(semester, course, weeks, effort, title, notes = "") {
    weeks.forEach((week) =>
      add({
        semester,
        course,
        week,
        title,
        type: "Engagement",
        effort,
        mode: "individual",
        graded: true,
        major: false,
        notes,
        tags: ["recurring"],
        locked: true,
      }),
    );
  }

  function addDiscussion(semester, course, weeks, effort = 1.5, title = "Discussion post and peer responses") {
    weeks.forEach((week) =>
      add({
        semester,
        course,
        week,
        title,
        type: "Discussion",
        effort,
        mode: "individual",
        graded: true,
        major: false,
        tags: ["discussion", "writing", "recurring"],
      }),
    );
  }

  function addReadingAssessment(semester, course, weeks) {
    weeks.forEach((week) =>
      add({
        semester,
        course,
        week,
        title: "Weekly reading assessment",
        type: "Reflection",
        effort: 1.5,
        mode: "individual",
        graded: true,
        major: false,
        notes: "2-3 paragraph reflection based on assigned readings. The syllabus allows one skipped week except Week 1.",
        tags: ["writing", "recurring"],
      }),
    );
  }

  addField("fall", "Z591");
  addField("spring", "Z592");
  addField("fall", "Z593");
  addField("spring", "Z594");

  // Z504 - Foundations of Scientific Inquiry
  add({ semester: "fall", course: "Z504", week: 1, title: "Weekly discussion board post", type: "Discussion", effort: 1.5, tags: ["discussion", "writing"] });
  add({ semester: "fall", course: "Z504", week: 2, title: "Weekly assignment: submission to instructor plus discussion post", type: "Discussion", effort: 2.5, tags: ["discussion", "writing"] });
  add({ semester: "fall", course: "Z504", week: 2, title: "Module 2 reading quiz", type: "Quiz", effort: 1.5, tags: ["quiz"] });
  add({ semester: "fall", course: "Z504", week: 3, title: "Group discussion board post", type: "Discussion", effort: 1.5, mode: "group", tags: ["discussion", "group"] });
  add({ semester: "fall", course: "Z504", week: 4, title: "Group discussion board post", type: "Discussion", effort: 1.5, mode: "group", tags: ["discussion", "group"] });
  add({ semester: "fall", course: "Z504", week: 4, title: "Module 4 reading quiz", type: "Quiz", effort: 1.5, tags: ["quiz"] });
  add({ semester: "fall", course: "Z504", week: 5, title: "Human Subjects Certification: CITI Training", type: "Applied Activity", effort: 2.5, tags: ["training"] });
  add({ semester: "fall", course: "Z504", week: 5, title: "Group discussion board post", type: "Discussion", effort: 1.5, mode: "group", tags: ["discussion", "group"] });
  add({ semester: "fall", course: "Z504", week: 5, title: "Module 5 reading quiz", type: "Quiz", effort: 1.5, tags: ["quiz"] });
  add({ semester: "fall", course: "Z504", week: 6, title: "Group discussion board post", type: "Discussion", effort: 1.5, mode: "group", tags: ["discussion", "group"] });
  add({ semester: "fall", course: "Z504", week: 6, title: "Module 6 reading quiz", type: "Quiz", effort: 1.5, tags: ["quiz"] });
  add({ semester: "fall", course: "Z504", week: 7, title: "Research paper phase I", type: "Research Project", effort: 5, tags: ["writing", "research"] });
  add({ semester: "fall", course: "Z504", week: 7, title: "Group/class discussion board post", type: "Discussion", effort: 1.5, mode: "group", tags: ["discussion", "group"] });
  add({ semester: "fall", course: "Z504", week: 7, title: "Module 7 reading quiz", type: "Quiz", effort: 1.5, tags: ["quiz"] });
  add({ semester: "fall", course: "Z504", week: 8, title: "Class and group discussion board post", type: "Discussion", effort: 2, mode: "group", tags: ["discussion", "group"] });
  add({ semester: "fall", course: "Z504", week: 8, title: "Module 8 reading quiz", type: "Quiz", effort: 1.5, tags: ["quiz"] });
  add({ semester: "fall", course: "Z504", week: 9, title: "Group discussion board post", type: "Discussion", effort: 1.5, mode: "group", tags: ["discussion", "group"] });
  add({ semester: "fall", course: "Z504", week: 9, title: "Module 9 reading quiz", type: "Quiz", effort: 1.5, tags: ["quiz"] });
  add({ semester: "fall", course: "Z504", week: 10, title: "Research paper phase II", type: "Research Project", effort: 5.5, tags: ["writing", "research"] });
  add({ semester: "fall", course: "Z504", week: 10, title: "Module 10 reading quiz", type: "Quiz", effort: 1.5, tags: ["quiz"] });
  add({ semester: "fall", course: "Z504", week: 11, title: "Research article critique immersion submission", type: "Paper", effort: 3, tags: ["writing", "research"] });
  add({ semester: "fall", course: "Z504", week: 12, title: "Research article critique", type: "Paper", effort: 7, tags: ["writing", "research"] });
  add({ semester: "fall", course: "Z504", week: 12, title: "Module 12 reading quiz", type: "Quiz", effort: 1.5, tags: ["quiz"] });
  add({ semester: "fall", course: "Z504", week: 13, title: "Weekly assignment: submission to instructor", type: "Reflection", effort: 2, tags: ["writing"] });
  add({ semester: "fall", course: "Z504", week: 13, title: "Module 13 reading quiz", type: "Quiz", effort: 1.5, tags: ["quiz"] });
  add({ semester: "fall", course: "Z504", week: 14, title: "Final research project", type: "Research Project", effort: 10, mode: "group", tags: ["writing", "research", "group"] });
  add({ semester: "fall", course: "Z504", week: 14, title: "Weekly assignment: submission to instructor", type: "Reflection", effort: 2, tags: ["writing"] });

  // Z505 - Human Behavior in the Social Environment
  addWeeklyEngagement("fall", "Z505", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 1, "Weekly module engagement");
  addDiscussion("fall", "Z505", [1, 2, 3, 4, 5, 8, 9, 10, 11, 12]);
  [1, 2, 3, 4, 5, 8, 9, 10, 11, 12].forEach((week) =>
    add({ semester: "fall", course: "Z505", week, title: `Week ${week} reading quiz`, type: "Quiz", effort: 1.5, tags: ["quiz"] }),
  );
  add({ semester: "fall", course: "Z505", week: 4, title: "Practice ecomap using case study", type: "Applied Activity", effort: 1.5, tags: ["practice"] });
  add({ semester: "fall", course: "Z505", week: 6, title: "Film viewing and paper preparation", type: "Applied Activity", effort: 3, graded: false, notes: "Watch Lady Bird and review film assessment instructions.", tags: ["prep"] });
  add({ semester: "fall", course: "Z505", week: 7, title: "Film assessment paper", type: "Paper", effort: 8, notes: "5-6 page theory application paper with ecomap and genogram.", tags: ["writing", "analysis"] });
  add({ semester: "fall", course: "Z505", week: 12, title: "Autobiography assignment preparation", type: "Admin/Planning", effort: 1, graded: false, notes: "Review autobiography instructions.", tags: ["prep", "writing"] });
  add({ semester: "fall", course: "Z505", week: 14, title: "Autobiography", type: "Paper", effort: 10, notes: "7-8 page autobiography using three HBSE theories.", tags: ["writing", "reflection"] });

  // Z510 - Generalist Social Work Practice I
  addDiscussion("fall", "Z510", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 1.5, "Module discussion");
  add({ semester: "fall", course: "Z510", week: 2, title: "Review guest speaker series videos", type: "Applied Activity", effort: 1.5, graded: false, tags: ["viewing", "prep"] });
  add({ semester: "fall", course: "Z510", week: 7, title: "Values paper", type: "Paper", effort: 10, notes: "Up to 10 pages plus references; compares personal values with social work values.", tags: ["writing", "reflection"] });
  add({ semester: "fall", course: "Z510", week: 8, title: "Guest speaker reflection paper", type: "Paper", effort: 8, notes: "5-7 page reflection paper synthesizing guest speaker interviews.", tags: ["writing", "reflection"] });
  add({ semester: "fall", course: "Z510", week: 10, title: "Videotaped interview assignment", type: "Clinical/Case Practice", effort: 12, notes: "10-minute role-play recording, process recording, and discussion-board presentation preparation.", tags: ["video", "practice", "writing"] });
  [11, 12, 13].forEach((week) =>
    add({ semester: "fall", course: "Z510", week, title: "Role-play review and critique discussion", type: "Discussion", effort: 2, notes: "Review classmates' role-play presentations and contribute critique.", tags: ["discussion", "practice"] }),
  );
  add({ semester: "fall", course: "Z510", week: 14, title: "Case study presentation", type: "Presentation", effort: 7, notes: "Recorded 5-7 minute case presentation.", tags: ["presentation", "case"] });

  // Z515 - Social Welfare Policy and Programs
  addWeeklyEngagement("fall", "Z515", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 3, "Weekly module engagement and participation self-assessment", "Syllabus estimates each weekly module at approximately 3 hours.");
  add({ semester: "fall", course: "Z515", week: 2, title: "IPE orientation completion quiz", type: "Quiz", effort: 1, due: "9/2", notes: "Listed in Week 1 row with 9/2 due date.", tags: ["quiz", "ipe"] });
  add({ semester: "fall", course: "Z515", week: 2, title: "Schedule IPE icebreaker meeting", type: "Admin/Planning", effort: 1, mode: "group", tags: ["group", "ipe", "planning"] });
  add({ semester: "fall", course: "Z515", week: 3, title: "Identify policy issue/problem", type: "Admin/Planning", effort: 1.5, tags: ["planning", "policy"] });
  add({ semester: "fall", course: "Z515", week: 4, title: "Policy Analysis Part 1: social problem essay", type: "Paper", effort: 5, due: "9/21", notes: "Short approximately 3-page essay.", tags: ["writing", "policy"] });
  add({ semester: "fall", course: "Z515", week: 5, title: "IPE health insurance project icebreaker", type: "Group Work", effort: 2, mode: "group", due: "9/28", tags: ["group", "ipe"] });
  add({ semester: "fall", course: "Z515", week: 6, title: "Policy Analysis Part 2: policy identification template", type: "Applied Activity", effort: 3, due: "10/5", tags: ["writing", "policy"] });
  add({ semester: "fall", course: "Z515", week: 6, title: "IPE project template", type: "Group Work", effort: 3, mode: "group", due: "10/2", tags: ["group", "ipe"] });
  add({ semester: "fall", course: "Z515", week: 7, title: "IPE group paper planning from template feedback", type: "Group Work", effort: 2, mode: "group", tags: ["group", "ipe", "prep"] });
  add({ semester: "fall", course: "Z515", week: 8, title: "Policy Analysis Part 3: policy white paper", type: "Paper", effort: 9, due: "10/26", notes: "5-7 page white paper.", tags: ["writing", "policy"] });
  add({ semester: "fall", course: "Z515", week: 9, title: "IPE group paper drafting", type: "Group Work", effort: 2.5, mode: "group", tags: ["group", "ipe", "writing"] });
  add({ semester: "fall", course: "Z515", week: 10, title: "Policy Analysis Part 4: advocacy letter", type: "Paper", effort: 4, due: "11/9", notes: "Brief 1-page letter to representative.", tags: ["writing", "policy"] });
  add({ semester: "fall", course: "Z515", week: 11, title: "IPE health insurance project group paper", type: "Group Work", effort: 8, mode: "group", due: "11/16", tags: ["group", "ipe", "writing"] });
  add({ semester: "fall", course: "Z515", week: 12, title: "IPE peer/self evaluation", type: "Reflection", effort: 1, due: "11/18", tags: ["reflection", "ipe"] });
  add({ semester: "fall", course: "Z515", week: 12, title: "Legislative meeting scheduling email", type: "Admin/Planning", effort: 1, mode: "group", due: "11/23", tags: ["group", "planning", "policy"] });
  add({ semester: "fall", course: "Z515", week: 13, title: "Legislative meeting simulation preparation", type: "Group Work", effort: 3, mode: "group", tags: ["group", "policy", "presentation"] });
  add({ semester: "fall", course: "Z515", week: 14, title: "Legislative meeting simulation", type: "Presentation", effort: 5, mode: "group", notes: "15-minute simulated legislative meeting.", tags: ["group", "presentation", "policy"] });
  add({ semester: "fall", course: "Z515", week: 14, title: "Legislative meeting follow-up email", type: "Admin/Planning", effort: 1.5, mode: "group", due: "12/7", tags: ["group", "policy"] });

  // Z503 - Diversity and Oppression
  addDiscussion("spring", "Z503", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 1.5, "Module discussion / class engagement");
  add({ semester: "spring", course: "Z503", week: 2, title: "Social issue discussion group setup", type: "Admin/Planning", effort: 1, mode: "group", tags: ["group", "planning"] });
  add({ semester: "spring", course: "Z503", week: 3, title: "Social issue roles and SOP topic sign-up", type: "Admin/Planning", effort: 1.5, mode: "group", tags: ["group", "planning"] });
  add({ semester: "spring", course: "Z503", week: 4, title: "Culturagram", type: "Paper", effort: 6, notes: "Culturagram plus 3-5 page narrative and peer sharing.", tags: ["writing", "reflection"] });
  add({ semester: "spring", course: "Z503", week: 5, title: "Culturagram reflections", type: "Reflection", effort: 2, tags: ["writing", "reflection"] });
  add({ semester: "spring", course: "Z503", week: 6, title: "Case analysis group name and setup", type: "Admin/Planning", effort: 1, mode: "group", tags: ["group", "planning"] });
  add({ semester: "spring", course: "Z503", week: 6, title: "Social issue facilitation/summarizer role", type: "Group Work", effort: 4, mode: "group", notes: "Default placeholder for a rotating role. Move to the student's assigned week.", tags: ["group", "discussion"], asAssigned: true });
  add({ semester: "spring", course: "Z503", week: 9, title: "Case analysis group work", type: "Group Work", effort: 2, mode: "group", tags: ["group", "prep"] });
  add({ semester: "spring", course: "Z503", week: 10, title: "SOP and intersectionality paper", type: "Paper", effort: 12, notes: "Major 10-12 page paper with community informant/interview component.", tags: ["writing", "research"] });
  add({ semester: "spring", course: "Z503", week: 10, title: "Case analysis group work", type: "Group Work", effort: 2, mode: "group", tags: ["group", "prep"] });
  add({ semester: "spring", course: "Z503", week: 11, title: "SOP and intersectionality presentation", type: "Presentation", effort: 7, notes: "10-12 minute video presentation with PowerPoint slides.", tags: ["presentation", "video"] });
  add({ semester: "spring", course: "Z503", week: 11, title: "Case analysis group work", type: "Group Work", effort: 2, mode: "group", tags: ["group", "prep"] });
  add({ semester: "spring", course: "Z503", week: 12, title: "SOP presentation peer responses", type: "Reflection", effort: 3, tags: ["writing", "peer"] });
  add({ semester: "spring", course: "Z503", week: 12, title: "Case analysis group presentation", type: "Presentation", effort: 9, mode: "group", notes: "Recorded group presentation plus peer-facing discussion.", tags: ["group", "presentation"] });
  add({ semester: "spring", course: "Z503", week: 13, title: "Case analysis feedback and peer evaluation", type: "Reflection", effort: 3, mode: "group", tags: ["group", "peer", "writing"] });
  add({ semester: "spring", course: "Z503", week: 14, title: "Final course evaluation", type: "Reflection", effort: 0.5, graded: false, tags: ["reflection"] });

  // Z506 - Psychopathology and Psychopharmacology
  addDiscussion("spring", "Z506", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 1.5, "Module discussion");
  [3, 5, 8, 10].forEach((week, index) =>
    add({ semester: "spring", course: "Z506", week, title: `Quiz ${index + 1}`, type: "Quiz", effort: 2, tags: ["quiz"] }),
  );
  add({ semester: "spring", course: "Z506", week: 9, title: "Clinical assessment assignment", type: "Clinical/Case Practice", effort: 9, notes: "6-8 page clinical assessment summary based on a graphic novel case.", tags: ["writing", "clinical", "case"] });
  [11, 12, 13].forEach((week) =>
    add({ semester: "spring", course: "Z506", week, title: "Case conference peer review/discussion", type: "Discussion", effort: 2, notes: "View classmates' case conference videos and provide comments/feedback.", tags: ["discussion", "peer", "case"] }),
  );
  add({ semester: "spring", course: "Z506", week: 12, title: "Case conference presentation video", type: "Presentation", effort: 6, notes: "Default placeholder for an assigned presentation week. Move to Week 11 or 13 if assigned there.", tags: ["presentation", "clinical", "case"], asAssigned: true });

  // Z511 - Generalist Social Work Practice II
  addDiscussion("spring", "Z511", [1, 2, 3, 4, 8, 9, 10, 11], 1.5, "Module discussion");
  add({ semester: "spring", course: "Z511", week: 4, title: "Group plan", type: "Group Work", effort: 6, mode: "group", notes: "Structured plan for one group session.", tags: ["group", "writing", "practice"] });
  add({ semester: "spring", course: "Z511", week: 5, title: "Group role play facilitation preparation sheet", type: "Group Work", effort: 3, mode: "group", tags: ["group", "practice", "prep"] });
  add({ semester: "spring", course: "Z511", week: 6, title: "Recorded group role play and debrief", type: "Clinical/Case Practice", effort: 8, mode: "group", notes: "20-30 minute role play, 10-15 minute debrief, and discussion prompts.", tags: ["group", "video", "practice"] });
  add({ semester: "spring", course: "Z511", week: 7, title: "Group role play discussion responses", type: "Discussion", effort: 1.5, tags: ["discussion", "peer"] });
  add({ semester: "spring", course: "Z511", week: 7, title: "Group role play case note", type: "Clinical/Case Practice", effort: 3, notes: "Individual 1-2 page single-spaced case note.", tags: ["writing", "case"] });
  add({ semester: "spring", course: "Z511", week: 11, title: "Genogram and narrative", type: "Paper", effort: 8, notes: "Three-generation genogram plus narrative up to 4 double-spaced pages.", tags: ["writing", "reflection"] });
  add({ semester: "spring", course: "Z511", week: 12, title: "Family role play facilitation preparation sheet", type: "Group Work", effort: 3, mode: "group", tags: ["group", "practice", "prep"] });
  add({ semester: "spring", course: "Z511", week: 13, title: "Recorded family role play and debrief", type: "Clinical/Case Practice", effort: 8, mode: "group", notes: "Second role-play cycle.", tags: ["group", "video", "practice"] });
  add({ semester: "spring", course: "Z511", week: 14, title: "Family role play discussion responses", type: "Discussion", effort: 1.5, tags: ["discussion", "peer"] });
  add({ semester: "spring", course: "Z511", week: 14, title: "Family role play case note", type: "Clinical/Case Practice", effort: 3, notes: "Individual case note after family role play.", tags: ["writing", "case"] });

  // Z512 - Generalist Practice with Organizations and Communities
  addWeeklyEngagement("spring", "Z512", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 3.5, "Weekly module engagement", "Syllabus estimates each module at 3-4 hours.");
  addReadingAssessment("spring", "Z512", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  add({ semester: "spring", course: "Z512", week: 1, title: "Sign up for first 1:1 chat and leadership availability", type: "Admin/Planning", effort: 1, tags: ["planning"] });
  add({ semester: "spring", course: "Z512", week: 2, title: "Define and present chosen theory", type: "Presentation", effort: 2, tags: ["presentation", "theory"] });
  add({ semester: "spring", course: "Z512", week: 2, title: "First 1:1 chat with instructor", type: "Admin/Planning", effort: 0.75, due: "By 2/7", tags: ["meeting"] });
  add({ semester: "spring", course: "Z512", week: 3, title: "Community of interest Padlet post", type: "Applied Activity", effort: 1.5, tags: ["community", "planning"] });
  add({ semester: "spring", course: "Z512", week: 4, title: "Needs assessment and SWOT activity", type: "Applied Activity", effort: 3, tags: ["community", "analysis"] });
  add({ semester: "spring", course: "Z512", week: 5, title: "Technology in community intervention assignment", type: "Applied Activity", effort: 3, tags: ["community", "technology"] });
  add({ semester: "spring", course: "Z512", week: 6, title: "Evaluation template for chosen community", type: "Applied Activity", effort: 3, tags: ["community", "evaluation"] });
  [3, 4, 5, 6, 7, 10, 11, 12, 13, 14].forEach((week) =>
    add({ semester: "spring", course: "Z512", week, title: "Macro practice discussion contribution", type: "Discussion", effort: 1.5, tags: ["discussion", "recurring"] }),
  );
  add({ semester: "spring", course: "Z512", week: 5, title: "Leadership discussion moderator slot", type: "Group Work", effort: 4, mode: "group", notes: "Default placeholder for one of two assigned moderator weeks.", tags: ["group", "discussion"], asAssigned: true });
  add({ semester: "spring", course: "Z512", week: 11, title: "Leadership discussion moderator slot", type: "Group Work", effort: 4, mode: "group", notes: "Default placeholder for one of two assigned moderator weeks.", tags: ["group", "discussion"], asAssigned: true });
  add({ semester: "spring", course: "Z512", week: 7, title: "Community observation paper", type: "Paper", effort: 8, notes: "Attend an in-person community-based meeting and write up to 5 pages.", tags: ["writing", "community"] });
  add({ semester: "spring", course: "Z512", week: 8, title: "Application of theory activity", type: "Applied Activity", effort: 2, tags: ["theory", "practice"] });
  add({ semester: "spring", course: "Z512", week: 9, title: "Initial thoughts for final presentation", type: "Reflection", effort: 1.5, tags: ["writing", "presentation", "prep"] });
  add({ semester: "spring", course: "Z512", week: 10, title: "Second 1:1 chat with instructor", type: "Admin/Planning", effort: 0.75, due: "By 4/11", tags: ["meeting"] });
  add({ semester: "spring", course: "Z512", week: 10, title: "Final presentation planning", type: "Admin/Planning", effort: 1.5, tags: ["presentation", "prep"] });
  add({ semester: "spring", course: "Z512", week: 12, title: "Organizational policy paper", type: "Paper", effort: 8, notes: "Up to 6 pages analyzing an organizational policy and advocacy recommendations.", tags: ["writing", "policy"] });
  add({ semester: "spring", course: "Z512", week: 14, title: "Final presentation", type: "Presentation", effort: 10, due: "5/11", notes: "15-minute community/organization planned change presentation.", tags: ["presentation", "community"] });
  add({ semester: "spring", course: "Z512", week: 14, title: "Final Brightspace prompts", type: "Reflection", effort: 1.5, tags: ["writing", "reflection"] });

  // Z521 - Advanced Direct Practice with Individuals
  addWeeklyEngagement("fall", "Z521", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 3, "Weekly module engagement", "Syllabus states students should plan for approximately 9.5 hours/week across readings, lecture/media, discussion, and assignments.");
  add({ semester: "fall", course: "Z521", week: 1, title: "All About Me / Getting to Know You upload", type: "Reflection", effort: 1.5, due: "08/31/25", tags: ["introduction", "reflection"] });
  addDiscussion("fall", "Z521", [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 13], 1.5, "Weekly discussion prompt");
  add({ semester: "fall", course: "Z521", week: 3, title: "Strengths map activity for anchor client", type: "Applied Activity", effort: 2, notes: "Develop a strengths map for the assessment/treatment plan client.", tags: ["clinical", "prep"] });
  add({ semester: "fall", course: "Z521", week: 7, title: "Assessment and treatment plan", type: "Clinical/Case Practice", effort: 12, due: "10/12/25", notes: "Anchor assignment using the course case/client.", tags: ["writing", "clinical", "anchor"] });
  add({ semester: "fall", course: "Z521", week: 8, title: "Treatment approach overview and demo podcast slot", type: "Presentation", effort: 7, mode: "group", notes: "Default placeholder for one assigned treatment-approach podcast week; move to the student's assigned team week.", tags: ["presentation", "group", "as-assigned"], asAssigned: true });
  add({ semester: "fall", course: "Z521", week: 9, title: "Podcast feedback/reflection to peers", type: "Reflection", effort: 3, notes: "Default placeholder for peer feedback/reflection tied to podcast weeks.", tags: ["peer", "reflection", "as-assigned"], asAssigned: true });
  add({ semester: "fall", course: "Z521", week: 12, title: "Final assignment work check-in with instructor", type: "Admin/Planning", effort: 1.5, notes: "Listed in place of Discussion Points #11.", tags: ["meeting", "planning"] });
  add({ semester: "fall", course: "Z521", week: 14, title: "Final reflection on practice", type: "Paper", effort: 8, due: "12/7/25", notes: "Final anchor reflection on practice.", tags: ["writing", "reflection", "anchor"] });

  // Z522 - Advanced Social Work Practice with Organizations
  addWeeklyEngagement("fall", "Z522", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 3, "Weekly Brightspace module engagement", "Weekly course engagement is a graded assignment in the syllabus.");
  add({ semester: "fall", course: "Z522", week: 1, title: "Sign up for first 1:1 chat and discussion groups", type: "Admin/Planning", effort: 1.5, tags: ["meeting", "planning"] });
  add({ semester: "fall", course: "Z522", week: 2, title: "Nonprofits and philanthropy discussion post", type: "Discussion", effort: 2, tags: ["discussion", "organizations"] });
  add({ semester: "fall", course: "Z522", week: 3, title: "Leadership types discussion post", type: "Discussion", effort: 2, tags: ["discussion", "leadership"] });
  add({ semester: "fall", course: "Z522", week: 4, title: "Leadership style quizzes and reflection", type: "Reflection", effort: 4, notes: "Complete assigned leadership quizzes and submit a 1-page reflection.", tags: ["writing", "leadership"] });
  add({ semester: "fall", course: "Z522", week: 5, title: "CliftonStrengths reflection", type: "Reflection", effort: 4, notes: "Complete CliftonStrengths and submit a 1-page reflection.", tags: ["writing", "leadership"] });
  add({ semester: "fall", course: "Z522", week: 6, title: "Organizational culture Padlet", type: "Applied Activity", effort: 2, tags: ["discussion", "organization"] });
  add({ semester: "fall", course: "Z522", week: 7, title: "Interview with a supervisor paper", type: "Paper", effort: 10, notes: "Interview a supervisor and submit paper.", tags: ["writing", "interview", "leadership"] });
  add({ semester: "fall", course: "Z522", week: 7, title: "Conflict assessment discussion post", type: "Discussion", effort: 2, tags: ["discussion", "conflict"] });
  add({ semester: "fall", course: "Z522", week: 8, title: "Leadership weekly discussion leader slot", type: "Group Work", effort: 5, mode: "group", notes: "Default placeholder for assigned content curator/discussion moderator work; move to assigned week.", tags: ["group", "discussion", "as-assigned"], asAssigned: true });
  add({ semester: "fall", course: "Z522", week: 9, title: "Organizational trauma discussion prompts", type: "Discussion", effort: 2, tags: ["discussion", "organization"] });
  add({ semester: "fall", course: "Z522", week: 9, title: "Sign up for second 1:1 chat", type: "Admin/Planning", effort: 0.75, tags: ["meeting", "planning"] });
  add({ semester: "fall", course: "Z522", week: 10, title: "Strategic planning mission review", type: "Applied Activity", effort: 2, tags: ["organization", "planning"] });
  add({ semester: "fall", course: "Z522", week: 10, title: "Second 1:1 chat with instructor", type: "Admin/Planning", effort: 1.5, tags: ["meeting"] });
  add({ semester: "fall", course: "Z522", week: 11, title: "Program evaluation measurement prompts", type: "Applied Activity", effort: 2, tags: ["evaluation", "organization"] });
  add({ semester: "fall", course: "Z522", week: 12, title: "Policy practice Padlet", type: "Applied Activity", effort: 2, tags: ["policy", "discussion"] });
  add({ semester: "fall", course: "Z522", week: 13, title: "Burnout and engagement discussion prompts", type: "Discussion", effort: 2, tags: ["discussion", "leadership"] });
  add({ semester: "fall", course: "Z522", week: 13, title: "Leadership discovery paper preparation", type: "Admin/Planning", effort: 3, graded: false, notes: "Preparation week for final leadership discovery paper.", tags: ["writing", "prep"] });
  add({ semester: "fall", course: "Z522", week: 14, title: "Leadership discovery final paper", type: "Paper", effort: 12, notes: "Final leadership ideals/discovery paper.", tags: ["writing", "leadership", "anchor"] });
  add({ semester: "fall", course: "Z522", week: 14, title: "Innovation and emerging trends discussion prompts", type: "Discussion", effort: 2, tags: ["discussion", "innovation"] });

  // Z523 - Advanced Social Work Practice with Groups
  addDiscussion("fall", "Z523", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 1.5, "Weekly group-work discussion participation");
  addReadingAssessment("fall", "Z523", [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  [3, 5, 8, 10].forEach((week) =>
    add({ semester: "fall", course: "Z523", week, title: "Lead discussion board slot", type: "Group Work", effort: 4, mode: "group", notes: "Default placement for one of four assigned lead discussion weeks; move to the student's group-assigned weeks.", tags: ["group", "discussion", "as-assigned"], asAssigned: true }),
  );
  [4, 6, 9, 11].forEach((week, index) =>
    add({ semester: "fall", course: "Z523", week, title: `Short essay ${index + 1}`, type: "Paper", effort: 3.5, notes: "Syllabus lists four short essays tied to weekly prompts; summer dates were mapped to relative weeks.", tags: ["writing", "essay"] }),
  );
  add({ semester: "fall", course: "Z523", week: 5, title: "Multicultural perspective paper", type: "Paper", effort: 8, notes: "5-7 page paper; original summer due date mapped to relative Week 5.", tags: ["writing", "diversity"] });
  add({ semester: "fall", course: "Z523", week: 8, title: "Group facilitation analysis", type: "Paper", effort: 7, notes: "Watch a group facilitation and complete written analysis; original summer due date mapped to relative Week 8.", tags: ["writing", "practice"] });
  add({ semester: "fall", course: "Z523", week: 12, title: "Group curriculum outline planning", type: "Admin/Planning", effort: 3, graded: false, notes: "Preparation for final 6-week group curriculum outline.", tags: ["planning", "writing"] });
  add({ semester: "fall", course: "Z523", week: 14, title: "Group curriculum outline paper", type: "Paper", effort: 12, notes: "Anchor assignment creating a 6-week group curriculum; original summer due date mapped to final week.", tags: ["writing", "anchor", "group"] });

  // Z520 - Evaluation of Social Work Practice
  addWeeklyEngagement("spring", "Z520", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 2, "Weekly evaluation module engagement");
  add({ semester: "spring", course: "Z520", week: 1, title: "First mandatory Zoom meeting", type: "Admin/Planning", effort: 1.5, notes: "Meeting can occur Week 1 or Week 2.", tags: ["meeting"], asAssigned: true });
  add({ semester: "spring", course: "Z520", week: 2, title: "Letter of agreement draft", type: "Admin/Planning", effort: 2.5, notes: "Draft due by Week 2 or 3.", tags: ["planning", "evaluation"] });
  [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14].forEach((week, index) =>
    add({ semester: "spring", course: "Z520", week, title: `Online quiz ${index + 1}`, type: "Quiz", effort: 1, tags: ["quiz"] }),
  );
  add({ semester: "spring", course: "Z520", week: 3, title: "Video introduction", type: "Reflection", effort: 1.5, tags: ["introduction", "video"] });
  add({ semester: "spring", course: "Z520", week: 3, title: "Reflection paper", type: "Paper", effort: 3, due: "Week 3", tags: ["writing", "reflection"] });
  add({ semester: "spring", course: "Z520", week: 4, title: "Letter of agreement", type: "Admin/Planning", effort: 3, notes: "Final agreement due Week 4 or 5 if possible.", tags: ["planning", "evaluation"] });
  add({ semester: "spring", course: "Z520", week: 5, title: "Project idea short presentation", type: "Presentation", effort: 3.5, notes: "Short presentation with evaluation project ideas.", tags: ["presentation", "evaluation"] });
  add({ semester: "spring", course: "Z520", week: 6, title: "Evaluation project proposal presentation", type: "Presentation", effort: 6, notes: "Panopto recording with PowerPoint slides.", tags: ["presentation", "evaluation"] });
  add({ semester: "spring", course: "Z520", week: 8, title: "Evaluation project proposal paper", type: "Paper", effort: 9, notes: "Syllabus table lists Week 7; schedule lists proposal paper after spring break. Placed in relative Week 8.", tags: ["writing", "evaluation"] });
  add({ semester: "spring", course: "Z520", week: 9, title: "Second mandatory Zoom meeting", type: "Admin/Planning", effort: 1.5, notes: "Meeting can occur Week 8 or Week 9.", tags: ["meeting"], asAssigned: true });
  add({ semester: "spring", course: "Z520", week: 10, title: "Case analysis using a logic model", type: "Applied Activity", effort: 7, notes: "Capstone requirement.", tags: ["capstone", "case", "evaluation"] });
  add({ semester: "spring", course: "Z520", week: 12, title: "Report components and Excel exercises", type: "Applied Activity", effort: 4, tags: ["excel", "evaluation"] });
  add({ semester: "spring", course: "Z520", week: 13, title: "Evaluation presentation preparation", type: "Presentation", effort: 4, graded: false, tags: ["presentation", "prep"] });
  add({ semester: "spring", course: "Z520", week: 14, title: "Evaluation project presentation", type: "Presentation", effort: 8, notes: "Panopto recording with PowerPoint slides.", tags: ["presentation", "evaluation"] });
  add({ semester: "spring", course: "Z520", week: 14, title: "Evaluation project report", type: "Paper", effort: 10, tags: ["writing", "evaluation", "anchor"] });

  // Z524 - Advanced Social Work Practice with Families
  addDiscussion("spring", "Z524", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 1.5, "Weekly family-practice discussion participation");
  addReadingAssessment("spring", "Z524", [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  [3, 6, 9].forEach((week) =>
    add({ semester: "spring", course: "Z524", week, title: "Lead discussion or short essay slot", type: "Paper", effort: 4, notes: "Default placement for group-designated lead discussion/short essay work; move to assigned week.", tags: ["writing", "discussion", "as-assigned"], asAssigned: true }),
  );
  add({ semester: "spring", course: "Z524", week: 5, title: "Family facilitation planning", type: "Admin/Planning", effort: 3, mode: "group", notes: "Family facilitation materials are assigned by family designation.", tags: ["family", "planning", "as-assigned"], asAssigned: true });
  add({ semester: "spring", course: "Z524", week: 8, title: "Family facilitation session", type: "Clinical/Case Practice", effort: 7, mode: "group", notes: "Default placement for assigned family facilitation; move to assigned week/family role.", tags: ["family", "practice", "group", "as-assigned"], asAssigned: true });
  [9, 10].forEach((week) =>
    add({ semester: "spring", course: "Z524", week, title: "Family facilitation observation/member role", type: "Clinical/Case Practice", effort: 3, notes: "Default placement for assigned family member/observer role.", tags: ["family", "practice", "as-assigned"], asAssigned: true }),
  );
  add({ semester: "spring", course: "Z524", week: 11, title: "Family facilitation analysis", type: "Paper", effort: 7, notes: "Estimated from syllabus-described facilitation/observation assignment pattern.", tags: ["writing", "family", "practice"] });
  add({ semester: "spring", course: "Z524", week: 14, title: "Family practice final integration activity", type: "Reflection", effort: 5, notes: "Placeholder for final module/family-practice integration where detailed calendar items were not present in extracted syllabus.", tags: ["reflection", "family"] });

  // Z525 - Advanced Social Work Practice with Communities
  addWeeklyEngagement("spring", "Z525", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 2, "Weekly community-practice module engagement");
  add({ semester: "spring", course: "Z525", week: 1, title: "Welcome introductions", type: "Discussion", effort: 1.5, tags: ["discussion", "introduction"] });
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].forEach((week) =>
    add({ semester: "spring", course: "Z525", week, title: "Participation self-assessment", type: "Reflection", effort: 0.75, tags: ["reflection", "engagement"] }),
  );
  [2, 4, 7, 9, 11, 13].forEach((week, index) =>
    add({ semester: "spring", course: "Z525", week, title: `Discussion forum ${index + 1}`, type: "Discussion", effort: 2, tags: ["discussion", "community"] }),
  );
  add({ semester: "spring", course: "Z525", week: 3, title: "Community Building Proposal topic submission", type: "Admin/Planning", effort: 1.5, tags: ["community", "planning"] });
  add({ semester: "spring", course: "Z525", week: 5, title: "Windshield survey", type: "Applied Activity", effort: 6, tags: ["community", "assessment"] });
  add({ semester: "spring", course: "Z525", week: 5, title: "Group consultation on Community Building Proposal", type: "Group Work", effort: 2, mode: "group", tags: ["group", "community"] });
  add({ semester: "spring", course: "Z525", week: 6, title: "CBP community profile", type: "Paper", effort: 5, tags: ["writing", "community"] });
  add({ semester: "spring", course: "Z525", week: 8, title: "CBP needs and strengths assessment", type: "Paper", effort: 6, tags: ["writing", "community", "assessment"] });
  add({ semester: "spring", course: "Z525", week: 10, title: "Midterm exam", type: "Quiz", effort: 5, tags: ["exam"] });
  add({ semester: "spring", course: "Z525", week: 12, title: "Final Community Building Proposal", type: "Paper", effort: 12, notes: "Anchor assignment; final proposal due Week 12.", tags: ["writing", "community", "anchor"] });
  add({ semester: "spring", course: "Z525", week: 13, title: "Community Building Project final presentation", type: "Presentation", effort: 8, tags: ["presentation", "community"] });
  add({ semester: "spring", course: "Z525", week: 14, title: "Peer response to Community Building Projects", type: "Reflection", effort: 3, tags: ["peer", "community", "reflection"] });

  window.WORKLOAD_DATA = {
    metadata,
    semesterLabels,
    termLabels,
    courses,
    assignments,
    typeColors,
    thresholds: {
      manageable: 30,
      busy: 42,
      high: 55,
    },
  };
})();
