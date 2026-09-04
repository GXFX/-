import { useState } from "react";
import { login, register } from "../api/auth";

export function AuthScreen({ onSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("2000-01-01");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(phone, password);
      } else {
        await register({ phone, password, name, date_of_birth: dob });
      }
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: "40px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26, color: "#F5F5F7" }}>
        {mode === "login" ? "Вход" : "Регистрация"}
      </div>

      <input
        placeholder="Телефон (+79991234567)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={inputStyle}
      />

      {mode === "register" && (
        <>
          <input placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <div>
            <div style={{ fontSize: 12.5, color: "#8C8C97", marginBottom: 7 }}>Дата рождения</div>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={inputStyle} />
          </div>
        </>
      )}

      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />

      {error && <div style={{ color: "#FF5D7A", fontSize: 13 }}>{error}</div>}

      <button onClick={handleSubmit} disabled={submitting} style={{
        padding: "15px", borderRadius: 16, border: "none", cursor: "pointer",
        background: "linear-gradient(135deg, #C4FF3D, #8B5CF6)",
        color: "#0A0A0C", fontWeight: 700, fontSize: 15, fontFamily: "'Space Grotesk', sans-serif",
        opacity: submitting ? 0.6 : 1,
      }}>
        {submitting ? "Подождите…" : mode === "login" ? "Войти" : "Зарегистрироваться"}
      </button>

      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        style={{ background: "none", border: "none", color: "#8C8C97", fontSize: 13, cursor: "pointer" }}
      >
        {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
      </button>
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 14,
  background: "#141418", border: "1px solid #232329", color: "#F5F5F7",
  fontSize: 14.5, outline: "none", fontFamily: "'Inter', sans-serif",
};