(function () {
  const scheduleStorageKey = "ajs-training-schedule";

  function isSupabaseEnabled() {
    return Boolean(
      window.APP_CONFIG &&
        window.APP_CONFIG.useSupabase &&
        window.APP_CONFIG.supabaseUrl &&
        window.APP_CONFIG.supabaseAnonKey &&
        window.supabase
    );
  }

  function getSupabaseClient() {
    if (!isSupabaseEnabled()) {
      return null;
    }

    if (!window.__ajsSupabaseClient) {
      window.__ajsSupabaseClient = window.supabase.createClient(
        window.APP_CONFIG.supabaseUrl,
        window.APP_CONFIG.supabaseAnonKey
      );
    }

    return window.__ajsSupabaseClient;
  }

  function loadLocalSchedule() {
    try {
      const saved = localStorage.getItem(scheduleStorageKey);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      return {};
    }
  }

  function saveLocalSchedule(schedule) {
    localStorage.setItem(scheduleStorageKey, JSON.stringify(schedule));
  }

  function groupRowsByDate(rows) {
    return rows.reduce((accumulator, row) => {
      const dateKey = row.session_date;
      if (!accumulator[dateKey]) {
        accumulator[dateKey] = [];
      }

      accumulator[dateKey].push({
        id: row.id || `${dateKey}-${row.start_time}-${row.end_time}`,
        start: row.start_time,
        end: row.end_time,
        label: row.label,
      });
      return accumulator;
    }, {});
  }

  async function getSlotsForDate(dateKey) {
    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("availability_slots")
        .select("id, session_date, start_time, end_time, label")
        .eq("session_date", dateKey)
        .order("start_time", { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map((row) => ({
        id: row.id,
        start: row.start_time,
        end: row.end_time,
        label: row.label,
      }));
    }

    const schedule = loadLocalSchedule();
    return schedule[dateKey] || [];
  }

  async function getSlotsForRange(startDate, endDate) {
    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("availability_slots")
        .select("id, session_date, start_time, end_time, label")
        .gte("session_date", startDate)
        .lte("session_date", endDate)
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        throw error;
      }

      return groupRowsByDate(data || []);
    }

    const schedule = loadLocalSchedule();
    const filtered = {};
    Object.keys(schedule).forEach((dateKey) => {
      if (dateKey >= startDate && dateKey <= endDate) {
        filtered[dateKey] = schedule[dateKey];
      }
    });
    return filtered;
  }

  async function invokeAvailabilityFunction(payload) {
    const client = getSupabaseClient();
    const { data, error } = await client.functions.invoke(
      window.APP_CONFIG.manageAvailabilityFunction,
      {
        body: payload,
      }
    );

    if (error) {
      throw error;
    }

    return data;
  }

  async function addSlotsToDates(dates, session, passcode) {
    if (isSupabaseEnabled()) {
      return invokeAvailabilityFunction({
        action: "upsert_dates",
        passcode,
        dates,
        session,
      });
    }

    const schedule = loadLocalSchedule();
    dates.forEach((dateKey) => {
      const existingSessions = schedule[dateKey] || [];
      const duplicate = existingSessions.some(
        (item) => item.start === session.start && item.end === session.end
      );

      if (!duplicate) {
        schedule[dateKey] = [...existingSessions, session].sort((a, b) =>
          a.start.localeCompare(b.start)
        );
      }
    });
    saveLocalSchedule(schedule);
    return { success: true };
  }

  async function clearWeek(startDate, endDate, passcode) {
    if (isSupabaseEnabled()) {
      return invokeAvailabilityFunction({
        action: "clear_range",
        passcode,
        startDate,
        endDate,
      });
    }

    const schedule = loadLocalSchedule();
    Object.keys(schedule).forEach((dateKey) => {
      if (dateKey >= startDate && dateKey <= endDate) {
        delete schedule[dateKey];
      }
    });
    saveLocalSchedule(schedule);
    return { success: true };
  }

  async function clearDate(dateKey, passcode) {
    if (isSupabaseEnabled()) {
      return invokeAvailabilityFunction({
        action: "clear_date",
        passcode,
        date: dateKey,
      });
    }

    const schedule = loadLocalSchedule();
    delete schedule[dateKey];
    saveLocalSchedule(schedule);
    return { success: true };
  }

  window.scheduleStore = {
    isSupabaseEnabled,
    getSlotsForDate,
    getSlotsForRange,
    addSlotsToDates,
    clearWeek,
    clearDate,
  };
})();
