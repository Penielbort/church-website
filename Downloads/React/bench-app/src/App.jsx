import React, { useState, useMemo } from "react";

/* ---------- design tokens ----------
bg:        #FBF1EF  soft cream
surface:   #FFFFFF
ink:       #331623  deep plum (text, borders)
accent:    #E62E8B  pink (primary actions)
shadowfill:#5C3A2E  warm brown (button's offset layer)
accentSoft:#F6D3E4
muted:     #8A6A78
display font: Fraunces
body font:    Public Sans
------------------------------------ */

const GLOBAL = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&display=swap');
:root { color-scheme: light; color: #331623; background-color: #FBF1EF; }
* { box-sizing: border-box; }
body { margin: 0; }
`;

const DUTIES = ["Camera", "Projector", "Sound", "Live Stream", "Lighting", "Media"];
const ACCOUNT_ROLES = ["Admin", "Coordinator", "Member"];

function Pill({ children, onClick, variant = "solid", type = "button", full, small }) {
  const pad = small ? "9px 20px" : "12px 26px";
  const fontSize = small ? 13 : 15;
  const base = {
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 600,
    fontSize,
    padding: pad,
    borderRadius: 999,
    border: "2px solid #331623",
    cursor: "pointer",
    position: "relative",
    width: full ? "100%" : "auto",
  };
  const styles =
    variant === "solid"
      ? { ...base, background: "#E62E8B", color: "#FFFFFF" }
      : { ...base, background: "#FFFFFF", color: "#331623" };

  return (
    <span style={{ display: full ? "block" : "inline-block", position: "relative" }}>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 5,
          left: 5,
          width: "100%",
          height: "100%",
          borderRadius: 999,
          background: "#5C3A2E",
          border: "2px solid #331623",
        }}
      />
      <button type={type} onClick={onClick} style={styles}>
        {children}
      </button>
    </span>
  );
}

function Field({ label, ...props }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#331623", display: "block", marginBottom: 6 }}>
        {label}
      </span>
      <input
        {...props}
        style={{
          width: "100%",
          padding: "11px 14px",
          borderRadius: 10,
          border: "1.5px solid #331623",
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 14,
          color: "#331623",
          background: "#FFFFFF",
          boxSizing: "border-box",
        }}
      />
    </label>
  );
}

function Select({ label, options, ...props }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#331623", display: "block", marginBottom: 6 }}>
        {label}
      </span>
      <select
        {...props}
        style={{
          width: "100%",
          padding: "11px 14px",
          borderRadius: 10,
          border: "1.5px solid #331623",
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 14,
          color: "#331623",
          background: "#FFFFFF",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

const PAGE = { fontFamily: "'Public Sans', sans-serif", color: "#331623" };
const cell = { padding: "12px 16px", fontSize: 14, color: "#331623" };
const menuItem = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "11px 14px",
  background: "none",
  border: "none",
  fontFamily: "'Public Sans', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  color: "#331623",
};

function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(51,22,35,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
      <div style={{ background: "#FFFFFF", border: "1.5px solid #331623", borderRadius: 16, padding: 30, width: 340, ...PAGE }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, margin: 0, color: "#331623" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8A6A78" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Logo({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 22, color: "#331623" }}
    >
      Serve
    </button>
  );
}

export default function App() {
  const [view, setView] = useState("landing"); // landing | login | dashboard
  const [authMode, setAuthMode] = useState("in"); // in | new

  const [profiles, setProfiles] = useState([]);
  const [current, setCurrent] = useState(null);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [newProfile, setNewProfile] = useState({ name: "", role: "Member", email: "", password: "" });

  const [members, setMembers] = useState([
    { name: "Kwabena Asante", duty: "Sound", email: "kwabena@church.org", status: "Active" },
    { name: "Efua Mensah", duty: "Camera", email: "efua@church.org", status: "Active" },
    { name: "Yaw Boateng", duty: "Lighting", email: "yaw@church.org", status: "Away" },
    { name: "Adjoa Darko", duty: "Live Stream", email: "adjoa@church.org", status: "Active" },
  ]);
  const [search, setSearch] = useState("");
  const [dutyFilter, setDutyFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null); // index of member being reassigned
  const [newMember, setNewMember] = useState({ name: "", duty: DUTIES[0], email: "", status: "Active" });

  const isAdmin = current?.role === "Admin";
  const filterOptions = ["All", ...DUTIES];

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesDuty = dutyFilter === "All" || m.duty === dutyFilter;
      const q = search.toLowerCase();
      const matchesSearch = m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
      return matchesDuty && matchesSearch;
    });
  }, [members, search, dutyFilter]);

  function goHome() {
    setView("landing");
  }

  function handleSignIn() {
    const p = profiles.find((p) => p.email.toLowerCase() === signInEmail.toLowerCase());
    if (p && p.password === signInPassword) {
      setCurrent(p);
      setLoginError("");
      setView("dashboard");
    } else {
      setLoginError("No profile matches that email and password. Create one instead.");
    }
  }

  function handleCreateProfile() {
    if (!newProfile.name || !newProfile.email || !newProfile.password) return;
    const p = { ...newProfile, phone: "", location: "", bio: "" };
    setProfiles([...profiles, p]);
    setCurrent(p);
    setView("dashboard");
  }

  function addMember() {
    if (!newMember.name || !newMember.email) return;
    setMembers([...members, newMember]);
    setNewMember({ name: "", duty: DUTIES[0], email: "", status: "Active" });
    setShowAddMember(false);
  }

  function saveProfileEdits(e) {
    e.preventDefault();
    setProfiles(profiles.map((p) => (p.email === current.email ? current : p)));
    setShowEditProfile(false);
  }

  function saveAssignment(e) {
    e.preventDefault();
    setAssignTarget(null);
  }

  return (
    <div style={{ minHeight: 640, background: "#FBF1EF", ...PAGE }}>
      <style>{GLOBAL}</style>

      {view === "landing" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 40px" }}>
            <Logo onClick={goHome} />
            <Pill small onClick={() => setView(current ? "dashboard" : "login")}>
              {current ? "Dashboard" : "Sign in"}
            </Pill>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px 40px 70px", textAlign: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#8A6A78", marginBottom: 18 }}>
              Duty roster for church media teams
            </span>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 56, margin: 0, lineHeight: 1.05, color: "#331623" }}>
              Know who's serving,<br />every week
            </h1>
            <p style={{ maxWidth: 420, color: "#5A3E4C", fontSize: 16, margin: "22px 0 34px" }}>
              See who's on camera, sound, lighting, or media each week. Admins can reassign in seconds.
            </p>
            <Pill onClick={() => setView(current ? "dashboard" : "login")}>Open Serve</Pill>
          </div>

          <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 40px 80px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { t: "See every duty at a glance", d: "Everyone's name, their duty, and their status in one table." },
              { t: "Filter by duty", d: "Jump straight to camera, sound, lighting, or media." },
              { t: "Admins reassign fast", d: "Change anyone's duty right from the roster. No spreadsheet." },
            ].map((f) => (
              <div key={f.t} style={{ background: "#FFFFFF", border: "1.5px solid #331623", borderRadius: 14, padding: 22 }}>
                <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 18, margin: "0 0 8px", color: "#331623" }}>{f.t}</h3>
                <p style={{ fontSize: 14, color: "#5A3E4C", margin: 0, lineHeight: 1.5 }}>{f.d}</p>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1.5px solid #331623", padding: "20px 40px", textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "#8A6A78" }}>Serve. A simple roster for your church media team.</span>
          </div>
        </div>
      )}

      {view === "login" && (
        <div style={{ minHeight: 640, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#FFFFFF", border: "1.5px solid #331623", borderRadius: 18, padding: 36, width: 360 }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, margin: "0 0 22px", color: "#331623" }}>
              {authMode === "in" ? "Sign in" : "Create profile"}
            </h2>

            <div style={{ display: "flex", gap: 18, marginBottom: 22, borderBottom: "1.5px solid #F1E4E9" }}>
              {["in", "new"].map((m) => (
                <button
                  key={m}
                  onClick={() => { setAuthMode(m); setLoginError(""); }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "0 0 10px",
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    color: authMode === m ? "#E62E8B" : "#8A6A78",
                    borderBottom: authMode === m ? "2px solid #E62E8B" : "2px solid transparent",
                  }}
                >
                  {m === "in" ? "Sign in" : "Create profile"}
                </button>
              ))}
            </div>

            {authMode === "in" ? (
              <>
                <Field label="Email" type="email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} />
                <Field label="Password" type="password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} />
                {loginError && <p style={{ color: "#E62E8B", fontSize: 13, marginTop: -8, marginBottom: 16 }}>{loginError}</p>}
                <Pill onClick={handleSignIn} full>Enter</Pill>
              </>
            ) : (
              <>
                <Field label="Full name" value={newProfile.name} onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })} />
                <Select label="Account role" value={newProfile.role} onChange={(e) => setNewProfile({ ...newProfile, role: e.target.value })} options={ACCOUNT_ROLES} />
                <Field label="Email" type="email" value={newProfile.email} onChange={(e) => setNewProfile({ ...newProfile, email: e.target.value })} />
                <Field label="Password" type="password" value={newProfile.password} onChange={(e) => setNewProfile({ ...newProfile, password: e.target.value })} />
                <Pill onClick={handleCreateProfile} full>Create profile</Pill>
              </>
            )}
          </div>
        </div>
      )}

      {view === "dashboard" && current && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: "1.5px solid #331623", background: "#FFFFFF" }}>
            <Logo onClick={goHome} />

            <input
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, maxWidth: 320, margin: "0 20px", padding: "9px 14px", borderRadius: 10, border: "1.5px solid #331623", fontFamily: "'Public Sans', sans-serif", fontSize: 14, color: "#331623" }}
            />

            <select
              value={dutyFilter}
              onChange={(e) => setDutyFilter(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: 10, border: "1.5px solid #331623", fontFamily: "'Public Sans', sans-serif", fontSize: 14, marginRight: 18, color: "#331623", background: "#FFFFFF" }}
            >
              {filterOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}
              >
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#F6D3E4", border: "1.5px solid #331623", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#331623" }}>
                  {current.name.split(" ").map((w) => w[0]).join("")}
                </span>
                <span style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#331623" }}>{current.name}</div>
                  <div style={{ fontSize: 11, color: "#8A6A78" }}>{current.role}</div>
                </span>
              </button>

              {menuOpen && (
                <div style={{ position: "absolute", right: 0, top: 44, background: "#FFFFFF", border: "1.5px solid #331623", borderRadius: 12, width: 190, overflow: "hidden", zIndex: 10 }}>
                  <button onClick={() => { setShowEditProfile(true); setMenuOpen(false); }} style={menuItem}>Edit profile</button>
                  <button onClick={() => setMenuOpen(false)} style={menuItem}>Account role: {current.role}</button>
                  <button onClick={() => { setView("landing"); setCurrent(null); setMenuOpen(false); }} style={{ ...menuItem, color: "#E62E8B" }}>Sign out</button>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: "24px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 24, margin: 0, color: "#331623" }}>Roster</h2>
              {isAdmin && <Pill onClick={() => setShowAddMember(true)}>Add member</Pill>}
            </div>

            <div style={{ background: "#FFFFFF", border: "1.5px solid #331623", borderRadius: 14, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F6D3E4" }}>
                    {["Name", "Duty", "Email", "Status", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 700, color: "#331623" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => {
                    const realIndex = members.indexOf(m);
                    return (
                      <tr key={i} style={{ borderTop: "1px solid #F1E4E9" }}>
                        <td style={cell}>{m.name}</td>
                        <td style={cell}>{m.duty}</td>
                        <td style={cell}>{m.email}</td>
                        <td style={cell}>
                          <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: m.status === "Active" ? "#DDEFE4" : "#F1E4E9", color: m.status === "Active" ? "#2C6B47" : "#8A6A78" }}>
                            {m.status}
                          </span>
                        </td>
                        <td style={{ ...cell, textAlign: "right" }}>
                          {isAdmin && (
                            <button
                              onClick={() => setAssignTarget(realIndex)}
                              style={{ background: "none", border: "none", color: "#E62E8B", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                            >
                              Assign
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#8A6A78" }}>No one matches that search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAddMember && (
        <Modal onClose={() => setShowAddMember(false)} title="Add member">
          <Field label="Full name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
          <Select label="Duty" value={newMember.duty} onChange={(e) => setNewMember({ ...newMember, duty: e.target.value })} options={DUTIES} />
          <Field label="Email" type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} />
          <Select label="Status" value={newMember.status} onChange={(e) => setNewMember({ ...newMember, status: e.target.value })} options={["Active", "Away"]} />
          <Pill onClick={addMember} full>Save</Pill>
        </Modal>
      )}

      {showEditProfile && (
        <Modal onClose={() => setShowEditProfile(false)} title="Edit profile">
          <form onSubmit={saveProfileEdits}>
            <Field label="Phone" value={current.phone} onChange={(e) => setCurrent({ ...current, phone: e.target.value })} />
            <Field label="Location" value={current.location} onChange={(e) => setCurrent({ ...current, location: e.target.value })} />
            <Field label="Bio" value={current.bio} onChange={(e) => setCurrent({ ...current, bio: e.target.value })} />
            <Pill type="submit" full>Save changes</Pill>
          </form>
        </Modal>
      )}

      {assignTarget !== null && (
        <Modal onClose={() => setAssignTarget(null)} title={`Assign duty for ${members[assignTarget].name}`}>
          <form onSubmit={saveAssignment}>
            <Select
              label="Duty"
              value={members[assignTarget].duty}
              onChange={(e) => {
                const updated = [...members];
                updated[assignTarget] = { ...updated[assignTarget], duty: e.target.value };
                setMembers(updated);
              }}
              options={DUTIES}
            />
            <Select
              label="Status"
              value={members[assignTarget].status}
              onChange={(e) => {
                const updated = [...members];
                updated[assignTarget] = { ...updated[assignTarget], status: e.target.value };
                setMembers(updated);
              }}
              options={["Active", "Away"]}
            />
            <Pill type="submit" full>Save assignment</Pill>
          </form>
        </Modal>
      )}
    </div>
  );
}
