import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cgpyguedjmcwlwtqxidu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncHlndWVkam1jd2x3dHF4aWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTcwMDksImV4cCI6MjA5NjU3MzAwOX0.hCFUGrczYYoXcgycsiTL5_BMJ9ExafOoK6MDxaUC4G0";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const ADMIN_PASSWORD = "admin$888";
const COLOR_PALETTE = [
  "#FF6B6B","#FF9F43","#F9CA24","#6AB04C","#48DBFB",
  "#54A0FF","#5F27CD","#C56BFF","#FF9FF3","#00D2D3",
  "#1DD1A1","#FD79A8","#E17055","#74B9FF","#A29BFE"
];
const GROUP_COLORS = [
  "#FF6B6B","#FF9F43","#F9CA24","#6AB04C","#48DBFB",
  "#54A0FF","#5F27CD","#C56BFF","#FF9FF3","#00D2D3",
  "#1DD1A1","#FD79A8","#E17055","#74B9FF","#A29BFE",
  "#2d3436","#636e72","#b2bec3","#fdcb6e","#6c5ce7"
];

function rgb(hex) {
  const h = hex.replace("#","");
  return `${parseInt(h.slice(0,2),16)}, ${parseInt(h.slice(2,4),16)}, ${parseInt(h.slice(4,6),16)}`;
}
function isAdminUrl() {
  return new URLSearchParams(window.location.search).get("admin") === "true";
}
function pickColor(usedColors) {
  const free = COLOR_PALETTE.filter(c => !usedColors.includes(c));
  const pool = free.length > 0 ? free : COLOR_PALETTE;
  return pool[Math.floor(Math.random() * pool.length)];
}
function contrastColor(hex) {
  if (!hex) return "#fff";
  const h = hex.replace("#","");
  const r = parseInt(h.slice(0,2),16);
  const g = parseInt(h.slice(2,4),16);
  const b = parseInt(h.slice(4,6),16);
  const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
  return lum > 0.6 ? "#1a1a2e" : "#ffffff";
}

