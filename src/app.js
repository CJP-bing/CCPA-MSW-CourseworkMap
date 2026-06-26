const source = window.WORKLOAD_DATA;
const state = {
  assignments: JSON.parse(JSON.stringify(source.assignments)),
  fieldHours: source.metadata.fieldHoursPerWeek,
  jobHours: source.metadata.outsideEffortDefaults.jobHoursPerWeek,
  outsideHours: source.metadata.outsideEffortDefaults.lifeHoursPerWeek,
  dragId: null,
  downloadUrl: null,
  filtersOpen: true,
  collapsedCourses: new Set(),
};

const outsideCourseColor = "#3f4d55";

const els = {
  filterToggle: document.querySelector("#filterToggle"),
  filterDrawer: document.querySelector("#filterDrawer"),
  drawerContent: document.querySelector(".drawer-content"),
  closeFilters: document.querySelector("#closeFilters"),
  semesterFilter: document.querySelector("#semesterFilter"),
  courseFilter: document.querySelector("#courseFilter"),
  typeFilter: document.querySelector("#typeFilter"),
  searchInput: document.querySelector("#searchInput"),
  fieldHoursInput: document.querySelector("#fieldHoursInput"),
  majorOnly: document.querySelector("#majorOnly"),
  groupOnly: document.querySelector("#groupOnly"),
  writingOnly: document.querySelector("#writingOnly"),
  gradedOnly: document.querySelector("#gradedOnly"),
  includeField: document.querySelector("#includeField"),
  includeOutside: document.querySelector("#includeOutside"),
  jobHoursInput: document.querySelector("#jobHoursInput"),
  outsideHoursInput: document.querySelector("#outsideHoursInput"),
  moveMode: document.querySelector("#moveMode"),
  resetBtn: document.querySelector("#resetBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  collapseAllCourses: document.querySelector("#collapseAllCourses"),
  expandAllCourses: document.querySelector("#expandAllCourses"),
  highestWeek: document.querySelector("#highestWeek"),
  overloadWeeks: document.querySelector("#overloadWeeks"),
  visibleItems: document.querySelector("#visibleItems"),
  fieldAssumption: document.querySelector("#fieldAssumption"),
  typeLegend: document.querySelector("#typeLegend"),
  pressureCharts: document.querySelector("#pressureCharts"),
  maps: document.querySelector("#maps"),
  insights: document.querySelector("#insights"),
  detailDialog: document.querySelector("#detailDialog"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogBody: document.querySelector("#dialogBody"),
  closeDialog: document.querySelector("#closeDialog"),
  downloadLink: document.querySelector("#downloadLink"),
};

const weekNumbers = Array.from({ length: source.metadata.weekCount }, (_, i) => i + 1);

function termKey(item) {
  if (item.term) return item.term;
  return `y${item.year || 1}-${item.semester}`;
}

function parseTermKey(term) {
  const match = /^y(\d+)-(fall|spring)$/.exec(term);
  if (!match) return { year: 1, semester: "fall" };
  return { year: Number(match[1]), semester: match[2] };
}

function termLabel(term) {
  return source.termLabels?.[term] || term;
}

function termShortLabel(term, week) {
  const { year, semester } = parseTermKey(term);
  return `Y${year}${semester === "fall" ? "F" : "S"}${week}`;
}

function baseTermKeys() {
  const labeledTerms = Object.keys(source.termLabels || {});
  if (labeledTerms.length) return labeledTerms;
  return [...new Set(source.courses.map(termKey))];
}

function selectedTermKeys() {
  const selected = els.semesterFilter.value;
  const terms = baseTermKeys();
  if (selected === "all") return terms;
  if (selected === "year-1") return terms.filter((term) => term.startsWith("y1-"));
  if (selected === "year-2") return terms.filter((term) => term.startsWith("y2-"));
  return terms.includes(selected) ? [selected] : terms;
}

function outsideCourseId(term) {
  return `OUT-${term.toUpperCase()}`;
}

function init() {
  setFiltersOpen(state.filtersOpen, { focus: false });
  els.fieldHoursInput.value = state.fieldHours.toFixed(1);
  els.jobHoursInput.value = state.jobHours.toFixed(1);
  els.outsideHoursInput.value = state.outsideHours.toFixed(1);
  populateTypeFilter();
  populateCourseFilter();
  renderLegend();
  wireEvents();
  render();
}

function wireEvents() {
  els.filterToggle.addEventListener("click", () => setFiltersOpen(!state.filtersOpen));
  els.closeFilters.addEventListener("click", () => setFiltersOpen(!state.filtersOpen));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.filtersOpen) setFiltersOpen(false, { focus: true });
  });

  [
    els.courseFilter,
    els.typeFilter,
    els.searchInput,
    els.fieldHoursInput,
    els.majorOnly,
    els.groupOnly,
    els.writingOnly,
    els.gradedOnly,
    els.includeField,
    els.jobHoursInput,
    els.outsideHoursInput,
    els.moveMode,
  ].forEach((el) => el.addEventListener("input", render));

  els.includeOutside.addEventListener("input", () => {
    populateCourseFilter();
    render();
  });

  els.semesterFilter.addEventListener("input", () => {
    populateCourseFilter();
    render();
  });

  els.resetBtn.addEventListener("click", () => {
    state.assignments = JSON.parse(JSON.stringify(source.assignments));
    render();
  });

  els.exportBtn.addEventListener("click", exportCsv);
  els.collapseAllCourses.addEventListener("click", () => {
    courseCatalog(true).forEach((course) => state.collapsedCourses.add(courseKey(termKey(course), course.id)));
    render();
  });
  els.expandAllCourses.addEventListener("click", () => {
    state.collapsedCourses.clear();
    render();
  });
  els.closeDialog.addEventListener("click", () => els.detailDialog.close());
  els.detailDialog.addEventListener("click", (event) => {
    if (event.target === els.detailDialog) els.detailDialog.close();
  });
}

