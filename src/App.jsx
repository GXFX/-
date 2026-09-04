import MapView from "./components/MapView";
import AvatarUploader from "./components/AvatarUploader";
import { CitySelect } from "./screens/CitySelect";
import { PublicProfileScreen } from "./screens/PublicProfileScreen";
import {
  enablePushNotifications,
  disablePushNotifications,
  getPushSubscriptionStatus,
} from "./pushSetup";
import {
  getMe,
  updateMe,
  getUserReviews,
  searchUsers,
  sendFriendRequest,
  getIncomingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  getMyFriends,
  sendSupportMessage,
  requestVerification,
  deactivateMe,
} from "./api/users";
import { AuthScreen } from "./screens/AuthScreen";
import { isAuthed, onAuthLogout, logout } from "./api/auth";
import {
  getReports,
  updateReportStatus,
  getAdminUsers,
  banUser,
  unbanUser,
  getPendingVerifications,
  reviewVerification,
  updateUserBirthDate,
} from "./api/admin";
import {
  getMyJoinRequest,
  searchMeetups,
  getMeetup,
  createMeetup,
  joinMeetup,
  getJoinRequests,
  acceptJoinRequest,
  declineJoinRequest,
  updateMeetup,
  cancelMeetup,
  removeParticipant,
  getPendingReviewMeetups,
  createReview,
} from "./api/meetups";
import {
  getChats,
  getChatMessages,
  sendMessage,
  markChatRead,
  hideChat,
  getOrCreateDirectChat,
} from "./api/chats";
import { useGeoLocation } from "./hooks/useGeoLocation";
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Home,
  Map as MapIcon,
  Plus,
  MessageCircle,
  User,
  MapPin,
  Clock,
  ChevronLeft,
  Check,
  Star,
  Users,
  Search,
  Bell,
  Camera,
  Send,
  Flame,
  Dumbbell,
  Gamepad2,
  Music,
  Coffee,
  Film,
  BookOpen,
  PartyPopper,
  ShieldCheck,
  X,
  ChevronRight,
  Filter,
} from "lucide-react";

/* ---------------------------------------------------------------
   TOKENS
   bg-0 #0A0A0C   bg-1 #141418   bg-2 #1D1D23   line #2A2A32
   text hi #F5F5F7  text lo #8C8C97
   accent violet #8B5CF6  accent lime #C4FF3D  accent coral #FF5D7A
   accent amber #FFB454
----------------------------------------------------------------*/
const CATEGORIES = [
  {
    id: "bar",
    label: "Бар",
    icon: PartyPopper,
    color: "#FF5D7A",
    image:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop&q=60",
  },
  {
    id: "party",
    label: "Вечеринка",
    icon: PartyPopper,
    color: "#8B5CF6",
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop&q=60",
  },
  {
    id: "walk",
    label: "Прогулка",
    icon: Users,
    color: "#5DD8FF",
    image:
      "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=400&h=300&fit=crop&q=60",
  },
  {
    id: "restaurant",
    label: "Ресторан",
    icon: Film,
    color: "#FFB454",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&q=60",
  },
  {
    id: "coffee",
    label: "Кофе",
    icon: Coffee,
    color: "#C4A374",
    image:
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop&q=60",
  },
  {
    id: "gaming",
    label: "Игры",
    icon: Gamepad2,
    color: "#C4FF3D",
    image:
      "https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=400&h=300&fit=crop&q=60",
  },
  {
    id: "sports",
    label: "Спорт",
    icon: Dumbbell,
    color: "#5DD8FF",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop&q=60",
  },
  {
    id: "cinema",
    label: "Кино",
    icon: Film,
    color: "#FF5D7A",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop&q=60",
  },
  {
    id: "music",
    label: "Музыка",
    icon: Music,
    color: "#8B5CF6",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop&q=60",
  },
  {
    id: "hangout",
    label: "Тусовка",
    icon: PartyPopper,
    color: "#C4FF3D",
    image:
      "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=400&h=300&fit=crop&q=60",
  },
  {
    id: "other",
    label: "Другое",
    icon: Users,
    color: "#8C8C97",
    image:
      "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=400&h=300&fit=crop&q=60",
  },
];

const AVATARS = [
  "https://i.pravatar.cc/100?img=12",
  "https://i.pravatar.cc/100?img=32",
  "https://i.pravatar.cc/100?img=5",
  "https://i.pravatar.cc/100?img=48",
  "https://i.pravatar.cc/100?img=21",
  "https://i.pravatar.cc/100?img=15",
];

const MEETUPS = [
  {
    id: 1,
    title: "Вечерний баскет 3х3",
    category: "sport",
    distance: "650 м",
    time: "сегодня, 19:30",
    spots: 4,
    going: 3,
    organizer: {
      name: "Артём",
      verified: true,
      rating: 4.8,
      meetups: 26,
      avatar: AVATARS[0],
    },
    desc: "Собираем игру на площадке у школы №3. Уровень любой, главное настрой. Мячи есть, воду берите свою.",
    x: 58,
    y: 42,
  },
  {
    id: 2,
    title: "Настолки и чай",
    category: "games",
    distance: "1.2 км",
    time: "завтра, 18:00",
    spots: 6,
    going: 5,
    organizer: {
      name: "Лиза",
      verified: true,
      rating: 5.0,
      meetups: 41,
      avatar: AVATARS[1],
    },
    desc: "Каталан, Каркассон, Codenames — всё своё. Приносите печеньки, будет уютно.",
    x: 34,
    y: 61,
  },
  {
    id: 3,
    title: "Открытый микрофон",
    category: "music",
    distance: "2.4 км",
    time: "сб, 20:00",
    spots: 12,
    going: 9,
    organizer: {
      name: "Данил",
      verified: false,
      rating: 4.5,
      meetups: 8,
      avatar: AVATARS[2],
    },
    desc: "Приходи со своим инструментом или просто послушать. Акустика, без микрофонов на первом этаже.",
    x: 71,
    y: 28,
  },
  {
    id: 4,
    title: "Кофе и созвон по проекту",
    category: "chill",
    distance: "400 м",
    time: "сегодня, 12:00",
    spots: 3,
    going: 2,
    organizer: {
      name: "Соня",
      verified: true,
      rating: 4.9,
      meetups: 15,
      avatar: AVATARS[3],
    },
    desc: "Обсуждаем пет-проект на React, ищем ещё одного фронтендера в компанию.",
    x: 47,
    y: 52,
  },
  {
    id: 5,
    title: "Киновечер: Тарантино",
    category: "movie",
    distance: "3.1 км",
    time: "вс, 19:00",
    spots: 8,
    going: 6,
    organizer: {
      name: "Максим",
      verified: true,
      rating: 4.7,
      meetups: 19,
      avatar: AVATARS[4],
    },
    desc: "Смотрим Kill Bill на проекторе во дворе, если погода норм. Плед и попкорн — по желанию.",
    x: 22,
    y: 33,
  },
];

const CHATS = [
  {
    id: 1,
    meetupId: 1,
    title: "Вечерний баскет 3х3",
    last: "Артём: подъезжайте к 19:20, разминка",
    time: "18:02",
    unread: 2,
  },
  {
    id: 2,
    meetupId: 4,
    title: "Кофе и созвон по проекту",
    last: "Соня: скинула ссылку на репо ☝️",
    time: "вчера",
    unread: 0,
  },
  {
    id: 3,
    meetupId: 2,
    title: "Настолки и чай",
    last: "Ты: беру Codenames с собой",
    time: "вт",
    unread: 0,
  },
];

const ACTIVITY_LABELS = {
  bar: "Бар",
  party: "Вечеринка",
  walk: "Прогулка",
  restaurant: "Ресторан",
  coffee: "Кофе",
  gaming: "Игры",
  sports: "Спорт",
  cinema: "Кино",
  music: "Музыка",
  hangout: "Тусовка",
  other: "Другое",
};

function catMeta(activityType) {
  const found = CATEGORIES.find((c) => c.id === activityType);
  return (
    found || {
      id: activityType,
      label: ACTIVITY_LABELS[activityType] || activityType,
      color: "#8B5CF6",
      icon: Users,
    }
  );
}

/* ---------------------------------------------------------------
   SHARED UI
----------------------------------------------------------------*/

function TopBar({ title, onBack, right }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 18px 12px",
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "linear-gradient(#0A0A0CF2, #0A0A0CE8 70%, transparent)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 36,
        }}
      >
        {onBack && (
          <button onClick={onBack} style={iconBtnStyle}>
            <ChevronLeft size={20} color="#F5F5F7" />
          </button>
        )}
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: 20,
            color: "#F5F5F7",
          }}
        >
          {title}
        </span>
      </div>
      {right}
    </div>
  );
}

const iconBtnStyle = {
  width: 36,
  height: 36,
  borderRadius: 12,
  background: "#1D1D23",
  border: "1px solid #2A2A32",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

function Avatar({ src, size = 28, ring }) {
  return (
    <img
      src={src}
      alt=""
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        border: ring ? `2px solid ${ring}` : "2px solid #0A0A0C",
        display: "block",
      }}
    />
  );
}

function AvatarStack({ people = AVATARS, count = 3, going }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex" }}>
        {people.slice(0, count).map((a, i) => (
          <div
            key={i}
            style={{ marginLeft: i === 0 ? 0 : -10, zIndex: count - i }}
          >
            <Avatar src={a} size={26} />
          </div>
        ))}
      </div>
      <span style={{ fontSize: 12.5, color: "#8C8C97" }}>идут: {going}</span>
    </div>
  );
}

function Pill({ children, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        border: `1px solid ${active ? color || "#8B5CF6" : "#2A2A32"}`,
        background: active ? `${color || "#8B5CF6"}22` : "#141418",
        color: active ? color || "#8B5CF6" : "#8C8C97",
        fontSize: 13.5,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "'Inter', sans-serif",
        transition: "all .15s",
      }}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------
   FEED SCREEN