// ─── FLIP CARD COMPONENT ───────────────────────────────────────────────────────
function GroupCard({ group, isMember, myName, onJoin, onClick }) {
  const [flipped, setFlipped] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const color = group.color || "#5F27CD";
  const textColor = contrastColor(color);
  const isFull = group.max_members && group.member_count >= group.max_members;

  function handleCardClick() {
    if (isMember) { onClick(); return; }
    if (isFull) return;
    setFlipped(true); setPwInput(""); setPwError(false);
  }

  function handleJoin() {
    if (group.password && pwInput !== group.password) { setPwError(true); return; }
    onJoin(group.id);
    setFlipped(false);
  }

  function handleLater() { setFlipped(false); setPwInput(""); setPwError(false); }

  return (
    <div style={cs.cardScene} onClick={!flipped ? handleCardClick : undefined}>
      <div style={{ ...cs.cardInner, transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
        {/* FRONT */}
        <div style={{
          ...cs.cardFace, ...cs.cardFront,
          background: isMember ? `linear-gradient(135deg, rgba(${rgb(color)},0.18), rgba(${rgb(color)},0.08))` : "#fff",
          borderColor: isMember ? color : "#e8e8e8",
          borderWidth: isMember ? 2 : 1.5,
          opacity: isFull && !isMember ? 0.55 : 1,
          cursor: isFull && !isMember ? "not-allowed" : "pointer",
          boxShadow: isMember ? `0 4px 20px rgba(${rgb(color)},0.25)` : "0 2px 10px rgba(0,0,0,0.06)",
        }}>
          <div style={{ ...cs.groupColorDot, background: color }} />
          <div style={cs.groupName}>{group.name}</div>
          <div style={cs.groupCreator}>{group.creator_name}'s Group</div>
          <div style={cs.groupMeta}>
            <span style={cs.memberCount}>
              👥 {group.member_count || 0}{group.max_members ? `/${group.max_members}` : ""} members
            </span>
            {group.password && <span style={cs.lockIcon}>🔒</span>}
            {isFull && !isMember && <span style={{ ...cs.fullBadge }}>Full</span>}
          </div>
          {isMember && (
            <div style={{ ...cs.memberBadge, background: color, color: textColor }}>✓ Member</div>
          )}
        </div>

        {/* BACK */}
        <div style={{ ...cs.cardFace, ...cs.cardBack, background: `linear-gradient(135deg, rgba(${rgb(color)},0.12), rgba(${rgb(color)},0.04))`, borderColor: color }}>
          <div style={cs.flipQuestion}>Join <strong>{group.name}</strong>?</div>
          {group.password && (
            <div style={{ marginBottom: 8 }}>
              <input
                style={{ ...cs.flipInput, borderColor: pwError ? "#e74c3c" : "#ddd" }}
                type="password"
                placeholder="Enter group password..."
                value={pwInput}
                onChange={e => { setPwInput(e.target.value); setPwError(false); }}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => { if (e.key === "Enter") handleJoin(); }}
                autoFocus
              />
              {pwError && <div style={cs.pwError}>Wrong password</div>}
            </div>
          )}
          <div style={cs.flipButtons}>
            <button style={{ ...cs.flipBtn, background: color, color: textColor }}
              onClick={e => { e.stopPropagation(); handleJoin(); }}>I'm in ✓</button>
            <button style={cs.flipBtnGhost}
              onClick={e => { e.stopPropagation(); handleLater(); }}>Later</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const isAdminMode = isAdminUrl();

  // Identity
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

  // Data
  const [people, setPeople] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [groups, setGroups] = useState([]);
  const [memberships, setMemberships] = useState([]); // [{ group_id, person_name }]
  const [chatNotes, setChatNotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // View
  const [view, setView] = useState("lobby"); // lobby | group | schedule | admin
  const [activeGroup, setActiveGroup] = useState(null); // full group object
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Group creation form
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[5]);
  const [newGroupPassword, setNewGroupPassword] = useState("");
  const [newGroupMax, setNewGroupMax] = useState("");
  const [createGroupError, setCreateGroupError] = useState("");

  // Schedule input
  const [inputValues, setInputValues] = useState({});

  // Chat
  const [chatInput, setChatInput] = useState("");
  const chatLogRef = useRef(null);

  // Events
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventDay, setEventDay] = useState(DAYS[0]);
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");

  // Confirm dialogs
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmExpunge, setConfirmExpunge] = useState(false);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(null); // person_name
  const [confirmDeletePerson, setConfirmDeletePerson] = useState(null); // person_name (admin)
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(null); // group_id (admin)

  // ── LOAD ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadAll().then(() => {
      const savedName = localStorage.getItem("freetime_name");
      if (savedName) {
        supabase.from("people").select("name").eq("name", savedName).single()
          .then(({ data }) => {
            if (!data) {
              localStorage.removeItem("freetime_name");
              localStorage.removeItem("freetime_color");
              setMyName(""); setMyColor("");
            }
          });
      }
    });

    const peopleSub = supabase.channel("rt_people")
      .on("postgres_changes", { event: "*", schema: "public", table: "people" }, loadPeople).subscribe();
    const scheduleSub = supabase.channel("rt_schedule")
      .on("postgres_changes", { event: "*", schema: "public", table: "schedule" }, loadSchedule).subscribe();
    const chatSub = supabase.channel("rt_chat")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat" }, loadChat).subscribe();
    const eventsSub = supabase.channel("rt_events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, loadEvents).subscribe();
    const groupsSub = supabase.channel("rt_groups")
      .on("postgres_changes", { event: "*", schema: "public", table: "groups" }, loadGroups).subscribe();
    const membersSub = supabase.channel("rt_members")
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members" }, loadMemberships).subscribe();

    return () => {
      supabase.removeChannel(peopleSub); supabase.removeChannel(scheduleSub);
      supabase.removeChannel(chatSub); supabase.removeChannel(eventsSub);
      supabase.removeChannel(groupsSub); supabase.removeChannel(membersSub);
    };
  }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadPeople(), loadSchedule(), loadChat(), loadEvents(), loadGroups(), loadMemberships()]);
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
  async function loadGroups() {
    const { data } = await supabase.from("groups").select("*").order("created_at");
    if (data) setGroups(data);
  }
  async function loadMemberships() {
    const { data } = await supabase.from("group_members").select("*");
    if (data) setMemberships(data);
  }

  // Scroll chat
  useEffect(() => {
    if (chatLogRef.current) chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [chatNotes, view, activeGroup]);

  // Sync active group from live groups data
  useEffect(() => {
    if (activeGroup) {
      const updated = groups.find(g => g.id === activeGroup.id);
      if (updated) setActiveGroup(updated);
      else { setActiveGroup(null); setView("lobby"); }
    }
  }, [groups]);

  // ── IDENTITY ─────────────────────────────────────────────────────────────────
  function saveIdentity(name, color) {
    localStorage.setItem("freetime_name", name);
    localStorage.setItem("freetime_color", color);
    setMyName(name); setMyColor(color);
  }

  async function submitName() {
    const name = nameInput.trim();
    if (!name) return;
    if (people.find(p => p.name === name)) return;
    const usedColors = people.map(p => p.color);
    const color = pickColor(usedColors);
    const { error } = await supabase.from("people").insert({ name, color });
    if (!error) { saveIdentity(name, color); setNameInput(""); }
  }

  async function doRename() {
    const newName = renameInput.trim();
    if (!newName) return;
    if (newName === myName) { setShowRename(false); setRenameInput(""); return; }
    if (people.find(p => p.name === newName)) { setRenameError("That name is already taken"); return; }
    const oldName = myName;
    const color = myColor;
    await supabase.from("people").update({ name: newName }).eq("name", oldName);
    await supabase.from("schedule").update({ person_name: newName }).eq("person_name", oldName);
    await supabase.from("chat").update({ person_name: newName }).eq("person_name", oldName);
    await supabase.from("group_members").update({ person_name: newName }).eq("person_name", oldName);
    await supabase.from("groups").update({ creator_name: newName }).eq("creator_name", oldName);
    const { data: evData } = await supabase.from("events").select("*");
    if (evData) {
      for (const ev of evData) {
        if (ev.joiners && ev.joiners.includes(oldName)) {
          await supabase.from("events").update({ joiners: ev.joiners.map(j => j === oldName ? newName : j) }).eq("id", ev.id);
        }
      }
    }
    saveIdentity(newName, color);
    setShowRename(false); setRenameInput(""); setRenameError("");
  }

  async function deletePerson(name) {
    // Delete all groups created by this person
    const ownedGroups = groups.filter(g => g.creator_name === name);
    for (const g of ownedGroups) await deleteGroup(g.id);
    // Remove memberships
    await supabase.from("group_members").delete().eq("person_name", name);
    await supabase.from("schedule").delete().eq("person_name", name);
    await supabase.from("people").delete().eq("name", name);
    if (myName === name) {
      localStorage.removeItem("freetime_name"); localStorage.removeItem("freetime_color");
      setMyName(""); setMyColor("");
    }
  }

  // ── GROUPS ────────────────────────────────────────────────────────────────────
  function getMemberCount(groupId) {
    return memberships.filter(m => m.group_id === groupId).length;
  }
  function amMember(groupId) {
    return memberships.some(m => m.group_id === groupId && m.person_name === myName);
  }
  function getGroupMembers(groupId) {
    const names = memberships.filter(m => m.group_id === groupId).map(m => m.person_name);
    return people.filter(p => names.includes(p.name));
  }

  async function createGroup() {
    const name = newGroupName.trim();
    if (!name) { setCreateGroupError("Group name is required"); return; }
    const max = newGroupMax ? parseInt(newGroupMax) : null;
    if (max && (isNaN(max) || max < 2)) { setCreateGroupError("Max members must be at least 2"); return; }
    const { error } = await supabase.from("groups").insert({
      name,
      color: newGroupColor,
      creator_name: myName,
      password: newGroupPassword.trim() || null,
      max_members: max,
    });
    if (error) { setCreateGroupError("Failed to create group"); return; }
    // Auto-join creator
    const { data: newGroup } = await supabase.from("groups").select("*").eq("name", name).eq("creator_name", myName).order("created_at", { ascending: false }).limit(1).single();
    if (newGroup) await supabase.from("group_members").insert({ group_id: newGroup.id, person_name: myName });
    setNewGroupName(""); setNewGroupColor(GROUP_COLORS[5]); setNewGroupPassword(""); setNewGroupMax("");
    setShowCreateGroup(false); setCreateGroupError("");
    await loadGroups(); await loadMemberships();
  }

  async function joinGroup(groupId) {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const memberCount = getMemberCount(groupId);
    if (group.max_members && memberCount >= group.max_members) return;
    await supabase.from("group_members").insert({ group_id: groupId, person_name: myName });
  }

  async function leaveGroup(groupId) {
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("person_name", myName);
    setActiveGroup(null); setView("lobby"); setConfirmLeave(false);
  }

  async function deleteGroup(groupId) {
    await supabase.from("group_members").delete().eq("group_id", groupId);
    await supabase.from("chat").delete().eq("group_id", groupId);
    await supabase.from("events").delete().eq("group_id", groupId);
    await supabase.from("groups").delete().eq("id", groupId);
    if (activeGroup && activeGroup.id === groupId) { setActiveGroup(null); setView("lobby"); }
  }

  async function removeMemberFromGroup(groupId, personName) {
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("person_name", personName);
    setConfirmDeleteMember(null);
  }

  function enterGroup(group) {
    setActiveGroup(group);
    setView("group");
  }

  // ── SCHEDULE ──────────────────────────────────────────────────────────────────
  async function addActivity(person, day) {
    const val = (inputValues[day] || "").trim();
    if (!val) return;
    await supabase.from("schedule").insert({ person_name: person, day, activity: val });
    setInputValues(v => ({ ...v, [day]: "" }));
  }
  async function removeActivity(activityId) {
    await supabase.from("schedule").delete().eq("id", activityId);
  }

  // ── CHAT ─────────────────────────────────────────────────────────────────────
  async function sendNote() {
    const text = chatInput.trim();
    const name = isAdmin ? "Admin" : myName;
    const color = isAdmin ? "#5F27CD" : myColor;
    if (!name || !text) return;
    const groupId = activeGroup ? activeGroup.id : null;
    await supabase.from("chat").insert({ person_name: name, color, message: text, group_id: groupId });
    setChatInput("");
  }
  async function clearChat(groupId) {
    if (groupId) await supabase.from("chat").delete().eq("group_id", groupId);
    else await supabase.from("chat").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }

  // ── EVENTS ───────────────────────────────────────────────────────────────────
  async function createEvent() {
    const name = eventName.trim();
    if (!name || !eventStartTime) return;
    const groupId = activeGroup ? activeGroup.id : null;
    await supabase.from("events").insert({
      name, day: eventDay, start_time: eventStartTime,
      end_time: eventEndTime || null, joiners: [], group_id: groupId
    });
    setEventName(""); setEventStartTime(""); setEventEndTime(""); setShowEventForm(false);
  }
  async function deleteEvent(id) { await supabase.from("events").delete().eq("id", id); }
  async function toggleJoin(eventId) {
    if (!myName) return;
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;
    const already = ev.joiners && ev.joiners.includes(myName);
    const newJoiners = already ? ev.joiners.filter(j => j !== myName) : [...(ev.joiners || []), myName];
    await supabase.from("events").update({ joiners: newJoiners }).eq("id", eventId);
  }

  function getColor(name) {
    if (name === myName && myColor) return myColor;
    const p = people.find(x => x.name === name);
    return p ? p.color : "#999";
  }

  // ── GUARDS ───────────────────────────────────────────────────────────────────
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
        <button style={{ ...s.btnPrimary, width: "100%", marginTop: 10 }}
          onClick={() => { if (adminPwInput === ADMIN_PASSWORD) setAdminAuthed(true); else setAdminPwError(true); }}>
          Enter
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={s.heroIcon}>🕐</div>
      <p style={{ color: "#888", fontSize: 15 }}>Loading...</p>
    </div>
  );

  // Admin view
  if (isAdmin) return <AdminView
    people={people} groups={groups} memberships={memberships}
    deletePerson={async (name) => { setConfirmDeletePerson(name); }}
    deleteGroup={async (id) => { setConfirmDeleteGroup(id); }}
    confirmDeletePerson={confirmDeletePerson} setConfirmDeletePerson={setConfirmDeletePerson}
    confirmDeleteGroup={confirmDeleteGroup} setConfirmDeleteGroup={setConfirmDeleteGroup}
    onConfirmDeletePerson={deletePerson} onConfirmDeleteGroup={deleteGroup}
    getMemberCount={getMemberCount}
  />;

  // Identity gate
  if (!myName) return (
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
        {nameInput && people.find(p => p.name === nameInput.trim()) && (
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

  // ── SCHEDULE VIEW ─────────────────────────────────────────────────────────────
  if (view === "schedule") {
    const person = selectedPerson;
    const color = getColor(person);
    const isOwn = person === myName;
    const personSchedule = schedule[person] || {};
    return (
      <div style={s.page}>
        <div style={s.topBar}>
          <button style={s.back} onClick={() => setView(activeGroup ? "group" : "lobby")}>← Back</button>
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
                : (personSchedule[day] || []).map((act) => (
                  <div key={act.id} style={{ ...s.bubble, background: `rgba(${rgb(color)},0.18)`, borderColor: color }}>
                    {act.text}
                    {isOwn && <button style={s.x} onClick={() => removeActivity(act.id)}>×</button>}
                  </div>
                ))
              }
            </div>
            {isOwn && (
              <div style={s.row}>
                <input style={{ ...s.inputSm, flex: 1 }} placeholder="e.g. Kumon 3–5pm"
                  value={inputValues[day] || ""}
                  onChange={e => setInputValues(v => ({ ...v, [day]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addActivity(person, day)} />
                <button style={{ ...s.btnSmall, background: color }} onClick={() => addActivity(person, day)}>+</button>
              </div>
            )}
          </div>
        ))}
        <button style={s.bigBtn} onClick={() => setView(activeGroup ? "group" : "lobby")}>Done ✓</button>
      </div>
    );
  }

  // ── GROUP INTERIOR ────────────────────────────────────────────────────────────
  if (view === "group" && activeGroup) {
    const group = activeGroup;
    const color = group.color || "#5F27CD";
    const textColor = contrastColor(color);
    const isCreator = group.creator_name === myName;
    const groupMembers = getGroupMembers(group.id);
    const sortedMembers = myName
      ? [groupMembers.find(p => p.name === myName), ...groupMembers.filter(p => p.name !== myName)].filter(Boolean)
      : groupMembers;
    const groupChatNotes = chatNotes.filter(c => c.group_id === group.id);
    const groupEvents = events.filter(e => e.group_id === group.id);
    const eventsByDay = {};
    groupEvents.forEach(ev => { if (!eventsByDay[ev.day]) eventsByDay[ev.day] = []; eventsByDay[ev.day].push(ev); });

    return (
      <div style={s.page}>
        {/* Confirm dialogs */}
        {confirmLeave && (
          <div style={s.overlay}>
            <div style={s.dialog}>
              <p style={s.dialogText}>Are you sure you want to leave <strong>{group.name}</strong>?</p>
              <div style={s.dialogBtns}>
                <button style={s.dialogConfirm} onClick={() => leaveGroup(group.id)}>Yes, leave</button>
                <button style={s.dialogCancel} onClick={() => setConfirmLeave(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {confirmExpunge && (
          <div style={s.overlay}>
            <div style={s.dialog}>
              <p style={s.dialogText}>Are you <em>really really</em> sure you want to expunge <strong>{group.name}</strong>? This will delete the group for everyone.</p>
              <div style={s.dialogBtns}>
                <button style={{ ...s.dialogConfirm, background: "#c0392b" }} onClick={() => { deleteGroup(group.id); setConfirmExpunge(false); }}>Expunge it</button>
                <button style={s.dialogCancel} onClick={() => setConfirmExpunge(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {confirmDeleteMember && (
          <div style={s.overlay}>
            <div style={s.dialog}>
              <p style={s.dialogText}>Remove <strong>{confirmDeleteMember}</strong> from this group?</p>
              <div style={s.dialogBtns}>
                <button style={s.dialogConfirm} onClick={() => removeMemberFromGroup(group.id, confirmDeleteMember)}>Remove</button>
                <button style={s.dialogCancel} onClick={() => setConfirmDeleteMember(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Group header */}
        <div style={{ ...s.groupHeader, background: `linear-gradient(135deg, rgba(${rgb(color)},0.15), rgba(${rgb(color)},0.05))`, borderBottom: `3px solid ${color}` }}>
          <button style={s.back} onClick={() => { setView("lobby"); setActiveGroup(null); }}>← Back</button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a2e" }}>{group.name}</div>
            <div style={{ fontSize: 12, color: "#888" }}>Created by {group.creator_name}</div>
          </div>
          <div style={{ ...s.groupColorPill, background: color, color: textColor }}>{groupMembers.length} in</div>
        </div>

        {/* Members */}
        <div style={s.card}>
          <p style={s.label}>Who's in this group</p>
          {sortedMembers.length === 0 && <p style={{ fontSize: 13, color: "#aaa" }}>No members yet</p>}
          {sortedMembers.map(p => {
            const isMe = p.name === myName;
            return (
              <div key={p.name} style={{
                ...s.personChip,
                background: isMe ? `rgba(${rgb(p.color)},0.15)` : "#fafafa",
                borderColor: isMe ? p.color : "#e8e8e8",
              }}>
                <span style={{ ...s.dot, background: p.color }} />
                <span style={s.personName}>
                  {p.name}
                  {isMe && <span style={{ fontSize: 11, color: "#888", marginLeft: 4 }}>(you)</span>}
                  {p.name === group.creator_name && <span style={{ fontSize: 11, color: color, marginLeft: 4, fontWeight: 700 }}>👑 creator</span>}
                </span>
                {isMe
                  ? <button style={s.editBtn} onClick={() => { setSelectedPerson(p.name); setView("schedule"); }}>Edit schedule</button>
                  : <button style={s.viewBtn} onClick={() => { setSelectedPerson(p.name); setView("schedule"); }}>View</button>
                }
                {isCreator && !isMe && (
                  <button style={s.deleteBtn} onClick={() => setConfirmDeleteMember(p.name)}>🗑</button>
                )}
              </div>
            );
          })}

          <div style={{ marginTop: 12, borderTop: "1px dashed #eee", paddingTop: 12 }}>
            {isCreator
              ? <button style={{ ...s.leaveBtn, color: "#c0392b", borderColor: "#c0392b" }} onClick={() => setConfirmExpunge(true)}>
                  ⚠️ Expunge Group
                </button>
              : <button style={s.leaveBtn} onClick={() => setConfirmLeave(true)}>Leave group</button>
            }
          </div>
        </div>

        {/* Calendar */}
        <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 10 }}>📅 Group Schedule</div>

        {/* Events */}
        <div style={s.eventSection}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showEventForm ? 10 : 0 }}>
            <span style={s.sectionTitle}>🎯 Events</span>
            <button style={s.btnCreate} onClick={() => setShowEventForm(v => !v)}>
              {showEventForm ? "Cancel" : "+ Add Event"}
            </button>
          </div>
          {showEventForm && (
            <div style={s.eventForm}>
              <input style={{ ...s.inputSm, marginBottom: 8, width: "100%", boxSizing: "border-box" }}
                placeholder="Event name" value={eventName} onChange={e => setEventName(e.target.value)} />
              <div style={{ marginBottom: 8 }}>
                <select style={{ ...s.inputSm, width: "100%", boxSizing: "border-box" }} value={eventDay} onChange={e => setEventDay(e.target.value)}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ ...s.row, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Start</div>
                  <input style={{ ...s.inputSm, width: "100%", boxSizing: "border-box" }} type="time" value={eventStartTime} onChange={e => setEventStartTime(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>End</div>
                  <input style={{ ...s.inputSm, width: "100%", boxSizing: "border-box" }} type="time" value={eventEndTime} onChange={e => setEventEndTime(e.target.value)} />
                </div>
              </div>
              <button style={{ ...s.btnPrimary, width: "100%" }} onClick={createEvent}>Create</button>
            </div>
          )}
        </div>

        {/* Days grid */}
        <div style={s.calGrid}>
          {DAYS.map(day => {
            const dayEvents = eventsByDay[day] || [];
            return (
              <div key={day} style={s.calDay}>
                <div style={s.calDayName}>{day}</div>
                {sortedMembers.map(p => {
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
                  <div style={{ marginTop: 8, borderTop: "1px dashed #eee", paddingTop: 8 }}>
                    {dayEvents.map(ev => {
                      const amJoined = myName && ev.joiners && ev.joiners.includes(myName);
                      const timeLabel = ev.end_time ? `${ev.start_time}–${ev.end_time}` : ev.start_time;
                      return (
                        <div key={ev.id} style={s.eventCard}>
                          <div style={s.eventHeader}>
                            <span style={s.eventEmoji}>🎯</span>
                            <span style={s.eventTitle}>{ev.name}</span>
                            <span style={s.eventTime}>{timeLabel}</span>
                            {(isCreator || isAdmin) && <button style={s.deleteEventBtn} onClick={() => deleteEvent(ev.id)}>🗑</button>}
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
                          <button
                            style={{ ...s.joinBtn, background: amJoined ? "#fee" : "#e9f7ee", color: amJoined ? "#e74c3c" : "#28a745", borderColor: amJoined ? "#e74c3c" : "#28a745" }}
                            onClick={() => toggleJoin(ev.id)}>
                            {amJoined ? "Unjoin" : "Join"}
                          </button>
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
            <span style={s.chatTitle}>💬 Group chat</span>
            {isCreator && <button style={s.clearChatBtn} onClick={() => clearChat(group.id)}>Clear</button>}
          </div>
          <div ref={chatLogRef} style={s.chatLog}>
            {groupChatNotes.length === 0 && <p style={s.chatEmpty}>No messages yet — say hi!</p>}
            {groupChatNotes.map((n, i) => (
              <div key={n.id || i} style={s.chatMsg}>
                <span style={{ ...s.chatBadge, background: n.color }}>{n.person_name}</span>
                <span style={s.chatText}>{n.message}</span>
              </div>
            ))}
          </div>
          <div style={s.row}>
            <input style={{ ...s.inputSm, flex: 1 }} placeholder="Message..."
              value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendNote()} />
            <button style={s.btnPrimary} onClick={sendNote}>Send</button>
          </div>
        </div>
      </div>
    );
  }

  // ── LOBBY ─────────────────────────────────────────────────────────────────────
  const myMemberGroupIds = memberships.filter(m => m.person_name === myName).map(m => m.group_id);
  const groupsWithCount = groups.map(g => ({ ...g, member_count: getMemberCount(g.id) }));

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
        <span style={{ ...s.dot, background: myColor, width: 12, height: 12 }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>You're <strong>{myName}</strong></span>
        <button style={s.renameBtn} onClick={() => { setShowRename(v => !v); setRenameInput(myName); setRenameError(""); }}>
          {showRename ? "Cancel" : "Rename"}
        </button>
      </div>

      {/* Rename */}
      {showRename && (
        <div style={s.renameBox}>
          <p style={{ fontSize: 13, color: "#555", marginTop: 0, marginBottom: 8 }}>
            Your schedule and all data will transfer to the new name.
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

      {/* My schedule shortcut */}
      <div style={{ ...s.card, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        onClick={() => { setSelectedPerson(myName); setActiveGroup(null); setView("schedule"); }}>
        <span style={{ ...s.dot, background: myColor, width: 14, height: 14 }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#444", flex: 1 }}>My Schedule</span>
        <span style={{ fontSize: 13, color: "#5F27CD", fontWeight: 600 }}>Edit →</span>
      </div>

      {/* Groups lobby */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 17, color: "#1a1a2e" }}>Groups</div>
        <button style={s.btnCreate} onClick={() => setShowCreateGroup(v => !v)}>
          {showCreateGroup ? "Cancel" : "+ Create Group"}
        </button>
      </div>

      {/* Create group form */}
      {showCreateGroup && (
        <div style={{ ...s.card, marginBottom: 16 }}>
          <p style={s.label}>New Group</p>
          <input style={{ ...s.input, marginBottom: 10 }} placeholder="Group name..."
            value={newGroupName} onChange={e => { setNewGroupName(e.target.value); setCreateGroupError(""); }} />

          <p style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Group colour</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {GROUP_COLORS.map(c => (
              <div key={c} onClick={() => setNewGroupColor(c)} style={{
                width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer",
                border: newGroupColor === c ? "3px solid #1a1a2e" : "3px solid transparent",
                boxShadow: newGroupColor === c ? "0 0 0 2px #fff inset" : "none",
                transition: "all 0.15s"
              }} />
            ))}
          </div>

          <input style={{ ...s.input, marginBottom: 10 }} placeholder="Password (optional, leave blank for open)"
            value={newGroupPassword} onChange={e => setNewGroupPassword(e.target.value)} />
          <input style={{ ...s.input, marginBottom: 10 }} placeholder="Max members (optional, e.g. 10)"
            type="number" min="2"
            value={newGroupMax} onChange={e => setNewGroupMax(e.target.value)} />

          {createGroupError && <p style={{ color: "#e74c3c", fontSize: 13, marginBottom: 8 }}>{createGroupError}</p>}

          {/* Preview */}
          <div style={{ background: `rgba(${rgb(newGroupColor)},0.12)`, borderRadius: 10, padding: 10, marginBottom: 10, border: `1.5px solid ${newGroupColor}` }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{newGroupName || "Group Name"}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{myName}'s Group</div>
          </div>

          <button style={{ ...s.bigBtn, marginTop: 0 }} onClick={createGroup}>Create Group</button>
        </div>
      )}

      {/* Group cards grid */}
      {groupsWithCount.length === 0 && !showCreateGroup && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#aaa", fontSize: 14 }}>
          No groups yet — create the first one!
        </div>
      )}
      <div style={cs.grid}>
        {groupsWithCount.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            isMember={myMemberGroupIds.includes(group.id)}
            myName={myName}
            onJoin={joinGroup}
            onClick={() => enterGroup(group)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
function AdminView({ people, groups, memberships, deletePerson, deleteGroup,
  confirmDeletePerson, setConfirmDeletePerson, confirmDeleteGroup, setConfirmDeleteGroup,
  onConfirmDeletePerson, onConfirmDeleteGroup, getMemberCount }) {

  function getGroupsForPerson(name) {
    return groups.filter(g => g.creator_name === name);
  }

  return (
    <div style={s.page}>
      {confirmDeletePerson && (
        <div style={s.overlay}>
          <div style={s.dialog}>
            <p style={s.dialogText}>
              Delete <strong>{confirmDeletePerson}</strong>?
              {getGroupsForPerson(confirmDeletePerson).length > 0 && (
                <span style={{ color: "#e74c3c", display: "block", marginTop: 6, fontSize: 13 }}>
                  ⚠️ This will also delete their {getGroupsForPerson(confirmDeletePerson).length} group(s).
                </span>
              )}
            </p>
            <div style={s.dialogBtns}>
              <button style={{ ...s.dialogConfirm, background: "#c0392b" }} onClick={() => { onConfirmDeletePerson(confirmDeletePerson); setConfirmDeletePerson(null); }}>Delete</button>
              <button style={s.dialogCancel} onClick={() => setConfirmDeletePerson(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteGroup && (
        <div style={s.overlay}>
          <div style={s.dialog}>
            <p style={s.dialogText}>Delete this group? Members' schedules are untouched.</p>
            <div style={s.dialogBtns}>
              <button style={{ ...s.dialogConfirm, background: "#c0392b" }} onClick={() => { onConfirmDeleteGroup(confirmDeleteGroup); setConfirmDeleteGroup(null); }}>Delete Group</button>
              <button style={s.dialogCancel} onClick={() => setConfirmDeleteGroup(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={s.hero}>
        <div style={s.heroIcon}>🔑</div>
        <h1 style={s.title}>Admin Panel</h1>
        <p style={s.subtitle}>Freetime Terminal</p>
      </div>

      <div style={s.card}>
        <p style={s.label}>Users ({people.length})</p>
        {people.length === 0 && <p style={{ fontSize: 13, color: "#aaa" }}>No users yet</p>}
        {people.map(p => (
          <div key={p.name} style={{ ...s.personChip, background: "#fafafa", borderColor: "#e8e8e8" }}>
            <span style={{ ...s.dot, background: p.color }} />
            <span style={s.personName}>{p.name}</span>
            <span style={{ fontSize: 11, color: "#aaa" }}>
              {getGroupsForPerson(p.name).length > 0 ? `owns ${getGroupsForPerson(p.name).length} group(s)` : ""}
            </span>
            <button style={s.deleteBtn} onClick={() => setConfirmDeletePerson(p.name)}>🗑</button>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <p style={s.label}>Groups ({groups.length})</p>
        {groups.length === 0 && <p style={{ fontSize: 13, color: "#aaa" }}>No groups yet</p>}
        {groups.map(g => (
          <div key={g.id} style={{ ...s.personChip, background: `rgba(${rgb(g.color || "#5F27CD")},0.08)`, borderColor: g.color || "#e8e8e8" }}>
            <span style={{ ...s.dot, background: g.color || "#5F27CD" }} />
            <span style={s.personName}>{g.name}</span>
            <span style={{ fontSize: 11, color: "#888" }}>by {g.creator_name} · {getMemberCount(g.id)} members</span>
            <button style={s.deleteBtn} onClick={() => setConfirmDeleteGroup(g.id)}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
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
  groupHeader: { display: "flex", alignItems: "center", gap: 12, padding: "16px 0", marginBottom: 16 },
  groupColorPill: { padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 },
  leaveBtn: { background: "none", border: "1.5px solid #aaa", borderRadius: 10, padding: "6px 16px", fontSize: 13, fontWeight: 600, color: "#888", cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 },
  dialog: { background: "#fff", borderRadius: 16, padding: 24, maxWidth: 320, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" },
  dialogText: { fontSize: 15, color: "#333", marginTop: 0, marginBottom: 20, lineHeight: 1.5 },
  dialogBtns: { display: "flex", gap: 10 },
  dialogConfirm: { flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#e74c3c", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  dialogCancel: { flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #ddd", background: "#fff", color: "#555", fontWeight: 600, fontSize: 14, cursor: "pointer" },
};

// Card-specific styles (flip animation)
const cs = {
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 },
  cardScene: { perspective: 800, cursor: "pointer" },
  cardInner: { position: "relative", width: "100%", paddingBottom: "100%", transformStyle: "preserve-3d", transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)" },
  cardFace: {
    position: "absolute", inset: 0, borderRadius: 16, border: "1.5px solid #e8e8e8",
    backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: 14, boxSizing: "border-box", textAlign: "center",
  },
  cardFront: {},
  cardBack: { transform: "rotateY(180deg)" },
  groupColorDot: { width: 32, height: 32, borderRadius: "50%", marginBottom: 8 },
  groupName: { fontWeight: 800, fontSize: 15, color: "#1a1a2e", marginBottom: 2, wordBreak: "break-word" },
  groupCreator: { fontSize: 11, color: "#888", marginBottom: 8 },
  groupMeta: { display: "flex", alignItems: "center", gap: 6, justifyContent: "center", flexWrap: "wrap" },
  memberCount: { fontSize: 11, color: "#666" },
  lockIcon: { fontSize: 11 },
  fullBadge: { fontSize: 10, background: "#fee", color: "#e74c3c", borderRadius: 6, padding: "1px 6px", fontWeight: 700 },
  memberBadge: { marginTop: 8, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  flipQuestion: { fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 10, lineHeight: 1.4 },
  flipInput: { width: "100%", padding: "6px 10px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 4 },
  pwError: { fontSize: 11, color: "#e74c3c", marginBottom: 6 },
  flipButtons: { display: "flex", flexDirection: "column", gap: 6, width: "100%" },
  flipBtn: { padding: "8px 0", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%" },
  flipBtnGhost: { padding: "8px 0", borderRadius: 10, border: "1.5px solid #ddd", background: "#fff", color: "#888", fontWeight: 600, fontSize: 13, cursor: "pointer", width: "100%" },
};
