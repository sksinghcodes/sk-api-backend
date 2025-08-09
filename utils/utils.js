export const getDateDetails = (date) => {
  let isLastDate = false;
  let getMonthlyTasksFrom = [];
  let getYearlyTasksFrom = [];

  const monthlyDate = date.getDate();
  const yearlyDate = date.getMonth() * 100 + monthlyDate;

  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + 1);

  if (nextDate.getDate() === 1) {
    isLastDate = true;
  }

  if (isLastDate) {
    if (monthlyDate === 28) {
      getMonthlyTasksFrom.push(29, 30, 31);
      getYearlyTasksFrom.push(129);
    } else if (monthlyDate === 30) {
      getMonthlyTasksFrom.push(31);
    }
  }

  return {
    dayOfWeek: date.getDay(),
    monthlyDate,
    yearlyDate,
    getMonthlyTasksFrom,
    getYearlyTasksFrom,
    nextDate,
  };
};

export const validateDate = (dateStr) => {
  const [y, m, d] = dateStr.split("_");
  const [yn, mn, dn] = [Number(y), Number(m), Number(d)];
  const isValidDate = mn >= 1 && mn <= 31;
  const isValidMonth = dn >= 1 && dn <= 12;

  if (
    typeof dateStr !== "string" ||
    dateStr.length !== 10 ||
    y.length !== 4 ||
    m.length !== 2 ||
    d.length !== 2 ||
    isNaN(yn) ||
    !isValidMonth ||
    !isValidDate
  ) {
    return {
      isValid: false,
      message: "Invalid format. Expected YYYY_MM_DD",
    };
  }

  const date = new Date(yn, mn - 1, dn);

  if (
    yn !== date.getFullYear() ||
    mn !== date.getMonth() + 1 ||
    dn !== date.getDate()
  ) {
    return {
      isValid: false,
      message: "Invalid calendar date",
    };
  }

  return {
    isValid: true,
    date,
  };
};
