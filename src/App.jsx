import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cgpyguedjmcwlwtqxidu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncHlndWVkam1jd2x3dHF4aWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTcwMDksImV4cCI6MjA5NjU3MzAwOX0.hCFUGrczYYoXcgycsiTL5_BMJ9ExafOoK6MDxaUC4G0";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const ADMIN_PASSWORD = "admin123";
const COLOR_PALETTE = [
  "#FF6B6B","#FF9F43","#F9CA24","#6AB04C","#48DBFB",
  "#54A0FF","#5F27CD","#C56BFF","#FF9FF3","#00D2D3",
  "#1DD1A1","#FD79A8","#E17055","#74B9FF","#A29BFE"
];

function rgb(hex) {
  return `${parseInt(hex.slice(1,3),16)}, ${parseInt(hex.slice(3,5),16)}, ${parseInt(hex.slice(5,7),16)}`;
}
function isAdminUrl() {
  return new URLSearchParams(window.location.search).get("admin") === "true";
}
function pickColor(usedColors) {
  const free = COLOR_PALETTE.filter(c => !usedColors.includes(c));
  const pool = free.length > 0 ? free : COLOR_PALETTE;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function App() {
  const isAdminMode = isAdminUrl();

  // Identity (localStorage)
  const [myName, setMyName] = useState(() => localStorage.getItem("freetime_name") || "");
  const [myColor, setMyColor] = useState(() => localStorage.getItem("freetime_color") || "");
  const [nameInput, setNameInput] = useState("");

  // Rename
  const [showRename, setShowRename] = useState(false);
  const [renameInput, setRenameInput] = useState("");
  const [renameError, setRenameError] = useState("");

  // Admin
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPwInput, setAdminPwInput] = useState("");
  const [adminPwError, setAdminPwError] = useState(false);
  const isAdmin = isAdminMode && adminAuthed;

  // Data from Supabase
  const [people, setPeople] = useState([]); // [{ name, color }]
  const [schedule, setSchedule] = useState({}); // { name: { day: [activity] } }
  const [chatNotes, setChatNotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [view, setView] = useState("home");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventDay, setEventDay] = useState(DAYS[0]);
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");

  const chatLogRef = useRef(null);

  // ---- LOAD ALL DATA ----
  useEffect(() => {
    loadAll();
    // Real-time subscriptions
    const peopleSub = supabase.channel("people_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "people" }, loadPeople)
      .subscribe();
    const scheduleSub = supabase.channel("schedule_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "schedule" }, loadSchedule)
      .subscribe();
    const chatSub = supabase.channel("chat_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat" }, loadChat)
      .subscribe();
    const eventsSub = supabase.channel("events_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, loadEvents)
      .subscribe();
    return () => {
      supabase.removeChannel(peopleSub);
      supabase.removeChannel(scheduleSub);
      supabase.removeChannel(chatSub);
      supabase.removeChannel(eventsSub);
    };
  }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadPeople(), loadSchedule(), loadChat(), loadEvents()]);
    setLoading(false);
  }

  async function loadPeople() {
    const { data } = await supabase.from("people").select("*").order("created_at");
    if (data) setPeople(data);
  }

  async function loadSchedule() {
    const { data } = await supabase.from("schedule").select("*").order("created_at");
    if (data) {
      const map = {};
      data.forEach(r => {
        if (!map[r.person_name]) map[r.person_name] = {};
        if (!map[r.person_name][r.day]) map[r.person_name][r.day] = [];
        map[r.person_name][r.day].push({ id: r.id, text: r.activity });
      });
      setSchedule(map);
    }
  }

  async function loadChat() {
    const { data } = await supabase.from("chat").select("*").order("created_at");
    if (data) setChatNotes(data);
  }

  async function loadEvents() {
    const { data } = await supabase.from("events").select("*").order("created_at");
    if (data) setEvents(data);
  }

  // Scroll chat to bottom when chat loads or new message arrives
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatNotes, view]);

  // ---- IDENTITY ----
  function saveIdentity(name, color) {
    localStorage.setItem("freetime_name", name);
    localStorage.setItem("freetime_color", color);
    setMyName(name);
    setMyColor(color);
  }

  async function submitName() {
    const name = nameInput.trim();
    if (!name) return;
    const existing = people.find(p => p.name === name);
    if (existing) {
      // Name taken by someone else — don't allow
      return;
    }
    const usedColors = people.map(p => p.color);
    const color = pickColor(usedColors);
    const { error } = await supabase.from("people").insert({ name, color });
    if (!error) {
      saveIdentity(name, color);
      setNameInput("");
    }
  }

  async function doRename() {
    const newName = renameInput.trim();
    if (!newName) return;
    if (newName === myName) { setShowRename(false); setRenameInput(""); return; }
    if (people.find(p => p.name === newName)) { setRenameError("That name is already taken"); return; }

    const oldName = myName;
    const color = myColor;

    // Update people table
    await supabase.from("people").update({ name: newName }).eq("name", oldName);
    // Update schedule table
    await supabase.from("schedule").update({ person_name: newName }).eq("person_name", oldName);
    // Update chat table
    await supabase.from("chat").update({ person_name: newName }).eq("person_name", oldName);
    // Update events joiners — fetch all events and update arrays containing oldName
    const { data: evData } = await supabase.from("events").select("*");
    if (evData) {
      for (const ev of evData) {
        if (ev.joiners && ev.joiners.includes(oldName)) {
          const newJoiners = ev.joiners.map(j => j === oldName ? newName : j);
          await supabase.from("events").update({ joiners: newJoiners }).eq("id", ev.id);
        }
      }
    }

    saveIdentity(newName, color);
    setShowRename(false);
    setRenameInput("");
    setRenameError("");
  }

  async function deletePerson(name) {
    await supabase.from("schedule").delete().eq("person_name", name);
    await supabase.from("people").delete().eq("name", name);
    if (myName === name) {
      localStorage.removeItem("freetime_name");
      localStorage.removeItem("freetime_color");
      setMyName(""); setMyColor("");
    }
  }

  // ---- SCHEDULE ----
  async function addActivity(person, day) {
    const val = (inputValues[day] || "").trim();
    if (!val) return;
    await supabase.from("schedule").insert({ person_name: person, day, activity: val });
    setInputValues(v => ({ ...v, [day]: "" }));
  }

  async function removeActivity(activityId) {
    await supabase.from("schedule").delete().eq("id", activityId);
  }

  // ---- CHAT ----
  async function sendNote() {
    const text = chatInput.trim();
    const name = isAdmin ? "Admin" : myName;
    const color = isAdmin ? "#5F27CD" : myColor;
    if (!name || !text) return;
    await supabase.from("chat").insert({ person_name: name, color, message: text });
    setChatInput("");
  }

  async function clearChat() {
    await supabase.from("chat").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }

  // ---- EVENTS ----
  async function createEvent() {
    const name = eventName.trim();
    if (!name || !eventStartTime) return;
    await supabase.from("events").insert({
      name, day: eventDay, start_time: eventStartTime,
      end_time: eventEndTime || null, joiners: []
    });
    setEventName(""); setEventStartTime(""); setEventEndTime(""); setShowEventForm(false);
  }

  async function deleteEvent(id) {
    await supabase.from("events").delete().eq("id", id);
  }

  async function toggleJoin(eventId) {
    if (!myName) return;
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;
    const already = ev.joiners && ev.joiners.includes(myName);
    const newJoiners = already
      ? ev.joiners.filter(j => j !== myName)
      : [...(ev.joiners || []), myName];
    await supabase.from("events").update({ joiners: newJoiners }).eq("id", eventId);
  }

  // Color lookup — from people array (source of truth is DB)
  function getColor(name) {
    if (name === myName && myColor) return myColor;
    const p = people.find(x => x.name === name);
    return p ? p.color : "#999";
  }

  const sortedPeople = myName
    ? [people.find(p => p.name === myName), ...people.filter(p => p.name !== myName)].filter(Boolean)
    : people;

  // ---- ADMIN PASSWORD GATE ----
  if (isAdminMode && !adminAuthed) return (
    <div style={s.page}>
      <div style={s.hero}>
        <div style={s.heroIcon}>🔒</div>
        <h1 style={s.title}>Admin Access</h1>
        <p style={s.subtitle}>Enter the admin password</p>
      </div>
      <div style={s.card}>
        <input style={s.input} type="password" placeholder="Password..."
          value={adminPwInput}
          onChange={e => { setAdminPwInput(e.target.value); setAdminPwError(false); }}
          onKeyDown={e => { if (e.key === "Enter") { if (adminPwInput === ADMIN_PASSWORD) setAdminAuthed(true); else setAdminPwError(true); } }}
        />
        {adminPwError && <p style={{ color: "#e74c3c", fontSize: 13, marginTop: 8 }}>Wrong password</p>}
        <button style={{ ...s.btnPrimary, width: "100%", marginTop: 10 }} onClick={() => {
          if (adminPwInput === ADMIN_PASSWORD) setAdminAuthed(true); else setAdminPwError(true);
        }}>Enter</button>
      </div>
    </div>
  );

  // ---- LOADING ----
  if (loading) return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={s.heroIcon}>🕐</div>
      <p style={{ color: "#888", fontSize: 15 }}>Loading...</p>
    </div>
  );

  // ---- IDENTITY GATE ----
  if (!isAdmin && !myName) return (
    <div style={s.page}>
      <div style={s.hero}>
        <div style={s.heroIcon}>🕐</div>
        <h1 style={s.title}>Freetime Terminal</h1>
        <p style={s.subtitle}>Find when everyone can hang out</p>
        <p style={s.madeBy}>made by o5-1 who is benedict albert pertamina</p>
      </div>
      <div style={s.card}>
        <p style={s.label}>Who are you?</p>
        <div style={s.row}>
          <input style={s.input} placeholder="Enter your name..."
            value={nameInput} onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submitName()} />
          <button style={s.btnPrimary} onClick={submitName}>Join</button>
        </div>
        {people.length > 0 && nameInput && people.find(p => p.name === nameInput.trim()) && (
          <p style={{ color: "#e74c3c", fontSize: 13, marginTop: 8 }}>That name is already taken</p>
        )}
        {people.length > 0 && (
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 12 }}>
            Already joined: {people.map(p => p.name).join(", ")}
          </p>
        )}
      </div>
    </div>
  );

  // ---- SCHEDULE VIEW ----
  if (view === "schedule") {
    const person = selectedPerson;
    const color = getColor(person);
    const isOwn = person === myName;
    const personSchedule = schedule[person] || {};
    return (
      <div style={s.page}>
        <div style={s.topBar}>
          <button style={s.back} onClick={() => setView("home")}>← Back</button>
          <span style={{ ...s.badge, background: color }}>{person}</span>
          {isOwn && <span style={{ fontSize: 12, color: "#888" }}>(you)</span>}
        </div>
        <p style={s.hint2}>{isOwn ? "Add your activities for each day (leave blank if free)" : `Viewing ${person}'s schedule`}</p>
        {DAYS.map(day => (
          <div key={day} style={s.dayBlock}>
            <div style={s.dayLabel}>{day}</div>
            <div style={s.bubbles}>
              {(personSchedule[day] || []).length === 0 && !isOwn
                ? <span style={s.free}>free</span>
                : (personSchedule[day] || []).map((act, i) => (
                  <div key={act.id} style={{ ...s.bubble, background: `rgba(${rgb(color)},0.18)`, borderColor: color }}>
                    {act.text}
                    {isOwn && <button style={s.x} onClick={() => removeActivity(act.id)}>×</button>}
                  </div>
                ))
              }
            </div>
            {isOwn && (
              <div style={s.row}>
                <input style={{ ...s.inputSm, flex: 1 }} placeholder="e.g. Football 3–5pm"
                  value={inputValues[day] || ""}
                  onChange={e => setInputValues(v => ({ ...v, [day]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addActivity(person, day)} />
                <button style={{ ...s.btnSmall, background: color }} onClick={() => addActivity(person, day)}>+</button>
              </div>
            )}
          </div>
        ))}
        <button style={s.bigBtn} onClick={() => setView("home")}>Done ✓</button>
      </div>
    );
  }

  // ---- HOME ----
  if (view === "home") {
    const displayName = isAdmin ? "Admin" : myName;
    const barColor = isAdmin ? "#5F27CD" : myColor;
    return (
      <div style={s.page}>
        <div style={s.hero}>
          <div style={s.heroIcon}>🕐</div>
          <h1 style={s.title}>Freetime Terminal</h1>
          <p style={s.subtitle}>Find when everyone can hang out</p>
          <p style={s.madeBy}>made by o5-1 who is benedict albert pertamina</p>
        </div>

        {/* Identity bar */}
        <div style={s.identityBar}>
          <span style={{ ...s.dot, background: barColor, width: 12, height: 12 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>
            You're <strong>{displayName}</strong>{isAdmin ? " 🔑" : ""}
          </span>
          {!isAdmin && (
            <button style={s.renameBtn} onClick={() => { setShowRename(v => !v); setRenameInput(myName); setRenameError(""); }}>
              {showRename ? "Cancel" : "Rename"}
            </button>
          )}
        </div>

        {/* Rename form */}
        {showRename && !isAdmin && (
          <div style={s.renameBox}>
            <p style={{ fontSize: 13, color: "#555", marginTop: 0, marginBottom: 8 }}>
              Your schedule, chat messages, and event joins will all update to the new name.
            </p>
            <div style={s.row}>
              <input style={s.input} placeholder="New name..."
                value={renameInput} onChange={e => { setRenameInput(e.target.value); setRenameError(""); }}
                onKeyDown={e => e.key === "Enter" && doRename()} />
              <button style={s.btnPrimary} onClick={doRename}>Save</button>
            </div>
            {renameError && <p style={{ color: "#e74c3c", fontSize: 12, marginTop: 6, marginBottom: 0 }}>{renameError}</p>}
          </div>
        )}

        {/* People list */}
        <div style={s.card}>
          <p style={s.label}>Who's in?</p>
          {people.length === 0 && <p style={{ fontSize: 13, color: "#aaa" }}>No one yet — be the first!</p>}
          {sortedPeople.map(p => {
            const isMe = p.name === myName;
            return (
              <div key={p.name} style={{
                ...s.personChip,
                background: isMe ? `rgba(${rgb(p.color)}, 0.15)` : "#fafafa",
                borderColor: isMe ? p.color : "#e8e8e8",
              }}>
                <span style={{ ...s.dot, background: p.color }} />
                <span style={s.personName}>
                  {p.name}{isMe ? <span style={{ fontSize: 11, color: "#888", marginLeft: 4 }}>(you)</span> : ""}
                </span>
                {isMe
                  ? <button style={s.editBtn} onClick={() => { setSelectedPerson(p.name); setView("schedule"); }}>Edit</button>
                  : <button style={s.viewBtn} onClick={() => { setSelectedPerson(p.name); setView("schedule"); }}>View</button>
                }
                {isAdmin && <button style={s.deleteBtn} onClick={() => deletePerson(p.name)}>🗑</button>}
              </div>
            );
          })}
        </div>

        {people.length >= 2 && (
          <button style={s.bigBtn} onClick={() => setView("calendar")}>See when we're free →</button>
        )}
        {people.length === 1 && <p style={s.hint}>More friends need to join to find overlap 👆</p>}
      </div>
    );
  }

  // ---- CALENDAR ----
  if (view === "calendar") {
    const eventsByDay = {};
    events.forEach(ev => { if (!eventsByDay[ev.day]) eventsByDay[ev.day] = []; eventsByDay[ev.day].push(ev); });

    return (
      <div style={s.page}>
        <div style={s.topBar}>
          <button style={s.back} onClick={() => setView("home")}>← Back</button>
          <span style={s.pageTitle}>Group Schedule</span>
        </div>

        {/* Create Event */}
        <div style={s.eventSection}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showEventForm ? 10 : 0 }}>
            <span style={s.sectionTitle}>📅 Events</span>
            <button style={s.btnCreate} onClick={() => setShowEventForm(v => !v)}>
              {showEventForm ? "Cancel" : "+ Create Event"}
            </button>
          </div>
          {showEventForm && (
            <div style={s.eventForm}>
              <input style={{ ...s.inputSm, marginBottom: 8, width: "100%", boxSizing: "border-box" }}
                placeholder="Event name (e.g. Ping Pong)" value={eventName} onChange={e => setEventName(e.target.value)} />
              <div style={{ marginBottom: 8 }}>
                <select style={{ ...s.inputSm, width: "100%", boxSizing: "border-box" }} value={eventDay} onChange={e => setEventDay(e.target.value)}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ ...s.row, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Start time</div>
                  <input style={{ ...s.inputSm, width: "100%", boxSizing: "border-box" }} type="time" value={eventStartTime} onChange={e => setEventStartTime(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>End time</div>
                  <input style={{ ...s.inputSm, width: "100%", boxSizing: "border-box" }} type="time" value={eventEndTime} onChange={e => setEventEndTime(e.target.value)} />
                </div>
              </div>
              <button style={{ ...s.btnPrimary, width: "100%" }} onClick={createEvent}>Create Event</button>
            </div>
          )}
        </div>

        {/* Days */}
        <div style={s.calGrid}>
          {DAYS.map(day => {
            const dayEvents = eventsByDay[day] || [];
            return (
              <div key={day} style={s.calDay}>
                <div style={s.calDayName}>{day}</div>
                {sortedPeople.map(p => {
                  const acts = schedule[p.name]?.[day] || [];
                  const isMe = p.name === myName;
                  return (
                    <div key={p.name} style={s.calPerson}>
                      <span style={{ ...s.dot, background: p.color }} />
                      <span style={{ ...s.calPersonName, fontWeight: isMe ? 700 : 600 }}>{p.name}:</span>
                      {acts.length === 0
                        ? <span style={s.free}>free</span>
                        : acts.map((a, i) => <span key={i} style={{ ...s.calBubble, background: `rgba(${rgb(p.color)},0.18)`, borderColor: p.color }}>{a.text}</span>)
                      }
                    </div>
                  );
                })}

                {dayEvents.length > 0 && (
                  <div style={{ marginTop: 10, borderTop: "1px dashed #e0e0e0", paddingTop: 10 }}>
                    {dayEvents.map(ev => {
                      const amJoined = myName && ev.joiners && ev.joiners.includes(myName);
                      const timeLabel = ev.end_time ? `${ev.start_time} – ${ev.end_time}` : ev.start_time;
                      return (
                        <div key={ev.id} style={s.eventCard}>
                          <div style={s.eventHeader}>
                            <span style={s.eventEmoji}>🎯</span>
                            <span style={s.eventTitle}>{ev.name}</span>
                            <span style={s.eventTime}>{timeLabel}</span>
                            {isAdmin && <button style={s.deleteEventBtn} onClick={() => deleteEvent(ev.id)}>🗑</button>}
                          </div>
                          <div style={s.joiners}>
                            {(!ev.joiners || ev.joiners.length === 0)
                              ? <span style={s.noJoiners}>No one joined yet</span>
                              : ev.joiners.map((j, i) => {
                                const jc = getColor(j);
                                return (
                                  <span key={i} style={{ ...s.joinerChip, background: `rgba(${rgb(jc)},0.18)`, borderColor: jc }}>
                                    <span style={{ ...s.dot, background: jc, width: 7, height: 7 }} />{j}
                                  </span>
                                );
                              })
                            }
                          </div>
                          {myName && !isAdmin && (
                            <button
                              style={{ ...s.joinBtn, background: amJoined ? "#fee" : "#e9f7ee", color: amJoined ? "#e74c3c" : "#28a745", borderColor: amJoined ? "#e74c3c" : "#28a745" }}
                              onClick={() => toggleJoin(ev.id)}>
                              {amJoined ? "Unjoin" : "Join"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Chat */}
        <div style={s.chatBox}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={s.chatTitle}>💬 Arrange a hangout</span>
            {isAdmin && <button style={s.clearChatBtn} onClick={clearChat}>Clear chat</button>}
          </div>
          <div ref={chatLogRef} style={s.chatLog}>
            {chatNotes.length === 0 && <p style={s.chatEmpty}>No messages yet — be the first!</p>}
            {chatNotes.map((n, i) => (
              <div key={n.id || i} style={s.chatMsg}>
                <span style={{ ...s.chatBadge, background: n.color }}>{n.person_name}</span>
                <span style={s.chatText}>{n.message}</span>
              </div>
            ))}
          </div>
          <div style={s.row}>
            <input style={{ ...s.inputSm, flex: 1 }} placeholder="Leave a note..."
              value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendNote()} />
            <button style={s.btnPrimary} onClick={sendNote}>Send</button>
          </div>
        </div>
      </div>
    );
  }
}

const s = {
  page: { maxWidth: 480, margin: "0 auto", padding: "20px 16px 48px", fontFamily: "'Segoe UI', sans-serif", background: "#f7f8fc", minHeight: "100vh" },
  hero: { textAlign: "center", padding: "32px 0 24px" },
  heroIcon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: 800, margin: 0, color: "#1a1a2e", letterSpacing: -1 },
  subtitle: { fontSize: 15, color: "#666", marginTop: 6 },
  madeBy: { fontSize: 11, color: "#bbb", marginTop: 4, fontStyle: "italic" },
  identityBar: { display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 12, padding: "10px 14px", marginBottom: 8, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" },
  renameBtn: { marginLeft: "auto", background: "none", border: "none", fontSize: 12, color: "#5F27CD", cursor: "pointer", fontWeight: 600, textDecoration: "underline", padding: 0 },
  renameBox: { background: "#fff", borderRadius: 12, padding: 14, marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" },
  card: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 16 },
  label: { fontWeight: 700, fontSize: 14, color: "#444", marginBottom: 10, marginTop: 0 },
  row: { display: "flex", gap: 8, alignItems: "center" },
  input: { flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 15, outline: "none", background: "#fafafa", width: "100%", boxSizing: "border-box" },
  inputSm: { padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e0e0e0", fontSize: 14, outline: "none", background: "#fafafa" },
  btnPrimary: { padding: "10px 18px", borderRadius: 10, border: "none", background: "#5F27CD", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  btnSmall: { padding: "8px 14px", borderRadius: 8, border: "none", color: "#fff", fontWeight: 700, fontSize: 18, cursor: "pointer", lineHeight: 1 },
  personChip: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, border: "1.5px solid", marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  personName: { fontWeight: 600, fontSize: 15, flex: 1 },
  editBtn: { padding: "4px 10px", borderRadius: 8, border: "1.5px solid #5F27CD", background: "#f3eeff", fontSize: 12, cursor: "pointer", color: "#5F27CD", fontWeight: 600 },
  viewBtn: { padding: "4px 10px", borderRadius: 8, border: "1.5px solid #ccc", background: "#fff", fontSize: 12, cursor: "pointer", color: "#555" },
  deleteBtn: { padding: "4px 8px", borderRadius: 8, border: "none", background: "#fee", fontSize: 14, cursor: "pointer" },
  bigBtn: { width: "100%", padding: 14, borderRadius: 14, border: "none", background: "#5F27CD", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", marginTop: 8 },
  hint: { textAlign: "center", fontSize: 13, color: "#999", marginTop: 12 },
  topBar: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  back: { background: "none", border: "none", fontSize: 15, cursor: "pointer", color: "#5F27CD", fontWeight: 600, padding: 0 },
  badge: { padding: "4px 14px", borderRadius: 20, color: "#fff", fontWeight: 700, fontSize: 15 },
  pageTitle: { fontWeight: 800, fontSize: 18, color: "#1a1a2e" },
  hint2: { fontSize: 13, color: "#888", marginBottom: 16, marginTop: -8 },
  dayBlock: { background: "#fff", borderRadius: 14, padding: 14, marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" },
  dayLabel: { fontWeight: 700, fontSize: 14, color: "#333", marginBottom: 8 },
  bubbles: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  bubble: { display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, border: "1.5px solid", fontSize: 13, fontWeight: 500 },
  x: { background: "none", border: "none", cursor: "pointer", fontSize: 15, lineHeight: 1, color: "#999", padding: 0, marginLeft: 2 },
  eventSection: { background: "#fff", borderRadius: 14, padding: 14, marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" },
  sectionTitle: { fontWeight: 700, fontSize: 15, color: "#1a1a2e" },
  btnCreate: { padding: "6px 14px", borderRadius: 10, border: "none", background: "#5F27CD", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  eventForm: { background: "#f7f8fc", borderRadius: 10, padding: 12, marginTop: 10 },
  calGrid: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 },
  calDay: { background: "#fff", borderRadius: 14, padding: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" },
  calDayName: { fontWeight: 800, fontSize: 15, color: "#1a1a2e", marginBottom: 8 },
  calPerson: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  calPersonName: { fontSize: 13, color: "#555" },
  free: { fontSize: 12, color: "#28a745", fontWeight: 700, background: "#e9f7ee", padding: "2px 8px", borderRadius: 10 },
  calBubble: { fontSize: 12, padding: "2px 8px", borderRadius: 10, border: "1.5px solid", fontWeight: 500 },
  eventCard: { background: "#f9f5ff", border: "1.5px solid #e0d4ff", borderRadius: 10, padding: 10, marginBottom: 8 },
  eventHeader: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 },
  eventEmoji: { fontSize: 14 },
  eventTitle: { fontWeight: 700, fontSize: 14, flex: 1, color: "#1a1a2e" },
  eventTime: { fontSize: 12, color: "#888", fontWeight: 600 },
  deleteEventBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "0 2px" },
  joiners: { display: "flex", flexWrap: "wrap", gap: 5, minHeight: 22, marginBottom: 6 },
  noJoiners: { fontSize: 12, color: "#aaa" },
  joinerChip: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, padding: "2px 8px", borderRadius: 10, border: "1.5px solid", fontWeight: 600 },
  joinBtn: { padding: "4px 14px", borderRadius: 8, border: "1.5px solid", fontSize: 12, fontWeight: 700, cursor: "pointer", background: "none" },
  chatBox: { background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  chatTitle: { fontWeight: 700, fontSize: 15 },
  chatLog: { height: 220, overflowY: "auto", marginBottom: 12, borderRadius: 8, background: "#fafafa", padding: 10, border: "1px solid #f0f0f0" },
  chatEmpty: { fontSize: 13, color: "#aaa", textAlign: "center", margin: "20px 0" },
  chatMsg: { display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 },
  chatBadge: { color: "#fff", borderRadius: 10, padding: "2px 8px", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  chatText: { fontSize: 14, color: "#333", paddingTop: 2 },
  clearChatBtn: { background: "none", border: "none", fontSize: 12, color: "#e74c3c", cursor: "pointer", fontWeight: 600, textDecoration: "underline", padding: 0 },
};
