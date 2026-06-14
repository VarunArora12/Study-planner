const DAY_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function daysUntilExam(examDate) {
  const today = startOfLocalDay();
  const exam = parseLocalDate(examDate);
  return Math.ceil((exam - today) / DAY_MS);
}

export function parseTopics(rawText) {
  return rawText
    .split(/\n|;|,/)
    .map((topic) =>
      topic
        .trim()
        .replace(/^[-*•]\s+/, "")
        .replace(/^\d+[.)]\s+/, "")
        .trim()
    )
    .filter(Boolean)
    .filter((topic, index, topics) => topics.findIndex((item) => item.toLowerCase() === topic.toLowerCase()) === index);
}

function getRevisionDayCount(totalAvailableDays) {
  if (totalAvailableDays >= 10) return 3;
  if (totalAvailableDays >= 5) return 2;
  if (totalAvailableDays >= 3) return 1;
  return 0;
}

export function buildSchedule({ rawTopics, examDate, hoursPerDay }) {
  const topics = parseTopics(rawTopics);
  const examCountdown = daysUntilExam(examDate);

  if (!topics.length) {
    throw new Error("Add at least one syllabus topic.");
  }

  if (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0) {
    throw new Error("Study hours per day must be greater than zero.");
  }

  if (examCountdown < 1) {
    throw new Error("Choose an exam date after today.");
  }

  const today = startOfLocalDay();
  const totalAvailableDays = examCountdown;
  const revisionDays = getRevisionDayCount(totalAvailableDays);
  const studyDays = Math.max(1, totalAvailableDays - revisionDays);
  const allDates = Array.from({ length: totalAvailableDays }, (_, index) => addDays(today, index));

  const buckets = Array.from({ length: studyDays }, () => []);

  if (topics.length >= studyDays) {
    topics.forEach((topic, index) => {
      buckets[index % studyDays].push(topic);
    });
  } else {
    topics.forEach((topic, index) => {
      const dayIndex = topics.length === 1 ? 0 : Math.round((index * (studyDays - 1)) / (topics.length - 1));
      buckets[dayIndex].push(topic);
    });
  }

  const tasks = [];

  buckets.forEach((bucket, dayIndex) => {
    const dayTopics = bucket.length ? bucket : ["Practice questions and catch-up"];
    const perTopicHours = hoursPerDay / dayTopics.length;

    dayTopics.forEach((topic, topicIndex) => {
      tasks.push({
        title: topic,
        study_date: formatLocalDate(allDates[dayIndex]),
        day_number: dayIndex + 1,
        estimated_hours: Number(perTopicHours.toFixed(2)),
        is_revision: 0,
        sort_order: topicIndex
      });
    });
  });

  for (let index = studyDays; index < totalAvailableDays; index += 1) {
    tasks.push({
      title: index === totalAvailableDays - 1 ? "Final full-syllabus revision" : `Revision set ${index - studyDays + 1}`,
      study_date: formatLocalDate(allDates[index]),
      day_number: index + 1,
      estimated_hours: hoursPerDay,
      is_revision: 1,
      sort_order: 0
    });
  }

  return {
    tasks,
    meta: {
      topicCount: topics.length,
      totalAvailableDays,
      studyDays,
      revisionDays,
      examCountdown
    }
  };
}