function setFiltersOpen(open, options = {}) {
  state.filtersOpen = open;
  document.body.classList.toggle("filters-collapsed", !open);
  els.filterToggle.setAttribute("aria-expanded", String(open));
  els.filterDrawer.dataset.open = String(open);
  els.drawerContent.setAttribute("aria-hidden", String(!open));
  els.drawerContent.toggleAttribute("inert", !open);
  els.drawerContent.hidden = !open;
  els.filterToggle.textContent = open ? "Hide Filters" : "Filters";
  els.closeFilters.setAttribute("aria-label", open ? "Collapse filters" : "Expand filters");
  els.closeFilters.setAttribute("aria-expanded", String(open));
  if (options.focus && open) els.closeFilters.focus();
}

function populateTypeFilter() {
  const types = Object.keys(source.typeColors).sort();
  types.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    els.typeFilter.append(option);
  });
}

function populateCourseFilter() {
  const current = els.courseFilter.value;
  const terms = selectedTermKeys();
  const courses = courseCatalog(els.includeOutside.checked).filter(
    (course) => terms.includes(termKey(course)),
  );
  els.courseFilter.replaceChildren();
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "All courses";
  els.courseFilter.append(all);
  courses.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = `${course.id} - ${course.title}`;
    els.courseFilter.append(option);
  });
  els.courseFilter.value = courses.some((course) => course.id === current) ? current : "all";
}

function renderLegend() {
  const fragment = document.createDocumentFragment();
  Object.entries(source.typeColors).forEach(([type, color]) => {
    const item = document.createElement("span");
    item.className = "legend-pill";
    const swatch = document.createElement("i");
    swatch.className = "swatch";
    swatch.style.background = color;
    item.append(swatch, document.createTextNode(type));
    fragment.append(item);
  });
  els.typeLegend.replaceChildren(fragment);
}

function render() {
  state.fieldHours = Number.parseFloat(els.fieldHoursInput.value) || 0;
  state.jobHours = Number.parseFloat(els.jobHoursInput.value) || 0;
  state.outsideHours = Number.parseFloat(els.outsideHoursInput.value) || 0;
  updateOutsideControls();
  const visible = filteredAssignments();
  const terms = termsToRender();
  renderSummary(visible, terms);
  renderPressure(visible, terms);
  renderMaps(visible, terms);
  renderInsights(visible, terms);
}

function termsToRender() {
  return selectedTermKeys();
}

function courseCatalog(includeOutside = false) {
  const courses = [...source.courses];
  if (!includeOutside) return courses;
  return [...courses, ...baseTermKeys().map(outsideCourse)];
}

