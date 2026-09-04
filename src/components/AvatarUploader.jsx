/**
 * AvatarUploader Component (v2 — click-on-avatar UX)
 *
 * Renders the avatar itself (same look as <Avatar>). Tapping it
 * opens a small dark-themed modal with two choices:
 *  - Upload own photo
 *  - Pick one of the default template avatars
 *
 * Usage in ProfileScreen (REPLACES the plain <Avatar .../> call):
 *
 * <AvatarUploader
 *   currentPhotoUrl={me.photo_url}
 *   size={84}
 *   ring="#8B5CF6"
 *   onAvatarChange={(updatedUser) => setMe(updatedUser)}
 * />
 */

import React, { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import {
  getDefaultAvatars,
  setDefaultAvatar,
  uploadAvatar,
} from "../api/users";

export default function AvatarUploader({
  currentPhotoUrl,
  size = 84,
  ring = "#8B5CF6",
  onAvatarChange,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultAvatars, setDefaultAvatars] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (modalOpen && defaultAvatars.length === 0) {
      getDefaultAvatars()
        .then((data) => setDefaultAvatars(data.avatars || []))
        .catch(() => {});
    }
  }, [modalOpen]);

  function handlePickFileClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Файл слишком большой (макс 5MB)");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Неподдерживаемый формат (jpg, png, gif, webp)");
      return;
    }

    setError("");
    setBusy(true);
    try {
      const updatedUser = await uploadAvatar(file);
      onAvatarChange(updatedUser);
      setModalOpen(false);
    } catch (err) {
      setError(err?.message || "Ошибка при загрузке аватара");
    } finally {
      setBusy(false);
    }
  }

  async function handlePickDefault(avatarId) {
    setError("");
    setBusy(true);
    try {
      const updatedUser = await setDefaultAvatar(avatarId);
      onAvatarChange(updatedUser);
      setModalOpen(false);
    } catch (err) {
      setError(err?.message || "Ошибка при выборе аватара");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Clickable avatar with camera badge */}
      <div
        onClick={() => setModalOpen(true)}
        style={{
          position: "relative",
          cursor: "pointer",
          width: size,
          height: size,
        }}
      >
        {currentPhotoUrl ? (
          <img
            src={currentPhotoUrl}
            alt=""
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              objectFit: "cover",
              border: `2px solid ${ring}`,
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              background: "#1D1D23",
              border: `2px solid ${ring}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#8C8C97",
            }}
          >
            <Camera size={size * 0.35} />
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "#8B5CF6",
            border: "2px solid #0A0A0C",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Camera size={13} color="#fff" />
        </div>
      </div>

      {/* Hidden file input, triggered programmatically */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Modal */}
      {modalOpen && (
        <div
          onClick={() => !busy && setModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#141418",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: "18px 18px 28px",
              border: "1px solid #232329",
              borderBottom: "none",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "#2A2A32",
                margin: "0 auto 16px",
              }}
            />
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "#F5F5F7",
                marginBottom: 14,
                textAlign: "center",
              }}
            >
              Фото профиля
            </div>

            {error && (
              <div
                style={{
                  color: "#FF5D7A",
                  fontSize: 13,
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            <button
              disabled={busy}
              onClick={handlePickFileClick}
              style={{
                width: "100%",
                padding: "13px",
                background: "#8B5CF6",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 14.5,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
                marginBottom: 16,
              }}
            >
              {busy ? "Загрузка…" : "📷 Загрузить свою фотку"}
            </button>

            <div style={{ fontSize: 13, color: "#8C8C97", marginBottom: 10 }}>
              Или выбери из шаблонов
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 10,
              }}
            >
              {defaultAvatars.map((avatar) => (
                <img
                  key={avatar.id}
                  src={avatar.url}
                  alt={avatar.name}
                  onClick={() => !busy && handlePickDefault(avatar.id)}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #2A2A32",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.6 : 1,
                  }}
                />
              ))}
            </div>

            <button
              disabled={busy}
              onClick={() => setModalOpen(false)}
              style={{
                width: "100%",
                padding: "12px",
                background: "transparent",
                color: "#8C8C97",
                border: "1px solid #2A2A32",
                borderRadius: 14,
                fontSize: 14,
                cursor: "pointer",
                marginTop: 18,
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  );
}
