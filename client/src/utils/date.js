export const formatDate = (value) => {
  if (!value) {
    return "No due date";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === "done") {
    return false;
  }
  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return due < today;
};

export const toInputDate = (value) => {
  if (!value) {
    return "";
  }
  return String(value).slice(0, 10);
};
