import React, { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, ShieldCheck, Star } from "lucide-react";
import { getUser } from "../api/users";
import { getOrCreateDirectChat } from "../api/chats";

/**
 * PublicProfileScreen — read-only profile view for ANY user
 * (not the current logged-in user). Shows avatar, name, rating,
 * verification badge, meetup counters, and a "Message" button.
 *
 * Usage:
 * <PublicProfileScreen
 *   userId={someUserId}
 *   onBack={() => ...}
 *   onOpenChat={(chatId, chatTitle) => ...}
 * />
 */
export function PublicProfileScreen({ userId, onBack, onOpenChat }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    getUser(userId)
      .then(setUser)
      .catch((err) => setError(err?.message || "Не удалось загрузить профиль"))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleMessage() {
    setMessaging(true);
    try {
      const chat = await getOrCreateDirectChat(userId);
      onOpenChat(chat.id, user?.name || "Чат");
    } catch (err) {
      alert(err?.message || "Не удалось открыть чат");
    } finally {
      setMessaging(false);
    }
  }

  return (
    <div
      style={{ minHeight: "100vh", background: "#0A0A0C", color: "#F5F5F7" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "16px",
          borderBottom: "1px solid #1D1D23",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ArrowLeft size={22} color="#F5F5F7" />
        </button>
        <div style={{ marginLeft: 12, fontWeight: 700, fontSize: 16 }}>
          Профиль
        </div>
      </div>

      {loading && (
        <div style={{ padding: 40, textAlign: "center", color: "#8C8C97" }}>
          Загрузка…
        </div>
      )}

      {error && (
        <div style={{ padding: 40, textAlign: "center", color: "#FF5D7A" }}>
          {error}
        </div>
      )}

      {user && !loading && (
        <div style={{ padding: "28px 20px", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            {user.photo_url ? (
              <img
                src={user.photo_url}
                alt=""
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #8B5CF6",
                }}
              />
            ) : (
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  background: "#1D1D23",
                  border: "2px solid #8B5CF6",
                }}
              />
            )}
            {user.verification_status === "verified" && (
              <div
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#0A0A0C",
                  border: "2px solid #0A0A0C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldCheck size={17} color="#5DD8FF" />
              </div>
            )}
          </div>

          <div style={{ marginTop: 14, fontSize: 19, fontWeight: 700 }}>
            {user.name}{user.age ? `, ${user.age}` : ""}
          </div>
          <div style={{ fontSize: 14, color: "#8C8C97", marginTop: 2 }}>
            @{user.username}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              marginTop: 10,
            }}
          >
            <Star size={16} color="#C4FF3D" fill="#C4FF3D" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              {user.rating?.toFixed(1) ?? "—"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 24,
            }}
          >
            <div
              style={{
                flex: 1,
                background: "#141418",
                border: "1px solid #232329",
                borderRadius: 16,
                padding: "16px 10px",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: "#8B5CF6" }}>
                {user.meetups_created_count}
              </div>
              <div style={{ fontSize: 12, color: "#8C8C97", marginTop: 4 }}>
                Создано встреч
              </div>
            </div>
            <div
              style={{
                flex: 1,
                background: "#141418",
                border: "1px solid #232329",
                borderRadius: 16,
                padding: "16px 10px",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: "#C4FF3D" }}>
                {user.meetups_completed_count}
              </div>
              <div style={{ fontSize: 12, color: "#8C8C97", marginTop: 4 }}>
                Завершено встреч
              </div>
            </div>
          </div>

          <button
            onClick={handleMessage}
            disabled={messaging}
            style={{
              marginTop: 20,
              width: "100%",
              padding: "14px",
              borderRadius: 14,
              cursor: messaging ? "not-allowed" : "pointer",
              opacity: messaging ? 0.6 : 1,
              background: "#8B5CF6",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <MessageCircle size={17} />
            {messaging ? "Открываю…" : "Написать"}
          </button>
        </div>
      )}
    </div>
  );
}