function outsideCourse(term) {
  const { year, semester } = parseTermKey(term);
  return {
    id: outsideCourseId(term),
    year,
    semester,
    term,
    title: "Outside Effort",
    color: outsideCourseColor,
    outside: true,
  };
}

function activeAssignments() {
  if (!els.includeOutside.checked) return state.assignments;
  return [...state.assignments, ...outsideAssignments()];
}

function outsideAssignments() {
  const items = [];
  baseTermKeys().forEach((term) => {
    const { year, semester } = parseTermKey(term);
    const courseId = outsideCourseId(term);
    weekNumbers.forEach((week) => {
      if (state.jobHours > 0) {
        items.push(outsideItem({
          term,
          year,
          semester,
          courseId,
          week,
          title: "Paid work / day job",
          type: "Paid Work",
          effort: state.jobHours,
          tags: ["outside", "job", "work"],
          notes: "Recurring weekly job-hour assumption for interview and planning scenarios.",
        }));
      }
      if (state.outsideHours > 0) {
        items.push(outsideItem({
          term,
          year,
          semester,
          courseId,
          week,
          title: "Life, extracurricular, and family commitments",
          type: "Life/Outside Commitments",
          effort: state.outsideHours,
          tags: ["outside", "life", "extracurricular", "family"],
          notes: source.metadata.outsideEffortAssumption,
        }));
      }
    });
  });
  return items;
}

function outsideItem({ term, year, semester, courseId, week, title, type, effort, tags, notes }) {
  return {
    id: `${courseId}-${type.replaceAll(" ", "-")}-${week}`,
    year,
    semester,
    term,
    courseId,
    week,
    originalWeek: week,
    title,
    type,
    effort,
    effortLabel: "Weekly baseline",
    mode: "outside",
    graded: false,
    major: true,
    source: "student reality assumption",
    notes,
    due: "Weekly recurring assumption",
    tags,
    locked: true,
    asAssigned: false,
  };
}

function updateOutsideControls() {
  const disabled = !els.includeOutside.checked;
  [els.jobHoursInput, els.outsideHoursInput].forEach((input) => {
    input.disabled = disabled;
  });
}