----------------------------------------------------------------*/

function MeetupCard({ m, onOpen }) {
  const cat = catMeta(m.activity_type);
  const Icon = cat.icon;
  const spotsLeft = m.max_participants
    ? m.max_participants - m.participant_count
    : null;

  return (
    <div
      onClick={onOpen}
      style={{
        background: "#141418",
        border: "1px solid #232329",
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          height: 90,
          position: "relative",
          overflow: "hidden",
          backgroundImage: cat.image ? `url(${cat.image})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#1D1D23",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, #0A0A0C11 20%, #0A0A0CE6 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 14,
            width: 38,
            height: 38,
            borderRadius: 12,
            background: "#0A0A0CDD",
            border: `1px solid ${cat.color}66`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={18} color={cat.color} />
        </div>
        {m.distance_km != null && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 12,
              padding: "5px 10px",
              borderRadius: 999,
              background: "#0A0A0CDD",
              fontSize: 11.5,
              fontWeight: 700,
              color: "#F5F5F7",
              display: "flex",
              alignItems: "center",
              gap: 4,
              border: "1px solid #2A2A32",
            }}
          >
            <MapPin size={11} color="#C4FF3D" /> {m.distance_km} км
          </div>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: 16.5,
            color: "#F5F5F7",
            marginBottom: 6,
          }}
        >
          {m.title || cat.label}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginBottom: 12,
          }}
        >
          <Clock size={13} color="#8C8C97" />
          <span style={{ fontSize: 13, color: "#8C8C97" }}>
            {new Date(m.start_time).toLocaleString("ru-RU", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12.5, color: "#8C8C97" }}>
            {m.participant_count} участников
          </span>
          {spotsLeft != null && (
            <span style={{ fontSize: 12.5, color: cat.color, fontWeight: 700 }}>
              {spotsLeft} мест свободно
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
function SupportScreen({ onBack }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    try {
      await sendSupportMessage(trimmed);
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <TopBar title="Поддержка" onBack={onBack} />
      <div style={{ padding: "6px 18px 100px" }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div
              style={{
                color: "#F5F5F7",
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 6,
              }}
            >
              Сообщение отправлено
            </div>
            <div style={{ color: "#8C8C97", fontSize: 13.5 }}>
              Мы рассмотрим его в ближайшее время
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                color: "#8C8C97",
                fontSize: 13.5,
                marginBottom: 14,
                lineHeight: 1.5,
              }}
            >
              Опишите проблему или вопрос — мы получим ваше сообщение и
              рассмотрим его.
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Что случилось?"
              rows={6}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                borderRadius: 14,
                background: "#141418",
                border: "1px solid #232329",
                color: "#F5F5F7",
                fontSize: 14.5,
                outline: "none",
                resize: "none",
                fontFamily: "'Inter', sans-serif",
                marginBottom: 12,
              }}
            />
            {error && (
              <div style={{ color: "#FF5D7A", fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
            )}
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                border: "none",
                cursor: text.trim() ? "pointer" : "default",
                background: text.trim()
                  ? "linear-gradient(135deg, #C4FF3D, #8B5CF6)"
                  : "#1D1D23",
                color: text.trim() ? "#0A0A0C" : "#8C8C97",
                fontWeight: 700,
                fontSize: 15,
                opacity: sending ? 0.6 : 1,
              }}
            >
              {sending ? "Отправка…" : "Отправить"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
function FeedScreen({ onOpenMeetup }) {
  const [filter, setFilter] = useState("all");
  const { coords, error: geoError } = useGeoLocation();
  const [meetups, setMeetups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    setError(null);
    searchMeetups({
      lat: coords.lat,
      lng: coords.lng,
      radius_km: 5,
      activity_type: filter === "all" ? undefined : filter,
    })
      .then(setMeetups)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [coords, filter]);

  const list = meetups;

  return (
    <div>
      <div
        style={{
          padding: "18px 18px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12.5,
              color: "#8C8C97",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <MapPin size={13} color="#C4FF3D" />{" "}
            {geoError ? "Местоположение по умолчанию" : "Рядом с вами"}
          </div>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 24,
              color: "#F5F5F7",
              marginTop: 2,
            }}
          >
            Встречи рядом
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={iconBtnStyle}>
            <Search size={17} color="#F5F5F7" />
          </button>
          <button style={{ ...iconBtnStyle, position: "relative" }}>
            <Bell size={17} color="#F5F5F7" />
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          padding: "12px 18px 18px",
          scrollbarWidth: "none",
        }}
      >
        <Pill active={filter === "all"} onClick={() => setFilter("all")}>
          Все
        </Pill>
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <Pill
              key={c.id}
              active={filter === c.id}
              color={c.color}
              onClick={() => setFilter(c.id)}
            >
              <Icon size={13} /> {c.label}
            </Pill>
          );
        })}
      </div>

      <div
        style={{
          padding: "0 18px 100px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#8C8C97",
              fontSize: 14,
            }}
          >
            Загрузка…
          </div>
        )}
        {error && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#FF5D7A",
              fontSize: 14,
            }}
          >
            Не удалось загрузить встречи: {error}
          </div>
        )}
        {!loading &&
          !error &&
          list.map((m) => (
            <MeetupCard key={m.id} m={m} onOpen={() => onOpenMeetup(m)} />
          ))}
        {!loading && !error && list.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#8C8C97",
              fontSize: 14,
            }}
          >
            Пока нет встреч в этой категории — стань первым, кто её создаст.
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
    SCREEN — signature element: glowing active-zone boundary
----------------------------------------------------------------*/

/* ---------------------------------------------------------------
   MAP SCREEN — signature element: glowing active-zone boundary
----------------------------------------------------------------*/

/* ---------------------------------------------------------------
   MAP SCREEN — real map with live meetup pins
----------------------------------------------------------------*/

function MapScreen({ onOpenMeetup, onStartCreateAt }) {
  const [placing, setPlacing] = useState(false);
  const [dropped, setDropped] = useState(null);
  const { coords } = useGeoLocation();
  const [meetups, setMeetups] = useState([]);
  const [loading, setLoading] = useState(true);

  const center = coords || { lat: 55.9106, lng: 37.7359 };

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    searchMeetups({ lat: coords.lat, lng: coords.lng, radius_km: 10 })
      .then(setMeetups)
      .catch(() => setMeetups([]))
      .finally(() => setLoading(false));
  }, [coords]);

  const [zoneError, setZoneError] = useState(false);

  function handleMapClick(lat, lng, outOfZone) {
    if (outOfZone) {
      setZoneError(true);
      setTimeout(() => setZoneError(false), 2000);
      return;
    }
    setDropped({ lat, lng });
  }

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <TopBar title="Карта" />
      <div style={{ padding: "0 18px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: "#141418",
            border: "1px solid #232329",
            borderRadius: 14,
            fontSize: 13,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#C4FF3D",
              boxShadow: "0 0 8px #C4FF3D",
            }}
          />
          <span style={{ color: "#F5F5F7", fontWeight: 600 }}>
            {loading ? "Загрузка встреч…" : `${meetups.length} встреч рядом`}
          </span>
        </div>
      </div>

      <div
        style={{
          margin: "0 18px",
          borderRadius: 24,
          overflow: "hidden",
          position: "relative",
          border: "1px solid #232329",
          height: "calc(100vh - 340px)",
          minHeight: 340,
        }}
      >
        <MapView
          center={center}
          meetups={meetups}
          droppedPoint={dropped}
          placing={placing}
          onMapClick={handleMapClick}
          onMeetupClick={onOpenMeetup}
        />

        <button
          onClick={() => {
            if (placing && dropped) {
              onStartCreateAt(dropped);
            } else {
              setPlacing(!placing);
              setDropped(null);
            }
          }}
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            width: 52,
            height: 52,
            borderRadius: 16,
            background: placing ? "#C4FF3D" : "#8B5CF6",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 6px 20px ${placing ? "#C4FF3D66" : "#8B5CF666"}`,
            zIndex: 1000,
          }}
        >
          {placing && dropped ? (
            <Check size={22} color="#0A0A0C" />
          ) : (
            <Plus size={24} color="#fff" />
          )}
        </button>

        {placing && !dropped && (
          <div
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              right: 70,
              padding: "8px 12px",
              background: zoneError ? "#2A1418DD" : "#0A0A0CDD",
              border: zoneError ? "1px solid #FF5D7A" : "1px solid #8B5CF6",
              borderRadius: 12,
              fontSize: 12.5,
              color: zoneError ? "#FF5D7A" : "#F5F5F7",
              zIndex: 1000,
            }}
          >
            {zoneError
              ? "Здесь пока нельзя — доступны только Мытищи"
              : "Тапни по карте, чтобы поставить точку встречи"}
          </div>
        )}
      </div>
    </div>
  );
}
function ReviewScreen({ meetupId, me, onBack, onOpenProfile }) {
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rated, setRated] = useState({});
  const [drafts, setDrafts] = useState({});
  const [submitting, setSubmitting] = useState({});

  useEffect(() => {
    getMeetup(meetupId)
      .then(setM)
      .finally(() => setLoading(false));
  }, [meetupId]);

  function setDraftRating(userId, rating) {
    setDrafts((prev) => ({ ...prev, [userId]: { ...prev[userId], rating } }));
  }

  function setDraftComment(userId, comment) {
    setDrafts((prev) => ({ ...prev, [userId]: { ...prev[userId], comment } }));
  }

  async function handleSubmit(userId) {
    const draft = drafts[userId];
    if (!draft?.rating) return;
    setSubmitting((prev) => ({ ...prev, [userId]: true }));
    try {
      await createReview(meetupId, userId, draft.rating, draft.comment || "");
      setRated((prev) => ({ ...prev, [userId]: draft.rating }));
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting((prev) => ({ ...prev, [userId]: false }));
    }
  }

  if (loading || !m) {
    return (
      <div>
        <TopBar title="Оценить участников" onBack={onBack} />
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#8C8C97",
          }}
        >
          Загрузка…
        </div>
      </div>
    );
  }

  const allPeople = [m.creator, ...(m.participants || [])].filter(
    (p, i, arr) => p.id !== me?.id && arr.findIndex((x) => x.id === p.id) === i,
  );
  const others = allPeople.sort((a, b) => {
    if (a.id === m.creator.id) return -1;
    if (b.id === m.creator.id) return 1;
    return 0;
  });

  return (
    <div>
      <TopBar title="Оценить участников" onBack={onBack} />
      <div
        style={{
          padding: "6px 18px 100px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {others.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#8C8C97",
            }}
          >
            Некого оценивать
          </div>
        )}
        {others.map((p) => {
          const isCreator = p.id === m.creator.id;
          const draft = drafts[p.id] || {};
          const done = rated[p.id];

          return (
            <div
              key={p.id}
              style={{
                padding: "14px",
                borderRadius: 16,
                background: isCreator ? "#1A1F14" : "#141418",
                border: isCreator
                  ? "1.5px solid #C4FF3D77"
                  : "1px solid #232329",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: done ? 0 : 12,
                }}
              >
                <div
                  onClick={() => onOpenProfile(p.id)}
                  style={{ cursor: "pointer" }}
                >
                  <Avatar src={p.photo_url} size={44} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14.5,
                      color: "#F5F5F7",
                    }}
                  >
                    {p.name}
                  </div>
                  {isCreator && (
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "#C4FF3D",
                        fontWeight: 700,
                        marginTop: 1,
                      }}
                    >
                      ⭐ Организатор
                    </div>
                  )}
                </div>
                {done && (
                  <div
                    style={{ color: "#C4FF3D", fontSize: 13, fontWeight: 700 }}
                  >
                    Оценено ✓
                  </div>
                )}
              </div>

              {!done && (
                <>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        onClick={() => setDraftRating(p.id, v)}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          borderRadius: 10,
                          cursor: "pointer",
                          background:
                            draft.rating === v ? "#C4FF3D" : "#1D1D23",
                          border:
                            draft.rating === v ? "none" : "1px solid #232329",
                          color: draft.rating === v ? "#0A0A0C" : "#F5F5F7",
                          fontSize: 15,
                          fontWeight: 700,
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Отзыв (необязательно)"
                    value={draft.comment || ""}
                    onChange={(e) => setDraftComment(p.id, e.target.value)}
                    rows={2}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "9px 11px",
                      borderRadius: 10,
                      background: "#1D1D23",
                      border: "1px solid #232329",
                      color: "#F5F5F7",
                      fontSize: 13,
                      outline: "none",
                      resize: "none",
                      fontFamily: "'Inter', sans-serif",
                      marginBottom: 10,
                    }}
                  />
                  <button
                    onClick={() => handleSubmit(p.id)}
                    disabled={!draft.rating || submitting[p.id]}
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: 10,
                      border: "none",
                      cursor: draft.rating ? "pointer" : "default",
                      background: draft.rating
                        ? "linear-gradient(135deg, #C4FF3D, #8B5CF6)"
                        : "#1D1D23",
                      color: draft.rating ? "#0A0A0C" : "#8C8C97",
                      fontWeight: 700,
                      fontSize: 13.5,
                      opacity: submitting[p.id] ? 0.6 : 1,
                    }}
                  >
                    {submitting[p.id] ? "Отправка…" : "Опубликовать оценку"}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditMeetupScreen({ meetupId, onClose, onSaved }) {
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMeetup(meetupId).then((data) => {
      setM(data);
      setTitle(data.title || "");
      setDescription(data.description || "");
      const start = new Date(data.start_time);
      setDate(start.toISOString().slice(0, 10));
      setTime(start.toISOString().slice(11, 16));
      setMaxParticipants(data.max_participants || "");
      setLoading(false);
    });
  }, [meetupId]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const startTime = new Date(`${date}T${time}:00`);
      await updateMeetup(meetupId, {
        title: title || null,
        description: description || null,
        start_time: startTime.toISOString(),
        max_participants: maxParticipants ? Number(maxParticipants) : null,
      });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <TopBar title="Редактирование" onBack={onClose} />
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#8C8C97",
          }}
        >
          Загрузка…
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Редактирование" onBack={onClose} />
      <div
        style={{
          padding: "6px 18px 120px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <Field label="Название">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Дата" style={{ flex: 1 }}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Время" style={{ flex: 1 }}>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="Сколько человек нужно">
          <input
            type="number"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Описание">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{
              ...inputStyle,
              resize: "none",
              fontFamily: "'Inter', sans-serif",
            }}
          />
        </Field>

        {error && <div style={{ color: "#FF5D7A", fontSize: 13 }}>{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            marginTop: 4,
            padding: "15px",
            borderRadius: 16,
            border: "none",
            cursor: submitting ? "default" : "pointer",
            background: "linear-gradient(135deg, #C4FF3D, #8B5CF6)",
            color: "#0A0A0C",
            fontWeight: 700,
            fontSize: 15,
            fontFamily: "'Space Grotesk', sans-serif",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Сохранение…" : "Сохранить изменения"}
        </button>
      </div>
    </div>
  );
}
/* ---------------------------------------------------------------
   CREATE MEETUP SCREEN
----------------------------------------------------------------*/