function filteredAssignments() {
  const terms = selectedTermKeys();
  const courseId = els.courseFilter.value;
  const type = els.typeFilter.value;
  const query = els.searchInput.value.trim().toLowerCase();
  const includeField = els.includeField.checked;
  return activeAssignments().filter((item) => {
    if (!terms.includes(termKey(item))) return false;
    if (courseId !== "all" && item.courseId !== courseId) return false;
    if (type !== "all" && item.type !== type) return false;
    if (!includeField && item.type === "Field Hours") return false;
    if (els.majorOnly.checked && !item.major) return false;
    if (els.groupOnly.checked && item.mode !== "group") return false;
    if (els.writingOnly.checked && !item.tags.includes("writing")) return false;
    if (els.gradedOnly.checked && !item.graded) return false;
    if (!query) return true;
    const course = getCourse(item.courseId);
    const haystack = [
      item.title,
      item.type,
      item.mode,
      item.notes,
      item.due,
      course?.title,
      course?.id,
      item.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

function getCourse(courseId) {
  return courseCatalog(true).find((course) => course.id === courseId);
}

function itemEffort(item) {
  return item.type === "Field Hours" ? state.fieldHours : item.effort;
}

function renderSummary(visible, terms) {
  const totals = weeklyTotals(visible);
  const flat = terms.flatMap((term) =>
    weekNumbers.map((week) => ({ term, week, total: totals[term]?.[week] || 0 })),
  );
  const highest = flat.sort((a, b) => b.total - a.total)[0];
  const overload = flat.filter((entry) => pressureStatus(entry.total) === "overload");
  els.highestWeek.textContent = highest && highest.total > 0
    ? `${termLabel(highest.term)} W${highest.week}: ${formatEffort(highest.total)}`
    : "-";
  els.overloadWeeks.textContent = overload.length
    ? overload.map((entry) => termShortLabel(entry.term, entry.week)).join(", ")
    : "None";
  els.visibleItems.textContent = String(visible.length);
  els.fieldAssumption.textContent = scenarioAssumptionText();
}

function scenarioAssumptionText() {
  const parts = [];
  parts.push(els.includeField.checked ? `Field ${state.fieldHours.toFixed(1)}/wk` : "Coursework only");
  if (els.includeOutside.checked) {
    parts.push(`Outside ${(state.jobHours + state.outsideHours).toFixed(1)}/wk`);
  }
  return parts.join(" + ");
}

function weeklyTotals(assignments) {
  const totals = Object.fromEntries(baseTermKeys().map((term) => [term, {}]));
  assignments.forEach((item) => {
    const term = termKey(item);
    if (!totals[term]) totals[term] = {};
    totals[term][item.week] = (totals[term][item.week] || 0) + itemEffort(item);
  });
  return totals;
}

function pressureStatus(total) {
  if (total > source.thresholds.high) return "overload";
  if (total > source.thresholds.busy) return "high";
  if (total > source.thresholds.manageable) return "busy";
  return "manageable";
}

function pressureColor(status, alpha = 1) {
  const colors = {
    manageable: `rgba(217, 242, 220, ${alpha})`,
    busy: `rgba(255, 243, 191, ${alpha})`,
    high: `rgba(255, 214, 165, ${alpha})`,
    overload: `rgba(255, 180, 168, ${alpha})`,
  };
  return colors[status];
}

function formatEffort(value) {
  return `${value.toFixed(value % 1 ? 1 : 0)} hrs`;
}

function renderPressure(visible, terms) {
  const totals = weeklyTotals(visible);
  const max = Math.max(1, ...terms.flatMap((term) => weekNumbers.map((week) => totals[term]?.[week] || 0)));
  const fragment = document.createDocumentFragment();

  terms.forEach((term) => {
    const section = document.createElement("div");
    section.className = "pressure-chart";

    const title = document.createElement("div");
    title.className = "chart-title";
    const label = document.createElement("span");
    label.textContent = termLabel(term);
    const count = document.createElement("span");
    const overloadCount = weekNumbers.filter((week) => pressureStatus(totals[term]?.[week] || 0) === "overload").length;
    count.textContent = overloadCount ? `${overloadCount} overload week${overloadCount === 1 ? "" : "s"}` : "No overload weeks";
    title.append(label, count);

    const grid = document.createElement("div");
    grid.className = "bar-grid";
    weekNumbers.forEach((week) => {
      const total = totals[term]?.[week] || 0;
      const status = pressureStatus(total);
      const wrap = document.createElement("div");
      wrap.className = "bar-wrap";

      const bar = document.createElement("button");
      bar.type = "button";
      bar.className = `bar ${status}`;
      bar.style.height = `${Math.max(8, (total / max) * 160)}px`;
      bar.style.background = pressureColor(status);
      bar.title = `${termLabel(term)} Week ${week}: ${formatEffort(total)}`;
      bar.textContent = total ? total.toFixed(0) : "";
      bar.addEventListener("click", () => showWeekDetail(visible, term, week));

      const barLabel = document.createElement("div");
      barLabel.className = "bar-label";
      barLabel.textContent = `W${week}`;
      wrap.append(bar, barLabel);
      grid.append(wrap);
    });

    section.append(title, grid);
    fragment.append(section);
  });

  els.pressureCharts.replaceChildren(fragment);
}

function renderMaps(visible, terms) {
  const fragment = document.createDocumentFragment();
  const totals = weeklyTotals(visible);
  const selectedCourse = els.courseFilter.value;

  terms.forEach((term) => {
    const courses = courseCatalog(els.includeOutside.checked).filter((course) => {
      if (termKey(course) !== term) return false;
      if (selectedCourse !== "all" && course.id !== selectedCourse) return false;
      if (!els.includeField.checked && course.field) return false;
      return true;
    });

    const semesterWrap = document.createElement("div");
    semesterWrap.className = "semester-map";

    const title = document.createElement("div");
    title.className = "semester-title";
    const h3 = document.createElement("h3");
    h3.textContent = termLabel(term);
    const note = document.createElement("span");
    note.textContent = `${courses.length} rows, 14 weeks`;
    title.append(h3, note);

    const scroll = document.createElement("div");
    scroll.className = "grid-scroll";
    const grid = document.createElement("div");
    grid.className = "course-grid";

    const corner = document.createElement("div");
    corner.className = "grid-head corner-head";
    corner.textContent = "Course";
    grid.append(corner);
    weekNumbers.forEach((week) => {
      const head = document.createElement("div");
      head.className = "grid-head";
      head.textContent = `W${week}`;
      grid.append(head);
    });

    courses.forEach((course) => {
      const key = courseKey(term, course.id);
      const collapsed = state.collapsedCourses.has(key);
      const label = document.createElement("div");
      label.className = `course-label${collapsed ? " collapsed-row" : ""}`;
      label.style.setProperty("--course-color", course.color);
      const labelBody = document.createElement("div");
      labelBody.className = "course-label-body";
      const code = document.createElement("span");
      code.className = "course-code";
      code.textContent = course.id;
      const name = document.createElement("div");
      name.className = "course-name";
      name.textContent = course.title;
      const meta = document.createElement("div");
      meta.className = "course-meta";
      meta.textContent = course.field
        ? "Field workload baseline"
        : course.outside
          ? "Student reality assumption"
          : "Syllabus-derived assignments";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "course-toggle";
      toggle.textContent = collapsed ? "+" : "-";
      toggle.setAttribute("aria-label", `${collapsed ? "Expand" : "Collapse"} ${course.id}`);
      toggle.addEventListener("click", () => toggleCourse(term, course.id));
      labelBody.append(code, name, meta);
      label.append(labelBody, toggle);
      grid.append(label);

      weekNumbers.forEach((week) => {
        const total = totals[term]?.[week] || 0;
        const weekItems = visible
          .filter((item) => termKey(item) === term && item.courseId === course.id && item.week === week)
          .sort((a, b) => itemEffort(b) - itemEffort(a));
        const cell = document.createElement("div");
        cell.className = `week-cell${collapsed ? " collapsed-row" : ""}`;
        cell.style.background = pressureColor(pressureStatus(total), 0.38);
        cell.dataset.term = term;
        cell.dataset.course = course.id;
        cell.dataset.week = String(week);
        addDropHandlers(cell);

        if (collapsed) {
          if (weekItems.length) {
            const marker = document.createElement("span");
            marker.className = "collapsed-marker";
            marker.textContent = String(weekItems.length);
            marker.title = `${weekItems.length} visible item${weekItems.length === 1 ? "" : "s"}`;
            cell.append(marker);
          }
        } else {
          weekItems.forEach((item) => cell.append(renderCard(item)));
        }

        grid.append(cell);
      });
    });

    scroll.append(grid);
    semesterWrap.append(title, scroll);
    fragment.append(semesterWrap);
  });

  els.maps.replaceChildren(fragment);
}

function courseKey(term, courseId) {
  return `${term}:${courseId}`;
}

function toggleCourse(term, courseId) {
  const key = courseKey(term, courseId);
  if (state.collapsedCourses.has(key)) {
    state.collapsedCourses.delete(key);
  } else {
    state.collapsedCourses.add(key);
  }
  render();
}

function renderCard(item) {
  const card = document.createElement("article");
  card.className = "assignment-card";
  if (item.locked) card.classList.add("locked");
  card.style.setProperty("--type-color", source.typeColors[item.type] || "#64748b");
  card.draggable = els.moveMode.checked && !item.locked;
  card.dataset.id = item.id;
  card.addEventListener("click", () => showAssignmentDetail(item));
  card.addEventListener("dragstart", (event) => {
    if (!els.moveMode.checked || item.locked) return;
    state.dragId = item.id;
    card.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.id);
  });
  card.addEventListener("dragend", () => {
    state.dragId = null;
    card.classList.remove("dragging");
  });

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title;

  const meta = document.createElement("div");
  meta.className = "card-meta";
  meta.append(pill(item.type), pill(`${formatEffort(itemEffort(item))}`), pill(item.mode));
  if (item.asAssigned) meta.append(pill("as assigned", "as-assigned"));
  if (item.week !== item.originalWeek) meta.append(pill(`moved from W${item.originalWeek}`));

  card.append(title, meta);
  return card;
}

function pill(text, className = "") {
  const span = document.createElement("span");
  span.className = `mini-pill ${className}`.trim();
  span.textContent = text;
  return span;
}

function addDropHandlers(cell) {
  cell.addEventListener("dragover", (event) => {
    if (!els.moveMode.checked || !state.dragId) return;
    const item = state.assignments.find((candidate) => candidate.id === state.dragId);
    if (!item || item.locked || item.courseId !== cell.dataset.course || termKey(item) !== cell.dataset.term) return;
    event.preventDefault();
    cell.classList.add("drop-target");
  });
  cell.addEventListener("dragleave", () => cell.classList.remove("drop-target"));
  cell.addEventListener("drop", (event) => {
    event.preventDefault();
    cell.classList.remove("drop-target");
    const item = state.assignments.find((candidate) => candidate.id === state.dragId);
    if (!item || item.locked || item.courseId !== cell.dataset.course || termKey(item) !== cell.dataset.term) return;
    item.week = Number(cell.dataset.week);
    render();
  });
}

function showAssignmentDetail(item) {
  const course = getCourse(item.courseId);
  els.dialogTitle.textContent = item.title;
  els.dialogBody.replaceChildren(
    detailRow("Course", `${course.id} - ${course.title}`),
    detailRow("Term / Week", `${termLabel(termKey(item))}, Week ${item.week}`),
    detailRow("Type", item.type),
    detailRow("Mode", item.mode),
    detailRow("Effort", `${formatEffort(itemEffort(item))} (${item.effortLabel})`),
    detailRow("Graded", item.graded ? "Yes" : "No / baseline"),
    detailRow("Major", item.major ? "Yes" : "No"),
    detailRow("Due", item.due || "Listed by week in syllabus"),
    detailRow("Tags", item.tags.join(", ") || "None"),
    detailRow("Notes", item.notes || "No additional notes"),
  );
  els.detailDialog.showModal();
}

function showWeekDetail(visible, term, week) {
  const items = visible
    .filter((item) => termKey(item) === term && item.week === week)
    .sort((a, b) => itemEffort(b) - itemEffort(a));
  els.dialogTitle.textContent = `${termLabel(term)} Week ${week}`;
  const total = items.reduce((sum, item) => sum + itemEffort(item), 0);
  const wrapper = document.createElement("div");
  wrapper.className = "week-detail";
  wrapper.append(detailRow("Visible total", formatEffort(total)));
  if (!items.length) {
    wrapper.append(detailRow("Items", "No visible items under current filters."));
  } else {
    const list = document.createElement("ul");
    items.forEach((item) => {
      const course = getCourse(item.courseId);
      const li = document.createElement("li");
      li.textContent = `${course.id}: ${item.title} (${item.type}, ${formatEffort(itemEffort(item))})`;
      list.append(li);
    });
    wrapper.append(list);
  }
  els.dialogBody.replaceChildren(wrapper);
  els.detailDialog.showModal();
}

function detailRow(label, value) {
  const row = document.createElement("div");
  row.className = "detail-row";
  const strong = document.createElement("strong");
  strong.textContent = label;
  const span = document.createElement("span");
  span.textContent = value;
  row.append(strong, span);
  return row;
}

function renderInsights(visible, terms) {
  const totals = weeklyTotals(visible);
  const topWeeks = rankedWeeks(totals, terms).slice(0, 5);
  const allWeeks = rankedWeeks(totals, terms).filter((entry) => entry.total > 0);
  const pressureWeeks = allWeeks.filter((entry) => ["high", "overload"].includes(pressureStatus(entry.total)));
  const overloadWeeks = allWeeks.filter((entry) => pressureStatus(entry.total) === "overload");
  const runs = pressureRuns(totals, terms);
  const highest = topWeeks[0];
  const writingEffort = sumEffort(visible.filter((item) => item.tags.includes("writing")));
  const groupEffort = sumEffort(visible.filter((item) => item.mode === "group" || item.tags.includes("group")));
  const outsideEffort = sumEffort(visible.filter((item) => item.source === "student reality assumption"));
  const termLoads = terms.map((term) => {
    const total = weekNumbers.reduce((sum, week) => sum + (totals[term]?.[week] || 0), 0);
    return `${termLabel(term)} avg ${formatEffort(total / weekNumbers.length)}/wk`;
  });

  const observed = [];
  if (highest && highest.total > 0) {
    observed.push(
      `Highest visible spike: ${termLabel(highest.term)} Week ${highest.week} at ${formatEffort(highest.total)}.`,
    );
  }
  observed.push(`${overloadWeeks.length} overload week${overloadWeeks.length === 1 ? "" : "s"} and ${pressureWeeks.length} high-or-overload week${pressureWeeks.length === 1 ? "" : "s"} in view.`);
  if (runs[0]) observed.push(`Longest pressure stretch: ${formatRun(runs[0])}.`);
  if (termLoads.length) observed.push(termLoads.join("; ") + ".");
  if (writingEffort) observed.push(`Writing-heavy items account for ${formatEffort(writingEffort)} across the current view.`);
  if (groupEffort) observed.push(`Group/coordinated work accounts for ${formatEffort(groupEffort)}.`);
  if (outsideEffort) observed.push(`Student reality assumptions add ${formatEffort(outsideEffort)} across the visible term view.`);

  const drivers = [];
  if (highest && highest.total > 0) {
    visible
      .filter((item) => termKey(item) === highest.term && item.week === highest.week)
      .sort((a, b) => itemEffort(b) - itemEffort(a))
      .slice(0, 5)
      .forEach((item) => drivers.push(`${getCourse(item.courseId).id}: ${item.title} (${formatEffort(itemEffort(item))})`));
  }
  const topTypes = typeEffortSummary(visible)
    .slice(0, 3)
    .map(([type, effort]) => `${type}: ${formatEffort(effort)}`);
  if (topTypes.length) drivers.push(`Top categories by effort: ${topTypes.join(", ")}.`);

  const curriculumIdeas = curriculumSuggestions(visible, totals, terms);

  const notes = [
    source.metadata.fieldAssumption,
    source.metadata.outsideEffortAssumption,
    source.metadata.scoringNote,
    source.metadata.twoYearNote,
    ...source.metadata.extractionNotes,
  ];

  els.insights.replaceChildren(
    insightCard("Observed Patterns", observed),
    insightCard("Current Drivers", drivers),
    insightCard("Curriculum Ideas/Suggestions", curriculumIdeas),
    insightCard("Data Notes", notes),
  );
}

function heading(text) {
  const h3 = document.createElement("h3");
  h3.textContent = text;
  return h3;
}

function insightCard(title, items) {
  const card = document.createElement("div");
  card.className = "insight";
  card.append(heading(title));
  if (!items.length) {
    const empty = document.createElement("p");
    empty.textContent = "No visible data under the current filters.";
    card.append(empty);
    return card;
  }
  const list = document.createElement("ul");
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.append(li);
  });
  card.append(list);
  return card;
}

function rankedWeeks(totals, terms) {
  return terms
    .flatMap((term) =>
      weekNumbers.map((week) => ({
        term,
        week,
        total: totals[term]?.[week] || 0,
      })),
    )
    .sort((a, b) => b.total - a.total);
}

function pressureRuns(totals, terms) {
  const runs = [];
  terms.forEach((term) => {
    let run = null;
    weekNumbers.forEach((week) => {
      const total = totals[term]?.[week] || 0;
      const status = pressureStatus(total);
      if (status === "high" || status === "overload") {
        if (!run) run = { term, start: week, end: week, count: 0, max: 0 };
        run.end = week;
        run.count += 1;
        run.max = Math.max(run.max, total);
      } else if (run) {
        runs.push(run);
        run = null;
      }
    });
    if (run) runs.push(run);
  });
  return runs.sort((a, b) => b.count - a.count || b.max - a.max);
}

function formatRun(run) {
  const weeks = run.start === run.end ? `Week ${run.start}` : `Weeks ${run.start}-${run.end}`;
  return `${termLabel(run.term)} ${weeks} (${run.count} week${run.count === 1 ? "" : "s"}, peak ${formatEffort(run.max)})`;
}

function sumEffort(items) {
  return items.reduce((sum, item) => sum + itemEffort(item), 0);
}

function typeEffortSummary(items) {
  const totals = new Map();
  items.forEach((item) => {
    totals.set(item.type, (totals.get(item.type) || 0) + itemEffort(item));
  });
  return [...totals.entries()].sort((a, b) => b[1] - a[1]);
}

function curriculumSuggestions(visible, totals, terms) {
  const ideas = [];
  const allWeeks = rankedWeeks(totals, terms).filter((entry) => entry.total > 0);
  const overload = allWeeks.find((entry) => pressureStatus(entry.total) === "overload");
  const runs = pressureRuns(totals, terms);
  const move = bestMove(visible, totals, terms);
  const groupPressureCount = visible.filter((item) => {
    if (item.type === "Field Hours") return false;
    if (item.mode !== "group" && !item.tags.includes("group")) return false;
    return ["high", "overload"].includes(pressureStatus(totals[termKey(item)]?.[item.week] || 0));
  }).length;

  if (overload) {
    ideas.push(
      `Start with ${termLabel(overload.term)} Week ${overload.week}; it is ${formatEffort(overload.total - source.thresholds.high)} above the overload threshold.`,
    );
  }
  if (runs[0] && runs[0].count > 1) {
    ideas.push(`Break up ${formatRun(runs[0])} by moving one major paper, presentation, or role-play deliverable earlier or later.`);
  }
  if (move) {
    ideas.push(
      `Pilot move: shift "${move.item.title}" in ${getCourse(move.item.courseId).id} from Week ${move.item.week} to Week ${move.week}; that target week is currently ${formatEffort(move.targetTotal)}.`,
    );
  }
  if (groupPressureCount) {
    ideas.push(`${groupPressureCount} group/coordinated item${groupPressureCount === 1 ? "" : "s"} land in high-pressure weeks; protect those deadlines from peak individual writing weeks.`);
  }
  if (els.includeField.checked && state.fieldHours > 0) {
    ideas.push(`Keep field hours visible when tinkering; the fixed ${state.fieldHours.toFixed(1)} hrs/wk baseline is the main reason moderate academic weeks become pressure weeks.`);
  }
  if (els.includeOutside.checked && state.jobHours + state.outsideHours > 0) {
    ideas.push(`Use the outside-effort controls during interviews to compare coursework-only, field-inclusive, part-time job, and full-time job scenarios.`);
  }
  if (!ideas.length) {
    ideas.push("No obvious pressure move stands out under the current filters. Open more courses or turn on field hours to test a broader schedule.");
  }
  return ideas.slice(0, 4);
}

function bestMove(visible, totals, terms) {
  const candidates = visible
    .filter((item) => !item.locked && item.major && item.type !== "Field Hours")
    .map((item) => ({
      item,
      currentTotal: totals[termKey(item)]?.[item.week] || 0,
    }))
    .filter((entry) => terms.includes(termKey(entry.item)))
    .sort((a, b) => b.currentTotal - a.currentTotal || itemEffort(b.item) - itemEffort(a.item));

  for (const { item } of candidates) {
    const termTotals = totals[termKey(item)] || {};
    const lowerWeek = weekNumbers
      .filter((week) => week !== item.week)
      .map((week) => ({ week, total: termTotals[week] || 0 }))
      .sort((a, b) => a.total - b.total)[0];
    if (lowerWeek && (termTotals[item.week] || 0) - lowerWeek.total > itemEffort(item) * 0.5) {
      return { item, week: lowerWeek.week, targetTotal: lowerWeek.total };
    }
  }
  return null;
}

function exportCsv() {
  const visible = filteredAssignments();
  const headers = [
    "year",
    "term",
    "semester",
    "course_id",
    "course_title",
    "week",
    "original_week",
    "title",
    "type",
    "mode",
    "effort_hours",
    "graded",
    "major",
    "due",
    "notes",
    "tags",
  ];
  const rows = visible.map((item) => {
    const course = getCourse(item.courseId);
    return [
      item.year,
      termLabel(termKey(item)),
      item.semester,
      item.courseId,
      course.title,
      item.week,
      item.originalWeek,
      item.title,
      item.type,
      item.mode,
      itemEffort(item).toFixed(1),
      item.graded ? "yes" : "no",
      item.major ? "yes" : "no",
      item.due,
      item.notes,
      item.tags.join("|"),
    ];
  });
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  if (state.downloadUrl) URL.revokeObjectURL(state.downloadUrl);
  const url = URL.createObjectURL(blob);
  state.downloadUrl = url;
  els.downloadLink.href = url;
  els.downloadLink.download = "msw-two-year-workload-map.csv";
  els.downloadLink.hidden = false;
  els.downloadLink.textContent = "CSV ready";
  const link = document.createElement("a");
  link.href = url;
  link.download = "msw-two-year-workload-map.csv";
  document.body.append(link);
  link.click();
  link.remove();
}

init();