function CreateScreen({ presetPoint, onClose, onCreated }) {
  const [category, setCategory] = useState("sports");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("2026-08-22");
  const [time, setTime] = useState("19:30");
  const [maxParticipants, setMaxParticipants] = useState(6);
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const cat = catMeta(category);

  async function handleSubmit() {
    if (!presetPoint) {
      setError("Сначала выбери точку на карте");
      return;
    }
    if (!date || !time) {
      setError("Укажи дату и время");
      return;
    }

    setSubmitting(true);
    setError(null);

    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // +2 часа по умолчанию

    try {
      const created = await createMeetup({
        title: title || null,
        description: description || null,
        activity_type: category,
        place_name: null,
        latitude: presetPoint.lat,
        longitude: presetPoint.lng,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        max_participants: maxParticipants ? Number(maxParticipants) : null,
        min_age: minAge ? Number(minAge) : null,
        max_age: maxAge ? Number(maxAge) : null,
        visibility: "public",
      });
      onCreated(created);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <TopBar title="Новая встреча" onBack={onClose} />
      <div
        style={{
          padding: "6px 18px 120px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div
          style={{
            height: 130,
            borderRadius: 18,
            border: "1.5px dashed #2A2A32",
            background: "#141418",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Camera size={22} color="#8C8C97" />
          <span style={{ fontSize: 12.5, color: "#8C8C97" }}>
            Добавить фото или обложку
          </span>
        </div>

        <Field label="Название">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например, вечерний баскет 3х3"
            style={inputStyle}
          />
        </Field>

        <Field label="Категория">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = category === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  style={{
                    position: "relative",
                    height: 92,
                    borderRadius: 16,
                    overflow: "hidden",
                    cursor: "pointer",
                    backgroundImage: `url(${c.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: active
                      ? `2px solid ${c.color}`
                      : "2px solid transparent",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, #0A0A0C11 30%, #0A0A0CE6 100%)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 10,
                      bottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "#0A0A0CCC",
                        border: `1.5px solid ${c.color}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={14} color={c.color} />
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#F5F5F7",
                      }}
                    >
                      {c.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Field>

        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Дата" style={{ flex: 1 }}>
            <input
              type="date"
              style={inputStyle}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Время" style={{ flex: 1 }}>
            <input
              type="time"
              style={inputStyle}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Сколько человек нужно">
          <input
            type="number"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Возраст от" style={{ flex: 1 }}>
            <input
              type="number"
              placeholder="18"
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Возраст до" style={{ flex: 1 }}>
            <input
              type="number"
              placeholder="99"
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="Точка на карте">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 14px",
              background: "#141418",
              border: "1px solid #232329",
              borderRadius: 14,
            }}
          >
            <MapPin size={16} color={presetPoint ? "#C4FF3D" : "#8C8C97"} />
            <span
              style={{
                fontSize: 13.5,
                color: presetPoint ? "#F5F5F7" : "#8C8C97",
              }}
            >
              {presetPoint
                ? "Точка выбрана на карте"
                : "Точка не выбрана — открой карту"}
            </span>
          </div>
        </Field>

        <Field label="Описание">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Расскажи, что вас ждёт, что взять с собой…"
            rows={4}
            style={{
              ...inputStyle,
              resize: "none",
              fontFamily: "'Inter', sans-serif",
            }}
          />
        </Field>

        {error && <div style={{ color: "#FF5D7A", fontSize: 13 }}>{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            marginTop: 4,
            padding: "15px",
            borderRadius: 16,
            border: "none",
            cursor: submitting ? "default" : "pointer",
            background: `linear-gradient(135deg, ${cat.color}, #8B5CF6)`,
            color: "#0A0A0C",
            fontWeight: 700,
            fontSize: 15,
            fontFamily: "'Space Grotesk', sans-serif",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Публикация…" : "Опубликовать встречу"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={style}>
      <div
        style={{
          fontSize: 12.5,
          color: "#8C8C97",
          marginBottom: 7,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 14px",
  borderRadius: 14,
  background: "#141418",
  border: "1px solid #232329",
  color: "#F5F5F7",
  fontSize: 14.5,
  outline: "none",
  fontFamily: "'Inter', sans-serif",
};

/* ---------------------------------------------------------------
   EVENT DETAIL SCREEN
----------------------------------------------------------------*/

function DetailScreen({
  meetupId,
  me,
  onBack,
  onOpenChat,
  onEdit,
  onReview,
  onOpenProfile,
}) {
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [myRequestStatus, setMyRequestStatus] = useState(null);
  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    getMeetup(meetupId)
      .then(setM)
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, [meetupId]);

  useEffect(() => {
    if (!m || !me || m.creator?.id !== me.id) return;
    setRequestsLoading(true);
    getJoinRequests(meetupId)
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setRequestsLoading(false));
  }, [m, me, meetupId]);

  useEffect(() => {
    if (!m || !me || m.creator?.id === me.id) return;
    getMyJoinRequest(meetupId)
      .then((r) => setMyRequestStatus(r ? r.status : null))
      .catch(() => setMyRequestStatus(null));
  }, [m, me, meetupId]);

  async function handleAccept(requestId) {
    await acceptJoinRequest(meetupId, requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    getMeetup(meetupId).then(setM);
  }

  async function handleCancel() {
    if (!window.confirm("Точно отменить встречу?")) return;
    setCancelling(true);
    try {
      await cancelMeetup(meetupId);
      onBack();
    } catch (e) {
      setCancelling(false);
      alert(e.message);
    }
  }
  async function handleKick(userId) {
    if (!window.confirm("Убрать этого участника из встречи?")) return;
    try {
      await removeParticipant(meetupId, userId);
      getMeetup(meetupId).then(setM);
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDecline(requestId) {
    await declineJoinRequest(meetupId, requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }

  async function handleJoin() {
    setJoining(true);
    setJoinError(null);
    try {
      await joinMeetup(meetupId);
      setMyRequestStatus("pending");
    } catch (e) {
      setJoinError(e.message);
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div>
        <TopBar title="" onBack={onBack} />
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#8C8C97",
          }}
        >
          Загрузка…
        </div>
      </div>
    );
  }

  if (loadError || !m) {
    return (
      <div>
        <TopBar title="" onBack={onBack} />
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#FF5D7A",
          }}
        >
          Не удалось загрузить встречу{loadError ? `: ${loadError}` : ""}
        </div>
      </div>
    );
  }

  const cat = catMeta(m.activity_type);
  const Icon = cat.icon;
  const isOwner = me && m.creator && me.id === m.creator.id;
  const isParticipant =
    me && (m.participants || []).some((p) => p.id === me.id);

  return (
    <div>
      <TopBar title="" onBack={onBack} />
      <div style={{ padding: "0 18px 130px" }}>
        <div
          style={{
            height: 170,
            borderRadius: 22,
            position: "relative",
            overflow: "hidden",
            backgroundImage: cat.image ? `url(${cat.image})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: "#141418",
            marginTop: -8,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, #0A0A0C11 25%, #0A0A0CF0 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: 16,
              width: 46,
              height: 46,
              borderRadius: 14,
              background: "#0A0A0CDD",
              border: `1px solid ${cat.color}66`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={22} color={cat.color} />
          </div>
        </div>

        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 23,
            color: "#F5F5F7",
            marginTop: 18,
          }}
        >
          {m.title || cat.label}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
            color: "#8C8C97",
            fontSize: 13.5,
          }}
        >
          <Clock size={14} />
          {new Date(m.start_time).toLocaleString("ru-RU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
          <span style={{ opacity: 0.5 }}>·</span>
          <Users size={14} /> {m.participant_count}
          {m.max_participants ? `/${m.max_participants}` : ""} собрались
        </div>

        <div
          style={{
            marginTop: 18,
            padding: "14px 16px",
            background: "#141418",
            border: "1px solid #232329",
            borderRadius: 18,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            onClick={() => onOpenProfile(m.creator.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flex: 1,
              cursor: "pointer",
            }}
          >
            <Avatar src={m.creator?.photo_url} size={46} />
            <div style={{ flex: 1 }}>
              <div
                style={{ fontWeight: 700, fontSize: 14.5, color: "#F5F5F7" }}
              >
                {m.creator?.name || "Организатор"}
              </div>
              {m.creator?.username && (
                <div style={{ fontSize: 12, color: "#8C8C97" }}>
                  @{m.creator.username}
                </div>
              )}
            </div>
          </div>
          {me && m.creator?.id !== me.id && (
            <button
              onClick={async () => {
                const chat = await getOrCreateDirectChat(m.creator.id);
                onOpenChat(chat.id, m.creator.name);
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "#1D1D23",
                border: "1px solid #232329",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <MessageCircle size={18} color="#F5F5F7" />
            </button>
          )}
        </div>

        {m.description && (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#F5F5F7",
                marginBottom: 8,
              }}
            >
              Описание
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#B4B4BC" }}>
              {m.description}
            </div>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: "#F5F5F7",
              marginBottom: 8,
            }}
          >
            Место
          </div>
          {isOwner || isParticipant ? (
            <div style={{ fontSize: 14, color: "#B4B4BC" }}>
              {m.place_name || "Точка на карте"}
            </div>
          ) : (
            <div style={{ fontSize: 13.5, color: "#8C8C97", lineHeight: 1.5 }}>
              Примерный район — точный адрес откроется после того, как
              организатор примет заявку
            </div>
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: "#F5F5F7",
              marginBottom: 10,
            }}
          >
            Участники
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(m.participants || []).map((p) => (
              <div
                key={p.id}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <div
                  onClick={() => onOpenProfile(p.id)}
                  style={{ cursor: "pointer" }}
                >
                  <Avatar src={p.photo_url} size={40} />
                </div>
                <span style={{ flex: 1, fontSize: 14, color: "#F5F5F7" }}>
                  {p.name}
                </span>
                {isOwner && p.id !== me?.id && (
                  <button
                    onClick={() => handleKick(p.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 10,
                      background: "#2A1418",
                      border: "1px solid #4A1F26",
                      color: "#FF5D7A",
                      fontSize: 12.5,
                      cursor: "pointer",
                    }}
                  >
                    Убрать
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {isOwner && (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#F5F5F7",
                marginBottom: 10,
              }}
            >
              Заявки{requests.length > 0 ? ` (${requests.length})` : ""}
            </div>
            {requestsLoading && (
              <div style={{ color: "#8C8C97", fontSize: 13 }}>Загрузка…</div>
            )}
            {!requestsLoading && requests.length === 0 && (
              <div style={{ color: "#8C8C97", fontSize: 13 }}>
                Пока никто не подал заявку
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {requests.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: "#141418",
                    border: "1px solid #232329",
                    borderRadius: 14,
                  }}
                >
                  <div
                    onClick={() => onOpenProfile(r.user?.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <Avatar src={r.user?.photo_url} size={38} />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: "#F5F5F7",
                      fontWeight: 600,
                    }}
                  >
                    {r.user?.name || "Пользователь"}
                  </div>
                  <button
                    onClick={() => handleDecline(r.id)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "#1D1D23",
                      border: "1px solid #232329",
                      color: "#FF5D7A",
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => handleAccept(r.id)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "#C4FF3D",
                      border: "none",
                      color: "#0A0A0C",
                      cursor: "pointer",
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {joinError && (
          <div style={{ marginTop: 14, color: "#FF5D7A", fontSize: 13 }}>
            {joinError}
          </div>
        )}
      </div>

      {new Date(m.end_time) < new Date() && (isOwner || isParticipant) && (
        <div style={{ padding: "0 18px", marginBottom: -6 }}>
          <button
            onClick={onReview}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 14,
              cursor: "pointer",
              background: "#141418",
              border: "1px solid #C4FF3D55",
              color: "#C4FF3D",
              fontWeight: 700,
              fontSize: 13.5,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            ⭐ Оценить участников
          </button>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 460,
          margin: "0 auto",
          padding: "14px 18px 22px",
          background: "linear-gradient(#0A0A0C00, #0A0A0C 30%)",
          display: "flex",
          gap: 10,
        }}
      >
        {isOwner ? (
          <>
            <button
              onClick={() => onOpenChat(m.chat_id, m.title || "Чат встречи")}
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "#141418",
                border: "1px solid #232329",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <MessageCircle size={20} color="#F5F5F7" />
            </button>
            <button
              onClick={onEdit}
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: 16,
                cursor: "pointer",
                background: "#141418",
                border: "1px solid #232329",
                color: "#F5F5F7",
                fontWeight: 700,
                fontSize: 14.5,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Редактировать
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: 16,
                cursor: cancelling ? "default" : "pointer",
                background: "#2A1418",
                border: "1px solid #4A1F26",
                color: "#FF5D7A",
                fontWeight: 700,
                fontSize: 14.5,
                fontFamily: "'Space Grotesk', sans-serif",
                opacity: cancelling ? 0.6 : 1,
              }}
            >
              {cancelling ? "Отмена…" : "Отменить встречу"}
            </button>
          </>
        ) : (
          <>
            {isParticipant && (
              <button
                onClick={() => onOpenChat(m.chat_id, m.title || "Чат встречи")}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: "#141418",
                  border: "1px solid #232329",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <MessageCircle size={20} color="#F5F5F7" />
              </button>
            )}
            {isParticipant ? (
              <button
                disabled
                style={{
                  flex: 1,
                  padding: "16px",
                  borderRadius: 16,
                  border: "1px solid #C4FF3D55",
                  background: "#1D1D23",
                  color: "#C4FF3D",
                  fontWeight: 700,
                  fontSize: 15,
                  fontFamily: "'Space Grotesk', sans-serif",
                  cursor: "default",
                }}
              >
                Ты участник ✓
              </button>
            ) : myRequestStatus === "pending" ? (
              <button
                disabled
                style={{
                  flex: 1,
                  padding: "16px",
                  borderRadius: 16,
                  border: "1px solid #2A2A32",
                  background: "#1D1D23",
                  color: "#8C8C97",
                  fontWeight: 700,
                  fontSize: 15,
                  fontFamily: "'Space Grotesk', sans-serif",
                  cursor: "default",
                }}
              >
                Заявка на рассмотрении
              </button>
            ) : myRequestStatus === "declined" ? (
              <div style={{ flex: 1 }}>
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: 16,
                    border: "1px solid #FF5D7A55",
                    background: "#2A1418",
                    color: "#FF5D7A",
                    fontWeight: 700,
                    fontSize: 15,
                    fontFamily: "'Space Grotesk', sans-serif",
                    cursor: joining ? "default" : "pointer",
                    opacity: joining ? 0.6 : 1,
                  }}
                >
                  {joining ? "Отправка…" : "Вам отказали"}
                </button>
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 11.5,
                    color: "#8C8C97",
                    marginTop: 6,
                  }}
                >
                  Нажмите на кнопку, чтобы отправить заявку снова
                </div>
              </div>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                style={{
                  flex: 1,
                  padding: "16px",
                  borderRadius: 16,
                  border: "none",
                  background: `linear-gradient(135deg, ${cat.color}, #8B5CF6)`,
                  color: "#0A0A0C",
                  fontWeight: 700,
                  fontSize: 15,
                  fontFamily: "'Space Grotesk', sans-serif",
                  cursor: joining ? "default" : "pointer",
                  opacity: joining ? 0.6 : 1,
                }}
              >
                {joining ? "Отправка…" : "Отправить заявку"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
/* ---------------------------------------------------------------
   CHATS
----------------------------------------------------------------*/

function ChatsScreen({ onOpenChat, onOpenSearch }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getChats()
      .then(setChats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <TopBar
        title="Чаты"
        right={
          <button onClick={onOpenSearch} style={iconBtnStyle}>
            <Search size={18} color="#F5F5F7" />
          </button>
        }
      />
      <div style={{ padding: "0 18px 100px" }}>
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#8C8C97",
            }}
          >
            Загрузка…
          </div>
        )}
        {error && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#FF5D7A",
            }}
          >
            {error}
          </div>
        )}
        {!loading && !error && chats.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#8C8C97",
            }}
          >
            У вас пока нет чатов
          </div>
        )}
        {!loading &&
          !error &&
          chats.map((chat) => {
            const title = chat.is_private
              ? chat.other_user
                ? chat.other_user.name
                : "Личный чат"
              : chat.title || "Чат встречи";
            return (
              <div
                key={chat.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 4px",
                  borderBottom: "1px solid #1D1D23",
                }}
              >
                <div
                  onClick={() => onOpenChat(chat.id, title)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flex: 1,
                    minWidth: 0,
                    cursor: "pointer",
                  }}
                >
                  <Avatar src={chat.other_user?.photo_url} size={46} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#F5F5F7",
                      }}
                    >
                      {title}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#8C8C97",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {chat.last_message || "Нет сообщений"}
                    </div>
                  </div>
                  {chat.unread_count > 0 && (
                    <div
                      style={{
                        minWidth: 22,
                        height: 22,
                        borderRadius: 11,
                        background: "#C4FF3D",
                        color: "#0A0A0C",
                        fontSize: 11.5,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 6px",
                        flexShrink: 0,
                      }}
                    >
                      {chat.unread_count}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Удалить чат из списка?")) {
                      hideChat(chat.id).then(() =>
                        setChats((prev) =>
                          prev.filter((c) => c.id !== chat.id),
                        ),
                      );
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#8C8C97",
                    fontSize: 18,
                    cursor: "pointer",
                    padding: "4px 8px",
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}
function UserSearchScreen({ onBack, onOpenChat, onOpenProfile }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [incoming, setIncoming] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const isSearching = query.trim().length >= 2;

  useEffect(() => {
    getIncomingFriendRequests()
      .then(setIncoming)
      .catch(() => {});
    getMyFriends()
      .then(setFriends)
      .catch(() => {})
      .finally(() => setFriendsLoading(false));
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      searchUsers(q)
        .then(setResults)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  function updateRelation(userId, status, requestId) {
    setResults((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              relation_status: status,
              request_id: requestId ?? u.request_id,
            }
          : u,
      ),
    );
  }

  async function handleAdd(u) {
    setBusyId(u.id);
    try {
      if (u.relation_status === "request_received") {
        await acceptFriendRequest(u.request_id);
        updateRelation(u.id, "friends");
      } else {
        const res = await sendFriendRequest(u.id);
        updateRelation(u.id, res.relation_status, res.request_id);
      }
    } catch (e) {
      alert("Не получилось выполнить действие");
    } finally {
      setBusyId(null);
    }
  }

  async function handleAcceptIncoming(req) {
    setBusyId(req.id);
    try {
      await acceptFriendRequest(req.id);
      setIncoming((prev) => prev.filter((r) => r.id !== req.id));
      updateRelation(req.requester.id, "friends");
    } catch (e) {
      alert("Не получилось принять заявку");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeclineIncoming(req) {
    setBusyId(req.id);
    try {
      await declineFriendRequest(req.id);
      setIncoming((prev) => prev.filter((r) => r.id !== req.id));
    } catch (e) {
      alert("Не получилось отклонить заявку");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMessage(u) {
    try {
      const chat = await getOrCreateDirectChat(u.id);
      onOpenChat(chat.id, u.name);
    } catch (e) {
      alert("Не получилось открыть чат");
    }
  }

  return (
    <div>
      <TopBar title="Найти людей" onBack={onBack} />
      <div style={{ padding: "0 18px 100px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#141418",
            border: "1px solid #232329",
            borderRadius: 14,
            padding: "10px 14px",
            marginBottom: 18,
          }}
        >
          <Search size={18} color="#8C8C97" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Имя или телефон..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#F5F5F7",
              fontSize: 14,
            }}
          />
        </div>

        {incoming.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#F5F5F7",
                marginBottom: 10,
              }}
            >
              Заявки в друзья
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {incoming.map((req) => (
                <div
                  key={req.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: "#141418",
                    border: "1px solid #C4FF3D55",
                    borderRadius: 14,
                  }}
                >
                  <div
                    onClick={() => onOpenProfile(req.requester?.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <Avatar src={req.requester?.photo_url} size={40} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#F5F5F7",
                      }}
                    >
                      {req.requester?.name}
                    </div>
                  </div>
                  <button
                    disabled={busyId === req.id}
                    onClick={() => handleAcceptIncoming(req)}
                    style={{
                      background: "#C4FF3D",
                      color: "#0A0A0C",
                      border: "none",
                      borderRadius: 10,
                      padding: "7px 12px",
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                    }}
                  >
                    Принять
                  </button>
                  <button
                    disabled={busyId === req.id}
                    onClick={() => handleDeclineIncoming(req)}
                    style={{
                      background: "#1D1D23",
                      color: "#8C8C97",
                      border: "1px solid #2A2A32",
                      borderRadius: 10,
                      padding: "7px 12px",
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isSearching ? (
          <>
            {loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#8C8C97",
                }}
              >
                Ищем…
              </div>
            )}
            {!loading && results.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#8C8C97",
                }}
              >
                Никого не нашли
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {results.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 4px",
                    borderBottom: "1px solid #1D1D23",
                  }}
                >
                  <div
                    onClick={() => onOpenProfile(u.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <Avatar src={u.photo_url} size={44} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14.5,
                        color: "#F5F5F7",
                      }}
                    >
                      {u.name}
                    </div>
                  </div>

                  {u.relation_status === "friends" && (
                    <button
                      onClick={() => handleMessage(u)}
                      style={iconBtnStyle}
                    >
                      <MessageCircle size={17} color="#C4FF3D" />
                    </button>
                  )}

                  {u.relation_status === "none" && (
                    <button
                      disabled={busyId === u.id}
                      onClick={() => handleAdd(u)}
                      style={{
                        background: "#C4FF3D",
                        color: "#0A0A0C",
                        border: "none",
                        borderRadius: 10,
                        padding: "8px 14px",
                        fontWeight: 700,
                        fontSize: 12.5,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      + Добавить
                    </button>
                  )}

                  {u.relation_status === "request_sent" && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "#8C8C97",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Заявка отправлена
                    </span>
                  )}

                  {u.relation_status === "request_received" && (
                    <button
                      disabled={busyId === u.id}
                      onClick={() => handleAdd(u)}
                      style={{
                        background: "#C4FF3D",
                        color: "#0A0A0C",
                        border: "none",
                        borderRadius: 10,
                        padding: "8px 14px",
                        fontWeight: 700,
                        fontSize: 12.5,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Принять
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#F5F5F7",
                marginBottom: 10,
              }}
            >
              Друзья
            </div>
            {friendsLoading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#8C8C97",
                }}
              >
                Загрузка…
              </div>
            )}
            {!friendsLoading && friends.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#8C8C97",
                }}
              >
                Пока нет друзей — найдите их через поиск выше
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {friends.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 4px",
                    borderBottom: "1px solid #1D1D23",
                  }}
                >
                  <div
                    onClick={() => onOpenProfile(f.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <Avatar src={f.photo_url} size={44} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14.5,
                        color: "#F5F5F7",
                      }}
                    >
                      {f.name}
                    </div>
                  </div>
                  <button onClick={() => handleMessage(f)} style={iconBtnStyle}>
                    <MessageCircle size={17} color="#C4FF3D" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
function ChatDetailScreen({ chatId, chatTitle, me, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getChatMessages(chatId)
        .then((data) => {
          if (!cancelled) setMessages(data);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    load();
    markChatRead(chatId).catch(() => {});
    const interval = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const newMsg = await sendMessage(chatId, content);
      setMessages((prev) => [...prev, newMsg]);
      setText("");
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopBar title={chatTitle} onBack={onBack} />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#8C8C97",
            }}
          >
            Загрузка…
          </div>
        )}
        {messages.map((m) => {
          const isMine = m.sender_id === me?.id;
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "72%",
                  padding: "9px 13px",
                  borderRadius: 14,
                  background: isMine
                    ? "linear-gradient(135deg, #8B5CF6, #C4FF3D22)"
                    : "#141418",
                  border: isMine ? "none" : "1px solid #232329",
                  color: "#F5F5F7",
                  fontSize: 14,
                }}
              >
                {!isMine && m.sender && m.message_type !== "system" && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#8C8C97",
                      marginBottom: 3,
                      fontWeight: 600,
                    }}
                  >
                    {m.sender.name}
                  </div>
                )}
                <div
                  style={{
                    fontStyle:
                      m.message_type === "system" ? "italic" : "normal",
                    opacity: m.message_type === "system" ? 0.7 : 1,
                  }}
                >
                  {m.content}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: isMine ? "#0A0A0C99" : "#8C8C97",
                    marginTop: 3,
                    textAlign: "right",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 3,
                  }}
                >
                  {new Date(m.created_at).toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {isMine && (
                    <span
                      style={{ color: m.is_read ? "#5DD8FF" : "#0A0A0C99" }}
                    >
                      {m.is_read ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 18px 18px",
          borderTop: "1px solid #1D1D23",
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Сообщение…"
          style={{
            flex: 1,
            padding: "11px 14px",
            borderRadius: 20,
            border: "1px solid #232329",
            background: "#141418",
            color: "#F5F5F7",
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending}
          style={{
            padding: "11px 18px",
            borderRadius: 20,
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, #C4FF3D, #8B5CF6)",
            color: "#0A0A0C",
            fontWeight: 700,
            fontSize: 14,
            opacity: sending ? 0.6 : 1,
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
function MyReviewsScreen({ userId, onBack, onOpenProfile }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getUserReviews(userId)
      .then(setReviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const filtered =
    filter === "all" ? reviews : reviews.filter((r) => r.rating === filter);
  const sorted = [...filtered].sort((a, b) => a.rating - b.rating);

  const counts = [1, 2, 3, 4, 5].map(
    (v) => reviews.filter((r) => r.rating === v).length,
  );

  return (
    <div>
      <TopBar title="Отзывы обо мне" onBack={onBack} />
      <div style={{ padding: "6px 18px 100px" }}>
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 16,
            overflowX: "auto",
          }}
        >
          <Pill active={filter === "all"} onClick={() => setFilter("all")}>
            Все ({reviews.length})
          </Pill>
          {[1, 2, 3, 4, 5].map((v) => (
            <Pill key={v} active={filter === v} onClick={() => setFilter(v)}>
              {v}★ ({counts[v - 1]})
            </Pill>
          ))}
        </div>

        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#8C8C97",
            }}
          >
            Загрузка…
          </div>
        )}
        {!loading && sorted.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#8C8C97",
            }}
          >
            Пока нет отзывов
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((r) => (
            <div
              key={r.id}
              style={{
                padding: "14px",
                borderRadius: 16,
                background: "#141418",
                border: "1px solid #232329",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: r.comment ? 8 : 0,
                }}
              >
                <div
                  onClick={() => onOpenProfile(r.reviewer?.id)}
                  style={{ cursor: "pointer" }}
                >
                  <Avatar src={r.reviewer?.photo_url} size={38} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontWeight: 700, fontSize: 14, color: "#F5F5F7" }}
                  >
                    {r.reviewer?.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#8C8C97" }}>
                    {new Date(r.created_at).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <div
                  style={{ color: "#FFB454", fontSize: 14, fontWeight: 700 }}
                >
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </div>
              </div>
              {r.comment && (
                <div
                  style={{ fontSize: 13.5, color: "#B4B4BC", lineHeight: 1.5 }}
                >
                  {r.comment}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function AdminScreen({ onBack }) {
  const [tab, setTab] = useState("reports");
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [editingBirthId, setEditingBirthId] = useState(null);
  const [birthDraft, setBirthDraft] = useState("");
  const [birthError, setBirthError] = useState(null);
  const [savingBirth, setSavingBirth] = useState(false);

  async function handleSaveBirthDate(userId) {
    if (!birthDraft) return;
    setSavingBirth(true);
    setBirthError(null);
    try {
      await updateUserBirthDate(userId, birthDraft);
      setEditingBirthId(null);
      loadUsers();
    } catch (e) {
      setBirthError(e?.message || "Не получилось сохранить");
    } finally {
      setSavingBirth(false);
    }
  }

  function loadReports() {
    getReports()
      .then(setReports)
      .catch(() => {});
  }
  function loadUsers() {
    getAdminUsers()
      .then(setUsers)
      .catch(() => {});
  }
  function loadVerifications() {
    getPendingVerifications()
      .then(setVerifications)
      .catch(() => {});
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([getReports(), getAdminUsers(), getPendingVerifications()])
      .then(([r, u, v]) => {
        setReports(r);
        setUsers(u);
        setVerifications(v);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleReportStatus(reportId, status) {
    await updateReportStatus(reportId, status);
    loadReports();
  }

  async function handleBan(userId) {
    if (!window.confirm("Заблокировать пользователя?")) return;
    await banUser(userId);
    loadUsers();
  }

  async function handleUnban(userId) {
    await unbanUser(userId);
    loadUsers();
  }

  async function handleVerification(userId, approve) {
    await reviewVerification(userId, approve);
    loadVerifications();
  }

  return (
    <div>
      <TopBar title="Админ-панель" onBack={onBack} />
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "0 18px 14px",
          overflowX: "auto",
        }}
      >
        <Pill active={tab === "reports"} onClick={() => setTab("reports")}>
          Жалобы {reports.length > 0 ? `(${reports.length})` : ""}
        </Pill>
        <Pill active={tab === "users"} onClick={() => setTab("users")}>
          Пользователи
        </Pill>
        <Pill
          active={tab === "verifications"}
          onClick={() => setTab("verifications")}
        >
          Верификация{" "}
          {verifications.length > 0 ? `(${verifications.length})` : ""}
        </Pill>
      </div>

      <div style={{ padding: "0 18px 100px" }}>
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#8C8C97",
            }}
          >
            Загрузка…
          </div>
        )}

        {!loading && tab === "reports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reports.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#8C8C97",
                }}
              >
                Жалоб нет
              </div>
            )}
            {reports.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: "14px",
                  borderRadius: 16,
                  background: "#141418",
                  border: "1px solid #232329",
                }}
              >
                <div
                  style={{ fontSize: 12.5, color: "#8C8C97", marginBottom: 6 }}
                >
                  {r.reporter_name} (@{r.reporter_username}) →{" "}
                  {r.reported_user_name || "Поддержка"}
                </div>
                <div
                  style={{ fontSize: 14, color: "#F5F5F7", marginBottom: 8 }}
                >
                  {r.reason}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11.5,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background:
                        r.status === "open" ? "#FF5D7A22" : "#8C8C9722",
                      color: r.status === "open" ? "#FF5D7A" : "#8C8C97",
                      fontWeight: 700,
                    }}
                  >
                    {r.status}
                  </span>
                  {r.status === "open" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => handleReportStatus(r.id, "dismissed")}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: "#1D1D23",
                          border: "1px solid #232329",
                          color: "#8C8C97",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Отклонить
                      </button>
                      <button
                        onClick={() => handleReportStatus(r.id, "actioned")}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: "#C4FF3D",
                          border: "none",
                          color: "#0A0A0C",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Принять меры
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "users" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Поиск по имени или нику…"
              style={{
                padding: "11px 14px",
                borderRadius: 12,
                border: "1px solid #232329",
                background: "#141418",
                color: "#F5F5F7",
                fontSize: 14,
                outline: "none",
                marginBottom: 4,
              }}
            />
            {users
              .filter((u) => {
                const q = userSearch.trim().toLowerCase();
                if (!q) return true;
                return (
                  u.name?.toLowerCase().includes(q) ||
                  u.username?.toLowerCase().includes(q)
                );
              })
              .map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    background: "#141418",
                    border: "1px solid #232329",
                    borderRadius: 14,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#F5F5F7",
                      }}
                    >
                      {u.name}{" "}
                      {u.is_admin && (
                        <span style={{ color: "#C4FF3D" }}>· admin</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#8C8C97" }}>
                      @{u.username}
                    </div>
                    {editingBirthId === u.id ? (
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <input
                          type="date"
                          value={birthDraft}
                          onChange={(e) => setBirthDraft(e.target.value)}
                          style={{
                            padding: "6px 8px",
                            borderRadius: 8,
                            border: "1px solid #232329",
                            background: "#0A0A0C",
                            color: "#F5F5F7",
                            fontSize: 12.5,
                          }}
                        />
                        <button
                          disabled={savingBirth}
                          onClick={() => handleSaveBirthDate(u.id)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            background: "#C4FF3D",
                            border: "none",
                            color: "#0A0A0C",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ОК
                        </button>
                        <button
                          onClick={() => setEditingBirthId(null)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            background: "#1D1D23",
                            border: "1px solid #2A2A32",
                            color: "#8C8C97",
                            cursor: "pointer",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingBirthId(u.id);
                          setBirthDraft(u.date_of_birth);
                          setBirthError(null);
                        }}
                        style={{
                          fontSize: 11.5,
                          color: "#8B5CF6",
                          marginTop: 4,
                          cursor: "pointer",
                        }}
                      >
                        ДР: {u.date_of_birth} ✎
                      </div>
                    )}
                    {editingBirthId === u.id && birthError && (
                      <div
                        style={{ fontSize: 11, color: "#FF6B6B", marginTop: 4 }}
                      >
                        {birthError}
                      </div>
                    )}
                  </div>
                  {u.deactivated_at ? (
                    <button
                      onClick={() => handleUnban(u.id)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 10,
                        background: "#C4FF3D",
                        border: "none",
                        color: "#0A0A0C",
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Разбанить
                    </button>
                  ) : (
                    !u.is_admin && (
                      <button
                        onClick={() => handleBan(u.id)}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 10,
                          background: "#2A1418",
                          border: "1px solid #4A1F26",
                          color: "#FF5D7A",
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Забанить
                      </button>
                    )
                  )}
                </div>
              ))}
          </div>
        )}

        {!loading && tab === "verifications" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {verifications.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#8C8C97",
                }}
              >
                Нет заявок на верификацию
              </div>
            )}
            {verifications.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  background: "#141418",
                  border: "1px solid #232329",
                  borderRadius: 14,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontWeight: 700, fontSize: 14, color: "#F5F5F7" }}
                  >
                    {u.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#8C8C97" }}>
                    @{u.username}
                  </div>
                  {u.verification_contact && (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "#5DD8FF",
                        marginTop: 4,
                        wordBreak: "break-all",
                      }}
                    >
                      📱 {u.verification_contact}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleVerification(u.id, false)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 10,
                    background: "#1D1D23",
                    border: "1px solid #232329",
                    color: "#FF5D7A",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
                <button
                  onClick={() => handleVerification(u.id, true)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 10,
                    background: "#C4FF3D",
                    border: "none",
                    color: "#0A0A0C",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function VerificationScreen({ me, onBack }) {
  const [contact, setContact] = useState(me?.verification_contact || "");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(me?.verification_status === "pending");
  const [error, setError] = useState(null);

  async function handleSend() {
    const trimmed = contact.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    try {
      await requestVerification(trimmed);
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  if (me?.verification_status === "verified") {
    return (
      <div>
        <TopBar title="Верификация" onBack={onBack} />
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ color: "#F5F5F7", fontWeight: 700, fontSize: 16 }}>
            Личность подтверждена
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Верификация" onBack={onBack} />
      <div style={{ padding: "6px 18px 100px" }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div
              style={{
                color: "#F5F5F7",
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 6,
              }}
            >
              Заявка отправлена
            </div>
            <div style={{ color: "#8C8C97", fontSize: 13.5, lineHeight: 1.5 }}>
              С вами свяжутся по видеосвязи через указанный контакт для
              подтверждения личности
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                color: "#8C8C97",
                fontSize: 13.5,
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              Для подтверждения личности с вами свяжутся по видеосвязи через
              мессенджер. Оставьте ссылку или ник в Telegram, WhatsApp или MAX.
            </div>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="t.me/username или +7 999 000-00-00"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                borderRadius: 14,
                background: "#141418",
                border: "1px solid #232329",
                color: "#F5F5F7",
                fontSize: 14.5,
                outline: "none",
                marginBottom: 14,
              }}
            />
            {error && (
              <div style={{ color: "#FF5D7A", fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
            )}
            <button
              onClick={handleSend}
              disabled={!contact.trim() || sending}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                border: "none",
                cursor: contact.trim() ? "pointer" : "default",
                background: contact.trim()
                  ? "linear-gradient(135deg, #C4FF3D, #8B5CF6)"
                  : "#1D1D23",
                color: contact.trim() ? "#0A0A0C" : "#8C8C97",
                fontWeight: 700,
                fontSize: 15,
                opacity: sending ? 0.6 : 1,
              }}
            >
              {sending ? "Отправка…" : "Отправить на верификацию"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
function SettingsScreen({ me, setMe, onBack }) {
  const [saving, setSaving] = useState(false);
  const options = [
    { value: "everyone", label: "Все могут писать первыми" },
    { value: "shared_meetups", label: "Только участники общих встреч" },
    { value: "requests_only", label: "Только после заявки в друзья" },
    { value: "nobody", label: "Никто (отключить личные сообщения)" },
  ];

  async function handleChangePrivacy(value) {
    if (value === me.privacy_messaging || saving) return;
    setSaving(true);
    try {
      const updated = await updateMe({ privacy_messaging: value });
      setMe(updated);
    } catch (e) {
      alert("Не получилось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (
      !window.confirm(
        "Деактивировать аккаунт? Ты не сможешь войти, пока не обратишься в поддержку.",
      )
    )
      return;
    try {
      await deactivateMe();
      logout();
      window.dispatchEvent(new Event("auth:logout"));
    } catch (e) {
      alert("Не получилось деактивировать аккаунт");
    }
  }

  return (
    <div>
      <TopBar title="Настройки" onBack={onBack} />
      <div style={{ padding: "6px 18px 100px" }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: "#F5F5F7",
            marginBottom: 10,
          }}
        >
          Кто может писать мне первым
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 26,
          }}
        >
          {options.map((o) => (
            <div
              key={o.value}
              onClick={() => handleChangePrivacy(o.value)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "13px 14px",
                borderRadius: 14,
                background: "#141418",
                border:
                  me.privacy_messaging === o.value
                    ? "1px solid #C4FF3D"
                    : "1px solid #232329",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 14, color: "#F5F5F7" }}>{o.label}</span>
              {me.privacy_messaging === o.value && (
                <span style={{ color: "#C4FF3D", fontWeight: 700 }}>✓</span>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: "#F5F5F7",
            marginBottom: 10,
          }}
        >
          Уведомления
        </div>
        <div
          style={{
            padding: "14px",
            borderRadius: 14,
            background: "#141418",
            border: "1px solid #232329",
            color: "#8C8C97",
            fontSize: 13.5,
            lineHeight: 1.5,
            marginBottom: 26,
          }}
        >
          Push-уведомления появятся, когда приложение станет устанавливаемым
          (PWA) — сейчас в разработке. Пока все важные события (заявки,
          сообщения) видно прямо в приложении.
        </div>

        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: "#FF5D7A",
            marginBottom: 10,
          }}
        >
          Опасная зона
        </div>
        <div
          onClick={handleDeactivate}
          style={{
            padding: "14px",
            borderRadius: 14,
            background: "#2A1418",
            border: "1px solid #4A1F26",
            color: "#FF5D7A",
            fontWeight: 600,
            fontSize: 14,
            textAlign: "center",
            cursor: "pointer",
          }}
        >
          Деактивировать аккаунт
        </div>
      </div>
    </div>
  );
}
function ProfileScreen({
  me: meProp,
  onReviewMeetup,
  onOpenReviews,
  onOpenAdmin,
  onOpenSupport,
  onOpenVerification,
  onOpenSettings,
}) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernameError, setUsernameError] = useState(null);
  const [savingUsername, setSavingUsername] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState(null);
  const [savingName, setSavingName] = useState(false);

  async function handleSaveName() {
    const next = nameDraft.trim();
    if (!next || next === me.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    setNameError(null);
    try {
      const updated = await updateMe({ name: next });
      setMe(updated);
      setEditingName(false);
    } catch (e) {
      setNameError(e?.message || "Не получилось сменить имя");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSaveUsername() {
    const next = usernameDraft.trim();
    if (!next || next === me.username) {
      setEditingUsername(false);
      return;
    }
    setSavingUsername(true);
    setUsernameError(null);
    try {
      const updated = await updateMe({ username: next });
      setMe(updated);
      setEditingUsername(false);
    } catch (e) {
      if (e?.status === 409) {
        setUsernameError("Такой ник уже занят");
      } else if (e?.message) {
        setUsernameError(e.message);
      } else {
        setUsernameError("Не получилось сменить ник");
      }
    } finally {
      setSavingUsername(false);
    }
  }

  useEffect(() => {
    setMe(meProp);
    setLoading(false);
  }, [meProp]);

  useEffect(() => {
    getPendingReviewMeetups()
      .then(setPendingReviews)
      .catch(() => {});
  }, []);
  function handleLogout() {
    logout();
    window.dispatchEvent(new Event("auth:logout"));
  }

  if (loading) {
    return (
      <div>
        <TopBar title="Профиль" />
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#8C8C97",
          }}
        >
          Загрузка…
        </div>
      </div>
    );
  }

  if (error || !me) {
    return (
      <div>
        <TopBar title="Профиль" />
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#FF5D7A",
          }}
        >
          Не удалось загрузить профиль{error ? `: ${error}` : ""}
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Профиль" />
      <div style={{ padding: "6px 18px 100px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "10px 0 22px",
          }}
        >
          <AvatarUploader
            currentPhotoUrl={me.photo_url}
            size={84}
            ring="#8B5CF6"
            onAvatarChange={(updatedUser) => setMe(updatedUser)}
          />
          <div
            onClick={() => {
              setNameDraft(me.name);
              setNameError(null);
              setEditingName(true);
            }}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 20,
              color: "#F5F5F7",
              marginTop: 12,
              cursor: "pointer",
            }}
          >
            {me.name}
            {me.age ? `, ${me.age}` : ""}
          </div>

          {editingName && (
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 10,
                width: "100%",
              }}
            >
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Имя"
                style={{
                  flex: 1,
                  background: "#141418",
                  border: "1px solid #232329",
                  borderRadius: 10,
                  padding: "8px 12px",
                  color: "#F5F5F7",
                  fontSize: 13.5,
                  outline: "none",
                }}
              />
              <button
                disabled={savingName}
                onClick={handleSaveName}
                style={{
                  background: "#8B5CF6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                ОК
              </button>
              <button
                onClick={() => setEditingName(false)}
                style={{
                  background: "#1D1D23",
                  color: "#8C8C97",
                  border: "1px solid #2A2A32",
                  borderRadius: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          )}
          {nameError && (
            <div style={{ fontSize: 12, color: "#FF6B6B", marginTop: 6 }}>
              {nameError}
            </div>
          )}
          <div
            onClick={() => {
              setUsernameDraft(me.username);
              setUsernameError(null);
              setEditingUsername(true);
            }}
            style={{
              fontSize: 13.5,
              color: "#8B5CF6",
              marginTop: 2,
              cursor: "pointer",
            }}
          >
            @{me.username}
          </div>
          <div style={{ fontSize: 13, color: "#8C8C97", marginTop: 2 }}>
            {me.phone || me.email || ""}
          </div>
          {editingUsername && (
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 10,
                width: "100%",
              }}
            >
              <input
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(e.target.value)}
                placeholder="новый_ник"
                style={{
                  flex: 1,
                  background: "#141418",
                  border: "1px solid #232329",
                  borderRadius: 10,
                  padding: "8px 12px",
                  color: "#F5F5F7",
                  fontSize: 13.5,
                  outline: "none",
                }}
              />
              <button
                disabled={savingUsername}
                onClick={handleSaveUsername}
                style={{
                  background: "#8B5CF6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                ОК
              </button>
              <button
                onClick={() => setEditingUsername(false)}
                style={{
                  background: "#1D1D23",
                  color: "#8C8C97",
                  border: "1px solid #2A2A32",
                  borderRadius: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          )}
          {usernameError && (
            <div style={{ fontSize: 12, color: "#FF6B6B", marginTop: 6 }}>
              {usernameError}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div
            onClick={onOpenReviews}
            style={{
              flex: 1,
              background: "#141418",
              border: "1px solid #232329",
              borderRadius: 16,
              padding: "14px 10px",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <Star size={16} color="#FFB454" style={{ marginBottom: 6 }} />
            <div style={{ fontWeight: 700, fontSize: 17, color: "#F5F5F7" }}>
              {me.rating != null ? me.rating.toFixed(1) : "—"}
            </div>
            <div style={{ fontSize: 11.5, color: "#8C8C97" }}>Рейтинг</div>
          </div>
        </div>

        {pendingReviews.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#F5F5F7",
                marginBottom: 10,
              }}
            >
              Оцените участников
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pendingReviews.map((pm) => (
                <div
                  key={pm.id}
                  onClick={() => onReviewMeetup(pm.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "13px 14px",
                    background: "#141418",
                    border: "1px solid #C4FF3D55",
                    borderRadius: 14,
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#F5F5F7",
                      }}
                    >
                      {pm.title || "Встреча"}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#8C8C97", marginTop: 2 }}
                    >
                      {new Date(pm.start_time).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                  <span
                    style={{ color: "#C4FF3D", fontSize: 13, fontWeight: 700 }}
                  >
                    ⭐ Оценить
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {me.is_admin && (
          <div
            onClick={onOpenAdmin}
            style={{
              marginTop: 22,
              padding: "14px",
              borderRadius: 14,
              cursor: "pointer",
              background: "#141418",
              border: "1px solid #8B5CF655",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#8B5CF6", fontWeight: 700, fontSize: 14 }}>
              🛡 Админ-панель
            </span>
            <ChevronRight size={16} color="#8B5CF6" />
          </div>
        )}

        <div
          style={{
            marginTop: 22,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {["Верификация", "Настройки", "Поддержка"].map((item) => (
            <div
              key={item}
              onClick={() => {
                if (item === "Поддержка") onOpenSupport();
                if (item === "Верификация") onOpenVerification();
                if (item === "Настройки") onOpenSettings();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "15px 4px",
                borderBottom: "1px solid #1D1D23",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 14.5, color: "#F5F5F7" }}>{item}</span>
              <ChevronRight size={16} color="#8C8C97" />
            </div>
          ))}
        </div>

        <button
          onClick={handleLogout}
          style={{
            marginTop: 24,
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            cursor: "pointer",
            background: "#141418",
            border: "1px solid #232329",
            color: "#FF5D7A",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
/* ---------------------------------------------------------------
   BOTTOM NAV + APP SHELL
----------------------------------------------------------------*/

function BottomNav({ tab, setTab }) {
  const items = [
    { id: "feed", icon: Home, label: "Лента" },
    { id: "map", icon: MapIcon, label: "Карта" },
    { id: "create", icon: Plus, label: "", cta: true },
    { id: "chats", icon: MessageCircle, label: "Чаты" },
    { id: "profile", icon: User, label: "Профиль" },
  ];
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: 460,
        margin: "0 auto",
        padding: "10px 18px 22px",
        background: "linear-gradient(#0A0A0C00, #0A0A0C 40%)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 30,
      }}
    >
      {items.map((it) => {
        const Icon = it.icon;
        if (it.cta) {
          return (
            <button
              key={it.id}
              onClick={() => setTab("create")}
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #8B5CF6, #FF5D7A)",
                marginTop: -22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 22px #8B5CF655",
              }}
            >
              <Icon size={24} color="#fff" />
            </button>
          );
        }
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setTab(it.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: 6,
            }}
          >
            <Icon size={21} color={active ? "#C4FF3D" : "#6B6B76"} />
            <span
              style={{
                fontSize: 10.5,
                color: active ? "#C4FF3D" : "#6B6B76",
                fontWeight: 600,
              }}
            >
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthed());
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("feed");
  const [view, setView] = useState({ name: "feed" });
  const [presetPoint, setPresetPoint] = useState(null);

  useEffect(() => {
    return onAuthLogout(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (authed) {
      getMe()
        .then(setMe)
        .catch(() => {});
    }
  }, [authed]);

  if (!authed) {
    return <AuthScreen onSuccess={() => setAuthed(true)} />;
  }

  function openMeetup(m) {
    setView({ name: "detail", meetupId: m.id });
  }
  function openChat(chatId, chatTitle) {
    setView({ name: "chatDetail", chatId, chatTitle });
  }
  function backToTab(t) {
    setTab(t);
    setView({ name: t });
  }

  let body;
  if (view.name === "review") {
    body = (
      <ReviewScreen
        meetupId={view.meetupId}
        me={me}
        onBack={() => backToTab(tab)}
        onOpenProfile={(userId) => setView({ name: "publicProfile", userId })}
      />
    );
  } else if (view.name === "settings") {
    body = (
      <SettingsScreen me={me} setMe={setMe} onBack={() => backToTab(tab)} />
    );
  } else if (view.name === "support") {
    body = <SupportScreen onBack={() => backToTab(tab)} />;
  } else if (view.name === "verification") {
    body = <VerificationScreen me={me} onBack={() => backToTab(tab)} />;
  } else if (view.name === "admin") {
    body = <AdminScreen onBack={() => backToTab(tab)} />;
  } else if (view.name === "editMeetup") {
    body = (
      <EditMeetupScreen
        meetupId={view.meetupId}
        onClose={() => setView({ name: "detail", meetupId: view.meetupId })}
        onSaved={() => setView({ name: "detail", meetupId: view.meetupId })}
      />
    );
  } else if (view.name === "detail") {
    body = (
      <DetailScreen
        meetupId={view.meetupId}
        me={me}
        onBack={() => backToTab(tab)}
        onOpenChat={(chatId, chatTitle) => openChat(chatId, chatTitle)}
        onEdit={() => setView({ name: "editMeetup", meetupId: view.meetupId })}
        onReview={() => setView({ name: "review", meetupId: view.meetupId })}
        onOpenProfile={(userId) => setView({ name: "publicProfile", userId })}
      />
    );
  } else if (view.name === "chatDetail") {
    body = (
      <ChatDetailScreen
        chatId={view.chatId}
        chatTitle={view.chatTitle}
        me={me}
        onBack={() => backToTab(tab === "chatDetail" ? "chats" : tab)}
      />
    );
  } else if (view.name === "myReviews") {
    body = (
      <MyReviewsScreen
        userId={view.userId}
        onBack={() => backToTab(tab)}
        onOpenProfile={(userId) => setView({ name: "publicProfile", userId })}
      />
    );
  } else if (view.name === "userSearch") {
    body = (
      <UserSearchScreen
        onBack={() => backToTab(tab)}
        onOpenChat={openChat}
        onOpenProfile={(userId) => setView({ name: "publicProfile", userId })}
      />
    );
  } else if (view.name === "publicProfile") {
    body = (
      <PublicProfileScreen
        userId={view.userId}
        onBack={() => backToTab(tab)}
        onOpenChat={(chatId, chatTitle) => openChat(chatId, chatTitle)}
      />
    );
  } else if (tab === "feed") {
    body = <FeedScreen onOpenMeetup={openMeetup} />;
  } else if (tab === "map") {
    body = (
      <MapScreen
        onOpenMeetup={openMeetup}
        onStartCreateAt={(pt) => {
          setPresetPoint(pt);
          setTab("create");
          setView({ name: "create" });
        }}
      />
    );
  } else if (tab === "create") {
    if (me && !me.city_id) {
      body = (
        <CitySelect
          currentCityId={null}
          onSaved={(city) => setMe({ ...me, city_id: city.id })}
        />
      );
    } else {
      body = (
        <CreateScreen
          presetPoint={presetPoint}
          onClose={() => backToTab("feed")}
          onCreated={() => {
            setPresetPoint(null);
            backToTab("feed");
          }}
        />
      );
    }
  } else if (tab === "chats") {
    body = (
      <ChatsScreen
        onOpenChat={openChat}
        onOpenSearch={() => setView({ name: "userSearch" })}
      />
    );
  } else if (tab === "profile") {
    body = (
      <ProfileScreen
        me={me}
        onOpenSettings={() => setView({ name: "settings" })}
        onReviewMeetup={(meetupId) => setView({ name: "review", meetupId })}
        onOpenReviews={() => setView({ name: "myReviews", userId: me.id })}
        onOpenAdmin={() => setView({ name: "admin" })}
        onOpenVerification={() => setView({ name: "verification" })}
        onOpenSupport={() => setView({ name: "support" })}
      />
    );
  }

  const showNav = view.name !== "chatDetail" && view.name !== "detail";

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#0A0A0C",
        display: "flex",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        input::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.6; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          minHeight: "100vh",
          background: "#0A0A0C",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1 }}>{body}</div>
        {showNav && <BottomNav tab={tab} setTab={(t) => backToTab(t)} />}
      </div>
    </div>
  );
}
